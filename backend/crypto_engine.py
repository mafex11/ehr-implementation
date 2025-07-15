"""
Differential Privacy Enhanced Cryptographic Engine
Combines traditional AES encryption with differential privacy mechanisms
"""

import os
import json
import secrets
import hashlib
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import numpy as np
from diffprivlib.mechanisms import Laplace, Gaussian

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DPCryptoEngine:
    """
    Differential Privacy Enhanced Cryptographic Engine
    
    This engine provides:
    1. AES-256 encryption for data at rest
    2. Differential privacy noise injection during encryption
    3. Key derivation and management
    4. Privacy budget tracking
    """
    
    def __init__(self, master_key: Optional[str] = None):
        """
        Initialize the crypto engine
        
        Args:
            master_key: Optional master key, if None generates new one
        """
        self.master_key = master_key or self._generate_master_key()
        self.privacy_budget = {}  # Track epsilon consumption per operation
        self.operation_logs = []  # Track all crypto operations
        
    def _generate_master_key(self) -> str:
        """Generate a new master key for the system"""
        key = Fernet.generate_key()
        return key.decode('utf-8')
    
    def _derive_key(self, salt: bytes, password: str = None) -> bytes:
        """
        Derive encryption key from master key and salt
        
        Args:
            salt: Random salt for key derivation
            password: Optional password, uses master key if None
            
        Returns:
            Derived encryption key
        """
        password = password or self.master_key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(password.encode())
    
    def _add_dp_noise(self, data: Dict[str, Any], epsilon: float = 1.0) -> Dict[str, Any]:
        """
        Add differential privacy noise to numerical fields
        
        Args:
            data: Original data dictionary
            epsilon: Privacy parameter
            
        Returns:
            Data with noise added to numerical fields
        """
        noisy_data = data.copy()
        
        # Add noise to age if present
        if 'age' in data and isinstance(data['age'], (int, float)):
            laplace_mech = Laplace(epsilon=epsilon/2, sensitivity=1.0)
            noisy_data['age'] = max(0, int(laplace_mech.randomise(float(data['age']))))
        
        # Add noise to lab_result if present
        if 'lab_result' in data and isinstance(data['lab_result'], (int, float)):
            gaussian_mech = Gaussian(epsilon=epsilon/2, delta=1e-5, sensitivity=10.0)
            noisy_data['lab_result'] = max(0, gaussian_mech.randomise(float(data['lab_result'])))
        
        return noisy_data
    
    def encrypt_patient_data(self, patient_data: Dict[str, Any], 
                           epsilon: float = 1.0, 
                           patient_id: str = None) -> Dict[str, Any]:
        """
        Encrypt patient data with differential privacy
        
        Args:
            patient_data: Patient data dictionary
            epsilon: Privacy parameter for DP noise
            patient_id: Optional patient ID for logging
            
        Returns:
            Encrypted data package with metadata
        """
        try:
            # Generate unique salt for this record
            salt = os.urandom(16)
            
            # Add differential privacy noise
            noisy_data = self._add_dp_noise(patient_data, epsilon)
            
            # Derive encryption key
            key = self._derive_key(salt)
            
            # Create cipher
            iv = os.urandom(16)
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            
            # Prepare data for encryption
            json_data = json.dumps(noisy_data).encode('utf-8')
            
            # Pad data to block size
            padding_length = 16 - (len(json_data) % 16)
            padded_data = json_data + bytes([padding_length] * padding_length)
            
            # Encrypt data
            encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
            
            # Create encrypted package
            encrypted_package = {
                'encrypted_data': encrypted_data.hex(),
                'salt': salt.hex(),
                'iv': iv.hex(),
                'epsilon_used': epsilon,
                'timestamp': datetime.utcnow().isoformat(),
                'algorithm': 'AES-256-CBC-DP',
                'patient_id': patient_id
            }
            
            # Log operation
            self._log_operation('encrypt', patient_id, epsilon, 'success')
            
            # Update privacy budget
            self._update_privacy_budget(patient_id or 'unknown', epsilon)
            
            return encrypted_package
            
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            self._log_operation('encrypt', patient_id, epsilon, 'failed', str(e))
            raise
    
    def decrypt_patient_data(self, encrypted_package: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt patient data
        
        Args:
            encrypted_package: Encrypted data package
            
        Returns:
            Decrypted patient data
        """
        try:
            # Extract components
            encrypted_data = bytes.fromhex(encrypted_package['encrypted_data'])
            salt = bytes.fromhex(encrypted_package['salt'])
            iv = bytes.fromhex(encrypted_package['iv'])
            patient_id = encrypted_package.get('patient_id')
            
            # Derive decryption key
            key = self._derive_key(salt)
            
            # Create cipher
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            # Decrypt data
            padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
            
            # Remove padding
            padding_length = padded_data[-1]
            json_data = padded_data[:-padding_length]
            
            # Parse JSON
            decrypted_data = json.loads(json_data.decode('utf-8'))
            
            # Log operation
            self._log_operation('decrypt', patient_id, 0, 'success')
            
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            self._log_operation('decrypt', patient_id, 0, 'failed', str(e))
            raise
    
    def encrypt_query_result(self, result: Any, epsilon: float = 1.0) -> Dict[str, Any]:
        """
        Encrypt query results with differential privacy
        
        Args:
            result: Query result to encrypt
            epsilon: Privacy parameter
            
        Returns:
            Encrypted result package
        """
        try:
            # Add DP noise to numerical results
            if isinstance(result, (int, float)):
                laplace_mech = Laplace(epsilon=epsilon, sensitivity=1.0)
                noisy_result = laplace_mech.randomise(float(result))
            else:
                noisy_result = result
            
            # Generate encryption components
            salt = os.urandom(16)
            key = self._derive_key(salt)
            iv = os.urandom(16)
            
            # Encrypt result
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            
            json_data = json.dumps(noisy_result).encode('utf-8')
            padding_length = 16 - (len(json_data) % 16)
            padded_data = json_data + bytes([padding_length] * padding_length)
            
            encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
            
            encrypted_package = {
                'encrypted_result': encrypted_data.hex(),
                'salt': salt.hex(),
                'iv': iv.hex(),
                'epsilon_used': epsilon,
                'timestamp': datetime.utcnow().isoformat(),
                'result_type': type(result).__name__
            }
            
            # Log operation
            self._log_operation('query_encrypt', 'system', epsilon, 'success')
            
            return encrypted_package
            
        except Exception as e:
            logger.error(f"Query encryption failed: {str(e)}")
            self._log_operation('query_encrypt', 'system', epsilon, 'failed', str(e))
            raise
    
    def decrypt_query_result(self, encrypted_package: Dict[str, Any]) -> Any:
        """
        Decrypt query results
        
        Args:
            encrypted_package: Encrypted result package
            
        Returns:
            Decrypted result
        """
        try:
            encrypted_data = bytes.fromhex(encrypted_package['encrypted_result'])
            salt = bytes.fromhex(encrypted_package['salt'])
            iv = bytes.fromhex(encrypted_package['iv'])
            
            key = self._derive_key(salt)
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
            padding_length = padded_data[-1]
            json_data = padded_data[:-padding_length]
            
            result = json.loads(json_data.decode('utf-8'))
            
            # Log operation
            self._log_operation('query_decrypt', 'system', 0, 'success')
            
            return result
            
        except Exception as e:
            logger.error(f"Query decryption failed: {str(e)}")
            self._log_operation('query_decrypt', 'system', 0, 'failed', str(e))
            raise
    
    def _update_privacy_budget(self, entity_id: str, epsilon: float):
        """Update privacy budget tracking"""
        if entity_id not in self.privacy_budget:
            self.privacy_budget[entity_id] = 0
        self.privacy_budget[entity_id] += epsilon
    
    def get_privacy_budget(self, entity_id: str) -> float:
        """Get current privacy budget consumption"""
        return self.privacy_budget.get(entity_id, 0)
    
    def _log_operation(self, operation: str, entity_id: str, epsilon: float, 
                      status: str, error: str = None):
        """Log cryptographic operations"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'operation': operation,
            'entity_id': entity_id,
            'epsilon_used': epsilon,
            'status': status,
            'error': error
        }
        self.operation_logs.append(log_entry)
        logger.info(f"Crypto operation: {operation} - {status}")
    
    def get_operation_logs(self) -> list:
        """Get all operation logs"""
        return self.operation_logs
    
    def generate_data_hash(self, data: Dict[str, Any]) -> str:
        """Generate hash for data integrity verification"""
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()
    
    def verify_data_integrity(self, data: Dict[str, Any], expected_hash: str) -> bool:
        """Verify data integrity using hash"""
        actual_hash = self.generate_data_hash(data)
        return actual_hash == expected_hash

# Global crypto engine instance
crypto_engine = DPCryptoEngine() 