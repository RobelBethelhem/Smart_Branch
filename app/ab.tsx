// "use client";

// import React, { useState, useEffect, useCallback } from 'react';
// import UserDashboard from '../components/UserDashboard';
// import WithdrawComponent from '../components/WithdrawComponent';
// import DepositComponent from '../components/DepositComponent';
// import TransferComponent from '../components/TransferComponent';
// import ForeignExchangeComponent from '../components/ForeignExchangeComponent';

// const INACTIVITY_TIMEOUT = 150000;

// const BranchInfo: React.FC = () => {
//   const [currentDateTime, setCurrentDateTime] = useState(new Date());

//   useEffect(() => {
//     const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
//       <h2 className="text-xl font-bold mb-2">Branch Information</h2>
//       <p>Date: {currentDateTime.toLocaleDateString()}</p>
//       <p>Time: {currentDateTime.toLocaleTimeString()}</p>
//       <p>Branch: Main Branch</p>
//     </div>
//   );
// };

// export default function Home() {
//   const [accountNumber, setAccountNumber] = useState('');
//   const [showInput, setShowInput] = useState(false);
//   const [showDashboard, setShowDashboard] = useState(false);
//   const [showAd, setShowAd] = useState(false);
//   const [selectedOption, setSelectedOption] = useState<string | null>(null);
//   const [lastActivity, setLastActivity] = useState(Date.now());

//   const handleActivity = useCallback(() => {
//     setLastActivity(Date.now());
//     setShowAd(false);
//   }, []);

//   useEffect(() => {
//     const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
//     activityEvents.forEach(event => window.addEventListener(event, handleActivity));

//     return () => {
//       activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
//     };
//   }, [handleActivity]);

//   useEffect(() => {
//     const checkInactivity = setInterval(() => {
//       if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && !showAd) {
//         setShowAd(true);
//       }
//     }, 1000);

//     return () => clearInterval(checkInactivity);
//   }, [lastActivity, showAd]);

//   const handleInputClick = () => {
//     setShowInput(true);
//   };

//   const handleAccountSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (accountNumber.length === 10) {
//       setShowDashboard(true);
//     } else {
//       alert('Please enter a valid 10-digit account number');
//     }
//   };

//   const handleBack = () => {
//     setSelectedOption(null);
//   };

//   const handleOptionClick = (option: string) => {
//     setSelectedOption(option);
//   };

//   const renderContent = () => {
//     if (showAd) {
//       return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
//           <video autoPlay muted className="max-w-full max-h-full">
//             <source src="/video/sample.mp4" type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//         </div>
//       );
//     }

//     if (!showInput) {
//       return (
//         <div className="relative flex place-items-center min-h-screen">
//           <video autoPlay loop muted className="w-full h-auto">
//             <source src="/video/sample.mp4" type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//           <button
//             onClick={handleInputClick}
//             className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
//           >
//             Get Started
//           </button>
//         </div>
//       );
//     }

//     if (!showDashboard) {
//       return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//           <BranchInfo />
//           <form onSubmit={handleAccountSubmit} className="bg-white p-8 rounded-lg shadow-md">
//             <h2 className="text-2xl font-bold mb-4">Enter Your Account Number</h2>
//             <input
//               type="text"
//               value={accountNumber}
//               onChange={(e) => setAccountNumber(e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded mb-4"
//               placeholder="10-digit account number"
//             />
//             <button
//               type="submit"
//               className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
//             >
//               Submit
//             </button>
//           </form>
//         </div>
//       );
//     }

