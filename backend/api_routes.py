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
import io
import csv
import uuid
from fastapi import UploadFile, File

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
    gender: str = Field('', description="Gender")
    blood_type: str = Field('', description="Blood type")
    medical_condition: str = Field('', description="Primary medical condition")
    date_of_admission: str = Field('', description="Date of admission")
    doctor_name: str = Field('', description="Doctor name")
    hospital: str = Field('', description="Hospital")
    insurance_provider: str = Field('', description="Insurance provider")
    billing_amount: float = Field(0.0, description="Billing amount")
    room_number: str = Field('', description="Room number")
    admission_type: str = Field('', description="Admission type")
    discharge_date: str = Field('', description="Discharge date")
    medication: str = Field('', description="Medication")
    test_results: str = Field('', description="Test results")
    medical_history: List[str] = Field(default=[], description="List of medical conditions")
    current_medications: List[str] = Field(default=[], description="Current medications")
    notes: Optional[str] = Field(None, description="Additional notes")
    sensitivity_level: str = Field(..., description="Data sensitivity level: LOW, MEDIUM, HIGH, CRITICAL")

class PatientDataResponse(BaseModel):
    patient_id: str
    name: str
    age: Union[int, str]
    gender: str = ''
    blood_type: str = ''
    medical_condition: str = ''
    date_of_admission: str = ''
    doctor_name: str = ''
    hospital: str = ''
    insurance_provider: str = ''
    billing_amount: float = 0.0
    room_number: str = ''
    admission_type: str = ''
    discharge_date: str = ''
    medication: str = ''
    test_results: str = ''
    medical_history: List[str]
    current_medications: List[str]
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

