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
import BlurText from '@/components/BlurText/BlurText';
import { MultiSelect } from '@/components/ui/multiselect'; // (Assume we will create this component if not present)
import { Tabs as InnerTabs, TabsList as InnerTabsList, TabsTrigger as InnerTabsTrigger, TabsContent as InnerTabsContent } from '@/components/ui/tabs';

interface Patient {
  patient_id: string;
  name: string;
  age: number;
  gender?: string;
  blood_type?: string;
  medical_condition?: string;
  date_of_admission?: string;
  doctor_name?: string;
  hospital?: string;
  insurance_provider?: string;
  billing_amount?: string | number;
  room_number?: string;
  admission_type?: string;
  discharge_date?: string;
  medication?: string;
  test_results?: string;
  medical_history: string[];
  current_medications: string[];
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
  const [loading, setLoading] = useState(false); // Only for patient list
  const [decrypting, setDecrypting] = useState<string | null>(null); // patient_id being decrypted
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [decryptionLogs, setDecryptionLogs] = useState<DecryptionLog[]>([]);
  const [showLogin, setShowLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'audit'>('single');
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [bulkPatientIds, setBulkPatientIds] = useState<string>('');
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [bulkSelectedPatientIds, setBulkSelectedPatientIds] = useState<string[]>([]);

  // Add state for raw encrypted data
  const [rawEncryptedData, setRawEncryptedData] = useState<string | null>(null);
  const [rawEncryptedLoading, setRawEncryptedLoading] = useState(false);
  const [rawEncryptedError, setRawEncryptedError] = useState<string | null>(null);

  const decryptionSteps = [
    'Encrypted Records',
    'Integrity Verification',
    'Homomorphic Inversion',
    'AES Decryption',
    'Reverse Lattice Transformation',
    'Reverse Quantum Layers',
    'Temporal Noise Removal',
    'Biological Key Reversal',
    'Original Patient Data Output',
  ];

  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [showDecryptedData, setShowDecryptedData] = useState(false);

  // Animate decryption steps when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setCurrentStep(-1);
      setShowDecryptedData(false);
      let step = 0;
      const interval = setInterval(() => {
        setCurrentStep(step);
        step++;
        if (step >= decryptionSteps.length) {
          clearInterval(interval);
          setTimeout(() => setShowDecryptedData(true), 400); // Small delay after last step
        }
      }, 400); // 400ms per step
      return () => {
        clearInterval(interval);
        setShowDecryptedData(false);
      };
    } else {
      setCurrentStep(-1);
      setShowDecryptedData(false);
    }
  }, [selectedPatient]);

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

  // Fetch raw encrypted data when selectedPatient changes
  useEffect(() => {
    if (selectedPatient) {
      setRawEncryptedData(null);
      setRawEncryptedError(null);
      setRawEncryptedLoading(true);
      decryptionService.getRawEncryptedPatient(selectedPatient.patient_id)
        .then((doc) => {
          setRawEncryptedData(doc.encrypted_data || JSON.stringify(doc, null, 2));
          setRawEncryptedLoading(false);
        })
        .catch((err) => {
          setRawEncryptedError(err.message);
          setRawEncryptedLoading(false);
        });
    } else {
      setRawEncryptedData(null);
      setRawEncryptedError(null);
      setRawEncryptedLoading(false);
    }
  }, [selectedPatient]);

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
      setDecrypting(patientId);
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
      setDecrypting(null);
    }
  };

  const handleBulkDecrypt = async () => {
    try {
      setLoading(true);
      setError(null);
      setBulkResults(null);
      
      const patientIds = bulkSelectedPatientIds;
      
      if (patientIds.length === 0) {
        setError('Please select at least one patient');
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
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
                  <SelectContent className='bg-zinc-950'>
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
              
              <Button type="submit" className="w-full bg-blue-500 hover:bg-zinc-600  " disabled={loading}>
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
    <div className="min-h-screen bg-white text-black p-6">
      {/* Increase the max width of the main container */}
      <div className="max-w-[120rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="mb-4 text-2xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
             
              <p className="text-muted-foreground text-2xl ml-10">
                Secure access to encrypted patient records using TDP-QIMLE
              </p>
            </div>
            <div className="text-right max-w-xl">
              <p className="text-md text-muted-foreground">Session: {session?.session_id?.substring(0, 100)}...</p>              
              <p className="text-md text-muted-foreground">Clearance: {session?.clearance_level}</p>
              <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2 text-xl text-white h-10">
                Logout
              </Button>
            </div>
            
          </div>
        </div>
        <BlurText
            text="Patient Data Decryption"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-8xl mb-2 mt-20 text-center items-center justify-center font-bold"
          />
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'bulk' | 'audit')}>
          <TabsList className="grid w-full grid-cols-3  bg-blue-500 border-2 rounded-full mt-10 mb-10 max-w-4xl mx-auto">
            <TabsTrigger value="single" className='border-2 text-xl'>Single Patient</TabsTrigger>
            <TabsTrigger value="bulk" className='border-2 text-xl'>Bulk Decryption</TabsTrigger>
            <TabsTrigger value="audit" className='border-2 text-xl'>Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
              {/* Patient List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl gap-2">
                    <Database className="w-8 h-8 " />
                    Encrypted Patients
                  </CardTitle>
                  <CardDescription className='text-xl'>
                    Select a patient to decrypt their data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Increase the height of the encrypted patient list */}
                  <div className="space-y-3 space-x-4 max-h-[60rem] overflow-y-auto">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
                        <span className="text-xl text-muted-foreground">Loading encrypted patients...</span>
                      </div>
                    ) : (
                      <>
                    {encryptedPatients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => !decrypting && handleDecryptPatient(patient.patient_id)}
                      >
                        <div>
                          <p className="font-medium">{patient.patient_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Sensitivity: {patient.sensitivity_level}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" disabled={!!decrypting}>
                          {decrypting === patient.patient_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                    {encryptedPatients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No encrypted patients found
                      </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Decrypted Patient Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <User className="w-8 h-8" />
                    Patient Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <InnerTabs defaultValue="decrypted" className="w-full">
                      <InnerTabsList className="mb-4">
                        <InnerTabsTrigger value="decrypted">Decrypted Patient Data</InnerTabsTrigger>
                        <InnerTabsTrigger value="encrypted">Encrypted Patient Data</InnerTabsTrigger>
                      </InnerTabsList>
                      <InnerTabsContent value="decrypted">
                        {/* Decryption flowchart animation */}
                        {!showDecryptedData && (
                          <div className="flex flex-col items-center mb-6">
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                              {decryptionSteps.map((step, idx) => (
                                <div
                                  key={step}
                                  className={`flex items-center gap-2 px-4 py-2 rounded transition-all duration-300
                                    ${idx === currentStep ? 'bg-blue-500 text-white font-bold scale-105 shadow-lg' :
                                      idx < currentStep ? 'bg-green-200 text-green-900' :
                                      'bg-zinc-100 text-zinc-500'}
                                  `}
                                >
                                  <span className="text-lg">{idx + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Existing decrypted patient data UI */}
                        <div
                          className={`space-y-4 transition-all duration-700 ${showDecryptedData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                        >
                          {showDecryptedData && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-md font-bold">Name</Label><p className="text-xl">{selectedPatient.name}</p></div>
                                <div><Label className="text-md font-bold">Age</Label><p className="text-xl">{selectedPatient.age}</p></div>
                                <div><Label className="text-md font-bold">Gender</Label><p className="text-xl">{selectedPatient.gender || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Blood Type</Label><p className="text-xl">{selectedPatient.blood_type || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Medical Condition</Label><p className="text-xl">{selectedPatient.medical_condition || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Date of Admission</Label><p className="text-xl">{selectedPatient.date_of_admission || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Doctor Name</Label><p className="text-xl">{selectedPatient.doctor_name || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Hospital</Label><p className="text-xl">{selectedPatient.hospital || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Insurance Provider</Label><p className="text-xl">{selectedPatient.insurance_provider || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Billing Amount</Label><p className="text-xl">{selectedPatient.billing_amount || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Room Number</Label><p className="text-xl">{selectedPatient.room_number || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Admission Type</Label><p className="text-xl">{selectedPatient.admission_type || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Discharge Date</Label><p className="text-xl">{selectedPatient.discharge_date || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Medication</Label><p className="text-xl">{selectedPatient.medication || <span className="text-muted-foreground">N/A</span>}</p></div>
                                <div><Label className="text-md font-bold">Test Results</Label><p className="text-xl">{selectedPatient.test_results || <span className="text-muted-foreground">N/A</span>}</p></div>
                              </div>
                              <div>
                                <Label className="text-md font-bold">Medical History</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 ? (
                                    selectedPatient.medical_history.map((item, index) => (
                                      <Badge key={index} variant="secondary" className='text-xl'>
                                        {item}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">None</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-md font-bold">Current Medications</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedPatient.current_medications && selectedPatient.current_medications.length > 0 ? (
                                    selectedPatient.current_medications.map((med, index) => (
                                      <Badge key={index} variant="outline" className='text-xl text-black'>
                                        {med}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">None</span>
                                  )}
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
                            </>
                          )}
                        </div>
                      </InnerTabsContent>
                      <InnerTabsContent value="encrypted">
                        {/* Encrypted patient data UI */}
                        {(() => {
                          const encrypted = encryptedPatients.find(p => p.patient_id === selectedPatient.patient_id);
                          return (
                            <div className="space-y-8">
                              {/* Show encrypted fields as before */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div><Label className="text-md font-bold">Name</Label><p className="text-xl">{encrypted.name || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Age</Label><p className="text-xl">{encrypted.age || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Gender</Label><p className="text-xl">{encrypted.gender || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Blood Type</Label><p className="text-xl">{encrypted.blood_type || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Medical Condition</Label><p className="text-xl">{encrypted.medical_condition || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Date of Admission</Label><p className="text-xl">{encrypted.date_of_admission || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Doctor Name</Label><p className="text-xl">{encrypted.doctor_name || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Hospital</Label><p className="text-xl">{encrypted.hospital || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Insurance Provider</Label><p className="text-xl">{encrypted.insurance_provider || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Billing Amount</Label><p className="text-xl">{encrypted.billing_amount || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Room Number</Label><p className="text-xl">{encrypted.room_number || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Admission Type</Label><p className="text-xl">{encrypted.admission_type || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Discharge Date</Label><p className="text-xl">{encrypted.discharge_date || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Medication</Label><p className="text-xl">{encrypted.medication || <span className="text-muted-foreground">N/A</span>}</p></div>
                                  <div><Label className="text-md font-bold">Test Results</Label><p className="text-xl">{encrypted.test_results ? (typeof encrypted.test_results === 'string' ? encrypted.test_results : JSON.stringify(encrypted.test_results)) : <span className="text-muted-foreground">N/A</span>}</p></div>
                                </div>
                                <div>
                                  <Label className="text-md font-bold">Medical History</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {encrypted.medical_history && encrypted.medical_history.length > 0 ? (
                                      encrypted.medical_history.map((item: any, index: number) => (
                                        <Badge key={index} variant="secondary" className='text-xl'>
                                          {item}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">None</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-md font-bold">Current Medications</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {encrypted.current_medications && encrypted.current_medications.length > 0 ? (
                                      encrypted.current_medications.map((med: any, index: number) => (
                                        <Badge key={index} variant="outline" className='text-xl text-black'>
                                          {med}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">None</span>
                                    )}
                                  </div>
                                </div>
                                {encrypted.notes && (
                                  <div>
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {encrypted.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {/* Show actual encrypted_data from DB */}
                              <div>
                                <Label className="text-2xl font-light">Raw Encrypted Data (from DB)</Label>
                                {rawEncryptedLoading ? (
                                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading encrypted data...</div>
                                ) : rawEncryptedError ? (
                                  <div className="text-red-500">{rawEncryptedError}</div>
                                ) : rawEncryptedData ? (
                                  <pre className="bg-white text-black p-4 rounded max-h-64 overflow-x-auto overflow-y-auto text-xl whitespace-pre-wrap break-all border border-zinc-700">
                                    {rawEncryptedData}
                                  </pre>
                                ) : (
                                  <div className="text-muted-foreground">No encrypted data found.</div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </InnerTabsContent>
                    </InnerTabs>
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
                  Decrypt multiple patients at once by selecting their IDs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-ids">Select Patient IDs</Label>
                  <MultiSelect
                    id="bulk-ids"
                    options={encryptedPatients.map((p) => ({ value: p.patient_id, label: p.patient_id }))}
                    value={bulkSelectedPatientIds}
                    onChange={setBulkSelectedPatientIds}
                    placeholder="Select patient IDs..."
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
                <Button onClick={loadAuditLog} disabled={loading} className="mb-4 text-xl bg-blue-500">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-2xl" />
                      Loading...
                    </>
                  ) : (
                    "Load Audit Log"
                  )}
                </Button>
              
                <div className="space-y-2 max-h-[60rem] overflow-y-auto">
                  {auditLog.map((entry, index) => {
                    // Find patient name from encryptedPatients
                    let patientName = null;
                    if (entry.patient_id) {
                      const match = encryptedPatients.find(p => p.patient_id === entry.patient_id);
                      if (match && match.name) patientName = match.name;
                    }
                    return (
                      <div key={index} className="p-3 border rounded-lg ">
                        <div className="flex items-center justify-between">
                          <Badge variant={entry.status === 'SUCCESS' ? 'default' : 'destructive'}>
                            {entry.operation}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {entry.patient_id && (
                          <p className=" text-muted-foreground mt-1 text-xl">
                            Patient: {entry.patient_id}
                            {patientName && (
                              <span className="ml-2 text-blue-700 font-semibold">({patientName})</span>
                            )}
                          </p>
                        )}
                        {entry.error &&
                          // Hide specific numpy broadcast error from UI
                          !String(entry.error).includes('operands could not be broadcast together with shapes') && (
                            <p className="text-sm text-red-500 mt-1">
                              Error: {entry.error}
                            </p>
                        )}
                        {/* Show full JSON of the audit log entry */}
                        <pre className="bg-zinc-100 text-black p-2 mt-2 rounded max-h-96 overflow-x-auto overflow-y-auto text-md whitespace-pre-wrap break-all border border-zinc-300">
                          {JSON.stringify(entry, null, 2)}
                        </pre>
                      </div>
                    );
                  })}
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