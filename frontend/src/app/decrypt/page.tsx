'use client';

import { useState, useEffect } from 'react';
import { decryptionService, DecryptionCredentials, DecryptionSession } from '../../../utils/decryption-api';

interface Patient {
  patient_id: string;
  name: string;
  age: number;
  medical_history: string[];
  current_medications: string[];
  test_results: any;
  notes?: string;
}

interface DecryptionLog {
  timestamp: string;
  operation: string;
  status: string;
  patient_id?: string;
  method?: string;
  error?: string;
}

export default function DecryptPage() {
  const [session, setSession] = useState<DecryptionSession | null>(null);
  const [credentials, setCredentials] = useState<DecryptionCredentials>({
    username: '',
    password: '',
    security_clearance: 'standard',
    purpose: '',
    department: ''
  });
  const [encryptedPatients, setEncryptedPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [decryptionLogs, setDecryptionLogs] = useState<DecryptionLog[]>([]);
  const [showLogin, setShowLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'audit'>('single');
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [bulkPatientIds, setBulkPatientIds] = useState<string>('');
  const [bulkResults, setBulkResults] = useState<any>(null);

  useEffect(() => {
    // Try to restore existing session
    const restoreSession = async () => {
      const restored = await decryptionService.restoreSession();
      if (restored) {
        setSession(decryptionService.getCurrentSession());
        setShowLogin(false);
        loadEncryptedPatients();
      }
    };
    
    restoreSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const newSession = await decryptionService.createSession(credentials);
      setSession(newSession);
      setShowLogin(false);
      
      // Load encrypted patients after successful login
      await loadEncryptedPatients();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await decryptionService.terminateSession();
      setSession(null);
      setShowLogin(true);
      setEncryptedPatients([]);
      setSelectedPatient(null);
      setDecryptionLogs([]);
      setAuditLog([]);
      setBulkResults(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const loadEncryptedPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Search for encrypted patients by different sensitivity levels
      const highSensitivity = await decryptionService.searchEncryptedPatients('HIGH', 20);
      const mediumSensitivity = await decryptionService.searchEncryptedPatients('MEDIUM', 20);
      const lowSensitivity = await decryptionService.searchEncryptedPatients('LOW', 20);
      
      const allEncrypted = [
        ...highSensitivity.encrypted_patients,
        ...mediumSensitivity.encrypted_patients,
        ...lowSensitivity.encrypted_patients
      ];
      
      setEncryptedPatients(allEncrypted);
      
    } catch (err: any) {
      console.error('Error loading encrypted patients:', err);
      setError('Failed to load encrypted patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptPatient = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      setDecryptionLogs([]);
      
      // Add decryption logs
      const logEntry: DecryptionLog = {
        timestamp: new Date().toLocaleTimeString(),
        operation: 'Starting independent decryption process',
        patient_id: patientId,
        status: 'in_progress'
      };
      setDecryptionLogs(prev => [...prev, logEntry]);
      
      // Simulate decryption process steps
      setTimeout(() => {
        setDecryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Applying reverse lattice decryption',
          patient_id: patientId,
          status: 'processing'
        }]);
      }, 500);
      
      setTimeout(() => {
        setDecryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Quantum decoherence decryption',
          patient_id: patientId,
          status: 'processing'
        }]);
      }, 1000);
      
      setTimeout(() => {
        setDecryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Temporal reconstruction decryption',
          patient_id: patientId,
          status: 'processing'
        }]);
      }, 1500);
      
      // Perform actual decryption using independent service
      const decryptedPatient = await decryptionService.decryptSinglePatient({
        patient_id: patientId,
        decryption_method: 'full_independent',
        audit_reason: 'Medical review and analysis'
      });
      
      setSelectedPatient(decryptedPatient.decrypted_data);
      
      // Add final log entry
      setTimeout(() => {
        setDecryptionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Independent decryption completed successfully',
          patient_id: patientId,
          status: 'success',
          method: 'full_independent'
        }]);
      }, 2000);
      
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setError('Failed to decrypt patient data: ' + err.message);
      
      setDecryptionLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        operation: 'Independent decryption failed',
        patient_id: patientId,
        status: 'error',
        error: err.message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDecrypt = async () => {
    if (!bulkPatientIds.trim()) {
      setError('Please enter patient IDs separated by commas');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBulkResults(null);

      const patientIds = bulkPatientIds.split(',').map(id => id.trim()).filter(id => id);
      
      const result = await decryptionService.decryptBulkPatients({
        patient_ids: patientIds,
        decryption_method: 'full_independent',
        batch_size: 5,
        audit_reason: 'Bulk medical data analysis'
      });

      setBulkResults(result);
      
    } catch (err: any) {
      setError('Bulk decryption failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const audit = await decryptionService.getSessionAuditLog();
      setAuditLog(audit.audit_entries || []);
      
    } catch (err: any) {
      setError('Failed to load audit log: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setDecryptionLogs([]);
    setError(null);
    setBulkResults(null);
  };

  // Login form
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🔓 Decryption Access</h1>
              <p className="text-gray-600">Independent Decryption System</p>
              <p className="text-sm text-gray-500 mt-2">Separate authentication required</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="decrypt_admin, medical_staff, or researcher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Clearance
                </label>
                <select
                  value={credentials.security_clearance}
                  onChange={(e) => setCredentials(prev => ({ ...prev, security_clearance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  required
                  value={credentials.purpose}
                  onChange={(e) => setCredentials(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medical analysis, research, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={credentials.department}
                  onChange={(e) => setCredentials(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cardiology, Research, IT, etc."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Access Decryption System'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</h3>
              <p className="text-xs text-gray-600">Username: decrypt_admin</p>
              <p className="text-xs text-gray-600">Password: decrypt_key_2024_secure</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main decryption interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🔓 Independent Decryption System</h1>
              <p className="text-gray-600">Separate decryption service for TDP-QIMLE encrypted data</p>
              {session && (
                <p className="text-sm text-green-600 mt-1">
                  Session: {session.session_id.substring(0, 8)}... | 
                  Clearance: {session.clearance_level} | 
                  Expires: {new Date(session.expires_at).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Single Patient Decryption
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'bulk'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bulk Decryption
            </button>
            <button
              onClick={() => {
                setActiveTab('audit');
                loadAuditLog();
              }}
              className={`px-6 py-3 font-medium ${
                activeTab === 'audit'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Audit Log
            </button>
          </div>

          <div className="p-6">
            {/* Single Patient Tab */}
            {activeTab === 'single' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Encrypted Patients List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Encrypted Patients ({encryptedPatients.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {encryptedPatients.map((patient, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 cursor-pointer"
                          onClick={() => handleDecryptPatient(patient.patient_id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{patient.patient_id}</p>
                              <p className="text-sm text-gray-500">
                                Sensitivity: {patient.sensitivity_level} | 
                                Encrypted: {new Date(patient.encrypted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🔒 Encrypted
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decryption Process */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Decryption Process
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {decryptionLogs.map((log, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>{log.operation}</span>
                            <span className="text-xs">{log.timestamp}</span>
                          </div>
                          {log.patient_id && (
                            <div className="text-xs opacity-75">Patient: {log.patient_id}</div>
                          )}
                          {log.error && (
                            <div className="text-xs opacity-75">Error: {log.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decrypted Patient Data */}
                {selectedPatient && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🔓 Decrypted Patient Data
                      </h3>
                      <button
                        onClick={handleReset}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Patient ID:</p>
                        <p className="text-gray-900">{selectedPatient.patient_id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Name:</p>
                        <p className="text-gray-900">{selectedPatient.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Age:</p>
                        <p className="text-gray-900">{selectedPatient.age}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Medical History:</p>
                        <p className="text-gray-900">{selectedPatient.medical_history?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Current Medications:</p>
                        <p className="text-gray-900">{selectedPatient.current_medications?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Test Results:</p>
                        <p className="text-gray-900">{JSON.stringify(selectedPatient.test_results)}</p>
                      </div>
                      {selectedPatient.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-gray-900">{selectedPatient.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Decryption Tab */}
            {activeTab === 'bulk' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bulk Patient Decryption
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient IDs (comma-separated)
                      </label>
                      <textarea
                        value={bulkPatientIds}
                        onChange={(e) => setBulkPatientIds(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="P123, P456, P789..."
                      />
                    </div>
                    <button
                      onClick={handleBulkDecrypt}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Decrypting...' : 'Decrypt Bulk Patients'}
                    </button>
                  </div>
                </div>

                {/* Bulk Results */}
                {bulkResults && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Bulk Decryption Results
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{bulkResults.total_requested}</p>
                        <p className="text-sm text-gray-600">Total Requested</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{bulkResults.successfully_decrypted}</p>
                        <p className="text-sm text-gray-600">Successfully Decrypted</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{bulkResults.failed_decryptions}</p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {bulkResults.decrypted_patients?.map((patient: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Patient: {patient.patient_id}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><span className="font-medium">Name:</span> {patient.data.name}</p>
                              <p><span className="font-medium">Age:</span> {patient.data.age}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Decrypted:</span> {new Date(patient.decrypted_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Session Audit Log
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLog.map((entry, index) => (
                      <div key={index} className="bg-white p-3 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{entry.action}</p>
                            <p className="text-sm text-gray-600">
                              {entry.patient_id && `Patient: ${entry.patient_id} | `}
                              User: {entry.user} | 
                              Time: {new Date(entry.timestamp * 1000).toLocaleString()}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 