#!/usr/bin/env node

/**
 * Spec-MAS v3 Adversarial Review System
 * Main orchestration script for multi-agent spec review
 */

const fs = require('fs');
const path = require('path');
const { callAI, calculateCost } = require('./ai-helper');
const { resolveStepModel } = require('../src/ai/client');
require('dotenv').config();
const { parseSpec } = require('./spec-parser');

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

// Reviewer configuration
const REVIEWERS = {
  'security-red-team': {
    name: 'Security Red Team',
    file: 'security-red-team.md',
    emoji: '🔴',
    color: 'red'
  },
  'security-blue-team': {
    name: 'Security Blue Team',
    file: 'security-blue-team.md',
    emoji: '🔵',
    color: 'blue'
  },
  'architecture-review': {
    name: 'Architecture Review',
    file: 'architecture-review.md',
    emoji: '🏗️',
    color: 'cyan'
  },
  'qa-review': {
    name: 'QA & Testing Review',
    file: 'qa-review.md',
    emoji: '✅',
    color: 'green'
  },
  'performance-review': {
    name: 'Performance Engineering',
    file: 'performance-review.md',
    emoji: '⚡',
    color: 'yellow'
  }
};

// Pricing (as of API version)
const PRICING = {
  'sonnet': {
    input: 3.00 / 1_000_000,   // $3 per million input tokens
    output: 15.00 / 1_000_000  // $15 per million output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00 / 1_000_000,   // $3 per million input tokens (deprecated model name)
    output: 15.00 / 1_000_000  // $15 per million output tokens
  }
};

/**
 * Load reviewer prompt from file
 */
function loadReviewerPrompt(reviewerKey) {
  const reviewer = REVIEWERS[reviewerKey];
  const promptPath = path.join(__dirname, '..', 'agents', 'reviewers', reviewer.file);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Reviewer prompt not found: ${promptPath}`);
  }

  return fs.readFileSync(promptPath, 'utf8');
}

/**
 * Call AI for review using unified AI helper
 */
async function callReviewerAI(reviewerPrompt, specContent, reviewerName, options = {}) {
  // Get AI provider configuration
  const routing = resolveStepModel('review');
  const provider = options.provider || routing.provider;
  const model = options.model ||
                process.env.SPECMAS_REVIEWER_MODEL ||
                routing.model;
  const maxTokens = parseInt(options.maxTokens || process.env.SPECMAS_MAX_TOKENS || '4096');

  if (options.verbose) {
    console.log(colorize(`  Provider: ${provider}`, 'gray'));
    console.log(colorize(`  Model: ${model}`, 'gray'));
    console.log(colorize(`  Max tokens: ${maxTokens}`, 'gray'));
  }

  const fullPrompt = `${reviewerPrompt}\n\n---\n\n# SPECIFICATION TO REVIEW\n\n${specContent}`;

  const result = await callAI(
    '', // No separate system prompt, everything is in user prompt
    fullPrompt,
    {
      provider,
      model,
      maxTokens,
      fallback: options.fallback ?? routing.fallback
    }
  );

  // Extract usage statistics
  const usage = {
    inputTokens: result.tokens.input,
    outputTokens: result.tokens.output,
    totalTokens: result.tokens.input + result.tokens.output
  };

  // Calculate cost using the helper function
  usage.cost = calculateCost(usage.inputTokens, usage.outputTokens, provider, model);

  return {
    content: result.content,
    usage,
    model: result.model
  };
}

/**
 * Parse review findings from Claude response
 */
