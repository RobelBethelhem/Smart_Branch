import React, { useState, useRef, useEffect } from 'react';

// 4. Identity Verification
interface IdentityVerificationProps {
    onNext: () => void;
    onPrev: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
  }
  
  const IdentityVerification: React.FC<IdentityVerificationProps> = ({ onNext, onPrev, formData, setFormData }) => {

    const [searchTerm, setSearchTerm] = useState("");
    const cities = [
                "Addis Ababa",
                "Bahir dar",
                "Arbaminch",
                "Dessie",
                "Enjibara",
                "Debre Markos",
                "Mekelle"
                ];

                const filteredCities = cities.filter(city =>
                    city.toLowerCase().includes(searchTerm.toLowerCase())
                );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Verify Your Identity</h2>
        <form className="space-y-4">
          <div className="relative">
           
            <input
              type="text"
              id="mothersMaidenName"
              name="mothersMaidenName"
              value={formData.mothersMaidenName || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
               placeholder="Mother's Name"
              required
           />
            <label
                htmlFor="text"
                className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
              >
                Mother's Name
              </label>

          </div>

          <div className="relative">
            <select
                id="cityOfBirth"
                name="cityOfBirth"
                className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                
                required
            >
                <option value="" disabled selected hidden></option>
                <option value=">Addis Ababa">Addis Ababa</option>
                <option value="Bahir dar">Bahir dar</option>
                <option value="Arbaminch">Arbaminch</option>
                <option value="Dessie">Dessie</option>
                <option value="Enjibara">Enjibara</option>
                <option value="Debre Markos">Debre Markos</option>
                <option value="Mekelle">Mekelle</option>
            </select>
            <label
                htmlFor="cityOfBirth"
                className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
               City of Birth
            </label>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
            </div>
            </div>
        
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={onNext}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    );
  };

  export default IdentityVerification;