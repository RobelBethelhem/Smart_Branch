import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, RefreshCw } from 'lucide-react';
import SignatureModal from './SignatureModal';
import SuccessModal from './SuccessModal';
// Loaded on demand: it bundles OpenCV, which must not sit in the first page load.
import SignatureVerificationModal from './LazySignatureVerificationModal';

const mockExchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.14,
  CAD: 1.25,
  ETB: 120.0802,
};

interface ForeignExchangeComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature?: string;
}

const ForeignExchangeComponent: React.FC<ForeignExchangeComponentProps> = ({ onBack, balance, storedSignature }) => {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('ETB');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');

  useEffect(() => {
    handleConvert();
  }, [amount, fromCurrency, toCurrency]);

  const handleConvert = () => {
    setError('');
    setConvertedAmount(null);

    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return;
    }

    const fromRate = mockExchangeRates[fromCurrency];
    const toRate = mockExchangeRates[toCurrency];
    const result = (inputAmount / fromRate) * toRate;
    setConvertedAmount(result.toFixed(2));
  };

  const validateForm = () => {
    setError('');
    const inputAmount = parseFloat(amount);
    
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (fromCurrency === 'USD' && inputAmount > balance) {
      setError('Insufficient funds');
      return false;
    }

    if (fromCurrency === toCurrency) {
      setError('Please select different currencies');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSignatureModal(true);
    }
  };

  const handleSignatureConfirm = (signature: string) => {
    setShowSignatureModal(false);
    console.log(`Processing exchange of ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency} with signature:`, signature);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
    setConvertedAmount(null);
  };

  const handleSignatureDraw = (signature: string) => {
    setDrawnSignature(signature);
    setShowSignatureModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationSuccess = async () => {
    setShowVerificationModal(false);
    setShowSuccessModal(true);
  };

  const handleVerificationError = (error: string) => {
    setError(error);
    setShowVerificationModal(false);
  };

  const isFormValid = amount && 
    parseFloat(amount) > 0 && 
    (fromCurrency !== 'USD' || parseFloat(amount) <= balance) &&
    fromCurrency !== toCurrency;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Foreign Exchange</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="fromCurrency" className="block text-sm font-medium text-gray-700 mb-2">
                  From Currency
                </label>
                <select
                  id="fromCurrency"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {Object.keys(mockExchangeRates).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="toCurrency" className="block text-sm font-medium text-gray-700 mb-2">
                  To Currency
                </label>
                <select
                  id="toCurrency"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {Object.keys(mockExchangeRates).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              {convertedAmount && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-medium">
                    {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Rate: 1 {fromCurrency} = {(mockExchangeRates[toCurrency] / mockExchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
                  </p>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mb-4"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                className={`w-full p-3 rounded-md text-lg font-medium transition-colors
                  ${!isFormValid 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                disabled={!isFormValid}
              >
                Exchange
              </button>
            </form>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-4">Exchange Rates</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Currency</th>
                    <th className="text-right">Rate (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mockExchangeRates).map(([currency, rate]) => (
                    <tr key={currency}>
                      <td>{currency}</td>
                      <td className="text-right">{rate.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <RefreshCw className="w-4 h-4 mr-1" />
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSignatureModal && (
          <SignatureModal
            amount={`${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="exchange"
          />
        )}

        {showSuccessModal && (
          <SuccessModal
            amount={`${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`}
            onClose={handleSuccessClose}
            type="exchange"
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={`${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="exchange"
            storedSignature={storedSignature || ''}
            drawnSignature={drawnSignature}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ForeignExchangeComponent;