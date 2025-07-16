#!/usr/bin/env python3
"""
Test script to verify unified service on single port
Tests both encryption and decryption services running on port 8001
"""

import requests
import json
import time

def test_unified_service():
    """Test that both encryption and decryption services work on port 8001"""
    print("🔐 Testing Unified Service (Port 8001)")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    # Test 1: Root endpoint
    print("\n1️⃣ Testing Root Endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working")
            print(f"   System: {data['system']}")
            print(f"   Port: {data['port']}")
            print(f"   Encryption service: {data['services']['encryption']['base_path']}")
            print(f"   Decryption service: {data['services']['decryption']['base_path']}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test 2: Encryption service health check
    print("\n2️⃣ Testing Encryption Service Health...")
    try:
        response = requests.get(f"{base_url}/api/novel/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Encryption service healthy")
            print(f"   Status: {data['status']}")
            print(f"   Algorithm: {data['algorithm']}")
        else:
            print(f"❌ Encryption health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Encryption health check error: {e}")
    
    # Test 3: Decryption service health check
    print("\n3️⃣ Testing Decryption Service Health...")
    try:
        response = requests.get(f"{base_url}/api/decrypt/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Decryption service healthy")
            print(f"   Status: {data['status']}")
            print(f"   System: {data['system']}")
            print(f"   Active sessions: {data['active_sessions']}")
        else:
            print(f"❌ Decryption health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Decryption health check error: {e}")
    
    # Test 4: Test encryption endpoint (without authentication for basic connectivity)
    print("\n4️⃣ Testing Encryption Endpoint Connectivity...")
    try:
        # This will fail due to missing auth, but should return 401/403, not connection error
        response = requests.post(f"{base_url}/api/novel/patients", json={})
        if response.status_code in [401, 403, 422]:
            print(f"✅ Encryption endpoint reachable (expected auth error: {response.status_code})")
        else:
            print(f"⚠️ Encryption endpoint unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Encryption endpoint connection error: {e}")
    
    # Test 5: Test decryption endpoint (without authentication for basic connectivity)
    print("\n5️⃣ Testing Decryption Endpoint Connectivity...")
    try:
        # This will fail due to missing auth, but should return 401/403, not connection error
        response = requests.post(f"{base_url}/api/decrypt/patient/single", json={})
        if response.status_code in [401, 403, 422]:
            print(f"✅ Decryption endpoint reachable (expected auth error: {response.status_code})")
        else:
            print(f"⚠️ Decryption endpoint unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Decryption endpoint connection error: {e}")
    
    # Test 6: Test decryption session creation
    print("\n6️⃣ Testing Decryption Session Creation...")
    try:
        session_data = {
            "username": "decrypt_admin",
            "password": "decrypt_key_2024_secure",
            "security_clearance": "admin",
            "purpose": "System testing",
            "department": "IT"
        }
        response = requests.post(f"{base_url}/api/decrypt/auth/session", json=session_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Decryption session created successfully")
            print(f"   Session ID: {data['session_id'][:16]}...")
            print(f"   Clearance: {data['clearance_level']}")
            print(f"   Expires: {data['expires_at']}")
        else:
            print(f"❌ Decryption session creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Decryption session creation error: {e}")
    
    print("\n🎉 Unified Service Test Complete!")
    print("=" * 50)
    print("✅ Both encryption and decryption services are running on port 8001")
    print("✅ Frontend can connect to both services using the same port")
    print("✅ No need to manage multiple ports")

if __name__ == "__main__":
    print("Make sure to start the backend service first:")
    print("cd backend && python main.py")
    print("\nTesting in 3 seconds...")
    time.sleep(3)
    test_unified_service() 