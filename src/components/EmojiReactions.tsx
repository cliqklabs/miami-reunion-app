import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FraternityMember } from '../services/googleSheetsService';
import { getEmojiReactions, saveEmojiReaction, EmojiReaction } from '../services/firebaseService';

// Using EmojiReaction interface from firebaseService

interface EmojiReactionsProps {
    imageId: string;
    memberData: FraternityMember | null;
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
    imageId, 
    memberData 
}) => {
    const [reactions, setReactions] = useState<Record<string, EmojiReaction>>({});
    const [loading, setLoading] = useState(true);

    const availableEmojis = [
        { emoji: '🔥', label: 'Fire' },
        { emoji: '😂', label: 'Hilarious' },
        { emoji: '💰', label: 'Money' },
        { emoji: '💯', label: 'Perfect' },
        { emoji: '👑', label: 'King' },
        { emoji: '🌈', label: 'Fruity' }
    ];

    // Load reactions from Firebase
    useEffect(() => {
        const loadReactions = async () => {
            setLoading(true);
            try {
                const firebaseReactions = await getEmojiReactions(imageId);
                setReactions(firebaseReactions);
            } catch (error) {
                console.error('Failed to load reactions from Firebase:', error);
                // Fallback to localStorage for backwards compatibility
                const savedReactions = localStorage.getItem(`reactions-${imageId}`);
                if (savedReactions) {
                    try {
                        setReactions(JSON.parse(savedReactions));
                    } catch (localError) {
                        console.error('Failed to load reactions from localStorage:', localError);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        loadReactions();

        // Set up periodic refresh to sync reactions across users
        const refreshInterval = setInterval(async () => {
            try {
                const firebaseReactions = await getEmojiReactions(imageId);
                setReactions(firebaseReactions);
            } catch (error) {
                // Silent fail for background refresh
                console.warn('Background reaction refresh failed:', error);
            }
        }, 5000); // Refresh every 5 seconds

        // Cleanup interval on unmount
        return () => clearInterval(refreshInterval);
    }, [imageId]);

    const handleReaction = async (emoji: string) => {
        if (!memberData) return;

        const currentReaction = reactions[emoji] || { emoji, count: 0, users: [] };
        const userNickname = memberData.nickname;
        const hasReacted = currentReaction.users.includes(userNickname);

        // Optimistically update UI
        let updatedReaction: EmojiReaction;
        if (hasReacted) {
            // Remove reaction
            updatedReaction = {
                ...currentReaction,
                count: Math.max(0, currentReaction.count - 1),
                users: currentReaction.users.filter(user => user !== userNickname)
            };
        } else {
            // Add reaction
            updatedReaction = {
                ...currentReaction,
                count: currentReaction.count + 1,
                users: [...currentReaction.users, userNickname]
            };
        }

        const updatedReactions = {
            ...reactions,
            [emoji]: updatedReaction
        };

        // Remove emoji if count is 0
        if (updatedReaction.count === 0) {
            delete updatedReactions[emoji];
        }

        // Update local state immediately for responsive UI
        setReactions(updatedReactions);

        // Save to Firebase in background
        try {
            const success = await saveEmojiReaction(imageId, emoji, userNickname, !hasReacted);
            if (!success) {
                // If Firebase save failed, revert the optimistic update
                console.error('Failed to save reaction to Firebase, reverting...');
                setReactions(reactions); // Revert to original state
                
                // Fallback: save to localStorage
                localStorage.setItem(`reactions-${imageId}`, JSON.stringify(updatedReactions));
            }
        } catch (error) {
            console.error('Error saving reaction:', error);
            // Revert optimistic update
            setReactions(reactions);
            // Fallback: save to localStorage
            localStorage.setItem(`reactions-${imageId}`, JSON.stringify(updatedReactions));
        }
    };

    if (loading) {
        return (
            <div className="mt-2 md:mt-4 p-2 md:p-3 bg-black/30 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="font-permanent-marker text-white text-xs">Loading reactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-1 md:mt-2 p-2 md:p-3 bg-black/30 backdrop-blur-sm rounded-lg">
            {/* Reaction Buttons - Compact grid for mobile */}
            <div className="grid grid-cols-3 md:flex md:flex-wrap md:justify-center gap-1 md:gap-2">
                {availableEmojis.map(({ emoji, label }) => {
                    const reaction = reactions[emoji];
                    const hasReacted = reaction?.users.includes(memberData?.nickname || '') || false;
                    
                    return (
                        <motion.button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className={`
                                flex items-center justify-center gap-1 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm transition-all duration-200
                                ${hasReacted 
                                    ? 'bg-orange-500 text-white scale-105' 
                                    : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                                }
                            `}
                            whileHover={{ scale: hasReacted ? 1.05 : 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            title={label}
                        >
                            <span className="text-sm md:text-lg">{emoji}</span>
                            {reaction && reaction.count > 0 && (
                                <span className="font-bold text-xs md:text-sm">
                                    {reaction.count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

        </div>
    );
};

export default EmojiReactions;
