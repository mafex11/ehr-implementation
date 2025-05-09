'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../utils/api';

interface FormState {
  name: string;
  age: number | '';
  diagnosis: string;
  lab_result: number | '';
}

export default function AddPatient() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    name: '',
    age: '',
    diagnosis: '',
    lab_result: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age' || name === 'lab_result') {
      // Convert to number or empty string
      const numValue = value === '' ? '' : parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Basic validation
    if (!formData.name || formData.age === '' || !formData.diagnosis || formData.lab_result === '') {
      setError('Please fill out all fields');
      return;
    }

    try {
      setLoading(true);
      // Convert empty strings to appropriate types for the API
      const apiData = {
        name: formData.name,
        age: Number(formData.age),
        diagnosis: formData.diagnosis,
        lab_result: Number(formData.lab_result),
      };
      
      await api.post('ehr/add', apiData);
      
      setSuccess(true);
      setFormData({
        name: '',
        age: '',
        diagnosis: '',
        lab_result: '',
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
    'Select a diagnosis',
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Arthritis',
    'Depression',
    'Anxiety',
    'COPD',
    'Obesity',
    'Osteoporosis',
    'Other'
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Add New Patient</h1>
        <p className="text-gray-600 mb-4">
          Enter patient information below. All data will be stored securely and queries 
          on this data will be protected using differential privacy.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            Patient added successfully! Redirecting to dashboard...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              name="age"
              min="0"
              max="120"
              value={formData.age}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Patient age"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis
            </label>
            <select
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              {commonDiagnoses.map((diagnosis) => (
                <option 
                  key={diagnosis} 
                  value={diagnosis === 'Select a diagnosis' ? '' : diagnosis}
                  disabled={diagnosis === 'Select a diagnosis'}
                >
                  {diagnosis}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Result
            </label>
            <input
              type="number"
              name="lab_result"
              step="0.1"
              value={formData.lab_result}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Numeric lab value"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a numeric value for the patient's lab test result
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Add Patient'}
            </button>
          </div>
        </form> 
      </div>
    </div>
  );
} 