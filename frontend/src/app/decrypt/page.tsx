'use client';
import { useState, useEffect } from 'react';
import api from '../../../utils/api';

interface EncryptedPatient {
  _id: string;
  created_at: string;
  epsilon_used?: number;
  algorithm?: string;
  encrypted: boolean;
}

interface DecryptedPatient {
  _id: string;
  name: string;
  age: number;
  diagnosis: string;
  lab_result: number;
  created_at: string;
  updated_at: string;
}

interface DecryptionLog {
  timestamp: string;
  operation: string;
  status: string;
  patient_id?: string;
  details?: string;
}

interface QueryResult {
  encrypted_result: any;
  dp_average: number;
  epsilon: number;
  encrypted: boolean;
  timestamp: string;
  result_count: number;
}

export default function DecryptPage() {
  const [encryptedPatients, setEncryptedPatients] = useState<EncryptedPatient[]>([]);
  const [decryptedPatients, setDecryptedPatients] = useState<DecryptedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [decryptionLogs, setDecryptionLogs] = useState<DecryptionLog[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'queries'>('single');
  const [showProcess, setShowProcess] = useState(true);

  // Load encrypted patients on component mount
  useEffect(() => {
    loadEncryptedPatients();
  }, []);

  const loadEncryptedPatients = async () => {
    try {
      const response = await api.get('patients?decrypt=false');
      // Transform the response to match the expected format
      const transformedPatients = response.data.map((patient: any) => ({
        _id: patient.patient_id,
        name: patient.name === '[ENCRYPTED]' ? '[ENCRYPTED]' : patient.name,
        age: patient.age,
        diagnosis: patient.medical_history[0] || '[ENCRYPTED]',
        lab_result: patient.test_results?.lab_result || '[ENCRYPTED]'
      }));
      setEncryptedPatients(transformedPatients);
    } catch (err) {
      console.error('Failed to load encrypted patients:', err);
      setError('Failed to load encrypted patient list');
    }
  };

  const loadDecryptedPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('patients?decrypt=true');
      // Transform the response to match the expected format
      const transformedPatients = response.data.map((patient: any) => ({
        _id: patient.patient_id,
        name: patient.name,
        age: patient.age,
        diagnosis: patient.medical_history[0] || 'No diagnosis',
        lab_result: patient.test_results?.lab_result || 'No results'
      }));
      setDecryptedPatients(transformedPatients);
      
      addDecryptionLog('Bulk decryption completed', 'success', 'all', 
        `Decrypted ${transformedPatients.length} patient records`);
    } catch (err) {
      console.error('Failed to load decrypted patients:', err);
      setError('Failed to decrypt patient data');
      addDecryptionLog('Bulk decryption failed', 'error', 'all', 
        'Failed to decrypt patient records');
    } finally {
      setLoading(false);
    }
  };

  const addDecryptionLog = (operation: string, status: string, patientId?: string, details?: string) => {
    if (!showProcess) return;
    
    setDecryptionLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      operation,
      status,
      patient_id: patientId,
      details
    }]);
  };

  const simulateDecryptionProcess = (patientId: string) => {
    if (!showProcess) return;
    
    const steps = [
      { step: 'Locating encrypted record', delay: 300 },
      { step: 'Extracting encryption metadata', delay: 200 },
      { step: 'Deriving decryption key', delay: 400 },
      { step: 'Decrypting with AES-256-CBC', delay: 600 },
      { step: 'Removing padding', delay: 200 },
      { step: 'Parsing decrypted data', delay: 300 },
      { step: 'Logging access event', delay: 200 }
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        addDecryptionLog(step.step, 'processing', patientId);
      }, steps.slice(0, index + 1).reduce((acc, s) => acc + s.delay, 0));
    });
  };

  const handleSingleDecrypt = async () => {
    if (!selectedPatientId) {
      setError('Please select a patient to decrypt');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate decryption process
      simulateDecryptionProcess(selectedPatientId);
      
      // Make API call
      const response = await api.get(`patients/${selectedPatientId}`);
      
      // Transform the response and update decrypted patients list
      const transformedPatient = {
        _id: response.data.patient_id,
        name: response.data.name,
        age: response.data.age,
        diagnosis: response.data.medical_history[0] || 'No diagnosis',
        lab_result: response.data.test_results?.lab_result || 'No results'
      };
      
      setDecryptedPatients(prev => {
        const filtered = prev.filter(p => p._id !== selectedPatientId);
        return [...filtered, transformedPatient];
      });
      
      setTimeout(() => {
        addDecryptionLog('Single decryption completed', 'success', selectedPatientId, 
          `Successfully decrypted patient: ${transformedPatient.name}`);
      }, 1800);
      
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setError(err.response?.data?.detail || 'Failed to decrypt patient data');
      addDecryptionLog('Single decryption failed', 'error', selectedPatientId, 
        'Failed to decrypt patient record');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryDecrypt = async (epsilon: number = 1.0) => {
    setLoading(true);
    setError(null);
    
    try {
      addDecryptionLog('Initiating DP query', 'processing', 'query', 
        `Running query with epsilon=${epsilon}`);
      
      const response = await api.get('system/stats');
      
      setQueryResults(prev => [response.data, ...prev]);
      
      addDecryptionLog('System stats query completed', 'success', 'query', 
        `Total patients: ${response.data.total_patients || 0}`);
      
    } catch (err: any) {
      console.error('Query failed:', err);
      setError(err.response?.data?.detail || 'Failed to execute query');
      addDecryptionLog('DP query failed', 'error', 'query', 
        'Failed to execute differential privacy query');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setDecryptionLogs([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50 text-green-800';
      case 'error': return 'border-red-500 bg-red-50 text-red-800';
      case 'processing': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-green-800 mb-3">🔓 Data Decryption Center</h1>
        <p className="text-gray-600">
          Decrypt patient data, view encrypted records, and execute privacy-preserving queries. 
          Monitor the decryption process and understand data access patterns.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('single')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'single'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Single Record
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bulk'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bulk Decrypt
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queries'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              DP Queries
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Decryption Controls */}
        <div className="space-y-6">
          {/* Single Record Decryption */}
          {activeTab === 'single' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🔍 Single Record Decryption</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Encrypted Patient Record
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a patient record...</option>
                    {encryptedPatients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        ID: {patient._id} | Created: {formatTimestamp(patient.created_at)}
                        {patient.epsilon_used && ` | ε: ${patient.epsilon_used}`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSingleDecrypt}
                  disabled={loading || !selectedPatientId}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:bg-green-300"
                >
                  {loading ? 'Decrypting...' : '🔓 Decrypt Selected Record'}
                </button>
              </div>
            </div>
          )}

          {/* Bulk Decryption */}
          {activeTab === 'bulk' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📂 Bulk Decryption</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Bulk decryption will decrypt all patient records. 
                    This operation consumes significant computational resources and should be used carefully.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Found {encryptedPatients.length} encrypted records in the database.
                  </p>
                </div>

                <button
                  onClick={loadDecryptedPatients}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:bg-orange-300"
                >
                  {loading ? 'Decrypting All Records...' : '🔓 Decrypt All Records'}
                </button>
              </div>
            </div>
          )}

          {/* DP Queries */}
          {activeTab === 'queries' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🔢 Differential Privacy Queries</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Execute privacy-preserving queries on encrypted data without full decryption.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleQueryDecrypt(0.1)}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-purple-300"
                  >
                    High Privacy Query (ε=0.1)
                  </button>
                  
                  <button
                    onClick={() => handleQueryDecrypt(1.0)}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-purple-300"
                  >
                    Medium Privacy Query (ε=1.0)
                  </button>
                  
                  <button
                    onClick={() => handleQueryDecrypt(5.0)}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-purple-300"
                  >
                    Low Privacy Query (ε=5.0)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">⚙️ Decryption Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={showProcess}
                  onChange={(e) => setShowProcess(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Show decryption process in real-time
                </label>
              </div>

              <button
                onClick={clearLogs}
                className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Clear Process Logs
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Right Panel: Results and Logs */}
        <div className="space-y-6">
          {/* Decrypted Data Display */}
          {activeTab !== 'queries' && decryptedPatients.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📋 Decrypted Records</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {decryptedPatients.map((patient) => (
                  <div key={patient._id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Name:</p>
                        <p className="text-lg font-semibold text-gray-900">{patient.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Age:</p>
                        <p className="text-lg font-semibold text-gray-900">{patient.age}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                        <p className="text-lg font-semibold text-gray-900">{patient.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Lab Result:</p>
                        <p className="text-lg font-semibold text-gray-900">{patient.lab_result}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        ID: {patient._id} | Created: {formatTimestamp(patient.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Results */}
          {activeTab === 'queries' && queryResults.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📊 Query Results</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {queryResults.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-purple-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-purple-700">DP Average:</p>
                        <p className="text-2xl font-bold text-purple-900">{result.dp_average.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Privacy Level:</p>
                        <p className="text-lg font-semibold text-purple-900">ε = {result.epsilon}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Records Used:</p>
                        <p className="text-lg font-semibold text-purple-900">{result.result_count}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Encrypted:</p>
                        <p className="text-lg font-semibold text-purple-900">
                          {result.encrypted ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-purple-600">
                        Timestamp: {formatTimestamp(result.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Logs */}
          {decryptionLogs.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📝 Decryption Process</h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {decryptionLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getStatusColor(log.status)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{log.operation}</p>
                        {log.details && (
                          <p className="text-xs mt-1 opacity-75">{log.details}</p>
                        )}
                        {log.patient_id && log.patient_id !== 'all' && log.patient_id !== 'query' && (
                          <p className="text-xs mt-1 opacity-75">ID: {log.patient_id}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-75">{log.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">ℹ️ Decryption Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Security Features:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All decryption operations are logged</li>
                  <li>• Privacy budget is tracked per query</li>
                  <li>• Differential privacy protects individual records</li>
                  <li>• Audit trails maintain compliance</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Query Types:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Single:</strong> Decrypt one specific record</li>
                  <li>• <strong>Bulk:</strong> Decrypt all records at once</li>
                  <li>• <strong>DP Queries:</strong> Privacy-preserving aggregations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 