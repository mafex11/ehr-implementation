/**
 * Independent Decryption API Client
 * Connects to the separate decryption service on port 8002
 */

import axios from 'axios';

// Separate API instance for decryption service (Production backend)
const decryptionAPI = axios.create({
  baseURL: 'https://ehr-implementation-production.up.railway.app/api/decrypt',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for decryption API
export interface DecryptionSession {
  session_id: string;
  expires_at: string;
  clearance_level: string;
  authorized_methods: string[];
  session_token: string;
}

export interface DecryptionCredentials {
  username: string;
  password: string;
  security_clearance: string;
  purpose: string;
  department: string;
}

export interface PatientDecryptionRequest {
  patient_id: string;
  decryption_method?: string;
  verification_code?: string;
  audit_reason: string;
}

export interface DecryptedPatient {
  patient_id: string;
  decrypted_data: any;
  decryption_metadata: any;
  audit_trail: any[];
  session_info: any;
}

export interface BulkDecryptionRequest {
  patient_ids: string[];
  decryption_method?: string;
  batch_size?: number;
  audit_reason: string;
}

// Session management
let currentSession: DecryptionSession | null = null;

// Request interceptor to add session header
decryptionAPI.interceptors.request.use(
  (config) => {
    if (currentSession) {
      config.headers['X-Decryption-Session'] = currentSession.session_id;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
decryptionAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      currentSession = null;
      localStorage.removeItem('decryption_session');
    }
    return Promise.reject(error);
  }
);

// Decryption API functions
export const decryptionService = {
  // Authentication and session management
  async createSession(credentials: DecryptionCredentials): Promise<DecryptionSession> {
    try {
      const response = await decryptionAPI.post('/auth/session', credentials);
      currentSession = response.data;
      
      // Store session in localStorage with expiration
      if (currentSession) {
        localStorage.setItem('decryption_session', JSON.stringify({
          session: currentSession,
          expires_at: currentSession.expires_at
        }));
      }
      
      if (!currentSession) {
        throw new Error('Failed to create session');
      }
      
      return currentSession;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  async restoreSession(): Promise<boolean> {
    try {
      const stored = localStorage.getItem('decryption_session');
      if (!stored) return false;
      
      const sessionData = JSON.parse(stored);
      const expiresAt = new Date(sessionData.expires_at);
      
      if (expiresAt <= new Date()) {
        localStorage.removeItem('decryption_session');
        return false;
      }
      
      currentSession = sessionData.session;
      return true;
    } catch (error) {
      localStorage.removeItem('decryption_session');
      return false;
    }
  },

  async terminateSession(): Promise<void> {
    try {
      if (currentSession) {
        await decryptionAPI.delete('/auth/session');
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    } finally {
      currentSession = null;
      localStorage.removeItem('decryption_session');
    }
  },

  getCurrentSession(): DecryptionSession | null {
    return currentSession;
  },

  isSessionActive(): boolean {
    if (!currentSession) return false;
    
    const expiresAt = new Date(currentSession.expires_at);
    return expiresAt > new Date();
  },

  // Health check
  async checkHealth(): Promise<any> {
    try {
      const response = await decryptionAPI.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(`Health check failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Patient decryption
  async decryptSinglePatient(request: PatientDecryptionRequest): Promise<DecryptedPatient> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.post('/patient/single', request);
      return response.data;
    } catch (error: any) {
      throw new Error(`Patient decryption failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  async decryptBulkPatients(request: BulkDecryptionRequest): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      // Use the same approach as single patient decryption to avoid broadcasting errors
      const results = {
        decrypted_patients: [] as any[],
        failed_patients: [] as any[],
        total_processed: 0,
        success_count: 0,
        failure_count: 0
      };
      
      const batchSize = request.batch_size || 100;
      
      for (let i = 0; i < request.patient_ids.length; i += batchSize) {
        const batch = request.patient_ids.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (patientId) => {
          try {
            const decryptedPatient = await this.decryptSinglePatient({
              patient_id: patientId,
              decryption_method: request.decryption_method || 'full_independent',
              audit_reason: request.audit_reason
            });
            
            return {
              patient_id: patientId,
              status: 'success',
              data: decryptedPatient.decrypted_data,
              metadata: decryptedPatient.decryption_metadata
            };
          } catch (error: any) {
            return {
              patient_id: patientId,
              status: 'failed',
              error: error.message
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Process results
        batchResults.forEach(result => {
          results.total_processed++;
          if (result.status === 'success') {
            results.success_count++;
            results.decrypted_patients.push(result);
          } else {
            results.failure_count++;
            results.failed_patients.push(result);
          }
        });
      }
      
      return results;
    } catch (error: any) {
      throw new Error(`Bulk decryption failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Search encrypted patients
  async searchEncryptedPatients(sensitivityLevel: string, limit: number = 50): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.get('/patient/search/encrypted', {
        params: {
          sensitivity_level: sensitivityLevel,
          limit: limit
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Search failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Audit and logging
  async getSessionAuditLog(): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.get('/audit/session');
      return response.data;
    } catch (error: any) {
      throw new Error(`Audit log retrieval failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  async getSystemAuditLog(filters: any = {}): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.post('/audit/system', filters);
      return response.data;
    } catch (error: any) {
      throw new Error(`System audit log retrieval failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Utility functions
  async getAvailableMethods(): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.get('/methods/available');
      return response.data;
    } catch (error: any) {
      throw new Error(`Method retrieval failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  async cleanupExpiredSessions(): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      
      const response = await decryptionAPI.post('/maintenance/cleanup');
      return response.data;
    } catch (error: any) {
      throw new Error(`Session cleanup failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Convenience methods for common operations
  async quickDecryptPatient(patientId: string, reason: string): Promise<any> {
    try {
      const decrypted = await this.decryptSinglePatient({
        patient_id: patientId,
        decryption_method: 'full_independent',
        audit_reason: reason
      });
      
      return decrypted.decrypted_data;
    } catch (error: any) {
      throw new Error(`Quick decryption failed: ${error.message}`);
    }
  },

  async decryptPatientList(patientIds: string[], reason: string): Promise<any[]> {
    try {
      const result = await this.decryptBulkPatients({
        patient_ids: patientIds,
        decryption_method: 'full_independent',
        batch_size: 10,
        audit_reason: reason
      });
      
      return result.decrypted_patients;
    } catch (error: any) {
      throw new Error(`Patient list decryption failed: ${error.message}`);
    }
  },

  // Fetch raw encrypted data for a patient
  async getRawEncryptedPatient(patientId: string): Promise<any> {
    try {
      if (!currentSession) {
        throw new Error('No active decryption session');
      }
      const response = await decryptionAPI.get(`/patient/encrypted/${patientId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch raw encrypted data: ${error.response?.data?.detail || error.message}`);
    }
  }
};

// Export for backward compatibility
export default decryptionService; 