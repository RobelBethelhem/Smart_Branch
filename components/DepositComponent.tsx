import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign } from 'lucide-react';
import SignatureModal from "./SignatureModal";
import SuccessModal from "./SuccessModal";
import SignatureVerificationModal from "./SignatureVerificationModal";
import { API } from '../utils/api';
import base64 from 'base64-js';

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
  storedSignature: string;
  accountNumber: string;
  accountName: string;
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

const DepositComponent: React.FC<DepositComponentProps> = ({ onBack, balance, storedSignature, accountNumber, accountName }) => {
  console.log('Account Number:', accountNumber);
  console.log('Account Name:', accountName);
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue > 0 && numValue <= 1000000)) { // Added maximum limit
      setAmount(value);
      setError('');
    } else if (numValue > 1000000) {
      setError('Maximum deposit amount is $1,000,000');
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
      setError('Maximum deposit amount is $1,000,000');
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
      const customerNumber = accountNumber.substring(6, 13);
      console.log('Extracted customer number:', customerNumber);
      
      const response = await fetch(`/api/customer-address/${customerNumber}`);
      const data = await response.json();
      console.log('Address response:', data);
      return data.success ? data.address : null;
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
  };

  const handleVerificationSuccess = async (signature: string) => {
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, skipping...');
      return; // Prevent multiple submissions
    }
    
    console.log('Starting verification success process...');
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      // Fetch address first
      const addressData = await fetchDepositorAddress();
      console.log('Fetched address data:', addressData);
      
      // Generate unique 6-digit number
      const uniqueNumber = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated unique number:', uniqueNumber);
      
      // Prepare deposit data with account info from props
      const depositData = {
        acc_holder_name: accountName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        source_of_funds: "Cash",
        signature: signature,
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
      };

      console.log('Prepared deposit data:', depositData);

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData),
      }).then(res => res.json());
      
      console.log('API response:', result);

      if (!result.error) {
        console.log('Deposit successful, showing success modal...');
        setShowVerificationModal(false);
        setShowSuccessModal(true);
        setTransactionNumber(uniqueNumber);
      } else {
        console.error('API error:', result.message);
        throw new Error(result.message);
      }
    } catch (err: unknown) {
      console.error('Deposit error:', err);
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log('Resetting submission state...');
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerificationError = (errorMessage: string) => {
    // Handle error (e.g., show a notification)
    console.error(errorMessage);
    // You can set an error state here to display the message to the user
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
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Deposit Funds</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Deposit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="1000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="amountInWords" className="block text-sm font-medium text-gray-700 mb-2">
                Amount in Words
              </label>
              <input
                type="text"
                id="amountInWords"
                value={amount ? numberToWords(parseInt(amount)) : ''}
                readOnly
                className="block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Balance
            </label>
            <p className="text-lg font-semibold">${balance.toFixed(2)}</p>
            {amount && !error && (
              <p className="text-sm text-gray-600 mt-1">
                New balance after deposit: ${(balance + parseFloat(amount || '0')).toFixed(2)}
              </p>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className={`w-full p-3 rounded-md text-lg font-medium transition-colors
              ${isDepositButtonDisabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
            disabled={isDepositButtonDisabled}
          >
            Deposit
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
            additionalInfo={`New balance will be $${(balance + parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="deposit"
            storedSignature={storedSignature}
            drawnSignature={drawnSignature}
            additionalInfo={`New balance will be $${(balance + parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showSuccessModal && (
         <SuccessModal
         amount={amount}
         onClose={handleSuccessClose}
         type="deposit"
         customerNumber={transactionNumber}  // Changed from transactionNumber to customerNumber
       />
        )}
      </AnimatePresence>
    </>
  );
};

export default DepositComponent;