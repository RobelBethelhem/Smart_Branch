import React from 'react';
import { FiDollarSign, FiCreditCard, FiActivity, FiAlertCircle, FiLock, FiClock, FiTag, FiUser, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface DashboardProps {
  accountNumber: string;
  accountName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  blockedAmount: number;
  // Add new props for account status
  noDebit: string;
  noCredit: string;
  dormant: string | null;
  accountClass: string;
  branchCode: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  accountNumber,
  accountName,
  currency,
  currentBalance,
  availableBalance,
  blockedAmount,
  noDebit,
  noCredit,
  dormant,
  accountClass,
  branchCode
}) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    if (status === 'Y') return 'from-red-500 to-red-700';
    if (status === 'N') return 'from-green-500 to-green-700';
    return 'from-gray-500 to-gray-700';
  };

  const getStatusText = (status: string | null) => {
    if (status === 'Y') return 'Restricted';
    if (status === 'N') return 'Active';
    return 'Unknown';
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
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Account Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            className="p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiUser className="text-blue-500" />
              <p className="text-gray-500 text-sm uppercase tracking-wider">Account Holder</p>
            </div>
            <p className="font-semibold text-lg truncate">{accountName}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }} 
            className="p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiCreditCard className="text-blue-500" />
              <p className="text-gray-500 text-sm uppercase tracking-wider">Account Number</p>
            </div>
            <p className="font-semibold text-lg">{accountNumber}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }} 
            className="p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiBox className="text-blue-500" />
              <p className="text-gray-500 text-sm uppercase tracking-wider">Branch Code</p>
            </div>
            <p className="font-semibold text-lg">{branchCode}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }} 
            className="p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiTag className="text-blue-500" />
              <p className="text-gray-500 text-sm uppercase tracking-wider">Account Class</p>
            </div>
            <p className="font-semibold text-lg">{accountClass}</p>
          </motion.div>
        </div>
      </motion.div>

         {/* Balance Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiDollarSign className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Current Balance</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">{formatAmount(currentBalance)}</h3>
          <p className="text-sm text-white/80">Total account balance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiCreditCard className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Available Balance</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">{formatAmount(availableBalance)}</h3>
          <p className="text-sm text-white/80">Ready to use</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiActivity className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Blocked Amount</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">{formatAmount(blockedAmount)}</h3>
          <p className="text-sm text-white/80">Temporarily held</p>
        </motion.div>
      </div>

      {/* Account Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className={`bg-gradient-to-br ${getStatusColor(noDebit)} rounded-2xl p-6 text-white shadow-xl`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiLock className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Debit Status</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{getStatusText(noDebit)}</h3>
          <p className="text-sm text-white/80">Debit transactions {noDebit === 'Y' ? 'restricted' : 'allowed'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className={`bg-gradient-to-br ${getStatusColor(noCredit)} rounded-2xl p-6 text-white shadow-xl`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiCreditCard className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Credit Status</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{getStatusText(noCredit)}</h3>
          <p className="text-sm text-white/80">Credit transactions {noCredit === 'Y' ? 'restricted' : 'allowed'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03, translateY: -5 }}
          className={`bg-gradient-to-br ${getStatusColor(dormant)} rounded-2xl p-6 text-white shadow-xl`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FiClock className="text-2xl" />
            </div>
            <span className="text-sm font-medium text-white/80">Account Status</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{dormant === 'Y' ? 'Dormant' : 'Active'}</h3>
          <p className="text-sm text-white/80">Account is {dormant === 'Y' ? 'inactive' : 'in use'}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;