/**
 * DevAssist Pro Migration Validation Script
 * Validates that all key components from Tender project have been migrated properly
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

class MigrationValidator {
  constructor() {
    this.backendDir = path.join(__dirname, 'backend');
    this.frontendDir = path.join(__dirname, 'frontend');
    this.results = {
      backend: { passed: 0, failed: 0, details: [] },
      frontend: { passed: 0, failed: 0, details: [] },
      integration: { passed: 0, failed: 0, details: [] }
    };
  }

  // Validate backend migration
  validateBackendMigration() {
    log('\n🔧 Validating Backend Migration from Tender Project', 'cyan');
    log('=' .repeat(60));

    const backendChecks = [
      // Enhanced AI Analyzer
      {
        file: 'services/documents/core/enhanced_ai_analyzer.py',
        description: 'Enhanced AI Analyzer',
        requiredContent: [
          'extract_kp_summary_data',
          'EnhancedAIAnalyzer',
          'PROMPTS_AVAILABLE',
          '10 criteria',
          'business analysis'
        ]
      },
      
      // Real Document Analyzer
      {
        file: 'services/documents/core/real_document_analyzer.py', 
        description: 'Real Document Analyzer',
        requiredContent: [
          'RealDocumentAnalyzer',
          'analyze_document_enhanced',
          'async def',
          'AI API integration'
        ]
      },

      // PDF Exporter
      {
        file: 'services/reports/core/kp_pdf_exporter.py',
        description: 'KP Analysis PDF Exporter',
        requiredContent: [
          'KPAnalysisPDFExporter',
          'reportlab',
          'Cyrillic',
          'DevAssist Pro',
          'criteria_scores',
          'executive_summary'
        ]
      },

      // LLM Prompt Manager
      {
        file: 'services/llm/prompt_manager.py',
        description: 'LLM Prompt Manager',
        requiredContent: [
          'extract_kp_summary_data',
          'compare_tz_kp_with_10_criteria',
          'PromptManager',
          'technical_requirements_compliance',
          'functional_completeness'
        ]
      },

      // Monolith App Integration
      {
        file: 'app.py',
        description: 'Main Monolith Application',
        requiredContent: [
          'DevAssist Pro',
          'FastAPI',
          'enhanced',
          'analysis',
          'KP analyzer'
        ]
      }
    ];

    let backendScore = 0;

    backendChecks.forEach((check, index) => {
      const filePath = path.join(this.backendDir, check.file);
      
      log(`\n${index + 1}. Checking: ${check.description}`, 'blue');
      
      if (!fs.existsSync(filePath)) {
        log(`   ❌ File not found: ${check.file}`, 'red');
        this.results.backend.failed++;
        this.results.backend.details.push(`Missing: ${check.file}`);
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let foundContent = 0;
        
        check.requiredContent.forEach(requiredText => {
          if (content.toLowerCase().includes(requiredText.toLowerCase())) {
            log(`   ✅ Found: ${requiredText}`, 'green');
            foundContent++;
          } else {
            log(`   ❌ Missing: ${requiredText}`, 'red');
          }
        });

        const contentScore = (foundContent / check.requiredContent.length) * 100;
        
        if (contentScore >= 80) {
          log(`   ✅ ${check.description}: PASSED (${contentScore.toFixed(1)}%)`, 'green');
          this.results.backend.passed++;
          backendScore += contentScore;
        } else if (contentScore >= 50) {
          log(`   ⚠️  ${check.description}: PARTIAL (${contentScore.toFixed(1)}%)`, 'yellow');
          this.results.backend.failed++;
          backendScore += contentScore * 0.5;
        } else {
          log(`   ❌ ${check.description}: FAILED (${contentScore.toFixed(1)}%)`, 'red');
          this.results.backend.failed++;
        }

      } catch (error) {
        log(`   ❌ Error reading file: ${error.message}`, 'red');
        this.results.backend.failed++;
      }
    });

    const avgBackendScore = backendScore / backendChecks.length;
    log(`\n📊 Backend Migration Score: ${avgBackendScore.toFixed(1)}%`, 
        avgBackendScore >= 80 ? 'green' : avgBackendScore >= 60 ? 'yellow' : 'red');

    return avgBackendScore;
  }

  // Validate frontend migration
  validateFrontendMigration() {
    log('\n⚛️  Validating Frontend Migration from Tender Project', 'cyan');
    log('=' .repeat(60));

    const frontendChecks = [
      // Enhanced KP Analyzer Components
      {
        file: 'src/pages/KPAnalyzerV2.tsx',
        description: 'KP Analyzer V2 Main Page',
        requiredContent: [
          'useRealTimeAnalysis',
          'usePDFExport',
          'DocumentUpload',
          'AnalysisProgressV2',
          'enhanced'
        ]
      },

      // Enhanced Services
      {
        file: 'src/services/enhancedKpAnalysisService.ts',
        description: 'Enhanced KP Analysis Service',
        requiredContent: [
          'extract_kp_summary_data',
          'compare_tz_kp_with_10_criteria',
          'API integration',
          'error handling',
          'analysis'
        ]
      },

      // PDF Export Components
      {
        file: 'src/components/kpAnalyzer/WorkingPDFExporter.tsx',
        description: 'Working PDF Exporter',
        requiredContent: [
          'PDF',
          'export',
          'Cyrillic',
          'analysis',
          'criteria'
        ]
      },

      // Enhanced UI Components
      {
        file: 'src/components/kpAnalyzer/EnhancedResultsDisplay.tsx',
        description: 'Enhanced Results Display',
        requiredContent: [
          'criteria_scores',
          'ScoreCard',
          'BudgetTable',
          'enhanced',
          'analysis results'
        ]
      },

      // Real-time Analysis Hook
      {
        file: 'src/hooks/useRealTimeAnalysis.ts',
        description: 'Real-time Analysis Hook',
        requiredContent: [
          'ProgressUpdate',
          'DocumentUpload',
          'real-time',
          'analysis',
          'useState'
        ]
      }
    ];

    let frontendScore = 0;

    frontendChecks.forEach((check, index) => {
      const filePath = path.join(this.frontendDir, check.file);
      
      log(`\n${index + 1}. Checking: ${check.description}`, 'blue');
      
      if (!fs.existsSync(filePath)) {
        log(`   ❌ File not found: ${check.file}`, 'red');
        this.results.frontend.failed++;
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let foundContent = 0;
        
        check.requiredContent.forEach(requiredText => {
          if (content.toLowerCase().includes(requiredText.toLowerCase())) {
            log(`   ✅ Found: ${requiredText}`, 'green');
            foundContent++;
          } else {
            log(`   ❌ Missing: ${requiredText}`, 'red');
          }
        });

        const contentScore = (foundContent / check.requiredContent.length) * 100;
        
        if (contentScore >= 80) {
          log(`   ✅ ${check.description}: PASSED (${contentScore.toFixed(1)}%)`, 'green');
          this.results.frontend.passed++;
          frontendScore += contentScore;
        } else if (contentScore >= 50) {
          log(`   ⚠️  ${check.description}: PARTIAL (${contentScore.toFixed(1)}%)`, 'yellow');
          this.results.frontend.failed++;
          frontendScore += contentScore * 0.5;
        } else {
          log(`   ❌ ${check.description}: FAILED (${contentScore.toFixed(1)}%)`, 'red');
          this.results.frontend.failed++;
        }

      } catch (error) {
        log(`   ❌ Error reading file: ${error.message}`, 'red');
        this.results.frontend.failed++;
      }
    });

    const avgFrontendScore = frontendScore / frontendChecks.length;
    log(`\n📊 Frontend Migration Score: ${avgFrontendScore.toFixed(1)}%`, 
        avgFrontendScore >= 80 ? 'green' : avgFrontendScore >= 60 ? 'yellow' : 'red');

    return avgFrontendScore;
  }

  // Validate integration between components
  validateIntegration() {
    log('\n🔄 Validating System Integration', 'cyan');
    log('=' .repeat(60));

    const integrationChecks = [
      // Check if test data files exist
      {
        name: 'Test Data Files',
        check: () => {
          const tzFile = path.join(this.backendDir, 'test_comprehensive_tz.txt');
          const kpFile = path.join(this.backendDir, 'test_comprehensive_kp.txt');
          return fs.existsSync(tzFile) && fs.existsSync(kpFile);
        }
      },

      // Check if API testing script exists
      {
        name: 'API Testing Scripts',
        check: () => {
          const apiTest = path.join(__dirname, 'test_api_endpoints.sh');
          const systemTest = path.join(__dirname, 'test_system_comprehensive.py');
          return fs.existsSync(apiTest) && fs.existsSync(systemTest);
        }
      },

      // Check if frontend testing exists
      {
        name: 'Frontend Testing Scripts',
        check: () => {
          const frontendTest = path.join(__dirname, 'test_frontend_components.js');
          return fs.existsSync(frontendTest);
        }
      },

      // Check if PDF testing exists
      {
        name: 'PDF Export Testing',
        check: () => {
          const pdfTest = path.join(__dirname, 'test_pdf_export_comprehensive.py');
          return fs.existsSync(pdfTest);
        }
      },

      // Check configuration files
      {
        name: 'Configuration Files',
        check: () => {
          const backendEnv = path.join(this.backendDir, '.env');
          const frontendEnv = path.join(this.frontendDir, '.env');
          return fs.existsSync(backendEnv) && fs.existsSync(frontendEnv);
        }
      }
    ];

    let integrationScore = 0;

    integrationChecks.forEach((check, index) => {
      log(`\n${index + 1}. Checking: ${check.name}`, 'blue');
      
      try {
        const result = check.check();
        if (result) {
          log(`   ✅ ${check.name}: PASSED`, 'green');
          this.results.integration.passed++;
          integrationScore += 100;
        } else {
          log(`   ❌ ${check.name}: FAILED`, 'red');
          this.results.integration.failed++;
        }
      } catch (error) {
        log(`   ❌ ${check.name}: ERROR - ${error.message}`, 'red');
        this.results.integration.failed++;
      }
    });

    const avgIntegrationScore = integrationScore / integrationChecks.length;
    log(`\n📊 Integration Score: ${avgIntegrationScore.toFixed(1)}%`, 
        avgIntegrationScore >= 80 ? 'green' : avgIntegrationScore >= 60 ? 'yellow' : 'red');

    return avgIntegrationScore;
  }

  // Run comprehensive migration validation
  runValidation() {
    log('🚀 DevAssist Pro Migration Validation', 'magenta');
    log('Verifying complete migration from Tender project');
    log('=' .repeat(70));

    const backendScore = this.validateBackendMigration();
    const frontendScore = this.validateFrontendMigration(); 
    const integrationScore = this.validateIntegration();

    // Overall summary
    log('\n' + '=' .repeat(70), 'magenta');
    log('📋 MIGRATION VALIDATION SUMMARY', 'magenta');
    log('=' .repeat(70));

    const overallScore = (backendScore + frontendScore + integrationScore) / 3;

    log(`🔧 Backend Migration: ${backendScore.toFixed(1)}%`, 
        backendScore >= 80 ? 'green' : backendScore >= 60 ? 'yellow' : 'red');
    log(`⚛️  Frontend Migration: ${frontendScore.toFixed(1)}%`,
        frontendScore >= 80 ? 'green' : frontendScore >= 60 ? 'yellow' : 'red');
    log(`🔄 Integration Setup: ${integrationScore.toFixed(1)}%`,
        integrationScore >= 80 ? 'green' : integrationScore >= 60 ? 'yellow' : 'red');

    log(`\n🎯 OVERALL MIGRATION SCORE: ${overallScore.toFixed(1)}%`,
        overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red');

    // Final verdict
    if (overallScore >= 90) {
      log('\n🎉 EXCELLENT! Migration is complete and ready for testing!', 'green');
    } else if (overallScore >= 80) {
      log('\n✅ GOOD! Migration is mostly complete with minor issues.', 'green');
    } else if (overallScore >= 60) {
      log('\n⚠️  PARTIAL! Migration has significant gaps that need attention.', 'yellow');
    } else {
      log('\n❌ FAILED! Migration is incomplete and needs major work.', 'red');
    }

    // Recommendations
    log('\n💡 NEXT STEPS:', 'blue');
    
    if (backendScore < 80) {
      log('   🔧 Complete backend component migration', 'yellow');
      log('   📝 Review and fix prompt manager integration', 'yellow');
      log('   🔍 Test enhanced AI analyzer functionality', 'yellow');
    }

    if (frontendScore < 80) {
      log('   ⚛️  Complete frontend component migration', 'yellow');
      log('   🎨 Test UI components and real-time features', 'yellow'); 
      log('   📱 Verify responsive design and user experience', 'yellow');
    }

    if (integrationScore < 80) {
      log('   🔄 Set up remaining integration components', 'yellow');
      log('   🧪 Create additional test scenarios', 'yellow');
    }

    if (overallScore >= 80) {
      log('\n🚀 READY TO START COMPREHENSIVE SYSTEM TESTING!', 'green');
      log('   1. Run backend tests: python test_system_comprehensive.py', 'blue');
      log('   2. Run API tests: ./test_api_endpoints.sh', 'blue');
      log('   3. Start frontend: cd frontend && npm start', 'blue');
      log('   4. Test PDF export: python test_pdf_export_comprehensive.py', 'blue');
    }

    return overallScore >= 70;
  }
}

// Main execution
if (require.main === module) {
  const validator = new MigrationValidator();
  const success = validator.runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = MigrationValidator;