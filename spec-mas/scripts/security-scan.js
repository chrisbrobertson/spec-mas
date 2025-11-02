#!/usr/bin/env node

/**
 * Spec-MAS v3 Security Scanner
 *
 * Dedicated security scanning tool for implementation files.
 * Checks for hardcoded secrets, dependency vulnerabilities, and security anti-patterns.
 *
 * Usage:
 *   node scripts/security-scan.js [directory] [options]
 *
 * Options:
 *   --dir <path>        Directory to scan (default: src/)
 *   --output <path>     Output report file (optional)
 *   --json              Output in JSON format
 *   --strict            Fail on any security issue
 *   --verbose           Detailed output
 *
 * Examples:
 *   npm run security-scan
 *   npm run security-scan -- --dir implementation-output
 *   npm run security-scan -- --strict --output security-report.txt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==========================================
// Secret Detection Patterns
// ==========================================

const SECRET_PATTERNS = [
  {
    name: 'API Key',
    pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
    severity: 'high'
  },
  {
    name: 'Secret Key',
    pattern: /['"]?secret[_-]?key['"]?\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
    severity: 'high'
  },
  {
    name: 'Password',
    pattern: /['"]?password['"]?\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
    severity: 'critical'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
    severity: 'critical'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/gi,
    severity: 'critical'
  },
  {
    name: 'GitHub Token',
    pattern: /gh[prs]_[A-Za-z0-9_]{36,}/g,
    severity: 'critical'
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    severity: 'high'
  },
  {
    name: 'Generic Token',
    pattern: /['"]?token['"]?\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
    severity: 'medium'
  },
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
    severity: 'high'
  },
  {
    name: 'Database URL',
    pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/gi,
    severity: 'high'
  },
  {
    name: 'Connection String',
    pattern: /['"]?connection[_-]?string['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi,
    severity: 'high'
  }
];

// Whitelist patterns to ignore
const WHITELIST_PATTERNS = [
  /process\.env\./i,
  /YOUR_API_KEY/i,
  /REPLACE_ME/i,
  /TODO/i,
  /FIXME/i,
  /EXAMPLE/i,
  /TEST_KEY/i,
  /DUMMY/i,
  /PLACEHOLDER/i,
  /<your-.*?>/i,
  /\$\{.*?\}/,  // Template variables
  /xxx+/i,      // Placeholder x's
  /aaa+/i       // Placeholder a's
];

// ==========================================
// Security Anti-Patterns
// ==========================================

const SECURITY_PATTERNS = [
  {
    name: 'XSS - innerHTML',
    pattern: /\.innerHTML\s*=/gi,
    message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
    severity: 'high'
  },
  {
    name: 'XSS - dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/gi,
    message: 'React dangerouslySetInnerHTML can lead to XSS if not properly sanitized',
    severity: 'high'
  },
  {
    name: 'Code Injection - eval',
    pattern: /\beval\s*\(/gi,
    message: 'eval() can execute arbitrary code and is a security risk',
    severity: 'critical'
  },
  {
    name: 'Code Injection - Function constructor',
    pattern: /new\s+Function\s*\(/gi,
    message: 'Function constructor can execute arbitrary code',
    severity: 'critical'
  },
  {
    name: 'Command Injection - exec',
    pattern: /\b(exec|execSync|spawn|spawnSync)\s*\(/gi,
    message: 'Command execution - ensure input is properly sanitized',
    severity: 'high'
  },
  {
    name: 'SQL Injection Risk',
    pattern: /query\s*\(\s*['"`][^'"]*\$\{|query\s*\(\s*['"`].*?\+/gi,
    message: 'Possible SQL injection - use parameterized queries',
    severity: 'high'
  },
  {
    name: 'Insecure Random',
    pattern: /Math\.random\s*\(/gi,
    message: 'Math.random() is not cryptographically secure - use crypto.randomBytes()',
    severity: 'medium'
  },
  {
    name: 'Weak Crypto - MD5',
    pattern: /\bmd5\s*\(/gi,
    message: 'MD5 is cryptographically broken - use SHA-256 or better',
    severity: 'high'
  },
  {
    name: 'Weak Crypto - SHA1',
    pattern: /\bsha1\s*\(/gi,
    message: 'SHA-1 is deprecated - use SHA-256 or better',
    severity: 'medium'
  },
  {
    name: 'Hardcoded localhost',
    pattern: /https?:\/\/localhost:\d+/gi,
    message: 'Hardcoded localhost URL - should be configurable',
    severity: 'low'
  },
  {
    name: 'Disabled SSL Verification',
    pattern: /rejectUnauthorized\s*:\s*false/gi,
    message: 'SSL verification disabled - major security risk',
    severity: 'critical'
  },
  {
    name: 'CORS wildcard',
    pattern: /Access-Control-Allow-Origin['"]?\s*:\s*['"]?\*/gi,
    message: 'CORS allows all origins - too permissive',
    severity: 'medium'
  }
];

