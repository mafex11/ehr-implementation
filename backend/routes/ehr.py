"""
Enhanced EHR API Routes with Encryption and Differential Privacy
Supports encrypted data storage, retrieval, and privacy-preserving queries
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from bson.objectid import ObjectId

from backend.database import encrypted_db
from backend.crypto_engine import crypto_engine
from backend.logging_system import get_crypto_logger
from backend.dp_engine import apply_dp_to_average

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class Patient(BaseModel):
    name: str = Field(..., description="Patient name")
    age: int = Field(..., ge=0, le=150, description="Patient age")
    diagnosis: str = Field(..., description="Patient diagnosis")
    lab_result: float = Field(..., description="Lab result value")

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    diagnosis: Optional[str] = None
    lab_result: Optional[float] = None

class DPQueryRequest(BaseModel):
    epsilon: float = Field(default=1.0, ge=0.1, le=10.0, description="Privacy parameter")
    query_type: str = Field(default="lab_average", description="Type of query")

class EncryptedResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    encrypted: bool = True
    epsilon_used: float
    timestamp: str

# Dependency to get client IP
def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    return request.client.host

# Dependency to get user ID (placeholder for authentication)
def get_current_user() -> str:
    """Get current user ID - placeholder for authentication system"""
    return "anonymous_user"

@router.post("/add", response_model=Dict[str, Any])
async def add_patient(
    patient: Patient,
    epsilon: float = Query(default=1.0, ge=0.1, le=10.0, description="Privacy parameter for encryption"),
    user_id: str = Depends(get_current_user),
    client_ip: str = Depends(get_client_ip)
):
    """
    Add a new patient with encryption and differential privacy
    
    Args:
        patient: Patient data to store
        epsilon: Privacy parameter for differential privacy
        user_id: ID of the user adding the patient
        client_ip: IP address of the client
        
    Returns:
        Response with patient ID and encryption metadata
    """
    try:
        # Convert patient to dict
        patient_data = patient.dict()
        
        # Store encrypted patient
        patient_id = await encrypted_db.store_encrypted_patient(
            patient_data=patient_data,
            epsilon=epsilon,
            user_id=user_id
        )
        
        # Log system event
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="PATIENT_ADDED",
            description=f"New patient added with ID: {patient_id}",
            severity="INFO",
            additional_data={
                'patient_id': patient_id,
                'epsilon_used': epsilon,
                'user_id': user_id,
                'client_ip': client_ip
            }
        )
        
        return {
            "success": True,
            "patient_id": patient_id,
            "encrypted": True,
            "epsilon_used": epsilon,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Patient added successfully with encryption"
        }
        
    except Exception as e:
        logger.error(f"Failed to add patient: {str(e)}")
        
        # Log system error
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="PATIENT_ADD_ERROR",
            description=f"Failed to add patient: {str(e)}",
            severity="ERROR",
            additional_data={
                'user_id': user_id,
                'client_ip': client_ip,
                'error': str(e)
            }
        )
        
        raise HTTPException(status_code=500, detail=f"Failed to add patient: {str(e)}")

@router.get("/all", response_model=List[Dict[str, Any]])
async def get_all_patients(
    decrypt: bool = Query(default=True, description="Whether to decrypt patient data"),
    user_id: str = Depends(get_current_user),
    client_ip: str = Depends(get_client_ip)
):
    """
    Get all patients with optional decryption
    
    Args:
        decrypt: Whether to decrypt the patient data
        user_id: ID of the user requesting the data
        client_ip: IP address of the client
        
    Returns:
        List of patient records (encrypted or decrypted)
    """
    try:
        # Get all patients
        patients = await encrypted_db.get_all_patients(
            user_id=user_id,
            decrypt=decrypt
        )
        
        # Log system event
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="PATIENTS_RETRIEVED",
            description=f"Retrieved {len(patients)} patients",
            severity="INFO",
            additional_data={
                'patient_count': len(patients),
                'decrypted': decrypt,
                'user_id': user_id,
                'client_ip': client_ip
            }
        )
        
        return patients
        
    except Exception as e:
        logger.error(f"Failed to retrieve patients: {str(e)}")
        
        # Log system error
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="PATIENTS_RETRIEVE_ERROR",
            description=f"Failed to retrieve patients: {str(e)}",
            severity="ERROR",
            additional_data={
                'user_id': user_id,
                'client_ip': client_ip,
                'error': str(e)
            }
        )
        
        raise HTTPException(status_code=500, detail=f"Failed to retrieve patients: {str(e)}")

@router.get("/dp/lab_average", response_model=Dict[str, Any])
async def get_dp_lab_average(
    epsilon: float = Query(default=1.0, ge=0.1, le=10.0, description="Privacy parameter"),
    user_id: str = Depends(get_current_user),
    client_ip: str = Depends(get_client_ip)
):
    """
    Get differentially private lab result average
    
    Args:
        epsilon: Privacy parameter for differential privacy
        user_id: ID of the user making the query
        client_ip: IP address of the client
        
    Returns:
        Encrypted differentially private average
    """
    try:
        # Get lab results (already noisy from encryption)
        lab_results = await encrypted_db.get_lab_results_for_dp_query(user_id=user_id)
        
        if not lab_results:
            return {
                "success": False,
                "message": "No lab results available",
                "dp_average": 0.0,
                "epsilon": epsilon,
                "encrypted": True
            }
        
        # Apply additional differential privacy
        dp_average = apply_dp_to_average(lab_results, epsilon)
        
        # Encrypt the result
        encrypted_result = crypto_engine.encrypt_query_result(dp_average, epsilon)
        
        # Log the query
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_crypto_operation(
            operation_type="dp_query",
            entity_id="lab_average",
            epsilon=epsilon,
            status="success",
            additional_data={
                'user_id': user_id,
                'client_ip': client_ip,
                'result_count': len(lab_results)
            }
        )
        
        await crypto_logger.log_privacy_budget_update(
            entity_id=user_id,
            epsilon_consumed=epsilon,
            total_budget=crypto_engine.get_privacy_budget(user_id) + epsilon,
            operation="dp_lab_average"
        )
        
        return {
            "success": True,
            "encrypted_result": encrypted_result,
            "dp_average": dp_average,  # Also return decrypted for compatibility
            "epsilon": epsilon,
            "encrypted": True,
            "timestamp": datetime.utcnow().isoformat(),
            "result_count": len(lab_results)
        }
        
    except Exception as e:
        logger.error(f"Failed to get DP lab average: {str(e)}")
        
        # Log system error
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="DP_QUERY_ERROR",
            description=f"Failed to get DP lab average: {str(e)}",
            severity="ERROR",
            additional_data={
                'user_id': user_id,
                'client_ip': client_ip,
                'error': str(e)
            }
        )
        
        raise HTTPException(status_code=500, detail=f"Failed to get DP lab average: {str(e)}")

@router.get("/system/status", response_model=Dict[str, Any])
async def get_system_status(
    user_id: str = Depends(get_current_user)
):
    """
    Get system status and statistics
    
    Args:
        user_id: ID of the user making the request
        
    Returns:
        System status information
    """
    try:
        # Get patient count
        patient_count = await encrypted_db.get_patient_count()
        
        # Get crypto engine status
        total_operations = len(crypto_engine.get_operation_logs())
        
        # Get privacy budget summary
        crypto_logger = await get_crypto_logger()
        budget_status = await crypto_logger.get_privacy_budget_status()
        
        return {
            "success": True,
            "system_status": "operational",
            "patient_count": patient_count,
            "total_crypto_operations": total_operations,
            "privacy_budget_entities": len(budget_status),
            "encryption_algorithm": "AES-256-CBC-DP",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system status: {str(e)}")
