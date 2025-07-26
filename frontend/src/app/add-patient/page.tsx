'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus, CheckCircle, AlertCircle, ArrowLeft, Shield, Database } from 'lucide-react';
import api from '../../../utils/api';

interface FormState {
  name: string;
  age: number | '';
  diagnosis: string;
  lab_result: number | '';
  notes: string;
  sensitivity_level: string;
}

export default function AddPatient() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    name: '',
    age: '',
    diagnosis: '',
    lab_result: '',
    notes: '',
    sensitivity_level: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age' || name === 'lab_result') {
      // Convert to number or empty string
      const numValue = value === '' ? '' : parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Basic validation
    if (!formData.name || formData.age === '' || !formData.diagnosis || formData.lab_result === '') {
      setError('Please fill out all required fields');
      return;
    }

    if (typeof formData.age === 'number' && (formData.age < 0 || formData.age > 150)) {
      setError('Age must be between 0 and 150');
      return;
    }

    try {
      setLoading(true);
      // Convert to new API format
      const apiData = {
        patient_id: `P${Date.now()}`,
        name: formData.name,
        age: Number(formData.age),
        gender: '',
        blood_type: '',
        medical_condition: formData.diagnosis,
        date_of_admission: '',
        doctor_name: '',
        hospital: '',
        insurance_provider: '',
        billing_amount: 0.0,
        room_number: '',
        admission_type: '',
        discharge_date: '',
        medication: '',
        test_results: String(formData.lab_result),
        medical_history: [formData.diagnosis],
        current_medications: [],
        notes: formData.notes,
        sensitivity_level: formData.sensitivity_level
      };
      
      await api.post('patients', apiData);
      
      setSuccess(true);
      setFormData({
        name: '',
        age: '',
        diagnosis: '',
        lab_result: '',
        notes: '',
        sensitivity_level: 'MEDIUM'
      });
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
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
    'Pneumonia',
    'Bronchitis',
    'Other'
  ];

  const sensitivityLevels = [
    { value: 'LOW', label: 'Low', description: 'Basic privacy protection' },
    { value: 'MEDIUM', label: 'Medium', description: 'Standard privacy protection' },
    { value: 'HIGH', label: 'High', description: 'Maximum privacy protection' }
  ];

  const getSensitivityColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-yellow-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'HIGH': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-bold mb-2">Add New Patient</h1>
          <p className="text-muted-foreground text-lg">
            Securely add patient data with TDP-QIMLE encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Patient Information
                </CardTitle>
                <CardDescription>
                  Enter patient details to be encrypted and stored securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Patient Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter patient name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Enter age"
                        min="0"
                        max="150"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
                    <Select value={formData.diagnosis} onValueChange={(value) => handleSelectChange('diagnosis', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary diagnosis" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonDiagnoses.map((diagnosis) => (
                          <SelectItem key={diagnosis} value={diagnosis}>
                            {diagnosis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lab_result">Lab Result Value *</Label>
                    <Input
                      id="lab_result"
                      name="lab_result"
                      type="number"
                      step="0.01"
                      value={formData.lab_result}
                      onChange={handleChange}
                      placeholder="Enter lab result"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Enter any additional notes or observations"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sensitivity">Data Sensitivity Level</Label>
                    <Select value={formData.sensitivity_level} onValueChange={(value) => handleSelectChange('sensitivity_level', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-zinc-900'>
                        {sensitivityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2 w-20">
                              <div className={`w-3 h-3 rounded-full ${getSensitivityColor(level.value)}`} />
                              <span>{level.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {sensitivityLevels.find(level => level.value === formData.sensitivity_level)?.description}
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Patient added successfully! Redirecting to dashboard...
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-zinc-700 hover:bg-zinc-600  " 
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Patient...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Patient Added Successfully
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Patient
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Encryption Algorithm</span>
                  <Badge variant="outline">TDP-QIMLE</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quantum Layers</span>
                  <Badge variant="outline">4 Layers</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lattice Obfuscation</span>
                  <Badge variant="outline">128-dim</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Differential Privacy</span>
                  <Badge variant="outline">Temporal</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Integrity Verification</span>
                  <Badge variant="outline">Blockchain</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Privacy Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sensitivityLevels.map((level) => (
                  <div key={level.value} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`w-3 h-3 rounded-full ${getSensitivityColor(level.value)}`} />
                    <div>
                      <p className="font-medium">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Data Entry Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Ensure all patient information is accurate</p>
                <p>• Use appropriate sensitivity levels based on data type</p>
                <p>• Lab results should be numerical values</p>
                <p>• Additional notes are optional but can provide context</p>
                <p>• All data will be encrypted before storage</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 