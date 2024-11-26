"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCalendar, FiMapPin, FiUser, FiDollarSign, FiCreditCard, FiSend, FiGlobe, FiMessageCircle } from 'react-icons/fi';
import WithdrawComponent from '../components/WithdrawComponent';
import DepositComponent from '../components/DepositComponent';
import TransferComponent from '../components/TransferComponent';
import ForeignExchangeComponent from '../components/ForeignExchangeComponent';
import CommentComponent from '../components/CommentComponent';
import OtherBankTransferComponent from '../components/OtherBankTransferComponent';
import BankFloorLayout from '../components/BankFloorLayout';

const INACTIVITY_TIMEOUT = 150000;

const BranchInfo: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-lg shadow-lg mb-8 w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Branch Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <FiCalendar className="text-blue-500 mr-2" />
          <p>{currentDateTime.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center">
          <FiClock className="text-blue-500 mr-2" />
          <p>{currentDateTime.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center col-span-2">
          <FiMapPin className="text-blue-500 mr-2" />
          <p>Main Branch</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const userData = {
    name: "Robel Asfaw",
    balance: 10000,
    profileImage: "/profile/profile.jpg" // Adjust the path as necessary
  };

  const [accountNumber, setAccountNumber] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showBankFloorLayout, setShowBankFloorLayout] = useState(false);

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowAd(false);
  }, []);

  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [handleActivity]);

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && !showAd) {
        setShowAd(true);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, showAd]);

  const handleInputClick = () => {
    setShowInput(true);
  };

  const handleAccountSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (accountNumber.length === 10) {
      setShowDashboard(true);
    } else {
      alert('Please enter a valid 10-digit account number');
    }
  };

  const handleBack = () => {
    setSelectedOption(null);
    setShowBankFloorLayout(false);
  };

  const handleOptionClick = (option: string) => {
    if (option === 'bank-floor-layout') {
      setShowBankFloorLayout(true);
    } else {
      setSelectedOption(option);
    }
  };

  const renderContent = () => {
    if (showAd) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
        >
          <video autoPlay muted className="max-w-full max-h-full rounded-lg shadow-2xl">
            <source src="/video/sample.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      );
    }
  
    if (!showInput) {
      return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
          <motion.h1 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold text-white mb-8 text-center"
          >
            Welcome to Your Digital Banking Experience
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={handleInputClick}
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-100 transition-colors duration-300"
          >
            Get Started
          </motion.button>
        </div>
      );
    }
  
    if (!showDashboard) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <BranchInfo />
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleAccountSubmit} 
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Enter Your Account Number</h2>
            <div className="relative">
              <FiUser className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10-digit account number"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
            >
              Access Your Account
            </button>
          </motion.form>
        </div>
      );
    }

    if (showBankFloorLayout) {
      return (
        <div className="w-full max-w-4xl mx-auto p-8">
          <button
            onClick={handleBack}
            className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
          <BankFloorLayout />
        </div>
      );
    }
  
    if (selectedOption === 'withdraw') {
      return <WithdrawComponent onBack={handleBack} balance={userData.balance} />;
    } else if (selectedOption === 'deposit') {
      return <DepositComponent onBack={handleBack} balance={userData.balance} />;
    } else if (selectedOption === 'transfer') {
      return <TransferComponent onBack={handleBack} balance={userData.balance} />;
    } else if (selectedOption === 'forex') {
      return <ForeignExchangeComponent onBack={handleBack} balance={userData.balance} />;
    } else if (selectedOption === 'comment') {
      return <CommentComponent onBack={handleBack} />;
    } else if (selectedOption === 'other-bank-transfer') {
      return <OtherBankTransferComponent onBack={handleBack} />;
    } else {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-4xl mx-auto p-8"
        >
          <h1 className="text-4xl font-bold mb-8 text-gray-800">Welcome, {userData.name}</h1>
          <div className="flex items-center mb-4">
            <img src={userData.profileImage} alt="Profile" className="w-20 h-20 rounded-full border-2 border-gray-300 mr-4" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-700">Account Overview</h2>
              <p className="text-lg text-gray-600">Available Balance: ${userData.balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('withdraw')}
              className="bg-blue-600 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiCreditCard className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Withdraw</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('deposit')}
              className="bg-green-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiDollarSign className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Deposit</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('transfer')}
              className="bg-purple-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiSend className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Transfer</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('forex')}
              className="bg-yellow-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiGlobe className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Foreign Exchange</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('comment')}
              className="bg-orange-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiMessageCircle className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Drop Comment</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('other-bank-transfer')}
              className="bg-blue-700 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiCreditCard className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Other Bank Transfer</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('bank-floor-layout')}
              className="bg-blue-700 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <FiCreditCard className="text-4xl mb-2" />
              <span className="text-lg font-semibold">Demo Zemen Site Map</span>
            </motion.button>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {renderContent()}
    </main>
  );
}