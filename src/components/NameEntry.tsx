import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface NameEntryProps {
    onSubmit: (name: string) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ onSubmit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (name.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }

        setError('');
        onSubmit(name.trim());
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="flex flex-col items-center gap-6 max-w-md mx-auto"
        >

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Enter your name"
                        className="w-full px-6 py-4 text-xl font-permanent-marker text-center bg-white/10 backdrop-blur-sm border-2 border-white/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50 transition-all duration-300"
                        maxLength={50}
                    />
                    {error && (
                        <p className="text-red-400 text-sm mt-2 font-medium">
                            {error}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full font-permanent-marker text-2xl text-center text-black bg-gradient-to-r from-orange-400 to-pink-500 py-4 px-8 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
                >
                    OH YEE!
                </button>
            </form>

        </motion.div>
    );
};

export default NameEntry;