// ==========================================
// File Discovery
// ==========================================

function findSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip certain directories
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name.startsWith('.')) {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        // Include source files and config files
        if (/\.(js|jsx|ts|tsx|json|env|yaml|yml|config)$/.test(entry.name) ||
            entry.name === '.env' ||
            entry.name === '.env.example') {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dir);
  return files;
}

// ==========================================
// Secret Detection
// ==========================================

function scanForSecrets(files, verbose) {
  const findings = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      // Skip .env.example - it should have placeholder values
      if (file.endsWith('.env.example')) {
        continue;
      }

      for (const { name, pattern, severity } of SECRET_PATTERNS) {
        const matches = [...content.matchAll(pattern)];

        for (const match of matches) {
          const matchedText = match[0];
          const value = match[1] || match[0];

          // Check whitelist
          const isWhitelisted = WHITELIST_PATTERNS.some(wp => wp.test(matchedText));

          if (isWhitelisted) {
            if (verbose) {
              console.log(`  Skipped whitelisted: ${name} in ${relativePath}`);
            }
            continue;
          }

          // Additional heuristics
          if (value.length < 8) continue; // Too short to be a real secret
          if (/^[a-z]{1,3}$/.test(value)) continue; // Single word

          findings.push({
            type: name,
            severity,
            file: relativePath,
            line: getLineNumber(content, match.index),
            preview: value.substring(0, 30) + (value.length > 30 ? '...' : '')
          });
        }
      }
    } catch (error) {
      if (verbose) {
        console.error(`Error scanning ${file}: ${error.message}`);
      }
    }
  }

  return findings;
}

// ==========================================
// Security Pattern Detection
// ==========================================

function scanSecurityPatterns(files, verbose) {
  const findings = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      for (const { name, pattern, message, severity } of SECURITY_PATTERNS) {
        const matches = [...content.matchAll(pattern)];

        for (const match of matches) {
          // Additional context-aware filtering
          const lineContent = getLineContent(content, match.index);

          // Skip commented lines
          if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) {
            continue;
          }

          findings.push({
            type: name,
            severity,
            file: relativePath,
            line: getLineNumber(content, match.index),
            message,
            snippet: lineContent.trim()
          });
        }
      }
    } catch (error) {
      if (verbose) {
        console.error(`Error scanning ${file}: ${error.message}`);
      }
    }
  }

  return findings;
}

// ==========================================
// Dependency Vulnerability Check
// ==========================================

function checkDependencyVulnerabilities(verbose) {
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        executed: false,
        error: 'No package.json found'
      };
    }

    if (verbose) {
      console.log('  Running npm audit...');
    }

    const auditOutput = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const audit = JSON.parse(auditOutput);

    const result = {
      executed: true,
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
      vulnerabilities: []
    };

    if (audit.metadata && audit.metadata.vulnerabilities) {
      result.total = audit.metadata.vulnerabilities.total || 0;
      result.critical = audit.metadata.vulnerabilities.critical || 0;
      result.high = audit.metadata.vulnerabilities.high || 0;
      result.moderate = audit.metadata.vulnerabilities.moderate || 0;
      result.low = audit.metadata.vulnerabilities.low || 0;
      result.info = audit.metadata.vulnerabilities.info || 0;
    }

    // Extract vulnerability details
    if (audit.vulnerabilities) {
      for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          result.vulnerabilities.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.via?.[0]?.title || 'Unknown',
            range: vuln.range || 'Unknown'
          });
        }
      }
    }

    return result;

  } catch (error) {
    if (error.status === 0) {
      // npm audit returns 0 for no vulnerabilities
      return {
        executed: true,
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
        vulnerabilities: []
      };
    }

    if (verbose) {
      console.error(`  npm audit failed: ${error.message}`);
    }

    return {
      executed: false,
      error: error.message
    };
  }
}

