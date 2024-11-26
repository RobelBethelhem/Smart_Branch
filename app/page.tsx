"use client"

import { OpenCVProvider } from '@/components/OpenCVProvider';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCalendar, FiMapPin, FiUser, FiDollarSign, FiCreditCard, FiSend, FiGlobe, FiMessageCircle, FiDatabase } from 'react-icons/fi';
import WithdrawComponent from '../components/WithdrawComponent';
import DepositComponent from '../components/DepositComponent';
import TransferComponent from '../components/TransferComponent';
import ForeignExchangeComponent from '../components/ForeignExchangeComponent';
import CommentComponent from '../components/CommentComponent';
import OtherBankTransferComponent from '../components/OtherBankTransferComponent';
import BankFloorLayout from '../components/BankFloorLayout';
import CustomerOnboarding from '../components/CustomerOnboarding';
import * as faceapi from 'face-api.js';
import BankProductsShowcase from '../components/BankProduct';
import FlexcubeTest from '../components/FlexcubeTest';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AccountData, UserData, Transaction } from '@/types/account';
import UserDashboard from '@/components/UserDashboard';
import FaceVerificationModal from '@/components/FaceVerificationModal';
import MiniStatement from '@/components/MiniStatement';
import Dashboard from '@/components/Dashboard';
import TransactionMap from '@/components/TransactionMap';


const INACTIVITY_TIMEOUT = 100000;

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

const defaultUserData: UserData = {
  name: "Guest User",
  balance: 0,
  profileImage: "/profile/default-profile.jpg",
  signImage: "/profile/default-profile.jpg"
};

