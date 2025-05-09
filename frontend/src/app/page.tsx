import PatientList from '../components/PatientList';
import DPResult from '../components/DPResult';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-800 mb-3">Cloud-Based EHR with Privacy Protection</h1>
        <p className="text-gray-600">
          This system allows you to access patient records while preserving privacy through
          differential privacy techniques. Access aggregate statistics without compromising
          individual patient data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <PatientList />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <DPResult />
          
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">About Differential Privacy</h3>
            <p className="text-sm text-gray-700">
              Differential Privacy adds carefully calibrated noise to results, ensuring 
              individual patient data remains private while still allowing meaningful aggregate analysis.
              Lower epsilon values provide stronger privacy guarantees but may reduce accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
