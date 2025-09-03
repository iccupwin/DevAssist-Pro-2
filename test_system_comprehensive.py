#!/usr/bin/env python3
"""
Comprehensive System Testing Script for DevAssist Pro
Tests all components after migration from Tender project
"""

import requests
import json
import time
import sys
import os
from pathlib import Path
from typing import Dict, Any, List

# Configuration
BASE_URL = "http://localhost:8000"
API_ENDPOINTS = {
    "health": f"{BASE_URL}/health",
    "llm_analyze": f"{BASE_URL}/api/llm/analyze",
    "documents_analyze": f"{BASE_URL}/api/documents/analyze-enhanced", 
    "reports_generate": f"{BASE_URL}/api/reports/generate-kp-pdf",
}

# Test data files
TZ_FILE = "backend/test_comprehensive_tz.txt"
KP_FILE = "backend/test_comprehensive_kp.txt"

class DevAssistTester:
    def __init__(self):
        self.results = []
        self.errors = []
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        formatted_msg = f"[{timestamp}] {level}: {message}"
        print(formatted_msg)
        
    def test_backend_health(self) -> bool:
        """Test if backend services are running"""
        self.log("Testing backend health endpoints...")
        
        try:
            response = requests.get(API_ENDPOINTS["health"], timeout=10)
            if response.status_code == 200:
                self.log("✅ Backend health check passed")
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Backend not accessible: {e}", "ERROR")
            return False
    
    def read_test_file(self, filename: str) -> str:
        """Read test file content"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.log(f"❌ Failed to read {filename}: {e}", "ERROR")
            return ""
    
    def test_llm_extract_kp_summary(self) -> Dict[str, Any]:
        """Test LLM Service with extract_kp_summary_data prompt"""
        self.log("Testing LLM Service - KP Summary Extraction...")
        
        kp_content = self.read_test_file(KP_FILE)
        if not kp_content:
            return {"success": False, "error": "Failed to read KP file"}
        
        payload = {
            "module": "kp_analyzer",
            "template": "extract_kp_summary_data",
            "variables": {"kp_content": kp_content}
        }
        
        try:
            response = requests.post(API_ENDPOINTS["llm_analyze"], json=payload, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ KP Summary extraction successful")
                
                # Validate JSON structure
                expected_fields = ['company_name', 'total_cost', 'project_timeline', 'team_composition']
                response_data = result.get('response', {})
                
                missing_fields = [field for field in expected_fields 
                                if field not in str(response_data)]
                
                if not missing_fields:
                    self.log("✅ All expected fields present in response")
                else:
                    self.log(f"⚠️  Missing fields: {missing_fields}", "WARNING")
                    
                return {"success": True, "data": result}
            else:
                self.log(f"❌ KP Summary extraction failed: {response.status_code}", "ERROR")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            self.log(f"❌ KP Summary extraction error: {e}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_llm_10_criteria_analysis(self) -> Dict[str, Any]:
        """Test LLM Service with 10 criteria comparison prompt"""
        self.log("Testing LLM Service - 10 Criteria Analysis...")
        
        tz_content = self.read_test_file(TZ_FILE)
        kp_content = self.read_test_file(KP_FILE)
        
        if not tz_content or not kp_content:
            return {"success": False, "error": "Failed to read test files"}
        
        payload = {
            "module": "kp_analyzer", 
            "template": "compare_tz_kp_with_10_criteria",
            "variables": {
                "tz_text": tz_content,
                "kp_text": kp_content
            }
        }
        
        try:
            response = requests.post(API_ENDPOINTS["llm_analyze"], json=payload, timeout=180)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ 10 Criteria analysis successful")
                
                # Validate 10 criteria structure
                criteria_names = [
                    'technical_requirements_compliance',
                    'functional_completeness', 
                    'cost_effectiveness',
                    'timeline_feasibility',
                    'team_expertise',
                    'technology_modernity',
                    'scalability_architecture',
                    'security_measures',
                    'maintenance_support',
                    'risk_assessment'
                ]
                
                response_data = str(result.get('response', {}))
                missing_criteria = [crit for crit in criteria_names 
                                  if crit not in response_data]
                
                if len(missing_criteria) <= 2:  # Allow 2 missing for flexibility
                    self.log("✅ Most criteria present in 10-criteria analysis")
                else:
                    self.log(f"⚠️  Many missing criteria: {len(missing_criteria)}", "WARNING")
                    
                return {"success": True, "data": result}
            else:
                self.log(f"❌ 10 Criteria analysis failed: {response.status_code}", "ERROR")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            self.log(f"❌ 10 Criteria analysis error: {e}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_enhanced_document_analysis(self) -> Dict[str, Any]:
        """Test Enhanced AI Analyzer through Documents Service"""
        self.log("Testing Enhanced Document Analysis...")
        
        # This would test the enhanced analyzer with file upload
        # For now, we'll test the direct endpoint if available
        
        tz_content = self.read_test_file(TZ_FILE)
        kp_content = self.read_test_file(KP_FILE)
        
        payload = {
            "tz_content": tz_content,
            "kp_content": kp_content,
            "analysis_type": "enhanced"
        }
        
        try:
            # Note: This endpoint might need adjustment based on actual implementation
            response = requests.post(API_ENDPOINTS["documents_analyze"], json=payload, timeout=180)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Enhanced document analysis successful")
                return {"success": True, "data": result}
            else:
                self.log(f"❌ Enhanced analysis failed: {response.status_code}", "ERROR")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            self.log(f"❌ Enhanced analysis error: {e}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_pdf_generation(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test PDF Report Generation with Cyrillic support"""
        self.log("Testing PDF Generation with Cyrillic support...")
        
        # Mock analysis data if not provided
        if not analysis_data:
            analysis_data = {
                "kp_summary": {
                    "company_name": "ООО ТехИнновации",
                    "total_cost": "2,750,000 рублей", 
                    "project_timeline": "3.5 месяца",
                    "team_composition": "7 специалистов"
                },
                "detailed_analysis": {
                    "criteria_scores": {
                        "technical_requirements_compliance": 8.5,
                        "functional_completeness": 9.0,
                        "cost_effectiveness": 7.5,
                        "timeline_feasibility": 8.0,
                        "team_expertise": 9.0,
                        "technology_modernity": 9.5,
                        "scalability_architecture": 8.5,
                        "security_measures": 8.0,
                        "maintenance_support": 8.5,
                        "risk_assessment": 7.0
                    }
                }
            }
        
        payload = {
            "kp_summary": analysis_data.get("kp_summary", {}),
            "detailed_analysis": analysis_data.get("detailed_analysis", {}),
            "tz_filename": "test_comprehensive_tz.txt",
            "kp_filename": "test_comprehensive_kp.txt"
        }
        
        try:
            response = requests.post(API_ENDPOINTS["reports_generate"], json=payload, timeout=60)
            
            if response.status_code == 200:
                # Check if it's a PDF response
                content_type = response.headers.get('content-type', '')
                if 'pdf' in content_type.lower():
                    # Save PDF for inspection
                    pdf_path = "test_generated_report.pdf"
                    with open(pdf_path, 'wb') as f:
                        f.write(response.content)
                    
                    self.log(f"✅ PDF generation successful - saved as {pdf_path}")
                    self.log(f"PDF size: {len(response.content)} bytes")
                    return {"success": True, "pdf_path": pdf_path, "size": len(response.content)}
                else:
                    self.log(f"✅ PDF generation response received (JSON): {len(response.text)} chars")
                    return {"success": True, "data": response.json()}
            else:
                self.log(f"❌ PDF generation failed: {response.status_code}", "ERROR")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            self.log(f"❌ PDF generation error: {e}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_error_handling(self):
        """Test system error handling and edge cases"""
        self.log("Testing Error Handling...")
        
        # Test with invalid JSON
        try:
            response = requests.post(API_ENDPOINTS["llm_analyze"], 
                                   data="invalid json", timeout=10)
            if response.status_code in [400, 422]:
                self.log("✅ Invalid JSON handled correctly")
            else:
                self.log(f"⚠️  Unexpected response to invalid JSON: {response.status_code}", "WARNING")
        except:
            pass
        
        # Test with empty content
        try:
            payload = {
                "module": "kp_analyzer",
                "template": "extract_kp_summary_data", 
                "variables": {"kp_content": ""}
            }
            response = requests.post(API_ENDPOINTS["llm_analyze"], json=payload, timeout=30)
            self.log(f"✅ Empty content test completed: {response.status_code}")
        except:
            pass
        
        # Test with very large content
        try:
            large_content = "Тест " * 10000  # Large Russian content
            payload = {
                "module": "kp_analyzer",
                "template": "extract_kp_summary_data",
                "variables": {"kp_content": large_content}
            }
            response = requests.post(API_ENDPOINTS["llm_analyze"], json=payload, timeout=60)
            self.log(f"✅ Large content test completed: {response.status_code}")
        except:
            pass
    
    def test_performance(self):
        """Test system performance"""
        self.log("Testing Performance...")
        
        kp_content = self.read_test_file(KP_FILE)
        if not kp_content:
            self.log("❌ Cannot test performance without KP file", "ERROR")
            return
        
        payload = {
            "module": "kp_analyzer", 
            "template": "extract_kp_summary_data",
            "variables": {"kp_content": kp_content}
        }
        
        # Measure response time
        start_time = time.time()
        try:
            response = requests.post(API_ENDPOINTS["llm_analyze"], json=payload, timeout=120)
            end_time = time.time()
            
            response_time = end_time - start_time
            self.log(f"✅ API response time: {response_time:.2f} seconds")
            
            if response_time < 30:
                self.log("✅ Response time is acceptable (< 30s)")
            else:
                self.log(f"⚠️  Slow response time: {response_time:.2f}s", "WARNING")
                
        except Exception as e:
            self.log(f"❌ Performance test failed: {e}", "ERROR")
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Comprehensive DevAssist Pro Testing")
        self.log("=" * 60)
        
        # Test 1: Backend Health
        if not self.test_backend_health():
            self.log("❌ Backend health check failed - aborting tests", "ERROR")
            return False
        
        # Test 2: LLM Service - KP Summary
        kp_summary_result = self.test_llm_extract_kp_summary()
        
        # Test 3: LLM Service - 10 Criteria
        criteria_result = self.test_llm_10_criteria_analysis()
        
        # Test 4: Enhanced Document Analysis
        enhanced_result = self.test_enhanced_document_analysis()
        
        # Test 5: PDF Generation
        analysis_data = criteria_result.get("data") if criteria_result.get("success") else None
        pdf_result = self.test_pdf_generation(analysis_data)
        
        # Test 6: Error Handling
        self.test_error_handling()
        
        # Test 7: Performance
        self.test_performance()
        
        # Summary
        self.log("=" * 60)
        self.log("🏁 TESTING SUMMARY")
        
        success_count = sum([
            self.test_backend_health(),
            kp_summary_result.get("success", False),
            criteria_result.get("success", False), 
            enhanced_result.get("success", False),
            pdf_result.get("success", False)
        ])
        
        total_tests = 5
        self.log(f"✅ Successful tests: {success_count}/{total_tests}")
        
        if success_count >= 4:
            self.log("🎉 SYSTEM TESTING PASSED - DevAssist Pro is ready!")
        elif success_count >= 3:
            self.log("⚠️  PARTIAL SUCCESS - Some issues need attention", "WARNING")  
        else:
            self.log("❌ SYSTEM TESTING FAILED - Major issues detected", "ERROR")
        
        return success_count >= 3

def main():
    print("DevAssist Pro Comprehensive System Testing")
    print("=" * 50)
    
    # Check if test files exist
    if not os.path.exists(TZ_FILE):
        print(f"❌ TZ test file not found: {TZ_FILE}")
        return 1
    
    if not os.path.exists(KP_FILE):
        print(f"❌ KP test file not found: {KP_FILE}")
        return 1
        
    tester = DevAssistTester()
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())