#!/usr/bin/env node

/**
 * Verify that all sections from executive-assistant.md are properly extracted
 * Shows which sections from the spec are detected and parsed
 */

const { parseSpec } = require('./spec-parser.js');
const path = require('path');
const util = require('util');

console.log('\n=== Section Extraction Verification ===\n');
console.log('Spec: specs/executive-assistant.md\n');

const specPath = path.join(__dirname, '../specs/executive-assistant.md');
const parsed = parseSpec(specPath);

// The sections we expect based on the task description
const expectedSections = [
  { line: 20, name: 'Overview', key: 'overview' },
  { line: 69, name: 'Functional Requirements', key: 'functional_requirements' },
  { line: 244, name: 'Non-Functional Requirements', key: 'non_functional_requirements' },
  { line: 326, name: 'Security Considerations', key: 'security' },
  { line: 403, name: 'Data Model', key: 'data_model' },
  { line: 758, name: 'Interfaces & Contracts', key: 'interfaces_and_contracts' },
  { line: 883, name: 'Deterministic Tests', key: 'deterministic_tests' }
];

console.log('Expected Sections (from task description):\n');

for (const section of expectedSections) {
  const found = parsed.sections[section.key];
  const status = found ? '✓' : '✗';

  console.log(`${status} Line ${section.line}: ## ${section.name}`);
  console.log(`   Mapped to key: "${section.key}"`);

  if (found) {
    if (typeof found === 'string') {
      const preview = found.substring(0, 100).replace(/\n/g, ' ');
      console.log(`   Content type: string`);
      console.log(`   Length: ${found.length} chars`);
      console.log(`   Preview: ${preview}...`);
    } else {
      const subsections = Object.keys(found);
      console.log(`   Content type: object (has subsections)`);
      console.log(`   Subsections (${subsections.length}): ${subsections.slice(0, 5).join(', ')}${subsections.length > 5 ? '...' : ''}`);
    }
  } else {
    console.log(`   ✗ NOT FOUND`);
  }
  console.log();
}

// Summary
const foundCount = expectedSections.filter(s => parsed.sections[s.key]).length;
console.log('='.repeat(70));
console.log(`Summary: ${foundCount}/${expectedSections.length} sections successfully extracted`);
console.log('='.repeat(70));

if (foundCount === expectedSections.length) {
  console.log('\n✓ All expected sections from executive-assistant.md are properly extracted!\n');
  process.exit(0);
} else {
  console.log(`\n✗ Missing ${expectedSections.length - foundCount} section(s)\n`);
  process.exit(1);
}
