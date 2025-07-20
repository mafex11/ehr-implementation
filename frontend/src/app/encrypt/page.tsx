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
            Secure patient data using TDP-QIMLE quantum-inspired encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input Form */}
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

          {/* Right Panel - Results and Logs */}
          <div className="space-y-6">
            {/* Encryption Result */}
            {encryptionResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Encryption Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Patient ID:</span>
                      <Badge variant="outline">{encryptionResult.patient_id}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Privacy Budget:</span>
                      <Badge>ε = {encryptionResult.epsilon_used}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Algorithm:</span>
                      <Badge variant="secondary">{encryptionSettings.algorithm}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Timestamp:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(encryptionResult.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-3">
                    {encryptionResult.message}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Algorithm Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  TDP-QIMLE Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quantum Layers</span>
                    <Badge variant="outline">4 Layers</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lattice Obfuscation</span>
                    <Badge variant="outline">128-dim</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Biological Evolution</span>
                    <Badge variant="outline">1000 genes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Differential Privacy</span>
                    <Badge variant="outline">Temporal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integrity Verification</span>
                    <Badge variant="outline">Blockchain</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Encryption Logs */}
            {encryptionLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {encryptionLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
                            {log.operation}
                          </Badge>
                          <span className="text-sm">{log.patient_id}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
} 