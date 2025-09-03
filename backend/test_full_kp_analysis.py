#!/usr/bin/env python3
"""
COMPREHENSIVE TEST: Real KP Analysis Pipeline
Tests the entire flow from file upload to Claude AI analysis
"""

import os
import json
import asyncio
from pathlib import Path
from services.documents.core.enhanced_ai_analyzer import EnhancedAIAnalyzer

async def test_full_kp_analysis_pipeline():
    """Test the complete KP analysis pipeline with real files"""
    
    print("=" * 60)
    print("TESTING COMPLETE KP ANALYSIS PIPELINE")
    print("=" * 60)
    
    # Check environment variables
    print("\n1. ENVIRONMENT CHECK:")
    use_real_api = os.getenv("USE_REAL_API", "false").lower() == "true"
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    
    print(f"   USE_REAL_API: {use_real_api}")
    print(f"   ANTHROPIC_API_KEY: {'Set (' + anthropic_key[:15] + '...)' if anthropic_key else 'NOT SET'}")
    
    if not use_real_api:
        print("   ERROR: USE_REAL_API must be set to 'true'")
        return False
        
    if not anthropic_key:
        print("   ERROR: ANTHROPIC_API_KEY not found")
        return False
    
    # Initialize the enhanced analyzer
    print("\n2. INITIALIZING ENHANCED AI ANALYZER:")
    try:
        analyzer = EnhancedAIAnalyzer()
        print("   Enhanced AI Analyzer initialized successfully")
    except Exception as e:
        print(f"   ERROR: Failed to initialize analyzer: {e}")
        return False
    
    # Test files
    tz_file = Path("test_tz_sample.txt")
    kp_file = Path("test_kp_sample.txt")
    
    print(f"\n3. CHECKING TEST FILES:")
    print(f"   TZ file: {tz_file} - {'EXISTS' if tz_file.exists() else 'MISSING'}")
    print(f"   KP file: {kp_file} - {'EXISTS' if kp_file.exists() else 'MISSING'}")
    
    if not tz_file.exists() or not kp_file.exists():
        print("   ERROR: Test files missing")
        return False
    
    # Run enhanced analysis on KP
    print("\n4. RUNNING ENHANCED DOCUMENT ANALYSIS:")
    try:
        print("   Starting analysis (this may take 20-40 seconds)...")
        
        analysis_result = await analyzer.analyze_document_enhanced(kp_file, "kp")
        
        print("   ANALYSIS COMPLETED!")
        print("\n5. ANALYSIS RESULTS:")
        
        # Display key results
        print(f"   Analysis ID: {analysis_result.get('analysis_id', 'N/A')}")
        print(f"   Status: {analysis_result.get('status', 'N/A')}")
        print(f"   Using Real AI: {analysis_result.get('using_real_ai', 'N/A')}")
        print(f"   Overall Score: {analysis_result.get('overall_score', 'N/A')}")
        print(f"   Risk Level: {analysis_result.get('risk_level', 'N/A')}")
        
        # Check AI analysis
        ai_analysis = analysis_result.get("ai_analysis", {})
        if ai_analysis:
            print(f"   AI Model Used: {ai_analysis.get('model_used', 'N/A')}")
            print(f"   AI Analysis Quality: {ai_analysis.get('analysis_quality', 'N/A')}")
            
            structured_data = ai_analysis.get("structured_data", {})
            if structured_data:
                print(f"   Company Name: {structured_data.get('company_name', 'N/A')}")
                print(f"   Total Cost: {structured_data.get('total_cost', 'N/A')}")
                print(f"   Timeline: {structured_data.get('timeline', 'N/A')}")
                print(f"   Compliance Score: {structured_data.get('compliance_score', 'N/A')}")
        
        # Business analysis
        business_analysis = analysis_result.get("business_analysis", {})
        if business_analysis:
            print(f"   Business Analysis Score: {business_analysis.get('overall_score', 'N/A')}")
            issues = business_analysis.get("identified_issues", [])
            if issues:
                print(f"   Issues Found: {len(issues)}")
                for issue in issues[:3]:  # Show first 3 issues
                    print(f"     - {issue}")
        
        # Recommendations
        recommendations = analysis_result.get("recommendations", [])
        if recommendations:
            print(f"   Recommendations: {len(recommendations)}")
            for rec in recommendations[:3]:  # Show first 3 recommendations  
                print(f"     - {rec.get('title', 'N/A')}: {rec.get('description', 'N/A')}")
        
        # Verify NO MOCK DATA
        print("\n6. MOCK DATA VERIFICATION:")
        
        # Check for common mock indicators
        result_str = json.dumps(analysis_result, ensure_ascii=False).lower()
        mock_indicators = [
            "mock", "fake", "demo", "test company", 
            "fixed enhanced company", "enhanced company",
            "ошибка извлечения", "fallback", "заглушка"
        ]
        
        found_mock = []
        for indicator in mock_indicators:
            if indicator in result_str:
                found_mock.append(indicator)
        
        if found_mock:
            print(f"   WARNING: Potential mock data indicators found: {found_mock}")
            return False
        else:
            print("   VERIFIED: No mock data indicators found")
        
        print("\n7. FINAL VERIFICATION:")
        
        # Must have real AI response
        if not analysis_result.get("using_real_ai", False):
            print("   ERROR: Analysis not using real AI")
            return False
        
        # Must have structured data from AI
        if not ai_analysis.get("structured_data"):
            print("   ERROR: No structured data from AI")
            return False
            
        # Must have business analysis
        if not business_analysis:
            print("   ERROR: No business analysis performed")
            return False
        
        print("   SUCCESS: All verification checks passed")
        
        # Save full result for debugging
        with open("test_analysis_result.json", "w", encoding="utf-8") as f:
            json.dump(analysis_result, f, ensure_ascii=False, indent=2)
        print("   Full analysis result saved to 'test_analysis_result.json'")
        
        return True
        
    except Exception as e:
        print(f"   ERROR: Analysis failed: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        from dotenv import load_dotenv
        load_dotenv('.env', override=True)
        
        success = asyncio.run(test_full_kp_analysis_pipeline())
        
        print("\n" + "=" * 60)
        if success:
            print("RESULT: COMPLETE KP ANALYSIS PIPELINE TEST PASSED!")
            print("✓ Real Claude API is working")
            print("✓ File processing is working")
            print("✓ Enhanced analysis is working")
            print("✓ No mock data detected")
            print("✓ Business analysis is working")
        else:
            print("RESULT: PIPELINE TEST FAILED!")
            print("✗ One or more components are not working correctly")
        print("=" * 60)
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()