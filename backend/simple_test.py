#!/usr/bin/env python3
"""
Simple test for basic AES encryption/decryption
"""

import hashlib
import json
import secrets
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def test_simple_aes():
    # Test data
    patient_data = {
        'patient_id': 'TEST_SIMPLE',
        'name': 'Simple Patient',
        'age': 30,
        'medical_history': ['test'],
        'current_medications': ['test'],
        'test_results': {'test': 'test'}
    }
    
    print("Original patient data:")
    print(patient_data)
    
    # Step 1: Serialize
    serialized_data = json.dumps(patient_data, sort_keys=True).encode('utf-8')
    print(f"\nStep 1: Serialized data length: {len(serialized_data)}")
    print(f"Step 1: Serialized data: {serialized_data}")
    
    # Step 2: AES encryption
    master_key = hashlib.sha256(b"TDP-QIMLE-MASTER-KEY-2025").digest()
    iv = secrets.token_bytes(16)
    cipher = Cipher(algorithms.AES(master_key[:32]), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    
    # Pad data for AES
    padding_length = 16 - (len(serialized_data) % 16)
    padded_data = serialized_data + bytes([padding_length] * padding_length)
    
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    print(f"\nStep 2: AES encrypted data length: {len(encrypted_data)}")
    
    # Step 3: AES decryption
    decryptor = cipher.decryptor()
    decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()
    
    # Remove padding
    padding_length = decrypted_padded[-1]
    decrypted_data = decrypted_padded[:-padding_length]
    
    print(f"\nStep 3: AES decrypted data length: {len(decrypted_data)}")
    print(f"Step 3: AES decrypted data: {decrypted_data}")
    
    # Step 4: Deserialize
    try:
        recovered_data = json.loads(decrypted_data.decode('utf-8'))
        print(f"\nStep 4: Deserialized successfully!")
        print(f"Step 4: Recovered data: {recovered_data}")
        
        if recovered_data == patient_data:
            print("\n✅ SUCCESS: Simple AES encryption/decryption works!")
        else:
            print("\n❌ FAILURE: Data doesn't match!")
            
    except Exception as e:
        print(f"\n❌ ERROR in deserialization: {str(e)}")

if __name__ == "__main__":
    test_simple_aes() 