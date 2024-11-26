import React, { useState , useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, User, Building } from 'lucide-react';
import SignatureModal from './SignatureModal';
import SuccessModal from './SuccessModal';
import SignatureVerificationModal from './SignatureVerificationModal';

interface OtherBankTransferComponentProps {
  onBack: () => void;
  balance: number;
  storedSignature: string;
  accountNumber: string;  // Add this
  accountName: string;  
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
      return;
    }

    console.log('Starting verification success process...');
    isSubmittingRef.current = true;
    setLoading(true);

    try {



      const addressData = await fetchDepositorAddress();
      console.log('Fetched address data:', addressData);




      const uniqueNumber = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated unique number:', uniqueNumber);

      const transferData = {
        acc_holder_name: accountName,
        beneficiary_name: recipientName,
        amount_in_words: numberToWords(parseInt(amount)),
        amount_in_figures: parseFloat(amount),
        signature: signature,
        telephone: addressData?.TELEPHONE || '',
        address: addressData?.CITY + ' ' + addressData?.SUBCITY + ' ' + addressData?.WOREDA + ' ' + addressData?.HOUSE_NUMBER || '',
        account_number: accountNumber,
        acc_holder_branch: accountNumber.substring(0, 3),
        beneficiary_account_number: recipientAccount,
        beneficiary_bank: otherBankName,
        transfer_type: "RTGS",
        account_type: "Savings",
        beneficiary_branch: beneficiaryBranch,
        Customer_Unique_Number: uniqueNumber,
      };

      console.log('Prepared transfer data:', transferData);

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/other_bank_transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      }).then(res => res.json());

      console.log('API response:', result);

      if (!result.error) {
        console.log('Transfer successful, showing success modal...');
        setShowVerificationModal(false);
        setShowSuccessModal(true);
        setTransactionNumber(uniqueNumber);
      } else {
        console.error('API error:', result.message);
        throw new Error(result.message);
      }
    } catch (err: unknown) {
      console.error('Transfer error:', err);
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log('Resetting submission state...');
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
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto"
      >
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Other Bank Transfer</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Transfer
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
                max={balance}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
            </label>
            <input
              type="text"
              value={amount ? numberToWords(parseInt(amount)) : ''}
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
              placeholder="Amount in words will appear here"
            />
          </div>

          <div className="mb-4">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Recipient Name"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="otherBankName" className="block text-sm font-medium text-gray-700 mb-2">
              Other Bank
            </label>
            <select
              id="otherBankName"
              value={otherBankName}
              onChange={(e) => setOtherBankName(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

          <div className="mb-4">
            <label htmlFor="beneficiaryBranch" className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Branch (Optional)
            </label>
            <input
              type="text"
              id="beneficiaryBranch"
              value={beneficiaryBranch}
              onChange={(e) => setBeneficiaryBranch(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Branch (default: HO)"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="transferType" className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Type
            </label>
            <select
              id="transferType"
              value={transferType}
              disabled
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            >
              <option value="RTGS">RTGS</option>
            </select>
          </div>

          <div className="mb-4">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Account Number"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Balance
            </label>
            <p className="text-lg font-semibold">${balance.toFixed(2)}</p>
          </div>

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
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            disabled={!isFormValid}
          >
            Transfer
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
            additionalInfo={`to ${recipientName} at ${otherBankName} via ${transferType}`}
          />
        )}

        {showVerificationModal && (
          <SignatureVerificationModal
            amount={amount}
            onClose={() => setShowVerificationModal(false)}
            onConfirm={handleVerificationSuccess}
            onError={handleVerificationError}
            type="otherBankTransfer"
            storedSignature={storedSignature}
            drawnSignature={drawnSignature}
            additionalInfo={`to ${recipientName} at ${otherBankName}`}
          />
        )}

        {showSuccessModal && (
          <SuccessModal
            amount={amount}
            onClose={handleSuccessClose}
            type="otherBankTransfer"
            customerNumber={transactionNumber}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OtherBankTransferComponent;