// ==========================================
// Environment File Check
// ==========================================

function checkEnvironmentFiles(scanDir) {
  const issues = [];

  // Check if .env file exists
  const envPath = path.join(scanDir, '.env');
  if (fs.existsSync(envPath)) {
    issues.push({
      type: 'warning',
      message: '.env file found - ensure it is in .gitignore'
    });

    // Check if .env is in .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.env')) {
        issues.push({
          type: 'critical',
          message: '.env file is NOT in .gitignore - SECURITY RISK!'
        });
      }
    } else {
      issues.push({
        type: 'warning',
        message: 'No .gitignore found'
      });
    }
  }

  // Check if .env.example exists
  const envExamplePath = path.join(scanDir, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    issues.push({
      type: 'info',
      message: '.env.example not found - consider creating one for documentation'
    });
  }

  return issues;
}

// ==========================================
// Helper Functions
// ==========================================

function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

function getLineContent(content, index) {
  const lines = content.split('\n');
  const lineNum = getLineNumber(content, index) - 1;
  return lines[lineNum] || '';
}

// ==========================================
// Report Generation
// ==========================================

function generateReport(scanResults, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(scanResults, null, 2);
  }

  // Text format
  let report = '';

  report += '════════════════════════════════════════════════════════\n';
  report += '  SECURITY SCAN RESULTS\n';
  report += '════════════════════════════════════════════════════════\n\n';

  report += `Scanned: ${scanResults.filesScanned} files\n`;
  report += `Directory: ${scanResults.directory}\n\n`;

  // Secret Detection
  report += '─── Secret Detection ────────────────────────────────────\n';

  if (scanResults.secrets.length === 0) {
    report += '  ✓ No hardcoded secrets found\n';
  } else {
    report += `  ✗ ${scanResults.secrets.length} potential secret(s) detected\n\n`;

    const criticalSecrets = scanResults.secrets.filter(s => s.severity === 'critical');
    const highSecrets = scanResults.secrets.filter(s => s.severity === 'high');

    if (criticalSecrets.length > 0) {
      report += `  Critical (${criticalSecrets.length}):\n`;
      for (const secret of criticalSecrets) {
        report += `    - ${secret.type} in ${secret.file}:${secret.line}\n`;
        report += `      Preview: ${secret.preview}\n`;
      }
      report += '\n';
    }

    if (highSecrets.length > 0) {
      report += `  High (${highSecrets.length}):\n`;
      for (const secret of highSecrets.slice(0, 5)) {
        report += `    - ${secret.type} in ${secret.file}:${secret.line}\n`;
      }
      if (highSecrets.length > 5) {
        report += `    ... and ${highSecrets.length - 5} more\n`;
      }
      report += '\n';
    }
  }

  // Environment Files
  if (scanResults.envIssues.length > 0) {
    const critical = scanResults.envIssues.filter(i => i.type === 'critical');
    if (critical.length > 0) {
      report += `  ✗ Environment file issues:\n`;
      for (const issue of critical) {
        report += `    - ${issue.message}\n`;
      }
    }
  }

  report += '\n';

  // Dependency Vulnerabilities
  report += '─── Dependency Vulnerabilities ──────────────────────────\n';

  if (!scanResults.dependencies.executed) {
    report += `  ⊘ Not checked: ${scanResults.dependencies.error}\n`;
  } else if (scanResults.dependencies.total === 0) {
    report += '  ✓ No vulnerabilities found\n';
  } else {
    const critHigh = scanResults.dependencies.critical + scanResults.dependencies.high;

    if (critHigh > 0) {
      report += `  ✗ ${critHigh} critical/high vulnerabilities\n`;
      report += `    - Critical: ${scanResults.dependencies.critical}\n`;
      report += `    - High: ${scanResults.dependencies.high}\n`;

      if (scanResults.dependencies.vulnerabilities.length > 0) {
        report += '\n  Details:\n';
        for (const vuln of scanResults.dependencies.vulnerabilities.slice(0, 5)) {
          report += `    - ${vuln.package} (${vuln.severity}): ${vuln.title}\n`;
        }
      }
    } else {
      report += `  ⚠ ${scanResults.dependencies.moderate + scanResults.dependencies.low} moderate/low vulnerabilities\n`;
      report += `    - Moderate: ${scanResults.dependencies.moderate}\n`;
      report += `    - Low: ${scanResults.dependencies.low}\n`;
    }
  }

  report += '\n';

  // Security Patterns
  report += '─── Code Pattern Analysis ───────────────────────────────\n';

  if (scanResults.patterns.length === 0) {
    report += '  ✓ No security anti-patterns detected\n';
  } else {
    const criticalPatterns = scanResults.patterns.filter(p => p.severity === 'critical');
    const highPatterns = scanResults.patterns.filter(p => p.severity === 'high');

    report += `  ⚠ ${scanResults.patterns.length} potential issue(s) found\n\n`;

    if (criticalPatterns.length > 0) {
      report += `  Critical (${criticalPatterns.length}):\n`;
      for (const pattern of criticalPatterns) {
        report += `    - ${pattern.type} in ${pattern.file}:${pattern.line}\n`;
        report += `      ${pattern.message}\n`;
      }
      report += '\n';
    }

    if (highPatterns.length > 0) {
      report += `  High (${highPatterns.length}):\n`;
      for (const pattern of highPatterns.slice(0, 5)) {
        report += `    - ${pattern.type} in ${pattern.file}:${pattern.line}\n`;
        report += `      ${pattern.message}\n`;
      }
      if (highPatterns.length > 5) {
        report += `    ... and ${highPatterns.length - 5} more\n`;
      }
      report += '\n';
    }
  }

  // Security Score
  report += '\n════════════════════════════════════════════════════════\n';

  const score = calculateSecurityScore(scanResults);
  let scoreLabel = 'Excellent';
  if (score < 5) scoreLabel = 'Poor';
  else if (score < 7) scoreLabel = 'Fair';
  else if (score < 9) scoreLabel = 'Good';

  report += `Security Score: ${score}/10 (${scoreLabel})\n\n`;

  const totalCritical = (scanResults.secrets.filter(s => s.severity === 'critical').length +
                         scanResults.dependencies.critical +
                         scanResults.patterns.filter(p => p.severity === 'critical').length);

  const totalHigh = (scanResults.secrets.filter(s => s.severity === 'high').length +
                     scanResults.dependencies.high +
                     scanResults.patterns.filter(p => p.severity === 'high').length);

  const totalMedium = (scanResults.secrets.filter(s => s.severity === 'medium').length +
                       scanResults.dependencies.moderate +
                       scanResults.patterns.filter(p => p.severity === 'medium').length);

  report += `Critical Issues: ${totalCritical}\n`;
  report += `High Issues: ${totalHigh}\n`;
  report += `Medium Issues: ${totalMedium}\n`;
  report += `Low Issues: ${scanResults.dependencies.low + scanResults.patterns.filter(p => p.severity === 'low').length}\n`;
  report += '════════════════════════════════════════════════════════\n';

  return report;
}

