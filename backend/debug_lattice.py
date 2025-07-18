#!/usr/bin/env python3
"""
Debug script specifically for lattice obfuscation issue
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from algorithm import TDPQIMLEAlgorithm, SensitivityLevel, TemporalPrivacyParams
import secrets
import json

def debug_lattice_issue():
    print("=== Lattice Obfuscation Debug ===")
    
    # Initialize algorithm
    master_key = secrets.token_bytes(32)
    temporal_params = TemporalPrivacyParams(
        epsilon=1.0,
        delta=1e-5,
        time_decay_factor=0.01,
        temporal_window=3600,
        sensitivity_multiplier=1.5
    )
    
    algorithm = TDPQIMLEAlgorithm(master_key, temporal_params)
    
    # Test patient data
    patient_data = {
        'patient_id': 'P123456',
        'name': 'John Doe',
        'age': 45,
        'medical_history': ['diabetes', 'hypertension'],
        'current_medications': ['metformin', 'lisinopril'],
        'test_results': {
            'blood_pressure': '140/90',
            'glucose': '180 mg/dL',
            'cholesterol': '220 mg/dL'
        }
    }
    
    # Step 1: Serialize
    serialized_data = json.dumps(patient_data, sort_keys=True).encode('utf-8')
    print(f"Step 1 - Serialized data length: {len(serialized_data)}")
    
    # Step 2: Apply quantum encryption
    encrypted_data = serialized_data
    for i, layer in enumerate(algorithm.quantum_states):
        encrypted_data = algorithm._quantum_superposition_encrypt(encrypted_data, layer)
        print(f"Step 2.{i+1} - After quantum layer {i} length: {len(encrypted_data)}")
    
    # Step 3: Apply lattice obfuscation
    print(f"\nStep 3 - Lattice obfuscation:")
    print(f"Input data length: {len(encrypted_data)}")
    print(f"Lattice dimension: {algorithm.lattice_dimension}")
    
    obfuscated_data, lattice_point = algorithm._lattice_obfuscation(encrypted_data, SensitivityLevel.HIGH)
    print(f"Obfuscated data length: {len(obfuscated_data)}")
    print(f"Stored original data length: {lattice_point.original_data_length}")
    print(f"Stored coordinates length: {len(lattice_point.coordinates)}")
    
    # Step 4: Test lattice reversal
    print(f"\nStep 4 - Lattice reversal:")
    recovered_data = algorithm._reverse_lattice_obfuscation(obfuscated_data, lattice_point)
    print(f"Recovered data length: {len(recovered_data)}")
    print(f"Expected data length: {len(encrypted_data)}")
    print(f"Data matches: {recovered_data == encrypted_data}")
    
    if recovered_data != encrypted_data:
        print(f"❌ ISSUE FOUND!")
        print(f"Expected first 50 bytes: {encrypted_data[:50].hex()}")
        print(f"Got first 50 bytes:      {recovered_data[:50].hex()}")
        print(f"Expected last 50 bytes:  {encrypted_data[-50:].hex()}")
        print(f"Got last 50 bytes:       {recovered_data[-50:].hex()}")
    else:
        print("✅ Lattice obfuscation working correctly!")

if __name__ == "__main__":
    debug_lattice_issue() 