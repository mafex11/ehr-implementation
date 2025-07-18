'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Shield, Unlock, User, AlertCircle, CheckCircle, ArrowLeft, Eye, Database, Clock } from 'lucide-react';
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
  const router = useRouter();
  const [session, setSession] = useState<DecryptionSession | null>(null);
  const [credentials, setCredentials] = useState<DecryptionCredentials>({
    username: 'medical_staff',
    password: 'medical_decrypt_access',
    security_clearance: 'standard',
    purpose: 'Medical review and patient data analysis',
    department: 'Medical Department'
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
      const highResults = await decryptionService.searchEncryptedPatients('HIGH', 20);
      const mediumResults = await decryptionService.searchEncryptedPatients('MEDIUM', 20);
      const lowResults = await decryptionService.searchEncryptedPatients('LOW', 10);
      
      // Combine results
      const allPatients = [
        ...(highResults.encrypted_patients || []),
        ...(mediumResults.encrypted_patients || []),
        ...(lowResults.encrypted_patients || [])
      ];
      
      setEncryptedPatients(allPatients);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptPatient = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const decryptedData = await decryptionService.decryptSinglePatient({
        patient_id: patientId,
        audit_reason: 'Medical review and patient data analysis'
      });
      setSelectedPatient(decryptedData.decrypted_data);
      
      // Add to logs
      const logEntry: DecryptionLog = {
        timestamp: new Date().toISOString(),
        operation: 'DECRYPT_SINGLE',
        status: 'SUCCESS',
        patient_id: patientId,
        method: 'TDP-QIMLE'
      };
      
      setDecryptionLogs(prev => [logEntry, ...prev]);
      
    } catch (err: any) {
      setError(err.message);
      
      const logEntry: DecryptionLog = {
        timestamp: new Date().toISOString(),
        operation: 'DECRYPT_SINGLE',
        status: 'ERROR',
        patient_id: patientId,
        method: 'TDP-QIMLE',
        error: err.message
      };
      
      setDecryptionLogs(prev => [logEntry, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDecrypt = async () => {
    try {
    setLoading(true);
    setError(null);
      setBulkResults(null);
      
      const patientIds = bulkPatientIds.split(',').map(id => id.trim()).filter(id => id);
      
      if (patientIds.length === 0) {
        setError('Please enter at least one patient ID');
        return;
      }
      
      const results = await decryptionService.decryptBulkPatients({
        patient_ids: patientIds,
        batch_size: 5,
        audit_reason: 'Bulk medical data analysis'
      });
      setBulkResults(results);
      
      // Add to logs
      const logEntry: DecryptionLog = {
        timestamp: new Date().toISOString(),
        operation: 'DECRYPT_BULK',
        status: 'SUCCESS',
        method: 'TDP-QIMLE'
      };
      
      setDecryptionLogs(prev => [logEntry, ...prev]);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const log = await decryptionService.getSessionAuditLog();
      setAuditLog(log.audit_entries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showLogin) {
  return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
      </div>
            <CardTitle className="text-2xl">Secure Access</CardTitle>
            <CardDescription>
              Enter your credentials to access encrypted patient data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
      </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clearance">Security Clearance</Label>
                <Select value={credentials.security_clearance} onValueChange={(value) => setCredentials(prev => ({ ...prev, security_clearance: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="elevated">Elevated</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Access Purpose</Label>
                <Textarea
                  id="purpose"
                  value={credentials.purpose}
                  onChange={(e) => setCredentials(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Describe the purpose of data access"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={credentials.department}
                  onChange={(e) => setCredentials(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Access Secure System
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold mb-2">Patient Data Decryption</h1>
              <p className="text-muted-foreground text-lg">
                Secure access to encrypted patient records using TDP-QIMLE
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Session: {session?.session_id?.substring(0, 8)}...</p>
              <p className="text-sm text-muted-foreground">Clearance: {session?.clearance_level}</p>
              <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2">
                Logout
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'bulk' | 'audit')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single Patient</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Decryption</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Encrypted Patients
                  </CardTitle>
                  <CardDescription>
                    Select a patient to decrypt their data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {encryptedPatients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleDecryptPatient(patient.patient_id)}
                      >
                      <div>
                          <p className="font-medium">{patient.patient_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Sensitivity: {patient.sensitivity_level}
                          </p>
                      </div>
                        <Button variant="ghost" size="sm" disabled={loading}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {encryptedPatients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No encrypted patients found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Decrypted Patient Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Decrypted Patient Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-lg">{selectedPatient.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Age</Label>
                          <p className="text-lg">{selectedPatient.age}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Medical History</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedPatient.medical_history.map((item, index) => (
                            <Badge key={index} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Current Medications</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedPatient.current_medications.length > 0 ? (
                            selectedPatient.current_medications.map((med, index) => (
                              <Badge key={index} variant="outline">
                                {med}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Test Results</Label>
                        <div className="mt-1 p-3 bg-muted rounded-lg">
                          <pre className="text-sm">
                            {JSON.stringify(selectedPatient.test_results, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {selectedPatient.notes && (
                        <div>
                          <Label className="text-sm font-medium">Notes</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedPatient.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a patient to view decrypted data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Decryption</CardTitle>
                <CardDescription>
                  Decrypt multiple patients at once by entering their IDs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-ids">Patient IDs (comma-separated)</Label>
                  <Textarea
                    id="bulk-ids"
                    value={bulkPatientIds}
                    onChange={(e) => setBulkPatientIds(e.target.value)}
                    placeholder="P1234567890, P0987654321, ..."
                    rows={4}
                  />
                </div>
                
                <Button onClick={handleBulkDecrypt} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Decrypt All
                    </>
                  )}
                </Button>
                
                {bulkResults && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Decryption Results</h3>
                    <div className="space-y-2">
                      {bulkResults.results?.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{result.patient_id}</span>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Success" : "Failed"}
                          </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>
                  Review all decryption activities and access logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadAuditLog} disabled={loading} className="mb-4">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load Audit Log"
                  )}
                </Button>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLog.map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant={entry.status === 'SUCCESS' ? 'default' : 'destructive'}>
                          {entry.operation}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {entry.patient_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Patient: {entry.patient_id}
                        </p>
                      )}
                      {entry.error && (
                        <p className="text-sm text-red-500 mt-1">
                          Error: {entry.error}
                        </p>
                      )}
                    </div>
                  ))}
                  {auditLog.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit entries found
                    </div>
                  )}
                      </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        {decryptionLogs.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {decryptionLogs.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
                        {log.operation}
                      </Badge>
                      {log.patient_id && (
                        <span className="text-sm">{log.patient_id}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 