import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, MapPin, Phone, CreditCard, CheckCircle } from 'lucide-react';

interface FaydaData {
  firstName: string | null;
  middleName: string | null;
  surname: string | null;
  dateOfBirth: string | null;
  region: string | null;
  city: string | null;
  sex: string | null;
  zone: string | null;
  nationality: string | null;
  woreda: string | null;
  phoneNumber: string | null;
  idNumber: string | null;
  fullName: string | null;
  address: string | null;
}

interface FaydaDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    success: boolean;
    data: FaydaData;
    url: string;
    timestamp: string;
    extractionMethod: string;
  } | null;
  onConfirm?: (data: FaydaData) => void;
}

const FaydaDataModal: React.FC<FaydaDataModalProps> = ({ isOpen, onClose, data, onConfirm }) => {
  if (!isOpen || !data) return null;

  const faydaData = data.data;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(faydaData);
    }
  };

  const renderField = (label: string, value: string | null, icon: React.ReactNode) => {
    if (!value) return null;

    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="text-red-600 mt-1">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-base font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

  const hasAnyData = Object.values(faydaData).some(value => value !== null && value !== '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🇪🇹</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Fayda Data Extracted</h2>
                  <p className="text-red-100 text-sm">Ethiopian Digital ID Information</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!hasAnyData ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Extracted</h3>
                <p className="text-gray-600">
                  The extension could not find any data on the Fayda page.
                  <br />
                  Please make sure the ID card is loaded and visible.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Personal Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <User className="mr-2 text-red-600" size={20} />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderField('First Name', faydaData.firstName, <User size={20} />)}
                    {renderField('Middle Name', faydaData.middleName, <User size={20} />)}
                    {renderField('Surname', faydaData.surname, <User size={20} />)}
                    {renderField('Full Name', faydaData.fullName, <User size={20} />)}
                    {renderField('Sex', faydaData.sex, <User size={20} />)}
                    {renderField('Date of Birth', faydaData.dateOfBirth, <Calendar size={20} />)}
                    {renderField('Nationality', faydaData.nationality, <span>🇪🇹</span>)}
                    {renderField('ID Number', faydaData.idNumber, <CreditCard size={20} />)}
                  </div>
                </div>

                {/* Location Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <MapPin className="mr-2 text-red-600" size={20} />
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderField('Region', faydaData.region, <MapPin size={20} />)}
                    {renderField('City', faydaData.city, <MapPin size={20} />)}
                    {renderField('Zone', faydaData.zone, <MapPin size={20} />)}
                    {renderField('Woreda', faydaData.woreda, <MapPin size={20} />)}
                    {renderField('Address', faydaData.address, <MapPin size={20} />)}
                  </div>
                </div>

                {/* Contact Information */}
                {faydaData.phoneNumber && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <Phone className="mr-2 text-red-600" size={20} />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {renderField('Phone Number', faydaData.phoneNumber, <Phone size={20} />)}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Extracted from:</strong> {data.url}
                    <br />
                    <strong>Extraction time:</strong> {new Date(data.timestamp).toLocaleString()}
                    <br />
                    <strong>Method:</strong> {data.extractionMethod}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <p className="text-sm text-gray-600">
              {hasAnyData ? 'Please verify the extracted data is accurate' : 'Try refreshing the Fayda page and extract again'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              {hasAnyData && onConfirm && (
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center space-x-2"
                >
                  <CheckCircle size={20} />
                  <span>Use This Data</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FaydaDataModal;
