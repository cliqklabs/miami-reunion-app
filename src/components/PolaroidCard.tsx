import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody } from './ui/draggable-card';
import { cn } from '../lib/utils';
import HeartIcon from './HeartIcon';
import type { PanInfo } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: (caption: string) => void;
    onDownload?: (caption: string) => void;
    onSaveToGallery?: (caption: string) => void;
    isSavedToGallery?: boolean;
    isMobile?: boolean;
    isInFront?: boolean;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay = ({ isMobile }: { isMobile?: boolean }) => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-500 text-xs font-permanent-marker mb-1">Generation Failed</p>
        {!isMobile && (
            <p className="text-neutral-600 text-xs font-permanent-marker">
                Shake to retry
            </p>
        )}
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-permanent-marker text-xl">Upload Photo</span>
    </div>
);




const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, error, dragConstraintsRef, onShake, onDownload, onSaveToGallery, isSavedToGallery = false, isMobile, isInFront = false }) => {
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const lastShakeTime = useRef(0);
    const lastVelocity = useRef({ x: 0, y: 0 });

    // Reset states when the image URL changes or status goes to pending.
    useEffect(() => {
        if (status === 'pending') {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        } else if (status === 'done' && imageUrl) {
            // For uploaded images (data URLs), skip the developing animation
            if (imageUrl.startsWith('data:')) {
                setIsImageLoaded(true);
                setIsDeveloped(true);
            } else {
                // For generated images (URLs), use the developing animation
                setIsDeveloped(false);
                setIsImageLoaded(false);
            }
        }
    }, [imageUrl, status]);

    // When the image is loaded, start the developing animation.
    useEffect(() => {
        if (isImageLoaded && status === 'done' && imageUrl) {
            const timer = setTimeout(() => {
                setIsDeveloped(true);
            }, 500); // Slightly longer delay to ensure image is ready
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded, status, imageUrl]);

    const handleDragStart = () => {
        // Reset velocity on new drag to prevent false triggers from old data
        lastVelocity.current = { x: 0, y: 0 };
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onShake || isMobile) return;

        const velocityThreshold = 1500; // Increased threshold to require more vigorous movement
        const shakeCooldown = 2000; // Increased cooldown to prevent accidental rapid triggers

        const { x, y } = info.velocity;
        const { x: prevX, y: prevY } = lastVelocity.current;
        const now = Date.now();

        // Calculate velocity magnitude
        const magnitude = Math.sqrt(x * x + y * y);
        
        // Check for rapid back-and-forth movement (shake) - made much more strict
        const dotProduct = (x * prevX) + (y * prevY);
        const isDirectionChange = dotProduct < -500; // Much stricter direction change requirement
        
        // Require both rapid movement AND direction change for shake detection
        const isRapidMovement = magnitude > velocityThreshold;

        // Removed the easy trigger option - now requires BOTH rapid movement AND direction change
        // Also increased the fallback threshold significantly
        if ((isRapidMovement && isDirectionChange) || magnitude > velocityThreshold * 2.5) {
            if (now - lastShakeTime.current > shakeCooldown) {
                lastShakeTime.current = now;
                console.log('Shake detected for:', caption, 'velocity:', magnitude);
                onShake(caption);
            }
        }

        lastVelocity.current = { x, y };
    };

    const cardInnerContent = (
        <>
            <div className="w-full bg-neutral-900 shadow-inner aspect-[4/5] relative overflow-hidden group">
                {status === 'pending' && <LoadingSpinner />}
                {status === 'error' && (
                    <>
                        <ErrorDisplay isMobile={isMobile} />
                        {/* Mobile retry button for error cards */}
                        {isMobile && onShake && (
                            <div className="absolute top-2 right-2 z-20">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Mobile retry clicked for:', caption);
                                        onShake(caption);
                                    }}
                                    className="p-2 bg-red-600/80 rounded-full text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-lg"
                                    aria-label={`Retry generation for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={cn(
                            "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300",
                            !isMobile && "opacity-0 group-hover:opacity-100",
                        )}>
                            {onSaveToGallery && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Heart clicked for:', caption);
                                        onSaveToGallery(caption);
                                    }}
                                    className="p-2 bg-black/50 rounded-full hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
                                >
                                    <HeartIcon
                                        isSaved={isSavedToGallery}
                                        size={20}
                                    />
                                </div>
                            )}
                            {onDownload && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag from starting on click
                                        console.log('Download clicked for:', caption);
                                        onDownload(caption);
                                    }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Download image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                             {isMobile && onShake && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Mobile regenerate clicked for:', caption);
                                        onShake(caption);
                                    }}
                                    className="p-2 bg-purple-600/80 rounded-full text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-lg"
                                    aria-label={`Regenerate image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>


                        {/* The Image - loads first */}
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={caption}
                            onLoad={() => {
                                console.log('Image loaded successfully:', caption);
                                setIsImageLoaded(true);
                            }}
                            onError={() => {
                                console.error('Failed to load image:', imageUrl);
                                setIsImageLoaded(false);
                            }}
                            className={`w-full h-full object-contain object-center transition-all duration-[2000ms] ease-in-out ${
                                isDeveloped
                                ? 'opacity-100 filter-none'
                                : 'opacity-70 filter sepia(0.3) contrast(0.9) brightness(0.9)'
                            }`}
                            style={{ 
                                display: isImageLoaded ? 'block' : 'none',
                                minHeight: '200px',
                                backgroundColor: '#f3f4f6'
                            }}
                        />
                        
                        {/* Loading placeholder while image loads */}
                        {!isImageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-gray-400 text-center">
                                    <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm font-permanent-marker">Loading...</span>
                                </div>
                            </div>
                        )}



                        {/* The developing chemical overlay - fades out */}
                        <div
                            className={`absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#3a322c]/30 to-transparent transition-opacity duration-[2000ms] ease-out ${
                                isDeveloped ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                            aria-hidden="true"
                        />
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder />}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center px-2">
                <p className={cn(
                    "font-permanent-marker text-lg truncate",
                    status === 'done' && imageUrl ? 'text-black' : 'text-neutral-800'
                )}>
                    {caption}
                </p>
            </div>
        </>
    );

    // For non-draggable cards (like upload placeholder), use static container
    // Allow dragging for both successful and error cards to enable shake-to-retry
    const shouldBeDraggable = (status === 'done' || status === 'error') && !isMobile;

    if (isMobile || !shouldBeDraggable) {
        return (
            <div className={`bg-neutral-100 dark:bg-neutral-100 !p-4 !pb-16 flex flex-col items-center justify-start aspect-[3/4] w-80 max-w-full rounded-md shadow-lg relative ${isInFront ? 'ring-2 ring-orange-400 ring-opacity-60' : ''}`}>
                {cardInnerContent}
            </div>
        );
    }

    return (
        <DraggableCardContainer>
            <DraggableCardBody
                className={`bg-neutral-100 dark:bg-neutral-100 !p-4 !pb-16 flex flex-col items-center justify-start aspect-[3/4] w-80 max-w-full ${isInFront ? 'ring-2 ring-orange-400 ring-opacity-60 rounded-md' : ''}`}
                dragConstraintsRef={dragConstraintsRef}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
            >
                {cardInnerContent}
            </DraggableCardBody>
        </DraggableCardContainer>
    );
};

export default PolaroidCard;
