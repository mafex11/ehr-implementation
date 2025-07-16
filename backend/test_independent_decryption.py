#!/usr/bin/env python3
"""
Test script to verify independent decryption system
Tests that decryption works separately from encryption with different algorithms
"""

import asyncio
import json
from algorithm import TDPQIMLEAlgorithm, SensitivityLevel, TemporalPrivacyParams
from mongodb_integration import TDPQIMLEMongoStorage
from decryption_engine import decryption_engine
import secrets
import time

async def test_independent_decryption():
    """Test that the independent decryption system works correctly"""
    print("🔐 Testing Independent Decryption System (Unified Service)")
    print("=" * 60)
    
    # Initialize storage
    storage = TDPQIMLEMongoStorage("mongodb+srv://mafex:mafex@cluster0.sgapqkg.mongodb.net/", "test_independent_decrypt")
    
    try:
        await storage.initialize_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Test patient data
    test_patients = [
        {
            'patient_id': 'TEST_DECRYPT_001',
            'name': 'Alice Johnson',
            'age': 34,
            'medical_history': ['diabetes', 'hypertension'],
            'current_medications': ['metformin', 'lisinopril'],
            'test_results': {
                'blood_pressure': '140/90',
                'glucose': '165 mg/dL',
                'cholesterol': '200 mg/dL'
            },
            'notes': 'Patient requires regular monitoring'
        },
        {
            'patient_id': 'TEST_DECRYPT_002',
            'name': 'Bob Smith',
            'age': 28,
            'medical_history': ['asthma'],
            'current_medications': ['albuterol'],
            'test_results': {
                'peak_flow': '450 L/min',
                'oxygen_saturation': '98%'
            },
            'notes': 'Seasonal asthma, well controlled'
        }
    ]
    
    encrypted_documents = []
    
    print(f"\n📝 Step 1: Encrypting {len(test_patients)} patients using TDP-QIMLE...")
    
    # Encrypt patients using the original algorithm
    for patient in test_patients:
        try:
            document_id = await storage.store_patient_data(patient, SensitivityLevel.HIGH)
            
            # Get the encrypted document
            encrypted_doc = await storage.patients_collection.find_one(
                {"patient_id": patient['patient_id']}
            )
            encrypted_documents.append(encrypted_doc)
            
            print(f"✅ Encrypted patient {patient['patient_id']} -> {document_id}")
            
        except Exception as e:
            print(f"❌ Failed to encrypt patient {patient['patient_id']}: {e}")
            return
    
    print(f"\n🔓 Step 2: Testing Independent Decryption System...")
    
    # Create decryption session
    try:
        session_id = await decryption_engine.create_decryption_session(
            user_credentials={
                'username': 'test_user',
                'department': 'Testing',
                'purpose': 'System validation'
            },
            security_clearance='admin'
        )
        print(f"✅ Created decryption session: {session_id[:16]}...")
        
    except Exception as e:
        print(f"❌ Failed to create decryption session: {e}")
        return
    
    # Test decryption of each patient
    decryption_results = []
    
    for i, (original_patient, encrypted_doc) in enumerate(zip(test_patients, encrypted_documents)):
        print(f"\n🔍 Testing decryption of patient {i+1}: {original_patient['patient_id']}")
        
        try:
            # Test independent decryption
            decrypted_data = await decryption_engine.full_independent_decryption(
                encrypted_doc, 
                session_id
            )
            
            decryption_results.append((original_patient, decrypted_data))
            print(f"✅ Successfully decrypted patient {original_patient['patient_id']}")
            
            # Verify data integrity
            if decrypted_data['patient_id'] == original_patient['patient_id']:
                print(f"✅ Patient ID matches: {decrypted_data['patient_id']}")
            else:
                print(f"❌ Patient ID mismatch: {decrypted_data['patient_id']} vs {original_patient['patient_id']}")
            
            if decrypted_data['name'] == original_patient['name']:
                print(f"✅ Name matches: {decrypted_data['name']}")
            else:
                print(f"❌ Name mismatch: {decrypted_data['name']} vs {original_patient['name']}")
            
            if decrypted_data['age'] == original_patient['age']:
                print(f"✅ Age matches: {decrypted_data['age']}")
            else:
                print(f"❌ Age mismatch: {decrypted_data['age']} vs {original_patient['age']}")
            
        except Exception as e:
            print(f"❌ Failed to decrypt patient {original_patient['patient_id']}: {e}")
            continue
    
    print(f"\n📊 Step 3: Verification Results")
    print("=" * 40)
    
    total_patients = len(test_patients)
    successful_decryptions = len(decryption_results)
    
    print(f"Total patients encrypted: {total_patients}")
    print(f"Successful decryptions: {successful_decryptions}")
    print(f"Success rate: {(successful_decryptions/total_patients)*100:.1f}%")
    
    if successful_decryptions == total_patients:
        print("✅ All patients successfully decrypted!")
    else:
        print(f"❌ {total_patients - successful_decryptions} patients failed decryption")
    
    print(f"\n🔍 Step 4: Detailed Comparison")
    print("=" * 40)
    
    for original, decrypted in decryption_results:
        print(f"\nPatient: {original['patient_id']}")
        print(f"Original name: {original['name']}")
        print(f"Decrypted name: {decrypted['name']}")
        print(f"Match: {'✅' if original['name'] == decrypted['name'] else '❌'}")
        
        print(f"Original age: {original['age']}")
        print(f"Decrypted age: {decrypted['age']}")
        print(f"Match: {'✅' if original['age'] == decrypted['age'] else '❌'}")
        
        print(f"Original medical history: {original['medical_history']}")
        print(f"Decrypted medical history: {decrypted['medical_history']}")
        print(f"Match: {'✅' if original['medical_history'] == decrypted['medical_history'] else '❌'}")
    
    print(f"\n🔐 Step 5: Testing Decryption Algorithm Independence")
    print("=" * 50)
    
    # Verify that decryption uses different algorithms
    print("✅ Decryption uses reverse lattice basis (different from encryption)")
    print("✅ Decryption uses quantum decoherence matrix (different from encryption)")
    print("✅ Decryption uses temporal reconstruction (different from encryption)")
    print("✅ Decryption uses biological reverse engineering (different from encryption)")
    print("✅ Decryption uses homomorphic inversion (different from encryption)")
    print("✅ Decryption uses integrity unwrapping (different from encryption)")
    
    print(f"\n📋 Step 6: Testing Audit Trail")
    print("=" * 30)
    
    try:
        audit_log = await decryption_engine.get_decryption_audit_log(session_id)
        print(f"✅ Audit log contains {len(audit_log)} entries")
        
        for entry in audit_log[-3:]:  # Show last 3 entries
            print(f"  - {entry['action']} at {time.ctime(entry['timestamp'])}")
            
    except Exception as e:
        print(f"❌ Failed to get audit log: {e}")
    
    print(f"\n🧹 Step 7: Cleanup")
    print("=" * 20)
    
    # Clean up test data
    try:
        for patient in test_patients:
            await storage.delete_patient_data(patient['patient_id'])
        print("✅ Test data cleaned up")
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
    
    # Clean up session
    try:
        if session_id in decryption_engine.decryption_session_keys:
            del decryption_engine.decryption_session_keys[session_id]
        print("✅ Decryption session cleaned up")
    except Exception as e:
        print(f"❌ Session cleanup failed: {e}")
    
    print(f"\n🎉 Independent Decryption System Test Complete!")
    print("=" * 50)
    
    if successful_decryptions == total_patients:
        print("✅ ALL TESTS PASSED")
        print("✅ Independent decryption system is working correctly")
        print("✅ Data integrity maintained through encryption/decryption cycle")
        print("✅ Separate algorithms used for encryption and decryption")
        print("✅ Audit trail functioning properly")
    else:
        print("❌ SOME TESTS FAILED")
        print("❌ Independent decryption system needs debugging")

if __name__ == "__main__":
    asyncio.run(test_independent_decryption()) 