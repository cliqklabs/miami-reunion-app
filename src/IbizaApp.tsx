import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateMiamiImage } from './services/geminiService';
import { saveGeneratedImage, createUserSession, getUserGallery, isFirebaseConfigured, updateImageGalleryStatus } from './services/ibizaFirebaseService';
import PolaroidCard from './components/PolaroidCard';
import NameEntry from './components/NameEntry';
import GenderSelection from './components/GenderSelection';
import IbizaGallery from './components/IbizaGallery';
import IbizaCardStackPreview from './components/IbizaCardStackPreview';
import { getTheme } from './config/themes';

// Get Ibiza theme
const IBIZA_THEME = getTheme('ibiza');

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
    { top: '65%', left: '70%', rotate: -15 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

type AppState = 'name-entry' | 'gender-selection' | 'idle' | 'image-uploaded' | 'generating' | 'results-shown';

// Ibiza-themed button styles
const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-amber-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-amber-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function IbizaApp() {
    const [userName, setUserName] = useState<string>('');
    const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
    const [userSessionId, setUserSessionId] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [savedToGallery, setSavedToGallery] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [appState, setAppState] = useState<AppState>('name-entry');
    const [firebaseEnabled, setFirebaseEnabled] = useState<boolean>(false);
    const [showGallery, setShowGallery] = useState<boolean>(false);
    const [frontCardIndex, setFrontCardIndex] = useState<number>(-1);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Get gender-specific styles
    const getGenderStyles = () => {
        if (!userGender) return [];
        const prefix = userGender === 'male' ? 'm' : 'f';
        return Object.keys(IBIZA_THEME.styles).filter(key => key.startsWith(prefix));
    };

    const CURRENT_STYLES_KEYS = getGenderStyles();

    // Check Firebase configuration on mount
    useEffect(() => {
        const checkFirebase = async () => {
            const configured = isFirebaseConfigured();
            setFirebaseEnabled(configured);
            console.log('Ibiza Firebase enabled:', configured);
        };
        checkFirebase();
    }, []);

    const handleNameSubmit = async (name: string) => {
        setUserName(name);
        setAppState('gender-selection');
    };

    const handleGenderSelect = async (gender: 'male' | 'female') => {
        setUserGender(gender);

        // Create Firebase session if enabled
        if (firebaseEnabled) {
            try {
                const session = await createUserSession(userName, gender);
                if (session) {
                    setUserSessionId(session.id);
                    console.log('Ibiza user session created:', session.id);
                }
            } catch (error) {
                console.error('Failed to create Ibiza user session:', error);
            }
        }

        setAppState('idle');
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                console.log('Image uploaded, data URL length:', result?.length);
                setUploadedImage(result);
                setAppState('image-uploaded');
                setGeneratedImages({});
                setSavedToGallery({});
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected');
        }
        
        e.target.value = '';
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage || !userGender) return;

        setIsLoading(true);
        setAppState('generating');

        const initialImages: Record<string, GeneratedImage> = {};
        CURRENT_STYLES_KEYS.forEach(styleKey => {
            initialImages[styleKey] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2;
        const stylesQueue = [...CURRENT_STYLES_KEYS];

        const processStyle = async (styleKey: string) => {
            try {
                const styleConfig = IBIZA_THEME.styles[styleKey];
                const prompt = styleConfig.prompt;
                const requestId = `ibiza-initial-${userSessionId}-${styleKey}-${Date.now()}`;
                const resultUrl = await generateMiamiImage(uploadedImage, prompt, requestId);

                // Save to Firebase if enabled
                if (firebaseEnabled && userSessionId && userGender) {
                    try {
                        await saveGeneratedImage(
                            userSessionId,
                            userName,
                            styleKey,
                            styleConfig.name,
                            uploadedImage,
                            resultUrl,
                            userGender
                        );
                    } catch (saveError) {
                        console.error(`Failed to save image for ${styleKey} to Firebase:`, saveError);
                    }
                }

                setGeneratedImages(prev => ({
                    ...prev,
                    [styleKey]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                
                let userMessage = errorMessage;
                if (errorMessage.includes('Failed to fetch') || errorMessage.includes('QUIC_PROTOCOL_ERROR')) {
                    userMessage = "Network connection issue. Please check your internet and try again.";
                }
                
                setGeneratedImages(prev => ({
                    ...prev,
                    [styleKey]: { status: 'error', error: userMessage },
                }));
                console.error(`Failed to generate image for ${styleKey}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (stylesQueue.length > 0) {
                const styleKey = stylesQueue.shift();
                if (styleKey) {
                    await processStyle(styleKey);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const [lastRegenerateTime, setLastRegenerateTime] = useState<Record<string, number>>({});
    const REGENERATE_COOLDOWN = 3000; // 3 seconds cooldown between regenerations

    const handleRegenerateStyle = async (styleNameOrKey: string) => {
        if (!uploadedImage || !userGender) return;

        let styleKey = styleNameOrKey;
        
        if (!IBIZA_THEME.styles[styleNameOrKey]) {
            styleKey = Object.keys(IBIZA_THEME.styles).find(key => 
                IBIZA_THEME.styles[key].name === styleNameOrKey
            ) || styleNameOrKey;
        }

        if (generatedImages[styleKey]?.status === 'pending') {
            return;
        }

        // Check cooldown
        const now = Date.now();
        const lastTime = lastRegenerateTime[styleKey] || 0;
        if (now - lastTime < REGENERATE_COOLDOWN) {
            const remaining = Math.ceil((REGENERATE_COOLDOWN - (now - lastTime)) / 1000);
            console.log(`Please wait ${remaining} more seconds before regenerating ${styleKey}`);
            return;
        }

        console.log(`Regenerating image for ${styleKey} (${styleNameOrKey})...`);

        const styleConfig = IBIZA_THEME.styles[styleKey];
        if (!styleConfig) {
            console.error(`Style config not found for: ${styleKey}`);
            return;
        }

        // Update last regenerate time
        setLastRegenerateTime(prev => ({
            ...prev,
            [styleKey]: now
        }));

        setGeneratedImages(prev => ({
            ...prev,
            [styleKey]: { status: 'pending' },
        }));

        setSavedToGallery(prev => ({
            ...prev,
            [styleKey]: false
        }));

        try {
            const prompt = styleConfig.prompt;
            const requestId = `ibiza-${userSessionId}-${styleKey}-${now}`;
            const resultUrl = await generateMiamiImage(uploadedImage, prompt, requestId);

            setGeneratedImages(prev => ({
                ...prev,
                [styleKey]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            
            let userMessage = errorMessage;
            if (errorMessage.includes('Request already in progress')) {
                userMessage = "Please wait - this image is already being generated.";
            } else if (errorMessage.includes('Content policy violation')) {
                userMessage = "This style is temporarily unavailable. Please try a different style.";
            } else if (errorMessage.includes('Generation failed: This style may be temporarily unavailable')) {
                userMessage = "This style is temporarily unavailable. Please try again later.";
            } else if (errorMessage.includes('Image generation temporarily unavailable')) {
                userMessage = "Service temporarily unavailable. Please try again in a moment.";
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('QUIC_PROTOCOL_ERROR')) {
                userMessage = "Network connection issue. Please check your internet and try again.";
            }
            
            setGeneratedImages(prev => ({
                ...prev,
                [styleKey]: { status: 'error', error: userMessage },
            }));
            console.error(`Failed to regenerate image for ${styleKey}:`, err);
        }
    };

    const handleSaveToGallery = async (styleName: string) => {
        const styleKey = Object.keys(IBIZA_THEME.styles).find(key => 
            IBIZA_THEME.styles[key].name === styleName
        );
        
        if (!styleKey) {
            console.error('Could not find style key for:', styleName);
            return;
        }

        const isCurrentlySaved = savedToGallery[styleKey];
        const newStatus = !isCurrentlySaved;

        console.log(`${isCurrentlySaved ? 'Removing' : 'Saving'} ${styleName} (${styleKey}) to gallery`);
        
        setSavedToGallery(prev => ({
            ...prev,
            [styleKey]: newStatus
        }));
        
        if (firebaseEnabled && userSessionId) {
            try {
                const success = await updateImageGalleryStatus(userSessionId, styleKey, newStatus);
                if (!success) {
                    console.error('Failed to update gallery status in Firebase');
                    setSavedToGallery(prev => ({
                        ...prev,
                        [styleKey]: isCurrentlySaved
                    }));
                }
            } catch (error) {
                console.error('Failed to update gallery status in Firebase:', error);
                setSavedToGallery(prev => ({
                    ...prev,
                    [styleKey]: isCurrentlySaved
                }));
            }
        }
    };

    const handleViewGallery = () => {
        setShowGallery(true);
    };

    const handleCloseGallery = () => {
        setShowGallery(false);
    };

    const handleCardClick = (index: number) => {
        setFrontCardIndex(index);
    };

    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setSavedToGallery({});
        setFrontCardIndex(-1);
        setAppState('idle');
    };

    const handleDownloadIndividualImage = async (styleName: string) => {
        const styleKey = Object.keys(IBIZA_THEME.styles).find(key => 
            IBIZA_THEME.styles[key].name === styleName
        );
        
        if (!styleKey) {
            console.error('Could not find style key for:', styleName);
            return;
        }

        const image = generatedImages[styleKey];
        if (image?.status === 'done' && image.url) {
            try {
                console.log('Downloading original image:', styleName);
                
                const response = await fetch(image.url);
                const blob = await response.blob();
                
                const blobUrl = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `ibiza-mockery-${styleName.toLowerCase().replace(/\s+/g, '-')}-${userName}.jpg`;
                link.style.display = 'none';
                link.rel = 'noopener noreferrer';
                link.target = '_self';
                
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                document.body.appendChild(link);
                link.dispatchEvent(clickEvent);
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                }, 100);
                
                console.log('Original image downloaded successfully:', styleName);
            } catch (error) {
                console.error('Failed to download image:', error);
            }
        } else {
            console.error('Image not ready for download:', styleName, image);
        }
    };

    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden text-neutral-100">
            {/* Ibiza-themed gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/80 via-transparent to-rose-900/60"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-indigo-950/40 to-purple-900"></div>
            
            {/* Ibiza-themed neon streaks */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-2 bg-gradient-to-r from-transparent via-rose-500/80 to-transparent transform rotate-45 origin-right shadow-lg shadow-rose-500/30 blur-sm"></div>
                <div className="absolute top-1 right-1 w-96 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent transform rotate-45 origin-right"></div>
                
                <div className="absolute top-20 left-0 w-80 h-1.5 bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent transform -rotate-12 shadow-lg shadow-indigo-400/20 blur-sm"></div>
                <div className="absolute top-20.5 left-0.5 w-80 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent transform -rotate-12"></div>
                
                <div className="absolute top-1/3 left-1/4 w-72 h-1 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent transform rotate-30 shadow-lg shadow-amber-600/25 blur-sm"></div>
                <div className="absolute top-1/3 left-1/4 w-72 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent transform rotate-30"></div>
                
                <div className="absolute bottom-32 left-0 w-64 h-1.5 bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent transform rotate-45 shadow-lg shadow-indigo-500/30 blur-sm"></div>
                <div className="absolute bottom-32 left-0 w-64 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent transform rotate-45"></div>
            </div>
            
            <div className="absolute inset-0 bg-grid-white/[0.01] opacity-50"></div>
            <div className="absolute inset-0 bg-gradient-radial from-indigo-900/20 via-transparent to-transparent"></div>
            
            {/* View Gallery Button - Top Right */}
            {appState !== 'name-entry' && appState !== 'gender-selection' && (
                <button
                    onClick={handleViewGallery}
                    className="fixed top-4 right-4 z-30 font-permanent-marker text-sm bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2 px-4 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/25 active:scale-95"
                >
                    View Ibiza Gallery
                </button>
            )}

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className={`text-center mb-6 ${appState !== 'name-entry' && appState !== 'gender-selection' ? 'mt-16 md:mt-0' : ''}`}>
                    <div className="flex justify-center mb-4">
                        <div className="text-center">
                            <h1 className="font-permanent-marker text-6xl md:text-7xl lg:text-8xl text-transparent bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-400 bg-clip-text drop-shadow-lg">
                                IBIZA
                            </h1>
                            <h2 className="font-permanent-marker text-2xl md:text-3xl text-transparent bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text -mt-2">
                                MOCKERY 2025
                            </h2>
                        </div>
                    </div>
                </div>

                {appState === 'name-entry' && (
                    <div className="flex flex-col items-center space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="mb-4"
                        >
                            <IbizaCardStackPreview />
                        </motion.div>
                        
                        <div className="text-center mb-4">
                            <p className="font-permanent-marker text-neutral-200 text-2xl tracking-wide">Create Your Ibiza Profile</p>
                            <p className="font-permanent-marker text-neutral-300 mt-1 text-base tracking-wide">{IBIZA_THEME.subtitle}</p>
                        </div>
                        
                        <NameEntry onSubmit={handleNameSubmit} theme="ibiza" />
                    </div>
                )}

                {appState === 'gender-selection' && (
                    <GenderSelection onSelect={handleGenderSelect} userName={userName} />
                )}

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                                initial={config.initial}
                                animate={{
                                    x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    ...config.transition,
                                    ease: "circOut",
                                    duration: 2,
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <div className="bg-neutral-100 dark:bg-neutral-100 p-3 pb-12 flex flex-col items-center justify-start aspect-[3/4] w-64 max-w-full rounded-md shadow-lg relative">
                                     <div className="w-full bg-neutral-900 shadow-inner aspect-[4/5] relative overflow-hidden group">
                                         <div className="flex flex-col items-center justify-center h-full text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                             </svg>
                                             <span className="font-permanent-marker text-xl">Upload Photo</span>
                                         </div>
                                     </div>
                                     <div className="absolute bottom-3 left-3 right-3 text-center px-2">
                                         <p className="font-permanent-marker text-lg truncate text-black">
                                             Click to begin
                                         </p>
                                     </div>
                                 </div>
                            </label>
                            <input 
                                key={uploadedImage ? 'uploaded' : 'empty'} 
                                id="file-upload" 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp" 
                                onChange={handleImageUpload} 
                            />
                            <p className="mt-8 font-permanent-marker text-neutral-300 text-center max-w-xs text-lg">
                                Upload your photo and create your Ibiza stereotype, {userName}!
                            </p>
                            <p className="mt-2 text-sm text-neutral-200">
                                Gender: {userGender === 'male' ? '🕺 Male' : '👸 Female'}
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-6">
                         <div className="bg-neutral-100 dark:bg-neutral-100 p-3 pb-12 flex flex-col items-center justify-start aspect-[3/4] w-64 max-w-full rounded-md shadow-lg relative">
                             <div className="w-full bg-neutral-900 shadow-inner aspect-[4/5] relative overflow-hidden">
                                 <img
                                     src={uploadedImage}
                                     alt="Your Photo"
                                     className="w-full h-full object-contain object-center"
                                 />
                             </div>
                             <div className="absolute bottom-3 left-3 right-3 text-center px-2">
                                 <p className="font-permanent-marker text-lg truncate text-black">
                                     Your Photo
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate Ibiza Styles
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {CURRENT_STYLES_KEYS.map((styleKey) => {
                                    const styleConfig = IBIZA_THEME.styles[styleKey];
                                    return (
                                        <div key={styleKey} className="flex justify-center">
                                             <PolaroidCard
                                                caption={styleConfig.name}
                                                status={generatedImages[styleKey]?.status || 'pending'}
                                                imageUrl={generatedImages[styleKey]?.url}
                                                error={generatedImages[styleKey]?.error}
                                                onShake={handleRegenerateStyle}
                                                onDownload={handleDownloadIndividualImage}
                                                onSaveToGallery={handleSaveToGallery}
                                                isSavedToGallery={savedToGallery[styleKey]}
                                                isMobile={isMobile}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[600px] mt-4">
                                {CURRENT_STYLES_KEYS.map((styleKey, index) => {
                                    const styleConfig = IBIZA_THEME.styles[styleKey];
                                    const { top, left, rotate } = POSITIONS[index] || { top: '20%', left: '20%', rotate: 0 };
                                    const isInFront = frontCardIndex === index;
                                    return (
                                        <motion.div
                                            key={styleKey}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ 
                                                top, 
                                                left,
                                                zIndex: isInFront ? 100 : (20 + (index * 5)),
                                                padding: '20px'
                                            }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log(`Card ${index} (${styleConfig.name}) clicked, bringing to front.`);
                                                handleCardClick(index);
                                            }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={styleConfig.name}
                                                status={generatedImages[styleKey]?.status || 'pending'}
                                                imageUrl={generatedImages[styleKey]?.url}
                                                error={generatedImages[styleKey]?.error}
                                                onShake={handleRegenerateStyle}
                                                onDownload={handleDownloadIndividualImage}
                                                onSaveToGallery={handleSaveToGallery}
                                                isSavedToGallery={savedToGallery[styleKey]}
                                                isMobile={isMobile}
                                                isInFront={isInFront}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="mt-4 flex flex-col items-center justify-center">
                            {appState === 'results-shown' && (
                                <>
                                    <div className="text-center mb-4">
                                        <p className="font-permanent-marker text-neutral-300 text-sm">
                                            Click on ❤️ heart icon to add to Ibiza Gallery
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        {firebaseEnabled && (
                                            <button 
                                                onClick={() => setShowGallery(true)}
                                                className={secondaryButtonClasses}
                                            >
                                                View Gallery
                                            </button>
                                        )}
                                        <button onClick={handleReset} className={secondaryButtonClasses}>
                                            Start Over
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Gallery Modal */}
            {showGallery && (
                <IbizaGallery onClose={handleCloseGallery} />
            )}
        </main>
    );
}

export default IbizaApp;
