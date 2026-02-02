#!/usr/bin/env node

/**
 * Spec-MAS v3 Deterministic Test Generation
 *
 * Generates deterministic tests from Level 5 specifications that include
 * concrete examples with checksums and expected outputs.
 *
 * These tests are regression tests that validate exact output matches
 * against known inputs, useful for ensuring implementation consistency.
 *
 * Usage:
 *   node scripts/generate-deterministic-tests.js <spec-file-path> [options]
 *
 * Options:
 *   --output-dir <path>  Output directory (default: tests/deterministic/)
 *   --verbose            Verbose logging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseSpec } = require('./spec-parser');
const { parseDeterministicTestsFromMarkdown } = require('../src/deterministic-tests/parse-dt');

// ==========================================
// Command Line Arguments
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Spec-MAS v3 Deterministic Test Generation

Usage: node scripts/generate-deterministic-tests.js <spec-file-path> [options]

Options:
  --output-dir <path>  Output directory (default: tests/deterministic/)
  --verbose            Enable verbose logging

Examples:
  node scripts/generate-deterministic-tests.js docs/examples/level-5-auth-spec.md
    `);
    process.exit(0);
  }

  const config = {
    specPath: args[0],
    outputDir: path.resolve(process.cwd(), 'tests', 'deterministic'),
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--output-dir':
        config.outputDir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  return config;
}

// ==========================================
// Deterministic Test Extraction
// ==========================================

function extractDeterministicTests(spec) {
  const tests = spec.sections.deterministicTests || [];

  if (tests.length === 0) {
    const parsed = parseDeterministicTestsFromMarkdown(spec.raw || '');
    if (parsed.length > 0) {
      return parsed;
    }
    // Try to extract from Level 5 concrete examples
    const level5 = spec.sections.level_5_complete_specification || spec.sections.level_5 || {};

    if (typeof level5 === 'object') {
      const concreteExamples = level5.concrete_examples || level5.examples || '';

      if (concreteExamples) {
        // Try to parse JSON examples
        const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
        let match;

        while ((match = jsonBlockRegex.exec(concreteExamples)) !== null) {
          try {
            const testCase = JSON.parse(match[1]);

            // Validate it has required fields
            if (testCase.input && (testCase.expected || testCase.output || testCase.checksum)) {
              tests.push(testCase);
            }
          } catch (error) {
            // Invalid JSON, skip
          }
        }
      }
    }
  }

  return tests;
}

function normalizeDeterministicTests(tests) {
  return tests.map((test, index) => ({
    id: test.id || `DT-${index + 1}`,
    ...test
  }));
}

function formatSpecPath(specPath) {
  const cwd = process.cwd();
  if (specPath && specPath.startsWith(cwd)) {
    return path.relative(cwd, specPath);
  }
  return specPath ? path.basename(specPath) : 'unknown';
}

function writeDeterministicFixtures(tests, outputDir) {
  const fixturesDir = path.join(outputDir, 'fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });

  tests.forEach(test => {
    const fixturePath = path.join(fixturesDir, `${test.id}.json`);
    const payload = {
      input: test.input,
      expected: test.expected,
      output: test.output,
      checksum: test.checksum || test.expectedChecksum
    };
    fs.writeFileSync(fixturePath, JSON.stringify(payload, null, 2));
  });

  return fixturesDir;
}

// ==========================================
// Test Case Generation
// ==========================================

function generateChecksumTest(testCase, index) {
  return `
  it('should produce correct checksum for test case ${index + 1}', () => {
    // Arrange
    const fixture = require(path.join(__dirname, 'fixtures', '${testCase.id}.json'));
    const expectedChecksum = fixture.checksum;

    // Act
    const result = functionUnderTest(fixture.input);
    const actualChecksum = generateChecksum(result);

    // Assert
    expect(actualChecksum).toBe(expectedChecksum);
  });
`;
}

function generateSnapshotTest(testCase, index) {
  return `
  it('should match snapshot for test case ${index + 1}', () => {
    // Arrange
    const fixture = require(path.join(__dirname, 'fixtures', '${testCase.id}.json'));

    // Act
    const result = functionUnderTest(fixture.input);

    // Assert
    expect(result).toMatchSnapshot();
  });
`;
}

function generateExactMatchTest(testCase, index) {
  return `
  it('should produce exact output for test case ${index + 1}', () => {
    // Arrange
    const fixture = require(path.join(__dirname, 'fixtures', '${testCase.id}.json'));

    // Act
    const result = functionUnderTest(fixture.input);

    // Assert
    expect(result).toEqual(fixture.expected || fixture.output);
  });
`;
}

function generateRegressionTests(testCase, index) {
  const description = testCase.description || testCase.id || `Test case ${index + 1}`;

  return `
  describe('${description}', () => {
    const fixture = require(path.join(__dirname, 'fixtures', '${testCase.id}.json'));

    it('should produce consistent results across runs', () => {
      // Act
      const result1 = functionUnderTest(fixture.input);
      const result2 = functionUnderTest(fixture.input);

      // Assert - Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should match expected output', () => {
      // Act
      const result = functionUnderTest(fixture.input);

      // Assert
      if (fixture.expected !== undefined) {
        expect(result).toEqual(fixture.expected);
      } else if (fixture.output !== undefined) {
        expect(result).toEqual(fixture.output);
      } else {
        expect(result).toMatchSnapshot();
      }
    });

    ${testCase.checksum || testCase.expectedChecksum ? `
    it('should produce correct checksum', () => {
      // Act
      const result = functionUnderTest(fixture.input);
      const checksum = generateChecksum(result);

      // Assert
      expect(checksum).toBe(fixture.checksum);
    });
    ` : ''}
  });
`;
}

// ==========================================
// Test File Generation
// ==========================================

function generateDeterministicTestFile(spec, tests, config) {
  const featureName = spec.metadata.name || 'Unknown Feature';

  let testFile = `/**
 * Deterministic Tests for ${featureName}
 * Generated from specification: ${formatSpecPath(spec.filePath)}
 *
 * These tests validate exact output matches for known inputs.
 * They serve as regression tests to ensure implementation consistency.
 *
 * DO NOT modify these tests unless the spec changes.
 * Any changes indicate a breaking change in behavior.
 */

