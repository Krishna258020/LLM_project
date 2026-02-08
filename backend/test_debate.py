#!/usr/bin/env python3
"""
Test script for Multi-Agent Debate System
Run this after ensuring Ollama is running with required models
"""

import requests
import json
import sys

# Configuration
API_BASE = "http://localhost:8001/api"

def test_health():
    """Test health endpoint"""
    print("🔍 Checking Ollama health...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        data = response.json()
        
        print(f"   Ollama Status: {data.get('ollama_status', 'unknown')}")
        
        if data.get('ollama_status') == 'running':
            models = data.get('models_available', {})
            print(f"   Models Available:")
            for model, available in models.items():
                status = "✅" if available else "❌"
                print(f"      {status} {model}")
        else:
            print(f"   ❌ Error: {data.get('error', 'Unknown')}")
            return False
        
        return True
    except Exception as e:
        print(f"   ❌ Failed to connect: {e}")
        return False

def test_debate(prompt):
    """Test debate endpoint"""
    print(f"\n💬 Running debate for: '{prompt}'")
    print("=" * 70)
    
    try:
        response = requests.post(
            f"{API_BASE}/debate",
            json={"prompt": prompt},
            timeout=180
        )
        
        if response.status_code != 200:
            print(f"❌ Error {response.status_code}: {response.text}")
            return
        
        data = response.json()
        
        print("\n📊 Debate Steps:")
        for i, step in enumerate(data.get('steps', []), 1):
            agent = step.get('agent', 'Unknown')
            model = step.get('model', 'Unknown')
            output = step.get('output', '')
            
            print(f"\n   Step {i}: {agent} ({model})")
            print(f"   {'─' * 65}")
            print(f"   {output[:200]}{'...' if len(output) > 200 else ''}")
        
        print("\n" + "=" * 70)
        print("✅ FINAL RESULT:")
        print("=" * 70)
        print(data.get('result', 'No result'))
        print("=" * 70)
        
    except requests.exceptions.Timeout:
        print("❌ Request timed out (>180s). Check Ollama performance.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_get_debates():
    """Test get all debates"""
    print("\n📚 Fetching debate history...")
    try:
        response = requests.get(f"{API_BASE}/debates", timeout=10)
        debates = response.json()
        print(f"   Found {len(debates)} debates in history")
        
        if debates:
            latest = debates[-1]
            print(f"   Latest: '{latest.get('prompt', '')[:50]}...'")
    except Exception as e:
        print(f"   ❌ Failed: {e}")

def main():
    print("\n" + "=" * 70)
    print("🤖 Multi-Agent LLM Debate System - Test Suite")
    print("=" * 70)
    
    # Test health
    if not test_health():
        print("\n⚠️  Warning: Ollama is not running or models are missing")
        print("   Make sure to:")
        print("   1. Start Ollama: ollama serve")
        print("   2. Pull models: ollama pull mistral phi3 llama3.1")
        sys.exit(1)
    
    # Test debate with sample questions
    test_questions = [
        "What is the capital of France?",
        "Explain quantum computing in simple terms",
        "What are the benefits of renewable energy?"
    ]
    
    # Use first question or command line argument
    prompt = sys.argv[1] if len(sys.argv) > 1 else test_questions[0]
    test_debate(prompt)
    
    # Test history
    test_get_debates()
    
    print("\n✅ All tests completed!\n")

if __name__ == "__main__":
    main()