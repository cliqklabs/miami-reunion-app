import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface EnhancedSettingsProps {
  useEnhancedGeneration: boolean;
  onToggleEnhanced: (enabled: boolean) => void;
  selectedGender?: 'male' | 'female' | 'non-binary' | null;
  onResetGender?: () => void;
  className?: string;
}

export const EnhancedSettings: React.FC<EnhancedSettingsProps> = ({
  useEnhancedGeneration,
  onToggleEnhanced,
  selectedGender,
  onResetGender,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Settings Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-30 font-permanent-marker text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-4 rounded-lg transform transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
      >
        ⚙️ Settings
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Settings Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-20 left-4 right-4 md:left-auto md:right-auto md:w-96 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-xl p-6 z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-permanent-marker text-white text-xl">
                  Enhanced Features
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Settings Options */}
              <div className="space-y-6">
                {/* Enhanced Generation Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      Enhanced Generation
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Use multi-provider AI + auto-commerce creation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useEnhancedGeneration}
                      onChange={(e) => onToggleEnhanced(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Enhanced Generation Info */}
                {useEnhancedGeneration && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4"
                  >
                    <h5 className="text-purple-200 font-semibold mb-2">
                      ✨ Enhanced Features Active
                    </h5>
                    <ul className="text-purple-300 text-sm space-y-1">
                      <li>• Multi-provider AI (Gemini + SeeDream)</li>
                      <li>• Automatic merchandise creation</li>
                      <li>• Print-ready image formats</li>
                      <li>• Commerce automation triggers</li>
                    </ul>
                  </motion.div>
                )}

                {/* Gender Selection Info */}
                {selectedGender && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-1">
                        Style Preference
                      </h4>
                      <p className="text-gray-300 text-sm capitalize">
                        {selectedGender === 'non-binary' ? 'All styles' : `${selectedGender} styles`}
                      </p>
                    </div>
                    {onResetGender && (
                      <button
                        onClick={() => {
                          onResetGender();
                          setIsOpen(false);
                        }}
                        className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        Change
                      </button>
                    )}
                  </div>
                )}

                {/* Feature Status */}
                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-white font-semibold mb-3">Feature Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">ByteDance SeeDream</span>
                      <span className={`${import.meta.env.VITE_FAL_AI_KEY ? 'text-green-400' : 'text-yellow-400'}`}>
                        {import.meta.env.VITE_FAL_AI_KEY ? '✓ Ready' : '⚠ Not configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Printful Commerce</span>
                      <span className={`${import.meta.env.VITE_PRINTFUL_API_KEY ? 'text-green-400' : 'text-yellow-400'}`}>
                        {import.meta.env.VITE_PRINTFUL_API_KEY ? '✓ Ready' : '⚠ Not configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">N8n Automation</span>
                      <span className={`${import.meta.env.VITE_N8N_WEBHOOK_URL ? 'text-green-400' : 'text-yellow-400'}`}>
                        {import.meta.env.VITE_N8N_WEBHOOK_URL ? '✓ Ready' : '⚠ Not configured'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Version Info */}
                <div className="text-center text-gray-400 text-xs border-t border-white/10 pt-3">
                  Miami Alter Ego v2.0 - Enhanced Commerce Platform
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSettings;
