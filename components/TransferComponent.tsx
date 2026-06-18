import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, User, Building } from 'lucide-react';
import SignatureModal from './SignatureModal';
import SuccessModal from './SuccessModal';
import SignatureVerificationModal from './SignatureVerificationModal';
import BranchServiceModal from './BranchServiceModal';
import Toast from './Toast';
import { decryptResponse } from '@/utils/responseDecryption';
import { encryptPayload } from '@/utils/requestEncryption';

interface TransferComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature?: string;
  accountNumber?: string;
  accountName?: string;
  sessionToken?: string | null;
}

interface VerifyAccountModalProps {
  accountNumber: string;
  recipientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AccountData {
  BRANCH_CODE: string;
  CUST_AC_NO: string;
  ACC_DESC: string;
  NO_DEBIT: string;
  NO_CREDIT: string;
  DORMANT: string | null;
  CUST_NO: string;
  ACCOUNT_CLASS: string;
  CCY: string;
  CURRENT_BALANCE: number;
  AVAILABLE_BALANCE: number;
  BLOCKED_AMOUNT: number;
  PROFILE_IMAGE: string | null;
  SIGN_IMAGE: string | null;
}



const numberToWords = (num: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  if (num === 0) return 'zero';

  const convertLessThanThousand = (n: number): string => {
    if (n >= 100) {
      return ones[Math.floor(n / 100)] + ' hundred ' + convertLessThanThousand(n % 100);
    }
    if (n >= 20) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    if (n >= 10) {
      return teens[n - 10];
    }
    return ones[n];
  };

  const convert = (n: number): string => {
    if (n >= 1000000000) {
      return convert(Math.floor(n / 1000000000)) + ' billion ' + convert(n % 1000000000);
    }
    if (n >= 1000000) {
      return convert(Math.floor(n / 1000000)) + ' million ' + convert(n % 1000000);
    }
    if (n >= 1000) {
      return convert(Math.floor(n / 1000)) + ' thousand ' + convert(n % 1000);
    }
    return convertLessThanThousand(n);
  };

  return convert(num).trim();
};


const VerifyAccountModal: React.FC<VerifyAccountModalProps> = ({
  accountNumber,
  recipientName,
  onConfirm,
  onCancel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-xl font-bold mb-4">Verify Account Details</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Account Number:</p>
          <p className="text-lg font-semibold">{accountNumber}</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-600">Account Holder:</p>
          <p className="text-lg font-semibold">{recipientName}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


const TransferComponent: React.FC<TransferComponentProps> = ({
  onBack,
  balance,
  storedSignature,
  accountNumber,
  accountName,
  sessionToken
}) => {
  const [amount, setAmount] = useState<string>('');
  const [recipientAccount, setRecipientAccount] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [verifiedName, setVerifiedName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [amountInWords, setAmountInWords] = useState('');
  const [paymentNarrative, setPaymentNarrative] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const isSubmittingRef = useRef(false);
  const [showBranchServiceModal, setShowBranchServiceModal] = useState(false);
  const [assignedTeller, setAssignedTeller] = useState<string>('');
  const [loading, setLoading] = useState(false); 

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue > 0 && numValue <= balance)) {
      setAmount(value);
      setError('');
      // Update amount in words
      if (value && !isNaN(numValue)) {
        setAmountInWords(numberToWords(parseInt(value)));
      } else {
        setAmountInWords('');
      }
    } else {
      setError('Amount must be greater than 0 and not exceed your balance');
    }
  };
  
  // Function to verify account with the API
  const verifyAccount = async (accountNumber: string) => {
    try {
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber }),
      });

      const data = await response.json();

      if (data.success && data.encrypted) {
        const decrypted = await decryptResponse(data.encrypted);
        return decrypted as AccountData;
      } else {
        throw new Error(data.message || 'Account not found');
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle account number input with verification
  const handleAccountNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setRecipientAccount(value);
    setError('');

    if (value.length === 16) { // Assuming account numbers are 16 digits
      setIsVerifying(true);
      try {
        const accountData = await verifyAccount(value);
        setVerifiedName(accountData.ACC_DESC);
        setShowVerifyModal(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify account');
        setRecipientName('');
      } finally {
        setIsVerifying(false);
      }
    } else {
      setRecipientName('');
    }
  };

  // Handle verification modal actions
  const handleVerifyConfirm = () => {
    setRecipientName(verifiedName);
    setShowVerifyModal(false);
  };

  const handleVerifyCancel = () => {
    setRecipientAccount('');
    setRecipientName('');
    setShowVerifyModal(false);
  };

  const validateForm = () => {
    setError('');
    const transferAmount = parseFloat(amount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (transferAmount > balance) {
      setError('Insufficient funds');
      return false;
    }

    if (!recipientName || !recipientAccount) {
      setError('Please enter recipient details');
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

  const handleSignatureDraw = (signature: string) => {
    setDrawnSignature(signature);
    setShowSignatureModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationSuccess = async (signature: string) => {
    setDrawnSignature(signature);
    setShowVerificationModal(false);
    setShowBranchServiceModal(true);
  };

  const handleBranchServiceConfirm = async () => {
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';
      const beneficiaryBranch = recipientAccount.substring(0, 3);

      const transferData = {
        acc_holder_name: accountName,
        beneficiary_name: recipientName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        signature: drawnSignature,
        account_number: accountNumber,
        beneficiary_account_number: recipientAccount,
        beneficiary_branch: beneficiaryBranch,
        transfer_type: "Internal",
        account_type: "Savings",
        Customer_Unique_Number: uniqueNumber,
        system: true,
        branch: branchCode,
        payment_narrative: paymentNarrative || '',
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(transferData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setTransactionNumber(result.data.Customer_Unique_Number || uniqueNumber);
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
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';
      const beneficiaryBranch = recipientAccount.substring(0, 3);

      const transferData = {
        acc_holder_name: accountName,
        beneficiary_name: recipientName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        signature: drawnSignature,
        account_number: accountNumber,
        beneficiary_account_number: recipientAccount,
        beneficiary_branch: beneficiaryBranch,
        transfer_type: "Internal",
        account_type: "Savings",
        Customer_Unique_Number: uniqueNumber,
        system: false,
        branch: branchCode,
        payment_narrative: paymentNarrative || '',
        sessionToken,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: await encryptPayload(transferData) }),
      }).then(res => res.json());

      if (!result.error) {
        setShowBranchServiceModal(false);
        setTransactionNumber(result.data.Customer_Unique_Number || uniqueNumber);
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

  const handleVerificationError = (error: string) => {
    setShowBranchServiceModal(false);
    setShowVerificationModal(false);
    setError(error);
  };

  const isFormValid = (): boolean => {
    const transferAmount = parseFloat(amount);
    return (
      !isVerifying && // Not currently verifying an account
      !error && // No errors present
      transferAmount > 0 && // Amount is positive
      transferAmount <= balance && // Amount doesn't exceed balance
      recipientName.length > 0 && // Has recipient name
      recipientAccount.length === 16 // Has valid account number
    );
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Reset form fields
    setAmount('');
    setRecipientAccount('');
    setRecipientName('');
    setVerifiedName('');
    setError('');
    // Optional: navigate back or perform other cleanup
    onBack(); // If you want to go back to the main screen after successful transfer
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="w-full max-w-7xl mx-auto p-6 space-y-8 bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#E60000] hover:text-[#FF0000] transition-colors">
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-semibold">Back</span>
          </button>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#E60000] to-[#FF0000] bg-clip-text text-transparent">Transfer Funds</h2>
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

            {/* Transfer Details */}
            <div className="space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Transfer
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
                    max={balance}
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
                  value={amountInWords}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                  placeholder="Amount in words will appear here"
                />
              </div>

              <div>
                <label htmlFor="recipientAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Account Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="recipientAccount"
                    value={recipientAccount}
                    onChange={handleAccountNumberChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                    placeholder="Enter 16-digit account number"
                    maxLength={16}
                  />
                </div>
                {isVerifying && (
                  <p className="text-sm text-[#FF6666] mt-1">Verifying account...</p>
                )}
              </div>

              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="recipientName"
                    value={recipientName}
                    readOnly
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder="Recipient name will appear here"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Narrative (Optional)
                </label>
                <textarea
                  value={paymentNarrative}
                  onChange={(e) => setPaymentNarrative(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                  placeholder="Enter payment details (optional)"
                  rows={3}
                />
              </div>

              {amount && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    New balance after transfer: ETB {(balance - parseFloat(amount || '0')).toFixed(2)}
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
              disabled={!isFormValid() || loading}
            >
              {loading ? 'Processing...' : 'Transfer'}
            </button>
          </form>
      </motion.div>

      <AnimatePresence>
        {showVerifyModal && (
          <VerifyAccountModal
            accountNumber={recipientAccount}
            recipientName={verifiedName}
            onConfirm={handleVerifyConfirm}
            onCancel={handleVerifyCancel}
          />
        )}
        {showSignatureModal && (
          <SignatureModal
            amount={amount}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="transfer"
            additionalInfo={`to ${recipientName} (${recipientAccount})`}
          />
        )}
        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="transfer"
            storedSignature={storedSignature || ''}
            drawnSignature={drawnSignature}
            additionalInfo={`to ${recipientName} (${recipientAccount})`}
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
            type="transfer"
            customerNumber={transactionNumber}
            assignedTo={assignedTeller}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TransferComponent;