import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/firebaseService';

interface CardStackPreviewProps {
    className?: string;
}

const CardStackPreview: React.FC<CardStackPreviewProps> = ({ className }) => {
    const [previewImages, setPreviewImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPreviewImages = async () => {
        try {
            setIsLoading(true);
            const allImages = await getAllGalleryImages();
            
            if (allImages.length > 0) {
                // Randomly select 3 images
                const shuffled = [...allImages].sort(() => Math.random() - 0.5);
                setPreviewImages(shuffled.slice(0, 3));
            } else {
                setPreviewImages([]);
            }
        } catch (error) {
            console.error('Failed to load preview images:', error);
            setPreviewImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        loadPreviewImages();

        // Auto-refresh after 30 seconds (once)
        const timer = setTimeout(() => {
            loadPreviewImages();
        }, 30000);

        return () => clearTimeout(timer);
    }, []);

    // Show placeholder cards if no gallery images exist yet
    const displayImages = previewImages.length > 0 ? previewImages : [
        { id: 'demo1', styleName: 'Drug Lord', generatedImageUrl: '', isPlaceholder: true },
        { id: 'demo2', styleName: 'Beach Gigolo', generatedImageUrl: '', isPlaceholder: true },
        { id: 'demo3', styleName: 'Cocaine Cowboy', generatedImageUrl: '', isPlaceholder: true }
    ];

    // Don't render anything if we're still loading
    if (isLoading) {
        return null;
    }

    const handleCardClick = () => {
        // Refresh all cards with new random images
        loadPreviewImages();
    };

    return (
        <div className={`flex justify-center ${className || ''}`}>
            {/* Container for the spread out stack - much wider for better spacing */}
            <div className="relative w-[500px] h-80" style={{ marginLeft: '-160px' }}>
                {displayImages.map((image, index) => {
                    // Define positions for spread out layout matching reference spacing
                    // All positions are relative to the center of the 500px container
                    const positions = [
                        // Top card (index 0) - centered and on top
                        { 
                            x: 0, 
                            y: 0, 
                            rotate: 2, 
                            zIndex: 30,
                            scale: 1 
                        },
                        // Bottom left card (index 1) - much further left for clear separation
                        { 
                            x: -140, 
                            y: 40, 
                            rotate: -8, 
                            zIndex: 20,
                            scale: 1 
                        },
                        // Bottom right card (index 2) - much further right for clear separation
                        { 
                            x: 140, 
                            y: 45, 
                            rotate: 8, 
                            zIndex: 20,
                            scale: 1 
                        },
                    ];

                    const position = positions[index] || positions[0];

                    return (
                        <motion.div
                            key={`${image.id}-${index}`}
                            className="absolute"
                            style={{
                                zIndex: position.zIndex,
                                left: '50%',
                                top: '20px',
                                transform: 'translateX(-50%)',
                            }}
                            initial={{ 
                                opacity: 0, 
                                scale: 0.5,
                                x: position.x,
                                y: position.y,
                                rotate: position.rotate + (Math.random() - 0.5) * 30
                            }}
                            animate={{ 
                                opacity: 1, 
                                scale: position.scale,
                                x: position.x,
                                y: position.y,
                                rotate: position.rotate
                            }}
                            transition={{ 
                                duration: 0.8, 
                                delay: index * 0.1,
                                type: 'spring',
                                stiffness: 100,
                                damping: 15
                            }}
                        >
                            {/* Larger Polaroid Card - 25% bigger */}
                            <div 
                                className="bg-neutral-100 p-4 pb-16 flex flex-col items-center justify-start rounded-md shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                style={{ width: '200px', height: '260px' }}
                                onClick={handleCardClick}
                            >
                                <div className="w-full bg-neutral-900 shadow-inner aspect-[4/5] relative overflow-hidden rounded-sm">
                                    {(image as any).isPlaceholder ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                                            <div className="text-white text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-xs font-permanent-marker">Style</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={image.generatedImageUrl}
                                            alt={image.styleName}
                                            className="w-full h-full object-cover object-center"
                                            style={{ minHeight: '80px' }}
                                        />
                                    )}
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-center">
                                    <p className="font-permanent-marker text-base truncate text-black">
                                        {image.styleName}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Optional: Add a subtle glow effect behind the stack */}
            <div className="absolute inset-0 -z-10 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-xl" />
        </div>
    );
};

export default CardStackPreview;
