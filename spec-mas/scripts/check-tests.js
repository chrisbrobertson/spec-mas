#!/usr/bin/env node

/**
 * Spec-MAS placeholder assertion checker
 * Fails if tests include placeholder assertions or TODO markers.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_PATHS = [
  path.join(process.cwd(), 'spec-mas', 'tests'),
  path.join(process.cwd(), 'tests'),
  path.join(process.cwd(), 'examples')
];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'spec-mas/templates',
  'docs',
  'implementation-output',
  'tests-auth'
]);
const IGNORE_FILES = new Set([
  path.join(process.cwd(), 'spec-mas', 'tests', 'unit', 'check-tests.test.js')
]);

const PLACEHOLDER_PATTERNS = [
  /expect\s*\(\s*true\s*\)\.toBe\s*\(\s*true\s*\)/,
  /TODO:\s*Replace with actual assertions/
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function isTestFile(filePath) {
  return /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(filePath);
}

function findPlaceholderAssertions(searchPaths = DEFAULT_PATHS) {
  const matches = [];
  for (const basePath of searchPaths) {
    const files = walk(basePath);
    for (const filePath of files) {
      if (!isTestFile(filePath)) continue;
      if (IGNORE_FILES.has(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(content)) {
          matches.push({ filePath, pattern: pattern.toString() });
          break;
        }
      }
    }
  }
  return matches;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { paths: DEFAULT_PATHS };
  const pathIndex = args.indexOf('--paths');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    config.paths = args[pathIndex + 1]
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => path.resolve(process.cwd(), p));
  }
  return config;
}

if (require.main === module) {
  const { paths: searchPaths } = parseArgs();
  const matches = findPlaceholderAssertions(searchPaths);
  if (matches.length > 0) {
    console.error('❌ Placeholder assertions found:');
    matches.forEach(match => {
      console.error(`  - ${match.filePath}`);
    });
    process.exit(1);
  }
  console.log('✅ No placeholder assertions found');
  process.exit(0);
}

module.exports = {
  findPlaceholderAssertions,
  PLACEHOLDER_PATTERNS
};
