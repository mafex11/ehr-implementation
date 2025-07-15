#!/usr/bin/env python3
"""
Test script to verify TDP-QIMLE encryption is working properly
"""

import asyncio
import json
from algorithm import TDPQIMLEAlgorithm, SensitivityLevel, TemporalPrivacyParams
from mongodb_integration import TDPQIMLEMongoStorage
import secrets

async def test_encryption():
    """Test that patient data is properly encrypted before MongoDB storage"""
    print("🔐 Testing TDP-QIMLE Encryption System")
    print("=" * 50)
    
    # Initialize storage (use a test database)
    storage = TDPQIMLEMongoStorage("mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/", "test_secure_ehr")
    
    try:
        await storage.initialize_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Make sure MongoDB is running on localhost:27017")
        return
    
    # Test patient data
    patient_data = {
        'patient_id': 'TEST_P001',
        'name': 'John Doe',
        'age': 45,
        'medical_history': ['diabetes', 'hypertension'],
        'current_medications': ['metformin', 'lisinopril'],
        'test_results': {
            'blood_pressure': '140/90',
            'glucose': '180 mg/dL',
            'cholesterol': '220 mg/dL'
        },
        'notes': 'Patient shows good response to current treatment plan'
    }
    
    print(f"\n📝 Original Patient Data:")
    print(json.dumps(patient_data, indent=2))
    
    # Store encrypted data
    try:
        document_id = await storage.store_patient_data(patient_data, SensitivityLevel.HIGH)
        print(f"\n✅ Patient data stored with ID: {document_id}")
    except Exception as e:
        print(f"❌ Failed to store patient data: {e}")
        return
    
    # Retrieve the raw MongoDB document to show it's encrypted
    try:
        raw_document = await storage.patients_collection.find_one({"patient_id": "TEST_P001"})
        
        print(f"\n🔒 Raw MongoDB Document (Encrypted):")
        print(f"Patient ID: {raw_document['patient_id']}")
        print(f"Algorithm: {raw_document['encryption_metadata']['algorithm']}")
        print(f"Sensitivity Level: {raw_document['encryption_metadata']['sensitivity_level']}")
        print(f"Encrypted Data (first 100 chars): {raw_document['encrypted_data'][:100]}...")
        print(f"Quantum Layers: {len(raw_document['encryption_metadata']['quantum_layers'])}")
        print(f"Lattice Obfuscation: {raw_document['encryption_metadata']['lattice_point']['coordinates'][:3]}...")
        print(f"Integrity Block: {raw_document['encryption_metadata']['integrity_block']['index']}")
        
        # Verify the data is actually encrypted (not plaintext)
        encrypted_data = raw_document['encrypted_data']
        original_name = patient_data['name']
        
        if original_name not in encrypted_data:
            print("✅ VERIFICATION: Patient name is NOT visible in encrypted data")
        else:
            print("❌ VERIFICATION: Patient name is visible in encrypted data (encryption failed)")
        
        if 'diabetes' not in encrypted_data:
            print("✅ VERIFICATION: Medical history is NOT visible in encrypted data")
        else:
            print("❌ VERIFICATION: Medical history is visible in encrypted data (encryption failed)")
            
    except Exception as e:
        print(f"❌ Failed to retrieve raw document: {e}")
        return
    
    # Retrieve and decrypt the data
    try:
        decrypted_data = await storage.retrieve_patient_data("TEST_P001")
        print(f"\n🔓 Decrypted Patient Data:")
        print(json.dumps(decrypted_data, indent=2))
        
        # Verify decryption worked correctly
        if decrypted_data == patient_data:
            print("✅ VERIFICATION: Decrypted data matches original data perfectly")
        else:
            print("❌ VERIFICATION: Decrypted data does not match original data")
            
    except Exception as e:
        print(f"❌ Failed to decrypt patient data: {e}")
        return
    
    # Test integrity verification
    try:
        integrity_valid = storage.algorithm.verify_integrity(raw_document)
        if integrity_valid:
            print("✅ VERIFICATION: Data integrity check passed")
        else:
            print("❌ VERIFICATION: Data integrity check failed")
    except Exception as e:
        print(f"❌ Integrity verification failed: {e}")
    
    # Cleanup test data
    try:
        await storage.delete_patient_data("TEST_P001")
        print("\n🧹 Test data cleaned up")
    except Exception as e:
        print(f"❌ Failed to cleanup test data: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 TDP-QIMLE Encryption Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_encryption()) 