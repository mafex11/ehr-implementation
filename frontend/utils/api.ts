import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://ehr-implementation-production.up.railway.app/api/novel/', // Deployed backend
  timeout: 30000, // 30 second timeout for encryption operations
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token', // Add demo token for testing
  },
});

// Request interceptor to add authentication or other headers
api.interceptors.request.use(
  (config) => {
    // Add timestamp to all requests
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Add user agent
    config.headers['X-User-Agent'] = 'EHR-Privacy-Frontend/2.0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle encrypted responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for encryption/decryption operations
export const encryptionAPI = {
  // Encrypt and store patient data
  encryptPatient: async (patientData: any, sensitivity: string = 'MEDIUM') => {
    try {
      const patientRequest = {
        patient_id: patientData.patient_id || `P${Date.now()}`,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender || '',
        blood_type: patientData.blood_type || '',
        medical_condition: patientData.medical_condition || patientData.diagnosis || '',
        date_of_admission: patientData.date_of_admission || '',
        doctor_name: patientData.doctor_name || '',
        hospital: patientData.hospital || '',
        insurance_provider: patientData.insurance_provider || '',
        billing_amount: patientData.billing_amount || 0.0,
        room_number: patientData.room_number || '',
        admission_type: patientData.admission_type || '',
        discharge_date: patientData.discharge_date || '',
        medication: patientData.medication || '',
        test_results: patientData.test_results || String(patientData.lab_result || ''),
        medical_history: patientData.medical_history || [patientData.diagnosis || ''],
        current_medications: patientData.current_medications || [],
        notes: patientData.notes || '',
        sensitivity_level: sensitivity
      };
      const response = await api.post('patients', patientRequest);
      return response.data;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  },

  // Encrypt and store multiple patients in bulk
  encryptPatientsBulk: async (patients: any[]) => {
    try {
      const response = await api.post('patients/bulk', patients);
      return response.data;
    } catch (error) {
      throw new Error(`Bulk encryption failed: ${error}`);
    }
  },

  // Get all patients (with optional decryption)
  getPatients: async (decrypt: boolean = true) => {
    try {
      const response = await api.get(`patients?decrypt=${decrypt}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve patients: ${error}`);
    }
  },

  // Get specific patient by ID
  getPatient: async (patientId: string) => {
    try {
      const response = await api.get(`patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve patient: ${error}`);
    }
  },

  // Get system statistics (replaces DP query for now)
  getSystemStats: async () => {
    try {
      const response = await api.get('system/stats');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system stats: ${error}`);
    }
  },

  // Get algorithm information
  getAlgorithmInfo: async () => {
    try {
      const response = await api.get('algorithm/info');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get algorithm info: ${error}`);
    }
  },

  // Benchmark algorithm performance
  benchmarkAlgorithm: async (numOperations: number = 100) => {
    try {
      const response = await api.post(`system/benchmark?num_operations=${numOperations}`);
      return response.data;
    } catch (error) {
      throw new Error(`Benchmark failed: ${error}`);
    }
  },

  // Get system integrity report
  getIntegrityReport: async () => {
    try {
      const response = await api.get('system/integrity');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get integrity report: ${error}`);
    }
  },

  // Search patients by sensitivity level
  searchPatientsBySensitivity: async (sensitivityLevel: string) => {
    try {
      const response = await api.get(`patients/search/sensitivity/${sensitivityLevel}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search patients: ${error}`);
    }
  },

  // Update patient data
  updatePatient: async (patientId: string, patientData: any, sensitivity: string = 'MEDIUM') => {
    try {
      const patientRequest = {
        patient_id: patientId,
        name: patientData.name,
        age: patientData.age,
        medical_history: patientData.medical_history || [patientData.diagnosis],
        current_medications: patientData.current_medications || [],
        test_results: patientData.test_results || { lab_result: patientData.lab_result },
        notes: patientData.notes || '',
        sensitivity_level: sensitivity
      };
      const response = await api.put(`patients/${patientId}`, patientRequest);
      return response.data;
    } catch (error) {
      throw new Error(`Update failed: ${error}`);
    }
  },

  // Delete patient data
  deletePatient: async (patientId: string) => {
    try {
      const response = await api.delete(`patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Delete failed: ${error}`);
    }
  }
};

// Helper functions for data processing
export const dataUtils = {
  // Format timestamp for display
  formatTimestamp: (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  },

  // Get privacy level description
  getPrivacyLevel: (epsilon: number) => {
    if (epsilon <= 0.1) return { level: 'Very High', color: 'text-green-700', bg: 'bg-green-100' };
    if (epsilon <= 0.5) return { level: 'High', color: 'text-green-600', bg: 'bg-green-50' };
    if (epsilon <= 1.0) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (epsilon <= 2.0) return { level: 'Low', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Very Low', color: 'text-red-600', bg: 'bg-red-50' };
  },

  // Validate patient data
  validatePatientData: (data: any) => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Patient name is required');
    }
    
    if (data.age === '' || data.age === null || data.age === undefined) {
      errors.push('Patient age is required');
    } else if (data.age < 0 || data.age > 150) {
      errors.push('Age must be between 0 and 150');
    }
    
    if (!data.diagnosis || data.diagnosis.trim() === '') {
      errors.push('Diagnosis is required');
    }
    
    if (data.lab_result === '' || data.lab_result === null || data.lab_result === undefined) {
      errors.push('Lab result is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format lab result with appropriate styling
  formatLabResult: (value: number) => {
    if (value > 120) return { value: value.toFixed(1), class: 'text-red-600 bg-red-100' };
    if (value < 90) return { value: value.toFixed(1), class: 'text-blue-600 bg-blue-100' };
    return { value: value.toFixed(1), class: 'text-green-600 bg-green-100' };
  },

  // Generate encryption summary
  generateEncryptionSummary: (result: any) => {
    return {
      patientId: result.patient_id,
      encrypted: result.encrypted,
      epsilonUsed: result.epsilon_used,
      algorithm: 'AES-256-CBC-DP',
      timestamp: result.timestamp,
      privacyLevel: dataUtils.getPrivacyLevel(result.epsilon_used)
    };
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:8001/api/novel/health');
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error}`);
  }
};

// System info function
export const getSystemInfo = async () => {
  try {
    const response = await axios.get('http://localhost:8001/system/info');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get system info: ${error}`);
  }
};

export const encryptionDemo = async (data: {
  name: string;
  age: number;
  diagnosis: string;
  lab_results: string;
}) => {
  const response = await fetch('http://localhost:8001/api/novel/encryption/demo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-token'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default api;
