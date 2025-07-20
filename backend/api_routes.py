"""
FastAPI Routes for TDP-QIMLE Algorithm
Novel Encryption System for Patient Data Storage
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import asyncio
import logging
from enum import Enum
import json
import hashlib
import base64
import secrets
import time

from mongodb_integration import TDPQIMLEMongoStorage, SensitivityLevel
from algorithm import TDPQIMLEAlgorithm, TemporalPrivacyParams

# Initialize router
router = APIRouter(prefix="/api/novel", tags=["Novel TDP-QIMLE Algorithm"])
security = HTTPBearer(auto_error=False)  # Make authentication optional for testing

# Pydantic models
class PatientDataRequest(BaseModel):
    patient_id: str = Field(..., description="Unique patient identifier")
    name: str = Field(..., description="Patient full name")
    age: int = Field(..., ge=0, le=150, description="Patient age")
    medical_history: List[str] = Field(default=[], description="List of medical conditions")
    current_medications: List[str] = Field(default=[], description="Current medications")
    test_results: Dict[str, Any] = Field(default={}, description="Medical test results")
    notes: Optional[str] = Field(None, description="Additional notes")
    sensitivity_level: str = Field(..., description="Data sensitivity level: LOW, MEDIUM, HIGH, CRITICAL")

class PatientDataResponse(BaseModel):
    patient_id: str
    name: str
    age: Union[int, str]  # Allow both int (decrypted) and str (encrypted display)
    medical_history: List[str]
    current_medications: List[str]
    test_results: Dict[str, Any]
    notes: Optional[str]
    metadata: Dict[str, Any]

class EncryptionStatsResponse(BaseModel):
    algorithm_info: Dict[str, Any]
    total_patients: int
    sensitivity_distribution: Dict[str, int]
    recent_activity: int
    integrity_blocks: int
    audit_logs: int

class IntegrityReportResponse(BaseModel):
    total_patients: int
    verified_patients: int
    failed_verifications: List[Dict[str, str]]
    integrity_chain_valid: bool
    timestamp: datetime

class SearchResultResponse(BaseModel):
    patient_id: str
    timestamp: float
    sensitivity_level: int
    created_at: datetime
    updated_at: datetime

class EncryptionDemoRequest(BaseModel):
    name: str
    age: int
    diagnosis: str
    lab_results: str

class EncryptionStep(BaseModel):
    step: int
    title: str
    description: str
    input_data: str
    output_data: str
    technical_details: str

class EncryptionDemoResponse(BaseModel):
    original_data: Dict[str, Any]
    encryption_steps: List[EncryptionStep]
    final_encrypted_data: str
    algorithm_info: Dict[str, Any]

# Global storage instance
storage: Optional[TDPQIMLEMongoStorage] = None

def verify_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify authentication - for now, allow all requests for testing"""
    # TODO: Implement proper authentication in production
    if credentials is None:
        # For testing, allow requests without authentication
        return True
    # In production, verify the token here
    return True

async def get_storage():
    """Dependency to get storage instance"""
    global storage
    if storage is None:
        # Use environment variables for database connection
        import os
        mongodb_uri = os.environ.get("MONGODB_URI", "mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/")
        database_name = os.environ.get("DATABASE_NAME", "secure_ehr")
        storage = TDPQIMLEMongoStorage(mongodb_uri, database_name)
        await storage.initialize_database()
    return storage

def get_sensitivity_level(level_str: str) -> SensitivityLevel:
    """Convert string to SensitivityLevel enum"""
    level_map = {
        "LOW": SensitivityLevel.LOW,
        "MEDIUM": SensitivityLevel.MEDIUM,
        "HIGH": SensitivityLevel.HIGH,
        "CRITICAL": SensitivityLevel.CRITICAL
    }
    
    if level_str.upper() not in level_map:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sensitivity level. Must be one of: {list(level_map.keys())}"
        )
    
    return level_map[level_str.upper()]

