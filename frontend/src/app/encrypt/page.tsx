'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../utils/api';

interface PatientData {
  name: string;
  age: number | '';
  diagnosis: string;
  lab_result: number | '';
}

interface EncryptionResult {
  success: boolean;
  patient_id: string;
  encrypted: boolean;
  epsilon_used: number;
  timestamp: string;
  message: string;
}

interface EncryptionLog {
  timestamp: string;
  operation: string;
  epsilon: number;
  status: string;
  patient_id?: string;
}

export default function EncryptPage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    age: '',
    diagnosis: '',
    lab_result: ''
  });
  
  const [encryptionSettings, setEncryptionSettings] = useState({
    epsilon: 1.0,
    showProcess: true,
    algorithm: 'AES-256-CBC-DP'
  });
  
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);
  const [encryptionLogs, setEncryptionLogs] = useState<EncryptionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age' || name === 'lab_result') {
      setPatientData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setPatientData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setEncryptionSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               name === 'epsilon' ? parseFloat(value) : value
    }));
  };

  const validateData = () => {
    if (!patientData.name || patientData.age === '' || !patientData.diagnosis || patientData.lab_result === '') {
      setError('Please fill in all patient data fields');
      return false;
    }
    
    if (typeof patientData.age === 'number' && (patientData.age < 0 || patientData.age > 150)) {
      setError('Age must be between 0 and 150');
      return false;
    }
    
    if (encryptionSettings.epsilon < 0.1 || encryptionSettings.epsilon > 10) {
      setError('Epsilon must be between 0.1 and 10');
      return false;
    }
    
    return true;
  };

  const simulateEncryptionProcess = () => {
    if (!encryptionSettings.showProcess) return;
    
    const steps = [
      { step: 'Validating input data', delay: 500 },
      { step: 'Generating encryption salt', delay: 300 },
      { step: 'Adding differential privacy noise', delay: 600 },
      { step: 'Deriving encryption key', delay: 400 },
      { step: 'Encrypting with AES-256-CBC', delay: 700 },
      { step: 'Storing encrypted package', delay: 500 },
      { step: 'Creating audit log', delay: 300 }
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setEncryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: step.step,
          epsilon: encryptionSettings.epsilon,
          status: 'processing'
        }]);
      }, steps.slice(0, index + 1).reduce((acc, s) => acc + s.delay, 0));
    });
  };

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateData()) return;
    
    setLoading(true);
    setError(null);
    setEncryptionResult(null);
    setEncryptionLogs([]);
    
    try {
      // Simulate encryption process
      simulateEncryptionProcess();
      
      // Make API call
      const response = await api.post('patients', {
        patient_id: `P${Date.now()}`,
        name: patientData.name,
        age: Number(patientData.age),
        medical_history: [patientData.diagnosis],
        current_medications: [],
        test_results: {
          lab_result: Number(patientData.lab_result)
        },
        notes: '',
        sensitivity_level: encryptionSettings.epsilon <= 0.5 ? 'HIGH' : 
                          encryptionSettings.epsilon <= 1.0 ? 'MEDIUM' : 'LOW'
      });
      
      setEncryptionResult(response.data);
      
      // Add final log entry
      setTimeout(() => {
        setEncryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Encryption completed successfully',
          epsilon: encryptionSettings.epsilon,
          status: 'success',
          patient_id: response.data.patient_id
        }]);
      }, 3000);
      
    } catch (err: any) {
      console.error('Encryption failed:', err);
      setError(err.response?.data?.detail || 'Failed to encrypt patient data');
      
      setEncryptionLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        operation: 'Encryption failed',
        epsilon: encryptionSettings.epsilon,
        status: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatientData({
      name: '',
      age: '',
      diagnosis: '',
      lab_result: ''
    });
    setEncryptionResult(null);
    setEncryptionLogs([]);
    setError(null);
  };

  const getPrivacyLevel = (epsilon: number) => {
    if (epsilon <= 0.1) return { level: 'Very High', color: 'text-green-700', bg: 'bg-green-100' };
    if (epsilon <= 0.5) return { level: 'High', color: 'text-green-600', bg: 'bg-green-50' };
    if (epsilon <= 1.0) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (epsilon <= 2.0) return { level: 'Low', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Very Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const privacyLevel = getPrivacyLevel(encryptionSettings.epsilon);

  const commonDiagnoses = [
    'Select a diagnosis',
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Arthritis',
    'Depression',
    'Anxiety',
    'COPD',
    'Obesity',
    'Osteoporosis',
    'Other'
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-800 mb-3">🔒 Data Encryption Center</h1>
        <p className="text-gray-600">
          Encrypt patient data using AES-256-CBC with differential privacy protection. 
          Configure privacy parameters and monitor the encryption process in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Encryption Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Patient Data Input</h2>
            
            <form onSubmit={handleEncrypt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={patientData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  min="0"
                  max="150"
                  value={patientData.age}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter age"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <select
                  name="diagnosis"
                  value={patientData.diagnosis}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {commonDiagnoses.map((diagnosis) => (
                    <option 
                      key={diagnosis} 
                      value={diagnosis === 'Select a diagnosis' ? '' : diagnosis}
                      disabled={diagnosis === 'Select a diagnosis'}
                    >
                      {diagnosis}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Result
                </label>
                <input
                  type="number"
                  name="lab_result"
                  step="0.1"
                  value={patientData.lab_result}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter lab result value"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300"
                >
                  {loading ? 'Encrypting...' : '🔒 Encrypt Data'}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Privacy Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Level (Epsilon): {encryptionSettings.epsilon.toFixed(1)}
                </label>
                <input
                  type="range"
                  name="epsilon"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={encryptionSettings.epsilon}
                  onChange={handleSettingsChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More Privacy</span>
                  <span>More Accuracy</span>
                </div>
                <div className={`text-sm font-medium ${privacyLevel.color} mt-2 p-2 rounded ${privacyLevel.bg}`}>
                  Current Setting: {privacyLevel.level} Privacy Protection
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="showProcess"
                  checked={encryptionSettings.showProcess}
                  onChange={handleSettingsChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Show encryption process in real-time
                </label>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Algorithm:</strong> {encryptionSettings.algorithm}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Uses AES-256-CBC encryption with differential privacy noise injection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Results and Process */}
        <div className="space-y-6">
          {/* Encryption Result */}
          {encryptionResult && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-green-800">✅ Encryption Successful</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Patient ID:</p>
                  <p className="text-lg font-mono text-green-700">{encryptionResult.patient_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Epsilon Used:</p>
                    <p className="text-lg font-bold text-gray-900">{encryptionResult.epsilon_used}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Encrypted:</p>
                    <p className="text-lg font-bold text-green-600">
                      {encryptionResult.encrypted ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Timestamp:</p>
                  <p className="text-sm text-blue-700">{new Date(encryptionResult.timestamp).toLocaleString()}</p>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Message:</p>
                  <p className="text-sm text-yellow-700">{encryptionResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Encryption Process Log */}
          {encryptionLogs.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🔄 Encryption Process</h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {encryptionLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      log.status === 'success' ? 'border-green-500 bg-green-50' :
                      log.status === 'error' ? 'border-red-500 bg-red-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{log.operation}</p>
                        {log.patient_id && (
                          <p className="text-xs text-gray-600 mt-1">ID: {log.patient_id}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{log.timestamp}</p>
                        <p className="text-xs text-gray-500">ε = {log.epsilon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📚 Encryption Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">How It Works:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Adds differential privacy noise to numerical data</li>
                  <li>• Generates unique salt and IV for each record</li>
                  <li>• Uses PBKDF2 for key derivation (100,000 iterations)</li>
                  <li>• Encrypts with AES-256-CBC algorithm</li>
                  <li>• Stores encrypted package with metadata</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Privacy Levels:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>ε ≤ 0.1:</span>
                    <span className="text-green-700 font-medium">Very High Privacy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ε ≤ 0.5:</span>
                    <span className="text-green-600 font-medium">High Privacy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ε ≤ 1.0:</span>
                    <span className="text-yellow-600 font-medium">Medium Privacy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ε ≤ 2.0:</span>
                    <span className="text-orange-600 font-medium">Low Privacy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ε > 2.0:</span>
                    <span className="text-red-600 font-medium">Very Low Privacy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 