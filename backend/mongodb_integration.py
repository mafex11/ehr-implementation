"""
MongoDB Integration for TDP-QIMLE Algorithm
Secure Patient Data Storage with Advanced Encryption
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
from typing import Dict, List, Optional, Any, Tuple
import json
from datetime import datetime, timedelta
import logging
from bson import ObjectId
from algorithm import TDPQIMLEAlgorithm, SensitivityLevel, TemporalPrivacyParams
import secrets
import hashlib

class TDPQIMLEMongoStorage:
    """
    MongoDB integration for the TDP-QIMLE algorithm
    Provides secure storage and retrieval of patient data
    """
    
    def __init__(self, connection_string: str = None, database_name: str = None):
        # Use environment variables if not provided
        if connection_string is None:
            import os
            connection_string = os.environ.get("MONGODB_URI", "mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/")
        
        if database_name is None:
            import os
            database_name = os.environ.get("DATABASE_NAME", "secure_ehr")
        self.client = AsyncIOMotorClient(connection_string)
        self.db = self.client[database_name]
        self.patients_collection = self.db.encrypted_patients
        self.audit_collection = self.db.encryption_audit
        self.integrity_collection = self.db.integrity_chain
        
        # Initialize algorithm with fixed master key for consistent encryption/decryption
        # In production, this should be stored securely (e.g., in environment variables or key management service)
        self.master_key = hashlib.sha256(b"TDP-QIMLE-MASTER-KEY-2025").digest()
        self.temporal_params = TemporalPrivacyParams(
            epsilon=1.0,
            delta=1e-5,
            time_decay_factor=0.01,
            temporal_window=3600,
            sensitivity_multiplier=1.5
        )
        self.algorithm = TDPQIMLEAlgorithm(self.master_key, self.temporal_params)
        
        self.logger = logging.getLogger(__name__)
        
    async def initialize_database(self):
        """Initialize database with proper indexes and collections"""
        try:
            # Create indexes for efficient querying
            patient_indexes = [
                IndexModel([("patient_id", ASCENDING)], unique=True),
                IndexModel([("encryption_metadata.timestamp", DESCENDING)]),
                IndexModel([("encryption_metadata.sensitivity_level", ASCENDING)]),
                IndexModel([("encryption_metadata.algorithm", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)]),
                IndexModel([("encryption_metadata.integrity_block.hash", ASCENDING)])
            ]
            
            audit_indexes = [
                IndexModel([("patient_id", ASCENDING)]),
                IndexModel([("operation", ASCENDING)]),
                IndexModel([("timestamp", DESCENDING)]),
                IndexModel([("success", ASCENDING)])
            ]
            
            integrity_indexes = [
                IndexModel([("index", ASCENDING)], unique=True),
                IndexModel([("hash", ASCENDING)], unique=True),
                IndexModel([("timestamp", DESCENDING)]),
                IndexModel([("previous_hash", ASCENDING)])
            ]
            
            await self.patients_collection.create_indexes(patient_indexes)
            await self.audit_collection.create_indexes(audit_indexes)
            await self.integrity_collection.create_indexes(integrity_indexes)
            
            self.logger.info("Database initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Database initialization failed: {str(e)}")
            raise
    
    async def _get_next_integrity_index(self) -> Tuple[int, str]:
        """Get the next integrity chain index and previous hash from database"""
        try:
            # Get the latest integrity block
            latest_block = await self.integrity_collection.find_one(
                {}, 
                sort=[("index", -1)]
            )
            
            if latest_block:
                return latest_block['index'] + 1, latest_block['hash']
            else:
                return 0, '0' * 64
                
        except Exception as e:
            self.logger.error(f"Failed to get next integrity index: {str(e)}")
            return 0, '0' * 64
    
    async def store_patient_data(self, patient_data: Dict, sensitivity: SensitivityLevel) -> str:
        """
        Store patient data using TDP-QIMLE encryption
        
        Args:
            patient_data: Patient information dictionary
            sensitivity: Data sensitivity level
            
        Returns:
            MongoDB document ID
        """
        try:
            # Get next integrity chain index and previous hash
            next_index, previous_hash = await self._get_next_integrity_index()
            
            # Encrypt patient data with database-aware integrity chain
            encrypted_document = self.algorithm.encrypt_patient_data(
                patient_data, 
                sensitivity, 
                next_index=next_index, 
                previous_hash=previous_hash
            )
            
            # Store in MongoDB
            result = await self.patients_collection.insert_one(encrypted_document)
            document_id = str(result.inserted_id)
            
            # Store integrity block separately
            integrity_block = encrypted_document['encryption_metadata']['integrity_block']
            await self.integrity_collection.insert_one(integrity_block)
            
            # Log operation
            await self._log_operation(
                patient_id=patient_data.get('patient_id'),
                operation='STORE',
                document_id=document_id,
                sensitivity=sensitivity.value,
                success=True
            )
            
            self.logger.info(f"Patient data stored successfully: {document_id}")
            return document_id
            
        except Exception as e:
            await self._log_operation(
                patient_id=patient_data.get('patient_id'),
                operation='STORE',
                document_id=None,
                sensitivity=sensitivity.value,
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to store patient data: {str(e)}")
            raise
    
    async def retrieve_patient_data(self, patient_id: str) -> Optional[Dict]:
        """
        Retrieve and decrypt patient data
        
        Args:
            patient_id: Patient identifier
            
        Returns:
            Decrypted patient data or None if not found
        """
        try:
            # Find encrypted document
            encrypted_document = await self.patients_collection.find_one(
                {"patient_id": patient_id}
            )
            
            if not encrypted_document:
                await self._log_operation(
                    patient_id=patient_id,
                    operation='RETRIEVE',
                    document_id=None,
                    success=False,
                    error="Patient not found"
                )
                return None
            
            # Verify integrity
            integrity_valid = self.algorithm.verify_integrity(encrypted_document)
            if not integrity_valid:
                await self._log_operation(
                    patient_id=patient_id,
                    operation='RETRIEVE',
                    document_id=str(encrypted_document['_id']),
                    success=False,
                    error="Integrity verification failed"
                )
                raise ValueError("Data integrity compromised")
            
            # Decrypt data
            decrypted_data = self.algorithm.decrypt_patient_data(encrypted_document)
            
            # Log successful operation
            await self._log_operation(
                patient_id=patient_id,
                operation='RETRIEVE',
                document_id=str(encrypted_document['_id']),
                success=True
            )
            
            self.logger.info(f"Patient data retrieved successfully: {patient_id}")
            return decrypted_data
            
        except Exception as e:
            await self._log_operation(
                patient_id=patient_id,
                operation='RETRIEVE',
                document_id=None,
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to retrieve patient data: {str(e)}")
            raise
    
    async def update_patient_data(self, patient_id: str, updated_data: Dict, sensitivity: SensitivityLevel) -> bool:
        """
        Update patient data with new encryption
        
        Args:
            patient_id: Patient identifier
            updated_data: New patient data
            sensitivity: Data sensitivity level
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Encrypt new data
            encrypted_document = self.algorithm.encrypt_patient_data(updated_data, sensitivity)
            encrypted_document['updated_at'] = datetime.now()
            
            # Update in MongoDB
            result = await self.patients_collection.replace_one(
                {"patient_id": patient_id},
                encrypted_document
            )
            
            if result.matched_count == 0:
                await self._log_operation(
                    patient_id=patient_id,
                    operation='UPDATE',
                    success=False,
                    error="Patient not found"
                )
                return False
            
            # Store new integrity block
            integrity_block = encrypted_document['encryption_metadata']['integrity_block']
            await self.integrity_collection.insert_one(integrity_block)
            
            # Log operation
            await self._log_operation(
                patient_id=patient_id,
                operation='UPDATE',
                document_id=str(encrypted_document.get('_id')),
                sensitivity=sensitivity.value,
                success=True
            )
            
            self.logger.info(f"Patient data updated successfully: {patient_id}")
            return True
            
        except Exception as e:
            await self._log_operation(
                patient_id=patient_id,
                operation='UPDATE',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to update patient data: {str(e)}")
            raise
    
    async def delete_patient_data(self, patient_id: str) -> bool:
        """
        Securely delete patient data
        
        Args:
            patient_id: Patient identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Find and delete document
            result = await self.patients_collection.delete_one({"patient_id": patient_id})
            
            if result.deleted_count == 0:
                await self._log_operation(
                    patient_id=patient_id,
                    operation='DELETE',
                    success=False,
                    error="Patient not found"
                )
                return False
            
            # Log operation
            await self._log_operation(
                patient_id=patient_id,
                operation='DELETE',
                success=True
            )
            
            self.logger.info(f"Patient data deleted successfully: {patient_id}")
            return True
            
        except Exception as e:
            await self._log_operation(
                patient_id=patient_id,
                operation='DELETE',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to delete patient data: {str(e)}")
            raise
    
    async def get_all_patients_decrypted(self, limit: int = 100) -> List[Dict]:
        """
        Get all patients with decrypted data
        
        Args:
            limit: Maximum number of patients to return
            
        Returns:
            List of decrypted patient data
        """
        try:
            cursor = self.patients_collection.find({}).limit(limit)
            
            decrypted_patients = []
            async for doc in cursor:
                try:
                    # Verify integrity
                    integrity_valid = self.algorithm.verify_integrity(doc)
                    if not integrity_valid:
                        self.logger.warning(f"Integrity check failed for patient {doc['patient_id']}")
                        continue
                    
                    # Decrypt data
                    decrypted_data = self.algorithm.decrypt_patient_data(doc)
                    decrypted_patients.append(decrypted_data)
                    
                except Exception as e:
                    self.logger.error(f"Failed to decrypt patient {doc.get('patient_id', 'unknown')}: {str(e)}")
                    continue
            
            await self._log_operation(
                patient_id=None,
                operation='BULK_RETRIEVE',
                success=True,
                additional_info=f"Retrieved {len(decrypted_patients)} patients"
            )
            
            return decrypted_patients
            
        except Exception as e:
            await self._log_operation(
                patient_id=None,
                operation='BULK_RETRIEVE',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to get all patients: {str(e)}")
            raise

    async def get_all_patients_metadata(self, limit: int = 100) -> List[Dict]:
        """
        Get all patients metadata only (no decryption)
        
        Args:
            limit: Maximum number of patients to return
            
        Returns:
            List of patient metadata
        """
        try:
            cursor = self.patients_collection.find(
                {},
                {
                    "patient_id": 1,
                    "encryption_metadata.timestamp": 1,
                    "encryption_metadata.sensitivity_level": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            ).limit(limit)
            
            results = []
            async for doc in cursor:
                results.append({
                    "patient_id": doc["patient_id"],
                    "timestamp": doc["encryption_metadata"]["timestamp"],
                    "sensitivity_level": doc["encryption_metadata"]["sensitivity_level"],
                    "created_at": doc["created_at"],
                    "updated_at": doc["updated_at"]
                })
            
            await self._log_operation(
                patient_id=None,
                operation='BULK_METADATA',
                success=True,
                additional_info=f"Retrieved metadata for {len(results)} patients"
            )
            
            return results
            
        except Exception as e:
            await self._log_operation(
                patient_id=None,
                operation='BULK_METADATA',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to get patients metadata: {str(e)}")
            raise

    async def get_all_patients_encrypted_display(self, limit: int = 100) -> List[Dict]:
        """
        Get all patients with encrypted data for dashboard display
        
        Args:
            limit: Maximum number of patients to return
            
        Returns:
            List of patient data with encrypted fields shown as encrypted
        """
        try:
            cursor = self.patients_collection.find({}).limit(limit)
            
            encrypted_patients = []
            async for doc in cursor:
                try:
                    # Get basic metadata
                    metadata = doc['encryption_metadata']
                    
                    # Create a display-friendly encrypted patient record
                    encrypted_patient = {
                        "patient_id": doc["patient_id"],
                        "name": f"🔒 ENCRYPTED ({metadata['sensitivity_level']})",
                        "age": f"🔒 ENCRYPTED",
                        "medical_history": [f"🔒 ENCRYPTED DATA"],
                        "current_medications": [f"🔒 ENCRYPTED DATA"],
                        "test_results": {
                            "status": f"🔒 ENCRYPTED ({metadata['algorithm']})",
                            "lab_result": "🔒 ENCRYPTED"
                        },
                        "notes": f"🔒 ENCRYPTED - Sensitivity: {self._get_sensitivity_name(metadata['sensitivity_level'])}",
                        "encryption_info": {
                            "algorithm": metadata['algorithm'],
                            "version": metadata['version'],
                            "sensitivity_level": self._get_sensitivity_name(metadata['sensitivity_level']),
                            "encrypted_at": doc['created_at'].isoformat() if doc.get('created_at') else None,
                            "last_updated": doc['updated_at'].isoformat() if doc.get('updated_at') else None,
                            "data_size": len(doc['encrypted_data']),
                            "has_integrity_block": 'integrity_block' in metadata
                        }
                    }
                    
                    encrypted_patients.append(encrypted_patient)
                    
                except Exception as e:
                    self.logger.error(f"Failed to process encrypted patient {doc.get('patient_id', 'unknown')}: {str(e)}")
                    continue
            
            await self._log_operation(
                patient_id=None,
                operation='BULK_ENCRYPTED_DISPLAY',
                success=True,
                additional_info=f"Retrieved {len(encrypted_patients)} encrypted patients for display"
            )
            
            return encrypted_patients
            
        except Exception as e:
            await self._log_operation(
                patient_id=None,
                operation='BULK_ENCRYPTED_DISPLAY',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to get encrypted patients for display: {str(e)}")
            raise

    def _get_sensitivity_name(self, sensitivity_value: int) -> str:
        """Convert sensitivity level number to name"""
        sensitivity_map = {
            1: "LOW",
            2: "MEDIUM", 
            3: "HIGH",
            4: "CRITICAL"
        }
        return sensitivity_map.get(sensitivity_value, "UNKNOWN")
    
    async def search_patients_by_sensitivity(self, sensitivity: SensitivityLevel) -> List[Dict]:
        """
        Search patients by sensitivity level (metadata only)
        
        Args:
            sensitivity: Sensitivity level to search for
            
        Returns:
            List of patient metadata (no decrypted data)
        """
        try:
            cursor = self.patients_collection.find(
                {"encryption_metadata.sensitivity_level": sensitivity.value},
                {
                    "patient_id": 1,
                    "encryption_metadata.timestamp": 1,
                    "encryption_metadata.sensitivity_level": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            )
            
            results = []
            async for doc in cursor:
                results.append({
                    "patient_id": doc["patient_id"],
                    "timestamp": doc["encryption_metadata"]["timestamp"],
                    "sensitivity_level": doc["encryption_metadata"]["sensitivity_level"],
                    "created_at": doc["created_at"],
                    "updated_at": doc["updated_at"]
                })
            
            await self._log_operation(
                patient_id=None,
                operation='SEARCH',
                success=True,
                additional_info=f"Found {len(results)} patients with sensitivity {sensitivity.value}"
            )
            
            return results
            
        except Exception as e:
            await self._log_operation(
                patient_id=None,
                operation='SEARCH',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to search patients: {str(e)}")
            raise
    
    async def verify_database_integrity(self) -> Dict:
        """
        Verify integrity of all stored data
        
        Returns:
            Integrity verification report
        """
        try:
            report = {
                "total_patients": 0,
                "verified_patients": 0,
                "failed_verifications": [],
                "integrity_chain_valid": True,
                "timestamp": datetime.now()
            }
            
            # Check all patient records
            cursor = self.patients_collection.find({})
            async for doc in cursor:
                report["total_patients"] += 1
                
                try:
                    if self.algorithm.verify_integrity(doc):
                        report["verified_patients"] += 1
                    else:
                        report["failed_verifications"].append({
                            "patient_id": doc["patient_id"],
                            "error": "Integrity verification failed"
                        })
                except Exception as e:
                    report["failed_verifications"].append({
                        "patient_id": doc["patient_id"],
                        "error": str(e)
                    })
            
            # Verify integrity chain
            integrity_cursor = self.integrity_collection.find({}).sort("index", 1)
            previous_hash = '0' * 64
            
            async for block in integrity_cursor:
                if block["previous_hash"] != previous_hash:
                    report["integrity_chain_valid"] = False
                    break
                previous_hash = block["hash"]
            
            await self._log_operation(
                patient_id=None,
                operation='VERIFY_INTEGRITY',
                success=True,
                additional_info=f"Verified {report['verified_patients']}/{report['total_patients']} patients"
            )
            
            return report
            
        except Exception as e:
            await self._log_operation(
                patient_id=None,
                operation='VERIFY_INTEGRITY',
                success=False,
                error=str(e)
            )
            self.logger.error(f"Failed to verify database integrity: {str(e)}")
            raise
    
    async def get_encryption_statistics(self) -> Dict:
        """
        Get encryption and storage statistics
        
        Returns:
            Statistics dictionary
        """
        try:
            stats = {
                "algorithm_info": self.algorithm.get_algorithm_info(),
                "total_patients": await self.patients_collection.count_documents({}),
                "sensitivity_distribution": {},
                "temporal_distribution": {},
                "integrity_blocks": await self.integrity_collection.count_documents({}),
                "audit_logs": await self.audit_collection.count_documents({})
            }
            
            # Sensitivity distribution
            sensitivity_pipeline = [
                {"$group": {
                    "_id": "$encryption_metadata.sensitivity_level",
                    "count": {"$sum": 1}
                }}
            ]
            
            async for doc in self.patients_collection.aggregate(sensitivity_pipeline):
                level_name = {1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL"}
                stats["sensitivity_distribution"][level_name.get(doc["_id"], "UNKNOWN")] = doc["count"]
            
            # Temporal distribution (last 24 hours)
            last_24h = datetime.now() - timedelta(hours=24)
            stats["recent_activity"] = await self.patients_collection.count_documents({
                "created_at": {"$gte": last_24h}
            })
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Failed to get encryption statistics: {str(e)}")
            raise
    
    async def _log_operation(self, patient_id: Optional[str], operation: str, 
                           document_id: Optional[str] = None, sensitivity: Optional[int] = None,
                           success: bool = True, error: Optional[str] = None,
                           additional_info: Optional[str] = None):
        """Log operation to audit collection"""
        try:
            log_entry = {
                "patient_id": patient_id,
                "operation": operation,
                "document_id": document_id,
                "sensitivity_level": sensitivity,
                "success": success,
                "error": error,
                "additional_info": additional_info,
                "timestamp": datetime.now(),
                "algorithm": "TDP-QIMLE"
            }
            
            await self.audit_collection.insert_one(log_entry)
            
        except Exception as e:
            self.logger.error(f"Failed to log operation: {str(e)}")
    
    async def close_connection(self):
        """Close MongoDB connection"""
        self.client.close()
        self.logger.info("MongoDB connection closed")

# Example usage
async def main():
    """Example usage of TDP-QIMLE MongoDB integration"""
    
    # Initialize storage
    storage = TDPQIMLEMongoStorage("mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/")
    await storage.initialize_database()
    
    # Example patient data
    patient_data = {
        'patient_id': 'P789012',
        'name': 'Jane Smith',
        'age': 32,
        'medical_history': ['asthma', 'allergies'],
        'current_medications': ['albuterol', 'cetirizine'],
        'test_results': {
            'blood_pressure': '120/80',
            'glucose': '95 mg/dL',
            'cholesterol': '180 mg/dL'
        },
        'notes': 'Patient shows good response to current treatment plan'
    }
    
    try:
        # Store patient data
        doc_id = await storage.store_patient_data(patient_data, SensitivityLevel.HIGH)
        print(f"Stored patient data with ID: {doc_id}")
        
        # Retrieve patient data
        retrieved_data = await storage.retrieve_patient_data('P789012')
        print(f"Retrieved data matches original: {retrieved_data == patient_data}")
        
        # Update patient data
        updated_data = patient_data.copy()
        updated_data['age'] = 33
        updated_data['notes'] = 'Patient age updated during annual checkup'
        
        success = await storage.update_patient_data('P789012', updated_data, SensitivityLevel.HIGH)
        print(f"Update successful: {success}")
        
        # Search by sensitivity
        high_sensitivity_patients = await storage.search_patients_by_sensitivity(SensitivityLevel.HIGH)
        print(f"Found {len(high_sensitivity_patients)} high sensitivity patients")
        
        # Verify database integrity
        integrity_report = await storage.verify_database_integrity()
        print(f"Database integrity: {integrity_report['verified_patients']}/{integrity_report['total_patients']} verified")
        
        # Get statistics
        stats = await storage.get_encryption_statistics()
        print(f"Total patients: {stats['total_patients']}")
        print(f"Algorithm: {stats['algorithm_info']['name']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    finally:
        await storage.close_connection()

if __name__ == "__main__":
    asyncio.run(main()) 