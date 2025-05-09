'use client';
import { useState, useEffect } from 'react';
import api from '../../../utils/api';

interface PrivacySettings {
  epsilon: number;
  queryType: 'lab_average' | 'age_distribution' | 'diagnosis_count';
}

interface Patient {
  _id: string;
  name: string;
  age: number;
  diagnosis: string;
  lab_result: number;
}

interface DPResult {
  queryType: string;
  epsilon: number;
  result: number | Array<{key: string, value: number}>;
  timestamp: string;
}

export default function Analytics() {
  const [settings, setSettings] = useState<PrivacySettings>({
    epsilon: 1.0,
    queryType: 'lab_average',
  });
  
  const [dpResults, setDpResults] = useState<DPResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Query descriptions for user information
  const queryDescriptions = {
    lab_average: 'Average of all patient lab results with privacy protection',
    age_distribution: 'Age distribution of patients (not yet implemented in backend)',
    diagnosis_count: 'Count of patients per diagnosis (not yet implemented in backend)',
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'epsilon') {
      setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else if (name === 'queryType') {
      setSettings(prev => ({ ...prev, [name]: value as 'lab_average' | 'age_distribution' | 'diagnosis_count' }));
    }
  };
  
  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Currently we only have the lab_average endpoint implemented on the backend
      // For a real implementation, we would have different endpoints for different query types
      const endpoint = 'ehr/dp/lab_average';
      const res = await api.get(`${endpoint}?epsilon=${settings.epsilon}`);
      
      // Format the response based on query type (in a real app, this would be different for each query type)
      const formattedResult: DPResult = {
        queryType: settings.queryType,
        epsilon: settings.epsilon,
        result: res.data.dp_average,
        timestamp: new Date().toISOString(),
      };
      
      setDpResults([formattedResult, ...dpResults]);
      setLoading(false);
    } catch (err) {
      console.error('Error running DP query:', err);
      setError('Failed to run privacy-preserving query');
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
  
  const privacyLevel = getPrivacyLevel(settings.epsilon);
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-800 mb-3">Privacy-Preserving Analytics</h1>
        <p className="text-gray-600">
          Run privacy-protected queries on patient data using differential privacy. 
          Adjust the privacy level to balance between data utility and privacy protection.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Query Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Query Type
              </label>
              <select
                name="queryType"
                value={settings.queryType}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="lab_average">Lab Result Average</option>
                <option value="age_distribution">Age Distribution</option>
                <option value="diagnosis_count">Diagnosis Count</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {queryDescriptions[settings.queryType]}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Privacy Level (Epsilon): {settings.epsilon.toFixed(1)}
              </label>
              <input
                type="range"
                name="epsilon"
                min="0.1"
                max="5"
                step="0.1"
                value={settings.epsilon}
                onChange={handleChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>More Privacy</span>
                <span>More Accuracy</span>
              </div>
              <div className={`text-sm font-medium ${privacyLevel.color} mt-1`}>
                Current Setting: {privacyLevel.level} Privacy
              </div>
            </div>
            
            <button
              onClick={runQuery}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Running Query...' : 'Run Privacy-Preserving Query'}
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-md font-semibold text-blue-800 mb-2">About Differential Privacy</h3>
            <p className="text-sm text-gray-700">
              Differential Privacy is a mathematical framework that ensures the 
              privacy of individuals in a dataset by adding carefully calibrated noise 
              to query results.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Epsilon</strong> controls the privacy-utility tradeoff:
            </p>
            <ul className="text-sm text-gray-700 mt-1 ml-4 list-disc">
              <li>Lower epsilon = stronger privacy, less accurate results</li>
              <li>Higher epsilon = weaker privacy, more accurate results</li>
            </ul>
          </div>
        </div>
        
        {/* Right panel: Results */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Query Results</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {dpResults.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-500">
                No queries have been run yet. Adjust your privacy settings and run a query.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Most recent result visualization */}
              <div className="p-4 border rounded bg-blue-50">
                <h3 className="font-medium mb-2">
                  Latest Result: {dpResults[0].queryType.replace('_', ' ').toUpperCase()}
                </h3>
                
                <div className="bg-white p-4 rounded shadow-sm">
                  {typeof dpResults[0].result === 'number' ? (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        {dpResults[0].result.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ε = {dpResults[0].epsilon.toFixed(1)} | 
                        Privacy Level: {getPrivacyLevel(dpResults[0].epsilon).level}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Placeholder for array results like distribution data */}
                      <p>Distribution visualization would go here</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Query history */}
              <div>
                <h3 className="font-medium mb-2">Query History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Query Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Epsilon
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dpResults.map((result, index) => (
                        <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                            {result.queryType.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {result.epsilon.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {typeof result.result === 'number' 
                              ? result.result.toFixed(2) 
                              : 'Complex result'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 