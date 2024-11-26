import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/account';
import { format } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiActivity, FiCalendar, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { TRN_CODE_DESCRIPTIONS } from '@/constant/transactions';

interface DashboardProps {
  accountNumber: string;
  accountName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  blockedAmount: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  accountNumber,
  accountName,
  currency,
  currentBalance,
  availableBalance,
  blockedAmount
}) => {
  // Format amount helper function
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto p-6 space-y-8 bg-gray-50"
    >
      {/* Account Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
      >
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Account Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
          >
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Account Number</p>
            <p className="font-semibold text-lg">{accountNumber}</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
          >
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Account Name</p>
            <p className="font-semibold text-lg">{accountName}</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
          >
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Currency</p>
            <p className="font-semibold text-lg">{currency}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiDollarSign className="text-3xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Current Balance</span>
          </div>
          <h3 className="text-3xl font-bold mb-3">{formatAmount(currentBalance)}</h3>
          <p className="text-sm text-white/80">Available for transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiCreditCard className="text-3xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Available Balance</span>
          </div>
          <h3 className="text-3xl font-bold mb-3">{formatAmount(availableBalance)}</h3>
          <p className="text-sm text-white/80">Ready to use</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiActivity className="text-3xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Blocked Amount</span>
          </div>
          <h3 className="text-3xl font-bold mb-3">{formatAmount(blockedAmount)}</h3>
          <p className="text-sm text-white/80">Temporarily held</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;