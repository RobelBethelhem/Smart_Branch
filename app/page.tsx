"use client"

import { OpenCVProvider } from '@/components/OpenCVProvider';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCalendar, FiMapPin, FiUser, FiDollarSign, FiCreditCard, FiSend, FiGlobe, FiMessageCircle, FiDatabase, FiLock, FiPhone, FiLogOut, FiCheckSquare } from 'react-icons/fi';
import WithdrawComponent from '../components/WithdrawComponent';
import DepositComponent from '../components/DepositComponent';
import TransferComponent from '../components/TransferComponent';
import ForeignExchangeComponent from '../components/ForeignExchangeComponent';
import CommentComponent from '../components/CommentComponent';
import OtherBankTransferComponent from '../components/OtherBankTransferComponent';
import ECheckComponent from '../components/ECheckComponent';
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
import FingerprintVerificationModal from '@/components/FingerprintVerificationModal';
import AuthMethodSelectionModal from '@/components/AuthMethodSelectionModal';
import OTPVerificationModal from '@/components/OTPVerificationModal';
import MiniStatement from '@/components/MiniStatement';
import FaydaDataModal from '@/components/FaydaDataModal';
import FaydaPDFUpload from '@/components/FaydaPDFUpload';
import Dashboard from '@/components/Dashboard';
import SetATMPasswordComponent from '@/components/SetATMPasswordComponent';
import { QrCode } from 'lucide-react';
import GetMerchantQR from '@/components/GetMerchantQR';
import dynamic from 'next/dynamic';
import BranchSelection from '@/components/BranchSelection';
import { AnimatePresence } from 'framer-motion';
import numberToWords from '@/utils/numberToWordConverter'





// Define the Transaction type
interface Transactions {
  request_type: string;
  amount_in_figures: string;
  amount_in_words: string;
  Customer_Unique_Number: string;
  account_number: string;
  beneficiary_account_number?: string;
  beneficiary_name?: string;
  payment_narration?: string;
  beneficiary_bank?: string;
  beneficiary_branch?: string;
}

const TransactionMap = dynamic(() => import('../components/TransactionMap'), {
  ssr: false,
});

const INACTIVITY_TIMEOUT = 100000;

