import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api/', // FastAPI backend
  timeout: 30000, // 30 second timeout for encryption operations
  headers: {
    'Content-Type': 'application/json',
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
  encryptPatient: async (patientData: any, epsilon: number = 1.0) => {
    try {
      const response = await api.post(`ehr/add?epsilon=${epsilon}`, patientData);
      return response.data;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  },

  // Get all patients (with optional decryption)
  getPatients: async (decrypt: boolean = true) => {
    try {
      const response = await api.get(`ehr/all?decrypt=${decrypt}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve patients: ${error}`);
    }
  },

  // Get specific patient by ID
  getPatient: async (patientId: string) => {
    try {
      const response = await api.get(`ehr/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve patient: ${error}`);
    }
  },

  // Execute differential privacy query
  dpQuery: async (queryType: string = 'lab_average', epsilon: number = 1.0) => {
    try {
      const response = await api.get(`ehr/dp/${queryType}?epsilon=${epsilon}`);
      return response.data;
    } catch (error) {
      throw new Error(`DP query failed: ${error}`);
    }
  },

  // Decrypt query result
  decryptResult: async (encryptedPackage: any) => {
    try {
      const response = await api.post('ehr/decrypt/result', encryptedPackage);
      return response.data;
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  },

  // Get privacy budget for entity
  getPrivacyBudget: async (entityId: string) => {
    try {
      const response = await api.get(`ehr/privacy/budget/${entityId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get privacy budget: ${error}`);
    }
  },

  // Get system status
  getSystemStatus: async () => {
    try {
      const response = await api.get('ehr/system/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system status: ${error}`);
    }
  },

  // Get crypto operation logs
  getCryptoLogs: async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.entityId) params.append('entity_id', filters.entityId);
      if (filters.operationType) params.append('operation_type', filters.operationType);
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`ehr/logs/crypto?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get crypto logs: ${error}`);
    }
  },

  // Get audit logs
  getAuditLogs: async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('user_id_filter', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`ehr/logs/audit?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error}`);
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
    const response = await axios.get('http://localhost:8000/health');
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error}`);
  }
};

// System info function
export const getSystemInfo = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/system/info');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get system info: ${error}`);
  }
};

export default api;
