import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/firebaseService';
import { FraternityMember } from '../services/googleSheetsService';
import EmojiReactions from './EmojiReactions';

interface HouGalleryProps {
    onClose: () => void;
    memberData: FraternityMember | null;
}

const HouGallery: React.FC<HouGalleryProps> = ({ onClose, memberData }) => {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
    const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
    const [swipeOffset, setSwipeOffset] = useState<number>(0);

    useEffect(() => {
        const loadGalleryImages = async () => {
            try {
                setLoading(true);
                const galleryImages = await getAllGalleryImages();
                setImages(galleryImages);
                setError(null);
            } catch (err) {
                setError('Failed to load gallery images');
                console.error('Gallery loading error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadGalleryImages();
    }, []);

    // Navigation functions
    const openImageViewer = (index: number) => {
        console.log('Opening image viewer for index:', index); // Debug log
        setSelectedImageIndex(index);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    };

    const closeImageViewer = () => {
        setSelectedImageIndex(null);
        // Restore body scroll when modal closes
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
        document.body.style.height = 'unset';
    };

    const goToPrevious = () => {
        if (selectedImageIndex !== null && selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
        }
    };

    const goToNext = () => {
        if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (selectedImageIndex === null) return;
            
            switch (event.key) {
                case 'Escape':
                    closeImageViewer();
                    break;
                case 'ArrowLeft':
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, images.length]);

    // Cleanup: restore scroll when component unmounts
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.position = 'unset';
            document.body.style.width = 'unset';
            document.body.style.height = 'unset';
        };
    }, []);

    // Download function for gallery images
    const handleDownloadImage = async (image: GeneratedImage) => {
        try {
            console.log('Downloading original image from gallery:', image.styleName);
            
            // Direct download without fetching blob to avoid CORS issues
            const link = document.createElement('a');
            link.href = image.generatedImageUrl;
            link.download = `miami-vice-${image.styleName.toLowerCase().replace(/\s+/g, '-')}-${image.userName}.jpg`;
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
            }, 100);
            
            console.log('Gallery original image downloaded successfully:', image.styleName);
        } catch (error) {
            console.error('Failed to download image:', error);
            // Enhanced fallback method
            const link = document.createElement('a');
            link.href = image.generatedImageUrl;
            link.download = `miami-vice-${image.styleName.toLowerCase().replace(/\s+/g, '-')}-${image.userName}.jpg`;
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
    };

    // Share function using Web Share API
    const handleShareImage = async (image: GeneratedImage) => {
        try {
            // Try to share using Web Share API without files (to avoid CORS)
            if (navigator.share) {
                await navigator.share({
                    title: `Miami Vice 2025 - ${image.styleName}`,
                    text: `Check out my Miami ${image.styleName} transformation! 🏖️`,
                    url: image.generatedImageUrl
                });
            } else {
                // Fallback: just download the image
                console.warn('Web Share API not supported, falling back to download');
                handleDownloadImage(image);
            }
        } catch (error) {
            console.error('Failed to share image:', error);
            // Fallback to download
            handleDownloadImage(image);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="font-permanent-marker">Loading Hou' Gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm p-4 border-b border-white/10 relative">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    {/* Left side - Text stacked vertically */}
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-caveat font-bold text-white">Hou' Gallery</h1>
                        <p className="text-neutral-300 font-permanent-marker text-sm md:text-base">MIAMI 2025</p>
                    </div>
                    
                    {/* Center - Logo hanging down */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 md:-bottom-3">
                        <img 
                            src="/logo/miami_logo_2025.png" 
                            alt="Miami Vice 2025" 
                            className="h-16 md:h-24 lg:h-28 w-auto drop-shadow-lg"
                        />
                    </div>
                    
                    {/* Right side - Close button */}
                    <button
                        onClick={onClose}
                        className="text-white hover:text-orange-400 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-4">
                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-400 font-permanent-marker">{error}</p>
                    </div>
                )}

                {images.length === 0 && !error && (
                    <div className="text-center py-12">
                        <p className="text-neutral-400 font-permanent-marker text-xl">
                            No images saved to gallery yet!
                        </p>
                        <p className="text-neutral-500 mt-2">
                            Generate some Miami styles and click the ❤️ to add them here.
                        </p>
                    </div>
                )}

                {images.length > 0 && (
                    <>
                        <div className="text-center mb-6">
                            <p className="text-neutral-300 font-permanent-marker">
                                {images.length} image{images.length !== 1 ? 's' : ''} in the gallery
                            </p>
                        </div>

                        {/* Image Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {images.map((image, index) => (
                                <motion.div
                                    key={image.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation"
                                    onClick={() => openImageViewer(index)}
                                    onTouchStart={(e) => {
                                        const touch = e.touches[0];
                                        setTouchStart({
                                            x: touch.clientX,
                                            y: touch.clientY,
                                            time: Date.now()
                                        });
                                        // Slight visual feedback for touch start
                                        e.currentTarget.style.transform = 'scale(0.99)';
                                    }}
                                    onTouchEnd={(e) => {
                                        e.currentTarget.style.transform = '';
                                        
                                        if (!touchStart) return;
                                        
                                        const touch = e.changedTouches[0];
                                        const deltaX = Math.abs(touch.clientX - touchStart.x);
                                        const deltaY = Math.abs(touch.clientY - touchStart.y);
                                        const deltaTime = Date.now() - touchStart.time;
                                        
                                        // Only consider it a tap if:
                                        // 1. Touch was brief (less than 300ms)
                                        // 2. Minimal movement (less than 10px in any direction)
                                        const isTap = deltaTime < 300 && deltaX < 10 && deltaY < 10;
                                        
                                        if (isTap) {
                                            openImageViewer(index);
                                        }
                                        
                                        setTouchStart(null);
                                    }}
                                    onTouchCancel={(e) => {
                                        e.currentTarget.style.transform = '';
                                        setTouchStart(null);
                                    }}
                                    onTouchMove={(e) => {
                                        // If user is moving significantly, reset visual feedback
                                        if (touchStart) {
                                            const touch = e.touches[0];
                                            const deltaX = Math.abs(touch.clientX - touchStart.x);
                                            const deltaY = Math.abs(touch.clientY - touchStart.y);
                                            
                                            if (deltaX > 5 || deltaY > 5) {
                                                e.currentTarget.style.transform = '';
                                            }
                                        }
                                    }}
                                    style={{ 
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation'
                                    }}
                                >
                                    <div className="aspect-[4/5] overflow-hidden rounded-md mb-3 bg-neutral-100">
                                        <img
                                            src={image.generatedImageUrl}
                                            alt={`${image.styleName} by ${image.userName}`}
                                            className="w-full h-full object-contain pointer-events-none"
                                            draggable={false}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-permanent-marker text-black text-sm font-bold">
                                            {image.styleName}
                                        </p>
                                        <p className="text-neutral-600 text-xs">
                                            by {image.userName}
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            {image.timestamp.toLocaleDateString()}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            </div>

            {/* Full-size Image Viewer Modal - Rendered outside gallery container */}
            <AnimatePresence>
                {selectedImageIndex !== null && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        overflowY: 'hidden' // Prevent background scroll
                    }}
                    onClick={closeImageViewer}
                    onTouchMove={(e) => {
                        // Background scroll prevention handled by CSS overflow
                    }}
                >
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeImageViewer();
                            }}
                            className="absolute top-4 right-4 z-[110] text-white hover:text-orange-400 transition-colors"
                            style={{ position: 'fixed' }}
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Navigation Arrows */}
                        {selectedImageIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToPrevious();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] text-white hover:text-orange-400 transition-colors"
                                style={{ position: 'fixed' }}
                            >
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {selectedImageIndex < images.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToNext();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] text-white hover:text-orange-400 transition-colors"
                                style={{ position: 'fixed' }}
                            >
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Image Container */}
                        <div 
                            className="w-full h-full flex items-center justify-center px-2 py-4 md:px-4 md:py-8"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => {
                                // Only handle swipes on mobile
                                if (window.innerWidth <= 768) {
                                    const touch = e.touches[0];
                                    setSwipeStart({
                                        x: touch.clientX,
                                        y: touch.clientY
                                    });
                                }
                            }}
                            onTouchMove={(e) => {
                                // Handle swipe gestures on mobile
                                if (window.innerWidth <= 768 && swipeStart) {
                                    const touch = e.touches[0];
                                    const deltaX = touch.clientX - swipeStart.x;
                                    const deltaY = Math.abs(touch.clientY - swipeStart.y);
                                    
                                    // Only track horizontal movement if it's more horizontal than vertical
                                    if (Math.abs(deltaX) > deltaY) {
                                        setSwipeOffset(deltaX * 0.3); // Dampen the movement for subtle feedback
                                    }
                                }
                            }}
                            onTouchEnd={(e) => {
                                // Only handle swipes on mobile
                                if (window.innerWidth <= 768 && swipeStart) {
                                    const touch = e.changedTouches[0];
                                    const deltaX = touch.clientX - swipeStart.x;
                                    const deltaY = Math.abs(touch.clientY - swipeStart.y);
                                    
                                    // Reset visual feedback
                                    setSwipeOffset(0);
                                    
                                    // Check if it's a horizontal swipe (more horizontal than vertical movement)
                                    // and the swipe is significant enough (at least 50px)
                                    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
                                        if (deltaX > 0) {
                                            // Swipe right - go to previous image
                                            goToPrevious();
                                        } else {
                                            // Swipe left - go to next image
                                            goToNext();
                                        }
                                    }
                                    
                                    setSwipeStart(null);
                                }
                            }}
                            onTouchCancel={() => {
                                setSwipeStart(null);
                                setSwipeOffset(0);
                            }}
                            style={{
                                touchAction: 'none' // Prevent all default touch behaviors in modal
                            }}
                        >
                            <motion.div
                                key={selectedImageIndex}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    x: swipeOffset 
                                }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white rounded-lg p-3 md:p-6 shadow-2xl max-w-4xl max-h-[95vh] w-full mx-auto flex flex-col overflow-y-auto"
                            >
                                {/* Full-size Polaroid Frame - Responsive sizing */}
                                <div className="w-full max-w-xs md:max-w-sm lg:max-w-lg mx-auto bg-neutral-100 rounded-md flex-shrink min-h-0" style={{ aspectRatio: '4/5' }}>
                                    <img
                                        src={images[selectedImageIndex].generatedImageUrl}
                                        alt={`${images[selectedImageIndex].styleName} by ${images[selectedImageIndex].userName}`}
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                </div>
                                
                                {/* Image Info */}
                                <div className="text-center mt-1 md:mt-2 space-y-0.5 md:space-y-1 flex-shrink-0">
                                    <h3 className="font-permanent-marker text-lg md:text-xl text-black">
                                        {images[selectedImageIndex].styleName}
                                    </h3>
                                    <p className="text-neutral-600 text-sm md:text-base">
                                        by {images[selectedImageIndex].userName}
                                    </p>
                                    
                                    {/* Download and Share Buttons */}
                                    <div className="flex justify-center gap-2 md:gap-3 mt-1.5 md:mt-3 pb-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadImage(images[selectedImageIndex]);
                                            }}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-4 py-2 rounded-lg font-permanent-marker text-xs md:text-sm transition-colors flex items-center gap-1 md:gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </button>
                                        
                                        {/* Web Share API Button - Mobile Only */}
                                        {typeof window !== 'undefined' && navigator?.share && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShareImage(images[selectedImageIndex]);
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg font-permanent-marker text-xs md:text-sm transition-colors flex items-center gap-1 md:gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                                </svg>
                                                Share
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Emoji Reactions */}
                                    <EmojiReactions 
                                        imageId={images[selectedImageIndex].id}
                                        memberData={memberData}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HouGallery;
