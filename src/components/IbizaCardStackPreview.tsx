import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/ibizaFirebaseService';

interface IbizaCardStackPreviewProps {
    className?: string;
}

const IbizaCardStackPreview: React.FC<IbizaCardStackPreviewProps> = ({ className }) => {
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
                // If no images, use empty array (will show placeholder)
                setPreviewImages([]);
            }
        } catch (error) {
            console.error('Failed to load Ibiza preview images:', error);
            setPreviewImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPreviewImages();
    }, []);

    // Placeholder cards for when no images are available
    const placeholderCards = [
        { style: "Party Bro", description: "Living your best life" },
        { style: "Selfie Influencer", description: "Camera ready 24/7" },
        { style: "Yacht Playboy", description: "Flexing on the seas" }
    ];

    const cards = previewImages.length > 0 ? previewImages : placeholderCards;

    return (
        <div className={`relative w-64 h-80 mx-auto ${className || ''}`}>
            {cards.map((item, index) => {
                const isImage = 'generatedImageUrl' in item;
                const zIndex = 30 - index * 10;
                const rotation = (index - 1) * 8; // -8, 0, 8 degrees
                const yOffset = index * 4; // Slight vertical offset
                const xOffset = (index - 1) * 6; // Horizontal fan effect

                return (
                    <motion.div
                        key={isImage ? item.id : index}
                        className="absolute inset-0"
                        style={{
                            zIndex,
                            transform: `rotate(${rotation}deg) translateY(${yOffset}px) translateX(${xOffset}px)`,
                        }}
                        initial={{ 
                            opacity: 0, 
                            scale: 0.8, 
                            rotate: rotation + 45,
                            y: 100 
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            rotate: rotation,
                            y: yOffset 
                        }}
                        transition={{
                            duration: 0.6,
                            delay: index * 0.15,
                            ease: "easeOut"
                        }}
                    >
                        {/* Polaroid Card */}
                        <div className="bg-white p-3 pb-12 rounded-sm shadow-xl w-full h-full">
                            {/* Image Area */}
                            <div className="w-full bg-gray-900 aspect-square rounded-sm overflow-hidden relative">
                                {isImage ? (
                                    <img 
                                        src={item.generatedImageUrl} 
                                        alt={item.styleName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        {isLoading ? (
                                            <div className="animate-pulse">
                                                <div className="w-16 h-16 bg-gray-700 rounded-full mb-2"></div>
                                                <div className="w-20 h-2 bg-gray-700 rounded"></div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="text-3xl mb-2">🎉</div>
                                                <div className="text-xs font-bold text-gray-400">
                                                    {item.style}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Gradient overlay for better text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                            
                            {/* Caption */}
                            <div className="absolute bottom-3 left-3 right-3 text-center">
                                <p className="font-permanent-marker text-black text-sm truncate">
                                    {isImage ? item.styleName : item.style}
                                </p>
                                {isImage && (
                                    <p className="text-xs text-gray-600 truncate">
                                        by {item.userName}
                                    </p>
                                )}
                                {!isImage && (
                                    <p className="text-xs text-gray-600 truncate">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
            
            {/* Floating elements for visual interest */}
            <motion.div
                className="absolute -top-4 -right-4 text-2xl"
                initial={{ opacity: 0, rotate: -180, scale: 0 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                🏖️
            </motion.div>
            
            <motion.div
                className="absolute -bottom-4 -left-4 text-2xl"
                initial={{ opacity: 0, rotate: 180, scale: 0 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
            >
                🎧
            </motion.div>
        </div>
    );
};

export default IbizaCardStackPreview;
