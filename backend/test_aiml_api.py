#!/usr/bin/env python3
"""
Test script for AI/ML API (aimlapi.com) GPT-5 integration
"""

import os
from dotenv import load_dotenv

load_dotenv()

try:
    from openai import OpenAI
    
    # Test the AI/ML API configuration
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("CHATGPT5_API_KEY")
    
    if not api_key:
        print("❌ No API key found in environment variables")
        print("Set OPENAI_API_KEY or CHATGPT5_API_KEY")
        exit(1)
    
    print("🧪 Testing AI/ML API (aimlapi.com) GPT-5 Integration")
    print("=" * 60)
    print(f"🔑 API Key: {api_key[:10]}...")
    
    client = OpenAI(
        base_url="https://api.aimlapi.com/v1",
        api_key=api_key,
    )
    
    print("✅ Client initialized successfully")
    
    # Test a simple chat completion
    print("\n🧠 Testing chat completion...")
    
    response = client.chat.completions.create(
        model="openai/gpt-5-chat-latest",
        messages=[
            {
                "role": "system", 
                "content": "You are a helpful assistant that responds with JSON."
            },
            {
                "role": "user",
                "content": "Generate a simple test response in JSON format with keys: status, message, timestamp"
            }
        ],
        temperature=0.3,
        top_p=0.7,
        frequency_penalty=0.5,
        max_tokens=200,
        timeout=20,
    )
    
    message = response.choices[0].message.content
    print(f"✅ GPT-5 Response: {message}")
    
    # Test carbon verification (like your app does)
    print("\n🌱 Testing carbon verification prompt...")
    
    carbon_response = client.chat.completions.create(
        model="openai/gpt-5-chat-latest",
        messages=[
            {"role": "system", "content": "You are an expert carbon accounting auditor."},
            {"role": "user", "content": "Analyze this emission report and return a JSON object with verification_score (0-100), verified (boolean), and recommendations array: {\"emissions\": 1200, \"source\": \"manufacturing\", \"period\": \"2024-Q1\"}"},
        ],
        temperature=0.3,
        top_p=0.7,
        frequency_penalty=0.5,
        max_tokens=500,
        timeout=20,
    )
    
    carbon_message = carbon_response.choices[0].message.content
    print(f"✅ Carbon Verification: {carbon_message}")
    
    print("\n🎉 AI/ML API Integration Test PASSED!")
    print("Your GPT-5 API key is working correctly with the backend.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    print("\n💡 Make sure your API key is valid and you have credits.")
