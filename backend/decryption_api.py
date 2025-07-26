"""
Independent Decryption API Routes
Separate API structure for decryption operations with different authentication
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import logging
import secrets
import hashlib
import time
import json

from decryption_engine import decryption_engine, DecryptionMethod, DecryptionContext
from mongodb_integration import TDPQIMLEMongoStorage

# Initialize router with different prefix
router = APIRouter(prefix="/api/decrypt", tags=["Independent Decryption System"])
security = HTTPBearer()

# Separate authentication for decryption
class DecryptionAuth:
    def __init__(self):
        self.authorized_users = {
            "decrypt_admin": "decrypt_key_2024_secure",
            "medical_staff": "medical_decrypt_access",
            "researcher": "research_decrypt_token"
        }
    
    def verify_decryption_credentials(self, username: str, password: str) -> bool:
        return self.authorized_users.get(username) == password

decryption_auth = DecryptionAuth()

# Pydantic models for decryption API
class DecryptionSessionRequest(BaseModel):
    username: str = Field(..., description="Decryption username")
    password: str = Field(..., description="Decryption password")
    security_clearance: str = Field(..., description="Security clearance level")
    purpose: str = Field(..., description="Purpose of decryption")
    department: str = Field(..., description="Department/organization")

class DecryptionSessionResponse(BaseModel):
    session_id: str
    expires_at: datetime
    clearance_level: str
    authorized_methods: List[str]
    session_token: str

class PatientDecryptionRequest(BaseModel):
    patient_id: str = Field(..., description="Patient identifier to decrypt")
    decryption_method: str = Field(default="full_independent", description="Decryption method to use")
    verification_code: Optional[str] = Field(None, description="Additional verification code")
    audit_reason: str = Field(..., description="Reason for accessing patient data")

class PatientDecryptionResponse(BaseModel):
    patient_id: str
    decrypted_data: Dict[str, Any]
    decryption_metadata: Dict[str, Any]
    audit_trail: List[Dict[str, Any]]
    session_info: Dict[str, Any]

class BulkDecryptionRequest(BaseModel):
    patient_ids: List[str] = Field(..., description="List of patient IDs to decrypt")
    decryption_method: str = Field(default="full_independent")
    batch_size: int = Field(default=10, ge=1, le=50)
    audit_reason: str = Field(..., description="Reason for bulk decryption")

class DecryptionAuditRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_filter: Optional[str] = None
    action_filter: Optional[str] = None

# Dependency functions
async def get_decryption_storage() -> TDPQIMLEMongoStorage:
    """Get MongoDB storage instance for decryption operations"""
    return TDPQIMLEMongoStorage("mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/")

async def verify_decryption_session(session_id: str = Header(..., alias="X-Decryption-Session")):
    """Verify decryption session"""
    if not session_id or session_id not in decryption_engine.decryption_session_keys:
        raise HTTPException(
            status_code=401, 
            detail="Invalid or expired decryption session"
        )
    
    session_info = decryption_engine.decryption_session_keys[session_id]
    
    # Check if session is expired (1 hour)
    if time.time() - session_info['last_access'] > 3600:
        del decryption_engine.decryption_session_keys[session_id]
        raise HTTPException(
            status_code=401, 
            detail="Decryption session expired"
        )
    
    return session_id

# API Routes
@router.post("/auth/session", response_model=DecryptionSessionResponse)
async def create_decryption_session(request: DecryptionSessionRequest):
    """
    Create a new decryption session with separate authentication
    This endpoint requires different credentials than the encryption system
    """
    try:
        # Verify decryption credentials
        if not decryption_auth.verify_decryption_credentials(request.username, request.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid decryption credentials"
            )
        
        # Create session
        user_credentials = {
            "username": request.username,
            "department": request.department,
            "purpose": request.purpose
        }
        
        session_id = await decryption_engine.create_decryption_session(
            user_credentials, 
            request.security_clearance
        )
        
        # Generate session token
        session_token = hashlib.sha256(f"{session_id}:{request.username}:{time.time()}".encode()).hexdigest()
        
        return DecryptionSessionResponse(
            session_id=session_id,
            expires_at=datetime.fromtimestamp(time.time() + 3600),
            clearance_level=request.security_clearance,
            authorized_methods=[method.value for method in DecryptionMethod],
            session_token=session_token
        )
        
    except Exception as e:
        logging.error(f"Failed to create decryption session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

@router.get("/health")
async def decryption_health_check():
    """Health check for decryption system"""
    return {
        "status": "operational",
        "system": "Independent Decryption Engine",
        "active_sessions": len(decryption_engine.decryption_session_keys),
        "supported_methods": [method.value for method in DecryptionMethod],
        "timestamp": datetime.now().isoformat()
    }

@router.post("/patient/single", response_model=PatientDecryptionResponse)
async def decrypt_single_patient(
    request: PatientDecryptionRequest,
    session_id: str = Depends(verify_decryption_session),
    storage: TDPQIMLEMongoStorage = Depends(get_decryption_storage)
):
    """
    Decrypt a single patient's data using independent decryption engine
    Requires active decryption session and separate authentication
    """
    try:
        # Get encrypted document from database
        encrypted_document = await storage.patients_collection.find_one(
            {"patient_id": request.patient_id}
        )
        
        if not encrypted_document:
            raise HTTPException(
                status_code=404,
                detail=f"Patient {request.patient_id} not found"
            )
        
        # Perform independent decryption
        decrypted_data = await decryption_engine.full_independent_decryption(
            encrypted_document, 
            session_id
        )
        
        # Get audit trail
        audit_trail = await decryption_engine.get_decryption_audit_log(session_id)
        
        # Get session info
        session_info = decryption_engine.decryption_session_keys[session_id]
        
        return PatientDecryptionResponse(
            patient_id=request.patient_id,
            decrypted_data=decrypted_data,
            decryption_metadata={
                "method": request.decryption_method,
                "decrypted_at": datetime.now().isoformat(),
                "session_id": session_id,
                "audit_reason": request.audit_reason
            },
            audit_trail=audit_trail[-5:],  # Last 5 audit entries
            session_info={
                "username": session_info['credentials']['username'],
                "clearance": session_info['clearance'],
                "access_count": session_info['access_count']
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to decrypt patient data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

@router.post("/patient/bulk")
async def decrypt_bulk_patients(
    request: BulkDecryptionRequest,
    session_id: str = Depends(verify_decryption_session),
    storage: TDPQIMLEMongoStorage = Depends(get_decryption_storage)
):
    """
    Decrypt multiple patients' data in batches
    Uses independent decryption engine for each patient
    """
    try:
        decrypted_patients = []
        failed_patients = []
        
        # Process in batches
        for i in range(0, len(request.patient_ids), request.batch_size):
            batch = request.patient_ids[i:i + request.batch_size]
            
            for patient_id in batch:
                try:
                    # Get encrypted document
                    encrypted_document = await storage.patients_collection.find_one(
                        {"patient_id": patient_id}
                    )
                    
                    if not encrypted_document:
                        failed_patients.append({
                            "patient_id": patient_id,
                            "error": "Patient not found"
                        })
                        continue
                    
                    # Decrypt
                    decrypted_data = await decryption_engine.full_independent_decryption(
                        encrypted_document, 
                        session_id
                    )
                    
                    decrypted_patients.append({
                        "patient_id": patient_id,
                        "data": decrypted_data,
                        "decrypted_at": datetime.now().isoformat()
                    })
                    
                except Exception as e:
                    failed_patients.append({
                        "patient_id": patient_id,
                        "error": str(e)
                    })
            
            # Small delay between batches
            await asyncio.sleep(0.1)
        
        return {
            "total_requested": len(request.patient_ids),
            "successfully_decrypted": len(decrypted_patients),
            "failed_decryptions": len(failed_patients),
            "decrypted_patients": decrypted_patients,
            "failed_patients": failed_patients,
            "batch_info": {
                "batch_size": request.batch_size,
                "total_batches": (len(request.patient_ids) + request.batch_size - 1) // request.batch_size
            },
            "audit_reason": request.audit_reason
        }
        
    except Exception as e:
        logging.error(f"Bulk decryption failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk decryption failed: {str(e)}")

@router.get("/patient/search/encrypted")
async def search_encrypted_patients(
    sensitivity_level: str = Query(..., description="Sensitivity level to search"),
    limit: int = Query(default=50, ge=1, le=10000),
    session_id: str = Depends(verify_decryption_session),
    storage: TDPQIMLEMongoStorage = Depends(get_decryption_storage)
):
    """
    Search for encrypted patients by sensitivity level
    Returns encrypted metadata only, requires separate decryption calls
    """
    try:
        # Convert string sensitivity level to integer value for database query
        sensitivity_map = {
            "LOW": 1,
            "MEDIUM": 2,
            "HIGH": 3,
            "CRITICAL": 4
        }
        
        sensitivity_value = sensitivity_map.get(sensitivity_level.upper())
        if sensitivity_value is None:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sensitivity level. Must be one of: {list(sensitivity_map.keys())}"
            )
        
        # Search encrypted documents using integer sensitivity level
        cursor = storage.patients_collection.find(
            {"encryption_metadata.sensitivity_level": sensitivity_value}
        ).limit(limit)
        
        encrypted_patients = []
        async for doc in cursor:
            encrypted_patients.append({
                "patient_id": doc["patient_id"],
                "encrypted_at": doc["created_at"],
                "sensitivity_level": storage._get_sensitivity_name(doc["encryption_metadata"]["sensitivity_level"]),
                "algorithm_version": doc["encryption_metadata"]["version"],
                "has_integrity_block": "integrity_block" in doc["encryption_metadata"]
            })
        
        return {
            "search_criteria": {
                "sensitivity_level": sensitivity_level,
                "limit": limit
            },
            "total_found": len(encrypted_patients),
            "encrypted_patients": encrypted_patients,
            "note": "Use /patient/single or /patient/bulk endpoints to decrypt specific patients"
        }
        
    except Exception as e:
        logging.error(f"Encrypted patient search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/patient/encrypted/{patient_id}")
async def get_encrypted_patient(
    patient_id: str,
    session_id: str = Depends(verify_decryption_session),
    storage: TDPQIMLEMongoStorage = Depends(get_decryption_storage)
):
    """
    Get the full encrypted MongoDB document for a patient, including encrypted_data.
    Requires a valid decryption session.
    """
    try:
        doc = await storage.patients_collection.find_one({"patient_id": patient_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Patient not found")
        # Remove MongoDB internal fields if present
        doc.pop("_id", None)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch encrypted patient: {str(e)}")

@router.get("/audit/session")
async def get_session_audit_log(
    session_id: str = Depends(verify_decryption_session)
):
    """
    Get audit log for current decryption session
    """
    try:
        audit_log = await decryption_engine.get_decryption_audit_log(session_id)
        session_info = decryption_engine.decryption_session_keys[session_id]
        
        return {
            "session_id": session_id,
            "session_info": {
                "username": session_info['credentials']['username'],
                "created_at": datetime.fromtimestamp(session_info['created_at']),
                "access_count": session_info['access_count'],
                "last_access": datetime.fromtimestamp(session_info['last_access'])
            },
            "audit_entries": audit_log,
            "total_entries": len(audit_log)
        }
        
    except Exception as e:
        logging.error(f"Failed to get audit log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audit log retrieval failed: {str(e)}")

@router.post("/audit/system")
async def get_system_audit_log(
    request: DecryptionAuditRequest,
    session_id: str = Depends(verify_decryption_session)
):
    """
    Get system-wide audit log (requires admin privileges)
    """
    try:
        session_info = decryption_engine.decryption_session_keys[session_id]
        
        # Check if user has admin privileges
        if session_info['clearance'] != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required for system audit log"
            )
        
        # Filter audit log based on request
        filtered_log = decryption_engine.decryption_audit_log
        
        if request.start_date:
            filtered_log = [entry for entry in filtered_log 
                          if entry['timestamp'] >= request.start_date.timestamp()]
        
        if request.end_date:
            filtered_log = [entry for entry in filtered_log 
                          if entry['timestamp'] <= request.end_date.timestamp()]
        
        if request.user_filter:
            filtered_log = [entry for entry in filtered_log 
                          if entry.get('user') == request.user_filter]
        
        if request.action_filter:
            filtered_log = [entry for entry in filtered_log 
                          if entry.get('action') == request.action_filter]
        
        return {
            "total_entries": len(filtered_log),
            "audit_entries": filtered_log,
            "filters_applied": {
                "start_date": request.start_date,
                "end_date": request.end_date,
                "user_filter": request.user_filter,
                "action_filter": request.action_filter
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to get system audit log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"System audit log retrieval failed: {str(e)}")

@router.delete("/auth/session")
async def terminate_decryption_session(
    session_id: str = Depends(verify_decryption_session)
):
    """
    Terminate current decryption session
    """
    try:
        if session_id in decryption_engine.decryption_session_keys:
            session_info = decryption_engine.decryption_session_keys[session_id]
            del decryption_engine.decryption_session_keys[session_id]
            
            # Log session termination
            decryption_engine.decryption_audit_log.append({
                'action': 'session_terminated',
                'session_id': session_id,
                'timestamp': time.time(),
                'user': session_info['credentials'].get('username', 'unknown')
            })
            
            return {
                "message": "Decryption session terminated successfully",
                "session_id": session_id,
                "terminated_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to terminate session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session termination failed: {str(e)}")

@router.post("/maintenance/cleanup")
async def cleanup_expired_sessions(
    session_id: str = Depends(verify_decryption_session)
):
    """
    Clean up expired decryption sessions (admin only)
    """
    try:
        session_info = decryption_engine.decryption_session_keys[session_id]
        
        # Check admin privileges
        if session_info['clearance'] != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required for session cleanup"
            )
        
        cleaned_count = await decryption_engine.cleanup_expired_sessions()
        
        return {
            "message": "Session cleanup completed",
            "expired_sessions_cleaned": cleaned_count,
            "active_sessions_remaining": len(decryption_engine.decryption_session_keys),
            "cleaned_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to cleanup sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session cleanup failed: {str(e)}")

@router.get("/methods/available")
async def get_available_decryption_methods(
    session_id: str = Depends(verify_decryption_session)
):
    """
    Get available decryption methods for current session
    """
    try:
        session_info = decryption_engine.decryption_session_keys[session_id]
        
        methods = []
        for method in DecryptionMethod:
            methods.append({
                "method": method.value,
                "description": f"Decryption using {method.value.replace('_', ' ').title()}",
                "clearance_required": "standard" if method != DecryptionMethod.INTEGRITY_UNWRAPPING else "high"
            })
        
        return {
            "available_methods": methods,
            "user_clearance": session_info['clearance'],
            "session_id": session_id
        }
        
    except Exception as e:
        logging.error(f"Failed to get available methods: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Method retrieval failed: {str(e)}") 