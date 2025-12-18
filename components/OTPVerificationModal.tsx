'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

interface OTPVerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  accountNumber: string;
  maskedPhone?: string;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  onClose,
  onSuccess,
  accountNumber,
  maskedPhone
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    setError('');

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/zsmart_branch_requests/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: accountNumber,
          otp_code: otpCode
        }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        onSuccess();
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/zsmart_branch_requests/generate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: accountNumber
        }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setTimeLeft(180);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

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
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <h2 className="text-2xl font-bold">Enter OTP</h2>
          </div>
          {maskedPhone && (
            <p className="text-white/90 text-sm">
              Code sent to {maskedPhone}
            </p>
          )}
        </div>

        {/* OTP Input */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-center mb-4">
              Enter the 6-digit code sent to your phone
            </p>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                  disabled={loading || resending}
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            {timeLeft > 0 ? (
              <p className="text-gray-600">
                Time remaining: <span className="font-semibold text-purple-600">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-red-600 font-semibold">OTP expired</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
            >
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.join('').length !== 6 || loading || timeLeft === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <FiCheck className="w-5 h-5" />
                Verify OTP
              </>
            )}
          </button>

          {/* Resend Button */}
          <div className="mt-4 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {resending ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                Didn't receive the code? You can resend when the timer expires.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OTPVerificationModal;
