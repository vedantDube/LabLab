import requests
import json
import sys

def test_endpoint():
    url = "http://127.0.0.1:5000/api/verify-emission"
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
        print("Testing emission verification endpoint...")
        response = requests.post(url, json=payload, timeout=15)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except requests.Timeout:
        print("TIMEOUT ERROR")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_endpoint()