//     if (selectedOption === 'withdraw') {
//       return <WithdrawComponent onBack={handleBack} balance={10000} />;
//     } else if (selectedOption === 'deposit') {
//       return <DepositComponent onBack={handleBack} balance={10000} />;
//     } else if (selectedOption === 'transfer') {
//       return <TransferComponent onBack={handleBack} balance={10000} />;
//     } else if (selectedOption === 'forex') {
//       return <ForeignExchangeComponent onBack={handleBack} balance={10000} />;
//     } else {
//       return (
//         <UserDashboard
//           onOptionClick={handleOptionClick}
//           balance={10000}
//           name="Robel Asfaw"
//         />
//       );
//     }
//   };

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-4">
//       {renderContent()}
//     </main>
//   );
// }


































// // import React, { useState, useEffect } from 'react';
// // import { ChevronUp, ChevronDown, Users, Search } from 'lucide-react';
// // import { motion, AnimatePresence } from 'framer-motion';

// // const floors = [
// //   {
// //     number: 37,
// //     name: "Executive Suite",
// //     departments: ["CEO Office", "Board Room"],
// //     keyPersonnel: [
// //       { name: "John Doe", title: "CEO", position: "Executive", photo: "/api/placeholder/100/100" }
// //     ]
// //   },
// //   {
// //     number: 26,
// //     name: "Senior Management",
// //     departments: ["Strategy", "Finance"],
// //     keyPersonnel: [
// //       { name: "Jane Smith", title: "CFO", position: "Senior Management", photo: "/api/placeholder/100/100" },
// //       { name: "Mike Johnson", title: "COO", position: "Senior Management", photo: "/api/placeholder/100/100" }
// //     ]
// //   },
// //   {
// //     number: 13,
// //     name: "IT & Digital",
// //     departments: ["Software Development", "Digital Channel"],
// //     keyPersonnel: [
// //       { name: "Alice Brown", title: "Chief Information Officer", position: "Senior Management", photo: "/api/placeholder/100/100" },
// //       { name: "Bob Wilson", title: "Director of Digital", position: "Management", photo: "/api/placeholder/100/100" },
// //       { name: "Carol Davis", title: "Manager of Software Dev", position: "Management", photo: "/api/placeholder/100/100" }
// //     ]
// //   }
// // ];

// // const FloorCard = ({ floor, isActive, onClick }) => (
// //   <motion.div 
// //     layout
// //     initial={{ opacity: 0, y: 50 }}
// //     animate={{ opacity: 1, y: 0 }}
// //     exit={{ opacity: 0, y: -50 }}
// //     transition={{ duration: 0.5 }}
// //     className={`card w-full bg-base-100 shadow-xl mb-4 cursor-pointer ${isActive ? 'ring ring-primary' : ''}`}
// //     onClick={onClick}
// //   >
// //     <div className="card-body">
// //       <h2 className="card-title text-2xl">Floor {floor.number} - {floor.name}</h2>
// //       <p>Departments: {floor.departments.join(', ')}</p>
// //       <AnimatePresence>
// //         {isActive && (
// //           <motion.div
// //             initial={{ opacity: 0, height: 0 }}
// //             animate={{ opacity: 1, height: 'auto' }}
// //             exit={{ opacity: 0, height: 0 }}
// //             transition={{ duration: 0.3 }}
// //             className="mt-4 overflow-hidden"
// //           >
// //             <h3 className="text-xl font-semibold mb-2">Key Personnel</h3>
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //               {floor.keyPersonnel.map((person, index) => (
// //                 <motion.div
// //                   key={index}
// //                   initial={{ opacity: 0, x: -20 }}
// //                   animate={{ opacity: 1, x: 0 }}
// //                   transition={{ duration: 0.5, delay: index * 0.1 }}
// //                   className="flex items-center space-x-4"
// //                 >
// //                   <img src={person.photo} alt={person.name} className="w-12 h-12 rounded-full" />
// //                   <div>
// //                     <p className="font-semibold">{person.name}</p>
// //                     <p className="text-sm text-gray-600">{person.title}</p>
// //                     <p className="text-xs text-gray-500">{person.position}</p>
// //                   </div>
// //                 </motion.div>
// //               ))}
// //             </div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //     </div>
// //   </motion.div>
// // );

