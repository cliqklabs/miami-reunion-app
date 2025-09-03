import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateMiamiImage } from './services/geminiService';
import { saveGeneratedImage, createUserSession, getUserGallery, isFirebaseConfigured, updateImageGalleryStatus } from './services/firebaseService';
import PolaroidCard from './components/PolaroidCard';
import NameEntry from './components/NameEntry';
import HouGallery from './components/HouGallery';
import { createGalleryPage } from './lib/albumUtils';
import Footer from './components/Footer';
import { STYLES } from './config/styles';
import { getCurrentTheme } from './config/themes';

const MIAMI_STYLES_KEYS = Object.keys(STYLES);

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
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

type AppState = 'name-entry' | 'idle' | 'image-uploaded' | 'generating' | 'results-shown';

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-orange-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-orange-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
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

function App() {
    const [userName, setUserName] = useState<string>('');
    const [userSessionId, setUserSessionId] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [savedToGallery, setSavedToGallery] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<AppState>('name-entry');
    const [firebaseEnabled, setFirebaseEnabled] = useState<boolean>(false);
    const [showGallery, setShowGallery] = useState<boolean>(false);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const currentTheme = getCurrentTheme();

    // Check Firebase configuration on mount
    useEffect(() => {
        const checkFirebase = async () => {
            const configured = isFirebaseConfigured();
            setFirebaseEnabled(configured);
            console.log('Firebase enabled:', configured);
        };
        checkFirebase();
    }, []);

    const handleNameSubmit = async (name: string) => {
        setUserName(name);

        // Create Firebase session if enabled
        if (firebaseEnabled) {
            try {
                const session = await createUserSession(name);
                if (session) {
                    setUserSessionId(session.id);
                    console.log('User session created:', session.id);
                }
            } catch (error) {
                console.error('Failed to create user session:', error);
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
                setGeneratedImages({}); // Clear previous results
                setSavedToGallery({}); // Clear saved states
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected');
        }
        
        // Reset the input value to ensure onChange fires even for the same file
        e.target.value = '';
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        setIsLoading(true);
        setAppState('generating');

        const initialImages: Record<string, GeneratedImage> = {};
        MIAMI_STYLES_KEYS.forEach(styleKey => {
            initialImages[styleKey] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Process two styles at a time
        const stylesQueue = [...MIAMI_STYLES_KEYS];

        const processStyle = async (styleKey: string) => {
            try {
                const styleConfig = currentTheme.styles[styleKey];
                const prompt = styleConfig.prompt;
                const resultUrl = await generateMiamiImage(uploadedImage, prompt);

                // Save to Firebase if enabled
                if (firebaseEnabled && userSessionId) {
                    try {
                        await saveGeneratedImage(
                            userSessionId,
                            userName,
                            styleKey,
                            styleConfig.name,
                            uploadedImage,
                            resultUrl
                        );
                    } catch (saveError) {
                        console.error(`Failed to save image for ${styleKey} to Firebase:`, saveError);
                        // Don't fail the generation if saving fails
                    }
                }

                setGeneratedImages(prev => ({
                    ...prev,
                    [styleKey]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [styleKey]: { status: 'error', error: errorMessage },
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

    const handleRegenerateStyle = async (styleKey: string) => {
        if (!uploadedImage) return;

        // Prevent re-triggering if a generation is already in progress
        if (generatedImages[styleKey]?.status === 'pending') {
            return;
        }

        console.log(`Regenerating image for ${styleKey}...`);

        // Set the specific style to 'pending' to show the loading spinner
        setGeneratedImages(prev => ({
            ...prev,
            [styleKey]: { status: 'pending' },
        }));

        // Call the generation service for the specific style
        try {
            const styleConfig = currentTheme.styles[styleKey];
            const prompt = styleConfig.prompt;
            const resultUrl = await generateMiamiImage(uploadedImage, prompt);

            // Save to Firebase if enabled
            // if (firebaseEnabled && userSessionId) {
            //     try {
            //         await saveGeneratedImage(
            //             userSessionId,
            //             userName,
            //             styleKey,
            //             styleConfig.name,
            //             uploadedImage,
            //             resultUrl
            //         );
            //     } catch (saveError) {
            //         console.error(`Failed to save regenerated image for ${styleKey} to Firebase:`, saveError);
            //     }
            // }

            setGeneratedImages(prev => ({
                ...prev,
                [styleKey]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [styleKey]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${styleKey}:`, err);
        }
    };

    const handleSaveToGallery = async (styleName: string) => {
        // Find the styleKey from the style name
        const styleKey = Object.keys(currentTheme.styles).find(key => 
            currentTheme.styles[key].name === styleName
        );
        
        if (!styleKey) {
            console.error('Could not find style key for:', styleName);
            return;
        }

        const isCurrentlySaved = savedToGallery[styleKey];
        const newStatus = !isCurrentlySaved;

        console.log(`${isCurrentlySaved ? 'Removing' : 'Saving'} ${styleName} (${styleKey}) to gallery`);
        
        // Update local state immediately for responsive UI
        setSavedToGallery(prev => ({
            ...prev,
            [styleKey]: newStatus
        }));
        
        // Save to Firebase if enabled
        if (firebaseEnabled && userSessionId) {
            try {
                const success = await updateImageGalleryStatus(userSessionId, styleKey, newStatus);
                if (!success) {
                    console.error('Failed to update gallery status in Firebase');
                    // Revert local state if Firebase save fails
                    setSavedToGallery(prev => ({
                        ...prev,
                        [styleKey]: isCurrentlySaved
                    }));
                }
            } catch (error) {
                console.error('Failed to update gallery status in Firebase:', error);
                // Revert local state if Firebase save fails
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

    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setSavedToGallery({});
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (styleName: string) => {
        // Find the styleKey from the style name
        const styleKey = Object.keys(currentTheme.styles).find(key => 
            currentTheme.styles[key].name === styleName
        );
        
        if (!styleKey) {
            console.error('Could not find style key for:', styleName);
            return;
        }

        const image = generatedImages[styleKey];
        if (image?.status === 'done' && image.url) {
            console.log('Downloading individual image:', styleName, image.url);
            
            // Create download link
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `casa-cardinal-${styleName.toLowerCase()}-${userName}.jpg`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('Image not ready for download:', styleName, image);
        }
    };

    const handleDownloadGallery = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [styleKey, image]) => {
                    const styleConfig = currentTheme.styles[styleKey];
                    acc[styleConfig.name] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < MIAMI_STYLES_KEYS.length) {
                alert("Please wait for all images to finish generating before downloading the gallery.");
                return;
            }

            const galleryDataUrl = await createGalleryPage(imageData);

            const link = document.createElement('a');
            link.href = galleryDataUrl;
            link.download = `miami-gallery-${userName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download gallery:", error);
            alert("Sorry, there was an error creating your gallery. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900 text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            {/* View Hou' Gallery Button - Top Right */}
            {appState !== 'name-entry' && (
                <button
                    onClick={handleViewGallery}
                    className="fixed top-4 right-4 z-30 font-permanent-marker text-sm bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 px-4 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 active:scale-95"
                >
                    View Hou' Gallery
                </button>
            )}

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className={`text-center mb-10 ${appState !== 'name-entry' ? 'mt-16 md:mt-0' : ''}`}>
                    <h1 className="text-5xl md:text-7xl font-caveat font-bold text-neutral-100">Casa Cardinal</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-lg tracking-wide">Miami Hou' 2025</p>
                    <p className="font-permanent-marker text-neutral-400 mt-1 text-base tracking-wide">{currentTheme.subtitle}</p>
                </div>

                {appState === 'name-entry' && (
                    <NameEntry onSubmit={handleNameSubmit} />
                )}

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost polaroids for intro animation */}
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
                                 <PolaroidCard
                                     caption="Click to begin"
                                     status="done"
                                 />
                            </label>
                            <input 
                                key={uploadedImage ? 'uploaded' : 'empty'} 
                                id="file-upload" 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp" 
                                onChange={handleImageUpload} 
                            />
                            <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                                Click the polaroid to upload your photo and create your Miami vibe.
                            </p>
                            <p className="mt-4 text-sm text-neutral-400">
                                Welcome, {userName}!
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-6">
                         <PolaroidCard
                            imageUrl={uploadedImage}
                            caption="Your Photo"
                            status="done"
                         />
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate Miami Styles
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {MIAMI_STYLES_KEYS.map((styleKey) => {
                                    const styleConfig = currentTheme.styles[styleKey];
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
                            <div ref={dragAreaRef} className="relative w-full max-w-4xl h-[600px] mt-4">
                                {MIAMI_STYLES_KEYS.map((styleKey, index) => {
                                    const styleConfig = currentTheme.styles[styleKey];
                                    const { top, left, rotate } = POSITIONS[index] || { top: '20%', left: '20%', rotate: 0 };
                                    return (
                                        <motion.div
                                            key={styleKey}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
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
                                        <p className="font-permanent-marker text-neutral-400 text-sm">
                                            Click on ❤️ heart icon to add to Hou' Gallery
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <button
                                            onClick={handleDownloadGallery}
                                            disabled={isDownloading}
                                            className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isDownloading ? 'Creating...' : 'Download'}
                                        </button>
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
            <Footer />
            
            {/* Hou' Gallery Modal */}
            {showGallery && (
                <HouGallery onClose={handleCloseGallery} />
            )}
        </main>
    );
}

export default App;
