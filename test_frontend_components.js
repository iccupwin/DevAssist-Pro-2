/**
 * Frontend Components Testing Script
 * Tests KP Analyzer v2 components after Tender migration
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
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

class FrontendTester {
  constructor() {
    this.frontendDir = path.join(__dirname, 'frontend');
    this.results = [];
  }

  // Check if essential migrated components exist
  checkMigratedComponents() {
    log('\n🧪 Testing Migrated Frontend Components', 'cyan');
    log('=' .repeat(50));

    const essentialComponents = [
      // KP Analyzer main components
      'src/pages/KPAnalyzer.tsx',
      'src/pages/KPAnalyzerV2.tsx',
      'src/components/kpAnalyzer/AnalysisProgressV2.tsx',
      'src/components/kpAnalyzer/EnhancedAnalysisProgress.tsx', 
      'src/components/kpAnalyzer/FileUploadZone.tsx',
      'src/components/kpAnalyzer/ResultsDisplay.tsx',
      'src/components/kpAnalyzer/EnhancedResultsDisplay.tsx',
      
      // Enhanced components from Tender
      'src/components/kpAnalyzer/BudgetTableV2.tsx',
      'src/components/kpAnalyzer/CurrencyDisplayV2.tsx',
      'src/components/kpAnalyzer/EnhancedKPAnalyzerDemo.tsx',
      'src/components/kpAnalyzer/ScoreBadge.tsx',
      'src/components/kpAnalyzer/ScoreCard.tsx',
      
      // PDF Export components
      'src/components/kpAnalyzer/PDFExportButtonV2.tsx',
      'src/components/kpAnalyzer/EnhancedPDFExportButton.tsx',
      'src/components/kpAnalyzer/WorkingPDFExporter.tsx',
      
      // Services
      'src/services/ai/realKpAnalysisService.ts',
      'src/services/enhancedKpAnalysisService.ts',
      'src/services/enhancedCurrencyExtractor.ts',
      
      // Hooks and utilities
      'src/hooks/useRealTimeAnalysis.ts',
      'src/hooks/usePDFExport.ts',
      'src/utils/currencyUtils.ts',
      
      // Types
      'src/types/kpAnalyzer.ts',
      'src/types/enhancedKpAnalyzer.ts'
    ];

    let foundCount = 0;
    const missingComponents = [];

    essentialComponents.forEach(componentPath => {
      const fullPath = path.join(this.frontendDir, componentPath);
      if (fs.existsSync(fullPath)) {
        log(`✅ Found: ${componentPath}`, 'green');
        foundCount++;
      } else {
        log(`❌ Missing: ${componentPath}`, 'red');
        missingComponents.push(componentPath);
      }
    });

    log(`\n📊 Component Check Results:`);
    log(`✅ Found: ${foundCount}/${essentialComponents.length} components`, 'green');
    log(`❌ Missing: ${missingComponents.length} components`, 'red');

    if (missingComponents.length > 0) {
      log('\n⚠️  Missing Components:', 'yellow');
      missingComponents.forEach(comp => log(`   - ${comp}`, 'yellow'));
    }

    return { found: foundCount, total: essentialComponents.length, missing: missingComponents };
  }

  // Analyze component code for key features
  analyzeComponentFeatures() {
    log('\n🔍 Analyzing Component Features', 'cyan');
    log('=' .repeat(50));

    const componentsToAnalyze = [
      {
        file: 'src/pages/KPAnalyzer.tsx',
        features: [
          'useRealTimeAnalysis',
          'usePDFExport', 
          '10 criteria',
          'DocumentUpload interface',
          'ViewMode type'
        ]
      },
      {
        file: 'src/services/ai/realKpAnalysisService.ts',
        features: [
          'extract_kp_summary_data',
          'compare_tz_kp_with_10_criteria', 
          'JSON validation',
          'API endpoints',
          'error handling'
        ]
      },
      {
        file: 'src/hooks/useRealTimeAnalysis.ts',
        features: [
          'ProgressUpdate interface',
          'real-time updates',
          'stage tracking',
          'error handling',
          'time estimation'
        ]
      }
    ];

    componentsToAnalyze.forEach(({ file, features }) => {
      const filePath = path.join(this.frontendDir, file);
      
      if (!fs.existsSync(filePath)) {
        log(`❌ File not found: ${file}`, 'red');
        return;
      }

      log(`\n📄 Analyzing: ${file}`, 'blue');
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        features.forEach(feature => {
          const hasFeature = content.includes(feature);
          const status = hasFeature ? '✅' : '❌';
          const color = hasFeature ? 'green' : 'red';
          log(`   ${status} ${feature}`, color);
        });
      } catch (error) {
        log(`❌ Error reading ${file}: ${error.message}`, 'red');
      }
    });
  }

  // Check package.json for required dependencies
  checkDependencies() {
    log('\n📦 Checking Dependencies', 'cyan');
    log('=' .repeat(50));

    const packageJsonPath = path.join(this.frontendDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      log('❌ package.json not found', 'red');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const requiredDeps = [
        '@react-pdf/renderer',
        'lucide-react',
        'axios',
        '@tanstack/react-query',
        'zustand',
        'react-hook-form',
        '@hookform/resolvers',
        'tailwindcss',
        'jspdf'  // For PDF generation fallback
      ];

      let foundDeps = 0;
      const missingDeps = [];

      requiredDeps.forEach(dep => {
        if (dependencies[dep]) {
          log(`✅ ${dep}: ${dependencies[dep]}`, 'green');
          foundDeps++;
        } else {
          log(`❌ Missing: ${dep}`, 'red');
          missingDeps.push(dep);
        }
      });

      log(`\n📊 Dependencies: ${foundDeps}/${requiredDeps.length} found`);

      if (missingDeps.length > 0) {
        log('\n⚠️  Missing Dependencies (install with npm):', 'yellow');
        missingDeps.forEach(dep => log(`   npm install ${dep}`, 'yellow'));
      }

      return { found: foundDeps, total: requiredDeps.length, missing: missingDeps };

    } catch (error) {
      log(`❌ Error reading package.json: ${error.message}`, 'red');
      return { found: 0, total: 0, missing: [] };
    }
  }

  // Test TypeScript compilation
  testTypeScript() {
    log('\n🔧 Testing TypeScript Configuration', 'cyan');
    log('=' .repeat(50));

    const tsconfigPath = path.join(this.frontendDir, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      log('❌ tsconfig.json not found', 'red');
      return false;
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      log('✅ tsconfig.json found and valid', 'green');
      log(`   - Target: ${tsconfig.compilerOptions?.target || 'default'}`, 'blue');
      log(`   - Module: ${tsconfig.compilerOptions?.module || 'default'}`, 'blue');
      log(`   - Strict: ${tsconfig.compilerOptions?.strict || 'false'}`, 'blue');
      
      return true;
    } catch (error) {
      log(`❌ Invalid tsconfig.json: ${error.message}`, 'red');
      return false;
    }
  }

  // Check build configuration
  checkBuildConfig() {
    log('\n🏗️  Checking Build Configuration', 'cyan');
    log('=' .repeat(50));

    const configs = [
      { file: 'tailwind.config.js', desc: 'Tailwind CSS' },
      { file: 'craco.config.js', desc: 'Create React App Configuration' },
      { file: '.env', desc: 'Environment Variables' }
    ];

    let validConfigs = 0;

    configs.forEach(({ file, desc }) => {
      const filePath = path.join(this.frontendDir, file);
      if (fs.existsSync(filePath)) {
        log(`✅ ${desc}: ${file}`, 'green');
        validConfigs++;
      } else {
        log(`⚠️  ${desc}: ${file} (optional)`, 'yellow');
      }
    });

    return validConfigs;
  }

  // Run comprehensive test
  runComprehensiveTest() {
    log('🚀 DevAssist Pro Frontend Testing Started', 'cyan');
    log('=' .repeat(60));
    
    const componentResults = this.checkMigratedComponents();
    this.analyzeComponentFeatures();
    const depResults = this.checkDependencies();
    const tsValid = this.testTypeScript();
    const validConfigs = this.checkBuildConfig();

    // Summary
    log('\n📋 FRONTEND TESTING SUMMARY', 'cyan');
    log('=' .repeat(60));

    const componentScore = (componentResults.found / componentResults.total) * 100;
    const depScore = (depResults.found / depResults.total) * 100;
    
    log(`📦 Components: ${componentResults.found}/${componentResults.total} (${componentScore.toFixed(1)}%)`, 
        componentScore >= 80 ? 'green' : componentScore >= 60 ? 'yellow' : 'red');
    
    log(`📚 Dependencies: ${depResults.found}/${depResults.total} (${depScore.toFixed(1)}%)`,
        depScore >= 90 ? 'green' : depScore >= 70 ? 'yellow' : 'red');
    
    log(`🔧 TypeScript Config: ${tsValid ? 'Valid' : 'Invalid'}`, tsValid ? 'green' : 'red');
    log(`🏗️  Build Configs: ${validConfigs}/3 found`, validConfigs >= 2 ? 'green' : 'yellow');

    // Overall assessment
    const overallScore = (componentScore + depScore + (tsValid ? 100 : 0) + (validConfigs/3 * 100)) / 4;
    
    log(`\n🎯 OVERALL SCORE: ${overallScore.toFixed(1)}%`, 
        overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red');

    if (overallScore >= 80) {
      log('🎉 FRONTEND IS READY FOR TESTING!', 'green');
    } else if (overallScore >= 60) {
      log('⚠️  FRONTEND NEEDS SOME FIXES BEFORE TESTING', 'yellow');
    } else {
      log('❌ FRONTEND HAS MAJOR ISSUES - REQUIRES FIXES', 'red');
    }

    // Recommendations
    log('\n💡 RECOMMENDATIONS:', 'blue');
    
    if (componentResults.missing.length > 5) {
      log('   - Complete component migration from Tender project', 'yellow');
    }
    
    if (depResults.missing.length > 0) {
      log(`   - Install missing dependencies: npm install ${depResults.missing.join(' ')}`, 'yellow');
    }
    
    if (!tsValid) {
      log('   - Fix TypeScript configuration', 'yellow');
    }
    
    log('   - Run frontend with: npm start', 'blue');
    log('   - Build for production with: npm run build', 'blue');
    
    return overallScore >= 60;
  }
}

// Main execution
if (require.main === module) {
  const tester = new FrontendTester();
  const success = tester.runComprehensiveTest();
  process.exit(success ? 0 : 1);
}

module.exports = FrontendTester;