// // const SearchResult = ({ result }) => (
// //   <motion.div 
// //     initial={{ opacity: 0, y: 20 }}
// //     animate={{ opacity: 1, y: 0 }}
// //     exit={{ opacity: 0, y: -20 }}
// //     transition={{ duration: 0.3 }}
// //     className="flex items-center space-x-4 mb-2"
// //   >
// //     {result.type === 'person' && (
// //       <img src={result.photo} alt={result.name} className="w-10 h-10 rounded-full" />
// //     )}
// //     <div>
// //       <p className="font-semibold">{result.name}</p>
// //       {result.type === 'person' && (
// //         <>
// //           <p className="text-sm text-gray-600">{result.title}</p>
// //           <p className="text-xs text-gray-500">{result.position}</p>
// //         </>
// //       )}
// //       <p className="text-xs text-gray-400">Floor {result.floor}</p>
// //     </div>
// //   </motion.div>
// // );

// // const BankFloorLayout = () => {
// //   const [activeFloor, setActiveFloor] = useState(null);
// //   const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [searchResults, setSearchResults] = useState([]);

// //   useEffect(() => {
// //     const results = floors.flatMap(floor => 
// //       floor.departments.map(dept => ({ type: 'department', name: dept, floor: floor.number }))
// //         .concat(floor.keyPersonnel.map(person => ({ 
// //           type: 'person', 
// //           name: person.name, 
// //           floor: floor.number, 
// //           title: person.title, 
// //           position: person.position,
// //           photo: person.photo
// //         })))
// //     ).filter(item => 
// //       item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
// //       (item.position && item.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
// //       (item.type === 'department' && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
// //     );
// //     setSearchResults(results);
// //   }, [searchTerm]);

// //   const handleFloorClick = (index) => {
// //     setActiveFloor(activeFloor === index ? null : index);
// //   };

// //   const goToNextFloor = () => {
// //     setCurrentFloorIndex((prevIndex) => (prevIndex + 1) % floors.length);
// //   };

// //   const goToPreviousFloor = () => {
// //     setCurrentFloorIndex((prevIndex) => (prevIndex - 1 + floors.length) % floors.length);
// //   };

// //   const currentFloorPersonnel = floors[currentFloorIndex].keyPersonnel;

// //   return (
// //     <div className="container mx-auto px-4 py-8">
// //       <h1 className="text-4xl font-bold mb-8 text-center">Bank Headquarters Floor Guide</h1>
      
// //       <div className="mb-8">
// //         <div className="form-control">
// //           <div className="input-group">
// //             <input 
// //               type="text" 
// //               placeholder="Search by name, position, or department..." 
// //               className="input input-bordered w-full" 
// //               value={searchTerm}
// //               onChange={(e) => setSearchTerm(e.target.value)}
// //             />
// //             <button className="btn btn-square">
// //               <Search />
// //             </button>
// //           </div>
// //         </div>
// //         {searchTerm && (
// //           <div className="mt-4">
// //             <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
// //             <AnimatePresence>
// //               {searchResults.map((result, index) => (
// //                 <SearchResult key={index} result={result} />
// //               ))}
// //             </AnimatePresence>
// //           </div>
// //         )}
// //       </div>

