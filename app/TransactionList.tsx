import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Transaction {
  request_type: string;
  amount_in_figures?: string;
  beneficiary_account_number?: string;
  beneficiary_name?: string;
  payment_narration?: string;
  beneficiary_branch?: string;
  [key: string]: any;
}

interface TransactionCardProps {
  transaction: Transaction;
  onSubmit: (formData: Transaction) => void;
}

// Separate component for transaction card to properly use hooks
const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onSubmit }) => {
  const [formData, setFormData] = useState<Transaction>(transaction);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleEditSubmit}
      className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100"
    >
      <motion.h2
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-2xl font-bold text-center text-gray-800 mb-6"
      >
        Edit or Cancel Request
      </motion.h2>

      {transaction.request_type === 'Deposit' && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6"
          >
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="text"
              id="amount"
              name="amount_in_figures"
              value={formData.amount_in_figures}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </motion.div>
        )}

        {transaction.request_type === 'Withdraw' && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6"
          >
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="text"
              id="amount"
              name="amount_in_figures"
              value={formData.amount_in_figures}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </motion.div>
        )}

        {transaction.request_type === 'Transfer' && (
          <>
            {/* Transfer fields */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="text"
                id="amount"
                name="amount_in_figures"
                value={formData.amount_in_figures}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="beneficiary_account_number" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Account Number
              </label>
              <input
                type="number"
                id="beneficiary_account_number"
                name="beneficiary_account_number"
                value={formData.beneficiary_account_number}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="beneficiary_name" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Name
              </label>
              <input
                type="text"
                id="beneficiary_name"
                name="beneficiary_name"
                value={formData.beneficiary_name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="payment_narration" className="block text-sm font-medium text-gray-700 mb-2">
                Narration
              </label>
              <input
                type="text"
                id="payment_narration"
                name="payment_narration"
                value={formData.payment_narration}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>
          </>
        )}

        {transaction.request_type === 'Other_Bank_Transfer' && (
          <>
            {/* Other Bank Transfer fields */}
            <motion.div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="text"
                id="amount"
                name="amount_in_figures"
                value={formData.amount_in_figures}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="beneficiary_account_number" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Account Number
              </label>
              <input
                type="number"
                id="beneficiary_account_number"
                name="beneficiary_account_number"
                value={formData.beneficiary_account_number}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="beneficiary_name" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Name
              </label>
              <input
                type="text"
                id="beneficiary_name"
                name="beneficiary_name"
                value={formData.beneficiary_name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            <motion.div className="mb-6">
              <label htmlFor="beneficiary_branch" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Branch
              </label>
              <input
                type="text"
                id="beneficiary_branch"
                name="beneficiary_branch"
                value={formData.beneficiary_branch}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>
          </>
        )}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="mt-6"
      >
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          Submit
        </button>
      </motion.div>
    </motion.form>
  );
};

interface TransactionListProps {
  responseData: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ responseData }) => {
  const handleEditSubmit = (formData: Transaction) => {
    // Handle form submission logic here
    console.log("Form submitted", formData);
  };

  return (
    <div>
      {responseData.map((transaction, index) => (
        <TransactionCard
          key={index}
          transaction={transaction}
          onSubmit={handleEditSubmit}
        />
      ))}
    </div>
  );
};

export default TransactionList;