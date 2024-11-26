import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';

interface SignatureModalProps {
  amount: string;
  onClose: () => void;
  onConfirm: (signature: string) => void;
  type?: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer';
  additionalInfo?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ 
  amount, 
  onClose, 
  onConfirm, 
  type = 'withdrawal',
  additionalInfo
}) => {
  const signaturePadRef = useRef<SignaturePad>(null);

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleConfirm = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert('Please provide your signature');
      return;
    }
  
    try {
      const canvas = signaturePadRef.current.getTrimmedCanvas();
      const context = canvas.getContext('2d');
      
      if (context) {
        // Create a new canvas with white background
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const newContext = newCanvas.getContext('2d');
        
        if (newContext) {
          // Fill with white background
          newContext.fillStyle = '#FFFFFF';
          newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
          
          // Draw signature in black
          newContext.drawImage(canvas, 0, 0);
          
          // Convert to base64 with JPEG format and remove data:image/jpeg;base64, prefix
          const signatureData = newCanvas.toDataURL('image/jpeg', 1.0).split(',')[1];
          onConfirm(signatureData);
        }
      }
    } catch (error) {
      console.error('Error capturing signature:', error);
      alert('Failed to capture signature. Please try again.');
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'withdrawal': return 'Verify Withdrawal';
      case 'deposit': return 'Verify Deposit';
      case 'transfer': return 'Verify Transfer';
      case 'exchange': return 'Verify Exchange';
      case 'otherBankTransfer': return 'Verify Inter-bank Transfer';
      default: return 'Verify Transaction';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Amount:</p>
          <p className="text-lg font-bold">${amount}</p>
          {additionalInfo && (
            <p className="text-sm text-gray-600 mt-1">{additionalInfo}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">Please sign below to confirm:</p>
        </div>

        <div className="border rounded-lg mb-4">
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: 'w-full h-64'
            }}
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirm Signature
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SignatureModal;