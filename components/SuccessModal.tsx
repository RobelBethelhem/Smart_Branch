import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessModalProps {
  amount: string;
  onClose: () => void;
  type: 'withdrawal' | 'deposit' | 'transfer' | 'otherBankTransfer' | 'exchange';
  customerNumber?: string;
  assignedTo?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ amount, onClose, type, customerNumber, assignedTo }) => {
  console.log("ssigned to Tellerssigned to Teller", assignedTo)
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
        <h3 className="text-2xl font-bold mb-4">Transaction Successful!</h3>
        <p className="text-lg mb-2">Amount: ETB {amount}</p>
        <p className="text-md mb-2">Reference Number: {customerNumber}</p>
        
        {assignedTo && (
          <p className="text-md mb-2 text-blue-600">
            Assigned to Teller: {assignedTo}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SuccessModal;