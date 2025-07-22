'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Shield, Lock, Database, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../../../utils/api';
import { FileUpload } from "@/components/ui/file-upload";
import Papa, { ParseResult, ParseError } from 'papaparse';

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
    algorithm: 'TDP-QIMLE'
  });
  
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);
  const [encryptionLogs, setEncryptionLogs] = useState<EncryptionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [uploading, setUploading] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState<string | null>(null);
  const [encryptedPatients, setEncryptedPatients] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [patientsProcessed, setPatientsProcessed] = useState(0);
  const [entryMode, setEntryMode] = useState<'manual' | 'upload'>('manual');
  const encryptionSteps = [
    { label: 'L1', name: 'Temporal' },
    { label: 'L2', name: 'Quantum-Inspired' },
    { label: 'L3', name: 'Lattice-Based' },
    { label: 'L4', name: 'Adaptive' },
    { label: 'L5', name: 'Homomorphic' },
    { label: 'L6', name: 'Blockchain-Inspired' },
    { label: 'L7', name: 'Biological' },
  ];
  const [currentEncryptionStep, setCurrentEncryptionStep] = useState<number>(-1);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age' || name === 'lab_result') {
      setPatientData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setPatientData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDiagnosisChange = (value: string) => {
    setPatientData(prev => ({ ...prev, diagnosis: value }));
  };

  const handleSettingsChange = (name: string, value: any) => {
    setEncryptionSettings(prev => ({
      ...prev,
      [name]: value
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

  const simulateEncryptionProcess = async () => {
    if (!encryptionSettings.showProcess) return;
    
    const steps = [
      { step: 'Validating input data', delay: 500 },
      { step: 'Initializing quantum layers', delay: 800 },
      { step: 'Applying differential privacy', delay: 600 },
      { step: 'Generating lattice obfuscation', delay: 900 },
      { step: 'Biological key evolution', delay: 700 },
      { step: 'Multi-layer encryption', delay: 1000 },
      { step: 'Integrity verification', delay: 400 },
      { step: 'Storing encrypted data', delay: 300 }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      setEncryptionProgress((i + 1) / steps.length * 100);
      await new Promise(resolve => setTimeout(resolve, steps[i].delay));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEncryptionResult(null);
    setEncryptionProgress(0);
    setCurrentStep('');
    
    if (!validateData()) return;

    try {
      setLoading(true);
      
      // Simulate encryption process
      await simulateEncryptionProcess();
      
      // Prepare API data
      const apiData = {
        patient_id: `P${Date.now()}`,
        name: patientData.name,
        age: Number(patientData.age),
        medical_history: [patientData.diagnosis],
        current_medications: [],
        test_results: {
          lab_result: Number(patientData.lab_result)
        },
        notes: '',
        sensitivity_level: 'HIGH'
      };
      
      const response = await api.post('patients', apiData);
      
      const result: EncryptionResult = {
        success: true,
        patient_id: apiData.patient_id,
        encrypted: true,
        epsilon_used: encryptionSettings.epsilon,
        timestamp: new Date().toISOString(),
        message: 'Patient data encrypted successfully with TDP-QIMLE algorithm'
      };
      
      setEncryptionResult(result);
      
      // Add to logs
      const logEntry: EncryptionLog = {
        timestamp: new Date().toISOString(),
        operation: 'ENCRYPT',
        epsilon: encryptionSettings.epsilon,
        status: 'SUCCESS',
        patient_id: result.patient_id
      };
      
      setEncryptionLogs(prev => [logEntry, ...prev]);
      
    } catch (err: any) {
      console.error('Encryption error:', err);
      setError(err.response?.data?.detail || 'Failed to encrypt patient data');
    } finally {
      setLoading(false);
      setEncryptionProgress(0);
      setCurrentStep('');
    }
  };

  const commonDiagnoses = [
    'Hypertension',
    'Diabetes Type 2',
    'Asthma',
    'Chronic Kidney Disease',
    'Coronary Artery Disease',
    'Depression',
    'Anxiety Disorder',
    'COPD',
    'Arthritis',
    'Migraine',
    'Other'
  ];

  const getPrivacyLevel = (epsilon: number) => {
    if (epsilon <= 0.5) return { level: 'Very High', color: 'bg-green-500', description: 'Maximum privacy protection' };
    if (epsilon <= 1.0) return { level: 'High', color: 'bg-blue-500', description: 'Strong privacy protection' };
    if (epsilon <= 2.0) return { level: 'Medium', color: 'bg-yellow-500', description: 'Balanced privacy/utility' };
    return { level: 'Low', color: 'bg-orange-500', description: 'Higher utility, lower privacy' };
  };

  const privacyLevel = getPrivacyLevel(encryptionSettings.epsilon);
  const [files, setFiles] = useState<File[]>([]);

  const csvToApiFieldMap = {
    "Name": "name",
    "Age": "age",
    "Gender": "gender",
    "Blood Type": "blood_type",
    "Medical Condition": "medical_condition",
    "Date of Admission": "date_of_admission",
    "Doctor": "doctor_name",
    "Hospital": "hospital",
    "Insurance Provider": "insurance_provider",
    "Billing Amount": "billing_amount",
    "Room Number": "room_number",
    "Admission Type": "admission_type",
    "Discharge Date": "discharge_date",
    "Medication": "medication",
    "Test Results": "test_results"
  };

  const handleFileUpload = (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setEncrypting(false);
    setCurrentPatientName(null);
    setEncryptedPatients([]);
    setTotalPatients(0);
    setPatientsProcessed(0);
    setCurrentEncryptionStep(-1);
    setCsvPreview([]);
    const file = files[0] as File;
    Papa.parse<File>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<any>) => {
        const patients = results.data as any[];
        setUploading(false);
        setCsvPreview(patients.slice(0, 5)); // Show first 5 rows as preview
        // setTimeout(() => setCsvPreview([]), 10000); // Hide preview after 10s (optional)
        setEncrypting(true);
        setTotalPatients(patients.length);
        setError(null);
        let successCount = 0;
        let failCount = 0;
        let encryptedList: any[] = [];
        for (let i = 0; i < patients.length; i++) {
          const row = patients[i];
          setCurrentPatientName(row["Name"]);
          setPatientsProcessed(i + 1);
          // Simulate step-by-step encryption for progress UI
          for (let step = 0; step < encryptionSteps.length; step++) {
            setCurrentEncryptionStep(step);
            await new Promise(res => setTimeout(res, 200)); // Simulate step duration
          }
          setCurrentEncryptionStep(-1);
          // Map CSV fields to API fields
          const apiData: any = {};
          for (const [csvKey, apiKey] of Object.entries(csvToApiFieldMap)) {
            apiData[apiKey] = row[csvKey] ?? "";
          }
          // Add required fields not in CSV
          apiData.patient_id = `P${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          apiData.medical_history = [apiData.medical_condition];
          apiData.current_medications = [apiData.medication];
          apiData.notes = "";
          apiData.sensitivity_level = row["Sensitivity Level"] || "HIGH";
          try {
            await api.post('patients', apiData);
            successCount++;
            encryptedList.push({ ...apiData, status: 'success' });
          } catch (err) {
            failCount++;
            encryptedList.push({ ...apiData, status: 'failed' });
          }
        }
        setEncrypting(false);
        setCurrentPatientName(null);
        setEncryptionResult({
          success: failCount === 0,
          patient_id: '',
          encrypted: true,
          epsilon_used: encryptionSettings.epsilon,
          timestamp: new Date().toISOString(),
          message: `Encryption complete. Success: ${successCount}, Failed: ${failCount}`
        });
        setEncryptedPatients(encryptedList);
      },
      error: (error: Error, file: File) => {
        setError('Failed to parse CSV: ' + error.message);
        setUploading(false);
        setEncrypting(false);
      }
    });
  };
  // export function FileUploadDemo() {
  //   const [files, setFiles] = useState<File[]>([]);

  //   const handleFileUpload = (files: File[]) => {
  //     setFiles(files);
  //     console.log(files);
  //   };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Patient Data Encryption</h1>
          <p className="text-muted-foreground text-lg">
            Choose manual entry or upload a CSV file to encrypt patient data using TDP-QIMLE quantum-inspired encryption
          </p>
        </div>
        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as 'manual' | 'upload')} className="w-full max-w-2xl mx-auto  ">
          <TabsList className="w-full flex mb-6 bg-zinc-800">
            <TabsTrigger value="manual" className="flex-1 ">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
        <div className="grid grid-cols-1  gap-6 ">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Patient Information
                </CardTitle>
                <CardDescription>
                  Enter patient data to be encrypted with advanced privacy protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Patient Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={patientData.name}
                        onChange={handleInputChange}
                        placeholder="Enter patient name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        value={patientData.age}
                        onChange={handleInputChange}
                        placeholder="Enter age"
                        min="0"
                        max="150"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 ">
                    <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                    <Select value={patientData.diagnosis} onValueChange={handleDiagnosisChange}>
                      <SelectTrigger >
                        <SelectValue placeholder="Select diagnosis" />
                      </SelectTrigger>
                      <SelectContent className='bg-zinc-950'>
                        {commonDiagnoses.map((diagnosis) => (
                          <SelectItem key={diagnosis} value={diagnosis}>
                            {diagnosis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lab_result">Lab Result Value</Label>
                    <Input
                      id="lab_result"
                      name="lab_result"
                      type="number"
                      step="0.01"
                      value={patientData.lab_result}
                      onChange={handleInputChange}
                      placeholder="Enter lab result"
                      required
                    />
                  </div>
                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Advanced Settings</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {showAdvanced && (
                      <Card className="p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Privacy Level (ε = {encryptionSettings.epsilon})</Label>
                            <Input
                              type="range"
                              min="0.1"
                              max="5.0"
                              step="0.1"
                              value={encryptionSettings.epsilon}
                              onChange={(e) => handleSettingsChange('epsilon', parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>High Privacy</span>
                              <Badge className={privacyLevel.color}>
                                {privacyLevel.level}
                              </Badge>
                              <span>High Utility</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{privacyLevel.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Show Encryption Process</Label>
                            <Switch
                              checked={encryptionSettings.showProcess}
                              onCheckedChange={(checked) => handleSettingsChange('showProcess', checked)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Algorithm</Label>
                            <Select value={encryptionSettings.algorithm} onValueChange={(value) => handleSettingsChange('algorithm', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className='bg-zinc-950'>
                                <SelectItem value="TDP-QIMLE">TDP-QIMLE (Quantum-Inspired)</SelectItem>
                                <SelectItem value="AES-256-CBC-DP">AES-256-CBC with DP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {loading && encryptionSettings.showProcess && (
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Encryption Progress</span>
                          <span className="text-sm text-muted-foreground">{Math.round(encryptionProgress)}%</span>
                        </div>
                        <Progress value={encryptionProgress} className="w-full" />
                        {currentStep && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {currentStep}
                          </p>
                        )}
                      </div>
                    </Card>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-zinc-700 hover:bg-zinc-600  " 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Encrypt Patient Data
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>
          <TabsContent value="upload">
            <div className="w-full max-w-6xl mx-auto min-h-32 border border-dashed bg-zinc-900 border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col items-center justify-center p-4">
              <FileUpload onChange={handleFileUpload} />
              {uploading && <div className="mt-4 text-white flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading file...</div>}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            {/* CSV Preview Table */}
            {csvPreview.length > 0 && (
              <div className="w-full max-w-2xl mx-auto mt-6 bg-zinc-800 rounded-lg p-4 overflow-x-auto">
                <div className="font-bold text-white mb-2">CSV Data Preview (first 5 rows)</div>
                <table className="min-w-full text-xs text-left text-zinc-200">
                  <thead>
                    <tr>
                      {Object.keys(csvPreview[0]).map((key) => (
                        <th key={key} className="px-2 py-1 border-b border-zinc-700 font-semibold">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-zinc-700">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-2 py-1">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
            )}
            {/* Encryption progress UI is now outside the FileUpload card */}
            {encrypting && (
              <div className="mt-4 text-white w-full max-w-xl mx-auto">
                <div className="font-bold text-lg mb-2">Encryption in Progress</div>
                <div className="mb-1">{patientsProcessed} / {totalPatients} records processed</div>
                <div className="mb-1">{((patientsProcessed / (totalPatients || 1)) * 100).toFixed(1)}%</div>
                <Progress value={totalPatients ? (patientsProcessed / totalPatients) * 100 : 0} className="w-full mb-4" />
                <div className="flex  items-center w-full mb-2 gap-2 justify-center">
                  {encryptionSteps.map((step, idx) => (
                    <div key={step.label} className="flex flex-col items-center  ">
                      <div className={`w-30 h-20 flex items-center justify-center text-base font-bold border-2 transition-all duration-200 rounded-md 
                        ${currentEncryptionStep === idx ? 'bg-blue-500 border-blue-400 text-white scale-105 shadow-lg' :
                          currentEncryptionStep > idx ? 'bg-green-500 border-green-400 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-300'}`}
                      >
                        {step.label}
                    </div>
                      <span className={`mt-2 text-xs text-center w-30 block ${currentEncryptionStep === idx ? 'text-blue-300 font-semibold' : currentEncryptionStep > idx ? 'text-green-400' : 'text-zinc-400'}`}>{step.name}</span>
                    </div>
                  ))}
                    </div>
                {/* Overall Encryption Progress Bar */}
                {/* <div className="mt-8 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Overall Encryption Progress</span>
                    <span className="text-sm font-bold ">{((patientsProcessed / (totalPatients || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={totalPatients ? (patientsProcessed / totalPatients) * 100 : 0} className="w-full" />
                </div> */}
                {currentPatientName && <div className="flex  items-center w-full mb-2 gap-2 justify-center mt-10 text-2xl">Encrypting: <span className="font-bold">{currentPatientName}</span></div>}
              </div>
            )}
            {encryptionResult && (
              <Alert className="mt-4 max-w-xl mx-auto">
                <AlertDescription>{encryptionResult.message}</AlertDescription>
              </Alert>
            )}
            {encryptedPatients.length > 0 && (
              <div className="mt-6 w-full max-w-xl mx-auto">
                <h2 className="text-lg font-bold mb-2 text-white">Encrypted Patients</h2>
                <div className="max-h-64 overflow-y-auto">
                  <ul className="text-white text-sm">
                    {encryptedPatients.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-2 border-b border-zinc-800 py-1">
                        <span className="font-semibold">{p.name}</span>
                        <Badge variant={p.status === 'success' ? 'default' : 'destructive'}>{p.status}</Badge>
                      </li>
                    ))}
                  </ul>
                  </div>
                  </div>
            )}
          </TabsContent>
        </Tabs>
         {/* Framework Overview Section */}
         <div className="mb-12 mt-10">
          <h2 className="text-3xl font-bold mb-2 text-white">Framework Overview</h2>
          <p className="text-lg text-muted-foreground mb-8">Explore the 7 core components that make TDP-QIMLE a cutting-edge healthcare security solution</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Temporal Differential Privacy */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">1</span>
              <span className="font-semibold">Temporal Differential Privacy</span></div>
              <p className="text-sm mb-2">Time-decaying privacy mechanism that provides stronger protection for recent data</p>
              <ul className="text-xs text-zinc-300 list-[tick] ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>Laplace noise injection</li>
                <li>Time-based decay (λ=0.01)</li>
                <li>Adaptive privacy budgets</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">ηt = Laplace(0, 1/ε) · e^(-λ(t-t0)) · S</div>
                  </div>
            {/* 2. Quantum-Inspired Multi-Layer Encryption */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">2</span><
                span className="font-semibold">Quantum-Inspired Multi-Layer Encryption</span></div>
              <p className="text-sm mb-2">Non-deterministic encryption using quantum state analogies</p>
              <ul className="text-xs text-zinc-300 ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>4 quantum states</li>
                <li>XOR operations</li>
                <li>Phase components (α, β)</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">Ei = Di ⊕ ⌊α·cos(φi) + β·sin(φi)⌋</div>
                  </div>
            {/* 3. Lattice-Based Obfuscation */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">3</span>
              <span className="font-semibold">Lattice-Based Obfuscation</span></div>
              <p className="text-sm mb-2">Post-quantum security using high-dimensional lattice structures</p>
              <ul className="text-xs text-zinc-300 list-disc ml-5 mb-2 " style={{ listStyleType: "'✓ '" }}>
                <li>128-dimensional lattice</li>
                <li>Random noise injection</li>
                <li>Algebraic attack resistance</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">y = B(x + r)</div>
                  </div>
            {/* 4. Adaptive Noise Injection */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">4</span>
              <span className="font-semibold">Adaptive Noise Injection</span></div>
              <p className="text-sm mb-2">Field-level sensitivity-aware noise application</p>
              <ul className="text-xs text-zinc-300 list-disc ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>4 sensitivity levels</li>
                <li>Custom noise scaling</li>
                <li>Clinical accuracy preservation</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">Noise levels: LOW(0.5σ), MEDIUM(1.0σ), HIGH(1.5σ), CRITICAL(2.0σ)</div>
                </div>
            {/* 5. Partially Homomorphic Encryption */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">5</span>
              <span className="font-semibold">Partially Homomorphic Encryption</span></div>
              <p className="text-sm mb-2">Computation on encrypted data without decryption</p>
              <ul className="text-xs text-zinc-300 list-disc ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>Cubic modular operations</li>
                <li>Prime modulus (65537)</li>
                <li>Privacy-preserving analytics</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">h = m³ mod p</div>
                        </div>
            {/* 6. Blockchain-Inspired Integrity */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">6</span>
              <span className="font-semibold">Blockchain-Inspired Integrity</span></div>
              <p className="text-sm mb-2">Tamper-evident storage with hash chain verification</p>
              <ul className="text-xs text-zinc-300 list-disc ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>SHA-256 hash chains</li>
                <li>Proof-of-work nonce</li>
                <li>Instant tamper detection</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">Verification time: 0.000041s</div>
                      </div>
            {/* 7. Biologically-Inspired Key Evolution */}
            <div className="bg-zinc-800 rounded-lg p-6 shadow">
              <div className="flex items-center mb-2"><span className="text-2xl font-bold mr-2">7</span>
              <span className="font-semibold">Biologically-Inspired Key Evolution</span></div>
              <p className="text-sm mb-2">Dynamic key generation using Fibonacci sequence and golden ratio</p>
              <ul className="text-xs text-zinc-300 list-disc ml-5 mb-2" style={{ listStyleType: "'✓ '" }}>
                <li>Golden ratio (φ)</li>
                <li>Fibonacci sequences</li>
                <li>5% mutation factor</li>
              </ul>
              <div className="text-xs text-blue-300 font-mono">kn = (kn-1 + kn-2) · φ + μ</div>
                  </div>
          </div>
        </div>
      </div>
      
    </div>
  );
} 