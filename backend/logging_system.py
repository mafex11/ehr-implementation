"""
MongoDB-based Logging System for Cryptographic Operations
Tracks all encryption, decryption, and privacy operations
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CryptoLogger:
    """
    Comprehensive logging system for cryptographic operations
    """
    
    def __init__(self, mongo_url: str, db_name: str = "ehrdb"):
        """
        Initialize the crypto logger
        
        Args:
            mongo_url: MongoDB connection string
            db_name: Database name
        """
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        self.crypto_logs = self.db["crypto_logs"]
        self.privacy_budget_logs = self.db["privacy_budget_logs"]
        self.system_logs = self.db["system_logs"]
        self.audit_logs = self.db["audit_logs"]
        
    async def log_crypto_operation(self, operation_type: str, entity_id: str, 
                                 epsilon: float, status: str, 
                                 additional_data: Dict[str, Any] = None,
                                 error: str = None):
        """
        Log cryptographic operations
        
        Args:
            operation_type: Type of operation (encrypt, decrypt, etc.)
            entity_id: ID of the entity involved
            epsilon: Privacy parameter used
            status: Operation status (success, failed)
            additional_data: Additional metadata
            error: Error message if failed
        """
        try:
            log_entry = {
                'timestamp': datetime.utcnow(),
                'operation_type': operation_type,
                'entity_id': entity_id,
                'epsilon_used': epsilon,
                'status': status,
                'error': error,
                'additional_data': additional_data or {},
                'session_id': self._generate_session_id()
            }
            
            await self.crypto_logs.insert_one(log_entry)
            logger.info(f"Logged crypto operation: {operation_type} - {status}")
            
        except Exception as e:
            logger.error(f"Failed to log crypto operation: {str(e)}")
    
    async def log_privacy_budget_update(self, entity_id: str, epsilon_consumed: float,
                                      total_budget: float, operation: str):
        """
        Log privacy budget updates
        
        Args:
            entity_id: ID of the entity
            epsilon_consumed: Amount of epsilon consumed
            total_budget: Total budget consumed so far
            operation: Operation that consumed the budget
        """
        try:
            log_entry = {
                'timestamp': datetime.utcnow(),
                'entity_id': entity_id,
                'epsilon_consumed': epsilon_consumed,
                'total_budget_consumed': total_budget,
                'operation': operation,
                'remaining_budget': max(0, 10.0 - total_budget)  # Assuming max budget of 10
            }
            
            await self.privacy_budget_logs.insert_one(log_entry)
            logger.info(f"Logged privacy budget update for {entity_id}")
            
        except Exception as e:
            logger.error(f"Failed to log privacy budget: {str(e)}")
    
    async def log_system_event(self, event_type: str, description: str, 
                             severity: str = "INFO", 
                             additional_data: Dict[str, Any] = None):
        """
        Log system events
        
        Args:
            event_type: Type of system event
            description: Event description
            severity: Event severity (INFO, WARNING, ERROR, CRITICAL)
            additional_data: Additional event data
        """
        try:
            log_entry = {
                'timestamp': datetime.utcnow(),
                'event_type': event_type,
                'description': description,
                'severity': severity,
                'additional_data': additional_data or {}
            }
            
            await self.system_logs.insert_one(log_entry)
            logger.info(f"Logged system event: {event_type} - {severity}")
            
        except Exception as e:
            logger.error(f"Failed to log system event: {str(e)}")
    
    async def log_audit_event(self, user_id: str, action: str, resource: str,
                            outcome: str, ip_address: str = None,
                            additional_data: Dict[str, Any] = None):
        """
        Log audit events for compliance
        
        Args:
            user_id: ID of the user performing the action
            action: Action performed
            resource: Resource accessed
            outcome: Outcome of the action
            ip_address: IP address of the user
            additional_data: Additional audit data
        """
        try:
            log_entry = {
                'timestamp': datetime.utcnow(),
                'user_id': user_id,
                'action': action,
                'resource': resource,
                'outcome': outcome,
                'ip_address': ip_address,
                'additional_data': additional_data or {}
            }
            
            await self.audit_logs.insert_one(log_entry)
            logger.info(f"Logged audit event: {action} on {resource} - {outcome}")
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
    
    async def get_crypto_logs(self, entity_id: str = None, 
                            operation_type: str = None,
                            start_time: datetime = None,
                            end_time: datetime = None,
                            limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve cryptographic operation logs
        
        Args:
            entity_id: Filter by entity ID
            operation_type: Filter by operation type
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of logs to return
            
        Returns:
            List of log entries
        """
        try:
            query = {}
            
            if entity_id:
                query['entity_id'] = entity_id
            if operation_type:
                query['operation_type'] = operation_type
            if start_time or end_time:
                query['timestamp'] = {}
                if start_time:
                    query['timestamp']['$gte'] = start_time
                if end_time:
                    query['timestamp']['$lte'] = end_time
            
            cursor = self.crypto_logs.find(query).sort('timestamp', -1).limit(limit)
            logs = []
            
            async for log in cursor:
                log['_id'] = str(log['_id'])
                logs.append(log)
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to retrieve crypto logs: {str(e)}")
            return []
    
    async def get_privacy_budget_status(self, entity_id: str = None) -> List[Dict[str, Any]]:
        """
        Get current privacy budget status
        
        Args:
            entity_id: Filter by entity ID
            
        Returns:
            List of privacy budget statuses
        """
        try:
            pipeline = [
                {'$match': {'entity_id': entity_id} if entity_id else {}},
                {'$group': {
                    '_id': '$entity_id',
                    'total_budget_consumed': {'$sum': '$epsilon_consumed'},
                    'last_update': {'$max': '$timestamp'},
                    'operation_count': {'$sum': 1}
                }}
            ]
            
            cursor = self.privacy_budget_logs.aggregate(pipeline)
            budget_status = []
            
            async for status in cursor:
                budget_status.append({
                    'entity_id': status['_id'],
                    'total_budget_consumed': status['total_budget_consumed'],
                    'remaining_budget': max(0, 10.0 - status['total_budget_consumed']),
                    'last_update': status['last_update'],
                    'operation_count': status['operation_count']
                })
            
            return budget_status
            
        except Exception as e:
            logger.error(f"Failed to get privacy budget status: {str(e)}")
            return []
    
    async def get_system_logs(self, event_type: str = None,
                            severity: str = None,
                            start_time: datetime = None,
                            end_time: datetime = None,
                            limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve system logs
        
        Args:
            event_type: Filter by event type
            severity: Filter by severity
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of logs to return
            
        Returns:
            List of system log entries
        """
        try:
            query = {}
            
            if event_type:
                query['event_type'] = event_type
            if severity:
                query['severity'] = severity
            if start_time or end_time:
                query['timestamp'] = {}
                if start_time:
                    query['timestamp']['$gte'] = start_time
                if end_time:
                    query['timestamp']['$lte'] = end_time
            
            cursor = self.system_logs.find(query).sort('timestamp', -1).limit(limit)
            logs = []
            
            async for log in cursor:
                log['_id'] = str(log['_id'])
                logs.append(log)
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to retrieve system logs: {str(e)}")
            return []
    
    async def get_audit_logs(self, user_id: str = None,
                           action: str = None,
                           resource: str = None,
                           start_time: datetime = None,
                           end_time: datetime = None,
                           limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve audit logs
        
        Args:
            user_id: Filter by user ID
            action: Filter by action
            resource: Filter by resource
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of logs to return
            
        Returns:
            List of audit log entries
        """
        try:
            query = {}
            
            if user_id:
                query['user_id'] = user_id
            if action:
                query['action'] = action
            if resource:
                query['resource'] = resource
            if start_time or end_time:
                query['timestamp'] = {}
                if start_time:
                    query['timestamp']['$gte'] = start_time
                if end_time:
                    query['timestamp']['$lte'] = end_time
            
            cursor = self.audit_logs.find(query).sort('timestamp', -1).limit(limit)
            logs = []
            
            async for log in cursor:
                log['_id'] = str(log['_id'])
                logs.append(log)
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to retrieve audit logs: {str(e)}")
            return []
    
    async def cleanup_old_logs(self, days_to_keep: int = 90):
        """
        Clean up old logs to manage storage
        
        Args:
            days_to_keep: Number of days to keep logs
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            collections = [self.crypto_logs, self.system_logs, self.audit_logs]
            
            for collection in collections:
                result = await collection.delete_many({
                    'timestamp': {'$lt': cutoff_date}
                })
                logger.info(f"Cleaned up {result.deleted_count} old logs from {collection.name}")
                
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {str(e)}")
    
    def _generate_session_id(self) -> str:
        """Generate a unique session ID"""
        return str(ObjectId())
    
    async def close(self):
        """Close the database connection"""
        self.client.close()

# Global logger instance
crypto_logger = None

async def initialize_crypto_logger(mongo_url: str):
    """Initialize the global crypto logger"""
    global crypto_logger
    crypto_logger = CryptoLogger(mongo_url)
    return crypto_logger

async def get_crypto_logger() -> CryptoLogger:
    """Get the global crypto logger instance"""
    global crypto_logger
    if crypto_logger is None:
        raise RuntimeError("Crypto logger not initialized")
    return crypto_logger 