// 5. Account Setup
interface AccountSetupProps {
    onNext: () => void;
    onPrev: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
  }
  
  const AccountSetup: React.FC<AccountSetupProps> = ({ onNext, onPrev, formData, setFormData }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Set Up Your Account</h2>
        <form className="space-y-4">
        <div className="relative">
            <select
                id="accountType"
                name="accountType"
                className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                required
            >
                <option value="" disabled selected hidden></option>
                <option value="Savings">Savings</option>
                <option value="Checking">Checking</option>
                <option value="Investment">Investment</option>
            </select>
            <label
                htmlFor="accountType"
                className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
            >
                Account Type
            </label>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
            </div>
            </div>
          <div>
            <label htmlFor="initialDeposit" className="block text-sm font-medium text-gray-700">Initial Deposit</label>
            <input
              type="number"
              id="initialDeposit"
              name="initialDeposit"
              value={formData.initialDeposit || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    );
  };

  export default AccountSetup;