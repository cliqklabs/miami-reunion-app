import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllGalleryImages, GeneratedImage } from '../services/firebaseService';

interface HouGalleryProps {
    onClose: () => void;
}

const HouGallery: React.FC<HouGalleryProps> = ({ onClose }) => {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                                    className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <div className="aspect-square overflow-hidden rounded-md mb-3">
                                        <img
                                            src={image.generatedImageUrl}
                                            alt={`${image.styleName} by ${image.userName}`}
                                            className="w-full h-full object-cover"
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
    );
};

export default HouGallery;
