'use client';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

interface DPResponse {
  dp_average: number;
  epsilon: number;
  true_average?: number; // Optional, may be provided for demo purposes
}

export default function DPResult() {
  const [epsilon, setEpsilon] = useState(1.0);
  const [dpResults, setDpResults] = useState<DPResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current DP result (most recent one)
  const currentResult = dpResults.length > 0 ? dpResults[dpResults.length - 1] : null;

  const handleQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<DPResponse>(`ehr/dp/lab_average?epsilon=${epsilon}`);
      
      // Add the new result to our history
      setDpResults([...dpResults, res.data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching DP results:', err);
      setError('Failed to load differential privacy data');
      setLoading(false);
    }
  };

  // Calculate privacy level description based on epsilon
  const getPrivacyLevel = (eps: number) => {
    if (eps <= 0.1) return { level: 'Very High', color: 'text-green-700' };
    if (eps <= 0.5) return { level: 'High', color: 'text-green-600' };
    if (eps <= 1.0) return { level: 'Medium', color: 'text-yellow-600' };
    if (eps <= 2.0) return { level: 'Low', color: 'text-orange-600' };
    return { level: 'Very Low', color: 'text-red-600' };
  };
  
  const privacyLevel = getPrivacyLevel(epsilon);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Privacy-Preserving Analytics</h2>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Privacy Protection Level (Epsilon):
            <div className="flex items-center mt-1">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={epsilon}
                onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="ml-2 w-16 text-center">
                {epsilon.toFixed(1)}
              </span>
            </div>
          </label>
          <div className={`text-sm font-medium ${privacyLevel.color} mt-1`}>
            Privacy Level: {privacyLevel.level}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Lower epsilon = more privacy, less accuracy. Higher epsilon = less privacy, more accuracy.
          </p>
        </div>
        
        <button
          onClick={handleQuery}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Get Privacy-Protected Lab Average'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Results Display */}
      {currentResult && (
        <div className="p-4 border rounded bg-white">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded text-center">
                <div className="text-sm text-gray-600">DP Lab Average</div>
                <div className="text-2xl font-bold text-blue-700">
                  {currentResult.dp_average.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  with ε = {currentResult.epsilon}
                </div>
              </div>
              
              {currentResult.true_average && (
                <div className="p-3 bg-gray-50 rounded text-center opacity-60">
                  <div className="text-sm text-gray-600">True Average (Demo Only)</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {currentResult.true_average.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Without privacy protection
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {dpResults.length > 1 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Query History</h4>
              <div className="text-xs overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Epsilon</th>
                      <th className="p-2 text-left">Result</th>
                      <th className="p-2 text-left">Privacy Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpResults.map((result, i) => {
                      const privacy = getPrivacyLevel(result.epsilon);
                      return (
                        <tr key={i} className="border-t">
                          <td className="p-2">{i + 1}</td>
                          <td className="p-2">{result.epsilon.toFixed(1)}</td>
                          <td className="p-2">{result.dp_average.toFixed(2)}</td>
                          <td className={`p-2 ${privacy.color}`}>{privacy.level}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
