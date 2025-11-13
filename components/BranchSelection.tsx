import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ErrorMessage from '@/components/ErrorMessage';

interface BranchSelectionProps {
  onSelect: (branchCode: string) => void;
}

const BranchSelection: React.FC<BranchSelectionProps> = ({ onSelect }) => {
  const [branchCode, setBranchCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate branch code (e.g., length, format)
    if (branchCode.trim() === '') {
      setError('Branch code cannot be empty.');
      return;
    }
    // You can add more validation as per your requirements
    // Save to localStorage
    localStorage.setItem('branchCode', branchCode.trim());
    // Notify parent component
    onSelect(branchCode.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <motion.form
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Select Your Branch</h2>
        <div className="mb-4">
          <label htmlFor="branchCode" className="block text-gray-700 font-semibold mb-2">
            Enter Branch Code
          </label>
          <input
            type="text"
            id="branchCode"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., BR001"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
        >
          Submit
        </button>
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      </motion.form>
    </div>
  );
};

export default BranchSelection;