function calculateSecurityScore(results) {
  let score = 10;

  // Deduct for secrets
  const criticalSecrets = results.secrets.filter(s => s.severity === 'critical').length;
  const highSecrets = results.secrets.filter(s => s.severity === 'high').length;

  score -= criticalSecrets * 2;
  score -= highSecrets * 1;

  // Deduct for vulnerabilities
  score -= results.dependencies.critical * 2;
  score -= results.dependencies.high * 1;
  score -= results.dependencies.moderate * 0.5;

  // Deduct for patterns
  const criticalPatterns = results.patterns.filter(p => p.severity === 'critical').length;
  const highPatterns = results.patterns.filter(p => p.severity === 'high').length;

  score -= criticalPatterns * 1.5;
  score -= highPatterns * 0.5;

  // Environment issues
  const criticalEnv = results.envIssues.filter(i => i.type === 'critical').length;
  score -= criticalEnv * 2;

  return Math.max(0, Math.min(10, score));
}

// ==========================================
// Main Execution
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  const config = {
    dir: null,
    output: null,
    json: false,
    strict: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Spec-MAS v3 Security Scanner

Usage: node scripts/security-scan.js [options]

Options:
  --dir <path>        Directory to scan (default: src/)
  --output <path>     Output report file (optional)
  --json              Output in JSON format
  --strict            Fail on any security issue
  --verbose           Detailed output

Examples:
  node scripts/security-scan.js
  node scripts/security-scan.js --dir implementation-output
  node scripts/security-scan.js --strict --output security-report.txt
        `);
        process.exit(0);
        break;
      case '--dir':
        config.dir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--json':
        config.json = true;
        break;
      case '--strict':
        config.strict = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  return config;
}

function main() {
  const config = parseArguments();

  // Determine scan directory
  const scanDir = config.dir || path.join(process.cwd(), 'src');

  if (!fs.existsSync(scanDir)) {
    console.error(`Error: Directory not found: ${scanDir}`);
    process.exit(1);
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('  SPEC-MAS SECURITY SCANNER');
  console.log('════════════════════════════════════════════════════════\n');

  console.log(`Scanning directory: ${path.relative(process.cwd(), scanDir)}\n`);

  // Find files
  console.log('Finding source files...');
  const files = findSourceFiles(scanDir);
  console.log(`✓ Found ${files.length} files\n`);

  // Scan for secrets
  console.log('Scanning for hardcoded secrets...');
  const secrets = scanForSecrets(files, config.verbose);
  console.log(`✓ Complete (${secrets.length} findings)\n`);

  // Scan for security patterns
  console.log('Scanning for security anti-patterns...');
  const patterns = scanSecurityPatterns(files, config.verbose);
  console.log(`✓ Complete (${patterns.length} findings)\n`);

  // Check environment files
  console.log('Checking environment files...');
  const envIssues = checkEnvironmentFiles(scanDir);
  console.log(`✓ Complete\n`);

  // Check dependencies
  console.log('Checking dependency vulnerabilities...');
  const dependencies = checkDependencyVulnerabilities(config.verbose);
  if (dependencies.executed) {
    console.log(`✓ Complete (${dependencies.total} vulnerabilities)\n`);
  } else {
    console.log(`⊘ ${dependencies.error}\n`);
  }

  // Compile results
  const scanResults = {
    timestamp: new Date().toISOString(),
    directory: path.relative(process.cwd(), scanDir),
    filesScanned: files.length,
    secrets,
    patterns,
    envIssues,
    dependencies
  };

  // Generate report
  const report = generateReport(scanResults, config.json ? 'json' : 'text');

  // Output report
  if (config.output) {
    fs.writeFileSync(config.output, report, 'utf8');
    console.log(`Report saved to: ${config.output}\n`);
  } else {
    console.log(report);
  }

  // Determine exit code
  const criticalIssues = (
    secrets.filter(s => s.severity === 'critical').length +
    dependencies.critical +
    patterns.filter(p => p.severity === 'critical').length +
    envIssues.filter(i => i.type === 'critical').length
  );

  const highIssues = (
    secrets.filter(s => s.severity === 'high').length +
    dependencies.high +
    patterns.filter(p => p.severity === 'high').length
  );

  if (criticalIssues > 0) {
    console.error(`\n✗ CRITICAL: ${criticalIssues} critical security issue(s) found\n`);
    process.exit(1);
  }

  if (config.strict && (highIssues > 0 || criticalIssues > 0)) {
    console.error(`\n✗ STRICT MODE: ${highIssues} high severity issue(s) found\n`);
    process.exit(1);
  }

  console.log('\n✓ Security scan complete\n');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  scanForSecrets,
  scanSecurityPatterns,
  checkDependencyVulnerabilities,
  checkEnvironmentFiles,
  generateReport,
  calculateSecurityScore
};
