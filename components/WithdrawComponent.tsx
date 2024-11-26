import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign } from 'lucide-react';
import SignatureModal from './SignatureModal';
import SignatureVerificationModal from './SignatureVerificationModal';
import SuccessModal from './SuccessModal';



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


interface WithdrawComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature: string;
  accountNumber: string;  // Add this
  accountName: string;  
}

const WithdrawComponent: React.FC<WithdrawComponentProps> = ({ 
  onBack, 
  balance,
  storedSignature,
  accountNumber,
  accountName
}) => {

  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const isSubmittingRef = useRef(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNarrative, setPaymentNarrative] = useState('');
  const [amountInWords, setAmountInWords] = useState('');

  const validateAmount = () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (withdrawAmount > 50000) {
      setError('Maximum withdrawal amount is ETB 50,000');
      return false;
    }
    if (withdrawAmount > balance) {
      setError('Insufficient balance');
      return false;
    }
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
      setAmount(value);
      setError('');
      // Update amount in words when amount changes
      if (value && !isNaN(parseFloat(value))) {
        setAmountInWords(numberToWords(parseInt(value)));
      } else {
        setAmountInWords('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAmount()) {
      setShowSignatureModal(true);
    }
  };

  const handleSignatureDraw = (signature: string) => {
    setDrawnSignature(signature);
    setShowSignatureModal(false);
    setShowVerificationModal(true);
  };

  const formatSignatureUrl = (signature: string) => {
    if (signature.startsWith('data:')) {
      return signature;
    }
    try {
      // If it's a base64 string without data URL prefix, add it
      return `data:image/jpeg;base64,${signature}`;
    } catch (error) {
      console.error('Error formatting signature:', error);
      return '';
    }
  };

  const handleVerificationSuccess = async (signature: string) => {
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, skipping...');
      return;
    }
  
    console.log('Starting withdrawal verification process...');
    isSubmittingRef.current = true;
    setIsProcessing(true);
  
    try {
      const uniqueNumber = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated unique number:', uniqueNumber);

      const withdrawData = {
        acc_holder_name: accountName,
        amount_in_words: amountInWords,
        amount_in_figures: parseFloat(amount),
        source_of_funds: "Cash",
        signature: signature,
        account_number: accountNumber,
        withdrawn_by: accountName,
        account_type: "Savings",
        Customer_Unique_Number: uniqueNumber,
        payment_narrative: paymentNarrative || 'Cash Withdrawal',
      };
  
      console.log('Prepared withdrawal data:', withdrawData);
  
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawData),
      }).then(res => res.json());
  
      console.log('API response:', result);
  
      if (!result.error) {
        console.log('Withdrawal successful, showing success modal...');
        setShowVerificationModal(false);
        setShowSuccessModal(true);
        setTransactionNumber(uniqueNumber);
      } else {
        console.error('API error:', result.message);
        throw new Error(result.message);
      }
    } catch (err: unknown) {
      console.error('Withdrawal error:', err);
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log('Resetting submission state...');
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerificationError = (errorMessage: string) => {
    setError(errorMessage);
    setShowVerificationModal(false);
    setShowSignatureModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
    onBack();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="mr-4 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Withdraw Funds</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Withdraw
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
                min="1"
                max="50000"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
            </label>
            <input
              type="text"
              value={amountInWords}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              disabled
              placeholder="Amount in words will appear here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Balance
            </label>
            <p className="text-lg font-semibold">${balance.toFixed(2)}</p>
            {amount && (
              <p className="text-sm text-gray-600 mt-1">
                New balance after withdrawal: ${(balance - parseFloat(amount || '0')).toFixed(2)}
              </p>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Withdraw'}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {showSignatureModal && (
          <SignatureModal
            amount={amount}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="withdrawal"
            additionalInfo={`New balance will be $${(balance - parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="withdrawal"
            storedSignature={formatSignatureUrl(storedSignature)}
            drawnSignature={drawnSignature}
            additionalInfo={`New balance will be $${(balance - parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showSuccessModal && (
          <SuccessModal
            amount={amount}
            onClose={handleSuccessClose}
            type="withdrawal"
            customerNumber={transactionNumber}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WithdrawComponent;