"""
Enhanced Database Layer with Encryption Support
Handles encrypted patient data storage and retrieval
"""

import os
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

from backend.crypto_engine import crypto_engine
from backend.logging_system import get_crypto_logger

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EncryptedDatabase:
    """
    Database layer with built-in encryption support
    """
    
    def __init__(self, mongo_url: str, db_name: str = "ehrdb"):
        """
        Initialize the encrypted database
        
        Args:
            mongo_url: MongoDB connection string
            db_name: Database name
        """
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
        # Collections
        self.patients_collection = self.db["encrypted_patients"]
        self.keys_collection = self.db["encryption_keys"]
        self.metadata_collection = self.db["patient_metadata"]
        
        # Flag to track if indexes are created
        self._indexes_created = False
    
    async def _ensure_indexes(self):
        """Ensure database indexes are created (lazy initialization)"""
        if not self._indexes_created:
            try:
                # Index for patient metadata
                await self.metadata_collection.create_index("patient_id")
                await self.metadata_collection.create_index("timestamp")
                
                # Index for encryption keys
                await self.keys_collection.create_index("patient_id")
                await self.keys_collection.create_index("created_at")
                
                self._indexes_created = True
                logger.info("Database indexes created successfully")
                
            except Exception as e:
                logger.error(f"Failed to create indexes: {str(e)}")
    
    async def _create_indexes(self):
        """Create database indexes for better performance (deprecated - use _ensure_indexes)"""
        await self._ensure_indexes()
    
    async def store_encrypted_patient(self, patient_data: Dict[str, Any], 
                                    epsilon: float = 1.0,
                                    user_id: str = "system") -> str:
        """
        Store patient data with encryption
        
        Args:
            patient_data: Patient data to encrypt and store
            epsilon: Privacy parameter for differential privacy
            user_id: ID of the user storing the data
            
        Returns:
            Patient ID of the stored record
        """
        try:
            # Ensure indexes are created
            await self._ensure_indexes()
            
            # Generate patient ID
            patient_id = str(ObjectId())
            
            # Encrypt patient data
            encrypted_package = crypto_engine.encrypt_patient_data(
                patient_data, epsilon, patient_id
            )
            
            # Store encrypted data
            encrypted_record = {
                'patient_id': patient_id,
                'encrypted_package': encrypted_package,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'created_by': user_id,
                'version': 1
            }
            
            await self.patients_collection.insert_one(encrypted_record)
            
            # Store metadata (non-sensitive searchable fields)
            metadata = {
                'patient_id': patient_id,
                'has_name': 'name' in patient_data,
                'has_age': 'age' in patient_data,
                'has_diagnosis': 'diagnosis' in patient_data,
                'has_lab_result': 'lab_result' in patient_data,
                'created_at': datetime.utcnow(),
                'epsilon_used': epsilon,
                'algorithm': encrypted_package.get('algorithm', 'AES-256-CBC-DP')
            }
            
            await self.metadata_collection.insert_one(metadata)
            
            # Log the operation
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_crypto_operation(
                operation_type="store_patient",
                entity_id=patient_id,
                epsilon=epsilon,
                status="success",
                additional_data={'user_id': user_id}
            )
            
            await crypto_logger.log_audit_event(
                user_id=user_id,
                action="CREATE_PATIENT",
                resource=f"patient:{patient_id}",
                outcome="SUCCESS"
            )
            
            logger.info(f"Successfully stored encrypted patient: {patient_id}")
            return patient_id
            
        except Exception as e:
            logger.error(f"Failed to store encrypted patient: {str(e)}")
            
            # Log the failure
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_crypto_operation(
                operation_type="store_patient",
                entity_id="unknown",
                epsilon=epsilon,
                status="failed",
                error=str(e)
            )
            
            raise
    
    async def retrieve_encrypted_patient(self, patient_id: str, 
                                       user_id: str = "system") -> Optional[Dict[str, Any]]:
        """
        Retrieve and decrypt patient data
        
        Args:
            patient_id: ID of the patient to retrieve
            user_id: ID of the user retrieving the data
            
        Returns:
            Decrypted patient data or None if not found
        """
        try:
            # Find encrypted record
            encrypted_record = await self.patients_collection.find_one({
                'patient_id': patient_id
            })
            
            if not encrypted_record:
                logger.warning(f"Patient not found: {patient_id}")
                return None
            
            # Decrypt patient data
            decrypted_data = crypto_engine.decrypt_patient_data(
                encrypted_record['encrypted_package']
            )
            
            # Add metadata
            decrypted_data['_id'] = patient_id
            decrypted_data['created_at'] = encrypted_record['created_at']
            decrypted_data['updated_at'] = encrypted_record['updated_at']
            
            # Log the operation
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_crypto_operation(
                operation_type="retrieve_patient",
                entity_id=patient_id,
                epsilon=0,  # No privacy budget consumed for retrieval
                status="success",
                additional_data={'user_id': user_id}
            )
            
            await crypto_logger.log_audit_event(
                user_id=user_id,
                action="READ_PATIENT",
                resource=f"patient:{patient_id}",
                outcome="SUCCESS"
            )
            
            logger.info(f"Successfully retrieved patient: {patient_id}")
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Failed to retrieve patient {patient_id}: {str(e)}")
            
            # Log the failure
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_crypto_operation(
                operation_type="retrieve_patient",
                entity_id=patient_id,
                epsilon=0,
                status="failed",
                error=str(e)
            )
            
            return None
    
    async def get_all_patients(self, user_id: str = "system", 
                             decrypt: bool = True) -> List[Dict[str, Any]]:
        """
        Retrieve all patients (with optional decryption)
        
        Args:
            user_id: ID of the user retrieving the data
            decrypt: Whether to decrypt the data
            
        Returns:
            List of patient records
        """
        try:
            patients = []
            
            # Get all encrypted records
            cursor = self.patients_collection.find({}).sort('created_at', -1)
            
            async for encrypted_record in cursor:
                try:
                    if decrypt:
                        # Decrypt each patient
                        decrypted_data = crypto_engine.decrypt_patient_data(
                            encrypted_record['encrypted_package']
                        )
                        
                        # Add metadata
                        decrypted_data['_id'] = encrypted_record['patient_id']
                        decrypted_data['created_at'] = encrypted_record['created_at']
                        decrypted_data['updated_at'] = encrypted_record['updated_at']
                        
                        patients.append(decrypted_data)
                    else:
                        # Return metadata only
                        metadata = await self.metadata_collection.find_one({
                            'patient_id': encrypted_record['patient_id']
                        })
                        
                        if metadata:
                            patients.append({
                                '_id': encrypted_record['patient_id'],
                                'created_at': encrypted_record['created_at'],
                                'epsilon_used': metadata.get('epsilon_used', 0),
                                'algorithm': metadata.get('algorithm', 'unknown'),
                                'encrypted': True
                            })
                        
                except Exception as e:
                    logger.error(f"Failed to process patient record: {str(e)}")
                    continue
            
            # Log the operation
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_audit_event(
                user_id=user_id,
                action="LIST_PATIENTS",
                resource="patients:all",
                outcome="SUCCESS",
                additional_data={'count': len(patients), 'decrypted': decrypt}
            )
            
            logger.info(f"Retrieved {len(patients)} patients")
            return patients
            
        except Exception as e:
            logger.error(f"Failed to retrieve all patients: {str(e)}")
            return []
    
    async def get_lab_results_for_dp_query(self, user_id: str = "system") -> List[float]:
        """
        Get lab results for differential privacy queries
        
        Args:
            user_id: ID of the user making the query
            
        Returns:
            List of lab results (already noisy from encryption)
        """
        try:
            lab_results = []
            
            # Get all encrypted records
            cursor = self.patients_collection.find({})
            
            async for encrypted_record in cursor:
                try:
                    # Decrypt patient data
                    decrypted_data = crypto_engine.decrypt_patient_data(
                        encrypted_record['encrypted_package']
                    )
                    
                    # Extract lab result if present
                    if 'lab_result' in decrypted_data:
                        lab_results.append(float(decrypted_data['lab_result']))
                        
                except Exception as e:
                    logger.error(f"Failed to decrypt patient for DP query: {str(e)}")
                    continue
            
            # Log the operation
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_audit_event(
                user_id=user_id,
                action="DP_QUERY_LAB_RESULTS",
                resource="patients:lab_results",
                outcome="SUCCESS",
                additional_data={'result_count': len(lab_results)}
            )
            
            logger.info(f"Retrieved {len(lab_results)} lab results for DP query")
            return lab_results
            
        except Exception as e:
            logger.error(f"Failed to get lab results for DP query: {str(e)}")
            return []
    
    async def update_patient(self, patient_id: str, updated_data: Dict[str, Any],
                           epsilon: float = 1.0, user_id: str = "system") -> bool:
        """
        Update patient data with re-encryption
        
        Args:
            patient_id: ID of the patient to update
            updated_data: Updated patient data
            epsilon: Privacy parameter for re-encryption
            user_id: ID of the user updating the data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if patient exists
            existing_record = await self.patients_collection.find_one({
                'patient_id': patient_id
            })
            
            if not existing_record:
                logger.warning(f"Patient not found for update: {patient_id}")
                return False
            
            # Encrypt updated data
            encrypted_package = crypto_engine.encrypt_patient_data(
                updated_data, epsilon, patient_id
            )
            
            # Update the record
            update_result = await self.patients_collection.update_one(
                {'patient_id': patient_id},
                {
                    '$set': {
                        'encrypted_package': encrypted_package,
                        'updated_at': datetime.utcnow(),
                        'version': existing_record.get('version', 1) + 1
                    }
                }
            )
            
            if update_result.modified_count > 0:
                # Update metadata
                await self.metadata_collection.update_one(
                    {'patient_id': patient_id},
                    {
                        '$set': {
                            'has_name': 'name' in updated_data,
                            'has_age': 'age' in updated_data,
                            'has_diagnosis': 'diagnosis' in updated_data,
                            'has_lab_result': 'lab_result' in updated_data,
                            'epsilon_used': epsilon,
                            'algorithm': encrypted_package.get('algorithm', 'AES-256-CBC-DP')
                        }
                    }
                )
                
                # Log the operation
                crypto_logger = await get_crypto_logger()
                await crypto_logger.log_crypto_operation(
                    operation_type="update_patient",
                    entity_id=patient_id,
                    epsilon=epsilon,
                    status="success",
                    additional_data={'user_id': user_id}
                )
                
                await crypto_logger.log_audit_event(
                    user_id=user_id,
                    action="UPDATE_PATIENT",
                    resource=f"patient:{patient_id}",
                    outcome="SUCCESS"
                )
                
                logger.info(f"Successfully updated patient: {patient_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to update patient {patient_id}: {str(e)}")
            
            # Log the failure
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_crypto_operation(
                operation_type="update_patient",
                entity_id=patient_id,
                epsilon=epsilon,
                status="failed",
                error=str(e)
            )
            
            return False
    
    async def delete_patient(self, patient_id: str, user_id: str = "system") -> bool:
        """
        Delete patient data (with audit logging)
        
        Args:
            patient_id: ID of the patient to delete
            user_id: ID of the user deleting the data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete from all collections
            patient_result = await self.patients_collection.delete_one({
                'patient_id': patient_id
            })
            
            metadata_result = await self.metadata_collection.delete_one({
                'patient_id': patient_id
            })
            
            if patient_result.deleted_count > 0:
                # Log the operation
                crypto_logger = await get_crypto_logger()
                await crypto_logger.log_audit_event(
                    user_id=user_id,
                    action="DELETE_PATIENT",
                    resource=f"patient:{patient_id}",
                    outcome="SUCCESS"
                )
                
                logger.info(f"Successfully deleted patient: {patient_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete patient {patient_id}: {str(e)}")
            return False
    
    async def get_patient_count(self) -> int:
        """Get total number of patients"""
        try:
            count = await self.patients_collection.count_documents({})
            return count
        except Exception as e:
            logger.error(f"Failed to get patient count: {str(e)}")
            return 0
    
    async def close(self):
        """Close the database connection"""
        self.client.close()

# Database configuration
MONGO_URL = "mongodb+srv://mafex:mafex@cluster0.oxnl42g.mongodb.net/"
encrypted_db = EncryptedDatabase(MONGO_URL)

# Legacy collections for compatibility (these will be deprecated)
client = AsyncIOMotorClient(MONGO_URL)
db = client["ehrdb"]
patients_collection = db["patients"]  # Keep for migration purposes
