// 2. Registration Form
interface RegistrationFormProps {
    onNext: () => void;
    onPrev: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
  }
  
  const RegistrationForm: React.FC<RegistrationFormProps> = ({ onNext, onPrev, formData, setFormData }) => {
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
      };
    
      return (
          <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Register</h2>
            <form className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                  placeholder="Name (with Surname)/Name of Organazation"
                  required
                />
                <label
                  htmlFor="fullName"
                  className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Name (with Surname)/Name of Organazation
                </label>
              </div>


              <div className="relative">
                <input
                  type="text"
                  id="fullMotherName"
                  name="fullMotherName"
                  value={formData.fullMotherName || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                  placeholder="Name of Mother (with Surname)"
                  required
                />
                <label
                  htmlFor="fullMotherName"
                  className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Name of Mother (with Surname)
                </label>
              </div>


              
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                  placeholder="Email"
                  required
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Email
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                  placeholder="Password"
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Password
                </label>
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
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={onPrev}
                  className="bg-gray-600 text-white py-2 px-6 rounded-full hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        );
    };


    export default RegistrationForm;