import React from 'react';
import { motion } from 'framer-motion';

interface BranchServiceModalProps {
  onConfirm: () => void;
  onDecline: () => void;
  branchCode: string;
}

const BranchServiceModal: React.FC<BranchServiceModalProps> = ({ onConfirm, onDecline, branchCode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">Branch Service Request</h2>
        <p className="text-gray-600 mb-6">
          Would you like to get service in Branch {branchCode}?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Okay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BranchServiceModal;