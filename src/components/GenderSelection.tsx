import React from 'react';
import { motion } from 'framer-motion';

interface GenderSelectionProps {
  onSelect: (gender: 'male' | 'female') => void;
  userName: string;
}

const GenderSelection: React.FC<GenderSelectionProps> = ({ onSelect, userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="font-permanent-marker text-3xl text-white mb-2">
          Hey {userName}!
        </h2>
        <p className="font-permanent-marker text-xl text-neutral-300">
          Choose your stereotype category
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <motion.button
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('female')}
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-permanent-marker text-2xl py-6 px-12 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/25"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">👸</div>
            <div>Female</div>
            <div className="text-sm opacity-90 mt-1">
              Influencer • Club Siren • Boho Hippie
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('male')}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-permanent-marker text-2xl py-6 px-12 rounded-lg shadow-lg transform transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/25"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🕺</div>
            <div>Male</div>
            <div className="text-sm opacity-90 mt-1">
              Party Bro • DJ Wannabe • Yacht Playboy
            </div>
          </div>
        </motion.button>
      </div>

      <p className="text-sm text-neutral-400 text-center max-w-md mt-4">
        Don't worry, this is just to show you the right set of hilarious Ibiza stereotypes!
      </p>
    </motion.div>
  );
};

export default GenderSelection;
