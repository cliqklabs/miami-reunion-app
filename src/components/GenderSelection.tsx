import React from 'react';
import { motion } from 'framer-motion';

// Gender selection patterns from reference files adapted for universal use
export type Gender = 'male' | 'female' | 'non-binary';

export interface GenderSelectionProps {
  onGenderSelect: (gender: Gender) => void;
  theme?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const GenderSelection: React.FC<GenderSelectionProps> = ({ 
  onGenderSelect, 
  theme = 'miami',
  title = "Choose Your Identity",
  subtitle = "Select your gender for personalized alter ego styles",
  className = ""
}) => {
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const buttonHover = {
    scale: 1.02,
    transition: { duration: 0.2 }
  };

  const buttonTap = {
    scale: 0.98,
    transition: { duration: 0.1 }
  };

  // Theme-specific styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'miami':
        return {
          masculine: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500",
          feminine: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-400 hover:to-red-400",
          neutral: "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400"
        };
      case 'wedding':
        return {
          masculine: "bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-500 hover:to-gray-600",
          feminine: "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-300 hover:to-pink-400",
          neutral: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500"
        };
      default:
        return {
          masculine: "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500",
          feminine: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400",
          neutral: "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-400 hover:to-slate-500"
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <motion.div 
      className={`flex flex-col items-center gap-8 max-w-md mx-auto p-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center"
        variants={itemVariants}
      >
        <h2 className="font-permanent-marker text-white text-3xl mb-2 drop-shadow-lg">
          {title}
        </h2>
        <p className="text-neutral-300 text-base">
          {subtitle}
        </p>
      </motion.div>
      
      {/* Gender Selection Buttons */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
        variants={itemVariants}
      >
        {/* Masculine Option */}
        <motion.button
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => onGenderSelect('male')}
          className={`p-6 ${themeStyles.masculine} rounded-lg text-white font-bold text-xl shadow-lg transition-all duration-200 flex flex-col items-center gap-2`}
          variants={itemVariants}
        >
          <div className="text-2xl">👔</div>
          <span>Masculine Styles</span>
          <span className="text-sm font-normal opacity-90">
            {theme === 'miami' ? 'Drug Lord, Gigolo & more' : 'Tailored for you'}
          </span>
        </motion.button>
        
        {/* Feminine Option */}
        <motion.button
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => onGenderSelect('female')}
          className={`p-6 ${themeStyles.feminine} rounded-lg text-white font-bold text-xl shadow-lg transition-all duration-200 flex flex-col items-center gap-2`}
          variants={itemVariants}
        >
          <div className="text-2xl">👗</div>
          <span>Feminine Styles</span>
          <span className="text-sm font-normal opacity-90">
            {theme === 'miami' ? 'Boss Babe, Queen & more' : 'Designed for you'}
          </span>
        </motion.button>
      </motion.div>
      
      {/* Non-binary/Show All Option */}
      <motion.button
        whileHover={buttonHover}
        whileTap={buttonTap}
        onClick={() => onGenderSelect('non-binary')}
        className={`p-4 ${themeStyles.neutral} rounded-lg text-white font-semibold w-full max-w-xs shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
        variants={itemVariants}
      >
        <div className="text-xl">🌈</div>
        <span>Show All Styles</span>
      </motion.button>

      {/* Helper Text */}
      <motion.div 
        className="text-center text-sm text-neutral-400 max-w-sm"
        variants={itemVariants}
      >
        <p>
          Don't worry - you can always see all styles later. 
          This just helps us show you the most relevant options first.
        </p>
      </motion.div>
    </motion.div>
  );
};

// Gender-aware style filtering utility based on reference patterns
export const getStylesForGender = (
  styles: Record<string, any>, 
  gender: Gender
): Record<string, any> => {
  if (gender === 'non-binary') {
    return styles; // Show all styles
  }

  const prefix = gender === 'female' ? 'f' : 'm';
  
  return Object.entries(styles)
    .filter(([key, _]) => key.startsWith(prefix))
    .slice(0, 5) // Limit to 5 styles as per reference
    .reduce((acc, [key, style]) => ({ ...acc, [key]: style }), {});
};

// Hook for managing gender selection state
export const useGenderSelection = (initialGender?: Gender) => {
  const [selectedGender, setSelectedGender] = React.useState<Gender | null>(initialGender || null);
  const [showGenderSelection, setShowGenderSelection] = React.useState(!initialGender);

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    setShowGenderSelection(false);
  };

  const resetGenderSelection = () => {
    setSelectedGender(null);
    setShowGenderSelection(true);
  };

  return {
    selectedGender,
    showGenderSelection,
    handleGenderSelect,
    resetGenderSelection
  };
};

export default GenderSelection;
