import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign } from 'lucide-react';
import SignatureModal from './SignatureModal';
// Loaded on demand: it bundles OpenCV, which must not sit in the first page load.
import SignatureVerificationModal from './LazySignatureVerificationModal';
import SuccessModal from './SuccessModal';
import BranchServiceModal from './BranchServiceModal';
import Toast from './Toast';
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


interface WithdrawComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature?: string;
  accountNumber?: string;
  accountName?: string;
  sessionToken?: string | null;
}

const WithdrawComponent: React.FC<WithdrawComponentProps> = ({
  onBack,
  balance,
  storedSignature,
  accountNumber,
  accountName,
  sessionToken
}) => {

  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const isSubmittingRef = useRef(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNarrative, setPaymentNarrative] = useState('');
  const [amountInWords, setAmountInWords] = useState('');
  const [showBranchServiceModal, setShowBranchServiceModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [assignedTeller, setAssignedTeller] = useState<string>('');

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

  const handleVerificationSuccess = async () => {
    try {
      setShowVerificationModal(false);
      setShowBranchServiceModal(true);
    } catch (err) {
      console.error('Verification error:', err);
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const generateReferenceNumber = () => {
    // Generate a 6-digit reference number
    return String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
  };

  const handleBranchServiceConfirm = async () => {
    const branchCode = localStorage.getItem('branchCode') || '';
    try {
      setIsProcessing(true);
      const newReferenceNumber = generateReferenceNumber();
      setReferenceNumber(newReferenceNumber);

      const withdrawData = {
        amount_in_figures: parseFloat(amount),
        amount_in_words: amountInWords,
        account_number: accountNumber,
        acc_holder_name: accountName,
        transactionType: 'withdrawal',
        system: true,
        branch: branchCode,
        signature: drawnSignature,
        source_of_funds: "Cash",
        withdrawn_by: accountName,
        account_type: "Savings",
        reference_number: newReferenceNumber,
        payment_narrative: paymentNarrative || 'Cash Withdrawal',
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(withdrawData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setAssignedTeller(result.data?.assigned_to || '');
        if (process.env.NODE_ENV === 'development') console.log('Assigned teller:', result.data?.assigned_to);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowBranchServiceModal(false);
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBranchServiceDecline = async () => {
    const branchCode = localStorage.getItem('branchCode') || '';
    try {
      setIsProcessing(true);
      const newReferenceNumber = generateReferenceNumber();
      setReferenceNumber(newReferenceNumber);

      const withdrawData = {
        amount_in_figures: parseFloat(amount),
        amount_in_words: amountInWords,
        account_number: accountNumber,
        acc_holder_name: accountName,
        transactionType: 'withdrawal',
        system: false,
        branch: branchCode,
        signature: drawnSignature,
        source_of_funds: "Cash",
        withdrawn_by: accountName,
        account_type: "Savings",
        reference_number: newReferenceNumber,
        payment_narrative: paymentNarrative || 'Cash Withdrawal',
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(withdrawData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setAssignedTeller(result.data?.assigned_to || '');
        if (process.env.NODE_ENV === 'development') console.log('Assigned teller:', result.data?.assigned_to);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowBranchServiceModal(false);
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
    } finally {
      setIsProcessing(false);
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#E60000] to-[#FF0000] bg-clip-text text-transparent">Withdraw Funds</h2>
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
                  Amount to Withdraw
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
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                  placeholder="Amount in words will appear here"
                />
              </div>

              {amount && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    New balance after withdrawal: ETB {(balance - parseFloat(amount || '0')).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Error Toast — non-blocking, lets the user go Back or retry */}
            {error && (
              <Toast message={error} type="error" onClose={() => setError(null)} />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white p-3 rounded-lg font-semibold hover:from-[#B30000] hover:to-[#FF4444] transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
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
            additionalInfo={`New balance will be ETB ${(balance - parseFloat(amount)).toFixed(2)}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="withdrawal"
            storedSignature={formatSignatureUrl(storedSignature || '')}
            drawnSignature={drawnSignature}
            additionalInfo={`New balance will be ETB ${(balance - parseFloat(amount)).toFixed(2)}`}
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
            type="withdrawal"
            customerNumber={referenceNumber}
            assignedTo={assignedTeller}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WithdrawComponent;