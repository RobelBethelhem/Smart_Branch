import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { nanoid } from 'nanoid';

interface DynamicField {
  id: string;
  key: string;
  value: string;
}

interface GetMerchantQRProps {
  onBack: () => void;
}

const GetMerchantQR: React.FC<GetMerchantQRProps> = ({ onBack }) => {
  const [terminalId, setTerminalId] = useState('');
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [qrData, setQrData] = useState('');

  // New state variables for color and size
  const [qrColor, setQrColor] = useState('#000000'); // Default black
  const [qrSize, setQrSize] = useState(256); // Default size

  // Generate QR data whenever fields change
  useEffect(() => {
    const data = {
      terminalId,
      ...dynamicFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: field.value
      }), {})
    };
    setQrData(JSON.stringify(data));
  }, [terminalId, dynamicFields]);

  const addDynamicField = () => {
    setDynamicFields([
      ...dynamicFields,
      { id: nanoid(), key: '', value: '' }
    ]);
  };

  const removeDynamicField = (id: string) => {
    setDynamicFields(dynamicFields.filter(field => field.id !== id));
  };

  const updateDynamicField = (id: string, key: string, value: string) => {
    setDynamicFields(dynamicFields.map(field => 
      field.id === id ? { ...field, [key === 'key' ? 'key' : 'value']: value } : field
    ));
  };

  const handleSubmit = async () => {
    // Here you would implement the Telegram sending logic
    // For now, we'll just show success message
    setIsSuccess(true);
  };

  const isValid = terminalId.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="mr-4 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Generate Merchant QR</h2>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Form Section */}
              <div className="space-y-6">
                {/* Terminal ID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal ID *
                  </label>
                  <input
                    type="text"
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter Terminal ID"
                  />
                </div>

                {/* Dynamic Fields */}
                {dynamicFields.map((field) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateDynamicField(field.id, 'key', e.target.value)}
                      placeholder="Field name"
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateDynamicField(field.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => removeDynamicField(field.id)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                      title="Remove field"
                    >
                      <X className="w-6 h-6" />
                      <span className="sr-only">Remove field</span>
                    </button>
                  </motion.div>
                ))}

                {/* Add/Remove Field Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={addDynamicField}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <Plus className="w-5 h-5" />
                    Add Field
                  </button>
                  {dynamicFields.length > 0 && (
                    <button
                      onClick={() => setDynamicFields([])}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      <X className="w-5 h-5" />
                      Remove All Fields
                    </button>
                  )}
                </div>

                {/* QR Code Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Color
                  </label>
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-16 h-10 p-0 border-none cursor-pointer"
                  />
                </div>

                {/* QR Code Size Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Size (px)
                  </label>
                  <input
                    type="number"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    min={128}
                    max={512}
                    step={16}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                    isValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  Send to Telegram
                </button>
              </div>

              {/* QR Code Section */}
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ scale: [0.95, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <QRCodeSVG
                    value={qrData || ' '}
                    size={qrSize} // Updated size
                    level="H"
                    includeMargin
                    fgColor={qrColor} // Updated color
                    className="rounded-lg shadow-lg"
                  />
                  {/* <motion.img
                    src="/your-logo.png" // Add your logo path here
                    alt="Logo"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white p-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  /> */}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">QR Code Sent Successfully!</h3>
              <p className="text-gray-600 mb-6">Your QR code has been sent to Telegram.</p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GetMerchantQR;

