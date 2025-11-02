#!/usr/bin/env node

/**
 * Spec-MAS v3 Review Approval System
 * Interactive approval workflow for human-in-the-loop review
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Create readline interface for interactive input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask a yes/no question
 */
function askYesNo(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Ask for text input
 */
function askText(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Display a finding for review
 */
function displayFinding(finding, index, total, severity) {
  const severityColors = {
    critical: 'red',
    high: 'yellow',
    medium: 'cyan',
    low: 'blue',
    info: 'gray'
  };

  console.log('\n' + colorize('─'.repeat(80), 'gray'));
  console.log(colorize(`Finding ${index} of ${total} [${severity.toUpperCase()}]`, severityColors[severity]));
  console.log(colorize('─'.repeat(80), 'gray'));
  console.log(colorize(`\nReviewer: ${finding.reviewer}`, 'gray'));
  console.log(colorize(`\nTitle: ${finding.title}`, 'bright'));
  console.log('');

  // Display content (first 20 lines)
  const lines = finding.content.split('\n').slice(0, 20);
  for (const line of lines) {
    console.log(line);
  }

  if (finding.content.split('\n').length > 20) {
    console.log(colorize('\n... (content truncated, see full report)', 'gray'));
  }
}

/**
 * Review critical and high findings interactively
 */
async function reviewFindings(findings, severity) {
  if (findings.length === 0) {
    return [];
  }

  const rl = createInterface();
  const acknowledged = [];

  console.log(colorize(`\n${'═'.repeat(80)}`, 'cyan'));
  console.log(colorize(`  REVIEWING ${severity.toUpperCase()} SEVERITY FINDINGS`, 'bright'));
  console.log(colorize(`${'═'.repeat(80)}`, 'cyan'));

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    displayFinding(finding, i + 1, findings.length, severity);

    console.log('');
    const acknowledged = await askYesNo(
      rl,
      colorize('Have you reviewed and acknowledged this finding? (y/n): ', 'yellow')
    );

    if (!acknowledged) {
      console.log(colorize('\n✗ Finding not acknowledged. Approval cannot proceed.', 'red'));
      rl.close();
      return null; // Signal rejection
    }

    // Optional: collect notes
    const wantsNotes = await askYesNo(
      rl,
      colorize('Add notes about this finding? (y/n): ', 'cyan')
    );

    let notes = '';
    if (wantsNotes) {
      notes = await askText(
        rl,
        colorize('Notes (or press Enter to skip): ', 'cyan')
      );
    }

    acknowledged.push({
      finding: finding.title,
      reviewer: finding.reviewer,
      severity,
      acknowledgedAt: new Date().toISOString(),
      notes: notes || undefined
    });
  }

  rl.close();
  return acknowledged;
}

/**
 * Get user information for approval log
 */
async function getUserInfo() {
  const rl = createInterface();

  console.log(colorize('\nApprover Information:', 'cyan'));
  const name = await askText(rl, colorize('  Your name: ', 'cyan'));
  const email = await askText(rl, colorize('  Your email: ', 'cyan'));
  const role = await askText(rl, colorize('  Your role (optional): ', 'cyan'));

  rl.close();

  return {
    name: name || 'Unknown',
    email: email || 'unknown@example.com',
    role: role || undefined
  };
}

/**
 * Make final approval decision
 */
async function makeFinalDecision(criticalCount, highCount) {
  const rl = createInterface();

  console.log(colorize(`\n${'═'.repeat(80)}`, 'cyan'));
  console.log(colorize('  FINAL APPROVAL DECISION', 'bright'));
  console.log(colorize(`${'═'.repeat(80)}`, 'cyan'));

  console.log(`\nYou have acknowledged:`);
  console.log(`  ${colorize(criticalCount, criticalCount > 0 ? 'red' : 'reset')} Critical findings`);
  console.log(`  ${colorize(highCount, highCount > 0 ? 'yellow' : 'reset')} High severity findings`);

  if (criticalCount > 0) {
    console.log(colorize('\n⚠ WARNING: Critical findings must be addressed before implementation.', 'red'));
  }

  if (highCount > 0) {
    console.log(colorize('\n⚠ CAUTION: High severity findings should be addressed or documented.', 'yellow'));
  }

  console.log('');
  const approved = await askYesNo(
    rl,
    colorize('Do you approve this specification for implementation? (y/n): ', 'bright')
  );

  let justification = '';
  if (approved && (criticalCount > 0 || highCount > 0)) {
    console.log(colorize('\nYou are approving despite critical/high findings.', 'yellow'));
    justification = await askText(
      rl,
      colorize('Please provide justification: ', 'yellow')
    );
  }

  rl.close();

  return {
    approved,
    justification: justification || undefined
  };
}

/**
 * Save approval log
 */
function saveApprovalLog(approvalData, outputPath) {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write approval log
  fs.writeFileSync(outputPath, JSON.stringify(approvalData, null, 2));
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options = {
    reportFile: null,
    outputDir: '.specmas/approvals'
  };

  // Parse output directory
  const outputIndex = args.indexOf('--output-dir');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.outputDir = args[outputIndex + 1];
  }

  // Find report file (first non-flag argument)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.startsWith('-')) {
      options.reportFile = arg;
      break;
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colorize('Spec-MAS v3 Review Approval System', 'bright')}

