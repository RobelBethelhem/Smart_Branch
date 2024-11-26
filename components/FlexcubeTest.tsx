'use client';

import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface FlexcubeTestProps {
  onBack: () => void;
}

export default function FlexcubeTest({ onBack }: FlexcubeTestProps) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/flexcube');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4">
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">FLEXCUBE Database Connection Test</h1>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Testing Connection...' : 'Test FLEXCUBE Connection'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="font-bold">Connection Error:</p>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Query Results:</h2>
            <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}