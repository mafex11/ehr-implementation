import PatientList from '../components/PatientList';
import DPResult from '../components/DPResult';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-800 mb-3">
          🔒 Cloud-Based EHR with Advanced Privacy Protection
        </h1>
        <p className="text-gray-600 mb-4">
          This system provides comprehensive privacy protection through differential privacy and 
          AES-256-CBC encryption. Access patient records securely while maintaining mathematical 
          privacy guarantees for all data operations.
        </p>
        
        {/* New Encryption Features Banner */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🆕 Enhanced Security Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔒</span>
              </div>
              <div>
                <p className="font-medium text-blue-800">AES-256-CBC Encryption</p>
                <p className="text-sm text-blue-600">All patient data encrypted at rest</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔐</span>
              </div>
              <div>
                <p className="font-medium text-green-800">Differential Privacy</p>
                <p className="text-sm text-green-600">Mathematical privacy guarantees</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Panel */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/encrypt" className="group">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 group-hover:text-blue-900">
                  🔒 Encrypt Data
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Encrypt patient data with DP protection
                </p>
              </div>
              <div className="text-2xl text-blue-500 group-hover:text-blue-600">
                →
              </div>
            </div>
          </div>
        </Link>

        <Link href="/decrypt" className="group">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 group-hover:text-green-900">
                  🔓 Decrypt Data
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  View and decrypt encrypted records
                </p>
              </div>
              <div className="text-2xl text-green-500 group-hover:text-green-600">
                →
              </div>
            </div>
          </div>
        </Link>

        <Link href="/add-patient" className="group">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-800 group-hover:text-purple-900">
                  ➕ Add Patient
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add new patient records
                </p>
              </div>
              <div className="text-2xl text-purple-500 group-hover:text-purple-600">
                →
              </div>
            </div>
          </div>
        </Link>

        <Link href="/analytics" className="group">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800 group-hover:text-orange-900">
                  📈 Analytics
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Privacy-preserving analytics
                </p>
              </div>
              <div className="text-2xl text-orange-500 group-hover:text-orange-600">
                →
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <PatientList />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <DPResult />
          
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              🔐 Enhanced Privacy Protection
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Differential Privacy:</strong> Adds carefully calibrated noise to results, 
                ensuring individual patient data remains private while still allowing meaningful 
                aggregate analysis.
              </p>
              <p>
                <strong>AES-256-CBC Encryption:</strong> All patient data is encrypted at rest using 
                industry-standard encryption with unique keys per record.
              </p>
              <p>
                <strong>Privacy Budget Tracking:</strong> Monitors epsilon consumption to prevent 
                privacy budget exhaustion and maintain strong privacy guarantees.
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🛡️ Security Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Audit logging</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Privacy budget tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Differential privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Key derivation (PBKDF2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Secure random generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📊 System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">AES-256-CBC</div>
            <div className="text-sm text-gray-600">Encryption Algorithm</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">DP-Enhanced</div>
            <div className="text-sm text-gray-600">Privacy Protection</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">MongoDB</div>
            <div className="text-sm text-gray-600">Secure Storage</div>
          </div>
        </div>
      </div>
    </div>
  );
}
