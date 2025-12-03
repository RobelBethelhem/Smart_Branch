'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const FINGERPRINT_SERVICE_URL = 'ws://localhost:8089';

interface FingerprintAccount {
  account_number: string;
  account_name: string;
  currency: string;
}

interface FingerprintAuthResult {
  cif: string;
  customer_name: string;
  finger_position: string;
  accounts: FingerprintAccount[];
}

interface FingerprintVerificationModalProps {
  onClose: () => void;
  onSuccess: (accountNumber: string, customerName: string) => void;
}

const FingerprintVerificationModal: React.FC<FingerprintVerificationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'scanning' | 'verifying' | 'success' | 'error'>('connecting');
  const [message, setMessage] = useState('Connecting to fingerprint scanner...');
  const [serviceConnected, setServiceConnected] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const connectToService = useCallback(() => {
    try {
      wsRef.current = new WebSocket(FINGERPRINT_SERVICE_URL);

      wsRef.current.onopen = () => {
        console.log('Connected to fingerprint service');
        setServiceConnected(true);
        setMessage('Checking scanner status...');
        wsRef.current?.send(JSON.stringify({ action: 'check' }));
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Fingerprint service message:', data);

          switch (data.type) {
            case 'status':
              setScannerConnected(data.connected);
              if (data.connected) {
                setStatus('ready');
                setMessage('Place your finger on the scanner');
                // Auto-start capture
                setTimeout(() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    setStatus('scanning');
                    setMessage('Scanning fingerprint... Please keep your finger steady');
                    wsRef.current.send(JSON.stringify({ action: 'capture' }));
                  }
                }, 1000);
              } else {
                setStatus('error');
                setMessage('Scanner not detected. Please connect ZK9500 scanner.');
              }
              break;

            case 'capturing':
              setStatus('scanning');
              setMessage(data.message || 'Scanning fingerprint...');
              break;

            case 'captured':
              if (data.success && data.template) {
                setStatus('verifying');
                setMessage('Verifying fingerprint...');
                // Send to backend for authentication
                await authenticateFingerprint(data.template);
              } else {
                setStatus('error');
                setMessage(data.message || 'Failed to capture fingerprint. Please try again.');
              }
              break;

            case 'error':
              setStatus('error');
              setMessage(data.message || 'An error occurred');
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Disconnected from fingerprint service');
        setServiceConnected(false);
        setScannerConnected(false);
      };

      wsRef.current.onerror = () => {
        setStatus('error');
        setMessage('Failed to connect to fingerprint service. Make sure the service is running.');
      };
    } catch (error) {
      setStatus('error');
      setMessage('Failed to connect to fingerprint service');
    }
  }, []);

  const authenticateFingerprint = async (template: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/zsmart_branch_requests/biometric/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fingerprint_template: template }),
      });

      const result = await response.json();

      if (response.ok && !result.error && result.data) {
        const authData: FingerprintAuthResult = result.data;
        setCustomerName(authData.customer_name);
        setStatus('success');
        setMessage(`Welcome, ${authData.customer_name}!`);

        // Auto-select first account and login
        if (authData.accounts && authData.accounts.length > 0) {
          const selectedAccount = authData.accounts[0];

          // Wait a moment to show success message, then auto-login
          setTimeout(() => {
            onSuccess(selectedAccount.account_number, authData.customer_name);
          }, 1500);
        } else {
          setStatus('error');
          setMessage('No accounts found for this customer.');
        }
      } else {
        setStatus('error');
        setMessage(result.message || 'Fingerprint not recognized. Please try again or use another method.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setStatus('connecting');
    setMessage('Reconnecting...');
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(connectToService, 500);
  };

  useEffect(() => {
    connectToService();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectToService]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FiCheck className="text-6xl text-green-500" />;
      case 'error':
        return <FiAlertCircle className="text-6xl text-red-500" />;
      default:
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <svg
              className="w-24 h-24 text-[#E60000]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
              />
            </svg>
          </motion.div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'from-green-500 to-green-600';
      case 'error':
        return 'from-red-500 to-red-600';
      case 'scanning':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-[#E60000] to-[#FF4444]';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
          <div className={`bg-gradient-to-r ${getStatusColor()} p-6 text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold text-center">Fingerprint Login</h2>
            <p className="text-center text-white/80 mt-1">Quick and secure authentication</p>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col items-center">
            {/* Fingerprint Icon with Animation */}
            <motion.div
              className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                status === 'scanning'
                  ? 'bg-blue-50'
                  : status === 'success'
                  ? 'bg-green-50'
                  : status === 'error'
                  ? 'bg-red-50'
                  : 'bg-gray-50'
              }`}
              animate={status === 'scanning' ? {
                boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.5)', '0 0 0 20px rgba(59, 130, 246, 0)']
              } : {}}
              transition={{ repeat: status === 'scanning' ? Infinity : 0, duration: 1.5 }}
            >
              {getStatusIcon()}
            </motion.div>

            {/* Status Message */}
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-lg font-medium mb-6 ${
                status === 'success'
                  ? 'text-green-600'
                  : status === 'error'
                  ? 'text-red-600'
                  : 'text-gray-700'
              }`}
            >
              {message}
            </motion.p>

            {/* Progress indicator for scanning/verifying */}
            {(status === 'scanning' || status === 'verifying' || status === 'connecting') && (
              <div className="w-full max-w-xs mb-6">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#E60000] to-[#FF6666]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </div>
            )}

            {/* Success customer name display */}
            {status === 'success' && customerName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 w-full text-center mb-4"
              >
                <p className="text-green-800 font-semibold">{customerName}</p>
                <p className="text-green-600 text-sm">Logging you in...</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              {status === 'error' && (
                <>
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#E60000] to-[#FF4444] text-white rounded-lg font-semibold hover:from-[#CC0000] hover:to-[#E60000] transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}

              {(status === 'connecting' || status === 'ready') && (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Service Status Footer */}
          {!serviceConnected && status !== 'success' && (
            <div className="bg-yellow-50 border-t border-yellow-200 p-4">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Fingerprint service not running.</strong><br />
                Please ensure the fingerprint scanner service is started.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FingerprintVerificationModal;
