'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, ArrowLeft, Shield, Zap, Database, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { encryptionDemo } from '../../../utils/api';

interface EncryptionStep {
  step: number;
  title: string;
  description: string;
  input_data: string;
  output_data: string;
  technical_details: string;
}

interface EncryptionDemoResponse {
  original_data: {
    name: string;
    age: number;
    diagnosis: string;
    lab_results: string;
    timestamp: string;
  };
  encryption_steps: EncryptionStep[];
  final_encrypted_data: string;
  algorithm_info: {
    name: string;
    full_name: string;
    layers: number;
    privacy_budget: string;
    encryption_strength: string;
    homomorphic_support: boolean;
    temporal_protection: boolean;
    integrity_verification: boolean;
  };
}

export default function HowItWorks() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: 'John Doe',
    age: '35',
    diagnosis: 'Hypertension',
    lab_results: '120/80 mmHg'
  });
  const [demoResult, setDemoResult] = useState<EncryptionDemoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCurrentStep(0);
    setError(null);
    
    try {
      const result = await encryptionDemo({
        name: formData.name,
        age: parseInt(formData.age),
        diagnosis: formData.diagnosis,
        lab_results: formData.lab_results
      });
      setDemoResult(result);
      
      // Animate through steps
      for (let i = 0; i <= result.encryption_steps.length; i++) {
        setTimeout(() => setCurrentStep(i), i * 1000);
      }
    } catch (error) {
      console.error('Encryption demo failed:', error);
      setError('Failed to demonstrate encryption process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const algorithmFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Quantum-Inspired Layers',
      description: '4 quantum layers with superposition, entanglement, and coherence states',
      color: 'bg-purple-500'
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Lattice Obfuscation',
      description: '128-dimensional lattice with QR decomposition for mathematical stability',
      color: 'bg-blue-500'
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Biological Evolution',
      description: '1000-element DNA-like sequence with golden ratio growth patterns',
      color: 'bg-green-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Differential Privacy',
      description: 'Temporal privacy protection with time-decay mechanisms',
      color: 'bg-orange-500'
    }
  ];

  const encryptionSteps = [
    'Initialize quantum superposition states',
    'Apply lattice obfuscation transformation',
    'Evolve biological key sequences',
    'Add differential privacy noise',
    'Generate integrity verification hash',
    'Finalize encrypted data package'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-4xl font-bold mb-2">How TDP-QIMLE Works</h1>
          <p className="text-muted-foreground text-lg">
            Interactive demonstration of Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption
          </p>
        </div>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm Details</TabsTrigger>
            <TabsTrigger value="security">Security Features</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Demo Input Data
                  </CardTitle>
                  <CardDescription>
                    Enter patient data to see the encryption process in action
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Patient Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter patient name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Enter age"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleInputChange}
                        placeholder="Enter diagnosis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lab_results">Lab Results</Label>
                      <Textarea
                        id="lab_results"
                        name="lab_results"
                        value={formData.lab_results}
                        onChange={handleInputChange}
                        placeholder="Enter lab results"
                        rows={3}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Running Demo...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Encryption Demo
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Encryption Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Encryption Process
                  </CardTitle>
                  <CardDescription>
                    Watch as your data goes through each encryption layer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {demoResult ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {encryptionSteps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index < currentStep ? 'bg-green-500 text-white' : 
                              index === currentStep ? 'bg-blue-500 text-white' : 
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index < currentStep ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>
                            <span className={`text-sm ${
                              index < currentStep ? 'text-green-600' : 
                              index === currentStep ? 'text-blue-600' : 
                              'text-muted-foreground'
                            }`}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Encryption Progress</h4>
                        <Progress value={(currentStep / encryptionSteps.length) * 100} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {currentStep === encryptionSteps.length ? 'Encryption Complete!' : 
                           currentStep > 0 ? `Step ${currentStep}: ${encryptionSteps[currentStep - 1]}` : 
                           'Ready to start encryption'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run the demo to see the encryption process</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            {demoResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Encryption Results</CardTitle>
                  <CardDescription>
                    Original data transformed through TDP-QIMLE algorithm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Original Data</h4>
                      <div className="space-y-2 p-4 bg-muted rounded-lg">
                        <p><strong>Name:</strong> {demoResult.original_data.name}</p>
                        <p><strong>Age:</strong> {demoResult.original_data.age}</p>
                        <p><strong>Diagnosis:</strong> {demoResult.original_data.diagnosis}</p>
                        <p><strong>Lab Results:</strong> {demoResult.original_data.lab_results}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Encrypted Data</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <code className="text-sm break-all">
                          {demoResult.final_encrypted_data.substring(0, 200)}...
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="algorithm" className="space-y-6">
            {/* Algorithm Overview */}
            <Card>
              <CardHeader>
                <CardTitle>TDP-QIMLE Algorithm Components</CardTitle>
                <CardDescription>
                  Understanding the four core components of our encryption system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {algorithmFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Implementation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Quantum-Inspired Layers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Badge variant="outline">SUPERPOSITION</Badge>
                        <p className="text-sm text-muted-foreground">XOR-based superposition with multiple states</p>
                      </div>
                      <div className="space-y-2">
                        <Badge variant="outline">ENTANGLED</Badge>
                        <p className="text-sm text-muted-foreground">Position-based correlation between data elements</p>
                      </div>
                      <div className="space-y-2">
                        <Badge variant="outline">COLLAPSED</Badge>
                        <p className="text-sm text-muted-foreground">Measurement-based state reduction</p>
                      </div>
                      <div className="space-y-2">
                        <Badge variant="outline">COHERENT</Badge>
                        <p className="text-sm text-muted-foreground">Final coherence state maintenance</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Lattice Obfuscation</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        Uses 128-dimensional lattice with QR decomposition for numerical stability.
                        Handles data longer than lattice dimension through segmentation and reconstruction.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Biological Key Evolution</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        1000-element DNA-like sequence with golden ratio growth (φ = 1.618).
                        5% mutation rate with deterministic evolution for reproducibility.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Protection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Differential Privacy</span>
                    <Badge variant="outline">ε-δ Framework</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Temporal Protection</span>
                    <Badge variant="outline">Time-decay</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Noise Injection</span>
                    <Badge variant="outline">Laplace Mechanism</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Privacy Budget</span>
                    <Badge variant="outline">Configurable</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cryptographic Strength</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encryption Layers</span>
                    <Badge variant="outline">Multi-layer</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Key Evolution</span>
                    <Badge variant="outline">Dynamic</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integrity Verification</span>
                    <Badge variant="outline">SHA-256</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attack Resistance</span>
                    <Badge variant="outline">Quantum-ready</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Guarantees */}
            <Card>
              <CardHeader>
                <CardTitle>Security Guarantees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Data Confidentiality</h4>
                      <p className="text-sm text-muted-foreground">
                        Multi-layer encryption ensures data remains confidential even if individual layers are compromised
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Privacy Preservation</h4>
                      <p className="text-sm text-muted-foreground">
                        Differential privacy guarantees protect individual privacy while allowing statistical analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Data Integrity</h4>
                      <p className="text-sm text-muted-foreground">
                        Blockchain-inspired integrity verification ensures data hasn't been tampered with
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Future-Proof Security</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantum-inspired design provides resistance against future quantum computing attacks
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 