function parseReviewFindings(reviewContent) {
  const findings = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  };

  // Extract findings by severity
  const severityPatterns = [
    { level: 'critical', pattern: /###\s*\[CRITICAL\](.*?)(?=###|\n##|$)/gs },
    { level: 'high', pattern: /###\s*\[HIGH\](.*?)(?=###|\n##|$)/gs },
    { level: 'medium', pattern: /###\s*\[MEDIUM\](.*?)(?=###|\n##|$)/gs },
    { level: 'low', pattern: /###\s*\[LOW\](.*?)(?=###|\n##|$)/gs },
    { level: 'info', pattern: /###\s*\[INFO\](.*?)(?=###|\n##|$)/gs }
  ];

  for (const { level, pattern } of severityPatterns) {
    let match;
    while ((match = pattern.exec(reviewContent)) !== null) {
      const title = match[0].split('\n')[0].replace(/###\s*\[.*?\]\s*/, '').trim();
      const content = match[1].trim();

      findings[level].push({
        title,
        content,
        fullText: match[0]
      });
    }
  }

  return findings;
}

/**
 * Run a single reviewer
 */
async function runReviewer(reviewerKey, spec, options = {}) {
  const reviewer = REVIEWERS[reviewerKey];

  console.log(colorize(`\n${reviewer.emoji} ${reviewer.name}`, reviewer.color));
  console.log(colorize('─'.repeat(80), 'gray'));

  try {
    // Load reviewer prompt
    const reviewerPrompt = loadReviewerPrompt(reviewerKey);

    if (options.verbose) {
      console.log(colorize(`  Loaded prompt: ${reviewer.file}`, 'gray'));
    }

    // Call AI for review
    console.log(colorize('  Analyzing specification...', 'gray'));
    const result = await callReviewerAI(reviewerPrompt, spec.raw, reviewer.name, options);

    // Parse findings
    const findings = parseReviewFindings(result.content);

    // Count findings
    const totalFindings =
      findings.critical.length +
      findings.high.length +
      findings.medium.length +
      findings.low.length +
      findings.info.length;

    // Display summary
    console.log(colorize(`  ✓ Review complete`, 'green'));
    console.log(colorize(`  Findings: `, 'gray') +
      `${findings.critical.length > 0 ? colorize(`${findings.critical.length} Critical`, 'red') : ''}${findings.critical.length > 0 && findings.high.length > 0 ? ', ' : ''}` +
      `${findings.high.length > 0 ? colorize(`${findings.high.length} High`, 'yellow') : ''}${(findings.critical.length > 0 || findings.high.length > 0) && findings.medium.length > 0 ? ', ' : ''}` +
      `${findings.medium.length > 0 ? `${findings.medium.length} Medium` : ''}${totalFindings > 0 && findings.low.length > 0 ? ', ' : ''}` +
      `${findings.low.length > 0 ? `${findings.low.length} Low` : ''}${totalFindings > 0 && findings.info.length > 0 ? ', ' : ''}` +
      `${findings.info.length > 0 ? `${findings.info.length} Info` : ''}`
    );
    console.log(colorize(`  Tokens: ${result.usage.inputTokens.toLocaleString()} in + ${result.usage.outputTokens.toLocaleString()} out = ${result.usage.totalTokens.toLocaleString()} total`, 'gray'));
    console.log(colorize(`  Cost: $${result.usage.cost.toFixed(4)}`, 'gray'));

    return {
      reviewer: reviewerKey,
      reviewerName: reviewer.name,
      findings,
      rawContent: result.content,
      usage: result.usage,
      model: result.model
    };

  } catch (error) {
    console.log(colorize(`  ✗ Review failed: ${error.message}`, 'red'));
    if (options.verbose) {
      console.error(error);
    }
    return {
      reviewer: reviewerKey,
      reviewerName: reviewer.name,
      error: error.message,
      findings: { critical: [], high: [], medium: [], low: [], info: [] }
    };
  }
}

/**
 * Run all enabled reviewers
 */
async function runAllReviewers(spec, enabledReviewers, options = {}) {
  const results = [];

  if (options.parallel) {
    // Run in parallel
    console.log(colorize('\nRunning reviews in parallel...', 'cyan'));
    const promises = enabledReviewers.map(key => runReviewer(key, spec, options));
    results.push(...await Promise.all(promises));
  } else {
    // Run sequentially
    for (const reviewerKey of enabledReviewers) {
      const result = await runReviewer(reviewerKey, spec, options);
      results.push(result);
    }
  }

  return results;
}

/**
 * Generate human-readable report
 */
function generateHumanReport(spec, reviewResults, options = {}) {
  console.log('\n' + colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('  ADVERSARIAL REVIEW REPORT', 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan'));

  // Spec metadata
  console.log('\n' + colorize('Specification:', 'bright'));
  console.log(`  Name:       ${spec.metadata.name || 'N/A'}`);
  console.log(`  ID:         ${spec.metadata.id || 'N/A'}`);
  console.log(`  Complexity: ${spec.metadata.complexity || 'N/A'}`);
  console.log(`  Maturity:   Level ${spec.metadata.maturity || 'N/A'}`);
  console.log(`  File:       ${spec.filePath}`);

  // Aggregate findings
  const aggregated = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  };

  let totalTokens = 0;
  let totalCost = 0;

  for (const result of reviewResults) {
    if (result.error) continue;

    for (const level of ['critical', 'high', 'medium', 'low', 'info']) {
      for (const finding of result.findings[level]) {
        aggregated[level].push({
          ...finding,
          reviewer: result.reviewerName
        });
      }
    }

    if (result.usage) {
      totalTokens += result.usage.totalTokens;
      totalCost += result.usage.cost;
    }
  }

  // Summary statistics
  console.log('\n' + colorize('Review Summary:', 'bright'));
  console.log(`  Reviewers:  ${reviewResults.length}`);
  console.log(`  Findings:   ${colorize(aggregated.critical.length, aggregated.critical.length > 0 ? 'red' : 'reset')} Critical, ` +
              `${colorize(aggregated.high.length, aggregated.high.length > 0 ? 'yellow' : 'reset')} High, ` +
              `${aggregated.medium.length} Medium, ${aggregated.low.length} Low, ${aggregated.info.length} Info`);
  console.log(`  Tokens:     ${totalTokens.toLocaleString()}`);
  console.log(`  Cost:       $${totalCost.toFixed(4)}`);

  // Findings by severity
  const displayFindings = (level, findings, color) => {
    if (findings.length === 0) return;

    console.log('\n' + colorize('─'.repeat(80), 'gray'));
    console.log(colorize(`${level.toUpperCase()} FINDINGS (${findings.length})`, color));
    console.log(colorize('─'.repeat(80), 'gray'));

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      console.log(`\n${i + 1}. ${colorize(finding.title, 'bright')} ${colorize(`[${finding.reviewer}]`, 'gray')}`);

      if (!options.summary) {
        // Show first few lines of content
        const lines = finding.content.split('\n').slice(0, 5);
        for (const line of lines) {
          if (line.trim()) {
            console.log(colorize(`   ${line}`, 'gray'));
          }
        }
        if (finding.content.split('\n').length > 5) {
          console.log(colorize('   ...', 'gray'));
        }
      }
    }
  };

  if (!options.summary) {
    displayFindings('critical', aggregated.critical, 'red');
    displayFindings('high', aggregated.high, 'yellow');
    displayFindings('medium', aggregated.medium, 'cyan');

    if (options.verbose) {
      displayFindings('low', aggregated.low, 'blue');
      displayFindings('info', aggregated.info, 'gray');
    }
  }

  // Overall assessment
  console.log('\n' + colorize('─'.repeat(80), 'gray'));
  console.log(colorize('OVERALL ASSESSMENT', 'bright'));
  console.log(colorize('─'.repeat(80), 'gray'));

  let recommendation = 'APPROVED';
  let recommendationColor = 'green';
  let exitCode = 0;

  if (aggregated.critical.length > 0) {
    recommendation = 'BLOCKED - Critical issues must be resolved';
    recommendationColor = 'red';
    exitCode = 1;
  } else if (aggregated.high.length > 0) {
    recommendation = 'PROCEED WITH CAUTION - High severity issues found';
    recommendationColor = 'yellow';
    exitCode = 2;
  } else if (aggregated.medium.length > 0) {
    recommendation = 'APPROVED - Consider addressing medium issues';
    recommendationColor = 'cyan';
    exitCode = 0;
  }

  console.log(`  Recommendation: ${colorize(recommendation, recommendationColor)}`);
  console.log('');

  return { aggregated, totalTokens, totalCost, recommendation, exitCode };
}

/**
 * Generate JSON report
 */
function generateJSONReport(spec, reviewResults) {
  const aggregated = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  };

  let totalTokens = 0;
  let totalCost = 0;

  const reviewerResults = {};

  for (const result of reviewResults) {
    reviewerResults[result.reviewer] = {
      name: result.reviewerName,
      findings: result.findings,
      usage: result.usage,
      model: result.model,
      error: result.error
    };

    if (!result.error) {
      for (const level of ['critical', 'high', 'medium', 'low', 'info']) {
        for (const finding of result.findings[level]) {
          aggregated[level].push({
            ...finding,
            reviewer: result.reviewerName
          });
        }
      }

      if (result.usage) {
        totalTokens += result.usage.totalTokens;
        totalCost += result.usage.cost;
      }
    }
  }

  let recommendation = 'APPROVED';
  if (aggregated.critical.length > 0) {
    recommendation = 'BLOCKED';
  } else if (aggregated.high.length > 0) {
    recommendation = 'PROCEED_WITH_CAUTION';
  }

  return {
    metadata: {
      specName: spec.metadata.name,
      specId: spec.metadata.id,
      complexity: spec.metadata.complexity,
      maturity: spec.metadata.maturity,
      filePath: spec.filePath,
      reviewDate: new Date().toISOString()
    },
    summary: {
      reviewersRun: reviewResults.length,
      totalFindings: aggregated.critical.length + aggregated.high.length +
                     aggregated.medium.length + aggregated.low.length + aggregated.info.length,
      criticalCount: aggregated.critical.length,
      highCount: aggregated.high.length,
      mediumCount: aggregated.medium.length,
      lowCount: aggregated.low.length,
      infoCount: aggregated.info.length,
      recommendation,
      totalTokens,
      totalCost
    },
    findings: aggregated,
    reviewers: reviewerResults
  };
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
    reviewers: [],
    parallel: false,
    json: false,
    output: null,
    verbose: false,
    summary: false,
    filePath: null
  };

  // Parse flags
  if (args.includes('--parallel')) options.parallel = true;
  if (args.includes('--json')) options.json = true;
  if (args.includes('--verbose') || args.includes('-v')) options.verbose = true;
  if (args.includes('--summary')) options.summary = true;

  // Parse reviewers
  const reviewersIndex = args.indexOf('--reviewers');
  if (reviewersIndex !== -1 && args[reviewersIndex + 1]) {
    options.reviewers = args[reviewersIndex + 1].split(',');
  } else {
    // Default: all reviewers
    options.reviewers = Object.keys(REVIEWERS);
  }

  // Validate reviewers
  for (const reviewer of options.reviewers) {
    if (!REVIEWERS[reviewer]) {
      console.error(colorize(`Error: Unknown reviewer: ${reviewer}`, 'red'));
      console.error(colorize(`Available reviewers: ${Object.keys(REVIEWERS).join(', ')}`, 'yellow'));
      process.exit(1);
    }
  }

  // Parse output file
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  // Find file path (first non-flag argument)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.startsWith('-') &&
        arg !== options.output &&
        !options.reviewers.join(',').includes(arg)) {
      options.filePath = arg;
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
${colorize('Spec-MAS v3 Adversarial Review System', 'bright')}

${colorize('Usage:', 'cyan')}
  npm run review-spec <spec-file> [options]
  node scripts/review-spec.js <spec-file> [options]

${colorize('Arguments:', 'cyan')}
  <spec-file>    Path to the specification markdown file

${colorize('Options:', 'cyan')}
  --reviewers <list>     Comma-separated list of reviewers to run
                         Default: all reviewers
                         Available: ${Object.keys(REVIEWERS).join(', ')}
  --parallel             Run reviews in parallel (faster)
  --json                 Output report in JSON format
  --output FILE          Write report to file
  --summary              Show summary only (less verbose)
  --verbose, -v          Show detailed information
  --help, -h             Show this help message

${colorize('Examples:', 'cyan')}
  # Run all reviewers sequentially
  npm run review-spec docs/examples/level-5-auth-spec.md

  # Run only security reviewers in parallel
  npm run review-spec my-spec.md --reviewers security-red-team,security-blue-team --parallel

  # Generate JSON report
  npm run review-spec my-spec.md --json --output review-report.json

  # Quick summary
  npm run review-spec my-spec.md --summary

${colorize('Environment Variables:', 'cyan')}
  AI_PROVIDER                    AI provider: 'claude' or 'openai' (default: claude)
  AI_MODEL_CLAUDE                Claude model (default: sonnet)
  AI_MODEL_OPENAI                OpenAI model (default: gpt-4)
  OPENAI_API_KEY                 OpenAI API key (required if using OpenAI)
  AI_FALLBACK_ENABLED            Enable fallback to OpenAI (default: false)
  SPECMAS_MAX_TOKENS             Max tokens per review (default: 4096)

${colorize('Setup:', 'cyan')}
  For Claude CLI: npm install -g @anthropic-ai/cli && claude config set api-key YOUR_KEY
  For OpenAI: Add OPENAI_API_KEY to .env file

${colorize('Exit Codes:', 'cyan')}
  0 - No critical or high severity issues (or only medium/low/info)
  1 - Critical severity issues found
  2 - High severity issues found
`);
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();

    if (!options.filePath) {
      console.error(colorize('Error: No spec file specified', 'red'));
      printUsage();
      process.exit(1);
    }

    // Check file exists
    if (!fs.existsSync(options.filePath)) {
      console.error(colorize(`Error: File not found: ${options.filePath}`, 'red'));
      process.exit(1);
    }

    // Check AI provider is configured
    const { provider } = resolveStepModel('review');

    if (provider === 'claude') {
      console.log(colorize('AI Provider: Claude CLI', 'cyan'));
      console.log(colorize('(Ensure Claude CLI is configured: claude config set api-key YOUR_KEY)', 'gray'));
    } else if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        console.error(colorize('Error: OPENAI_API_KEY environment variable not set', 'red'));
        console.error(colorize('Please add your OpenAI API key to .env file', 'yellow'));
        process.exit(1);
      }
      console.log(colorize('AI Provider: OpenAI (ChatGPT)', 'cyan'));
    } else {
      console.error(colorize(`Error: Unknown AI provider: ${provider}`, 'red'));
      console.error(colorize('Valid providers: claude, openai', 'yellow'));
      process.exit(1);
    }

    // Parse spec
    console.log(colorize('Loading specification...', 'cyan'));
    const spec = parseSpec(options.filePath);
    console.log(colorize(`✓ Loaded: ${spec.metadata.name || path.basename(options.filePath)}`, 'green'));

    // Run reviewers
    console.log(colorize(`\nRunning ${options.reviewers.length} reviewer(s)...`, 'cyan'));
    const reviewResults = await runAllReviewers(spec, options.reviewers, options);

    // Generate report
    if (options.json) {
      const jsonReport = generateJSONReport(spec, reviewResults);

      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(jsonReport, null, 2));
        console.log(colorize(`\n✓ JSON report written to: ${options.output}`, 'green'));
      } else {
        console.log(JSON.stringify(jsonReport, null, 2));
      }

      // Exit with appropriate code
      const exitCode = jsonReport.summary.criticalCount > 0 ? 1 :
                       jsonReport.summary.highCount > 0 ? 2 : 0;
      process.exit(exitCode);

    } else {
      const humanReport = generateHumanReport(spec, reviewResults, options);

      if (options.output) {
        // Generate markdown report for human output
        const markdown = generateMarkdownReport(spec, reviewResults, humanReport);
        fs.writeFileSync(options.output, markdown);
        console.log(colorize(`✓ Report written to: ${options.output}`, 'green'));
      }

      process.exit(humanReport.exitCode);
    }

  } catch (error) {
    console.error(colorize(`\nError: ${error.message}`, 'red'));
    if (process.env.VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Generate markdown report for file output
 */
function generateMarkdownReport(spec, reviewResults, humanReport) {
  const { aggregated } = humanReport;

  let markdown = `# Adversarial Review Report\n\n`;
  markdown += `**Specification:** ${spec.metadata.name || 'N/A'}\n`;
  markdown += `**ID:** ${spec.metadata.id || 'N/A'}\n`;
  markdown += `**Review Date:** ${new Date().toISOString()}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Critical Findings:** ${aggregated.critical.length}\n`;
  markdown += `- **High Findings:** ${aggregated.high.length}\n`;
  markdown += `- **Medium Findings:** ${aggregated.medium.length}\n`;
  markdown += `- **Low Findings:** ${aggregated.low.length}\n`;
  markdown += `- **Info:** ${aggregated.info.length}\n\n`;

  const addFindings = (level, findings) => {
    if (findings.length === 0) return;
    markdown += `## ${level.charAt(0).toUpperCase() + level.slice(1)} Findings\n\n`;
    for (const finding of findings) {
      markdown += `### ${finding.title}\n\n`;
      markdown += `**Reviewer:** ${finding.reviewer}\n\n`;
      markdown += `${finding.content}\n\n`;
      markdown += `---\n\n`;
    }
  };

  addFindings('critical', aggregated.critical);
  addFindings('high', aggregated.high);
  addFindings('medium', aggregated.medium);
  addFindings('low', aggregated.low);
  addFindings('info', aggregated.info);

  return markdown;
}

// Run main if executed directly
if (require.main === module) {
  main();
}

module.exports = { runReviewer, runAllReviewers, generateJSONReport };
