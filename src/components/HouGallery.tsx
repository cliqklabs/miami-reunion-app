import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/firebaseService';

interface HouGalleryProps {
    onClose: () => void;
}

const HouGallery: React.FC<HouGalleryProps> = ({ onClose }) => {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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
        setSelectedImageIndex(index);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const closeImageViewer = () => {
        setSelectedImageIndex(null);
        // Restore body scroll when modal closes
        document.body.style.overflow = 'unset';
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
        };
    }, []);

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
            <div className="sticky top-0 bg-gradient-to-r from-teal-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm p-4 border-b border-white/10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-caveat font-bold text-white">Hou' Gallery</h1>
                        <p className="text-neutral-300 font-permanent-marker">Casa Cardinal Miami 2025</p>
                    </div>
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
                                    className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                                    onClick={() => openImageViewer(index)}
                                >
                                    <div className="aspect-[4/5] overflow-hidden rounded-md mb-3 bg-neutral-100">
                                        <img
                                            src={image.generatedImageUrl}
                                            alt={`${image.styleName} by ${image.userName}`}
                                            className="w-full h-full object-contain"
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
                        height: '100vh'
                    }}
                    onClick={closeImageViewer}
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
                            className="w-full h-full flex items-center justify-center px-4 py-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                key={selectedImageIndex}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white rounded-lg p-6 shadow-2xl max-w-4xl max-h-[85vh] w-full mx-auto flex flex-col"
                            >
                                {/* Full-size Polaroid Frame */}
                                <div className="aspect-[4/5] w-full max-w-lg mx-auto bg-neutral-100 rounded-md flex-shrink-0">
                                    <img
                                        src={images[selectedImageIndex].generatedImageUrl}
                                        alt={`${images[selectedImageIndex].styleName} by ${images[selectedImageIndex].userName}`}
                                        className="w-full h-full object-contain rounded-md"
                                    />
                                </div>
                                
                                {/* Image Info */}
                                <div className="text-center mt-3 space-y-1 flex-shrink-0">
                                    <h3 className="font-permanent-marker text-xl text-black">
                                        {images[selectedImageIndex].styleName}
                                    </h3>
                                    <p className="text-neutral-600 text-base">
                                        by {images[selectedImageIndex].userName}
                                    </p>
                                    <div className="flex justify-center items-center gap-4 text-sm text-neutral-500">
                                        <span>{images[selectedImageIndex].timestamp.toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{selectedImageIndex + 1} of {images.length}</span>
                                    </div>
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
