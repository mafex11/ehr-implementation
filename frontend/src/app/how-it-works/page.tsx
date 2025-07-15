'use client';

import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    diagnosis: '',
    lab_results: ''
  });
  const [demoResult, setDemoResult] = useState<EncryptionDemoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCurrentStep(0);
    
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
      alert('Failed to demonstrate encryption process');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How TDP-QIMLE Encryption Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Real-time demonstration of how patient data transforms through 6 encryption layers
          </p>
        </div>

        {/* Algorithm Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Algorithm Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Privacy Protection</h3>
              <p className="text-sm text-blue-600">Differential privacy with temporal decay</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Quantum-Inspired</h3>
              <p className="text-sm text-purple-600">Superposition states for enhanced security</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Multi-Layer</h3>
              <p className="text-sm text-green-600">6 independent encryption layers</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Homomorphic</h3>
              <p className="text-sm text-yellow-600">Computation on encrypted data</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Lattice-Based</h3>
              <p className="text-sm text-red-600">Post-quantum cryptography</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-800">Integrity</h3>
              <p className="text-sm text-indigo-600">Blockchain-inspired verification</p>
            </div>
          </div>
        </div>

        {/* Demo Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Try the Encryption Demo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter diagnosis"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Results
              </label>
              <textarea
                name="lab_results"
                value={formData.lab_results}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lab results"
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Demonstrate Encryption Process'}
            </button>
          </form>
        </div>

        {/* Encryption Process Visualization */}
        {demoResult && (
          <div className="space-y-6">
            {/* Original Data */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Original Patient Data
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(demoResult.original_data, null, 2)}
                </pre>
              </div>
            </div>

            {/* Encryption Steps */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Encryption Process (6 Layers)
              </h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{currentStep}/{demoResult.encryption_steps.length} steps</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(currentStep / demoResult.encryption_steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {demoResult.encryption_steps.map((step, index) => (
                  <div
                    key={step.step}
                    className={`border rounded-lg p-4 transition-all duration-500 ${
                      index < currentStep
                        ? 'border-green-500 bg-green-50'
                        : index === currentStep
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index < currentStep ? 'bg-green-500' : index === currentStep ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {index < currentStep ? '✓' : step.step}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 ml-3">
                        {step.title}
                      </h4>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Input:</h5>
                        <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {step.input_data}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Output:</h5>
                        <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {step.output_data}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <h5 className="font-medium text-blue-800 mb-1">Technical Details:</h5>
                      <p className="text-sm text-blue-700">{step.technical_details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Result */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Final Encrypted Data
              </h3>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 mb-2">
                  ⚠️ This is what gets stored in MongoDB - completely unreadable without decryption
                </p>
                <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {demoResult.final_encrypted_data}
                  </pre>
                </div>
              </div>
            </div>

            {/* Algorithm Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Algorithm Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Algorithm:</span>
                    <span className="text-gray-600">{demoResult.algorithm_info.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Layers:</span>
                    <span className="text-gray-600">{demoResult.algorithm_info.layers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Privacy Budget:</span>
                    <span className="text-gray-600">{demoResult.algorithm_info.privacy_budget}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Homomorphic:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      demoResult.algorithm_info.homomorphic_support 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {demoResult.algorithm_info.homomorphic_support ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Temporal Protection:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      demoResult.algorithm_info.temporal_protection 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {demoResult.algorithm_info.temporal_protection ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Integrity Verification:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      demoResult.algorithm_info.integrity_verification 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {demoResult.algorithm_info.integrity_verification ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Encryption Strength:</strong> {demoResult.algorithm_info.encryption_strength}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 