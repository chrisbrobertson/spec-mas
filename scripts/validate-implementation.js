#!/usr/bin/env node

/**
 * Spec-MAS v3 Implementation Validation Script
 *
 * Comprehensive validation system that ensures generated code meets spec requirements,
 * passes all tests, and is production-ready.
 *
 * Usage:
 *   node scripts/validate-implementation.js <spec-file-path> [options]
 *
 * Options:
 *   --impl-dir <path>           Implementation directory (default: src/ or implementation-output/)
 *   --report-only               Generate report without running tests
 *   --strict                    Fail on any warning
 *   --coverage-threshold <num>  Minimum test coverage % (default: 80)
 *   --output <path>             Output path for report (default: VALIDATION_REPORT.md)
 *   --json                      Also output JSON report
 *   --verbose                   Verbose logging
 *
 * Examples:
 *   npm run validate-impl docs/examples/level-3-filter-spec.md
 *   npm run validate-impl spec.md --strict --coverage-threshold 90
 *   npm run validate-impl spec.md --report-only --output custom-report.md
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');
const { execSync } = require('child_process');

// ==========================================
// Command Line Arguments
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Spec-MAS v3 Implementation Validation

Usage: node scripts/validate-implementation.js <spec-file-path> [options]

Options:
  --impl-dir <path>           Implementation directory (default: auto-detect)
  --report-only               Generate report without running tests
  --strict                    Fail on any warning
  --coverage-threshold <num>  Minimum test coverage % (default: 80)
  --output <path>             Output path for report (default: VALIDATION_REPORT.md)
  --json                      Also output JSON report
  --verbose                   Verbose logging

Examples:
  node scripts/validate-implementation.js docs/examples/level-3-filter-spec.md
  node scripts/validate-implementation.js spec.md --strict --coverage-threshold 90
    `);
    process.exit(0);
  }

  const config = {
    specPath: args[0],
    implDir: null,
    reportOnly: false,
    strict: false,
    coverageThreshold: 80,
    outputPath: 'VALIDATION_REPORT.md',
    outputJson: false,
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--impl-dir':
        config.implDir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--report-only':
        config.reportOnly = true;
        break;
      case '--strict':
        config.strict = true;
        break;
      case '--coverage-threshold':
        config.coverageThreshold = parseFloat(args[++i]);
        break;
      case '--output':
        config.outputPath = args[++i];
        break;
      case '--json':
        config.outputJson = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  return config;
}

// ==========================================
// Implementation Discovery
// ==========================================

function findImplementationDirectory(specPath, providedDir) {
  if (providedDir && fs.existsSync(providedDir)) {
    return providedDir;
  }

  // Try common locations
  const candidates = [
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'implementation-output'),
    path.join(process.cwd(), 'lib'),
    path.join(process.cwd(), 'app')
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

function findImplementationFiles(implDir) {
  if (!implDir || !fs.existsSync(implDir)) {
    return [];
  }

  const files = [];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walkDir(implDir);
  return files;
}

// ==========================================
// Requirement Coverage Check
// ==========================================

function checkRequirementCoverage(spec, implFiles, testFiles) {
  const requirements = spec.sections.functionalRequirements || [];
  const coverage = {
    total: requirements.length,
    implemented: 0,
    tested: 0,
    details: []
  };

  for (const req of requirements) {
    const reqCoverage = {
      id: req.id,
      description: req.description,
      hasImplementation: false,
      hasTests: false,
      implementationFiles: [],
      testFiles: []
    };

    // Search for implementation
    const reqIdPattern = req.id.replace(/[-_]/g, '[-_]?');
    const descWords = req.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    for (const file of implFiles) {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();

      // Check for requirement ID in comments or test names
      if (content.includes(req.id.toLowerCase()) ||
          descWords.some(word => content.includes(word) && descWords.filter(w => content.includes(w)).length >= 2)) {
        reqCoverage.hasImplementation = true;
        reqCoverage.implementationFiles.push(file);
      }
    }

    // Search for tests
    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();

      if (content.includes(req.id.toLowerCase()) ||
          descWords.some(word => content.includes(word) && descWords.filter(w => content.includes(w)).length >= 2)) {
        reqCoverage.hasTests = true;
        reqCoverage.testFiles.push(file);
      }
    }

    if (reqCoverage.hasImplementation) coverage.implemented++;
    if (reqCoverage.hasTests) coverage.tested++;

    coverage.details.push(reqCoverage);
  }

  coverage.implementationPercent = requirements.length > 0
    ? Math.round((coverage.implemented / requirements.length) * 100)
    : 0;
  coverage.testPercent = requirements.length > 0
    ? Math.round((coverage.tested / requirements.length) * 100)
    : 0;

  return coverage;
}

// ==========================================
// Test Execution
// ==========================================

function findTestFiles() {
  const testDirs = [
    path.join(process.cwd(), 'tests'),
    path.join(process.cwd(), 'test'),
    path.join(process.cwd(), '__tests__')
  ];

  const testFiles = [];

  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      function walkDir(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            walkDir(fullPath);
          } else if (entry.isFile() && /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(entry.name)) {
            testFiles.push(fullPath);
          }
        }
      }

      walkDir(dir);
    }
  }

  return testFiles;
}

function runTests(reportOnly, verbose) {
  if (reportOnly) {
    return {
      skipped: true,
      message: 'Test execution skipped (--report-only flag)'
    };
  }

  const results = {
    executed: true,
    passed: 0,
    failed: 0,
    total: 0,
    coverage: null,
    error: null
  };

  try {
    // Check if Jest is available
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      results.executed = false;
      results.error = 'No package.json found';
      return results;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasJest = packageJson.devDependencies?.jest || packageJson.dependencies?.jest;

    if (!hasJest) {
      results.executed = false;
      results.error = 'Jest not found in dependencies';
      return results;
    }

    // Run tests with coverage
    const output = execSync('npm test -- --coverage --json 2>&1', {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024
    }).toString();

    if (verbose) {
      console.log('Test output:', output);
    }

    // Parse Jest output (this is simplified - real implementation would parse JSON)
    const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+failed/);
    const totalMatch = output.match(/(\d+)\s+total/);

    if (passMatch) results.passed = parseInt(passMatch[1]);
    if (failMatch) results.failed = parseInt(failMatch[1]);
    if (totalMatch) results.total = parseInt(totalMatch[1]);

    // Try to extract coverage
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      results.coverage = parseFloat(coverageMatch[1]);
    }

  } catch (error) {
    results.error = error.message;
    // Even if tests fail, try to extract some info
    const output = error.stdout || error.stderr || '';
    const failMatch = output.match(/(\d+)\s+failed/);
    if (failMatch) results.failed = parseInt(failMatch[1]);
  }

  return results;
}

// ==========================================
// Code Quality Analysis
// ==========================================

function analyzeCodeQuality(implFiles) {
  const analysis = {
    totalFiles: implFiles.length,
    totalLines: 0,
    averageComplexity: 0,
    eslintIssues: { errors: 0, warnings: 0 },
    codeSmells: []
  };

  for (const file of implFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    analysis.totalLines += lines.length;

    // Check for code smells
    const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];

    // Long files
    if (lines.length > 300) {
      analysis.codeSmells.push({
        type: 'long-file',
        file: path.relative(process.cwd(), file),
        message: `File has ${lines.length} lines (>300)`
      });
    }

    // Check for long functions (simplified)
    let inFunction = false;
    let functionStart = 0;
    let functionName = '';
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inFunction && /function\s+(\w+)|const\s+(\w+)\s*=\s*\(/.test(line)) {
        inFunction = true;
        functionStart = i;
        functionName = line.match(/function\s+(\w+)|const\s+(\w+)/)?.[1] || 'anonymous';
        braceCount = 0;
      }

      if (inFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && functionStart !== i) {
          const functionLength = i - functionStart;
          if (functionLength > 50) {
            analysis.codeSmells.push({
              type: 'long-function',
              file: path.relative(process.cwd(), file),
              message: `Function ${functionName} has ${functionLength} lines (>50)`
            });
          }
          inFunction = false;
        }
      }
    }

    // Check nesting depth (simplified)
    for (const line of lines) {
      const indent = line.match(/^(\s*)/)[1].length;
      if (indent > 16) { // More than 4 levels (assuming 4 spaces per level)
        analysis.codeSmells.push({
          type: 'deep-nesting',
          file: path.relative(process.cwd(), file),
          message: 'Deep nesting detected (>4 levels)'
        });
        break; // Only report once per file
      }
    }
  }

  // Try to run ESLint
  try {
    const eslintPath = path.join(process.cwd(), 'node_modules', '.bin', 'eslint');
    if (fs.existsSync(eslintPath)) {
      const output = execSync(`${eslintPath} ${implFiles.join(' ')} --format json`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const results = JSON.parse(output);
      for (const result of results) {
        analysis.eslintIssues.errors += result.errorCount || 0;
        analysis.eslintIssues.warnings += result.warningCount || 0;
      }
    }
  } catch (error) {
    // ESLint not available or has issues
  }

  return analysis;
}

// ==========================================
// Security Scan
// ==========================================

function performSecurityScan(implFiles) {
  const scan = {
    hardcodedSecrets: [],
    vulnerabilities: [],
    securityIssues: []
  };

  // Secret patterns
  const secretPatterns = [
    { name: 'API Key', pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi },
    { name: 'Password', pattern: /['"]?password['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi },
    { name: 'Secret', pattern: /['"]?secret['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi },
    { name: 'Token', pattern: /['"]?token['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g }
  ];

  for (const file of implFiles) {
    const content = fs.readFileSync(file, 'utf8');

    for (const { name, pattern } of secretPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Ignore common false positives
        const value = match[1] || match[0];
        if (value && !value.includes('process.env') &&
            !value.includes('YOUR_') &&
            !value.includes('REPLACE') &&
            !value.includes('TODO') &&
            value.length > 5) {
          scan.hardcodedSecrets.push({
            type: name,
            file: path.relative(process.cwd(), file),
            preview: value.substring(0, 20) + '...'
          });
        }
      }
    }

    // Check for security anti-patterns
    if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
      scan.securityIssues.push({
        type: 'XSS Risk',
        file: path.relative(process.cwd(), file),
        message: 'Direct HTML injection detected'
      });
    }

    if (content.includes('eval(') || content.includes('new Function(')) {
      scan.securityIssues.push({
        type: 'Code Injection Risk',
        file: path.relative(process.cwd(), file),
        message: 'Dynamic code evaluation detected'
      });
    }

    if (/exec\(|spawn\(|execSync\(/.test(content)) {
      scan.securityIssues.push({
        type: 'Command Injection Risk',
        file: path.relative(process.cwd(), file),
        message: 'Command execution detected - ensure input is sanitized'
      });
    }
  }

  // Try npm audit
  try {
    const auditOutput = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const audit = JSON.parse(auditOutput);
    if (audit.metadata) {
      scan.vulnerabilities = {
        total: audit.metadata.vulnerabilities.total || 0,
        critical: audit.metadata.vulnerabilities.critical || 0,
        high: audit.metadata.vulnerabilities.high || 0,
        moderate: audit.metadata.vulnerabilities.moderate || 0,
        low: audit.metadata.vulnerabilities.low || 0
      };
    }
  } catch (error) {
    // npm audit failed or no issues
  }

  return scan;
}

// ==========================================
// Report Generation
// ==========================================

function generateReport(spec, coverage, testResults, qualityAnalysis, securityScan, config) {
  const timestamp = new Date().toISOString().split('T')[0];
  const specName = spec.metadata.name || 'Unknown Spec';

  // Determine overall status
  let status = 'PASSED';
  const issues = [];

  if (securityScan.hardcodedSecrets.length > 0) {
    status = 'FAILED';
    issues.push('Hardcoded secrets detected');
  }

  if (testResults.executed && testResults.failed > 0) {
    status = 'FAILED';
    issues.push(`${testResults.failed} test(s) failed`);
  }

  if (testResults.coverage !== null && testResults.coverage < config.coverageThreshold) {
    if (config.strict) {
      status = 'FAILED';
    } else {
      status = 'PASSED (with warnings)';
    }
    issues.push(`Coverage ${testResults.coverage}% below threshold ${config.coverageThreshold}%`);
  }

  if (coverage.implementationPercent < 100) {
    if (config.strict) {
      status = 'FAILED';
    } else {
      status = 'PASSED (with warnings)';
    }
    issues.push(`Only ${coverage.implementationPercent}% of requirements implemented`);
  }

  if (qualityAnalysis.eslintIssues.errors > 0) {
    if (config.strict) {
      status = 'FAILED';
    } else {
      status = 'PASSED (with warnings)';
    }
    issues.push(`${qualityAnalysis.eslintIssues.errors} ESLint error(s)`);
  }

  const statusIcon = status === 'PASSED' ? '✓' : status.includes('warnings') ? '⚠' : '✗';

  let report = `# Implementation Validation Report

## Summary
- **Spec**: ${specName}
- **Status**: ${statusIcon} ${status}
- **Validated**: ${timestamp}
- **Spec Maturity**: Level ${spec.metadata.maturity || 'N/A'}
- **Complexity**: ${spec.metadata.complexity || 'N/A'}

`;

  if (issues.length > 0) {
    report += `### Issues\n`;
    for (const issue of issues) {
      report += `- ${issue}\n`;
    }
    report += '\n';
  }

  report += `## Requirement Coverage

- **Total Requirements**: ${coverage.total}
- **Implemented**: ${coverage.implemented}/${coverage.total} (${coverage.implementationPercent}%)
- **Tested**: ${coverage.tested}/${coverage.total} (${coverage.testPercent}%)
`;

  if (testResults.coverage !== null) {
    report += `- **Test Coverage**: ${testResults.coverage}% (threshold: ${config.coverageThreshold}%)\n`;
  }

  report += '\n';

  // Test Results
  report += `## Test Results\n\n`;

  if (testResults.skipped) {
    report += `⊘ ${testResults.message}\n\n`;
  } else if (!testResults.executed) {
    report += `⊘ Tests not executed: ${testResults.error}\n\n`;
  } else {
    const testStatus = testResults.failed === 0 ? '✓' : '✗';
    report += `- **Status**: ${testStatus}\n`;
    report += `- **Total Tests**: ${testResults.total}\n`;
    report += `- **Passed**: ${testResults.passed}\n`;

    if (testResults.failed > 0) {
      report += `- **Failed**: ${testResults.failed}\n`;
    }

    if (testResults.coverage !== null) {
      const coverageStatus = testResults.coverage >= config.coverageThreshold ? '✓' : '⚠';
      report += `- **Coverage**: ${coverageStatus} ${testResults.coverage}%\n`;
    }

    report += '\n';
  }

  // Code Quality
  report += `## Code Quality\n\n`;
  report += `- **Total Files**: ${qualityAnalysis.totalFiles}\n`;
  report += `- **Total Lines**: ${qualityAnalysis.totalLines}\n`;

  if (qualityAnalysis.eslintIssues.errors > 0 || qualityAnalysis.eslintIssues.warnings > 0) {
    const eslintStatus = qualityAnalysis.eslintIssues.errors === 0 ? '⚠' : '✗';
    report += `- **ESLint**: ${eslintStatus} ${qualityAnalysis.eslintIssues.errors} errors, ${qualityAnalysis.eslintIssues.warnings} warnings\n`;
  } else {
    report += `- **ESLint**: ✓ No issues detected\n`;
  }

  if (qualityAnalysis.codeSmells.length > 0) {
    report += `- **Code Smells**: ⚠ ${qualityAnalysis.codeSmells.length} issues\n`;
  } else {
    report += `- **Code Smells**: ✓ No issues detected\n`;
  }

  report += '\n';

  if (qualityAnalysis.codeSmells.length > 0) {
    report += `### Code Smell Details\n\n`;
    const smellsByType = {};
    for (const smell of qualityAnalysis.codeSmells) {
      if (!smellsByType[smell.type]) smellsByType[smell.type] = [];
      smellsByType[smell.type].push(smell);
    }

    for (const [type, smells] of Object.entries(smellsByType)) {
      report += `**${type}** (${smells.length}):\n`;
      for (const smell of smells.slice(0, 5)) { // Limit to 5 per type
        report += `- ${smell.file}: ${smell.message}\n`;
      }
      if (smells.length > 5) {
        report += `- ... and ${smells.length - 5} more\n`;
      }
      report += '\n';
    }
  }

  // Security
  report += `## Security\n\n`;

  const secretStatus = securityScan.hardcodedSecrets.length === 0 ? '✓' : '✗';
  report += `- **Hardcoded Secrets**: ${secretStatus}`;
  if (securityScan.hardcodedSecrets.length > 0) {
    report += ` ${securityScan.hardcodedSecrets.length} found\n`;
  } else {
    report += ` None detected\n`;
  }

  if (securityScan.vulnerabilities) {
    const vulnTotal = securityScan.vulnerabilities.critical + securityScan.vulnerabilities.high;
    const vulnStatus = vulnTotal === 0 ? '✓' : '✗';
    report += `- **Dependency Vulnerabilities**: ${vulnStatus}`;
    if (vulnTotal > 0) {
      report += ` ${securityScan.vulnerabilities.critical} critical, ${securityScan.vulnerabilities.high} high\n`;
    } else {
      report += ` None detected\n`;
    }
  }

  const secIssueStatus = securityScan.securityIssues.length === 0 ? '✓' : '⚠';
  report += `- **Security Patterns**: ${secIssueStatus}`;
  if (securityScan.securityIssues.length > 0) {
    report += ` ${securityScan.securityIssues.length} potential issues\n`;
  } else {
    report += ` No issues detected\n`;
  }

  report += '\n';

  if (securityScan.hardcodedSecrets.length > 0) {
    report += `### Hardcoded Secrets Found\n\n`;
    for (const secret of securityScan.hardcodedSecrets) {
      report += `- **${secret.type}** in ${secret.file}\n`;
    }
    report += '\n';
  }

  if (securityScan.securityIssues.length > 0) {
    report += `### Security Issues\n\n`;
    for (const issue of securityScan.securityIssues) {
      report += `- **${issue.type}** in ${issue.file}: ${issue.message}\n`;
    }
    report += '\n';
  }

  // Compliance
  report += `## Compliance\n\n`;

  // Check spec requirements
  const hasErrorHandling = coverage.details.some(d =>
    d.description.toLowerCase().includes('error') && d.hasImplementation
  );
  const hasValidation = coverage.details.some(d =>
    d.description.toLowerCase().includes('validat') && d.hasImplementation
  );
  const hasSecurity = spec.sections.security || spec.sections.security_considerations;

  report += `- **Error Handling**: ${hasErrorHandling ? '✓' : '⚠'} ${hasErrorHandling ? 'Implemented' : 'Not detected'}\n`;
  report += `- **Input Validation**: ${hasValidation ? '✓' : '⚠'} ${hasValidation ? 'Implemented' : 'Not detected'}\n`;
  report += `- **Security Requirements**: ${hasSecurity ? '✓' : '⊘'} ${hasSecurity ? 'Specified' : 'Not specified in spec'}\n`;

  report += '\n';

  // Recommendations
  const recommendations = [];

  if (testResults.failed > 0) {
    recommendations.push(`Fix ${testResults.failed} failing test(s)`);
  }

  if (testResults.coverage !== null && testResults.coverage < config.coverageThreshold) {
    recommendations.push(`Increase test coverage from ${testResults.coverage}% to ${config.coverageThreshold}%`);
  }

  if (coverage.tested < coverage.total) {
    recommendations.push(`Add tests for ${coverage.total - coverage.tested} untested requirement(s)`);
  }

  if (securityScan.hardcodedSecrets.length > 0) {
    recommendations.push('Remove hardcoded secrets and use environment variables');
  }

  if (qualityAnalysis.codeSmells.some(s => s.type === 'long-function')) {
    recommendations.push('Refactor long functions into smaller, more maintainable units');
  }

  if (securityScan.securityIssues.length > 0) {
    recommendations.push('Review and address security issues');
  }

  if (recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });
    report += '\n';
  }

  // Traceability Matrix
  report += `## Traceability Matrix\n\n`;
  report += `| Requirement | Implementation | Tests | Status |\n`;
  report += `|-------------|----------------|-------|--------|\n`;

  for (const req of coverage.details) {
    const implStatus = req.hasImplementation ? '✓' : '✗';
    const testStatus = req.hasTests ? '✓' : '✗';
    const overallStatus = req.hasImplementation && req.hasTests ? 'COMPLETE' :
                         req.hasImplementation ? 'PARTIAL' : 'MISSING';

    const implFiles = req.implementationFiles.length > 0
      ? req.implementationFiles.map(f => path.relative(process.cwd(), f)).join(', ')
      : '—';
    const testFiles = req.testFiles.length > 0
      ? req.testFiles.map(f => path.relative(process.cwd(), f)).join(', ')
      : '—';

    report += `| ${req.id} | ${implStatus} ${implFiles.substring(0, 30)}${implFiles.length > 30 ? '...' : ''} | ${testStatus} ${testFiles.substring(0, 30)}${testFiles.length > 30 ? '...' : ''} | ${overallStatus} |\n`;
  }

  report += `\n---\n\n`;
  report += `*Report generated by Spec-MAS v3 Implementation Validation*\n`;

  return report;
}

// ==========================================
// Main Execution
// ==========================================

function main() {
  const config = parseArguments();

  console.log('════════════════════════════════════════════════════════');
  console.log('  SPEC-MAS IMPLEMENTATION VALIDATION');
  console.log('════════════════════════════════════════════════════════\n');

  // 1. Load Spec
  console.log('Loading specification...');
  const spec = parseSpec(config.specPath);
  console.log(`✓ Loaded: ${spec.metadata.name || 'Unknown'}`);
  console.log(`  Maturity: Level ${spec.metadata.maturity || 'N/A'}`);
  console.log(`  Requirements: ${spec.sections.functionalRequirements?.length || 0}\n`);

  // 2. Find Implementation
  console.log('Finding implementation files...');
  const implDir = findImplementationDirectory(config.specPath, config.implDir);

  if (!implDir) {
    console.error('✗ No implementation directory found');
    console.error('  Tried: src/, implementation-output/, lib/, app/');
    console.error('  Use --impl-dir to specify custom location\n');
    process.exit(1);
  }

  const implFiles = findImplementationFiles(implDir);
  console.log(`✓ Found ${implFiles.length} implementation files in ${path.relative(process.cwd(), implDir)}\n`);

  // 3. Find Test Files
  console.log('Finding test files...');
  const testFiles = findTestFiles();
  console.log(`✓ Found ${testFiles.length} test files\n`);

  // 4. Check Requirement Coverage
  console.log('Analyzing requirement coverage...');
  const coverage = checkRequirementCoverage(spec, implFiles, testFiles);
  console.log(`✓ Implementation: ${coverage.implementationPercent}%`);
  console.log(`✓ Test Coverage: ${coverage.testPercent}%\n`);

  // 5. Run Tests
  console.log('Running tests...');
  const testResults = runTests(config.reportOnly, config.verbose);
  if (testResults.skipped) {
    console.log(`⊘ ${testResults.message}\n`);
  } else if (!testResults.executed) {
    console.log(`⊘ ${testResults.error}\n`);
  } else {
    console.log(`✓ Tests completed: ${testResults.passed}/${testResults.total} passed`);
    if (testResults.coverage !== null) {
      console.log(`  Coverage: ${testResults.coverage}%\n`);
    }
  }

  // 6. Analyze Code Quality
  console.log('Analyzing code quality...');
  const qualityAnalysis = analyzeCodeQuality(implFiles);
  console.log(`✓ Analyzed ${qualityAnalysis.totalFiles} files (${qualityAnalysis.totalLines} lines)`);
  if (qualityAnalysis.codeSmells.length > 0) {
    console.log(`  ⚠ Found ${qualityAnalysis.codeSmells.length} code smell(s)`);
  }
  console.log();

  // 7. Security Scan
  console.log('Running security scan...');
  const securityScan = performSecurityScan(implFiles);
  const criticalIssues = securityScan.hardcodedSecrets.length +
                        (securityScan.vulnerabilities?.critical || 0) +
                        (securityScan.vulnerabilities?.high || 0);

  if (criticalIssues > 0) {
    console.log(`✗ Found ${criticalIssues} critical security issue(s)`);
  } else {
    console.log(`✓ No critical security issues detected`);
  }
  console.log();

  // 8. Generate Report
  console.log('Generating validation report...');
  const report = generateReport(spec, coverage, testResults, qualityAnalysis, securityScan, config);

  fs.writeFileSync(config.outputPath, report, 'utf8');
  console.log(`✓ Report saved to ${config.outputPath}`);

  // Generate JSON report if requested
  if (config.outputJson) {
    const jsonReport = {
      spec: {
        name: spec.metadata.name,
        maturity: spec.metadata.maturity,
        complexity: spec.metadata.complexity
      },
      timestamp: new Date().toISOString(),
      coverage,
      testResults,
      qualityAnalysis,
      securityScan
    };

    const jsonPath = config.outputPath.replace(/\.md$/, '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');
    console.log(`✓ JSON report saved to ${jsonPath}`);
  }

  console.log('\n════════════════════════════════════════════════════════');

  // Determine exit code
  if (securityScan.hardcodedSecrets.length > 0) {
    console.log('✗ VALIDATION FAILED: Security issues detected\n');
    process.exit(1);
  }

  if (testResults.executed && testResults.failed > 0) {
    console.log('✗ VALIDATION FAILED: Tests failed\n');
    process.exit(1);
  }

  if (config.strict) {
    if (coverage.implementationPercent < 100 ||
        coverage.testPercent < 100 ||
        (testResults.coverage !== null && testResults.coverage < config.coverageThreshold) ||
        qualityAnalysis.eslintIssues.errors > 0) {
      console.log('✗ VALIDATION FAILED: Strict mode violations\n');
      process.exit(1);
    }
  }

  console.log('✓ VALIDATION PASSED\n');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findImplementationDirectory,
  findImplementationFiles,
  checkRequirementCoverage,
  runTests,
  analyzeCodeQuality,
  performSecurityScan,
  generateReport
};