export default function Home() {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showInput, setShowInput] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showBankFloorLayout, setShowBankFloorLayout] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProductsShowcase, setShowProductsShowcase] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [pendingAccountData, setPendingAccountData] = useState<AccountData | null>(null);
  const [showMainDashboard, setShowMainDashboard] = useState(false);
  const [showTransactionMap, setShowTransactionMap] = useState(false);


  const sampleTransactions = [
    {
      id: 1,
      amount: 4000,
      date: '2024-03-10',
      location: { lat: 	9.005401, lng: 38.763611, name: 'Addis Ababa' }
    },
    {
      id: 2,
      amount: 5000,
      date: '2024-03-10',
      location: { lat: 	9.005401, lng: 38.763611, name: 'Addis Ababa' }
    },
    {
      id: 3,
      amount: 10000,
      date: '2024-03-09',
      location: { lat: 3.497402, lng: 39.470737, name: 'Mekelle' }
    },
    {
      id: 4,
      amount: 600,
      date: '2024-03-08',
      location: { lat: 12.600000, lng: 37.466667, name: 'Gondor' }
    },
    {
      id: 5,
      amount: 600,
      date: '2024-03-11',
      location: { lat: 12.600000, lng: 37.466667, name: 'Gondor' }
    },
    {
      id: 6,
      amount: 1200,
      date: '2024-03-07',
      location: { lat: 8.514477, lng: 39.269257, name: 'Semera' }
    },
    {
      id: 7,
      amount: 12000,
      date: '2024-03-19',
      location: { lat: 	9.005401, lng: 38.763611, name: 'Addis Ababa' }
    },
  ];

  const resetToWelcomeScreen = useCallback(() => {
    setShowAd(false);
    setShowInput(false);
    setShowDashboard(false);
    setShowBankFloorLayout(false);
    setShowOnboarding(false);
    setShowProductsShowcase(false);
    setSelectedOption(null);
    setLastActivity(Date.now());
  }, []);

  const handleActivity = useCallback(() => {
    if (showAd) {
      resetToWelcomeScreen();
    } else {
      setLastActivity(Date.now());
    }
  }, [showAd, resetToWelcomeScreen]);

  const handleProductsShowcase = () => {
    setShowProductsShowcase(true);
  };

  useEffect(() => {
    if (accountData) {
      let profileImage = "/profile/default-profile.jpg";
      let SignImage = "/profile/default-profile.jpg";
      
      if (accountData.PROFILE_IMAGE) {
        try {
          profileImage = accountData.PROFILE_IMAGE;
        } catch (error) {
          console.error('Error converting PROFILE_IMAGE to image:', error);
        }
      }
      if(accountData.SIGN_IMAGE){
        try {
          SignImage = `data:image/jpeg;base64,${accountData.SIGN_IMAGE}`;
        } catch (error) {
          console.error('Error converting Signature to image:', error);
        }
      }
  
      setUserData({
        name: accountData.ACC_DESC,
        balance: accountData.AVAILABLE_BALANCE,
        profileImage: profileImage,
        signImage: SignImage,
      });
    }
  }, [accountData]);

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

  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (accountNumber.length !== 16) {
      setError('Please enter a valid 16-digit account number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber }),
      });

      const result = await response.json();

      if (result.success) {
        const transactionsResponse = await fetch(`/api/transactions?accountNumber=${accountNumber}`);
        const transactionsResult = await transactionsResponse.json();
        
        console.log('Account Data:', result.data);
        console.log('Transactions Result:', transactionsResult);

        if (transactionsResponse.ok) {
          const accountDataWithTransactions = {
            ...result.data,
            transactions: transactionsResult.data
          };

          if (accountDataWithTransactions.PROFILE_IMAGE) {
            setPendingAccountData(accountDataWithTransactions);
            setShowFaceVerification(true);
          } else {
            setError('Profile image not found');
          }
        } else {
          setError('Failed to fetch transactions');
        }
      } else {
        setError(result.message || 'Account not found');
      }
    } catch (err) {
      setError('An error occurred while verifying your account');
      console.error('Account verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerificationSuccess = () => {
    setShowFaceVerification(false);
    if (pendingAccountData) {
      setAccountData(pendingAccountData);
      setShowDashboard(true);
    }
  };

  const handleFaceVerificationClose = () => {
    setShowFaceVerification(false);
    setPendingAccountData(null);
  };

  const handleBack = () => {
    setSelectedOption(null);
    setShowBankFloorLayout(false);
    setShowProductsShowcase(false);
    setShowMainDashboard(false);
  };

  const handleOptionClick = (option: string) => {
    if (option === 'bank-floor-layout') {
      setShowBankFloorLayout(true);
    } else if (option === 'Products') {
      setShowProductsShowcase(true);
    } else if (option === 'dashboard') {
      setShowMainDashboard(true);
    } else if (option === 'transaction-map') {
      setShowTransactionMap(true);
    } else {
      setSelectedOption(option);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (showTransactionMap) {
      return (
        <div className="w-full h-screen" key="transaction-map">
          <TransactionMap
            transactions={sampleTransactions}
            onBack={() => {
              setShowTransactionMap(false);
              setShowDashboard(true);
              console.log('Closing transaction map');
            }}
          />
        </div>
      );
    }

    if (showOnboarding) {
      return <CustomerOnboarding />;
    }

    if (showAd) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 cursor-pointer"
          onClick={resetToWelcomeScreen}
        >
          <video autoPlay muted loop className="max-w-full max-h-full rounded-lg shadow-2xl">
            <source src="/video/sample.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      );
    }
  
    if (!showInput && !showProductsShowcase) {
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
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-100 transition-colors duration-300 mb-4"
          >
            Get Started
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={handleProductsShowcase}
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-100 transition-colors duration-300"
          >
            Show Case Bank's Product and Service
          </motion.button>
        </div>
      );
    }

    if (showProductsShowcase) {
      return <BankProductsShowcase onBack={handleBack} />;
    }

    if (!showDashboard && showInput) {
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 16) {
                    setAccountNumber(value);
                  }
                }}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="16-digit account number"
                maxLength={16}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Access Your Account'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="text-blue-500 mt-4 text-sm hover:underline"
            >
              Don't have an account yet? Sign up here.
            </button>
          </motion.form>
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
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
  
    if (selectedOption === 'withdraw' && accountData) {
      return <WithdrawComponent 
      onBack={handleBack} 
      balance={userData.balance}
      storedSignature={userData.signImage ? `data:image/jpeg;base64,${userData.signImage}` : ''}
      accountNumber={accountData.CUST_AC_NO}
      accountName={accountData.ACC_DESC}
      />;
    } else if (selectedOption === 'deposit' && accountData ) {
      return<DepositComponent 
      onBack={handleBack}
      balance={userData.balance}
      storedSignature={userData.signImage ? `data:image/jpeg;base64,${userData.signImage}` : ''}
      accountNumber={accountData.CUST_AC_NO}
      accountName={accountData.ACC_DESC}
    />;
    } else if (selectedOption === 'transfer' && accountData) {
      return <TransferComponent
       onBack={handleBack}
        balance={userData.balance}
        storedSignature={userData.signImage ? `data:image/jpeg;base64,${userData.signImage}` : ''}
        accountNumber={accountData.CUST_AC_NO}
        accountName={accountData.ACC_DESC}
        />;
    } else if (selectedOption === 'forex') {
      return <ForeignExchangeComponent 
      onBack={handleBack}
       balance={userData.balance}
       storedSignature={userData.signImage ? `data:image/jpeg;base64,${userData.signImage}` : ''}
       />;
    } else if (selectedOption === 'comment') {
      return <CommentComponent onBack={handleBack} />;
    } else if (selectedOption === 'other-bank-transfer'  && accountData) {
      return <OtherBankTransferComponent
       onBack={handleBack}
        balance={userData.balance}
        storedSignature={userData.signImage ? `data:image/jpeg;base64,${userData.signImage}` : ''}
        accountNumber={accountData.CUST_AC_NO}
        accountName={accountData.ACC_DESC}
        />;
    } else if (selectedOption === 'Products') {
      return <BankProductsShowcase onBack={handleBack} />;
    } else if (selectedOption === 'flexcube-test') {
      return <FlexcubeTest onBack={handleBack} />;
    } 

    else if (selectedOption === 'ministatement' && accountData) {
      return (
        <MiniStatement 
          onBack={() => setSelectedOption(null)}
          accountNumber={accountData.CUST_AC_NO} // Pass the verified account number
          accountName={accountData.ACC_DESC} // Optionally pass account name
          currency={accountData.CCY} // Optionally pass currency
        />
      );
    }

    else if (showMainDashboard && accountData) {
      return (
        <div className="w-full">
          <div className="p-4">
            <button
              onClick={handleBack}
              className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Back to Menu
            </button>
          </div>
          <Dashboard 
            accountNumber={accountData.CUST_AC_NO}
            accountName={accountData.ACC_DESC}
            currency={accountData.CCY}
            currentBalance={accountData.CURRENT_BALANCE}
            availableBalance={accountData.AVAILABLE_BALANCE}
            blockedAmount={accountData.BLOCKED_AMOUNT}
          />
        </div>
      );
    }

    else if (showDashboard && accountData) {
      return (
        <div className="w-full">
       
          <motion.div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 sm:p-8"
            >
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight"
              >
                <motion.span className="block bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome,
                </motion.span>
                <motion.span className="block mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {userData.name}
                </motion.span>
              </motion.h1>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center mb-6 rounded-lg shadow-lg p-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 opacity-90 animate-gradient-x"></div>
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>

              <div className="relative flex flex-col sm:flex-row items-center w-full gap-4 sm:gap-6">
                <div className="w-full sm:w-auto mb-4 sm:mb-0 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full animate-pulse-slow"></div>
                    <img 
                      src={userData.profileImage} 
                      alt="Profile" 
                      className="w-32 h-32 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-full border-4 border-white/50 object-cover relative z-10 transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/profile/default-profile.jpg";
                      }} 
                    />
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left sm:ml-6 z-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">
                    Account Overview
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
                      <p className="text-base sm:text-lg text-white">
                        <span className="font-medium">Available Balance</span>
                        <br className="sm:hidden" />
                        <span className="ml-1 font-bold text-xl sm:text-2xl">
                        {accountData.CCY} {accountData.AVAILABLE_BALANCE.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </p>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
                      <p className="text-base sm:text-lg text-white">
                        <span className="font-medium">Account Number</span>
                        <br className="sm:hidden" />
                        <span className="ml-1 font-bold">
                          {accountData.CUST_AC_NO}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                className="bg-indigo-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('dashboard')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiDatabase className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Account Dashboard</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-rose-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('withdraw')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Withdraw</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-emerald-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('deposit')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiDollarSign className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Deposit</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-violet-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiSend className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Transfer</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-amber-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('forex')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiGlobe className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Foreign Exchange</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-orange-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('comment')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiMessageCircle className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Drop Comment</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-cyan-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Other Bank Transfer</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-teal-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">ATM Card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-fuchsia-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Dispitute Card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-lime-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Prepaid card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-sky-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('ministatement')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiDatabase className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Mini Statement</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-purple-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('bank-floor-layout')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Demo Zemen Site Map</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-purple-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowTransactionMap(true);
                  setShowDashboard(false);
                  console.log('Showing transaction map');
                }}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiGlobe className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">
                    View Transaction Map
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      );
    }

    return null; // Fallback
  };

  return (
    <OpenCVProvider>
      <main className="min-h-screen bg-gray-100">
        {renderContent()}
        {showFaceVerification && pendingAccountData && (
          <FaceVerificationModal
            onClose={handleFaceVerificationClose}
            onSuccess={handleFaceVerificationSuccess}
            profileImage={pendingAccountData.PROFILE_IMAGE || "/profile/default-profile.jpg"}
          />
        )}
      </main>
    </OpenCVProvider>
  );
}