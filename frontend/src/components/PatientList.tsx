'use client';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

interface Patient {
  _id: string;
  name: string;
  age: number;
  diagnosis: string;
  lab_result: number;
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
    api.get('ehr/all')
      .then((res) => {
        setPatients(res.data);
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
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div className="animate-pulse p-4">Loading patient data...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Patient Records</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            className="px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-2.5 text-gray-500"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {currentPatients.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded">
          {searchTerm ? 'No patients match your search.' : 'No patients in the system.'}
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-t-lg p-3 grid grid-cols-12 font-semibold border-b">
            <div className="col-span-3">Patient</div>
            <div className="col-span-2">Age</div>
            <div className="col-span-4">Diagnosis</div>
            <div className="col-span-3">Lab Result</div>
          </div>
          <ul>
            {currentPatients.map((p) => (
              <li key={p._id} className="p-3 grid grid-cols-12 border-b hover:bg-gray-50 transition-colors">
                <div className="col-span-3 font-semibold">{p.name}</div>
                <div className="col-span-2">{p.age} years</div>
                <div className="col-span-4">{p.diagnosis}</div>
                <div className="col-span-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                    p.lab_result > 120 ? 'bg-red-100 text-red-800' : 
                    p.lab_result < 90 ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {p.lab_result.toFixed(1)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              &laquo;
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              &raquo;
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
