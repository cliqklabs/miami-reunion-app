import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGalleryImages, getAllGeneratedImages, GeneratedImage, updateImageGalleryStatus } from './services/firebaseService';

const AdminApp: React.FC = () => {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'gallery' | 'all'>('gallery');

    const loadImages = async (tab: 'gallery' | 'all' = activeTab) => {
        try {
            setLoading(true);
            const data = tab === 'gallery' ? await getAllGalleryImages() : await getAllGeneratedImages();
            setImages(data);
            setError(null);
        } catch (err) {
            setError('Failed to load images');
            console.error('Admin load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages('gallery');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadImages(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleDeleteImage = async (image: GeneratedImage) => {
        // Prevent multiple delete operations on the same image
        if (deletingIds.has(image.id)) {
            return;
        }

        setDeletingIds(prev => new Set([...prev, image.id]));
        
        try {
            // Remove from gallery by setting inGallery to false
            const success = await updateImageGalleryStatus(image.userId, image.styleId, false);
            
            if (success) {
                // Remove from local state immediately for responsive UI
                setImages(prev => prev.filter(img => img.id !== image.id));
                console.log('Image removed from gallery:', image.styleName, 'by', image.userName);
            } else {
                console.error('Failed to remove image from gallery');
                setError('Failed to remove image from gallery');
            }
        } catch (error) {
            console.error('Error removing image from gallery:', error);
            setError('Failed to remove image from gallery');
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(image.id);
                return newSet;
            });
        }
    };

    const handleRefresh = () => {
        loadImages(activeTab);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="font-permanent-marker">Loading Admin Gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
            {/* Dark Miami 80s Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/80 via-transparent to-purple-900/60"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-indigo-950/40 to-slate-900"></div>
            
            {/* Neon Pink and Purple Streaks */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-2 bg-gradient-to-r from-transparent via-pink-500/80 to-transparent transform rotate-45 origin-right shadow-lg shadow-pink-500/30 blur-sm"></div>
                <div className="absolute top-1 right-1 w-96 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform rotate-45 origin-right"></div>
                <div className="absolute top-20 left-0 w-80 h-1.5 bg-gradient-to-r from-transparent via-purple-400/70 to-transparent transform -rotate-12 shadow-lg shadow-purple-400/20 blur-sm"></div>
                <div className="absolute top-20.5 left-0.5 w-80 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent transform -rotate-12"></div>
            </div>
            
            {/* Subtle dark grid overlay */}
            <div className="absolute inset-0 bg-grid-white/[0.01] opacity-50"></div>
            
            {/* Header */}
            <div className="relative z-10 bg-gradient-to-r from-teal-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm p-4 border-b border-white/10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-caveat font-bold text-white">Admin - Gallery Management</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <img 
                                src="/logo/miami_logo_2025.png" 
                                alt="Miami Vice 2025" 
                                className="h-6 w-auto opacity-90"
                            />
                            <p className="text-neutral-300 font-permanent-marker">Miami 2025</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setActiveTab('gallery')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-permanent-marker transition-colors ${activeTab === 'gallery' ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:text-white'}`}
                            >
                                Gallery
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-permanent-marker transition-colors ${activeTab === 'all' ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:text-white'}`}
                            >
                                All Generations
                            </button>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-permanent-marker text-sm transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto p-4">
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-400 font-permanent-marker">{error}</p>
                        <button 
                            onClick={() => setError(null)}
                            className="mt-2 text-red-300 hover:text-red-100 text-sm underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {images.length === 0 && !error && (
                    <div className="text-center py-12">
                        <p className="text-neutral-400 font-permanent-marker text-xl">
                            {activeTab === 'gallery' ? 'No images in gallery!' : 'No generations yet!'}
                        </p>
                        <p className="text-neutral-500 mt-2">
                            {activeTab === 'gallery' ? 'Images will appear here when users add them to the gallery.' : 'Generations will appear here as users create them.'}
                        </p>
                    </div>
                )}

                {images.length > 0 && (
                    <>
                        <div className="text-center mb-6">
                            <p className="text-neutral-300 font-permanent-marker">
                                {images.length} {activeTab === 'gallery' ? 'image' : 'generation'}{images.length !== 1 ? 's' : ''} {activeTab === 'gallery' ? 'in the gallery' : 'in total'}
                            </p>
                            <p className="text-neutral-400 text-sm mt-1">
                                {activeTab === 'gallery' ? 'Click the X button to remove images from the gallery' : 'Showing latest first'}
                            </p>
                        </div>

                        {/* Image Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <AnimatePresence>
                                {images.map((image, index) => (
                                    <motion.div
                                        key={image.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 relative group"
                                    >
                                        {/* Delete Button (only in Gallery tab) */}
                                        {activeTab === 'gallery' && (
                                            <button
                                                onClick={() => handleDeleteImage(image)}
                                                disabled={deletingIds.has(image.id)}
                                                className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 disabled:cursor-not-allowed"
                                                title="Remove from gallery"
                                            >
                                                {deletingIds.has(image.id) ? (
                                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}

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
                                                {image.timestamp.toLocaleString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminApp;
