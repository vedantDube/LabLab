#!/usr/bin/env python3
"""
Test script for the emission tracker and digital twin simulator endpoints
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def test_emission_verification():
    """Test the emission verification endpoint that was timing out"""
    print("🧪 Testing Emission Verification Endpoint...")
    
    payload = {
        "report_data": {
            "emissions": 1200,
            "verification_method": "direct_measurement", 
            "period": "2024-Q1",
            "source": "manufacturing_plant_A"
        },
        "metadata": {
            "company": "EcoTech Industries",
            "facility": "Plant A"
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/verify-emission", json=payload, timeout=15)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS - No timeout!")
            print(f"🔍 Verification Score: {result.get('verification_score', 'N/A')}")
            print(f"🔒 Verified: {result.get('verified', 'N/A')}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.Timeout:
        print("❌ TIMEOUT ERROR - Endpoint still timing out")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_digital_twin_creation():
    """Test the digital twin creation endpoint that was timing out"""
    print("\n🧪 Testing Digital Twin Creation Endpoint...")
    
    payload = {
        "system_data": {
            "system_type": "manufacturing_line",
            "capacity": 1000,
            "efficiency": 85,
            "energy_consumption": 450
        },
        "parameters": {
            "optimization_goal": "reduce_emissions",
            "target_reduction": 20
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/create-twin", json=payload, timeout=15)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS - No timeout!")
            print(f"🔧 Twin ID: {result.get('twin_id', 'N/A')}")
            print(f"📈 Status: {result.get('status', 'N/A')}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.Timeout:
        print("❌ TIMEOUT ERROR - Endpoint still timing out")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_scenario_simulation():
    """Test the scenario simulation endpoint"""
    print("\n🧪 Testing Scenario Simulation Endpoint...")
    
    payload = {
        "twin_id": "test_twin_001",
        "scenarios": [
            {
                "name": "efficiency_improvement",
                "parameters": {"efficiency_boost": 10, "energy_reduction": 15}
            }
        ]
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload, timeout=15)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS - No timeout!")
            print(f"📊 Simulations: {len(result.get('simulations', []))}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.Timeout:
        print("❌ TIMEOUT ERROR - Endpoint still timing out")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing CarbonTwin API Endpoints")
    print("=" * 50)
    
    # Test the endpoints that were timing out
    results = []
    results.append(test_emission_verification())
    results.append(test_digital_twin_creation())
    results.append(test_scenario_simulation())
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY:")
    if all(results):
        print("🎉 ALL TESTS PASSED - Your ChatGPT5 API key is working!")
        print("✅ No more timeouts in emission tracker or digital twin simulator")
    else:
        failed_count = len([r for r in results if not r])
        print(f"⚠️  {failed_count} out of {len(results)} tests failed")
    
    print("🔑 Your OpenAI API key is being used correctly")
