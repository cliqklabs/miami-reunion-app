import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchMemberByEmail, FraternityMember } from '../services/googleSheetsService';

interface NameEntryProps {
    onSubmit: (memberData: FraternityMember) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [memberData, setMemberData] = useState<FraternityMember | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for existing cookie on mount
    useEffect(() => {
        const savedEmail = getCookie('miami_user_email');
        if (savedEmail) {
            setEmail(savedEmail);
            handleEmailLookup(savedEmail);
        }
    }, []);

    const handleEmailLookup = async (emailToCheck: string) => {
        setLoading(true);
        setError('');
        
        try {
            const member = await fetchMemberByEmail(emailToCheck);
            if (member) {
                setMemberData(member);
                // Save to cookie for future visits
                setCookie('miami_user_email', emailToCheck, 30); // 30 days
                setCookie('miami_user_name', member.firstName, 30);
                setCookie('miami_user_nickname', member.nickname, 30);
            } else {
                setError('Email not found in our guest list. Please check your email or contact the organizer.');
            }
        } catch (err) {
            setError('Unable to verify email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email');
            return;
        }

        handleEmailLookup(email.trim());
    };

    const handleConfirmMember = () => {
        if (memberData) {
            onSubmit(memberData);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="flex flex-col items-center gap-6 max-w-md mx-auto"
        >
            {!memberData ? (
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="text-center mb-4">
                        <p className="text-neutral-300 font-permanent-marker text-lg">
                            Enter your email to access the Miami app
                        </p>
                    </div>
                    
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Enter your email"
                            className="w-full px-6 py-4 text-xl font-permanent-marker text-center bg-white/10 backdrop-blur-sm border-2 border-white/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50 transition-all duration-300"
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-2 font-medium text-center">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full font-permanent-marker text-2xl text-center text-black bg-gradient-to-r from-orange-400 to-pink-500 py-4 px-8 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'OH YEE!'}
                    </button>
                </form>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-4 text-center"
                >
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <h3 className="font-permanent-marker text-orange-400 text-xl mb-2">
                            Welcome Back!
                        </h3>
                        <p className="text-white text-2xl font-bold">
                            {memberData.nickname}
                        </p>
                        <p className="text-neutral-300 text-sm mt-2">
                            Ready to create your Miami alter ego?
                        </p>
                    </div>
                    
                    <button
                        onClick={handleConfirmMember}
                        className="w-full font-permanent-marker text-2xl text-center text-black bg-gradient-to-r from-orange-400 to-pink-500 py-4 px-8 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
                    >
                        Let's Go Miami!
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export default NameEntry;
