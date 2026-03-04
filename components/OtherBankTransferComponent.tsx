import React, { useState , useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, User, Building } from 'lucide-react';
import SignatureModal from './SignatureModal';
import SuccessModal from './SuccessModal';
import SignatureVerificationModal from './SignatureVerificationModal';
import BranchServiceModal from './BranchServiceModal';
import { decryptResponse } from '@/utils/responseDecryption';
import { encryptPayload } from '@/utils/requestEncryption';

interface OtherBankTransferComponentProps {
  onBack: () => void;
  balance?: number;
  storedSignature?: string;
  accountNumber?: string;  // Add this
  accountName?: string;
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

const OtherBankTransferComponent: React.FC<OtherBankTransferComponentProps> = ({ 
  onBack,
  balance = 0,
  storedSignature,
  accountNumber,
  accountName
}) => {
  const [amount, setAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientAccount, setRecipientAccount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transferType] = useState<string>('RTGS');
  const [otherBankName, setOtherBankName] = useState<string>('');
  const [beneficiaryBranch, setBeneficiaryBranch] = useState<string>('HO');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [showBranchServiceModal, setShowBranchServiceModal] = useState(false);
  const [assignedTeller, setAssignedTeller] = useState<string>('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue > 0 && numValue <= balance)) {
      setAmount(value);
      setError('');
    } else {
      setError('Amount must be greater than 0 and not exceed your balance');
    }
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

    if (!recipientName || !recipientAccount || !otherBankName) {
      setError('Please fill in all required fields');
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
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const addressData = await fetchDepositorAddress();
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';

      const transferData = {
        acc_holder_name: accountName,
        beneficiary_name: recipientName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        signature: drawnSignature,
        telephone: addressData?.TELEPHONE || '',
        address: addressData?.CITY + ' ' + addressData?.SUBCITY + ' ' + addressData?.WOREDA + ' ' + addressData?.HOUSE_NUMBER || '',
        account_number: accountNumber || '',
        acc_holder_branch: accountNumber?.substring(0, 3) || '',
        beneficiary_account_number: recipientAccount,
        beneficiary_bank: otherBankName,
        transfer_type: "RTGS",
        account_type: "Savings",
        beneficiary_branch: beneficiaryBranch,
        Customer_Unique_Number: uniqueNumber,
        system: true,
        branch: branchCode,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/other_bank_transfer`, {
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
      const addressData = await fetchDepositorAddress();
      const uniqueNumber = String(crypto.getRandomValues(new Uint32Array(1))[0]).slice(0, 8).padStart(8, '0');
      const branchCode = localStorage.getItem('branchCode') || '';

      const transferData = {
        acc_holder_name: accountName,
        beneficiary_name: recipientName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        signature: drawnSignature,
        telephone: addressData?.TELEPHONE || '',
        address: addressData?.CITY + ' ' + addressData?.SUBCITY + ' ' + addressData?.WOREDA + ' ' + addressData?.HOUSE_NUMBER || '',
        account_number: accountNumber || '',
        acc_holder_branch: accountNumber?.substring(0, 3) || '',
        beneficiary_account_number: recipientAccount,
        beneficiary_bank: otherBankName,
        transfer_type: "RTGS",
        account_type: "Savings",
        beneficiary_branch: beneficiaryBranch,
        Customer_Unique_Number: uniqueNumber,
        system: false,
        branch: branchCode,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/other_bank_transfer`, {
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
    setError(error);
    setShowVerificationModal(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
    setRecipientName('');
    setRecipientAccount('');
    setOtherBankName('');
    setBeneficiaryBranch('HO');
  };

  const isFormValid = amount && 
    parseFloat(amount) > 0 && 
    parseFloat(amount) <= balance && 
    recipientName && 
    recipientAccount && 
    otherBankName;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        
        className="w-full max-w-7xl mx-auto p-6 space-y-8 bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#E60000] hover:text-[#FF0000] transition-colors">
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-semibold">Back</span>
          </button>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#E60000] to-[#FF0000] bg-clip-text text-transparent">Other Bank Transfer</h2>
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
                  <Building className="text-[#E60000]" />
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Your Account</p>
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
                  value={amount ? numberToWords(parseInt(amount)) : ''}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                  placeholder="Amount in words will appear here"
                />
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
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                    placeholder="Recipient Name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="otherBankName" className="block text-sm font-medium text-gray-700 mb-2">
                  Other Bank
                </label>
                <select
                  id="otherBankName"
                  value={otherBankName}
                  onChange={(e) => setOtherBankName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a Bank</option>
                  <option value="Awash">Awash Bank</option>
                  <option value="CBE">Commercial Bank of Ethiopia</option>
                  <option value="Abay">Abay Bank</option>
                  <option value="Dashen">Dashen Bank</option>
                  <option value="Tsehay">Tsehay Bank</option>
                  <option value="Tsedey">Tsedey Bank</option>
                </select>
              </div>

              <div>
                <label htmlFor="beneficiaryBranch" className="block text-sm font-medium text-gray-700 mb-2">
                  Beneficiary Branch (Optional)
                </label>
                <input
                  type="text"
                  id="beneficiaryBranch"
                  value={beneficiaryBranch}
                  onChange={(e) => setBeneficiaryBranch(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                  placeholder="Branch (default: HO)"
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
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all duration-200"
                    placeholder="Account Number"
                  />
                </div>
              </div>

              {amount && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    New balance after transfer: ETB {(balance - parseFloat(amount || '0')).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-50 border border-red-200"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white p-3 rounded-lg font-semibold hover:from-[#B30000] hover:to-[#FF4444] transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={!isFormValid || loading}
            >
              {loading ? 'Processing...' : 'Transfer'}
            </button>
          </form>
      </motion.div>

      <AnimatePresence>
        {showSignatureModal && (
          <SignatureModal
            amount={amount}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="otherBankTransfer"
            additionalInfo={`to ${recipientName} at ${otherBankName}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="otherBankTransfer"
            storedSignature={storedSignature || ''}
            drawnSignature={drawnSignature}
            additionalInfo={`to ${recipientName} at ${otherBankName}`}
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
            type="otherBankTransfer"
            customerNumber={transactionNumber}
            assignedTo={assignedTeller}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OtherBankTransferComponent;