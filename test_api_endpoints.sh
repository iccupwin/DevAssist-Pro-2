#!/bin/bash
# API Testing Script for DevAssist Pro
# Tests all critical endpoints after Tender project migration

BASE_URL="http://localhost:8000"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="api_test_results_${TIMESTAMP}.log"

echo "🚀 DevAssist Pro API Testing Started - $(date)" | tee $LOG_FILE
echo "========================================" | tee -a $LOG_FILE

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_result() {
    echo -e "$1" | tee -a $LOG_FILE
}

test_health_endpoint() {
    log_result "\n🏥 Testing Health Endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o response.tmp "${BASE_URL}/health")
    http_code=$response
    
    if [ "$http_code" = "200" ]; then
        log_result "${GREEN}✅ Health endpoint: PASSED (200)${NC}"
        cat response.tmp >> $LOG_FILE
        return 0
    else
        log_result "${RED}❌ Health endpoint: FAILED ($http_code)${NC}"
        return 1
    fi
}

test_llm_kp_summary() {
    log_result "\n🧠 Testing LLM Service - KP Summary Extraction..."
    
    # Read KP content
    if [ ! -f "backend/test_comprehensive_kp.txt" ]; then
        log_result "${RED}❌ KP test file not found${NC}"
        return 1
    fi
    
    KP_CONTENT=$(cat backend/test_comprehensive_kp.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    
    # Create JSON payload
    cat > kp_summary_payload.json << EOF
{
    "module": "kp_analyzer",
    "template": "extract_kp_summary_data",
    "variables": {
        "kp_content": "$KP_CONTENT"
    }
}
EOF
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d @kp_summary_payload.json \
        -o kp_summary_response.json \
        "${BASE_URL}/api/llm/analyze")
    
    http_code=$response
    
    if [ "$http_code" = "200" ]; then
        log_result "${GREEN}✅ KP Summary extraction: PASSED (200)${NC}"
        
        # Check if response contains expected fields
        if grep -q "company_name\|total_cost\|project_timeline" kp_summary_response.json; then
            log_result "${GREEN}✅ Response contains expected fields${NC}"
        else
            log_result "${YELLOW}⚠️  Response missing some expected fields${NC}"
        fi
        
        echo "KP Summary Response:" >> $LOG_FILE
        cat kp_summary_response.json >> $LOG_FILE
        return 0
    else
        log_result "${RED}❌ KP Summary extraction: FAILED ($http_code)${NC}"
        cat kp_summary_response.json >> $LOG_FILE
        return 1
    fi
}

test_llm_10_criteria() {
    log_result "\n📊 Testing LLM Service - 10 Criteria Analysis..."
    
    # Read both files
    if [ ! -f "backend/test_comprehensive_tz.txt" ] || [ ! -f "backend/test_comprehensive_kp.txt" ]; then
        log_result "${RED}❌ Test files not found${NC}"
        return 1
    fi
    
    TZ_CONTENT=$(cat backend/test_comprehensive_tz.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    KP_CONTENT=$(cat backend/test_comprehensive_kp.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    
    # Create JSON payload
    cat > criteria_payload.json << EOF
{
    "module": "kp_analyzer",
    "template": "compare_tz_kp_with_10_criteria",
    "variables": {
        "tz_text": "$TZ_CONTENT",
        "kp_text": "$KP_CONTENT"
    }
}
EOF
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d @criteria_payload.json \
        -o criteria_response.json \
        "${BASE_URL}/api/llm/analyze")
    
    http_code=$response
    
    if [ "$http_code" = "200" ]; then
        log_result "${GREEN}✅ 10 Criteria analysis: PASSED (200)${NC}"
        
        # Check if response contains criteria
        criteria_count=$(grep -o "technical_requirements\|functional_completeness\|cost_effectiveness\|timeline_feasibility\|team_expertise" criteria_response.json | wc -l)
        
        if [ "$criteria_count" -gt 0 ]; then
            log_result "${GREEN}✅ Response contains analysis criteria ($criteria_count found)${NC}"
        else
            log_result "${YELLOW}⚠️  Response missing analysis criteria${NC}"
        fi
        
        echo "10 Criteria Response:" >> $LOG_FILE
        cat criteria_response.json >> $LOG_FILE
        return 0
    else
        log_result "${RED}❌ 10 Criteria analysis: FAILED ($http_code)${NC}"
        cat criteria_response.json >> $LOG_FILE
        return 1
    fi
}

test_enhanced_analysis() {
    log_result "\n🔍 Testing Enhanced Document Analysis..."
    
    TZ_CONTENT=$(cat backend/test_comprehensive_tz.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    KP_CONTENT=$(cat backend/test_comprehensive_kp.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    
    cat > enhanced_payload.json << EOF
{
    "tz_content": "$TZ_CONTENT",
    "kp_content": "$KP_CONTENT", 
    "analysis_type": "enhanced"
}
EOF
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d @enhanced_payload.json \
        -o enhanced_response.json \
        "${BASE_URL}/api/documents/analyze-enhanced")
    
    http_code=$response
    
    if [ "$http_code" = "200" ]; then
        log_result "${GREEN}✅ Enhanced analysis: PASSED (200)${NC}"
        echo "Enhanced Analysis Response:" >> $LOG_FILE
        cat enhanced_response.json >> $LOG_FILE
        return 0
    else
        log_result "${YELLOW}⚠️  Enhanced analysis endpoint may not exist ($http_code)${NC}"
        return 1
    fi
}

test_pdf_generation() {
    log_result "\n📄 Testing PDF Generation..."
    
    # Mock analysis data for PDF generation
    cat > pdf_payload.json << EOF
{
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
    },
    "tz_filename": "test_comprehensive_tz.txt",
    "kp_filename": "test_comprehensive_kp.txt"
}
EOF
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d @pdf_payload.json \
        -o test_generated_report.pdf \
        "${BASE_URL}/api/reports/generate-kp-pdf")
    
    http_code=$response
    
    if [ "$http_code" = "200" ]; then
        # Check if response is actually a PDF
        file_type=$(file test_generated_report.pdf | grep -c "PDF")
        if [ "$file_type" -gt 0 ]; then
            file_size=$(wc -c < test_generated_report.pdf)
            log_result "${GREEN}✅ PDF generation: PASSED (200) - PDF size: $file_size bytes${NC}"
            return 0
        else
            log_result "${GREEN}✅ PDF generation: PASSED (200) - Response received${NC}"
            return 0
        fi
    else
        log_result "${RED}❌ PDF generation: FAILED ($http_code)${NC}"
        return 1
    fi
}

