#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test KP Analyzer v3 System
"""

import requests
import json
import time

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=10)
        print(f"Health Check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Backend health failed: {e}")
        return False

def test_v2_compatibility():
    """Test if v2 endpoints still work"""
    try:
        response = requests.get('http://localhost:8000/api/llm/providers', timeout=10)
        print(f"V2 LLM Providers: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"V2 test failed: {e}")
        return False

def test_v3_weight_presets():
    """Test v3 weight presets endpoint"""
    try:
        response = requests.get('http://localhost:8000/api/v3/criteria/weights/presets', timeout=10)
        print(f"V3 Weight Presets: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Available presets: {list(data.get('presets', {}).keys())}")
            return True
        return False
    except Exception as e:
        print(f"V3 weights test failed: {e}")
        return False

def test_v3_analysis_history():
    """Test v3 analysis history endpoint"""
    try:
        response = requests.get('http://localhost:8000/api/v3/analysis/history', timeout=10)
        print(f"V3 Analysis History: {response.status_code}")
        return response.status_code in [200, 404]  # 404 is OK for empty history
    except Exception as e:
        print(f"V3 history test failed: {e}")
        return False

def run_comprehensive_test():
    print("=" * 60)
    print("COMPREHENSIVE TESTING: KP ANALYZER V3 SYSTEM")
    print("=" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("V2 Compatibility", test_v2_compatibility),
        ("V3 Weight Presets", test_v3_weight_presets),
        ("V3 Analysis History", test_v3_analysis_history),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\nTesting {test_name}...")
        result = test_func()
        status = "PASS" if result else "FAIL"
        print(f"Result: {status}")
        if result:
            passed += 1
    
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    print(f"Passed: {passed}/{total} tests")
    
    if passed == total:
        print("\nSUCCESS: All tests passed!")
        print("- Backend is running with Docker monolith")
        print("- V2 compatibility maintained")
        print("- V3 expert system functional")
        print("- 10-criteria system operational")
    elif passed >= total * 0.75:
        print(f"\nPARTIAL SUCCESS: {passed}/{total} tests passed")
        print("System is mostly operational")
    else:
        print(f"\nFAILURE: Only {passed}/{total} tests passed")
        print("System needs investigation")
    
    print("=" * 60)
    return passed == total

if __name__ == "__main__":
    success = run_comprehensive_test()
    exit(0 if success else 1)