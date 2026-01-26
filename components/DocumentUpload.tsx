// 3. Document Upload
interface FormData {
  region: Region | '';
  city: string;
  subcity: SubCity | '';
  'woreda/kebele': string;
  houseNumber?: string;
  telephoneResidential?: string;
  mobileNumber?: string;
  officeTelephone?: string;
  faxNumber?: string;
  postOfficeBox?: string;
  email?: string;
  idNumber?: string;
  tinNumber?: string;
  dateOfBirth?: string;
  occupation?: string;
  position?: string;
  employer?: string;
  monthlyIncome?: string;
  annualIncome?: string;
  organazationEstablishmentDate?: string;
  initialDeposit?: number;
  gender: Gender | '';
  idType: IdType | '';
  issuedBy: IssuedBy | '';
}

type Gender = 'Male' | 'Female';
type IdType = 'Passport' | 'National ID' | 'Driver License' | 'Kebele ID';
type IssuedBy = 'Government' | 'Private';

interface DocumentUploadProps {
  onNext: () => void;
  onPrev: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

import Ethiopia, { Region, SubCity, CityWithKebele } from './EthiopiaLocationmapper';

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext, onPrev, formData, setFormData }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset dependent fields when parent selection changes
    if (name === 'region') {
      setFormData({
        ...formData,
        region: value as Region | '',
        city: '',
        subcity: '',
        'woreda/kebele': ''
      });
    } else if (name === 'city') {
      setFormData({
        ...formData,
        city: value,
        subcity: '',
        'woreda/kebele': ''
      });
    } else if (name === 'subcity') {
      setFormData({
        ...formData,
        subcity: value as SubCity | '',
        'woreda/kebele': ''
      });
    } else if (name === 'woreda/kebele') {
      setFormData({
        ...formData,
        'woreda/kebele': value
      });
    } else if (name === 'initialDeposit') {
      setFormData({
        ...formData,
        initialDeposit: value ? Number(value) : undefined
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Personal Details</h2>
      <form className="space-y-4">
        {/* Location Details - Full Width */}
        <div className="space-y-4">
          {/* Region and City in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region Select */}
            <div className="relative">
              <select
                id="region"
                name="region"
                value={formData.region || ''}
                onChange={handleInputChange}
                className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                required
              >
                <option value="" disabled hidden>Select Region</option>
                {Ethiopia.region.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <label htmlFor="region" className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600">
                Region
              </label>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* City Select */}
            {formData.region && (
              <div className="relative">
                <select
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="" disabled hidden>Select City</option>
                  {Ethiopia.city[formData.region]?.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <label htmlFor="city" className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600">
                  City
                </label>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Subcity and Woreda/Kebele in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subcity Select - Only for Addis Ababa */}
            {formData.region === 'Addis Ababa' && formData.city && (
              <div className="relative">
                <select
                  id="subcity"
                  name="subcity"
                  value={formData.subcity || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="" disabled hidden>Select Subcity</option>
                  {Ethiopia.subcity['Addis Ababa']?.map((subcity) => (
                    <option key={subcity} value={subcity}>{subcity}</option>
                  ))}
                </select>
                <label htmlFor="subcity" className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600">
                  Subcity
                </label>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Woreda/Kebele Select - Show for both Addis Ababa subcities and cities with kebeles */}
            {(formData.subcity || (formData.city && Ethiopia['woreda/kebele'][formData.city as CityWithKebele])) && (
              <div className="relative">
                <select
                  id="woreda/kebele"
                  name="woreda/kebele"
                  value={formData['woreda/kebele'] || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="" disabled hidden>Select Woreda/Kebele</option>
                  {formData.subcity 
                    ? Ethiopia['woreda/kebele'][formData.subcity]?.map((woreda) => (
                        <option key={woreda} value={woreda}>{woreda}</option>
                      ))
                    : Ethiopia['woreda/kebele'][formData.city as CityWithKebele]?.map((woreda) => (
                        <option key={woreda} value={woreda}>{woreda}</option>
                      ))
                  }
                </select>
                <label htmlFor="woreda/kebele" className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600">
                  Woreda/Kebele
                </label>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              value={formData.houseNumber || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="House Number"
            />
            <label
              htmlFor="houseNumber"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              House Number
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="telephoneResidential"
              name="telephoneResidential"
              value={formData.telephoneResidential || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Telephone Residential"
            />
            <label
              htmlFor="telephoneResidential"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Telephone Residential
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Mobile Number"
            />
            <label
              htmlFor="mobileNumber"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Mobile Number
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="officeTelephone"
              name="officeTelephone"
              value={formData.officeTelephone || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Office Telephone"
            />
            <label
              htmlFor="officeTelephone"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Office Telephone
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="faxNumber"
              name="faxNumber"
              value={formData.faxNumber || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Fax Number"
            />
            <label
                htmlFor="faxNumber"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Fax Number
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="postOfficeBox"
              name="postOfficeBox"
              value={formData.postOfficeBox || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Post Office Box"
            />
            <label
                htmlFor="postOfficeBox"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Post Office Box
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Email"
            />
            <label
                htmlFor="email"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Email
            </label>
          </div>
        </div>

        {/* ID Information - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <select
              id="idType"
              name="idType"
              value={formData.idType || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              required
            >
              <option value="" disabled hidden>Select ID Type</option>
              {(['Passport', 'National ID', 'Driver License', 'Kebele ID'] as IdType[]).map((idType) => (
                <option key={idType} value={idType}>{idType}</option>
              ))}
            </select>
            <label 
              htmlFor="idType" 
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              ID Type
            </label>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              id="idNumber  "
              name="idNumber"
              value={formData.idNumber || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="ID Number/ registration Number"
            />
            <label
              htmlFor="idNumber"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              ID Number/ registration Number
            </label>
          </div>

          <div className="relative">
            <select
              id="issuedBy"
              name="issuedBy"
              value={formData.issuedBy || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              required
            >
              <option value="" disabled hidden>Select Issuer</option>
              {(['Government', 'Private',] as IssuedBy[]).map((issuedBy) => (
                <option key={issuedBy} value={issuedBy}>{issuedBy}</option>
              ))}
            </select>
            <label 
              htmlFor="issuedBy" 
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Issued By
            </label>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              id="tinNumber"
              name="tinNumber"
              value={formData.tinNumber || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="TIN Number"
            />
            <label
              htmlFor="issuedBy"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              TIN Number
            </label>
          </div>
        </div>

        {/* Personal Information - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <select
              id="gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              required
            >
              <option value="" disabled hidden>Select Gender</option>
              {(['Male', 'Female'] as Gender[]).map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            <label 
              htmlFor="gender" 
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
              Gender
            </label>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <label
              htmlFor="dateOfBirth"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600"
            >
              Date of Birth
            </label>
          </div>
        </div>

        {/* Employment Information - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Occupation"
            />
            <label
                htmlFor="occupation"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
            Occupation
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Position"
            />
            <label
                htmlFor="position"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
            Position
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="employer"
              name="employer"
              value={formData.employer || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Employer"
            />
            <label
                htmlFor="employer"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
            Employer
            </label>
          </div>

          <div className="relative">
            <input
              type="Number"
              id="monthlyIncome"
              name="monthlyIncome"
              value={formData.monthlyIncome || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Monthly Income"
            />
            <label
                htmlFor="monthlyIncome"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
            Monthly Income
            </label>
          </div>

          <div className="relative">
            <input
              type="Number"
              id="annualIncome"
              name="annualIncome"
              value={formData.annualIncome || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
              placeholder="Annual Income"
            />
            <label
                htmlFor="annualIncome"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
            Annual Income
            </label>
          </div>

          <div className="relative">
            <input
              type="date"
              id="organazationEstablishmentDate"
              name="organazationEstablishmentDate"
              value={formData.organazationEstablishmentDate || ''}
              onChange={handleInputChange}
              className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <label
              htmlFor="organazationEstablishmentDate"
              className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600"
            >
              Organazation Establishment Date
            </label>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
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
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;




































// // 3. Document Upload
// interface DocumentUploadProps {
//     onNext: () => void;
//     onPrev: () => void;
//     formData: any;
//     setFormData: React.Dispatch<React.SetStateAction<any>>;
//   }
  
//   const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext, onPrev, formData, setFormData }) => {
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//       if (e.target.files) {
//         setFormData({ ...formData, [e.target.name]: e.target.files[0] });
//       }
//     };
  
//     return (
//       <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload Documents</h2>
//         <div className="space-y-4">
//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
//             <label htmlFor="idUpload" className="block cursor-pointer">
//               <span className="mt-2 block text-sm font-medium text-gray-700">Upload ID</span>
//               <input id="idUpload" name="idUpload" type="file" className="hidden" onChange={handleFileChange} />
//               <span className="mt-2 block text-sm text-gray-500">
//                 {formData.idUpload ? formData.idUpload.name : 'Drag and drop or click to upload'}
//               </span>
//             </label>
//           </div>
//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
//             <label htmlFor="addressUpload" className="block cursor-pointer">
//               <span className="mt-2 block text-sm font-medium text-gray-700">Upload Proof of Address</span>
//               <input id="addressUpload" name="addressUpload" type="file" className="hidden" onChange={handleFileChange} />
//               <span className="mt-2 block text-sm text-gray-500">
//                 {formData.addressUpload ? formData.addressUpload.name : 'Drag and drop or click to upload'}
//               </span>
//             </label>
//           </div>
//           <div className="flex justify-between">
//             <button
//               onClick={onPrev}
//               className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
//             >
//               Prev
//             </button>
//             <button
//               onClick={onNext}
//               className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   export default DocumentUpload;






