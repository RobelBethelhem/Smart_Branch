'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'error' | 'success';
  /** Auto-dismiss duration in ms. Set to 0 to disable auto-dismiss. */
  duration?: number;
}

/**
 * Non-blocking toast notification rendered in the top-right corner.
 * Used for backend errors and success messages so the user can keep
 * interacting with the screen (e.g. press Back) instead of being stuck.
 */
const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'error', duration = 5000 }) => {
  // Keep the latest onClose in a ref so consumers can pass inline arrows
  // without the auto-dismiss timer resetting on every parent re-render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const isError = type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="fixed top-4 right-4 z-[9999] max-w-sm w-[calc(100%-2rem)] sm:w-auto"
      role="alert"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border ${
          isError
            ? 'bg-red-600 border-red-700 text-white'
            : 'bg-emerald-600 border-emerald-700 text-white'
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isError ? (
            <FiAlertCircle className="w-5 h-5" />
          ) : (
            <FiCheckCircle className="w-5 h-5" />
          )}
        </div>
        <p className="text-sm font-medium flex-1 break-words">{message}</p>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;