const crypto = require('crypto');
const path = require('path');

// Function under test - TODO: Import actual implementation
// const { functionUnderTest } = require('../src/${featureName.toLowerCase().replace(/\s+/g, '-')}');

// Mock implementation for demonstration
function functionUnderTest(input) {
  // TODO: Replace with actual implementation
  return input;
}

// Checksum helper
function generateChecksum(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

describe('${featureName} - Deterministic Tests', () => {
  // ==========================================
  // Concrete Examples from Spec
  // ==========================================

${tests.map((test, idx) => generateRegressionTests(test, idx)).join('\n')}

  // ==========================================
  // Checksum Validation
  // ==========================================

  describe('Output Checksums', () => {
    // These tests validate that outputs haven't changed
    // If these fail, it indicates a breaking change

${tests.filter(t => t.checksum).map((test, idx) => generateChecksumTest(test, idx)).join('\n')}
  });

  // ==========================================
  // Snapshot Tests
  // ==========================================

  describe('Output Snapshots', () => {
    // Snapshot tests for complex outputs
    // Run \`npm test -- -u\` to update snapshots when spec changes

${tests.map((test, idx) => generateSnapshotTest(test, idx)).join('\n')}
  });
});

/**
 * Test Data Summary:
 * - Total deterministic tests: ${tests.length}
 * - Tests with checksums: ${tests.filter(t => t.checksum).length}
 * - Tests with expected output: ${tests.filter(t => t.expected || t.output).length}
 *
 * Maintenance Notes:
 * - Update these tests ONLY when spec changes
 * - Any test failure indicates a behavior change
 * - Review spec before updating snapshots
 * - Document reason for any checksum updates
 */
`;

  return testFile;
}

// ==========================================
// Main Generation Logic
// ==========================================

async function generateDeterministicTests(config) {
  console.log('🎯 Spec-MAS Deterministic Test Generator\n');

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

  // Step 2: Extract deterministic tests
  console.log(`\n🔍 Extracting deterministic tests...`);
  const tests = normalizeDeterministicTests(extractDeterministicTests(spec));

  if (tests.length === 0) {
    console.log(`⚠️  No deterministic tests found in spec`);
    console.log(`   Level 5 specs should include concrete examples with checksums`);
    console.log(`   See docs for format requirements`);
    return {
      success: false,
      message: 'No deterministic tests found'
    };
  }

  console.log(`✅ Found ${tests.length} deterministic test cases`);

  // Step 3: Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Step 4: Generate test file
  console.log(`\n🔧 Generating test file...`);

  writeDeterministicFixtures(tests, config.outputDir);
  const testContent = generateDeterministicTestFile(spec, tests, config);

  const featureName = (spec.metadata.name || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const fileName = `${featureName}.deterministic.test.js`;
  const filePath = path.join(config.outputDir, fileName);

  fs.writeFileSync(filePath, testContent);

  console.log(`✅ Created: ${filePath}`);

  // Step 5: Summary
  console.log(`\n✨ Deterministic Test Generation Complete!\n`);
  console.log(`Summary:`);
  console.log(`  📊 Test file: ${fileName}`);
  console.log(`  🎯 Deterministic tests: ${tests.length}`);
  console.log(`  🔐 Checksum tests: ${tests.filter(t => t.checksum).length}`);
  console.log(`  📸 Snapshot tests: ${tests.length}`);
  console.log(`  📂 Output: ${config.outputDir}`);

  console.log(`\nNext steps:`);
  console.log(`  1. Review generated tests in ${filePath}`);
  console.log(`  2. Implement actual function being tested`);
  console.log(`  3. Update import path in test file`);
  console.log(`  4. Run tests: npm test ${fileName}`);
  console.log('');

  return {
    success: true,
    filePath,
    testCount: tests.length
  };
}

// ==========================================
// CLI Entry Point
// ==========================================

if (require.main === module) {
  const config = parseArguments();

  generateDeterministicTests(config)
    .then(result => {
      process.exit(result.success ? 0 : 1);
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
  generateDeterministicTests,
  extractDeterministicTests,
  writeDeterministicFixtures,
  normalizeDeterministicTests
};
