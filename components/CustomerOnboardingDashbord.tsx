// 7. Dashboard
const Dashboard: React.FC = () => (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Welcome to Your Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-blue-800">Account Summary</h3>
          <p className="text-lg mb-2"><span className="font-medium">Balance:</span> $10,000</p>
          <p className="text-lg"><span className="font-medium">Account Number:</span> 1234567890</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-green-800">Recent Transactions</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>Deposit</span>
              <span className="font-medium text-green-600">+$500</span>
            </li>
            <li className="flex justify-between">
              <span>Withdrawal</span>
              <span className="font-medium text-red-600">-$200</span>
            </li>
            <li className="flex justify-between">
              <span>Transfer</span>
              <span className="font-medium text-blue-600">-$300</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  export default Dashboard;