${colorize('Usage:', 'cyan')}
  npm run review-approve <review-report.json> [options]
  node scripts/review-approval.js <review-report.json> [options]

${colorize('Arguments:', 'cyan')}
  <review-report.json>   Path to JSON review report from review-spec.js

${colorize('Options:', 'cyan')}
  --output-dir DIR       Directory for approval logs (default: .specmas/approvals)
  --help, -h             Show this help message

${colorize('Examples:', 'cyan')}
  # Review and approve from JSON report
  npm run review-spec my-spec.md --json --output review.json
  npm run review-approve review.json

  # Custom approval log directory
  npm run review-approve review.json --output-dir approvals/

${colorize('Workflow:', 'cyan')}
  1. Run review-spec.js to generate a review report (JSON format)
  2. Run this script with the JSON report
  3. Review each critical and high severity finding
  4. Acknowledge each finding or reject approval
  5. Make final approval decision
  6. Approval log saved with timestamp and user info

${colorize('Exit Codes:', 'cyan')}
  0 - Approved
  1 - Rejected or error
`);
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();

    if (!options.reportFile) {
      console.error(colorize('Error: No review report file specified', 'red'));
      printUsage();
      process.exit(1);
    }

    // Check file exists
    if (!fs.existsSync(options.reportFile)) {
      console.error(colorize(`Error: File not found: ${options.reportFile}`, 'red'));
      process.exit(1);
    }

    // Load review report
    console.log(colorize('Loading review report...', 'cyan'));
    const reportContent = fs.readFileSync(options.reportFile, 'utf8');
    const report = JSON.parse(reportContent);

    console.log(colorize('✓ Report loaded', 'green'));

    // Display report summary
    console.log(colorize(`\n${'═'.repeat(80)}`, 'cyan'));
    console.log(colorize('  REVIEW REPORT SUMMARY', 'bright'));
    console.log(colorize(`${'═'.repeat(80)}`, 'cyan'));
    console.log(`\nSpecification: ${report.metadata.specName}`);
    console.log(`ID: ${report.metadata.specId}`);
    console.log(`Review Date: ${report.metadata.reviewDate}`);
    console.log(`\nFindings:`);
    console.log(`  ${colorize(report.summary.criticalCount, report.summary.criticalCount > 0 ? 'red' : 'reset')} Critical`);
    console.log(`  ${colorize(report.summary.highCount, report.summary.highCount > 0 ? 'yellow' : 'reset')} High`);
    console.log(`  ${report.summary.mediumCount} Medium`);
    console.log(`  ${report.summary.lowCount} Low`);
    console.log(`  ${report.summary.infoCount} Info`);

    // Quick exit if no critical/high findings
    if (report.summary.criticalCount === 0 && report.summary.highCount === 0) {
      console.log(colorize('\n✓ No critical or high severity findings.', 'green'));
      console.log(colorize('Automatic approval (no human review required).', 'green'));

      const userInfo = await getUserInfo();
      const approvalData = {
        specId: report.metadata.specId,
        specName: report.metadata.specName,
        reviewDate: report.metadata.reviewDate,
        approvalDate: new Date().toISOString(),
        approver: userInfo,
        decision: 'APPROVED',
        automatic: true,
        findings: {
          critical: 0,
          high: 0,
          medium: report.summary.mediumCount,
          low: report.summary.lowCount,
          info: report.summary.infoCount
        },
        acknowledged: []
      };

      // Save approval log
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const outputPath = path.join(
        options.outputDir,
        `${report.metadata.specId}-${timestamp}.json`
      );
      saveApprovalLog(approvalData, outputPath);

      console.log(colorize(`\n✓ Approval log saved: ${outputPath}`, 'green'));
      process.exit(0);
    }

    // Review critical findings
    let criticalAcknowledged = [];
    if (report.summary.criticalCount > 0) {
      criticalAcknowledged = await reviewFindings(report.findings.critical, 'critical');
      if (criticalAcknowledged === null) {
        console.log(colorize('\n✗ Approval rejected - critical findings not acknowledged.', 'red'));
        process.exit(1);
      }
    }

    // Review high findings
    let highAcknowledged = [];
    if (report.summary.highCount > 0) {
      highAcknowledged = await reviewFindings(report.findings.high, 'high');
      if (highAcknowledged === null) {
        console.log(colorize('\n✗ Approval rejected - high findings not acknowledged.', 'red'));
        process.exit(1);
      }
    }

    // Get user info
    const userInfo = await getUserInfo();

    // Make final decision
    const decision = await makeFinalDecision(
      report.summary.criticalCount,
      report.summary.highCount
    );

    // Create approval log
    const approvalData = {
      specId: report.metadata.specId,
      specName: report.metadata.specName,
      specFile: report.metadata.filePath,
      reviewDate: report.metadata.reviewDate,
      approvalDate: new Date().toISOString(),
      approver: userInfo,
      decision: decision.approved ? 'APPROVED' : 'REJECTED',
      justification: decision.justification,
      findings: {
        critical: report.summary.criticalCount,
        high: report.summary.highCount,
        medium: report.summary.mediumCount,
        low: report.summary.lowCount,
        info: report.summary.infoCount
      },
      acknowledged: [...criticalAcknowledged, ...highAcknowledged]
    };

    // Save approval log
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputPath = path.join(
      options.outputDir,
      `${report.metadata.specId}-${timestamp}.json`
    );
    saveApprovalLog(approvalData, outputPath);

    // Display result
    console.log(colorize(`\n${'═'.repeat(80)}`, 'cyan'));
    if (decision.approved) {
      console.log(colorize('  ✓ SPECIFICATION APPROVED', 'green'));
      console.log(colorize(`${'═'.repeat(80)}`, 'cyan'));
      console.log(colorize(`\nApproval log saved: ${outputPath}`, 'green'));
      console.log(colorize('\nThis specification is approved for implementation.', 'green'));

      if (report.summary.criticalCount > 0 || report.summary.highCount > 0) {
        console.log(colorize('\nNote: Critical/high findings were acknowledged but not resolved.', 'yellow'));
        console.log(colorize('Ensure these are addressed during implementation.', 'yellow'));
      }

      process.exit(0);
    } else {
      console.log(colorize('  ✗ SPECIFICATION REJECTED', 'red'));
      console.log(colorize(`${'═'.repeat(80)}`, 'cyan'));
      console.log(colorize(`\nRejection log saved: ${outputPath}`, 'yellow'));
      console.log(colorize('\nThis specification is NOT approved for implementation.', 'red'));
      console.log(colorize('Address the findings and re-submit for review.', 'red'));
      process.exit(1);
    }

  } catch (error) {
    console.error(colorize(`\nError: ${error.message}`, 'red'));
    if (process.env.VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run main if executed directly
if (require.main === module) {
  main();
}

module.exports = { reviewFindings, getUserInfo, saveApprovalLog };
