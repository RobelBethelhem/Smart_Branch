import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, ArrowUpRight, RefreshCcw, Info, MessageCircle, CreditCard } from 'lucide-react';
import OtherBankTransferComponent from './OtherBankTransfer'; // Adjust the import path as needed

// // Mock user data
// const userData = {
//   name: "Robel Asfaw",
//   balance: 3,
//   profileImage: "/profile/profile.jpg"
// };

interface DashboardOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const DashboardOption: React.FC<DashboardOptionProps> = ({ icon, label, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.90 }}
    className="bg-white p-4 rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center"
    onClick={onClick}
  >
    {icon}
    <span className="mt-2 text-sm font-medium">{label}</span>
  </motion.div>
);

interface UserDashboardProps {
  onOptionClick: (option: string) => void;
  balance: number;
  name: string;
  profileImage: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onOptionClick, balance, name,profileImage }) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [showTransfer, setShowTransfer] = useState(false); // State to show OtherBankTransferComponent

  const handleOptionClick = (option: string) => {
    onOptionClick(option);
    console.log(`Selected option: ${option}`);
    
    if (option === 'comment') {
      setShowCommentForm(true);
      setShowTransfer(false);
    } else if (option === 'other-bank-transfer') {
      setShowTransfer(true);
      setShowCommentForm(false);
    } else {
      setShowCommentForm(false);
      setShowTransfer(false);
    }
  };


  

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Comment submitted: ${comment}`);
    setComment('');
    setShowCommentForm(false);
  };

  const handleBack = () => {
    setShowTransfer(false); // Go back to dashboard
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-gray-100 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          {showTransfer ? (
            <OtherBankTransferComponent onBack={handleBack} balance={balance} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-1xl font-bold text-gray-800">Welcome, {name}</h1>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex justify-center mb-8">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-40 h-40 rounded-full border-4 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/profile/default-profile.jpg';
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <DashboardOption 
                  icon={<DollarSign className="w-8 h-8 text-blue-500" />} 
                  label="Withdraw" 
                  onClick={() => handleOptionClick('withdraw')} 
                />
                <DashboardOption 
                  icon={<ArrowUpRight className="w-8 h-8 text-green-500" />} 
                  label="Deposit" 
                  onClick={() => handleOptionClick('deposit')} 
                />
                <DashboardOption 
                  icon={<RefreshCcw className="w-8 h-8 text-purple-500" />} 
                  label="Transfer" 
                  onClick={() => handleOptionClick('transfer')} 
                />
                <DashboardOption 
                  icon={<Info className="w-8 h-8 text-orange-500" />} 
                  label="Foreign Exchange" 
                  onClick={() => handleOptionClick('forex')} 
                />
                <DashboardOption 
                  icon={<MessageCircle className="w-8 h-8 text-orange-500" />} 
                  label="Drop Comment" 
                  onClick={() => handleOptionClick('comment')} 
                />
                <DashboardOption 
                  icon={<CreditCard className="w-8 h-8 text-blue-600" />} 
                  label="Other Bank Transfer" 
                  onClick={() => handleOptionClick('other-bank-transfer')} 
                />
              </div>

              {showCommentForm && (
                <form onSubmit={handleCommentSubmit} className="mt-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Leave your comment here..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Submit Comment
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;