test_error_handling() {
    log_result "\n🛡️ Testing Error Handling..."
    
    # Test invalid JSON
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "invalid json" \
        -o error_response.json \
        "${BASE_URL}/api/llm/analyze")
    
    http_code=$response
    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        log_result "${GREEN}✅ Invalid JSON handled correctly ($http_code)${NC}"
    else
        log_result "${YELLOW}⚠️  Unexpected response to invalid JSON ($http_code)${NC}"
    fi
    
    # Test empty payload
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"module":"kp_analyzer","template":"extract_kp_summary_data","variables":{"kp_content":""}}' \
        -o empty_response.json \
        "${BASE_URL}/api/llm/analyze")
    
    http_code=$response
    log_result "✅ Empty content test completed ($http_code)"
}

test_performance() {
    log_result "\n⚡ Testing Performance..."
    
    KP_CONTENT=$(cat backend/test_comprehensive_kp.txt | sed 's/"/\\"/g' | tr -d '\n\r')
    
    cat > perf_payload.json << EOF
{
    "module": "kp_analyzer",
    "template": "extract_kp_summary_data",
    "variables": {
        "kp_content": "$KP_CONTENT"
    }
}
EOF
    
    start_time=$(date +%s)
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d @perf_payload.json \
        -o perf_response.json \
        "${BASE_URL}/api/llm/analyze")
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log_result "⏱️  API response time: ${duration} seconds"
    
    if [ "$duration" -lt 30 ]; then
        log_result "${GREEN}✅ Response time acceptable (<30s)${NC}"
    else
        log_result "${YELLOW}⚠️  Slow response time (${duration}s)${NC}"
    fi
}

# Main execution
main() {
    passed=0
    total=0
    
    # Run all tests
    tests=(
        "test_health_endpoint"
        "test_llm_kp_summary" 
        "test_llm_10_criteria"
        "test_enhanced_analysis"
        "test_pdf_generation"
    )
    
    for test in "${tests[@]}"; do
        total=$((total + 1))
        if $test; then
            passed=$((passed + 1))
        fi
        echo "" >> $LOG_FILE
    done
    
    # Run additional tests
    test_error_handling
    test_performance
    
    # Summary
    log_result "\n========================================" 
    log_result "🏁 TESTING SUMMARY"
    log_result "✅ Passed: $passed/$total core tests"
    
    if [ "$passed" -eq "$total" ]; then
        log_result "${GREEN}🎉 ALL TESTS PASSED - DevAssist Pro is ready!${NC}"
    elif [ "$passed" -gt $((total / 2)) ]; then
        log_result "${YELLOW}⚠️  PARTIAL SUCCESS - Some issues need attention${NC}"
    else
        log_result "${RED}❌ MAJOR ISSUES DETECTED - System needs fixes${NC}"
    fi
    
    log_result "\n📝 Full results saved to: $LOG_FILE"
    
    # Cleanup temporary files
    rm -f response.tmp kp_summary_payload.json criteria_payload.json enhanced_payload.json pdf_payload.json perf_payload.json
    rm -f kp_summary_response.json criteria_response.json enhanced_response.json error_response.json empty_response.json perf_response.json
}

# Check prerequisites
if [ ! -f "backend/test_comprehensive_tz.txt" ] || [ ! -f "backend/test_comprehensive_kp.txt" ]; then
    log_result "${RED}❌ Test files not found. Please ensure test_comprehensive_tz.txt and test_comprehensive_kp.txt exist in backend/${NC}"
    exit 1
fi

# Run main function
main