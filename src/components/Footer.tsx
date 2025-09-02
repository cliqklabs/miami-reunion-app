import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REMIX_IDEAS = [
    "to add more Miami styles like Art Deco or South Beach.",
    "to create a group composite photo feature.",
    "to add WhatsApp sharing for reunion invites.",
    "to include fun Miami facts between generations.",
    "to add a voting system for favorite styles.",
];

const Footer = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setIndex(prevIndex => (prevIndex + 1) % REMIX_IDEAS.length);
        }, 4000); // Change text every 4 seconds

        return () => clearInterval(intervalId);
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-teal-900/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-sm p-3 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4 px-4">
                {/* Left Side */}
                <div className="hidden md:flex items-center gap-4 text-neutral-500 whitespace-nowrap">
                    <p>Powered by Gemini 2.5 Flash</p>
                    <span className="text-neutral-700" aria-hidden="true">|</span>
                    <p>
                        Miami Reunion Project{' '}
                        <span className="text-orange-400">2024</span>
                    </p>
                </div>

                {/* Right Side */}
                <div className="flex-grow flex justify-end items-center gap-4 sm:gap-6">
                    <div className="hidden lg:flex items-center gap-2 text-neutral-400 text-right min-w-0">
                        <span className="flex-shrink-0">Future ideas...</span>
                        <div className="relative w-72 h-5">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 font-medium text-neutral-200 whitespace-nowrap text-left"
                                >
                                    {REMIX_IDEAS[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-permanent-marker text-sm sm:text-base text-center text-white bg-gradient-to-r from-teal-500 to-pink-500 py-2 px-4 rounded-sm transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 active:scale-95"
                        >
                            Powered by Gemini
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
