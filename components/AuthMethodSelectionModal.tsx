'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface AuthMethodSelectionModalProps {
  onClose: () => void;
  onSelectMethod: (method: 'face' | 'fingerprint' | 'otp') => void;
  accountNumber: string;
  accountName: string;
}

const AuthMethodSelectionModal: React.FC<AuthMethodSelectionModalProps> = ({
  onClose,
  onSelectMethod,
  accountNumber,
  accountName
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E60000] to-red-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Choose Authentication Method</h2>
          <p className="text-white/90 mt-2 text-sm">
            Account: {accountNumber}
          </p>
          <p className="text-white/90 text-sm">
            {accountName}
          </p>
        </div>

        {/* Authentication Methods */}
        <div className="p-6 space-y-4">
          {/* Face Recognition */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMethod('face')}
            className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all flex items-center gap-4"
          >
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Face Recognition</div>
              <div className="text-sm text-white/80">Verify using your face</div>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* Fingerprint */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMethod('fingerprint')}
            className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg transition-all flex items-center gap-4"
          >
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Fingerprint</div>
              <div className="text-sm text-white/80">Verify using your fingerprint</div>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* OTP */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMethod('otp')}
            className="w-full p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all flex items-center gap-4"
          >
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <circle cx="12" cy="16" r="1" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">OTP</div>
              <div className="text-sm text-white/80">Verify using SMS code</div>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthMethodSelectionModal;
