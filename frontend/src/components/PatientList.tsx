'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

interface Patient {
  _id: string;
  name: string;
  age: number | string;
  diagnosis: string;
  lab_result: number | string;
  encryption_info?: {
    algorithm: string;
    version: string;
    sensitivity_level: string;
    encrypted_at: string;
    last_updated: string;
    data_size: number;
    has_integrity_block: boolean;
  };
}

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5;

  useEffect(() => {
    setLoading(true);
    api.get('patients?decrypt=false')
      .then((res) => {
        // Transform the encrypted API response to display format
        const transformedPatients = res.data.map((patient: any) => ({
          _id: patient.patient_id,
          name: patient.name,
          age: patient.age,
          diagnosis: patient.medical_history[0] || 'No diagnosis',
          lab_result: patient.test_results?.lab_result || patient.test_results?.status || 'No results',
          encryption_info: patient.metadata?.encryption_info || null
        }));
        setPatients(transformedPatients);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching patients:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.encryption_info?.sensitivity_level || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.encryption_info?.algorithm || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading patients...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Encrypted Data Display
        </h3>
        <p className="text-xs text-muted-foreground">
          All patient data is encrypted using TDP-QIMLE algorithm
        </p>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Encrypted Patient Records
          </CardTitle>
          <CardDescription>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} in secure database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No patients found. Add some patients to see them here.</p>
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{patient.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Age: {patient.age} | Diagnosis: {patient.diagnosis}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Encrypted
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
