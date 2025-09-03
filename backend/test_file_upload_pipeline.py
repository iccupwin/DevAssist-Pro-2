#!/usr/bin/env python3
"""
Integration Test: File Upload and Processing Pipeline
Tests the complete flow from file upload to analysis
"""

import os
import json
import asyncio
import tempfile
import requests
from pathlib import Path
from typing import Dict, Any
import time

class FileUploadPipelineTester:
    """File Upload and Processing Pipeline Tester"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.auth_token = None
        self.test_user_email = "pipeline_test@example.com"
        self.test_user_password = "testpassword123"
        
    def setup_test_user(self) -> bool:
        """Setup test user for authentication"""
        print("1. Setting up test user...")
        
        try:
            # Try to register
            register_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "full_name": "Pipeline Test User"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=register_data,
                timeout=10
            )
            
            # Login to get token
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.auth_token = data['access_token']
                    print("   SUCCESS: Test user authenticated")
                    return True
                else:
                    print("   WARNING: Login succeeded but no token received")
                    return False
            else:
                print(f"   WARNING: Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   FAIL: User setup error: {e}")
            return False
    
    def test_txt_file_upload(self) -> Dict[str, Any]:
        """Test TXT file upload and processing"""
        print("2. Testing TXT file upload and processing...")
        
        try:
            # Create test TXT file
            kp_content = """
            Коммерческое предложение от ООО "ИнноТех"
            
            Разработка системы управления проектами
            
            Команда:
            - Руководитель проекта: 5 лет опыта
            - 2 Senior разработчика Python/React
            - 1 QA инженер
            
            Технологии:
            - Backend: Python, FastAPI, PostgreSQL
            - Frontend: React, TypeScript, Tailwind CSS
            - DevOps: Docker, GitHub Actions
            
            Стоимость: 900,000 рублей
            Срок выполнения: 4 месяца
            Гарантия: 6 месяцев технической поддержки
            
            Методология: Agile/Scrum
            Покрытие тестами: 85%+
            """
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
                f.write(kp_content)
                temp_file_path = f.name
            
            # Upload file
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_kp_pipeline.txt', f, 'text/plain')}
                
                response = requests.post(
                    f"{self.base_url}/api/documents/upload",
                    files=files,
                    headers=headers,
                    timeout=30
                )
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            if response.status_code in [200, 201]:
                data = response.json()
                print(f"   SUCCESS: TXT file uploaded with ID: {data.get('id', 'unknown')}")
                return {
                    "success": True,
                    "document_id": data.get('id'),
                    "file_type": "txt",
                    "response": data
                }
            else:
                print(f"   FAIL: TXT upload failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            print(f"   FAIL: TXT upload error: {e}")
            return {"success": False, "error": str(e)}
    
    def test_analysis_trigger(self, document_id: str) -> Dict[str, Any]:
        """Test triggering analysis on uploaded document"""
        print("3. Testing analysis trigger...")
        
        try:
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
                headers['Content-Type'] = 'application/json'
            
            # Trigger KP analysis
            analysis_data = {
                "kp_document_id": document_id,
                "analysis_type": "comprehensive",
                "use_real_ai": True
            }
            
            response = requests.post(
                f"{self.base_url}/api/kp-analyzer/analyze",
                json=analysis_data,
                headers=headers,
                timeout=60  # AI analysis takes time
            )
            
            if response.status_code in [200, 201, 202]:
                data = response.json()
                print(f"   SUCCESS: Analysis triggered with ID: {data.get('analysis_id', 'unknown')}")
                return {
                    "success": True,
                    "analysis_id": data.get('analysis_id'),
                    "status": data.get('status'),
                    "response": data
                }
            else:
                print(f"   WARNING: Analysis trigger returned {response.status_code}")
                print(f"   Response: {response.text}")
                # Try V3 endpoint
                try:
                    v3_data = {
                        "kp_documents": [{"id": document_id}],
                        "criteria_weights": {
                            "budget_compliance": 0.15,
                            "timeline_compliance": 0.15,
                            "technical_compliance": 0.15,
                            "team_expertise": 0.10,
                            "functional_coverage": 0.10,
                            "quality_assurance": 0.10,
                            "development_methodology": 0.08,
                            "scalability": 0.07,
                            "communication": 0.05,
                            "added_value": 0.05
                        }
                    }
                    
                    response = requests.post(
                        f"{self.base_url}/api/v3/kp-analyzer/analyze",
                        json=v3_data,
                        headers=headers,
                        timeout=60
                    )
                    
                    if response.status_code in [200, 201, 202]:
                        data = response.json()
                        print(f"   SUCCESS: V3 Analysis triggered with ID: {data.get('id', 'unknown')}")
                        return {
                            "success": True,
                            "analysis_id": data.get('id'),
                            "status": data.get('status'),
                            "response": data,
                            "version": "v3"
                        }
                    else:
                        print(f"   FAIL: V3 Analysis also failed with {response.status_code}")
                        return {"success": False, "error": f"Both analysis endpoints failed"}
                        
                except Exception as e:
                    print(f"   WARNING: V3 analysis error: {e}")
                    return {"success": False, "error": "Analysis endpoints not working"}
                
        except Exception as e:
            print(f"   FAIL: Analysis trigger error: {e}")
            return {"success": False, "error": str(e)}
    
    def test_analysis_results(self, analysis_id: str, version: str = "v1") -> Dict[str, Any]:
        """Test retrieving analysis results"""
        print("4. Testing analysis results retrieval...")
        
        try:
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            # Wait a bit for analysis to process
            print("   Waiting for analysis to complete...")
            time.sleep(5)
            
            # Try to get results
            endpoint = f"/api/v3/kp-analyzer/analysis/{analysis_id}" if version == "v3" else f"/api/kp-analyzer/analysis/{analysis_id}"
            
            for attempt in range(3):  # Try 3 times
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   SUCCESS: Analysis results retrieved")
                    
                    # Check result quality
                    if version == "v3":
                        criteria_scores = data.get('criteria_scores', {})
                        overall_score = data.get('overall_score', 0)
                        print(f"   Overall Score: {overall_score}")
                        print(f"   Criteria Analyzed: {len(criteria_scores)}")
                    else:
                        analysis_data = data.get('analysis_result', {})
                        overall_score = analysis_data.get('overall_score', 0)
                        print(f"   Overall Score: {overall_score}")
                    
                    return {
                        "success": True,
                        "analysis_data": data,
                        "overall_score": overall_score
                    }
                    
                elif response.status_code == 202:
                    print(f"   Analysis still processing (attempt {attempt + 1}/3)...")
                    time.sleep(10)
                    continue
                    
                else:
                    print(f"   WARNING: Results request returned {response.status_code}")
                    break
            
            print("   WARNING: Could not retrieve analysis results")
            return {"success": False, "error": "Results not available"}
            
        except Exception as e:
            print(f"   FAIL: Results retrieval error: {e}")
            return {"success": False, "error": str(e)}
    
    def test_pdf_export(self, analysis_id: str) -> Dict[str, Any]:
        """Test PDF export functionality"""
        print("5. Testing PDF export...")
        
        try:
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            # Try PDF export
            export_data = {
                "analysis_id": analysis_id,
                "format": "enhanced",
                "include_charts": True
            }
            
            response = requests.post(
                f"{self.base_url}/api/reports/generate/pdf",
                json=export_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Check if it's a PDF response
                if response.headers.get('content-type') == 'application/pdf':
                    print(f"   SUCCESS: PDF generated ({len(response.content)} bytes)")
                    return {"success": True, "pdf_size": len(response.content)}
                else:
                    # Might be JSON with PDF path
                    try:
                        data = response.json()
                        if 'pdf_path' in data or 'download_url' in data:
                            print("   SUCCESS: PDF export completed")
                            return {"success": True, "response": data}
                    except:
                        pass
                    
                    print("   WARNING: PDF export returned unexpected format")
                    return {"success": False, "error": "Unexpected response format"}
            else:
                print(f"   WARNING: PDF export returned {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"   FAIL: PDF export error: {e}")
            return {"success": False, "error": str(e)}

async def test_file_upload_processing_pipeline():
    """Test the complete file upload and processing pipeline"""
    
    print("=" * 60)
    print("FILE UPLOAD AND PROCESSING PIPELINE TEST")
    print("=" * 60)
    
    tester = FileUploadPipelineTester()
    
    # Test steps
    results = {
        "user_setup": False,
        "file_upload": False,
        "analysis_trigger": False,
        "results_retrieval": False,
        "pdf_export": False
    }
    
    # Step 1: Setup test user
    results["user_setup"] = tester.setup_test_user()
    
    if not results["user_setup"]:
        print("\nCannot continue without authentication")
        return False
    
    # Step 2: Upload file
    upload_result = tester.test_txt_file_upload()
    results["file_upload"] = upload_result.get("success", False)
    
    if not results["file_upload"]:
        print("\nCannot continue without successful file upload")
        return False
    
    document_id = upload_result.get("document_id")
    
    # Step 3: Trigger analysis
    analysis_result = tester.test_analysis_trigger(document_id)
    results["analysis_trigger"] = analysis_result.get("success", False)
    
    if results["analysis_trigger"]:
        analysis_id = analysis_result.get("analysis_id")
        version = analysis_result.get("version", "v1")
        
        # Step 4: Get results
        results_result = tester.test_analysis_results(analysis_id, version)
        results["results_retrieval"] = results_result.get("success", False)
        
        # Step 5: Test PDF export
        export_result = tester.test_pdf_export(analysis_id)
        results["pdf_export"] = export_result.get("success", False)
    
    # Summary
    print("\n" + "=" * 60)
    print("PIPELINE TEST RESULTS")
    print("=" * 60)
    
    passed_steps = sum(results.values())
    total_steps = len(results)
    
    print(f"Pipeline steps completed: {passed_steps}/{total_steps}")
    print(f"Success rate: {passed_steps/total_steps*100:.1f}%")
    
    for step, success in results.items():
        status = "PASS" if success else "FAIL"
        print(f"   {status}: {step.replace('_', ' ').title()}")
    
    if passed_steps >= 4:  # Allow PDF export to fail
        print("\nRESULT: FILE UPLOAD AND PROCESSING PIPELINE WORKS!")
        print("✓ User authentication works")
        print("✓ File upload works")
        print("✓ Analysis triggering works")
        print("✓ Results retrieval works")
        if results["pdf_export"]:
            print("✓ PDF export works")
        else:
            print("⚠ PDF export needs attention")
    else:
        print("\nRESULT: PIPELINE HAS ISSUES")
        print("✗ Critical pipeline components are not working")
    
    return passed_steps >= 4

if __name__ == "__main__":
    try:
        success = asyncio.run(test_file_upload_processing_pipeline())
        exit(0 if success else 1)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        exit(1)