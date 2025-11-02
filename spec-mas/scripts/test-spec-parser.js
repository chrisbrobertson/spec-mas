#!/usr/bin/env node

/**
 * Comprehensive test suite for spec-parser.js
 * Tests both formal template and maturity-level formats
 */

const { parseSpec } = require('./spec-parser.js');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${name}`);
    if (details) console.log(`    ${details}`);
    passedTests++;
  } else {
    console.log(`  ✗ ${name}`);
    if (details) console.log(`    ${details}`);
    failedTests++;
  }
}

function testFormalTemplate() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 1: Formal Template Format (executive-assistant.md)');
  console.log('='.repeat(70) + '\n');

  const specPath = path.join(__dirname, '../specs/executive-assistant.md');
  const parsed = parseSpec(specPath);

  console.log('1. Section Name Normalization:');
  test('Overview section exists', !!parsed.sections.overview);
  test('Functional Requirements section exists', !!parsed.sections.functional_requirements);
  test('Non-Functional Requirements section exists', !!parsed.sections.non_functional_requirements);
  test('Security section exists (from "Security Considerations")', !!parsed.sections.security);
  test('Data Model section exists', !!parsed.sections.data_model);
  test('Interfaces & Contracts section exists', !!parsed.sections.interfaces_and_contracts);
  test('Deterministic Tests section exists', !!parsed.sections.deterministic_tests);

  console.log('\n2. Content Extraction:');
  if (parsed.sections.overview && parsed.sections.overview.problem_statement) {
    const problemStmt = parsed.sections.overview.problem_statement;
    test('Overview > Problem Statement extracted',
      problemStmt.includes('Executives receive hundreds of communications'),
      `Length: ${problemStmt.length} chars`);
  } else {
    test('Overview > Problem Statement extracted', false, 'Section not found');
  }

  if (parsed.sections.functional_requirements) {
    const fr001 = parsed.sections.functional_requirements.fr_001_automatic_communication_monitoring;
    test('FR-001 extracted',
      fr001 && fr001.includes('Office 365 email'),
      fr001 ? `Length: ${fr001.length} chars` : '');
  }

  console.log('\n3. Structured Data Extraction:');
  test('Functional Requirements extracted',
    parsed.sections.functionalRequirements?.length === 10,
    `Count: ${parsed.sections.functionalRequirements?.length || 0}`);

  test('User Stories extracted',
    parsed.sections.userStories?.length > 0,
    `Count: ${parsed.sections.userStories?.length || 0}`);

  test('Acceptance Criteria extracted',
    parsed.sections.acceptanceCriteria?.length > 0,
    `Count: ${parsed.sections.acceptanceCriteria?.length || 0}`);

  test('Deterministic Tests extracted',
    parsed.sections.deterministicTests?.length === 5,
    `Count: ${parsed.sections.deterministicTests?.length || 0}`);

  console.log('\n4. Edge Cases:');
  test('"&" handled in "Interfaces & Contracts"',
    !!parsed.sections.interfaces_and_contracts,
    'Ampersand normalized to "and"');

  test('Multiple word section names normalized',
    !!parsed.sections.non_functional_requirements,
    'Spaces converted to underscores');
}

function testMaturityLevel() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE 2: Backward Compatibility (level-3-filter-spec.md)');
  console.log('='.repeat(70) + '\n');

  const specPath = path.join(__dirname, '../docs/examples/level-3-filter-spec.md');
  const parsed = parseSpec(specPath);

  console.log('1. Maturity-Level Section Detection:');
  const hasLevel1 = !!parsed.sections.level_1_foundation || !!parsed.sections.level_1;
  const hasLevel2 = !!parsed.sections.level_2_technical_context || !!parsed.sections.level_2;
  const hasLevel3 = !!parsed.sections.level_3_robustness || !!parsed.sections.level_3;

  test('Level 1 Foundation section exists', hasLevel1);
  test('Level 2 Technical Context section exists', hasLevel2);
  test('Level 3 Robustness section exists', hasLevel3);

  console.log('\n2. Section Mapping (maturity-level → formal template):');
  test('Overview mapped from Level 1', !!parsed.sections.overview);
  test('Acceptance Criteria mapped', !!parsed.sections.acceptance_criteria);
  test('Data Model mapped from Level 2', !!parsed.sections.data_model);
  test('Non-Functional Requirements mapped', !!parsed.sections.non_functional_requirements);

  console.log('\n3. Structured Data Extraction:');
  test('User Stories extracted',
    parsed.sections.userStories?.length >= 2,
    `Count: ${parsed.sections.userStories?.length || 0}`);

  test('Acceptance Criteria extracted',
    parsed.sections.acceptanceCriteria?.length > 10,
    `Count: ${parsed.sections.acceptanceCriteria?.length || 0}`);

  console.log('\n4. Content Quality:');
  if (parsed.sections.userStories && parsed.sections.userStories.length > 0) {
    const hasProperFormat = parsed.sections.userStories[0].toLowerCase().includes('as a');
    test('User stories follow "As a..." format', hasProperFormat,
      `Sample: "${parsed.sections.userStories[0].substring(0, 60)}..."`);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(70) + '\n');

  if (failedTests === 0) {
    console.log('✓ ALL TESTS PASSED!\n');
    console.log('The spec parser successfully handles:');
    console.log('  1. Formal template format with H2 sections');
    console.log('  2. Section name normalization (& → and, spaces → _)');
    console.log('  3. Content extraction from nested subsections');
    console.log('  4. Backward compatibility with maturity-level format');
    console.log('  5. Structured data extraction from both formats\n');
    return true;
  } else {
    console.log(`✗ ${failedTests} TEST(S) FAILED\n`);
    return false;
  }
}

// Run all tests
try {
  testFormalTemplate();
  testMaturityLevel();
  const success = printSummary();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('\n✗ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
