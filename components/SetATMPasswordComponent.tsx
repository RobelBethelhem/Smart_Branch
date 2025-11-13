import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';

interface SetATMPasswordProps {
  onBack: () => void;
}

const SetATMPasswordComponent: React.FC<SetATMPasswordProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [cardNumber, setCardNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCardNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleConfirmPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('PINs do not match');
      return;
    }
    setIsSuccess(true);
    setError('');
  };

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setter(value);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="mr-4 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Set ATM PIN</h2>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="card-number"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              onSubmit={handleCardNumberSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    maxLength={16}
                    value={cardNumber}
                    onChange={handleInputChange(setCardNumber)}
                    className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter 16-digit card number"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="new-password"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    maxLength={4}
                    value={newPassword}
                    onChange={handleInputChange(setNewPassword)}
                    className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter 4-digit PIN"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </motion.form>
          )}

          {step === 3 && !isSuccess && (
            <motion.form
              key="confirm-password"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              onSubmit={handleConfirmPassword}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPassword}
                    onChange={handleInputChange(setConfirmPassword)}
                    className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Confirm 4-digit PIN"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </motion.form>
          )}

          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">PIN Set Successfully!</h3>
              <p className="text-gray-600 mb-6">Your ATM PIN has been updated.</p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 mt-4 text-center"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default SetATMPasswordComponent;