// //       <div className="flex flex-col items-center mb-8">
// //         <motion.button 
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={goToPreviousFloor} 
// //           className="btn btn-circle btn-lg mb-4"
// //         >
// //           <ChevronUp size={32} />
// //         </motion.button>
// //         <div className="text-2xl font-semibold">Current Floor: {floors[currentFloorIndex].number}</div>
// //         <motion.button 
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={goToNextFloor} 
// //           className="btn btn-circle btn-lg mt-4"
// //         >
// //           <ChevronDown size={32} />
// //         </motion.button>
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
// //         <motion.div 
// //           className="space-y-4"
// //           initial={{ opacity: 0, x: -50 }}
// //           animate={{ opacity: 1, x: 0 }}
// //           transition={{ duration: 0.5 }}
// //         >
// //           <h2 className="text-2xl font-semibold mb-4">Left Wing</h2>
// //           <div className="bg-base-200 p-4 rounded-lg">
// //             <Users size={48} className="mx-auto mb-4" />
// //             <p className="text-center">Department Offices</p>
// //           </div>
// //         </motion.div>
// //         <motion.div 
// //           className="space-y-4"
// //           initial={{ opacity: 0, x: 50 }}
// //           animate={{ opacity: 1, x: 0 }}
// //           transition={{ duration: 0.5 }}
// //         >
// //           <h2 className="text-2xl font-semibold mb-4">Right Wing</h2>
// //           <div className="bg-base-200 p-4 rounded-lg">
// //             <Users size={48} className="mx-auto mb-4" />
// //             <p className="text-center">Meeting Rooms</p>
// //           </div>
// //         </motion.div>
// //       </div>

// //       <div className="mt-8">
// //         <h3 className="text-2xl font-semibold mb-4">Current Floor Personnel</h3>
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //           {currentFloorPersonnel.map((person, index) => (
// //             <motion.div
// //               key={index}
// //               initial={{ opacity: 0, y: 20 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ duration: 0.5, delay: index * 0.1 }}
// //               className="flex items-center space-x-4 bg-base-100 p-4 rounded-lg shadow"
// //             >
// //               <img src={person.photo} alt={person.name} className="w-16 h-16 rounded-full" />
// //               <div>
// //                 <p className="font-semibold">{person.name}</p>
// //                 <p className="text-sm text-gray-600">{person.title}</p>
// //                 <p className="text-xs text-gray-500">{person.position}</p>
// //               </div>
// //             </motion.div>
// //           ))}
// //         </div>
// //       </div>

// //       <div className="mt-8">
// //         {floors.map((floor, index) => (
// //           <FloorCard
// //             key={floor.number}
// //             floor={floor}
// //             isActive={activeFloor === index}
// //             onClick={() => handleFloorClick(index)}
// //           />
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // export default BankFloorLayout;
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
    } else {
      setSelectedOption(option);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
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
       
          <motion.div className="w-full max-w-4xl mx-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-8"
            >
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-4xl md:text-6xl font-black tracking-tight"
              >
                <motion.span className="block bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome,
                </motion.span>
                <motion.span className="block mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {userData.name}
                </motion.span>
              </motion.h1>
            </motion.div>

            <div className="flex items-center mb-4">
              <img 
                src={userData.profileImage} 
                alt="Profile" 
                className="w-60 h-60 rounded-full border-2 border-gray-300 mr-4 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/profile/default-profile.jpg";
                }} 
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-700">Account Overview</h2>
                <p className="text-lg text-gray-600">
                  Available Balance: {accountData.CCY} {accountData.AVAILABLE_BALANCE.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <motion.div
                className="bg-indigo-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('dashboard')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiDatabase className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Account Dashboard</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-rose-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('withdraw')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Withdraw</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-emerald-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('deposit')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiDollarSign className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Deposit</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-violet-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('transfer')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiSend className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Transfer</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-amber-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('forex')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiGlobe className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Foreign Exchange</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-orange-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('comment')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiMessageCircle className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Drop Comment</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-cyan-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Other Bank Transfer</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-teal-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">ATM Card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-fuchsia-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Dispitute Card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-lime-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('other-bank-transfer')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Prepaid card Request</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-sky-500 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('ministatement')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiDatabase className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Mini Statement</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-purple-600 rounded-lg overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick('bank-floor-layout')}
              >
                <div className="p-6 flex flex-col items-center justify-center text-white">
                  <FiCreditCard className="text-4xl mb-2" />
                  <span className="text-lg font-semibold">Demo Zemen Site Map</span>
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