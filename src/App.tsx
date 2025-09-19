import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateMiamiImage } from './services/geminiService';
import { saveGeneratedImage, createUserSession, getUserGallery, isFirebaseConfigured, updateImageGalleryStatus, deleteImage } from './services/firebaseService';
import { FraternityMember } from './services/googleSheetsService';
import PolaroidCard from './components/PolaroidCard';
import NameEntry from './components/NameEntry';
import HouGallery from './components/HouGallery';
import CardStackPreview from './components/CardStackPreview';
// import { createGalleryPage } from './lib/albumUtils'; // Removed - no longer using download functionality
// import Footer from './components/Footer'; // Removed - no longer using footer
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
    const [memberData, setMemberData] = useState<FraternityMember | null>(null);
    const [userSessionId, setUserSessionId] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [savedToGallery, setSavedToGallery] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const [isDownloading, setIsDownloading] = useState<boolean>(false); // Removed - no longer using download functionality
    const [appState, setAppState] = useState<AppState>('name-entry');
    const [firebaseEnabled, setFirebaseEnabled] = useState<boolean>(false);
    const [showGallery, setShowGallery] = useState<boolean>(false);
    const [frontCardIndex, setFrontCardIndex] = useState<number>(-1); // Track which card should be in front
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

    const handleMemberSubmit = async (member: FraternityMember) => {
        setMemberData(member);
        setUserName(member.firstName); // Use first name for display

        // Create Firebase session if enabled
        if (firebaseEnabled) {
            try {
                const session = await createUserSession(member.firstName);
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
            
            // Check if it's a network error and provide user-friendly message
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

    const handleRegenerateStyle = async (styleNameOrKey: string) => {
        if (!uploadedImage) return;

        // Convert style name to style key if needed
        let styleKey = styleNameOrKey;
        
        // If we received a style name (like "Drug Lord"), convert to style key (like "style1")
        if (!currentTheme.styles[styleNameOrKey]) {
            styleKey = Object.keys(currentTheme.styles).find(key => 
                currentTheme.styles[key].name === styleNameOrKey
            ) || styleNameOrKey;
        }

        // Prevent re-triggering if a generation is already in progress
        if (generatedImages[styleKey]?.status === 'pending') {
            return;
        }

        console.log(`Regenerating image for ${styleKey} (${styleNameOrKey})...`);

        // Verify the style config exists
        const styleConfig = currentTheme.styles[styleKey];
        if (!styleConfig) {
            console.error(`Style config not found for: ${styleKey}`);
            return;
        }

                    // Set the specific style to 'pending' to show the loading spinner
            setGeneratedImages(prev => ({
                ...prev,
                [styleKey]: { status: 'pending' },
            }));

            // Clear the gallery status for this style since it's a new image
            setSavedToGallery(prev => ({
                ...prev,
                [styleKey]: false
            }));

        // Call the generation service for the specific style
        try {
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
            
            // Check if it's a network error and provide user-friendly message
            let userMessage = errorMessage;
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('QUIC_PROTOCOL_ERROR')) {
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
        console.log('handleSaveToGallery called with:', styleName);
        console.log('Available styles:', Object.keys(currentTheme.styles));
        console.log('Style names:', Object.values(currentTheme.styles).map(s => s.name));
        
        // Find the styleKey from the style name
        const styleKey = Object.keys(currentTheme.styles).find(key => 
            currentTheme.styles[key].name === styleName
        );
        
        console.log('Found styleKey:', styleKey, 'for styleName:', styleName);
        
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
                    console.warn(`No Firebase image found for ${styleName} (${styleKey}). Attempting to create missing record...`);
                    
                    // Try to create the missing Firebase record
                    const generatedImage = generatedImages[styleKey];
                    if (generatedImage?.url) {
                        try {
                            const savedImage = await saveGeneratedImage(
                                userSessionId,
                                userName,
                                styleKey,
                                styleName,
                                uploadedImage || '', // Use uploaded image if available
                                generatedImage.url
                            );
                            
                            if (savedImage) {
                                console.log(`Successfully created missing Firebase record for ${styleName}`);
                                // Now update the gallery status
                                await updateImageGalleryStatus(userSessionId, styleKey, newStatus);
                            } else {
                                console.error(`Failed to create Firebase record for ${styleName}`);
                            }
                        } catch (createError) {
                            console.error(`Failed to create missing Firebase record for ${styleName}:`, createError);
                        }
                    } else {
                        console.error(`Cannot create Firebase record for ${styleName} - no generated image URL found`);
                    }
                }
            } catch (error) {
                console.error('Failed to update gallery status in Firebase:', error);
                console.warn('Continuing with local state only due to Firebase error');
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
        // Bring clicked card to front
        setFrontCardIndex(index);
    };

    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setSavedToGallery({});
        setFrontCardIndex(-1); // Reset front card selection
        setAppState('idle');
    };



    const handleDownloadIndividualImage = async (styleName: string) => {
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
            try {
                console.log('Downloading original image:', styleName);
                
                // Fetch the image as a blob to ensure proper download behavior
                const response = await fetch(image.url);
                const blob = await response.blob();
                
                // Create object URL from blob
                const blobUrl = URL.createObjectURL(blob);
                
                // Create download link with enhanced attributes to prevent navigation
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `miami-vice-${styleName.toLowerCase().replace(/\s+/g, '-')}-${userName}.jpg`;
                link.style.display = 'none';
                link.rel = 'noopener noreferrer'; // Security and prevent navigation
                link.target = '_self'; // Ensure same window behavior
                
                // Prevent default behavior and force download
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                // Add to DOM, trigger download, and immediately remove
                document.body.appendChild(link);
                link.dispatchEvent(clickEvent);
                
                // Use setTimeout to ensure download starts before cleanup
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                }, 100);
                
                console.log('Original image downloaded successfully:', styleName);
            } catch (error) {
                console.error('Failed to download image:', error);
                // Enhanced fallback method
                const link = document.createElement('a');
                link.href = image.url;
                link.download = `miami-vice-${styleName.toLowerCase().replace(/\s+/g, '-')}-${userName}.jpg`;
                link.rel = 'noopener noreferrer';
                link.target = '_blank'; // Use _blank with download attribute to force download
                link.style.display = 'none';
                
                document.body.appendChild(link);
                
                // Prevent navigation by stopping propagation
                const clickEvent = new MouseEvent('click', {
                    bubbles: false,
                    cancelable: true,
                    view: window
                });
                
                link.dispatchEvent(clickEvent);
                
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            }
        } else {
            console.error('Image not ready for download:', styleName, image);
        }
    };

    // Removed handleDownloadGallery function - no longer using download functionality
    /*
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
    */

    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden text-neutral-100">
            {/* Dark Miami 80s Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/80 via-transparent to-purple-900/60"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-indigo-950/40 to-slate-900"></div>
            
            {/* Neon Pink and Purple Streaks */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large diagonal pink streak */}
                <div className="absolute top-0 right-0 w-96 h-2 bg-gradient-to-r from-transparent via-pink-500/80 to-transparent transform rotate-45 origin-right shadow-lg shadow-pink-500/30 blur-sm"></div>
                <div className="absolute top-1 right-1 w-96 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform rotate-45 origin-right"></div>
                
                {/* Purple streak top left */}
                <div className="absolute top-20 left-0 w-80 h-1.5 bg-gradient-to-r from-transparent via-purple-400/70 to-transparent transform -rotate-12 shadow-lg shadow-purple-400/20 blur-sm"></div>
                <div className="absolute top-20.5 left-0.5 w-80 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent transform -rotate-12"></div>
                
                {/* Central pink diagonal */}
                <div className="absolute top-1/3 left-1/4 w-72 h-1 bg-gradient-to-r from-transparent via-pink-600/60 to-transparent transform rotate-30 shadow-lg shadow-pink-600/25 blur-sm"></div>
                <div className="absolute top-1/3 left-1/4 w-72 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform rotate-30"></div>
                
                {/* Bottom purple streak */}
                <div className="absolute bottom-32 left-0 w-64 h-1.5 bg-gradient-to-r from-transparent via-purple-500/70 to-transparent transform rotate-45 shadow-lg shadow-purple-500/30 blur-sm"></div>
                <div className="absolute bottom-32 left-0 w-64 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent transform rotate-45"></div>
                
                {/* Smaller accent streaks */}
                <div className="absolute top-1/2 right-20 w-48 h-1 bg-gradient-to-r from-transparent via-pink-400/50 to-transparent transform -rotate-20 blur-sm"></div>
                <div className="absolute bottom-1/4 right-1/3 w-40 h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent transform rotate-60"></div>
                <div className="absolute top-3/4 left-1/3 w-32 h-0.5 bg-gradient-to-r from-transparent via-pink-500/70 to-transparent transform -rotate-30"></div>
            </div>
            
            {/* Subtle dark grid overlay */}
            <div className="absolute inset-0 bg-grid-white/[0.01] opacity-50"></div>
            
            {/* Additional atmospheric glow */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
            
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
                <div className={`text-center mb-6 ${appState !== 'name-entry' ? 'mt-16 md:mt-0' : ''}`}>
                    <div className="flex justify-center mb-4">
                        <img 
                            src="/logo/miami_logo_2025.png" 
                            alt="Miami Vice 2025" 
                            className="h-24 md:h-32 lg:h-40 w-auto drop-shadow-[0_0_20px_rgba(196,181,253,0.6)]"
                            style={{filter: 'drop-shadow(0 0 10px rgba(196,181,253,0.8)) drop-shadow(0 0 20px rgba(196,181,253,0.6)) drop-shadow(0 0 30px rgba(196,181,253,0.4))'}}
                        />
                    </div>
                </div>

                {appState === 'name-entry' && (
                    <div className="flex flex-col items-center space-y-4">
                        {/* Card Stack Preview as Teaser */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="mb-4"
                        >
                            <CardStackPreview />
                        </motion.div>
                        
                        <div className="text-center mb-4">
                            <p className="font-permanent-marker text-neutral-200 text-2xl tracking-wide">Miami Hou' 2025</p>
                            <p className="font-permanent-marker text-neutral-300 mt-1 text-base tracking-wide">{currentTheme.subtitle}</p>
                        </div>
                        
                        <NameEntry onSubmit={handleMemberSubmit} />
                    </div>
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
                                Click the polaroid to upload your photo and create your Miami vibe.
                            </p>
                            <p className="mt-4 text-sm text-neutral-200">
                                Welcome, {userName}!
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
                                    const isInFront = frontCardIndex === index;
                                    return (
                                        <motion.div
                                            key={styleKey}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ 
                                                top, 
                                                left,
                                                zIndex: isInFront ? 100 : (index === 0 ? 80 : index === 2 ? 60 : 20 + (index * 5)), // Special z-index for Drug Lord (index 0) and Cocaine Cowboy (index 2)
                                                // Add padding around card for easier clicking - extra for Drug Lord
                                                padding: index === 0 ? '30px' : '20px'
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
                                                console.log(`Card ${index} (${styleConfig.name}) clicked, bringing to front. Current z-index: ${isInFront ? 100 : (index === 0 ? 80 : index === 2 ? 60 : 20 + (index * 5))}`);
                                                handleCardClick(index);
                                            }}
                                            onMouseDown={(e) => {
                                                // Ensure this card comes to front on any interaction
                                                e.stopPropagation();
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
                                            Click on ❤️ heart icon to add to Hou' Gallery
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
            
            {/* Hou' Gallery Modal */}
            {showGallery && (
                <HouGallery onClose={handleCloseGallery} memberData={memberData} />
            )}
        </main>
    );
}

export default App;
