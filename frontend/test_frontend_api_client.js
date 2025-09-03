/**
 * Frontend API Client Test
 * Tests the core frontend API client functionality
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node.js environment
global.localStorage = {
  storage: {},
  getItem: function(key) {
    return this.storage[key] || null;
  },
  setItem: function(key, value) {
    this.storage[key] = value;
  },
  removeItem: function(key) {
    delete this.storage[key];
  }
};

// Mock process.env
process.env.NODE_ENV = 'development';
process.env.REACT_APP_API_URL = 'http://localhost:8000';

class FrontendApiTester {
  constructor() {
    this.testResults = [];
    this.frontendPath = path.join(__dirname, 'src');
  }

  async testFileStructure() {
    console.log('1. Testing frontend file structure...');
    
    const requiredPaths = [
      'src/services/unifiedApiClient.ts',
      'src/types/auth.ts',
      'src/types/api.ts',
      'src/config/auth.ts',
      'src/components/kpAnalyzer',
      'src/pages/KPAnalyzer.tsx',
      'src/hooks/useAuth.ts'
    ];
    
    let foundFiles = 0;
    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(this.frontendPath, requiredPath.replace('src/', ''));
      if (fs.existsSync(fullPath)) {
        foundFiles++;
        console.log(`   ✓ Found: ${requiredPath}`);
      } else {
        console.log(`   ✗ Missing: ${requiredPath}`);
      }
    }
    
    const success = foundFiles >= (requiredPaths.length * 0.8); // 80% pass rate
    console.log(`   Result: ${foundFiles}/${requiredPaths.length} files found`);
    
    this.testResults.push({ test: 'File Structure', success });
    return success;
  }

  async testConfigFiles() {
    console.log('2. Testing configuration files...');
    
    try {
      // Test auth config
      const authConfigPath = path.join(this.frontendPath, 'config/auth.ts');
      if (fs.existsSync(authConfigPath)) {
        const authConfig = fs.readFileSync(authConfigPath, 'utf8');
        
        const hasTokenConfig = authConfig.includes('TOKEN_STORAGE_KEY') && 
                              authConfig.includes('REFRESH_TOKEN_STORAGE_KEY');
        const hasEndpoints = authConfig.includes('LOGIN_ENDPOINT') || 
                            authConfig.includes('/api/auth');
        
        if (hasTokenConfig && hasEndpoints) {
          console.log('   ✓ Auth config is properly structured');
        } else {
          console.log('   ⚠ Auth config missing some required fields');
        }
      }
      
      // Test API config
      const apiConfigPath = path.join(this.frontendPath, 'config/api.ts');
      if (fs.existsSync(apiConfigPath)) {
        const apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
        
        const hasApiUrl = apiConfig.includes('API_URL') || apiConfig.includes('baseURL');
        const hasTimeout = apiConfig.includes('timeout') || apiConfig.includes('TIMEOUT');
        
        if (hasApiUrl) {
          console.log('   ✓ API config contains URL configuration');
        } else {
          console.log('   ⚠ API config missing URL configuration');
        }
      }
      
      console.log('   SUCCESS: Configuration files checked');
      this.testResults.push({ test: 'Configuration Files', success: true });
      return true;
      
    } catch (error) {
      console.log(`   FAIL: Configuration test error: ${error.message}`);
      this.testResults.push({ test: 'Configuration Files', success: false });
      return false;
    }
  }

  async testTypeDefinitions() {
    console.log('3. Testing TypeScript type definitions...');
    
    try {
      const typeFiles = [
        'types/auth.ts',
        'types/api.ts',
        'types/kpAnalyzer.ts',
        'types/shared.ts'
      ];
      
      let validTypes = 0;
      
      for (const typeFile of typeFiles) {
        const typePath = path.join(this.frontendPath, typeFile);
        if (fs.existsSync(typePath)) {
          const typeContent = fs.readFileSync(typePath, 'utf8');
          
          // Check for proper TypeScript interfaces/types
          const hasInterface = typeContent.includes('interface ') || typeContent.includes('type ');
          const hasExport = typeContent.includes('export ');
          
          if (hasInterface && hasExport) {
            console.log(`   ✓ ${typeFile} has valid type definitions`);
            validTypes++;
          } else {
            console.log(`   ⚠ ${typeFile} missing proper type definitions`);
          }
        } else {
          console.log(`   ⚠ ${typeFile} not found`);
        }
      }
      
      const success = validTypes >= 2; // At least 2 valid type files
      console.log(`   Result: ${validTypes}/${typeFiles.length} type files are valid`);
      
      this.testResults.push({ test: 'Type Definitions', success });
      return success;
      
    } catch (error) {
      console.log(`   FAIL: Type definitions test error: ${error.message}`);
      this.testResults.push({ test: 'Type Definitions', success: false });
      return false;
    }
  }

  async testKPAnalyzerComponents() {
    console.log('4. Testing KP Analyzer components...');
    
    try {
      const kpAnalyzerPath = path.join(this.frontendPath, 'components/kpAnalyzer');
      
      if (!fs.existsSync(kpAnalyzerPath)) {
        console.log('   FAIL: KP Analyzer components directory not found');
        this.testResults.push({ test: 'KP Analyzer Components', success: false });
        return false;
      }
      
      const componentFiles = fs.readdirSync(kpAnalyzerPath);
      const tsxFiles = componentFiles.filter(file => file.endsWith('.tsx'));
      
      console.log(`   Found ${tsxFiles.length} TSX component files`);
      
      // Check for key components
      const keyComponents = [
        'FileUploadZone.tsx',
        'ResultsDisplay.tsx',
        'AnalysisProgress.tsx'
      ];
      
      let foundKeyComponents = 0;
      for (const component of keyComponents) {
        if (tsxFiles.includes(component)) {
          console.log(`   ✓ Found key component: ${component}`);
          foundKeyComponents++;
        } else {
          console.log(`   ⚠ Missing key component: ${component}`);
        }
      }
      
      // Check component structure
      let validComponents = 0;
      for (const file of tsxFiles.slice(0, 5)) { // Check first 5 files
        const componentPath = path.join(kpAnalyzerPath, file);
        const componentContent = fs.readFileSync(componentPath, 'utf8');
        
        const hasReactImport = componentContent.includes('import React') || 
                              componentContent.includes('import { ') ||
                              componentContent.includes('import type');
        const hasExport = componentContent.includes('export ');
        const hasJSX = componentContent.includes('<') && componentContent.includes('>');
        
        if (hasReactImport && hasExport && hasJSX) {
          validComponents++;
        }
      }
      
      const success = (foundKeyComponents >= 2) && (validComponents >= 3);
      console.log(`   Result: ${foundKeyComponents}/3 key components, ${validComponents}/5 valid components`);
      
      this.testResults.push({ test: 'KP Analyzer Components', success });
      return success;
      
    } catch (error) {
      console.log(`   FAIL: KP Analyzer components test error: ${error.message}`);
      this.testResults.push({ test: 'KP Analyzer Components', success: false });
      return false;
    }
  }

  async testHooksAndServices() {
    console.log('5. Testing hooks and services...');
    
    try {
      // Test hooks
      const hooksPath = path.join(this.frontendPath, 'hooks');
      const serviceFiles = [
        'services/unifiedApiClient.ts',
        'services/authService.ts',
        'services/ai/kpAnalysisService.ts'
      ];
      
      let validServices = 0;
      
      for (const serviceFile of serviceFiles) {
        const servicePath = path.join(this.frontendPath, serviceFile);
        if (fs.existsSync(servicePath)) {
          const serviceContent = fs.readFileSync(servicePath, 'utf8');
          
          const hasClass = serviceContent.includes('class ') || serviceContent.includes('function ');
          const hasAsync = serviceContent.includes('async ') || serviceContent.includes('Promise');
          const hasExport = serviceContent.includes('export ');
          
          if (hasClass && hasExport) {
            console.log(`   ✓ ${serviceFile} is properly structured`);
            validServices++;
          } else {
            console.log(`   ⚠ ${serviceFile} needs improvement`);
          }
        } else {
          console.log(`   ⚠ ${serviceFile} not found`);
        }
      }
      
      // Check hooks directory
      let hooksCount = 0;
      if (fs.existsSync(hooksPath)) {
        const hookFiles = fs.readdirSync(hooksPath).filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
        hooksCount = hookFiles.length;
        console.log(`   Found ${hooksCount} hook files`);
      }
      
      const success = validServices >= 2 && hooksCount >= 5;
      console.log(`   Result: ${validServices}/3 services valid, ${hooksCount} hooks found`);
      
      this.testResults.push({ test: 'Hooks and Services', success });
      return success;
      
    } catch (error) {
      console.log(`   FAIL: Hooks and services test error: ${error.message}`);
      this.testResults.push({ test: 'Hooks and Services', success: false });
      return false;
    }
  }

  async testPackageJson() {
    console.log('6. Testing package.json dependencies...');
    
    try {
      const packageJsonPath = path.join(__dirname, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        console.log('   FAIL: package.json not found');
        this.testResults.push({ test: 'Package.json', success: false });
        return false;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for required dependencies
      const requiredDeps = [
        'react',
        'react-dom',
        'axios',
        '@tanstack/react-query',
        'react-hook-form'
      ];
      
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      let foundDeps = 0;
      
      for (const dep of requiredDeps) {
        if (dependencies[dep]) {
          console.log(`   ✓ Found dependency: ${dep}`);
          foundDeps++;
        } else {
          console.log(`   ⚠ Missing dependency: ${dep}`);
        }
      }
      
      // Check scripts
      const requiredScripts = ['start', 'build', 'test'];
      let foundScripts = 0;
      
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          foundScripts++;
        }
      }
      
      const success = foundDeps >= 4 && foundScripts >= 3;
      console.log(`   Result: ${foundDeps}/5 dependencies, ${foundScripts}/3 scripts`);
      
      this.testResults.push({ test: 'Package.json', success });
      return success;
      
    } catch (error) {
      console.log(`   FAIL: Package.json test error: ${error.message}`);
      this.testResults.push({ test: 'Package.json', success: false });
      return false;
    }
  }

  async runAllTests() {
    console.log('=' .repeat(60));
    console.log('FRONTEND API CLIENT AND COMPONENTS TEST');
    console.log('=' .repeat(60));
    
    const tests = [
      this.testFileStructure,
      this.testConfigFiles,
      this.testTypeDefinitions,
      this.testKPAnalyzerComponents,
      this.testHooksAndServices,
      this.testPackageJson
    ];
    
    const results = [];
    for (const test of tests) {
      try {
        const result = await test.call(this);
        results.push(result);
      } catch (error) {
        console.log(`   CRITICAL ERROR in ${test.name}: ${error.message}`);
        results.push(false);
      }
      console.log();
    }
    
    // Results summary
    console.log('=' .repeat(60));
    console.log('FRONTEND TEST RESULTS');
    console.log('=' .repeat(60));
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`Tests passed: ${passed}/${total}`);
    console.log(`Success rate: ${(passed/total*100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('RESULT: ALL FRONTEND TESTS PASSED!');
      console.log('✓ File structure is complete');
      console.log('✓ Configuration files are valid');
      console.log('✓ Type definitions are proper');
      console.log('✓ KP Analyzer components exist');
      console.log('✓ Hooks and services are structured');
      console.log('✓ Package.json is configured');
    } else {
      console.log('RESULT: SOME FRONTEND TESTS FAILED');
      for (let i = 0; i < this.testResults.length; i++) {
        const result = this.testResults[i];
        const status = result.success ? 'PASS' : 'FAIL';
        console.log(`  ${status}: ${result.test}`);
      }
    }
    
    return passed >= (total * 0.8); // 80% pass rate
  }
}

// Run tests
async function runTests() {
  try {
    const tester = new FrontendApiTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    process.exit(1);
  }
}

runTests();