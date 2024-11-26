import React, { useState, useEffect } from 'react';
import { flexcubeDB } from '@/lib/flexcube-intelligence';

const FlexcubeIntelligentQuery = () => {
  const [queryIntent, setQueryIntent] = useState('');
  const [parameters, setParameters] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common query intents for Flexcube
  const commonIntents = [
    'account_details',
    'transaction_history',
    'customer_accounts',
    'account_balance'
  ];

  const executeQuery = async () => {
    try {
      setLoading(true);
      setError('');

      // Generate the appropriate query based on intent
      const query = await flexcubeDB.generateIntelligentQuery(queryIntent, parameters);
      
      // Execute the query
      const response = await fetch('/api/flexcube/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          parameters: Object.values(parameters)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Query Intent
        </label>
        <select
          className="w-full p-2 border rounded"
          value={queryIntent}
          onChange={(e) => setQueryIntent(e.target.value)}
        >
          <option value="">Select an intent...</option>
          {commonIntents.map(intent => (
            <option key={intent} value={intent}>
              {intent.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {queryIntent && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Parameters
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter parameter value"
            onChange={(e) => setParameters({ value: e.target.value })}
          />
        </div>
      )}

      <button
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        onClick={executeQuery}
        disabled={loading || !queryIntent}
      >
        {loading ? 'Executing...' : 'Execute Query'}
      </button>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(results[0]).map(key => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((value, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap">
                      {value?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FlexcubeIntelligentQuery;