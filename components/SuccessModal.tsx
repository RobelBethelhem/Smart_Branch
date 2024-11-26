import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessModalProps {
  amount: string;
  onClose: () => void;
  type?: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer';
  customerNumber?: string;
}

interface SuccessModalProps {
  amount: string;
  onClose: () => void;
  type?: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer';
  customerNumber?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ amount, onClose, type = 'withdrawal', customerNumber }) => {
  const getSuccessMessage = () => {
    switch (type) {
      case 'withdrawal':
        return `Withdrawal of $${amount} has been processed`;
      case 'deposit':
        return `Deposit of $${amount} has been processed`;
      case 'transfer':
        return `Transfer of $${amount} has been processed`;
      case 'exchange':
        return `Exchange of ${amount} has been processed`;
      case 'otherBankTransfer':
        return `Inter-bank transfer of $${amount} has been processed`;
      default:
        return `Transaction of $${amount} has been processed`;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'withdrawal': return 'Withdrawal Successful!';
      case 'deposit': return 'Deposit Successful!';
      case 'transfer': return 'Transfer Successful!';
      case 'exchange': return 'Exchange Successful!';
      case 'otherBankTransfer': return 'Inter-bank Transfer Successful!';
      default: return 'Transaction Successful!';
    }
  };

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
        className="bg-white rounded-lg p-6 text-center max-w-md mx-4"
      >
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{getTitle()}</h3>
        <p className="text-gray-600 mb-4">
          {getSuccessMessage()}
        </p>
        {customerNumber && (
          <p className="text-gray-600 mb-4">
            Your Reference Number: <span className="font-semibold">{customerNumber}</span>
          </p>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SuccessModal;