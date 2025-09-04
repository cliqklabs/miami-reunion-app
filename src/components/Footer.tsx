import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-teal-900/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-sm p-3 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex justify-center items-center">
                <div className="flex items-center gap-2">
                    <img 
                        src="/logo/miami_logo_2025.png" 
                        alt="Miami Vice 2025" 
                        className="h-6 w-auto opacity-80"
                    />
                    <p className="text-neutral-400 text-center">
                        Miami Hou' 2025
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
