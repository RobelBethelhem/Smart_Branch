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
  encryptedToken?: string; // Optional encrypted token to verify specific customer only
}

const FingerprintVerificationModal: React.FC<FingerprintVerificationModalProps> = ({
  onClose,
  onSuccess,
  encryptedToken,
}) => {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'scanning' | 'verifying' | 'success' | 'error'>('connecting');
  const [message, setMessage] = useState('Connecting to fingerprint scanner...');
  const [serviceConnected, setServiceConnected] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);

  const disconnectService = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnection attempts
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setServiceConnected(false);
    setScannerConnected(false);
    setIsCapturing(false);
    isConnectingRef.current = false;
  }, []);

  const connectToService = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // Clean up existing connection first
    disconnectService();

    isConnectingRef.current = true;
    setStatus('connecting');
    setMessage('Connecting to fingerprint scanner...');

    try {
      const ws = new WebSocket(FINGERPRINT_SERVICE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to fingerprint service');
        isConnectingRef.current = false;
        setServiceConnected(true);
        setMessage('Checking scanner status...');
        ws.send(JSON.stringify({ action: 'check' }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Fingerprint service message:', data);

          switch (data.type) {
            case 'status':
              setScannerConnected(data.connected);
              if (data.connected) {
                setStatus('ready');
                setMessage('Scanner ready. Place your finger and click "Scan Fingerprint"');
                setIsCapturing(false);
              } else {
                setStatus('error');
                setMessage('Scanner not detected. Please connect ZK9500 scanner and try again.');
                setIsCapturing(false);
              }
              break;

            case 'capturing':
              setStatus('scanning');
              setIsCapturing(true);
              setMessage(data.message || 'Place your finger on the scanner...');
              break;

            case 'captured':
              setIsCapturing(false);
              if (data.success && data.template) {
                setStatus('verifying');
                setMessage('Fingerprint captured! Verifying...');
                // Send to backend for authentication
                await authenticateFingerprint(data.template);
              } else {
                setStatus('ready');
                setMessage(data.message || 'Capture failed. Place your finger and try again.');
              }
              break;

            case 'error':
              setIsCapturing(false);
              // If it's "already in progress", just wait
              if (data.message && data.message.includes('already in progress')) {
                // Don't change status, just wait
                console.log('Capture in progress, waiting...');
              } else {
                setStatus('ready');
                setMessage(data.message || 'An error occurred. Please try again.');
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from fingerprint service');
        isConnectingRef.current = false;
        setServiceConnected(false);
        setScannerConnected(false);
        setIsCapturing(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        setStatus('error');
        setMessage('Failed to connect to fingerprint service. Make sure the service is running.');
        setIsCapturing(false);
      };
    } catch (error) {
      console.error('Connection error:', error);
      isConnectingRef.current = false;
      setStatus('error');
      setMessage('Failed to connect to fingerprint service');
      setIsCapturing(false);
    }
  }, [disconnectService]);

  const startCapture = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Not connected. Please wait...');
      connectToService();
      return;
    }

    if (isCapturing) {
      console.log('Capture already in progress');
      return;
    }

    setIsCapturing(true);
    setStatus('scanning');
    setMessage('Place your finger on the scanner...');
    wsRef.current.send(JSON.stringify({ action: 'capture' }));
  }, [isCapturing, connectToService]);

  const authenticateFingerprint = async (template: string) => {
    try {
      const requestBody: {fingerprint_template: string, encryptedToken?: string} = {
        fingerprint_template: template
      };

      // If encrypted token is provided, server will decrypt and extract CIF
      if (encryptedToken) {
        requestBody.encryptedToken = encryptedToken;
      }

      const response = await fetch('/api/biometric/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        setStatus('ready');
        setMessage(result.message || 'Fingerprint not recognized. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setStatus('ready');
      setMessage('Authentication failed. Please try again.');
    }
  };

  const handleRetry = useCallback(() => {
    setStatus('connecting');
    setMessage('Reconnecting...');
    setIsCapturing(false);

    // Fully disconnect and reconnect
    disconnectService();

    // Wait a moment before reconnecting
    setTimeout(() => {
      connectToService();
    }, 500);
  }, [disconnectService, connectToService]);

  useEffect(() => {
    connectToService();

    return () => {
      disconnectService();
    };
  }, [connectToService, disconnectService]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FiCheck className="text-6xl text-green-500" />;
      case 'error':
        return <FiAlertCircle className="text-6xl text-red-500" />;
      case 'scanning':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <svg
              className="w-24 h-24 text-blue-500"
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
      case 'ready':
        return (
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
        );
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <svg className="w-24 h-24 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
      case 'verifying':
        return 'from-purple-500 to-purple-600';
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
                  : status === 'verifying'
                  ? 'bg-purple-50'
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
                  : status === 'scanning'
                  ? 'text-blue-600'
                  : status === 'verifying'
                  ? 'text-purple-600'
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
                    className={`h-full ${status === 'verifying' ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-[#E60000] to-[#FF6666]'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: status === 'scanning' ? 15 : 3, repeat: status === 'connecting' ? Infinity : 0 }}
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
              {/* Ready state - show Scan button */}
              {status === 'ready' && scannerConnected && (
                <>
                  <button
                    onClick={startCapture}
                    disabled={isCapturing}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#E60000] to-[#FF4444] text-white rounded-lg font-semibold hover:from-[#CC0000] hover:to-[#E60000] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                    </svg>
                    Scan Fingerprint
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Error state - show retry and cancel */}
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

              {/* Connecting or scanning - show cancel only */}
              {(status === 'connecting' || status === 'scanning' || status === 'verifying') && (
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
          {!serviceConnected && status !== 'success' && status !== 'connecting' && (
            <div className="bg-yellow-50 border-t border-yellow-200 p-4">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Fingerprint service not running.</strong><br />
                Start the service with: <code className="bg-yellow-100 px-1 rounded">npm start</code> in fingerprint folder
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FingerprintVerificationModal;
