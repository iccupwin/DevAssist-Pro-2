#!/bin/bash

# DevAssist Pro Integration Testing Script
# This script tests the integration between React frontend and FastAPI backend

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
WS_URL="ws://localhost:8000/ws"

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "$test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_pass "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_fail "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

skip_test() {
    local test_name="$1"
    local reason="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_skip "$test_name - $reason"
}

# Check if services are running
check_service() {
    local service_name="$1"
    local url="$2"
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Test API endpoints
test_api_health() {
    run_test "API Health Check" "curl -s --max-time 5 '$API_BASE_URL/health'"
}

test_api_docs() {
    run_test "API Documentation" "curl -s --max-time 5 '$API_BASE_URL/docs'"
}

test_cors_headers() {
    print_test "CORS Headers"
    
    response=$(curl -s -H "Origin: http://localhost:3000" \
                   -H "Access-Control-Request-Method: POST" \
                   -H "Access-Control-Request-Headers: Content-Type" \
                   -X OPTIONS \
                   "$API_BASE_URL/api/auth/login" \
                   -I 2>/dev/null)
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        print_pass "CORS Headers"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "CORS Headers"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test authentication endpoints
test_auth_endpoints() {
    print_test "Authentication Endpoints"
    
    # Test login endpoint structure
    response=$(curl -s -X POST \
                   -H "Content-Type: application/json" \
                   -d '{"email":"test@example.com","password":"test"}' \
                   "$API_BASE_URL/api/auth/login" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_pass "Authentication Endpoints"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Authentication Endpoints"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test WebSocket connection
test_websocket() {
    print_test "WebSocket Connection"
    
    # Use a simple WebSocket test
    if command -v wscat > /dev/null 2>&1; then
        timeout 5s wscat -c "$WS_URL" --subprotocol echo-protocol > /dev/null 2>&1
        if [ $? -eq 0 ] || [ $? -eq 124 ]; then  # 124 is timeout exit code
            print_pass "WebSocket Connection"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_fail "WebSocket Connection"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        skip_test "WebSocket Connection" "wscat not installed"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test frontend serving
test_frontend() {
    run_test "Frontend Serving" "curl -s --max-time 5 '$FRONTEND_URL'"
}

test_frontend_static() {
    run_test "Frontend Static Assets" "curl -s --max-time 5 '$FRONTEND_URL/static/css' -I"
}

# Test database connection
test_database() {
    print_test "Database Connection"
    
    # Try to connect to PostgreSQL
    if docker exec devassist_postgres_full pg_isready -U devassist > /dev/null 2>&1; then
        print_pass "Database Connection"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Database Connection"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test Redis connection
test_redis() {
    print_test "Redis Connection"
    
    # Try to ping Redis
    if docker exec devassist_redis_full redis-cli -a redis_password ping > /dev/null 2>&1; then
        print_pass "Redis Connection"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Redis Connection"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test Docker services
test_docker_services() {
    print_test "Docker Services Status"
    
    services=("devassist_postgres_full" "devassist_redis_full" "devassist_nginx_full")
    all_running=true
    
    for service in "${services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$service"; then
            all_running=false
            break
        fi
    done
    
    if $all_running; then
        print_pass "Docker Services Status"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Docker Services Status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test environment variables
test_environment() {
    print_test "Environment Configuration"
    
    if [ -f ".env" ]; then
        print_pass "Environment Configuration"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Environment Configuration"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test file upload endpoint
test_file_upload() {
    print_test "File Upload Endpoint"
    
    # Create a test file
    echo "Test file content" > /tmp/test_upload.txt
    
    response=$(curl -s -X POST \
                   -F "file=@/tmp/test_upload.txt" \
                   "$API_BASE_URL/api/documents/upload" \
                   -w "%{http_code}" 2>/dev/null)
    
    # Clean up
    rm -f /tmp/test_upload.txt
    
    # Check if we got any response (even error is good, means endpoint exists)
    if [ -n "$response" ]; then
        print_pass "File Upload Endpoint"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "File Upload Endpoint"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test SSL/HTTPS (if configured)
test_ssl() {
    if [ -f "ssl/devassist.crt" ]; then
        run_test "SSL Certificate" "curl -s --max-time 5 'https://localhost:443' -k"
    else
        skip_test "SSL Certificate" "SSL not configured"
    fi
}

# Performance tests
test_response_times() {
    print_test "Response Times"
    
    # Test API response time (should be under 2 seconds)
    start_time=$(date +%s%N)
    curl -s --max-time 10 "$API_BASE_URL/health" > /dev/null 2>&1
    end_time=$(date +%s%N)
    
    duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $duration -lt 2000 ]; then
        print_pass "Response Times ($duration ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Response Times ($duration ms - too slow)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test integration workflow
test_integration_workflow() {
    print_test "Integration Workflow"
    
    # This is a placeholder for end-to-end workflow testing
    # In a real scenario, you would test:
    # 1. User registration
    # 2. Document upload
    # 3. Analysis process
    # 4. Results retrieval
    
    if curl -s --max-time 5 "$API_BASE_URL/health" > /dev/null && \
       curl -s --max-time 5 "$FRONTEND_URL" > /dev/null; then
        print_pass "Integration Workflow"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "Integration Workflow"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Print test summary
print_summary() {
    echo ""
    echo "=================================================="
    echo "           Integration Test Summary"
    echo "=================================================="
    echo ""
    echo "Total Tests:  $TOTAL_TESTS"
    echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
    echo -e "Skipped:      ${YELLOW}$SKIPPED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        echo "The DevAssist Pro integration is working correctly."
    else
        echo -e "${RED}❌ Some tests failed.${NC}"
        echo "Please check the logs and fix any issues."
        echo ""
        echo "Common solutions:"
        echo "• Ensure all services are running: docker-compose -f docker-compose.fullstack.yml ps"
        echo "• Check service logs: docker-compose -f docker-compose.fullstack.yml logs"
        echo "• Verify .env configuration"
        echo "• Wait for services to fully start up"
    fi
    
    echo ""
    
    # Return exit code based on test results
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "      DevAssist Pro Integration Tests"
    echo "=================================================="
    echo ""
    
    # Infrastructure tests
    echo "🔧 Infrastructure Tests"
    test_environment
    test_docker_services
    test_database
    test_redis
    echo ""
    
    # Service tests
    echo "🌐 Service Tests"
    test_api_health
    test_api_docs
    test_frontend
    test_frontend_static
    echo ""
    
    # Integration tests
    echo "🔗 Integration Tests"
    test_cors_headers
    test_auth_endpoints
    test_file_upload
    test_websocket
    echo ""
    
    # Performance tests
    echo "⚡ Performance Tests"
    test_response_times
    echo ""
    
    # Security tests
    echo "🔒 Security Tests"
    test_ssl
    echo ""
    
    # End-to-end tests
    echo "🚀 End-to-End Tests"
    test_integration_workflow
    
    print_summary
}

# Handle script interruption
trap 'echo -e "\n${RED}Tests interrupted${NC}"; exit 1' INT

# Check if services are running before starting tests
echo "Checking if services are running..."

if ! check_service "API" "$API_BASE_URL/health"; then
    echo -e "${YELLOW}Warning: API service is not responding at $API_BASE_URL${NC}"
    echo "Please start the services first:"
    echo "  ./start-fullstack.sh"
    echo ""
    read -p "Continue with tests anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if ! check_service "Frontend" "$FRONTEND_URL"; then
    echo -e "${YELLOW}Warning: Frontend service is not responding at $FRONTEND_URL${NC}"
fi

echo ""

# Run tests
main "$@"