const BranchInfo: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [branchCode, setBranchCode] = useState<string | null>(null);

  useEffect(() => {
    const storedBranch = localStorage.getItem('branchCode');
    if (storedBranch) {
      setBranchCode(storedBranch);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-red-500 to-red-400 p-6 rounded-lg shadow-lg mb-8 w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-white">Branch Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <FiCalendar className="mr-2 text-white" />
          <p className="text-white">{currentDateTime.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center">
          <FiClock className="mr-2 text-white" />
          <p className="text-white">{currentDateTime.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center col-span-2">
          <FiMapPin className="mr-2 text-white" />
          <p className="text-white">
            {branchCode ? `Branch Code: ${branchCode}` : 'Main Branch'}
          </p>
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const [responseData, setResponseData] = useState<Transactions[] | null> (null);

  const [showPopup, setShowPopup] = useState(false);

  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
const [userAccounts, setUserAccounts] = useState<AccountData[]>([]);




const [searchType, setSearchType] = useState<'account' | 'name' | 'phone' | 'combined'>('account');
const [firstName, setFirstName] = useState('');
const [searchName, setSearchName] = useState('');
const [accountResults, setAccountResults] = useState<Array<{
  CUST_AC_NO: string;
  ACC_DESC: string;
  CCY: string;
}>>([]);
const [showAccountSelection, setShowAccountSelection] = useState(false);

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
  const [showFingerprintVerification, setShowFingerprintVerification] = useState(false);
  const [pendingAccountData, setPendingAccountData] = useState<AccountData | null>(null);
  const [showAuthMethodSelection, setShowAuthMethodSelection] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [selectedAccountForAuth, setSelectedAccountForAuth] = useState<{accountNumber: string, accountName: string, cif: string} | null>(null);
  const [otpMaskedPhone, setOtpMaskedPhone] = useState<string>('');
  const [showMainDashboard, setShowMainDashboard] = useState(false);
  const [showTransactionMap, setShowTransactionMap] = useState(false);
  const [branchSelected, setBranchSelected] = useState<boolean>(false);
  const [uniqueReference, setUniqueReference] = useState('');
  const [formData, setFormData] = useState<Transactions | null>(null);
  const [showFaydaModal, setShowFaydaModal] = useState(false);
  const [faydaData, setFaydaData] = useState<any>(null);
  const [showFaydaPDFUpload, setShowFaydaPDFUpload] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, transaction: Transactions) => {
    const { name, value } = e.target;
    setFormData({
      ...transaction,
      [name]: value,
    });
  };


  const handleEditSubmitt = (e: React.FormEvent, transaction: Transactions) => {
    e.preventDefault();
    console.log('Form Data Submitted:', transaction);
    // Add your submission logic here (e.g., API call)
  };



  const isSubmitDisabled = useMemo(() => {
    if (loading) return true;

    switch (searchType) {
      case 'account':
        return accountNumber.length !== 16;
      case 'name':
        return !searchName.trim();
      case 'phone':
        return !firstName.trim() || !phoneNumber.startsWith('+251') || phoneNumber.length !== 13;
      case 'combined':
        return accountNumber.length !== 16 || !fullName.trim() || !firstName.trim() || !phoneNumber.startsWith('+251') || phoneNumber.length !== 13;
      default:
        return true;
    }
  }, [searchType, accountNumber, searchName, firstName, phoneNumber, fullName, loading]);





  const isFullName = (name: string) => {
    const nameParts = name.trim().split(/\s+/);
    return nameParts.length >= 3;
  };





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
    setAccountData(null);  // Clear account data to return to welcome screen
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
    const fetchUserAccounts = async () => {
      if (accountData) {
        // Extract CUST_NO from account number (7-13 digits)
        const custNo = accountData.CUST_AC_NO.substring(6, 13);
        
        try {
          const response = await fetch('/api/account/user-accounts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ custNo }),
          });
  
          const result = await response.json();
          if (result.success) {
            setUserAccounts(result.accounts);
          }
        } catch (error) {
          console.error('Error fetching user accounts:', error);
        }
      }
    };
  
    fetchUserAccounts();
  }, [accountData]);

  

  

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && !showAd) {
        setShowAd(true);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, showAd]);

  // Listen for messages from browser extension
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      // Check if message is from our extension
      if (event.data && event.data.type === 'FAYDA_DATA_RECEIVED') {
        console.log('Received Fayda data from extension:', event.data.data);
        setFaydaData(event.data.data);
        setShowFaydaModal(true);
      }
    };

    window.addEventListener('message', handleExtensionMessage);

    // Also check chrome.storage if extension already sent data
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['faydaData'], (result) => {
        if (result.faydaData) {
          console.log('Found queued Fayda data:', result.faydaData);
          setFaydaData(result.faydaData);
          setShowFaydaModal(true);
          // Clear it so it doesn't show again
          chrome.storage.local.remove(['faydaData']);
        }
      });
    }

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, []);




  const filteredAccounts = useMemo(() => {
    if (!accountResults) return [];
    
    return accountResults.filter(account => 
      (account?.ACC_DESC?.toLowerCase() || '').includes(modalSearchQuery.toLowerCase()) ||
      (account?.CUST_AC_NO || '').includes(modalSearchQuery)
    );
  }, [accountResults, modalSearchQuery]);

 


  const handleInputClick = () => {
    setShowInput(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      // Validate inputs based on search type
      if (searchType === 'account' && accountNumber.length !== 16) {
        setError('Please enter a valid 16-digit account number');
        setLoading(false);
        return;
      }

      if (searchType === 'name') {
        if (!isFullName(searchName)) {
          setError('Please enter your complete name (First Name, Father\'s Name, and Grandfather\'s Name)');
          setLoading(false);
          return;
        }
      }

  
      if (searchType === 'phone') {
        if (!firstName.trim()) {
          setError('Please enter your first name');
          setLoading(false);
          return;
        }
        if (!phoneNumber.trim() || !phoneNumber.startsWith('+251')) {
          setError('Please enter a valid phone number starting with +251');
          setLoading(false);
          return;
        }
      }
  
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accountNumber: searchType === 'account' ? accountNumber : null,
          searchName: searchType === 'name' ? searchName : null,
          firstName: searchType === 'phone' ? firstName : null,
          phoneNumber: searchType === 'phone' ? phoneNumber : null
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        if (result.isNameSearch) {
          setAccountResults(result.data);
          setShowAccountSelection(true);
        } else {
          const transactionsResponse = await fetch(`/api/transactions?accountNumber=${
            searchType === 'account' ? accountNumber : result.data.CUST_AC_NO
          }`);
          const transactionsResult = await transactionsResponse.json();
          
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +251
    if (!cleaned.startsWith('+251')) {
      return '+251' + cleaned.replace(/^\+251/, '');
    }
    
    return cleaned;
  };




  const handleAccountSelect = async (selectedAccountNumber: string) => {
    setAccountNumber(selectedAccountNumber);
    setShowAccountSelection(false);

    // Extract CIF from account number
    let cif = '';
    if (selectedAccountNumber.length === 16) {
      const withoutLast3 = selectedAccountNumber.slice(0, -3);
      cif = withoutLast3.slice(-7);
    }

    // Get account name from account results
    const account = accountResults.find(acc => acc.CUST_AC_NO === selectedAccountNumber);
    const accountName = account?.ACC_DESC || '';

    // Store selected account info and show auth method selection
    setSelectedAccountForAuth({
      accountNumber: selectedAccountNumber,
      accountName: accountName,
      cif: cif
    });
    setShowAuthMethodSelection(true);
  };

  const handleAuthMethodSelect = async (method: 'face' | 'fingerprint' | 'otp') => {
    setShowAuthMethodSelection(false);

    if (!selectedAccountForAuth) return;

    if (method === 'face') {
      // Verify account and show face verification
      setLoading(true);
      try {
        const response = await fetch('/api/account/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountNumber: selectedAccountForAuth.accountNumber }),
        });

        const result = await response.json();

        if (result.success) {
          const transactionsResponse = await fetch(`/api/transactions?accountNumber=${selectedAccountForAuth.accountNumber}`);
          const transactionsResult = await transactionsResponse.json();

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
      } finally {
        setLoading(false);
      }
    } else if (method === 'fingerprint') {
      // Show fingerprint verification with CIF
      setShowFingerprintVerification(true);
    } else if (method === 'otp') {
      // Generate and send OTP
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/zsmart_branch_requests/generate-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ account_number: selectedAccountForAuth.accountNumber }),
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          setOtpMaskedPhone(result.data.maskedPhone);
          setShowOTPVerification(true);
        } else {
          setError(result.message || 'Failed to send OTP');
        }
      } catch (err) {
        setError('An error occurred while sending OTP');
      } finally {
        setLoading(false);
      }
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

  // Handler for OTP verification success
  const handleOTPSuccess = async () => {
    setShowOTPVerification(false);
    if (!selectedAccountForAuth) return;

    setLoading(true);
    setError(null);

    try {
      // Verify the account to get full account data
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber: selectedAccountForAuth.accountNumber }),
      });

      const result = await response.json();

      if (result.success) {
        const transactionsResponse = await fetch(`/api/transactions?accountNumber=${selectedAccountForAuth.accountNumber}`);
        const transactionsResult = await transactionsResponse.json();

        if (transactionsResponse.ok) {
          setAccountData({
            ...result.data,
            transactions: transactionsResult.data
          });
          setShowDashboard(true);
        } else {
          setError('Failed to fetch transactions');
        }
      } else {
        setError(result.message || 'Account not found');
      }
    } catch (err) {
      setError('An error occurred while verifying your account');
    } finally {
      setLoading(false);
    }
  };

  // Handler for fingerprint authentication success
  const handleFingerprintSuccess = async (selectedAccountNumber: string, customerName: string) => {
    // Close modal and reset view states first
    setShowFingerprintVerification(false);
    setShowInput(false);
    setShowProductsShowcase(false);
    setShowOnboarding(false);
    setShowEditForm(false);
    setShowBankFloorLayout(false);
    setSelectedOption(null);

    setLoading(true);
    setError(null);

    // If we have selectedAccountForAuth, use that specific account instead of the one from fingerprint
    const accountToUse = selectedAccountForAuth?.accountNumber || selectedAccountNumber;

    try {
      // Verify the account to get full account data
      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber: accountToUse }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Fetch transactions for the account
        const transactionsResponse = await fetch(`/api/transactions?accountNumber=${selectedAccountNumber}`);
        const transactionsResult = await transactionsResponse.json();

        const accountDataWithTransactions = {
          ...result.data,
          transactions: transactionsResult.data || []
        };

        // Set account data first - this will trigger dashboard to show
        // (dashboard condition only requires accountData, not showDashboard)
        setAccountData(accountDataWithTransactions);
        setShowDashboard(true);
        setLastActivity(Date.now());
      } else {
        setError(result.message || 'Failed to verify account');
      }
    } catch (err) {
      console.error('Fingerprint login error:', err);
      setError('An error occurred during fingerprint login');
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintClose = () => {
    setShowFingerprintVerification(false);
  };

  const isValidReference = /^\d{6}$/.test(uniqueReference);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      // Step 1: Fetch account number using the unique reference number
      const referenceResponse = await fetch(
        'http://localhost:5000/api/zsmart_branch_requests/get_account_number_by_reference_number',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referenceNumber: uniqueReference }),
        }
      );
  
      if (!referenceResponse.ok) {
        throw new Error('Invalid or Expiry Reference Number');
      }
  
      const referenceData = await referenceResponse.json();

    
  
      if (!referenceData.transactions || referenceData.transactions.length === 0) {
        throw new Error('No transactions found for the reference number');
      }
  
      const accountNumber = referenceData.transactions[0].account_number;
  
      // Step 2: Verify the account using the fetched account number
      const verifyResponse = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accountNumber: searchType === 'account' ? accountNumber : null,
          searchName: searchType === 'name' ? searchName : null,
          firstName: searchType === 'phone' ? firstName : null,
          phoneNumber: searchType === 'phone' ? phoneNumber : null
         }),
      });
  
     
      const verifyData = await verifyResponse.json();

      // console.log("verifyResponseverifyResponse", verifyResponse)
      // if (!verifyResponse.ok) {
      //   throw new Error('Failed to verify account');
      // }
  
     
  
      if (!verifyData.success || !verifyData.data) {
        throw new Error('Account verification failed');
      }

      const transactionsResponse = await fetch(`/api/transactions?accountNumber=${
        searchType === 'account' ? accountNumber : verifyData.data.CUST_AC_NO
      }`);
      const transactionsResult = await transactionsResponse.json();


      if (transactionsResponse.ok) {
        const accountDataWithTransactions = {
          ...verifyData.data,
          transactions: transactionsResult.data
        };

        if (accountDataWithTransactions.PROFILE_IMAGE) {
          setPendingAccountData(accountDataWithTransactions);
          setShowFaceVerification(true);
        } else {
          setError('Profile image not found');
        }
        
      } 

      else {
        setError('Failed to fetch transactions');
      }


  
      // Step 3: Set the account data and profile image


      setShowPopup(true);


      setAccountData(verifyData.data);
      setResponseData(referenceData.transactions);
  
      // Step 4: Show the face verification modal
      setShowFaceVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };





  // Render the transaction card based on the request type
  const renderTransactionCard = (
    transaction: Transactions,
    formData: Transactions | null,
    handleChange: (e: React.ChangeEvent<HTMLInputElement>, transaction: Transactions) => void,
    handleEditSubmitt: (e: React.FormEvent, transaction: Transactions) => void
  ) => {
    const currentFormData = formData || transaction;


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, transaction: Transactions) => {
      const { name, value } = e.target;

      const updatedFormData = {
          ...transaction,
          [name]: value,
      };

      // Convert the amount to words if the "amount_in_figures" field is updated
      if (name === 'amount_in_figures') {
          const amountInFigures = parseFloat(value);
          updatedFormData.amount_in_words = numberToWords(isNaN(amountInFigures) ? 0 : amountInFigures);
      }

      handleChange(e, updatedFormData); // Call the original handleChange with updated data
  };





  // Add new handlers for update and delete
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {


      const updateData = {
        amount_in_figures: currentFormData.amount_in_figures,
        amount_in_words: currentFormData.amount_in_words,
        Customer_Unique_Number: currentFormData.Customer_Unique_Number,
        request_type: currentFormData.request_type,
        account_number: currentFormData.account_number,
        beneficiary_account_number: currentFormData.beneficiary_account_number,
        beneficiary_name: currentFormData.beneficiary_name,
        payment_narration: currentFormData.payment_narration,
        beneficiary_bank: currentFormData.beneficiary_bank,
        beneficiary_branch: currentFormData.beneficiary_branch
    };



      const response = await fetch('http://localhost:5000/api/zsmart_branch_requests/edit_smart_branch_request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      // Handle successful update
      alert('Transaction updated successfully');
      
    } catch (error) {
      console.log('Error updating transaction:', error);
      alert('Failed to update transaction');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/zsmart_branch_requests/delete_smart_branch_request', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Customer_Unique_Number: currentFormData.Customer_Unique_Number,
          request_type: currentFormData.request_type
      })
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Handle successful deletion
      alert('Transaction deleted successfully');
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };






  
    return (
      <motion.form
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
       // onSubmit={(e) => handleEditSubmitt(e, currentFormData)}
       onSubmit={handleUpdate}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100"
      >



    <motion.h2
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
  className="text-2xl font-bold text-center text-gray-800 mb-6"
>
  {/* Animate the request type from the left */}
  <motion.span
    initial={{ opacity: 0, x: -100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 2, delay: 0.8 }}
    className="inline-block"
  >
    {transaction.request_type}
  </motion.span>

  {/* Add a space between the two parts */}
  <span> </span>

  {/* Animate "Details" from the right */}
  <motion.span
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 2, delay: 0.8 }}
    className="inline-block"
  >
    Details
  </motion.span>
