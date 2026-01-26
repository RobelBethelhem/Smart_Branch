import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, User, Building, CreditCard } from 'lucide-react';
import SignatureVerificationModal from "./SignatureVerificationModal";
import SignatureModal from "./SignatureModal";
import base64 from 'base64-js';
import SuccessModal from "./SuccessModal";

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


interface OtherBankTransferProps {
  onBack: () => void;
  balance: number;
  storedSignature?: string;
  accountNumber?: string;  // Add this
  accountName?: string;
}

const OtherBankTransferComponent: React.FC<OtherBankTransferProps> = ({ 
  onBack,
  balance,
  storedSignature,
  accountNumber,
  accountName
}) => {
  const isSubmittingRef = useRef(false);
  
  const [amount, setAmount] = useState<string>('');
  const [amountInWords, setAmountInWords] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientAccount, setRecipientAccount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [swiftCode, setSwiftCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue > 0 && numValue <= balance)) {
      setAmount(value);
      setAmountInWords(numValue ? numberToWords(numValue) : '');
      setError('');
    } else {
      setError('Amount must be greater than 0 and not exceed your balance');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setShowSignatureModal(true);
    }
  };

  const handleSignatureDraw = (signature: string) => {
    setDrawnSignature(signature);
    setShowSignatureModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationSuccess = async (signature: string) => {
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, skipping...');
      return;
    }

    console.log('Starting other bank transfer verification process...');
    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
      const uniqueNumber = Math.floor(100000 + Math.random() * 900000).toString();
      
      const transferData = {
        acc_holder_name: accountName,
        amount_in_words: amountInWords,
        amount_in_figures: parseFloat(amount),
        source_of_funds: "Other Bank Transfer",
        signature: signature,
        account_number: accountNumber,
        recipient_name: recipientName,
        recipient_account: recipientAccount,
        bank_name: bankName,
        bank_branch: bankBranch,
        swift_code: swiftCode,
        transfer_type: "RTGS",
        Customer_Unique_Number: uniqueNumber,
      };

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zsmart_branch_requests/other_bank_transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      }).then(res => res.json());

      if (!result.error) {
        setShowVerificationModal(false);
        setShowSuccessModal(true);
        setTransactionNumber(uniqueNumber);
      } else {
        throw new Error(result.message);
      }
    } catch (err: unknown) {
      handleVerificationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerificationError = (errorMessage: string) => {
    setError(errorMessage);
    setShowVerificationModal(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
    setRecipientName('');
    setRecipientAccount('');
    setBankName('');
    setBankBranch('');
    setSwiftCode('');
    onBack();
  };

  const isFormValid = amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance && recipientName && recipientAccount && bankName && swiftCode;

  return (
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
            value={amountInWords}
            disabled
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            placeholder="Amount in words will appear here"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Type
          </label>
          <input
            type="text"
            value="RTGS"
            disabled
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
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
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="recipientAccount" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Account Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="recipientAccount"
              value={recipientAccount}
              onChange={(e) => setRecipientAccount(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="1234567890"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Bank of America"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700 mb-2">
            Beneficiary Bank Branch (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="bankBranch"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Main Branch (Optional)"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 mb-2">
            SWIFT Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="swiftCode"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="BOFAUS3NXXX"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Balance
          </label>
          <p className="text-lg font-semibold">ETB {balance.toFixed(2)}</p>
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
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={!isFormValid}
        >
          Transfer to Other Bank
        </button>
      </form>

      <AnimatePresence>
        {showSignatureModal && (
          <SignatureModal
            amount={amount}
            onClose={() => setShowSignatureModal(false)}
            onConfirm={handleSignatureDraw}
            type="otherBankTransfer"
            additionalInfo={`to ${recipientName} at ${bankName}`}
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
            additionalInfo={`to ${recipientName} at ${bankName}`}
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
    </motion.div>
  );
};

export default OtherBankTransferComponent;