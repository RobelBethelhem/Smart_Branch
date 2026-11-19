import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign } from 'lucide-react';
import SignatureModal from "./SignatureModal";
import SuccessModal from "./SuccessModal";
// Loaded on demand: it bundles OpenCV, which must not sit in the first page load.
import SignatureVerificationModal from "./LazySignatureVerificationModal";
import { API } from '../utils/api';
import base64 from 'base64-js';
import BranchServiceModal from './BranchServiceModal';
import Toast from './Toast';
import { decryptResponse } from '@/utils/responseDecryption';
import { encryptPayload } from '@/utils/requestEncryption';

// Utility function to convert numbers to words
const numberToWords = (num: number): string => {
  const belowTwenty = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
    'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
  ];
  const scales = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion'];

  if (num === 0) return 'zero';

  const convertThreeDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return belowTwenty[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + belowTwenty[n % 10] : '') + ' ';
    return belowTwenty[Math.floor(n / 100)] + ' hundred ' + convertThreeDigits(n % 100);
  };

  let words = '';
  let scaleIndex = 0;

  while (num > 0) {
    const threeDigits = num % 1000;
    if (threeDigits !== 0) {
      words = convertThreeDigits(threeDigits) + scales[scaleIndex] + ' ' + words;
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return words.trim();
};

interface DepositComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature?: string;
  accountNumber?: string;
  accountName?: string;
  sessionToken?: string | null;
}

// Add this interface for the address structure
interface DepositorAddress {
  city: string;
  subcity: string;
  woreda: string;
  house_number: string;
  telephone: string;
}

// Add this function to extract customer number from account number
const extractCustomerNumber = (accountNumber: string): string => {
  return accountNumber.substring(7, 14);
};

const DepositComponent: React.FC<DepositComponentProps> = ({ onBack, balance, storedSignature, accountNumber, accountName, sessionToken }) => {
  if (process.env.NODE_ENV === 'development') console.log('Account Number:', accountNumber);
  if (process.env.NODE_ENV === 'development') console.log('Account Name:', accountName);
  const isSubmittingRef = useRef(false);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedTeller, setAssignedTeller] = useState<string>('');
  const [showBranchServiceModal, setShowBranchServiceModal] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue > 0 && numValue <= 1000000)) { // Added maximum limit
      setAmount(value);
      setError('');
    } else if (numValue > 1000000) {
      setError('Maximum deposit amount is ETB 1,000,000');
    } else {
      setError('Amount must be greater than 0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAmount()) {
      setShowSignatureModal(true);
    }
  };

  const validateAmount = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (depositAmount > 1000000) {
      setError('Maximum deposit amount is ETB 1,000,000');
      return false;
    }
    return true;
  };

  const handleSignatureDraw = (signature: string) => {
    setDrawnSignature(signature);
    setShowSignatureModal(false);
    setShowVerificationModal(true);
  };

  const fetchDepositorAddress = async () => {
    try {
      // Extract customer number from account number
      if (!accountNumber) return null;
      const customerNumber = accountNumber.substring(6, 13);
      if (process.env.NODE_ENV === 'development') console.log('Extracted customer number:', customerNumber);
      
      const response = await fetch(`/api/customer-address/${customerNumber}`);
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('Address response:', data);
      if (data.success && data.encrypted) {
        return await decryptResponse(data.encrypted);
      }
      return null;
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
  };

  const handleVerificationSuccess = async (signature: string) => {
    setDrawnSignature(signature);
    setShowVerificationModal(false);
    setShowBranchServiceModal(true);
  };

  const handleBranchServiceConfirm = async () => {
    if (isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const addressData = await fetchDepositorAddress();
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';
      
      const depositData = {
        acc_holder_name: accountName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        source_of_funds: "Cash",
        signature: drawnSignature,
        account_number: accountNumber,
        deposited_by: accountName,
        depositor_address: addressData || {
          city: '',
          subcity: '',
          woreda: '',
          house_number: '',
          telephone: ''
        },
        account_type: "Savings",
        Customer_Unique_Number: uniqueNumber,
        system: true,
        branch: branchCode,
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(depositData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setTransactionNumber(result.data?.Queue_number || '');
        setAssignedTeller(result.data.assigned_to || '');
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleBranchServiceDecline = async () => {
    if (isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const addressData = await fetchDepositorAddress();
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';
      
      const depositData = {
        acc_holder_name: accountName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        source_of_funds: "Cash",
        signature: drawnSignature,
        account_number: accountNumber,
        deposited_by: accountName,
        depositor_address: addressData || {
          city: '',
          subcity: '',
          woreda: '',
          house_number: '',
          telephone: ''
        },
        account_type: "Savings",
        Customer_Unique_Number: uniqueNumber,
        system: false,
        branch: branchCode,
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(depositData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setTransactionNumber(result.data?.Queue_number || '');
        setAssignedTeller(result.data.assigned_to || '');
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerificationError = (errorMessage: string) => {
    console.error(errorMessage);
    // Close the blocking branch-service modal and surface the error as a toast
    setShowBranchServiceModal(false);
    setError(errorMessage);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
  };

  // Calculate if the button should be disabled
  const isDepositButtonDisabled = !amount || 
    parseFloat(amount) <= 0 || 
    parseFloat(amount) > 1000000 ||
    !!error;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
       
        className="w-full max-w-7xl mx-auto p-6 space-y-8 bg-gray-50"
      >
       <div className="flex items-center justify-between">
                 <button 
                   onClick={onBack}
                   className="flex items-center gap-2 text-[#E60000] hover:text-[#FF0000] transition-colors"
                 >
                   <ArrowLeft className="w-6 h-6" />
                   <span className="text-lg font-semibold">Back</span>
                 </button>
                 <h2 className="text-3xl font-bold bg-gradient-to-r from-[#E60000] to-[#FF0000] bg-clip-text text-transparent">Deposit Funds</h2>
               </div>
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Available Balance</p>
                </div>
                <p className="font-semibold text-lg">ETB {balance.toFixed(2)}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Account Number</p>
                </div>
                <p className="font-semibold text-lg">{accountNumber}</p>
              </div>
            </div>

            {/* Amount Input Section */}
            <div className="space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max="1000000"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount in Words
                </label>
                <input
                  type="text"
                  value={amount ? numberToWords(parseInt(amount)) : ''}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                  placeholder="Amount in words will appear here"
                />
              </div>

              {amount && !error && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    New balance after deposit: ETB {(balance + parseFloat(amount || '0')).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Error Toast — non-blocking, lets the user go Back or retry */}
            {error && (
              <Toast message={error} type="error" onClose={() => setError('')} />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white p-3 rounded-lg font-semibold hover:from-[#B30000] hover:to-[#FF4444] transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isDepositButtonDisabled || loading}
            >
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </form>
      </motion.div>

      <AnimatePresence>
        {showSignatureModal && (
          <SignatureModal
            amount={amount}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="deposit"
            additionalInfo={`New balance will be ETB ${(balance + parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="deposit"
            storedSignature={storedSignature || ''}
            drawnSignature={drawnSignature}
            additionalInfo={`New balance will be ETB ${(balance + parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showBranchServiceModal && (
          <BranchServiceModal
            branchCode={localStorage.getItem('branchCode') || ''}
            onConfirm={handleBranchServiceConfirm}
            onDecline={handleBranchServiceDecline}
          />
        )}

        {showSuccessModal && (
          <SuccessModal
            amount={amount}
            onClose={handleSuccessClose}
            type="deposit"
            queueNumber={transactionNumber}
            assignedTo={assignedTeller}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DepositComponent;