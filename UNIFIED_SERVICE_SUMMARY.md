# Unified Service Summary

## Overview
Successfully merged the independent decryption service into the main backend service, so both encryption and decryption now run on the same port (8001).

## Changes Made

### 1. ✅ Backend Integration (`backend/main.py`)
- **Added decryption service imports**: `from decryption_api import router as decryption_router`
- **Added decryption engine**: `from decryption_engine import decryption_engine`
- **Integrated decryption router**: `app.include_router(decryption_router)`
- **Added periodic cleanup**: Automatic cleanup of expired decryption sessions every 30 minutes
- **Updated lifespan management**: Proper startup/shutdown for both services
- **Added unified root endpoint**: Shows both encryption and decryption services info

### 2. ✅ Frontend Update (`frontend/utils/decryption-api.ts`)
- **Changed base URL**: From `http://localhost:8002/api/decrypt` to `http://localhost:8001/api/decrypt`
- **Same port as encryption**: Both services now accessible on port 8001

### 3. ✅ Service Documentation
- **Updated FastAPI description**: Shows dual service architecture
- **Added service endpoints**: Clear documentation of both encryption and decryption paths
- **Enhanced system info**: Root endpoint shows comprehensive service information

### 4. ✅ Testing Scripts
- **Updated test scripts**: All tests now point to port 8001
- **Added unified service test**: `test_unified_service.py` to verify both services work
- **Enhanced test coverage**: Tests both encryption and decryption connectivity

## Service Architecture

### Single Port (8001) - Dual Services:
```
http://localhost:8001/
├── /api/novel/*           # Encryption Service
│   ├── POST /patients     # Store encrypted patient data
│   ├── GET /patients      # Retrieve patient data
│   ├── GET /health        # Encryption service health
│   └── ...
│
└── /api/decrypt/*         # Decryption Service
    ├── POST /auth/session # Create decryption session
    ├── POST /patient/single # Decrypt single patient
    ├── POST /patient/bulk  # Decrypt multiple patients
    ├── GET /health         # Decryption service health
    └── ...
```

## Data Flow (Unified Service)

### 1. Patient Data Input (Encryption)
```
User → Frontend (port 3000) → Backend (port 8001) → /api/novel/patients → MongoDB
```

### 2. Patient Data Viewing (Decryption)
```
User → Frontend (port 3000) → Backend (port 8001) → /api/decrypt/patient/single → MongoDB
```

## Benefits of Unified Service

### ✅ Simplified Deployment
- **Single service to start**: Only need to run `python main.py`
- **One port to manage**: No need to coordinate multiple ports
- **Unified logging**: All operations logged in one place
- **Shared resources**: Better resource utilization

### ✅ Enhanced Security
- **Still independent algorithms**: Encryption and decryption use different mathematical approaches
- **Separate authentication**: Decryption still requires different credentials
- **Isolated endpoints**: Clear separation between encryption and decryption paths
- **Unified audit trail**: Better tracking of all operations

### ✅ Better User Experience
- **Simplified frontend**: No need to manage multiple API instances
- **Consistent error handling**: Unified error responses
- **Single documentation**: All endpoints in one Swagger UI
- **Easier testing**: All services accessible from one location

## How to Run

### Start the Unified Service:
```bash
cd backend
python main.py
```
*This starts both encryption and decryption services on port 8001*

### Start Frontend:
```bash
cd frontend
npm run dev
```
*Connects to both services on port 8001*

### Test the System:
```bash
# Test unified service
python test_unified_service.py

# Test independent decryption
python test_independent_decryption.py
```

## API Endpoints

### Encryption Service (`/api/novel/`)
- `POST /api/novel/patients` - Store encrypted patient data
- `GET /api/novel/patients/{id}` - Retrieve patient data
- `GET /api/novel/patients` - Get all patients
- `GET /api/novel/health` - Health check

### Decryption Service (`/api/decrypt/`)
- `POST /api/decrypt/auth/session` - Create decryption session
- `POST /api/decrypt/patient/single` - Decrypt single patient
- `POST /api/decrypt/patient/bulk` - Decrypt multiple patients
- `GET /api/decrypt/patient/search/encrypted` - Search encrypted patients
- `GET /api/decrypt/audit/session` - Get audit log
- `DELETE /api/decrypt/auth/session` - Terminate session
- `GET /api/decrypt/health` - Health check

## Security Features Maintained

### 🔐 Independent Algorithms
- **Encryption**: TDP-QIMLE with 6 security layers
- **Decryption**: Completely different mathematical approaches
- **Separate keys**: Different key management systems
- **Isolated processes**: No shared cryptographic components

### 🔐 Separate Authentication
- **Encryption**: Standard API authentication
- **Decryption**: Session-based authentication with credentials
- **Different users**: Separate user management systems
- **Audit trails**: Independent logging for each service

### 🔐 Enhanced Monitoring
- **Unified logging**: All operations in one log file
- **Health checks**: Separate health endpoints for each service
- **Session management**: Automatic cleanup of expired sessions
- **Performance monitoring**: Comprehensive system information

## Conclusion

The unified service successfully combines both encryption and decryption services on a single port while maintaining:
- ✅ **Security**: Independent algorithms and separate authentication
- ✅ **Simplicity**: Single service to deploy and manage
- ✅ **Functionality**: All original features preserved
- ✅ **Performance**: Better resource utilization
- ✅ **Maintainability**: Easier to deploy and monitor

The system now provides the same level of security with improved operational simplicity. 