class PatientCSVData(BaseModel):
    Name: str
    Age: int
    Gender: str
    Blood_Type: str
    Medical_Condition: str
    Date_of_Admission: str
    Doctor_Name: str
    Hospital: str
    Insurance_Provider: str
    Billing_Amount: float

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
        patient_data = {
            "patient_id": request.patient_id,
            "name": request.name,
            "age": request.age,
            "gender": request.gender,
            "blood_type": request.blood_type,
            "medical_condition": request.medical_condition,
            "date_of_admission": request.date_of_admission,
            "doctor_name": request.doctor_name,
            "hospital": request.hospital,
            "insurance_provider": request.insurance_provider,
            "billing_amount": request.billing_amount,
            "room_number": request.room_number,
            "admission_type": request.admission_type,
            "discharge_date": request.discharge_date,
            "medication": request.medication,
            "test_results": request.test_results,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
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

@router.post("/patients/batch", response_model=Dict[str, Any])
async def store_patient_data_batch(
    request: List[PatientDataRequest],
    background_tasks: BackgroundTasks,
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Store multiple patient data records using TDP-QIMLE encryption in batches
    
    This endpoint encrypts multiple patient data records using the novel TDP-QIMLE algorithm
    and stores them securely in MongoDB with multiple layers of protection.
    Optimized for bulk operations with batch processing.
    """
    try:
        if len(request) == 0:
            raise HTTPException(
                status_code=400,
                detail="No patient data provided"
            )
        
        if len(request) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Maximum 1000 patients per batch request"
            )
        
        results = {
            "total_requested": len(request),
            "success": 0,
            "failed": 0,
            "errors": [],
            "document_ids": [],
            "batch_size": len(request)
        }
        
        # Process patients in parallel batches
        batch_size = 100
        document_ids = []
        
        for i in range(0, len(request), batch_size):
            batch = request[i:i + batch_size]
            
            # Process batch in parallel
            batch_tasks = []
            for patient_request in batch:
                task = asyncio.create_task(process_single_patient(patient_request, storage))
                batch_tasks.append(task)
            
            # Wait for all patients in the batch to complete
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Process batch results
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    results["failed"] += 1
                    results["errors"].append({
                        "patient_id": batch[j].patient_id,
                        "error": str(result)
                    })
                else:
                    results["success"] += 1
                    document_ids.append(result)
        
        results["document_ids"] = document_ids
        
        # Background task for bulk integrity verification
        background_tasks.add_task(
            verify_bulk_storage_integrity,
            storage,
            document_ids
        )
        
        return {
            "message": f"Batch encryption completed. Processed {len(request)} patients in batches of {batch_size}",
            "results": results,
            "algorithm": "TDP-QIMLE",
            "batch_processing": True
        }
        
    except Exception as e:
        logging.error(f"Batch encryption failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch encryption failed: {str(e)}"
        )

async def process_single_patient(patient_request: PatientDataRequest, storage: TDPQIMLEMongoStorage) -> str:
    """Helper function to process a single patient for batch operations"""
    try:
        patient_data = {
            "patient_id": patient_request.patient_id,
            "name": patient_request.name,
            "age": patient_request.age,
            "gender": patient_request.gender,
            "blood_type": patient_request.blood_type,
            "medical_condition": patient_request.medical_condition,
            "date_of_admission": patient_request.date_of_admission,
            "doctor_name": patient_request.doctor_name,
            "hospital": patient_request.hospital,
            "insurance_provider": patient_request.insurance_provider,
            "billing_amount": patient_request.billing_amount,
            "room_number": patient_request.room_number,
            "admission_type": patient_request.admission_type,
            "discharge_date": patient_request.discharge_date,
            "medication": patient_request.medication,
            "test_results": patient_request.test_results,
            "medical_history": patient_request.medical_history,
            "current_medications": patient_request.current_medications,
            "notes": patient_request.notes
        }
        
        # Get sensitivity level
        sensitivity = get_sensitivity_level(patient_request.sensitivity_level)
        
        # Store data
        document_id = await storage.store_patient_data(patient_data, sensitivity)
        return document_id
        
    except Exception as e:
        raise e

async def process_csv_patient(patient_data: Dict[str, Any], storage: TDPQIMLEMongoStorage) -> str:
    """Helper function to process a single CSV patient for batch operations"""
    try:
        # Store the data
        document_id = await storage.store_patient_data(
            patient_data,
            SensitivityLevel.HIGH
        )
        return document_id
        
    except Exception as e:
        raise e

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
            gender=patient_data.get("gender", ""),
            blood_type=patient_data.get("blood_type", ""),
            medical_condition=patient_data.get("medical_condition", ""),
            date_of_admission=patient_data.get("date_of_admission", ""),
            doctor_name=patient_data.get("doctor_name", ""),
            hospital=patient_data.get("hospital", ""),
            insurance_provider=patient_data.get("insurance_provider", ""),
            billing_amount=patient_data.get("billing_amount", 0.0),
            room_number=patient_data.get("room_number", ""),
            admission_type=patient_data.get("admission_type", ""),
            discharge_date=patient_data.get("discharge_date", ""),
            medication=patient_data.get("medication", ""),
            test_results=patient_data.get("test_results", ""),
            medical_history=patient_data.get("medical_history", []),
            current_medications=patient_data.get("current_medications", []),
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
            "gender": request.gender,
            "blood_type": request.blood_type,
            "medical_condition": request.medical_condition,
            "date_of_admission": request.date_of_admission,
            "doctor_name": request.doctor_name,
            "hospital": request.hospital,
            "insurance_provider": request.insurance_provider,
            "billing_amount": request.billing_amount,
            "room_number": request.room_number,
            "admission_type": request.admission_type,
            "discharge_date": request.discharge_date,
            "medication": request.medication,
            "test_results": request.test_results,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
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
                    gender=patient.get("gender", ""),
                    blood_type=patient.get("blood_type", ""),
                    medical_condition=patient.get("medical_condition", ""),
                    date_of_admission=patient.get("date_of_admission", ""),
                    doctor_name=patient.get("doctor_name", ""),
                    hospital=patient.get("hospital", ""),
                    insurance_provider=patient.get("insurance_provider", ""),
                    billing_amount=patient.get("billing_amount", 0.0),
                    room_number=patient.get("room_number", ""),
                    admission_type=patient.get("admission_type", ""),
                    discharge_date=patient.get("discharge_date", ""),
                    medication=patient.get("medication", ""),
                    test_results=patient.get("test_results", ""),
                    medical_history=patient["medical_history"],
                    current_medications=patient["current_medications"],
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
                    gender=patient.get("gender", ""),
                    blood_type=patient.get("blood_type", ""),
                    medical_condition=patient.get("medical_condition", ""),
                    date_of_admission=patient.get("date_of_admission", ""),
                    doctor_name=patient.get("doctor_name", ""),
                    hospital=patient.get("hospital", ""),
                    insurance_provider=patient.get("insurance_provider", ""),
                    billing_amount=patient.get("billing_amount", 0.0),
                    room_number=patient.get("room_number", ""),
                    admission_type=patient.get("admission_type", ""),
                    discharge_date=patient.get("discharge_date", ""),
                    medication=patient.get("medication", ""),
                    test_results=patient.get("test_results", ""),
                    medical_history=patient["medical_history"],
                    current_medications=patient["current_medications"],
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
            "gender": "Male",
            "blood_type": "O+",
            "medical_condition": "Condition A",
            "date_of_admission": datetime.now().isoformat(),
            "doctor_name": "Dr. Test",
            "hospital": "Hospital X",
            "insurance_provider": "Provider Y",
            "billing_amount": 1234.56,
            "medical_history": ["history1", "history2"],
            "current_medications": ["med1", "med2"],
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
            "gender": request.gender,
            "blood_type": request.blood_type,
            "medical_condition": request.diagnosis,
            "date_of_admission": datetime.now().isoformat(),
            "doctor_name": request.doctor_name,
            "hospital": request.hospital,
            "insurance_provider": request.insurance_provider,
            "billing_amount": request.billing_amount,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
            "test_results": request.test_results,
            "notes": request.notes
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

@router.post("/patients/upload-csv", response_model=Dict[str, Any])
async def upload_patient_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    storage: TDPQIMLEMongoStorage = Depends(get_storage),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Upload and process a CSV file containing patient data
    
    The CSV should have these columns:
    Name, Age, Gender, Blood Type, Medical Condition, 
    Date of Admission, Doctor Name, Hospital, 
    Insurance Provider, Billing Amount
    
    All data will be encrypted using TDP-QIMLE algorithm
    and stored in MongoDB.
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )

        # Read and parse CSV
        contents = await file.read()
        csv_data = io.StringIO(contents.decode('utf-8'))
        reader = csv.DictReader(csv_data)
        
        # Process rows in batches
        batch_size = 100
        all_rows = list(reader)
        results = {
            "total": len(all_rows),
            "success": 0,
            "failed": 0,
            "errors": [],
            "document_ids": [],
            "batch_size": batch_size
        }
        
        # Process in batches
        for i in range(0, len(all_rows), batch_size):
            batch = all_rows[i:i + batch_size]
            
            # Convert batch to patient data structures
            batch_patients = []
            for row in batch:
                try:
                    patient_data = {
                        "patient_id": str(uuid.uuid4()),
                        "name": row["Name"],
                        "age": int(row["Age"]),
                        "gender": row["Gender"],
                        "blood_type": row["Blood Type"],
                        "medical_condition": row["Medical Condition"],
                        "date_of_admission": row["Date of Admission"],
                        "doctor_name": row["Doctor Name"],
                        "hospital": row["Hospital"],
                        "insurance_provider": row["Insurance Provider"],
                        "billing_amount": float(row["Billing Amount"]),
                        "sensitivity_level": "HIGH"  # Default to high sensitivity
                    }
                    batch_patients.append(patient_data)
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append({
                        "row": i + len(batch_patients) + 1,
                        "error": f"Data conversion failed: {str(e)}"
                    })
            
            # Process batch in parallel
            if batch_patients:
                batch_tasks = []
                for patient_data in batch_patients:
                    task = asyncio.create_task(process_csv_patient(patient_data, storage))
                    batch_tasks.append(task)
                
                # Wait for all patients in the batch to complete
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                
                # Process batch results
                for j, result in enumerate(batch_results):
                    if isinstance(result, Exception):
                        results["failed"] += 1
                        results["errors"].append({
                            "row": i + j + 1,
                            "error": str(result)
                        })
                    else:
                        results["success"] += 1
                        results["document_ids"].append(result)
        
        # Background task for integrity verification
        background_tasks.add_task(
            verify_bulk_storage_integrity,
            storage,
            results["document_ids"]
        )
        
        return {
            "message": "CSV processing completed",
            "results": results,
            "algorithm": "TDP-QIMLE"
        }
        
    except Exception as e:
        logging.error(f"Failed to process CSV: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"CSV processing failed: {str(e)}"
        )

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

async def verify_bulk_storage_integrity(storage: TDPQIMLEMongoStorage, document_ids: List[str]):
    """Verify integrity of multiple stored documents"""
    try:
        for doc_id in document_ids:
            await storage.verify_document_integrity(doc_id)
    except Exception as e:
        logging.error(f"Bulk integrity verification failed: {str(e)}")

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