</motion.h2>



        {transaction.request_type === 'Deposit' && (
          <>
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
                value={currentFormData.amount_in_figures}
                onChange={(e) => handleInputChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
              </label>
              <input
              type="text"
              value={currentFormData.amount_in_words}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              disabled
              placeholder="Amount in words will appear here"
            />
            </motion.div>

          </>
        )}


      {transaction.request_type === 'Withdraw' && (
                <>
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
                      value={currentFormData.amount_in_figures}
                      onChange={(e) => handleInputChange(e, currentFormData)}
                      className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    />
                  </motion.div>

                  <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
              </label>
              <input
              type="text"
              value={currentFormData.amount_in_words}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              disabled
              placeholder="Amount in words will appear here"
            />
            </motion.div>


                </>
              )}





  
        {transaction.request_type === 'Transfer' && (
          <>
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
                value={currentFormData.amount_in_figures}
                onChange={(e) => handleInputChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
              </label>
              <input
              type="text"
              value={currentFormData.amount_in_words}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              disabled
              placeholder="Amount in words will appear here"
            />
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_account_number" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Account Number
              </label>
              <input
                type="Number"
                id="beneficiary_account_number"
                name="beneficiary_account_number"
                value={currentFormData.beneficiary_account_number}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>

  
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_name" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Name
              </label>
              <input
                type="text"
                id="beneficiary_name"
                name="beneficiary_name"
                value={currentFormData.beneficiary_name}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>
  
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="mb-6"
            >
              <label htmlFor="payment_narration" className="block text-sm font-medium text-gray-700 mb-2">
                Narration
              </label>
              <input
                type="text"
                id="payment_narration"
                name="payment_narration"
                value={currentFormData.payment_narration}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>
          </>
        )}



        {transaction.request_type === 'Other_Bank_Transfer' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="text"
                id="amount"
                name="amount_in_figures"
                value={currentFormData.amount_in_figures}
                onChange={(e) => handleInputChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />

              
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount in Words
              </label>
              <input
              type="text"
              value={currentFormData.amount_in_words}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              disabled
              placeholder="Amount in words will appear here"
            />
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_account_number" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Account Number
              </label>
              <input
                type="Number"
                id="beneficiary_account_number"
                name="beneficiary_account_number"
                value={currentFormData.beneficiary_account_number}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>

         
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 2, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_name" className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Name
              </label>
              <input
                type="text"
                id="beneficiary_name"
                name="beneficiary_name"
                value={currentFormData.beneficiary_name}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 2.5, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_bank" className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Bank
              </label>
              <input
                type="text"
                id="beneficiary_bank"
                name="beneficiary_bank"
                value={currentFormData.beneficiary_bank}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]0"
              />
            </motion.div>




            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 3, delay: 0.8 }}
              className="mb-6"
            >
              <label htmlFor="beneficiary_branch" className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Branch
              </label>
              <input
                type="text"
                id="beneficiary_branch"
                name="beneficiary_branch"
                value={currentFormData.beneficiary_branch}
                onChange={(e) => handleChange(e, currentFormData)}
                className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
              />
            </motion.div>



          </>
        )}

        
  
       
  
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 3.5,  delay: 1.2 }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#E60000] to-[#FF6666] text-white p-3 rounded-lg font-semibold hover:from-[#B30000] hover:to-[#FF4444]"
          >
            Update Request
          </button>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 3.5,  delay: 1.2 }}
          className="mt-6"
        >
          <button
            type="button" 
            onClick={handleDelete}
            className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-red-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Cancel Request
          </button>
        </motion.div>



      </motion.form>



    );
  };







  const handleBack = () => {
    setSelectedOption(null);
    setShowBankFloorLayout(false);
    setShowProductsShowcase(false);
    setShowMainDashboard(false);
  };

  const handleBranchSelect = (branchCode: string) => {
    setBranchSelected(true);
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

    if (error) {
      return <ErrorMessage message={error} onClose={() => setError(null)} />;
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

    {showFaceVerification && accountData && (
      <FaceVerificationModal
        onClose={() => setShowFaceVerification(false)}
        onSuccess={() => {
          setShowFaceVerification(false);
          setShowPopup(true); // Show the transaction details popup
        }}
        profileImage={accountData.PROFILE_IMAGE || '/profile/default-profile.jpg'}
      />
    )}

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
          <video 
            autoPlay 
            //muted 
            loop 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onError={(e) => {
              console.error('Error loading advertisement video:', (e.target as HTMLVideoElement).error);
              // Optionally, you can show a fallback image or message here
            }}
          >
            <source src="/video/sample.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      );
    }


    if (showEditForm) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
         
    
          {/* Form Container */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleEditSubmit}
            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#e6e6e6]"
          >
            {/* Form Title - Animate from the Right */}
            <motion.h2
              initial={{ opacity: 0, x: 100 }} // Start from the right
              animate={{ opacity: 1, x: 0 }} // Move to the center
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-bold text-center text-gray-800 mb-6"
            >
              Edit or Cancel Request
            </motion.h2>
    
            {/* Unique Reference Input Field - Animate from the Left */}
            <motion.div
              initial={{ opacity: 0, x: -100 }} // Start from the left
              animate={{ opacity: 1, x: 0 }} // Move to the center
              transition={{ duration: 0.5, delay: 1 }}
              className="mb-6"
            >
              <label
                htmlFor="uniqueReference"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Unique Reference Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="uniqueReference"
                  value={uniqueReference}
                  onChange={(e) => {
                    const value = e.target.value;
                   
                    if (/^\d{0,6}$/.test(value)) {
                      setUniqueReference(value);
                    }
                  }}
                  className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                  placeholder="Enter Unique Reference Number"
                />
                <FiUser className="absolute top-3 left-3 text-gray-400" />
              </div>
            </motion.div>
    
            {/* Submit Button - Animate from the Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 50 }} // Start from the bottom
              animate={{ opacity: 1, y: 0 }} // Move to the center
              transition={{ duration: 0.5, delay: 2 }}
              className="mt-6"
            >
               <button
              type="submit"
              disabled={!isValidReference || loading} // Disable if not valid or loading
              className="wbg-gradient-to-r from-[#E60000] to-[#FF6666] text-white p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                'Submit'
              )}
            </button>
            </motion.div>
          </motion.form>


 {/* Popup for Response */}
 {showPopup && responseData && (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    onClick={() => setShowPopup(false)} // Close popup on click outside
  >
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      onClick={(e) => e.stopPropagation()} // Prevent click inside popup from closing it
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction Details</h2>
      {responseData.map((transaction) => (
        <motion.div
          key={transaction.account_number} // Add a unique key here
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {renderTransactionCard(transaction, formData, handleChange, handleEditSubmitt)}
        </motion.div>
      ))}
      <button
        onClick={() => setShowPopup(false)}
        className="w-full bg-[#E60000] text-white p-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
      >
        Close
      </button>
    </motion.div>
  </motion.div>
)}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg"
          >
            {error}
          </motion.div>
        )}
          
        </div>
      );
    }



    const storedBranch = localStorage.getItem('branchCode');
    if (!storedBranch && !branchSelected) {
      return <BranchSelection onSelect={handleBranchSelect} />;
    }

    // Show welcome screen only if no view is active AND no account data exists
    // The !accountData check prevents timing issues with React state batching
    // during fingerprint authentication (where accountData is set before showDashboard updates)
    if (!showInput && !showProductsShowcase && !showDashboard && !accountData) {
      return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#E60000] to-[#FF0000]">
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
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => setShowEditForm(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-100 transition-colors duration-300 mb-4"
          >
           Edit or Cancel Request
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
            <h2 className="text-xl font-bold mb-5 text-gray-800">Access Your Account</h2>
            
            {/* Search Type Toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('account')}
                  className={`px-4 py-2 rounded ${
                    searchType === 'account'
                      ? 'bg-[#E60000] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Account Number
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('name')}
                  className={`px-4 py-2 rounded ${
                    searchType === 'name'
                      ? 'bg-[#E60000] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Full Name
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('phone')}
                  className={`px-4 py-2 rounded ${
                    searchType === 'phone'
                      ? 'bg-[#E60000] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  First Name & Phone
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('combined')}
                  className={`px-4 py-2 rounded ${
                    searchType === 'combined'
                      ? 'bg-[#E60000] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Complete Information
                </button>
              </div>
            </div>
    
            {searchType === 'account' ? (
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
                  className="w-full p-3 border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                  placeholder="16-digit account number"
                  maxLength={16}
                />
              </div>
            ) : searchType === 'name' ? (
              <div className="relative">
                <FiUser className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className={`w-full p-2 pl-10 border ${
                    searchName && !isFullName(searchName)
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  } rounded-lg mb-2 focus:outline-none focus:ring-2`}
                  placeholder="Enter your full name"
                />
                <div className="text-sm space-y-1">
                  <p className="text-gray-500">
                    Format: First Name Father's Name Grandfather's Name
                  </p>
                  <p className="text-gray-500">
                    Example: Abebe Kebede Tadesse
                  </p>
                  {searchName && !isFullName(searchName) && (
                    <p className="text-red-500">
                      Please enter your complete name with three parts
                    </p>
                  )}
                </div>
              </div>
            ) : searchType === 'phone' ? (
              <div className="space-y-4">
                <div className="relative">
                  <FiUser className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      if (formatted.length <= 13) {
                        setPhoneNumber(formatted);
                      }
                    }}
                    className="w-full p-2 mb-5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="Enter phone number (+251...)"
                    maxLength={13}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="16-digit account number"
                    maxLength={16}
                  />
                </div>
                <div className="relative">
                  <FiUser className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="Full name"
                  />
                </div>
                <div className="relative">
                  <FiUser className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="First name"
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      if (formatted.length <= 13) {
                        setPhoneNumber(formatted);
                      }
                    }}
                    className="w-full p-2 mb-5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60000]"
                    placeholder="Phone number (+251...)"
                    maxLength={13}
                  />
                </div>
              </div>
            )}
    
            {/* Account Selection Modal */}
            {showAccountSelection && (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setShowAccountSelection(false)}
  >
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <motion.h3 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Select Your Account
          </motion.h3>
          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 200 }}
            onClick={() => setShowAccountSelection(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Search Input */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <input
            type="text"
            value={modalSearchQuery}
            onChange={(e) => setModalSearchQuery(e.target.value)}
            placeholder="Search accounts..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-[#E60000] focus:border-transparent
                     transition-colors duration-200"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>
      </div>

      {/* Account List */}
      <div className="max-h-[60vh] overflow-y-auto p-4">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Searching accounts...</p>
            </motion.div>
          ) : (
            <>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-gray-400 mb-4"
              >
                Found {filteredAccounts.length} matching accounts
              </motion.p>
              <div className="space-y-2">
                {filteredAccounts.map((account, index) => (
                  <motion.button
                    key={`${account.CUST_AC_NO}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleAccountSelect(account.CUST_AC_NO)}
                    className="w-full p-4 text-left rounded-lg flex flex-col gap-1
                             border border-gray-200 dark:border-gray-700
                             hover:bg-blue-50 dark:hover:bg-gray-700
                             group transition-all duration-200
                             transform hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {account.ACC_DESC}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        {account.CCY}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Account: {account.CUST_AC_NO}
                    </span>
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAccountSelection(false)}
          className="w-full py-2.5 px-4 rounded-lg
                     bg-gray-100 dark:bg-gray-700 
                     hover:bg-gray-200 dark:hover:bg-gray-600
                     text-gray-700 dark:text-gray-200
                     font-medium transition-colors duration-200"
        >
          Cancel
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
)}
    
            <button
              type="submit"
              disabled={loading}
             // disabled={isSubmitDisabled}
              className="w-full bg-[#E60000] text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400"
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
            className="mb-4 bg-[#FF0000] text-white px-4 py-2 rounded"
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
    } else if (selectedOption === 'echeck' && accountData) {
      return <ECheckComponent
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
    else if (selectedOption === 'set-atm-pin') {
      return <SetATMPasswordComponent onBack={handleBack} />;
    }

    else if (selectedOption === 'merchant-qr') {
      return <GetMerchantQR onBack={handleBack} />;
    }

    else if (selectedOption === 'ministatement' && accountData) {
      return (
        <MiniStatement 
          onBack={() => setSelectedOption(null)}
          accountNumber={accountData.CUST_AC_NO}
          accountName={accountData.ACC_DESC}
          currency={accountData.CCY}
        />
      );
    }

    else if (showMainDashboard && accountData) {
      return (
        <div className="w-full">
          <div className="p-4">
            <button
              onClick={handleBack}
              className="mb-4 bg-[#FF0000] text-white px-4 py-2 rounded hover:bg-[#E60000] transition-colors"
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

            noDebit={accountData.NO_DEBIT}
            noCredit={accountData.NO_CREDIT}
            dormant={accountData.DORMANT}
            accountClass={accountData.ACCOUNT_CLASS}
            branchCode={accountData.BRANCH_CODE}
            
          />
        </div>
      );
    }

    // Show dashboard when we have account data - don't require showDashboard state
    // This handles React state batching issues during fingerprint authentication
    else if (accountData) {
      return (
        <div className="w-full">



<div className="absolute top-4 right-4 z-50">
    <motion.button
      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        setShowDashboard(false);
        setAccountData(null);  // Clear account data on logout
      }}
      >
      <FiLogOut className="text-xl" />
      <span>Logout</span>
    </motion.button>
      </div>

      
          <motion.div className="w-full max-w-8xl mx-auto p-4 sm:p-8">
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




                <motion.span className="block bg-gradient-to-r from-[#E60000] to-[#FF0000] bg-clip-text text-transparent">
                  Welcome,
                </motion.span>
                <motion.span className="block mt-2 bg-gradient-to-r from-[#FF0000] to-[#FF6666] bg-clip-text text-transparent truncate">
                  {userData.name}
                </motion.span>
              </motion.h1>
            </motion.div>
            <div className="flex flex-col sm:flex-row items-center mb-6 rounded-lg shadow-lg p-4 overflow-hidden relative">
  <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] via-[#FF6666] to-[#FFA6A6] opacity-90 animate-gradient-x"></div>
  <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>

  <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 w-full">
    {/* Profile Image */}
    <div className="w-full sm:w-auto flex-shrink-0 mb-4 sm:mb-0">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] via-[#FF6666] to-[#FFA6A6] rounded-full animate-pulse-slow"></div>
        <img 
          src={userData.profileImage} 
          alt="Profile" 
          className="w-full h-full rounded-full border-4 border-white/50 object-cover relative z-10"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/profile/default-profile.jpg";
          }} 
        />
      </div>
    </div>

    {/* Account Overview Section */}
    <div className="flex-1 text-center sm:text-left sm:ml-6 z-10 w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">
        Account Overview
      </h2>

      {/* Account Cards Carousel */}
      <div className="relative w-full">
        {/* Left scroll button */}
        <button
          onClick={() => {
            const container = document.getElementById('account-carousel');
            if (container) {
              container.scrollBy({ left: -300, behavior: 'smooth' });
            }
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        >
          
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable container */}
        <div 
          id="account-carousel"
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x flex space-x-4 px-12"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {userAccounts.map((account, index) => (
            <motion.div
              key={account.CUST_AC_NO}
              className={`flex-shrink-0 snap-center cursor-pointer rounded-lg backdrop-blur-md min-w-[280px] sm:min-w-[220px]
                ${account.CUST_AC_NO === accountData.CUST_AC_NO 
                  ? 'bg-gradient-to-br from-[#E60000]/80 to-[#E60000]/80 shadow-lg shadow-[#FF6666]/30' 
                  : 'bg-white/10 hover:bg-white/15'}`}
              onClick={async () => {
                try {
                  const response = await fetch('/api/account/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountNumber: account.CUST_AC_NO }),
                  });

                  const result = await response.json();
                  if (result.success) {
                    setAccountData(result.data);
                    setSelectedAccountIndex(index);
                  }
                } catch (error) {
                  console.error('Error switching accounts:', error);
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                    ${account.CCY === 'ETB' ? 'bg-green-500/20 text-green-300' :
                      account.CCY === 'USD' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-purple-500/20 text-purple-300'}`}>
                    {account.CCY}
                  </span>
                  {account.CUST_AC_NO === accountData.CUST_AC_NO && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-green-400 rounded-full w-1.5 h-1.5"
                    />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="font-mono text-white text-sm tracking-wide">
                    {account.CUST_AC_NO.replace(/(\d{4})/g, '$1 ').trim()}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    {account.ACC_DESC}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => {
            const container = document.getElementById('account-carousel');
            if (container) {
              container.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-violet-900/90 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-violet-900/90 to-transparent pointer-events-none z-10" />
      </div>

      {/* Selected Account Details */}
      <div className="space-y-3 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Available Balance</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-white/60 text-sm">{accountData.CCY}</span>
            <span className="text-white text-xl font-bold tracking-tight">
              {accountData.AVAILABLE_BALANCE.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10"
          >
            <p className="text-white/60 text-xs mb-1">Account Type</p>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-md inline-block
              ${accountData.CCY === 'ETB' ? 'bg-green-500/20 text-green-300' :
                accountData.CCY === 'USD' ? 'bg-blue-500/20 text-blue-300' :
                'bg-purple-500/20 text-purple-300'}`}>
              {accountData.CCY}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10"
          >
            <p className="text-white/60 text-xs mb-1">Status</p>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="text-white text-sm">Active</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</div>












            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                className="bg-[#E60000] rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('dashboard')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiDatabase className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Account Dashboard</span>
                </div>
              </motion.div>

              {/* Hide Withdraw if NO_DEBIT is restricted */}
              {accountData.NO_DEBIT !== 'Y' && (
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
              )}

              {/* Hide Deposit if NO_CREDIT is restricted */}
              {accountData.NO_CREDIT !== 'Y' && (
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
              )}

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

              {/* Hide E-Check if NO_DEBIT is restricted */}
              {accountData.NO_DEBIT !== 'Y' && (
                <motion.div
                  className="bg-teal-600 rounded-lg overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOptionClick('echeck')}
                >
                  <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                    <FiCheckSquare className="text-3xl sm:text-4xl mb-2" />
                    <span className="text-base sm:text-lg font-semibold text-center">E-Check</span>
                  </div>
                </motion.div>
              )}

              {/* <motion.div
              className="bg-pink-500 rounded-lg overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('set-atm-pin')}
            >
              <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                <FiLock className="text-3xl sm:text-4xl mb-2" />
                <span className="text-base sm:text-lg font-semibold text-center">Set ATM PIN</span>
              </div>
            </motion.div> */}


            {/* <motion.div
              className="bg-purple-500 rounded-lg overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick('merchant-qr')}
            >
              <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                <QrCode className="text-3xl sm:text-4xl mb-2" />
                <span className="text-base sm:text-lg font-semibold text-center">Get Merchant QR</span>
              </div>
            </motion.div> */}


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

              {/* <motion.div
                className="bg-fuchsia-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Dispitute Card Request</span>
                </div>
              </motion.div> */}

              {/* <motion.div
                className="bg-lime-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Prepaid card Request</span>
                </div>
              </motion.div> */}

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

              {/* <motion.div
                className="bg-purple-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('bank-floor-layout')}
              >
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-3xl sm:text-4xl mb-2" />
                  <span className="text-base sm:text-lg font-semibold text-center">Demo Zemen Site Map</span>
                </div>
              </motion.div> */}

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
        {showFingerprintVerification && (
          <FingerprintVerificationModal
            onClose={handleFingerprintClose}
            onSuccess={handleFingerprintSuccess}
            cif={selectedAccountForAuth?.cif}
          />
        )}
        {showAuthMethodSelection && selectedAccountForAuth && (
          <AuthMethodSelectionModal
            onClose={() => setShowAuthMethodSelection(false)}
            onSelectMethod={handleAuthMethodSelect}
            accountNumber={selectedAccountForAuth.accountNumber}
            accountName={selectedAccountForAuth.accountName}
          />
        )}
        {showOTPVerification && selectedAccountForAuth && (
          <OTPVerificationModal
            onClose={() => setShowOTPVerification(false)}
            onSuccess={handleOTPSuccess}
            accountNumber={selectedAccountForAuth.accountNumber}
            maskedPhone={otpMaskedPhone}
          />
        )}
        {showFaydaPDFUpload && (
          <FaydaPDFUpload
            onDataExtracted={(data) => {
              console.log('PDF data extracted:', data);
              setFaydaData(data);
              setShowFaydaPDFUpload(false);
              setShowFaydaModal(true);
            }}
            onClose={() => setShowFaydaPDFUpload(false)}
          />
        )}
        <FaydaDataModal
          isOpen={showFaydaModal}
          onClose={() => setShowFaydaModal(false)}
          data={faydaData}
          onConfirm={(data) => {
            console.log('User confirmed Fayda data:', data);
            // TODO: Handle the confirmed data - auto-fill forms, etc.
            setShowFaydaModal(false);
          }}
        />
      </main>
    </OpenCVProvider>
  );
}