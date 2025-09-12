import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/ibizaFirebaseService';

interface IbizaGalleryProps {
    onClose: () => void;
}

const IbizaGallery: React.FC<IbizaGalleryProps> = ({ onClose }) => {
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
                console.error('Failed to load Ibiza gallery images:', err);
                setError('Failed to load gallery images');
            } finally {
                setLoading(false);
            }
        };

        loadGalleryImages();
    }, []);

    const handleDownload = async (image: GeneratedImage) => {
        try {
            const response = await fetch(image.generatedImageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ibiza-${image.styleName.toLowerCase().replace(/\s+/g, '-')}-${image.userName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download image:', error);
        }
    };

    const openImageModal = (index: number) => {
        setSelectedImageIndex(index);
        setSwipeOffset(0);
    };

    const closeImageModal = () => {
        setSelectedImageIndex(null);
        setSwipeOffset(0);
    };

    const goToPrevious = () => {
        if (selectedImageIndex !== null && selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
            setSwipeOffset(0);
        }
    };

    const goToNext = () => {
        if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
            setSwipeOffset(0);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
        setSwipeStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!swipeStart) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - swipeStart.x;
        setSwipeOffset(deltaX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart || !swipeStart) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        const deltaTime = Date.now() - touchStart.time;
        
        const isSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300;
        
        if (isSwipe) {
            if (deltaX > 0) {
                goToPrevious();
            } else {
                goToNext();
            }
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
            // Tap to close
            closeImageModal();
        }
        
        setTouchStart(null);
        setSwipeStart(null);
        setSwipeOffset(0);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="font-permanent-marker text-xl">Loading Ibiza Gallery...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-red-900/90 p-6 rounded-lg text-white text-center max-w-md mx-4">
                    <p className="font-permanent-marker text-xl mb-4">Error Loading Gallery</p>
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={onClose}
                        className="font-permanent-marker bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Gallery Grid */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-rose-900/95 backdrop-blur-sm z-50 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/20">
                        <h2 className="font-permanent-marker text-2xl md:text-3xl text-transparent bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-400 bg-clip-text">
                            Ibiza Gallery
                        </h2>
                        <button 
                            onClick={onClose}
                            className="text-white hover:text-red-400 text-3xl font-bold transition-colors"
                            aria-label="Close gallery"
                        >
                            ×
                        </button>
                    </div>

                    {/* Gallery Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {images.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-white">
                                    <div className="text-6xl mb-4">🏖️</div>
                                    <p className="font-permanent-marker text-xl mb-2">No Ibiza Images Yet!</p>
                                    <p className="text-neutral-300">
                                        Generate some Ibiza stereotypes and save them to see them here.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {images.map((image, index) => (
                                    <motion.div
                                        key={image.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation"
                                        onClick={() => openImageModal(index)}
                                        onTouchStart={(e) => {
                                            const touch = e.touches[0];
                                            setTouchStart({
                                                x: touch.clientX,
                                                y: touch.clientY,
                                                time: Date.now()
                                            });
                                            e.currentTarget.style.transform = 'scale(0.99)';
                                        }}
                                        onTouchEnd={(e) => {
                                            e.currentTarget.style.transform = '';
                                            
                                            if (!touchStart) return;
                                            
                                            const touch = e.changedTouches[0];
                                            const deltaX = Math.abs(touch.clientX - touchStart.x);
                                            const deltaY = Math.abs(touch.clientY - touchStart.y);
                                            const deltaTime = Date.now() - touchStart.time;
                                            
                                            const isTap = deltaTime < 300 && deltaX < 10 && deltaY < 10;
                                            
                                            if (isTap) {
                                                e.preventDefault();
                                                openImageModal(index);
                                            }
                                            
                                            setTouchStart(null);
                                        }}
                                        onTouchCancel={(e) => {
                                            e.currentTarget.style.transform = '';
                                            setTouchStart(null);
                                        }}
                                        onTouchMove={(e) => {
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
                                                by {image.userName} ({image.gender === 'male' ? '🕺' : '👸'})
                                            </p>
                                            <p className="text-neutral-400 text-xs">
                                                {image.timestamp.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-size Image Viewer Modal */}
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
                            overflowY: 'hidden'
                        }}
                        onClick={closeImageModal}
                        onTouchStart={handleTouchStart}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            handleTouchMove(e);
                        }}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Navigation Arrows */}
                        {selectedImageIndex > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-indigo-400 transition-colors z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
                                aria-label="Previous image"
                            >
                                ‹
                            </button>
                        )}
                        
                        {selectedImageIndex < images.length - 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-indigo-400 transition-colors z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={closeImageModal}
                            className="absolute top-4 right-4 text-white hover:text-red-400 text-3xl font-bold transition-colors z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
                            aria-label="Close modal"
                        >
                            ×
                        </button>

                        {/* Image Container */}
                        <div className="relative w-full h-full flex items-center justify-center p-8">
                            <motion.div
                                className="relative max-w-5xl max-h-full flex flex-col items-center"
                                style={{ transform: `translateX(${swipeOffset}px)` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img 
                                    src={images[selectedImageIndex].generatedImageUrl}
                                    alt={`${images[selectedImageIndex].styleName} by ${images[selectedImageIndex].userName}`}
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                />
                                
                                {/* Image Info Panel */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 bg-white rounded-lg p-4 shadow-xl max-w-lg"
                                >
                                    <h3 className="font-permanent-marker text-black text-xl mb-1 text-center">
                                        {images[selectedImageIndex].styleName}
                                    </h3>
                                    <p className="text-neutral-600 text-sm mb-3 text-center">
                                        by {images[selectedImageIndex].userName} ({images[selectedImageIndex].gender === 'male' ? '🕺 Male' : '👸 Female'})
                                    </p>
                                    <p className="text-neutral-400 text-xs mb-3 text-center">
                                        {images[selectedImageIndex].timestamp.toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => handleDownload(images[selectedImageIndex])}
                                            className="font-permanent-marker bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                        >
                                            Download
                                        </button>
                                        <span className="text-neutral-400 text-xs">
                                            {selectedImageIndex + 1} of {images.length}
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default IbizaGallery;
