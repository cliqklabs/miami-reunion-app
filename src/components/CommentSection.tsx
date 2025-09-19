import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FraternityMember } from '../services/googleSheetsService';

interface Comment {
    id: string;
    authorNickname: string;
    text: string;
    timestamp: Date;
}

interface CommentSectionProps {
    imageId: string;
    memberData: FraternityMember | null;
    onAddComment: (comment: any) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
    imageId, 
    memberData, 
    onAddComment 
}) => {
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    // Load comments from localStorage
    useEffect(() => {
        const savedComments = localStorage.getItem(`comments-${imageId}`);
        if (savedComments) {
            try {
                const parsed = JSON.parse(savedComments);
                setComments(parsed.map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp)
                })));
            } catch (error) {
                console.error('Failed to load comments:', error);
            }
        }
    }, [imageId]);

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !memberData) {
            console.log('Comment submission blocked:', { newComment: newComment.trim(), memberData });
            return;
        }

        const newCommentObj: Comment = {
            id: Date.now().toString(),
            authorNickname: memberData.nickname,
            text: newComment.trim(),
            timestamp: new Date()
        };

        console.log('Adding comment:', newCommentObj);

        // Add to local state
        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments);
        
        // Save to localStorage
        localStorage.setItem(`comments-${imageId}`, JSON.stringify(updatedComments));
        
        // Clear the form
        setNewComment('');
        
        // Call parent callback
        onAddComment(newCommentObj);
    };

    return (
        <div className="mt-6 p-4 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="font-permanent-marker text-white text-lg mb-4">
                Comments ({comments.length})
            </h3>
            
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-4">
                <textarea
                    value={newComment}
                    onChange={(e) => {
                        console.log('Comment text changed:', e.target.value);
                        setNewComment(e.target.value);
                    }}
                    placeholder={`Add a comment as ${memberData?.nickname}...`}
                    className="w-full p-3 bg-white/90 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-orange-400 resize-none"
                    rows={3}
                    maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-300 text-sm">
                        {newComment.length}/500
                    </span>
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-permanent-marker text-sm transition-colors"
                    >
                        Post as {memberData?.nickname}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-gray-400 text-center italic">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((comment) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 p-3 rounded-lg border border-white/10"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-permanent-marker text-white font-bold">
                                    {comment.authorNickname}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {comment.timestamp.toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-black text-sm leading-relaxed">{comment.text}</p>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;