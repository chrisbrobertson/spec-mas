#!/usr/bin/env node

/**
 * Spec-MAS v3 Test Generation Script
 *
 * Automatically generates test scaffolding from specification files.
 * Parses acceptance criteria, user stories, and functional requirements
 * to create unit, integration, and e2e test files.
 *
 * Usage:
 *   node scripts/generate-tests.js <spec-file-path> [options]
 *
 * Options:
 *   --type <unit|integration|e2e|all>  Test types to generate (default: all)
 *   --output-dir <path>                Output directory (default: tests/)
 *   --framework <jest|mocha|playwright|cypress>  Test framework (default: jest)
 *   --ai                               Use AI to generate test bodies (default: false)
 *   --verbose                          Verbose logging
 *
 * Examples:
 *   npm run generate-tests docs/examples/level-3-filter-spec.md
 *   npm run generate-tests docs/examples/level-5-auth-spec.md --ai
 *   npm run generate-tests spec.md --type unit --output-dir custom-tests/
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');

// ==========================================
// Command Line Arguments
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Spec-MAS v3 Test Generation

Usage: node scripts/generate-tests.js <spec-file-path> [options]

Options:
  --type <unit|integration|e2e|all>    Test types to generate (default: all)
  --output-dir <path>                  Output directory (default: tests/)
  --framework <jest|mocha|playwright>  Test framework (default: jest)
  --ai                                 Use AI to generate test bodies
  --verbose                            Enable verbose logging

Examples:
  node scripts/generate-tests.js docs/examples/level-3-filter-spec.md
  node scripts/generate-tests.js spec.md --type unit --ai
    `);
    process.exit(0);
  }

  const config = {
    specPath: args[0],
    type: 'all',
    outputDir: path.resolve(process.cwd(), 'tests'),
    framework: 'jest',
    useAI: false,
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
        config.type = args[++i];
        break;
      case '--output-dir':
        config.outputDir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--framework':
        config.framework = args[++i];
        break;
      case '--ai':
        config.useAI = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  return config;
}

// ==========================================
// Test Type Classification
// ==========================================

function classifyTestType(acceptanceCriterion) {
  const criterion = acceptanceCriterion.toLowerCase();

  // E2E indicators: UI interactions, navigation, user actions
  const e2eKeywords = [
    'click', 'navigate', 'on the', 'page', 'button', 'form',
    'user sees', 'redirected', 'displayed', 'shown on screen',
    'refresh', 'browser', 'url changes'
  ];

  // Integration indicators: API calls, database, external services
  const integrationKeywords = [
    'api', 'endpoint', 'request', 'response', 'database',
    'stored', 'persisted', 'email sent', 'notification',
    'service', 'external', 'integration'
  ];

  // Check for E2E
  if (e2eKeywords.some(keyword => criterion.includes(keyword))) {
    return 'e2e';
  }

  // Check for Integration
  if (integrationKeywords.some(keyword => criterion.includes(keyword))) {
    return 'integration';
  }

  // Default to unit test (business logic, calculations, validation)
  return 'unit';
}

// ==========================================
// Test Case Generation
// ==========================================

function parseGivenWhenThen(criterion) {
  // Parse "Given ... When ... Then ..." format
  const givenMatch = criterion.match(/given\s+([^,]+)(?:,?\s+when|$)/i);
  const whenMatch = criterion.match(/when\s+([^,]+)(?:,?\s+then|$)/i);
  const thenMatch = criterion.match(/then\s+(.+)$/i);

  return {
    given: givenMatch ? givenMatch[1].trim() : '',
    when: whenMatch ? whenMatch[1].trim() : '',
    then: thenMatch ? thenMatch[1].trim() : '',
    raw: criterion
  };
}

function generateTestName(acceptanceCriterion) {
  const parsed = parseGivenWhenThen(acceptanceCriterion);

  // Convert to test name: "should [then] when [when] [given]"
  let testName = 'should ';

  if (parsed.then) {
    testName += parsed.then;
  }

  if (parsed.when) {
    testName += ' when ' + parsed.when;
  }

  if (parsed.given) {
    testName += ' given ' + parsed.given;
  }

  // Clean up the test name
  testName = testName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return testName;
}

function ensureUniqueTestName(testName, usedNames) {
  const count = usedNames.get(testName) || 0;
  if (count === 0) {
    usedNames.set(testName, 1);
    return testName;
  }
  const next = count + 1;
  usedNames.set(testName, next);
  return `${testName} (${next})`;
}

function generateTestCase(acceptanceCriterion, type, testNameOverride) {
  const testName = testNameOverride || generateTestName(acceptanceCriterion);
  const parsed = parseGivenWhenThen(acceptanceCriterion);

  // Generate test skeleton based on type
  let testCode = `
  it('${testName}', async () => {
    // ${acceptanceCriterion}

    // Arrange (Given: ${parsed.given || 'setup test conditions'})
    // TODO: Setup test data and preconditions

    // Act (When: ${parsed.when || 'perform action'})
    // TODO: Execute the action being tested

    // Assert (Then: ${parsed.then || 'verify expected outcome'})
    // TODO: Verify the expected results

    expect(true).toBe(true); // Replace with actual assertions
  });
`;

  return testCode;
}

function formatSpecPath(specPath) {
  const cwd = process.cwd();
  if (specPath && specPath.startsWith(cwd)) {
    return path.relative(cwd, specPath);
  }
  return specPath ? path.basename(specPath) : 'unknown';
}

// ==========================================
// Template Processing
// ==========================================

function loadTemplate(testType) {
  const templatePath = path.join(__dirname, '..', 'templates', 'test-templates', `${testType}-test.template.js`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf8');
}

function generateImports(testType, framework) {
  if (testType === 'e2e') {
    if (framework === 'playwright') {
      return `const { test, expect } = require('@playwright/test');\nconst { chromium } = require('playwright');`;
    } else if (framework === 'cypress') {
      return `/// <reference types="cypress" />`;
    }
  }

  // Jest/Mocha for unit and integration
  return `const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');`;
}

function generateTestFile(spec, testType, config) {
  const template = loadTemplate(testType);
  const featureName = spec.metadata.name || 'Unknown Feature';
  const complexity = spec.metadata.complexity || 'MODERATE';

  // Extract acceptance criteria
  const acceptanceCriteria = spec.sections.acceptanceCriteria || [];

  // Filter acceptance criteria by test type
  const relevantCriteria = acceptanceCriteria.filter(ac => {
    const type = classifyTestType(ac);
    return type === testType || config.type === 'all';
  });

  // Generate test cases
  const usedNames = new Map();
  const testCases = relevantCriteria
    .map(ac => {
      const baseName = generateTestName(ac);
      const uniqueName = ensureUniqueTestName(baseName, usedNames);
      return generateTestCase(ac, testType, uniqueName);
    })
    .join('\n');

  // Prepare template variables
  const variables = {
    specName: featureName,
    featureName: featureName,
    specPath: formatSpecPath(spec.filePath),
    testSuiteName: featureName,
    imports: generateImports(testType, config.framework),
    testCases: testCases || '  // TODO: Add test cases',
    beforeAllSetup: '// TODO: Setup test environment',
    beforeEachSetup: '// TODO: Setup before each test',
    afterEachCleanup: '// TODO: Cleanup after each test',
    afterAllCleanup: '// TODO: Cleanup test environment',
    helperFunctions: '// TODO: Add helper functions',
    mockSetup: '// TODO: Setup mocks',
    functionalRequirementsCoverage: spec.sections.functionalRequirements?.length || 0,
    acceptanceCriteriaCoverage: relevantCriteria.length,
    edgeCasesSection: 'See spec',
    manualTestingNotes: '// Review spec for manual testing requirements',

    // Integration-specific
    endpoint: '/api/endpoint',
    method: 'POST',
    apiTestCases: '    // TODO: Add API test cases',
    databaseTestCases: '    // TODO: Add database test cases',
    serviceTestCases: '    // TODO: Add service integration tests',
    errorTestCases: '    // TODO: Add error scenario tests',
    performanceTestCases: '    // TODO: Add performance tests',
    securityTestCases: '    // TODO: Add security tests',
    invalidRequestExample: '{}',
    validRequestExample: '{}',
    databaseFailureMock: '// Mock database failure',
    maxLatencyMs: 500,

    // E2E-specific
    pageUrl: 'http://localhost:3000',
    userStoryTests: '  // TODO: Add user story tests',
    acceptanceCriteriaTests: '  // TODO: Add acceptance criteria tests',
    interactionTests: '    // TODO: Add interaction tests',
    navigationTests: '    // TODO: Add navigation tests',
    errorTests: '    // TODO: Add error state tests',
    accessibilityTests: '    // TODO: Add accessibility tests',
    performanceTests: '    // TODO: Add performance tests',
    pageObjects: '// TODO: Add page object models',
    testDataExample: '{}',
    formFillActions: '// TODO: Add form fill actions',
    assertions: '// TODO: Add assertions',
    navigationSteps: '// TODO: Add navigation steps',
    expectedUrlPattern: '/expected-path',
    pageLoadAssertions: '// TODO: Add page load assertions',
    invalidSubmitActions: '// TODO: Add invalid submit actions',
    errorAssertions: '// TODO: Add error assertions',
    mobileAssertions: '// TODO: Add mobile viewport assertions',
    tabletAssertions: '// TODO: Add tablet viewport assertions',
    keyboardNavigationSteps: '// TODO: Add keyboard navigation',
    focusAssertions: '// TODO: Add focus assertions',
    ariaAssertions: '// TODO: Add ARIA assertions',
    maxLoadTimeMs: 3000,
    userStoriesCoverage: spec.sections.userStories?.length || 0,
    userFlowsCoverage: 'Primary flow',
    browsersCoverage: 'Chrome, Firefox, Safari',
    visualRegressionNotes: 'N/A',
    knownLimitations: 'None',

    // Common
    environmentRequirements: 'Node 18+, Test database',
    manualSetupNotes: 'Review spec for setup requirements'
  };

  // Replace template variables
  let testFileContent = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    testFileContent = testFileContent.replace(regex, String(value));
  }

  return testFileContent;
}

// ==========================================
// Test Mapping Generation
// ==========================================

function generateTestMapping(spec, generatedTests) {
  const featureName = spec.metadata.name || 'Unknown Feature';
  const specId = spec.metadata.id || 'unknown-id';

  let mapping = `# Test Mapping: ${featureName}\n\n`;
  mapping += `**Spec ID:** ${specId}  \n`;
  mapping += `**Spec File:** ${formatSpecPath(spec.filePath)}  \n`;
  mapping += `**Generated:** ${new Date().toISOString()}  \n\n`;

  mapping += `## Test Coverage\n\n`;

  // Functional Requirements mapping
  if (spec.sections.functionalRequirements && spec.sections.functionalRequirements.length > 0) {
    mapping += `### Functional Requirements\n\n`;
    spec.sections.functionalRequirements.forEach(fr => {
      mapping += `- **${fr.id}:** ${fr.description}\n`;
      mapping += `  - Test files: ${generatedTests.map(t => `\`${t.fileName}\``).join(', ')}\n`;
    });
    mapping += `\n`;
  }

  // Acceptance Criteria mapping
  if (spec.sections.acceptanceCriteria && spec.sections.acceptanceCriteria.length > 0) {
    mapping += `### Acceptance Criteria\n\n`;
    spec.sections.acceptanceCriteria.forEach((ac, idx) => {
      const testType = classifyTestType(ac);
      const testFile = generatedTests.find(t => t.type === testType);

      mapping += `${idx + 1}. ${ac}\n`;
      mapping += `   - **Test Type:** ${testType}\n`;
      mapping += `   - **Test File:** \`${testFile ? testFile.fileName : 'N/A'}\`\n\n`;
    });
  }

  // User Stories mapping
  if (spec.sections.userStories && spec.sections.userStories.length > 0) {
    mapping += `### User Stories\n\n`;
    spec.sections.userStories.forEach((story, idx) => {
      const e2eTest = generatedTests.find(t => t.type === 'e2e');

      mapping += `${idx + 1}. ${story}\n`;
      mapping += `   - **Test File:** \`${e2eTest ? e2eTest.fileName : 'N/A'}\`\n\n`;
    });
  }

  mapping += `## Test Files Generated\n\n`;
  generatedTests.forEach(test => {
    mapping += `- \`${formatSpecPath(test.filePath)}\` (${test.type} tests, ${test.testCount} test cases)\n`;
  });

  mapping += `\n## Running Tests\n\n`;
  mapping += `\`\`\`bash\n`;
  mapping += `# Run all tests\n`;
  mapping += `npm test\n\n`;
  mapping += `# Run by type\n`;
  mapping += `npm run test:unit\n`;
  mapping += `npm run test:integration\n`;
  mapping += `npm run test:e2e\n`;
  mapping += `\`\`\`\n`;

  return mapping;
}

// ==========================================
// Main Generation Logic
// ==========================================

async function generateTests(config) {
  console.log('🧪 Spec-MAS Test Generator\n');

  if (config.verbose) {
    console.log('Configuration:', JSON.stringify(config, null, 2), '\n');
  }

  // Step 1: Parse spec file
  console.log(`📄 Parsing spec: ${config.specPath}`);

  if (!fs.existsSync(config.specPath)) {
    console.error(`❌ Error: Spec file not found: ${config.specPath}`);
    process.exit(1);
  }

  let spec;
  try {
    spec = parseSpec(config.specPath);
  } catch (error) {
    console.error(`❌ Error parsing spec: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Spec parsed: ${spec.metadata.name || 'Unknown'}`);
  console.log(`   Complexity: ${spec.metadata.complexity || 'Unknown'}`);
  console.log(`   Maturity: ${spec.metadata.maturity || 'Unknown'}`);

  // Step 2: Determine test types to generate
  const complexity = spec.metadata.complexity || 'MODERATE';
  const maturity = spec.metadata.maturity || 3;

  let testTypes = [];
  if (config.type === 'all') {
    // Determine based on complexity
    if (complexity === 'EASY') {
      testTypes = ['unit', 'integration'];
    } else if (complexity === 'MODERATE') {
      testTypes = ['unit', 'integration', 'e2e'];
    } else if (complexity === 'HIGH') {
      testTypes = ['unit', 'integration', 'e2e'];
    }
  } else {
    testTypes = [config.type];
  }

  console.log(`\n🔧 Generating test types: ${testTypes.join(', ')}`);

  // Step 3: Create output directories
  const outputDirs = {
    unit: path.join(config.outputDir, 'unit'),
    integration: path.join(config.outputDir, 'integration'),
    e2e: path.join(config.outputDir, 'e2e')
  };

  for (const dir of Object.values(outputDirs)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Step 4: Generate test files
  const generatedTests = [];
  const featureName = (spec.metadata.name || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  for (const testType of testTypes) {
    console.log(`\n  Generating ${testType} tests...`);

    const testContent = generateTestFile(spec, testType, config);

    const fileName = testType === 'e2e'
      ? `${featureName}.e2e.test.js`
      : testType === 'integration'
        ? `${featureName}.integration.test.js`
        : `${featureName}.test.js`;

    const filePath = path.join(outputDirs[testType], fileName);

    fs.writeFileSync(filePath, testContent);

    // Count test cases
    const testCount = (testContent.match(/it\(/g) || []).length;

    generatedTests.push({
      type: testType,
      fileName,
      filePath,
      testCount
    });

    console.log(`  ✅ Created: ${filePath} (${testCount} test cases)`);
  }

  // Step 5: Generate test mapping
  console.log(`\n📋 Generating test mapping...`);
  const mappingContent = generateTestMapping(spec, generatedTests);
  const mappingPath = path.join(config.outputDir, 'TEST_MAPPING.md');
  fs.writeFileSync(mappingPath, mappingContent);
  console.log(`  ✅ Created: ${mappingPath}`);

  // Step 6: Generate deterministic tests if Level 5
  if (maturity >= 5 && spec.sections.deterministicTests && spec.sections.deterministicTests.length > 0) {
    console.log(`\n🎯 Generating deterministic tests...`);
    // This will be handled by generate-deterministic-tests.js
    console.log(`  ℹ️  Run: node scripts/generate-deterministic-tests.js ${config.specPath}`);
  }

  // Step 7: AI enhancement (if requested)
  if (config.useAI) {
    console.log(`\n🤖 AI test enhancement requested...`);
    console.log(`  ℹ️  Run: node scripts/ai-enhance-tests.js ${config.outputDir}`);
  }

  // Step 8: Summary
  console.log(`\n✨ Test Generation Complete!\n`);
  console.log(`Summary:`);
  console.log(`  📊 Total test files: ${generatedTests.length}`);
  console.log(`  🧪 Total test cases: ${generatedTests.reduce((sum, t) => sum + t.testCount, 0)}`);
  console.log(`  📂 Output directory: ${config.outputDir}`);

  console.log(`\nNext steps:`);
  console.log(`  1. Review generated tests in ${config.outputDir}`);
  console.log(`  2. Fill in TODO sections with actual test logic`);
  console.log(`  3. Run tests: npm test`);

  if (config.useAI) {
    console.log(`  4. Enhance with AI: npm run generate-tests:ai`);
  }

  console.log('');

  return {
    success: true,
    generatedTests,
    mappingPath
  };
}

// ==========================================
// CLI Entry Point
// ==========================================

if (require.main === module) {
  const config = parseArguments();

  generateTests(config)
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error.message);
      if (config && config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = {
  generateTests,
  classifyTestType,
  generateTestName,
  parseGivenWhenThen,
  ensureUniqueTestName,
  formatSpecPath
};