@router.post("/patients", response_model=Dict[str, str])
async def store_patient_data(
    request: PatientDataRequest,
    background_tasks: BackgroundTasks,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Store patient data using TDP-QIMLE encryption
    
    This endpoint encrypts patient data using the novel TDP-QIMLE algorithm
    and stores it securely in MongoDB with multiple layers of protection.
    """
    try:
        # Convert request to dictionary
        patient_data = {
            "patient_id": request.patient_id,
            "name": request.name,
            "age": request.age,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
            "test_results": request.test_results,
            "notes": request.notes
        }
        
        # Get sensitivity level
        sensitivity = get_sensitivity_level(request.sensitivity_level)
        
        # Store data
        document_id = await storage.store_patient_data(patient_data, sensitivity)
        
        # Background task for additional security verification
        background_tasks.add_task(verify_storage_integrity, storage, request.patient_id)
        
        return {
            "message": "Patient data stored successfully",
            "document_id": document_id,
            "patient_id": request.patient_id,
            "algorithm": "TDP-QIMLE",
            "sensitivity_level": request.sensitivity_level
        }
        
    except Exception as e:
        logging.error(f"Failed to store patient data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Storage failed: {str(e)}")

@router.get("/patients/{patient_id}", response_model=PatientDataResponse)
async def retrieve_patient_data(
    patient_id: str,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Retrieve and decrypt patient data
    
    This endpoint retrieves encrypted patient data from MongoDB,
    verifies its integrity, and decrypts it using the TDP-QIMLE algorithm.
    """
    try:
        # Retrieve and decrypt data
        patient_data = await storage.retrieve_patient_data(patient_id)
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Add metadata
        metadata = {
            "algorithm": "TDP-QIMLE",
            "retrieved_at": datetime.now(),
            "integrity_verified": True
        }
        
        return PatientDataResponse(
            patient_id=patient_data["patient_id"],
            name=patient_data["name"],
            age=patient_data["age"],
            medical_history=patient_data["medical_history"],
            current_medications=patient_data["current_medications"],
            test_results=patient_data["test_results"],
            notes=patient_data.get("notes"),
            metadata=metadata
        )
        
    except ValueError as e:
        logging.error(f"Data integrity error: {str(e)}")
        raise HTTPException(status_code=422, detail="Data integrity compromised")
    except Exception as e:
        logging.error(f"Failed to retrieve patient data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

@router.put("/patients/{patient_id}", response_model=Dict[str, str])
async def update_patient_data(
    patient_id: str,
    request: PatientDataRequest,
    background_tasks: BackgroundTasks,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Update patient data with new encryption
    
    This endpoint updates existing patient data by re-encrypting it
    with the TDP-QIMLE algorithm using current temporal parameters.
    """
    try:
        # Validate patient_id matches
        if patient_id != request.patient_id:
            raise HTTPException(
                status_code=400,
                detail="Patient ID in URL must match patient ID in request body"
            )
        
        # Convert request to dictionary
        updated_data = {
            "patient_id": request.patient_id,
            "name": request.name,
            "age": request.age,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
            "test_results": request.test_results,
            "notes": request.notes
        }
        
        # Get sensitivity level
        sensitivity = get_sensitivity_level(request.sensitivity_level)
        
        # Update data
        success = await storage.update_patient_data(patient_id, updated_data, sensitivity)
        
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Background task for verification
        background_tasks.add_task(verify_storage_integrity, storage, patient_id)
        
        return {
            "message": "Patient data updated successfully",
            "patient_id": patient_id,
            "algorithm": "TDP-QIMLE",
            "sensitivity_level": request.sensitivity_level,
            "updated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to update patient data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/patients/{patient_id}", response_model=Dict[str, str])
async def delete_patient_data(
    patient_id: str,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Securely delete patient data
    
    This endpoint permanently removes patient data from the database
    while maintaining audit trail and integrity chain.
    """
    try:
        success = await storage.delete_patient_data(patient_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {
            "message": "Patient data deleted successfully",
            "patient_id": patient_id,
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to delete patient data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/patients", response_model=List[PatientDataResponse])
async def get_all_patients(
    decrypt: bool = Query(default=True, description="Whether to decrypt patient data"),
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum number of patients to return"),
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    auth: bool = Depends(verify_auth)
):
    """
    Get all patients with optional decryption
    
    Returns a list of all patients, optionally decrypted.
    For security reasons, this endpoint is limited to 1000 patients.
    """
    try:
        if decrypt:
            # Get all patients and decrypt them
            patients = await storage.get_all_patients_decrypted(limit)
            return [
                PatientDataResponse(
                    patient_id=patient["patient_id"],
                    name=patient["name"],
                    age=patient["age"],
                    medical_history=patient["medical_history"],
                    current_medications=patient["current_medications"],
                    test_results=patient["test_results"],
                    notes=patient.get("notes"),
                    metadata={
                        "algorithm": "TDP-QIMLE",
                        "retrieved_at": datetime.now(),
                        "integrity_verified": True
                    }
                )
                for patient in patients
            ]
        else:
            # Get encrypted data for display
            encrypted_patients = await storage.get_all_patients_encrypted_display(limit)
            return [
                PatientDataResponse(
                    patient_id=patient["patient_id"],
                    name=patient["name"],
                    age=patient["age"],
                    medical_history=patient["medical_history"],
                    current_medications=patient["current_medications"],
                    test_results=patient["test_results"],
                    notes=patient["notes"],
                    metadata={
                        "algorithm": "TDP-QIMLE",
                        "retrieved_at": datetime.now(),
                        "integrity_verified": True,
                        "encrypted": True,
                        "encryption_info": patient["encryption_info"]
                    }
                )
                for patient in encrypted_patients
            ]
        
    except Exception as e:
        logging.error(f"Failed to get all patients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve patients: {str(e)}")

@router.get("/patients/search/sensitivity/{sensitivity_level}", response_model=List[SearchResultResponse])
async def search_patients_by_sensitivity(
    sensitivity_level: str,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Search patients by sensitivity level
    
    Returns metadata for patients with the specified sensitivity level.
    Does not return decrypted patient data for security reasons.
    """
    try:
        sensitivity = get_sensitivity_level(sensitivity_level)
        results = await storage.search_patients_by_sensitivity(sensitivity)
        
        return [
            SearchResultResponse(
                patient_id=result["patient_id"],
                timestamp=result["timestamp"],
                sensitivity_level=result["sensitivity_level"],
                created_at=result["created_at"],
                updated_at=result["updated_at"]
            )
            for result in results
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to search patients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/system/integrity", response_model=IntegrityReportResponse)
async def verify_system_integrity(
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify integrity of all stored data
    
    This endpoint performs a comprehensive integrity check on all
    patient data and the blockchain-inspired integrity chain.
    """
    try:
        report = await storage.verify_database_integrity()
        
        return IntegrityReportResponse(
            total_patients=report["total_patients"],
            verified_patients=report["verified_patients"],
            failed_verifications=report["failed_verifications"],
            integrity_chain_valid=report["integrity_chain_valid"],
            timestamp=report["timestamp"]
        )
        
    except Exception as e:
        logging.error(f"Failed to verify system integrity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Integrity check failed: {str(e)}")

@router.get("/system/stats", response_model=EncryptionStatsResponse)
async def get_encryption_statistics(
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get comprehensive encryption and storage statistics
    
    Returns detailed information about the TDP-QIMLE algorithm performance,
    data distribution, and system status.
    """
    try:
        stats = await storage.get_encryption_statistics()
        
        return EncryptionStatsResponse(
            algorithm_info=stats["algorithm_info"],
            total_patients=stats["total_patients"],
            sensitivity_distribution=stats["sensitivity_distribution"],
            recent_activity=stats["recent_activity"],
            integrity_blocks=stats["integrity_blocks"],
            audit_logs=stats["audit_logs"]
        )
        
    except Exception as e:
        logging.error(f"Failed to get encryption statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Statistics retrieval failed: {str(e)}")

@router.get("/algorithm/info", response_model=Dict[str, Any])
async def get_algorithm_information(
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get detailed information about the TDP-QIMLE algorithm
    
    Returns comprehensive information about the algorithm components,
    security features, and parameters.
    """
    try:
        algorithm_info = storage.algorithm.get_algorithm_info()
        
        # Add runtime information
        algorithm_info["runtime_info"] = {
            "quantum_layers_active": len(storage.algorithm.quantum_states),
            "lattice_dimension": storage.algorithm.lattice_dimension,
            "biological_sequence_length": len(storage.algorithm.biological_sequence),
            "integrity_chain_length": len(storage.algorithm.integrity_chain),
            "key_evolution_history": len(storage.algorithm.key_evolution_history)
        }
        
        return algorithm_info
        
    except Exception as e:
        logging.error(f"Failed to get algorithm information: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Information retrieval failed: {str(e)}")

@router.post("/system/benchmark", response_model=Dict[str, Any])
async def benchmark_algorithm_performance(
    num_operations: int = Query(default=100, ge=1, le=1000),
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Benchmark TDP-QIMLE algorithm performance
    
    Performs a series of encrypt/decrypt operations to measure
    algorithm performance and generate performance metrics.
    """
    try:
        import time
        
        # Sample patient data for benchmarking
        sample_data = {
            "patient_id": f"BENCH_{int(time.time())}",
            "name": "Benchmark Patient",
            "age": 30,
            "medical_history": ["condition1", "condition2"],
            "current_medications": ["medication1", "medication2"],
            "test_results": {"test1": "result1", "test2": "result2"},
            "notes": "Benchmark data for performance testing"
        }
        
        # Benchmark metrics
        encryption_times = []
        decryption_times = []
        
        for i in range(num_operations):
            # Encryption benchmark
            start_time = time.time()
            encrypted_doc = storage.algorithm.encrypt_patient_data(sample_data, SensitivityLevel.MEDIUM)
            encryption_time = time.time() - start_time
            encryption_times.append(encryption_time)
            
            # Decryption benchmark
            start_time = time.time()
            decrypted_data = storage.algorithm.decrypt_patient_data(encrypted_doc)
            decryption_time = time.time() - start_time
            decryption_times.append(decryption_time)
            
            # Verify correctness
            if decrypted_data != sample_data:
                raise ValueError(f"Decryption failed at operation {i}")
        
        # Calculate statistics
        avg_encryption_time = sum(encryption_times) / len(encryption_times)
        avg_decryption_time = sum(decryption_times) / len(decryption_times)
        
        return {
            "benchmark_results": {
                "operations_performed": num_operations,
                "average_encryption_time": avg_encryption_time,
                "average_decryption_time": avg_decryption_time,
                "total_time": sum(encryption_times) + sum(decryption_times),
                "operations_per_second": num_operations / (sum(encryption_times) + sum(decryption_times)),
                "min_encryption_time": min(encryption_times),
                "max_encryption_time": max(encryption_times),
                "min_decryption_time": min(decryption_times),
                "max_decryption_time": max(decryption_times)
            },
            "algorithm": "TDP-QIMLE",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Benchmark failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")

@router.post("/encryption/demo", response_model=EncryptionDemoResponse)
async def encryption_demo(request: EncryptionDemoRequest):
    """
    Demonstrate step-by-step encryption process for research purposes.
    Shows how patient data transforms through each encryption layer.
    """
    try:
        # Original patient data
        original_data = {
            "name": request.name,
            "age": request.age,
            "diagnosis": request.diagnosis,
            "lab_results": request.lab_results,
            "timestamp": datetime.now().isoformat()
        }
        
        # Initialize algorithm with proper parameters
        master_key = secrets.token_bytes(32)
        temporal_params = TemporalPrivacyParams(
            epsilon=1.0,
            delta=1e-5,
            time_decay_factor=0.95,
            temporal_window=3600,
            sensitivity_multiplier=1.5
        )
        
        algorithm = TDPQIMLEAlgorithm(master_key, temporal_params)
        
        # Step-by-step encryption demonstration
        steps = []
        current_data = json.dumps(original_data, indent=2)
        
        # Step 1: Temporal Differential Privacy
        step1_input = current_data
        timestamp = time.time()
        temporal_noise = algorithm._compute_temporal_noise(timestamp, SensitivityLevel.HIGH)
        
        # Apply noise to sensitive fields
        noisy_data = original_data.copy()
        if isinstance(noisy_data.get('age'), int):
            noisy_data['age'] = max(0, int(noisy_data['age'] + temporal_noise))
        
        step1_output = json.dumps(noisy_data, indent=2)
        
        steps.append(EncryptionStep(
            step=1,
            title="Temporal Differential Privacy",
            description="Adding time-decay noise to protect temporal patterns",
            input_data=step1_input,
            output_data=step1_output,
            technical_details=f"Applied Laplace noise with time-decay factor. Noise value: {temporal_noise:.4f}, Privacy budget: ε=1.0, δ=1e-5"
        ))
        
        # Step 2: Quantum-Inspired Superposition
        step2_input = step1_output
        data_bytes = json.dumps(noisy_data).encode('utf-8')
        quantum_layer = algorithm.quantum_states[0]  # Use first quantum layer
        quantum_encrypted = algorithm._quantum_superposition_encrypt(data_bytes, quantum_layer)
        quantum_b64 = base64.b64encode(quantum_encrypted).decode('utf-8')
        
        step2_output = f"Quantum Encrypted Data (Base64):\n{quantum_b64[:200]}..."
        
        steps.append(EncryptionStep(
            step=2,
            title="Quantum-Inspired Superposition",
            description="Creating quantum-like superposition states for each data field",
            input_data=step2_input,
            output_data=step2_output,
            technical_details=f"Applied quantum superposition with state: {quantum_layer.state.name}, Phase: {quantum_layer.phase:.4f}"
        ))
        
        # Step 3: Multi-dimensional Lattice Obfuscation
        step3_input = step2_output
        lattice_encrypted, lattice_point = algorithm._lattice_obfuscation(quantum_encrypted, SensitivityLevel.HIGH)
        lattice_b64 = base64.b64encode(lattice_encrypted).decode('utf-8')
        
        step3_output = f"Lattice Obfuscated Data (Base64):\n{lattice_b64[:200]}..."
        
        steps.append(EncryptionStep(
            step=3,
            title="Multi-dimensional Lattice Obfuscation",
            description="Mapping data to high-dimensional lattice points",
            input_data=step3_input,
            output_data=step3_output,
            technical_details=f"Used {algorithm.lattice_dimension}-dimensional lattice. Coordinates: {len(lattice_point.coordinates)} dimensions"
        ))
        
        # Step 4: Key Evolution
        step4_input = step3_output
        evolved_key = algorithm._evolve_key(timestamp)
        evolved_key_hex = evolved_key.hex()
        
        step4_output = f"Evolved Key (Hex):\n{evolved_key_hex[:100]}..."
        
        steps.append(EncryptionStep(
            step=4,
            title="Biological Key Evolution",
            description="Evolving encryption keys using biological patterns",
            input_data=step4_input,
            output_data=step4_output,
            technical_details=f"Generated new key using biological sequence. Key length: {len(evolved_key)} bytes"
        ))
        
        # Step 5: Homomorphic Operations
        step5_input = step4_output
        homomorphic_data = algorithm._homomorphic_operation_preserve(lattice_encrypted)
        homomorphic_b64 = base64.b64encode(homomorphic_data).decode('utf-8')
        
        step5_output = f"Homomorphic Encrypted Data (Base64):\n{homomorphic_b64[:200]}..."
        
        steps.append(EncryptionStep(
            step=5,
            title="Homomorphic Operations",
            description="Enabling computation on encrypted data",
            input_data=step5_input,
            output_data=step5_output,
            technical_details=f"Applied homomorphic encryption with modulus: {algorithm.homomorphic_modulus}"
        ))
        
        # Step 6: Blockchain-Inspired Integrity
        step6_input = step5_output
        metadata = {
            "patient_id": hashlib.sha256(request.name.encode()).hexdigest()[:16],
            "timestamp": timestamp,
            "sensitivity": SensitivityLevel.HIGH.name
        }
        integrity_block = algorithm._create_integrity_block(homomorphic_data, metadata)
        
        step6_output = f"Integrity Block:\n{json.dumps(integrity_block, indent=2)[:300]}..."
        
        steps.append(EncryptionStep(
            step=6,
            title="Blockchain-Inspired Integrity",
            description="Adding cryptographic hash for data integrity verification",
            input_data=step6_input,
            output_data=step6_output,
            technical_details=f"Generated integrity block with hash: {integrity_block['hash'][:32]}..."
        ))
        
        # Final encrypted result (what would be stored in MongoDB)
        final_encrypted_document = algorithm.encrypt_patient_data(original_data, SensitivityLevel.HIGH)
        
        # Convert any datetime objects to strings for JSON serialization
        def serialize_for_json(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: serialize_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [serialize_for_json(item) for item in obj]
            else:
                return obj
        
        final_encrypted_document = serialize_for_json(final_encrypted_document)
        final_encrypted_str = json.dumps(final_encrypted_document, indent=2)
        
        # Algorithm information
        algorithm_info = algorithm.get_algorithm_info()
        algorithm_info = serialize_for_json(algorithm_info)
        
        return EncryptionDemoResponse(
            original_data=original_data,
            encryption_steps=steps,
            final_encrypted_data=final_encrypted_str,
            algorithm_info=algorithm_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption demo failed: {str(e)}")

# Background task functions
async def verify_storage_integrity(storage: TDPQIMLEMongoStorage, patient_id: str):
    """Background task to verify storage integrity"""
    try:
        # Retrieve the document
        encrypted_doc = await storage.patients_collection.find_one({"patient_id": patient_id})
        
        if encrypted_doc:
            # Verify integrity
            integrity_valid = storage.algorithm.verify_integrity(encrypted_doc)
            
            if not integrity_valid:
                logging.error(f"Integrity verification failed for patient {patient_id}")
                # Could trigger alerts or additional security measures
        
    except Exception as e:
        logging.error(f"Background integrity verification failed: {str(e)}")

# Error handlers (to be added to main FastAPI app)
async def value_error_handler(request, exc):
    return HTTPException(status_code=422, detail=str(exc))

async def general_exception_handler(request, exc):
    logging.error(f"Unhandled exception: {str(exc)}")
    return HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@router.get("/health", response_model=Dict[str, str])
async def health_check(
    storage: TDPQIMLEMongoStorage = Depends(get_storage)
):
    """
    Health check endpoint for the TDP-QIMLE system
    """
    try:
        # Test database connection
        await storage.patients_collection.count_documents({})
        
        return {
            "status": "healthy",
            "algorithm": "TDP-QIMLE",
            "timestamp": datetime.now().isoformat(),
            "database": "connected"
        }
        
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# Cleanup function
async def cleanup_storage():
    """Cleanup function to close storage connections"""
    global storage
    if storage:
        await storage.close_connection()
        storage = None 