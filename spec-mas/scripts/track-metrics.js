#!/usr/bin/env node

/**
 * Spec-MAS Metrics Tracker
 *
 * Tracks usage metrics, costs, and productivity over time
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Get metrics directory
 */
function getMetricsDir() {
  const baseDir = path.join(process.cwd(), '.specmas');
  const metricsDir = path.join(baseDir, 'metrics');

  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }

  return metricsDir;
}

/**
 * Get current month metrics file
 */
function getCurrentMetricsFile() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const filename = `${year}-${month}.json`;

  return path.join(getMetricsDir(), filename);
}

/**
 * Load metrics for current month
 */
function loadCurrentMetrics() {
  const metricsFile = getCurrentMetricsFile();

  if (!fs.existsSync(metricsFile)) {
    return {
      month: new Date().toISOString().slice(0, 7),
      features: [],
      totalCost: 0,
      totalFeatures: 0,
      totalTests: 0,
      totalLines: 0,
      byComplexity: {
        EASY: { count: 0, cost: 0 },
        MODERATE: { count: 0, cost: 0 },
        HIGH: { count: 0, cost: 0 }
      },
      byPhase: {
        validation: 0,
        review: 0,
        testGen: 0,
        implementation: 0,
        integration: 0,
        qa: 0
      }
    };
  }

  return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
}

/**
 * Load all historical metrics
 */
function loadAllMetrics() {
  const metricsDir = getMetricsDir();
  const files = fs.readdirSync(metricsDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(file => {
    const content = fs.readFileSync(path.join(metricsDir, file), 'utf8');
    return JSON.parse(content);
  });
}

/**
 * Record a feature metric
 */
function recordFeature(specId, phase, cost = 0, data = {}) {
  const metrics = loadCurrentMetrics();
  const metricsFile = getCurrentMetricsFile();

  const feature = {
    specId,
    phase,
    cost,
    timestamp: new Date().toISOString(),
    ...data
  };

  metrics.features.push(feature);
  metrics.totalCost += cost;
  metrics.totalFeatures += 1;

  if (data.complexity) {
    metrics.byComplexity[data.complexity].count += 1;
    metrics.byComplexity[data.complexity].cost += cost;
  }

  if (metrics.byPhase[phase] !== undefined) {
    metrics.byPhase[phase] += 1;
  }

  if (data.testsGenerated) {
    metrics.totalTests += data.testsGenerated;
  }

  if (data.linesOfCode) {
    metrics.totalLines += data.linesOfCode;
  }

  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2), 'utf8');

  return metrics;
}

/**
 * Display current month metrics
 */
function displayCurrentMetrics() {
  const metrics = loadCurrentMetrics();
  const budget = parseFloat(process.env.BUDGET_ALERT_THRESHOLD || 150);
  const budgetRemaining = budget - metrics.totalCost;
  const budgetPercent = (budgetRemaining / budget * 100).toFixed(0);

  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('  Spec-MAS Monthly Metrics', 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');

  console.log(colorize('Month:', 'bright') + ' ' + metrics.month);
  console.log('');

  // Overview
  console.log(colorize('─── Overview ' + '─'.repeat(47), 'blue'));
  console.log(`Features Shipped:      ${colorize(metrics.totalFeatures, 'green')}`);
  console.log(`Total Cost:            ${colorize('$' + metrics.totalCost.toFixed(2), 'magenta')}`);
  console.log(`Average Cost/Feature:  ${colorize('$' + (metrics.totalFeatures > 0 ? (metrics.totalCost / metrics.totalFeatures).toFixed(2) : '0.00'), 'magenta')}`);
  console.log(`Tests Generated:       ${colorize(metrics.totalTests, 'green')}`);
  console.log(`Lines of Code:         ${colorize(metrics.totalLines, 'green')}`);
  console.log('');

  // Budget
  console.log(colorize('─── Budget ' + '─'.repeat(49), 'blue'));
  console.log(`Monthly Budget:        ${colorize('$' + budget.toFixed(2), 'cyan')}`);
  console.log(`Spent:                 ${colorize('$' + metrics.totalCost.toFixed(2), 'magenta')}`);

  const remainingColor = budgetPercent > 50 ? 'green' : budgetPercent > 20 ? 'yellow' : 'red';
  console.log(`Remaining:             ${colorize('$' + budgetRemaining.toFixed(2), remainingColor)} (${budgetPercent}%)`);

  // Progress bar
  const barWidth = 40;
  const filled = Math.floor((metrics.totalCost / budget) * barWidth);
  const empty = barWidth - filled;
  const barColor = budgetPercent > 50 ? 'green' : budgetPercent > 20 ? 'yellow' : 'red';
  console.log(`Progress:              [${colorize('█'.repeat(filled), barColor)}${colors.dim}${'░'.repeat(empty)}${colors.reset}]`);
  console.log('');

  // By Complexity
  console.log(colorize('─── By Complexity ' + '─'.repeat(42), 'blue'));
  console.log(`EASY:                  ${metrics.byComplexity.EASY.count} features, $${metrics.byComplexity.EASY.cost.toFixed(2)}`);
  console.log(`MODERATE:              ${metrics.byComplexity.MODERATE.count} features, $${metrics.byComplexity.MODERATE.cost.toFixed(2)}`);
  console.log(`HIGH:                  ${metrics.byComplexity.HIGH.count} features, $${metrics.byComplexity.HIGH.cost.toFixed(2)}`);
  console.log('');

  // By Phase
  console.log(colorize('─── By Phase ' + '─'.repeat(47), 'blue'));
  console.log(`Validations:           ${metrics.byPhase.validation}`);
  console.log(`Reviews:               ${metrics.byPhase.review}`);
  console.log(`Test Generations:      ${metrics.byPhase.testGen}`);
  console.log(`Implementations:       ${metrics.byPhase.implementation}`);
  console.log(`Integrations:          ${metrics.byPhase.integration}`);
  console.log(`QA Runs:               ${metrics.byPhase.qa}`);
  console.log('');

  // Recent Features
  if (metrics.features.length > 0) {
    console.log(colorize('─── Recent Features (Last 5) ' + '─'.repeat(30), 'blue'));

    const recent = metrics.features.slice(-5).reverse();
    recent.forEach(f => {
      const date = new Date(f.timestamp).toLocaleDateString();
      const cost = f.cost > 0 ? `$${f.cost.toFixed(2)}` : 'free';
      console.log(`${colorize(date, 'dim')} - ${f.specId} (${f.phase}) - ${colorize(cost, 'magenta')}`);
    });
    console.log('');
  }

  // Warnings
  if (budgetPercent < 20) {
    console.log(colorize('⚠ Warning: Budget running low!', 'yellow'));
    console.log(colorize('  Consider pausing implementations or increasing budget.', 'dim'));
    console.log('');
  }

  console.log(colorize('─'.repeat(60), 'dim'));
  console.log(colorize('Metrics stored in: .specmas/metrics/', 'dim'));
  console.log('');
}

/**
 * Display historical trends
 */
function displayTrends() {
  const allMetrics = loadAllMetrics();

  if (allMetrics.length === 0) {
    console.log('\n' + colorize('No historical metrics found.', 'yellow'));
    console.log(colorize('Metrics will be tracked automatically as you use Spec-MAS.', 'dim'));
    console.log('');
    return;
  }

  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('  Spec-MAS Historical Trends', 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');

  console.log(colorize('─── Monthly Breakdown ' + '─'.repeat(37), 'blue'));
  console.log(`${'Month'.padEnd(12)} ${'Features'.padEnd(12)} ${'Cost'.padEnd(12)} Avg/Feature`);
  console.log(colorize('─'.repeat(60), 'dim'));

  allMetrics.forEach(m => {
    const avgCost = m.totalFeatures > 0 ? (m.totalCost / m.totalFeatures).toFixed(2) : '0.00';
    console.log(
      `${m.month.padEnd(12)} ` +
      `${String(m.totalFeatures).padEnd(12)} ` +
      `${colorize('$' + m.totalCost.toFixed(2), 'magenta').padEnd(12)} ` +
      `${colorize('$' + avgCost, 'dim')}`
    );
  });

  console.log('');

  // Totals
  const totalFeatures = allMetrics.reduce((sum, m) => sum + m.totalFeatures, 0);
  const totalCost = allMetrics.reduce((sum, m) => sum + m.totalCost, 0);
  const totalTests = allMetrics.reduce((sum, m) => sum + m.totalTests, 0);
  const totalLines = allMetrics.reduce((sum, m) => sum + m.totalLines, 0);

  console.log(colorize('─── All Time ' + '─'.repeat(47), 'blue'));
  console.log(`Total Features:        ${colorize(totalFeatures, 'green')}`);
  console.log(`Total Cost:            ${colorize('$' + totalCost.toFixed(2), 'magenta')}`);
  console.log(`Average Cost/Feature:  ${colorize('$' + (totalFeatures > 0 ? (totalCost / totalFeatures).toFixed(2) : '0.00'), 'magenta')}`);
  console.log(`Total Tests Generated: ${colorize(totalTests, 'green')}`);
  console.log(`Total Lines of Code:   ${colorize(totalLines, 'green')}`);
  console.log('');
}

/**
 * Export metrics to CSV
 */
function exportToCSV(outputPath) {
  const allMetrics = loadAllMetrics();

  if (allMetrics.length === 0) {
    console.log(colorize('No metrics to export.', 'yellow'));
    return;
  }

  const rows = [
    'Month,Features,Total Cost,Avg Cost,Tests,Lines,EASY Count,EASY Cost,MODERATE Count,MODERATE Cost,HIGH Count,HIGH Cost'
  ];

  allMetrics.forEach(m => {
    rows.push([
      m.month,
      m.totalFeatures,
      m.totalCost.toFixed(2),
      (m.totalFeatures > 0 ? (m.totalCost / m.totalFeatures).toFixed(2) : '0.00'),
      m.totalTests,
      m.totalLines,
      m.byComplexity.EASY.count,
      m.byComplexity.EASY.cost.toFixed(2),
      m.byComplexity.MODERATE.count,
      m.byComplexity.MODERATE.cost.toFixed(2),
      m.byComplexity.HIGH.count,
      m.byComplexity.HIGH.cost.toFixed(2)
    ].join(','));
  });

  const csv = rows.join('\n');
  fs.writeFileSync(outputPath, csv, 'utf8');

  console.log(colorize('✓ Metrics exported to: ', 'green') + outputPath);
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colorize('Spec-MAS Metrics Tracker', 'bright')}

Track usage metrics, costs, and productivity over time.

${colorize('USAGE:', 'bright')}
  npm run metrics                    Show current month metrics
  npm run metrics trends             Show historical trends
  npm run metrics export [file]      Export to CSV

${colorize('EXAMPLES:', 'bright')}
  ${colorize('npm run metrics', 'dim')}
  ${colorize('npm run metrics trends', 'dim')}
  ${colorize('npm run metrics export metrics.csv', 'dim')}

${colorize('ENVIRONMENT VARIABLES:', 'bright')}
  BUDGET_ALERT_THRESHOLD    Monthly budget in USD (default: $150)

${colorize('METRICS STORAGE:', 'bright')}
  Metrics are stored in: .specmas/metrics/YYYY-MM.json
  One file per month, automatically created

${colorize('NOTE:', 'bright')}
  Metrics are recorded automatically when you use Spec-MAS commands.
  This command only displays the collected data.
`);
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'trends':
      displayTrends();
      break;

    case 'export':
      const outputPath = args[1] || 'specmas-metrics.csv';
      exportToCSV(outputPath);
      break;

    case undefined:
      displayCurrentMetrics();
      break;

    default:
      console.log(colorize(`Unknown command: ${command}`, 'red'));
      console.log('Run with --help for usage information.');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`Error: ${error.message}`, 'red'));
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  recordFeature,
  loadCurrentMetrics,
  loadAllMetrics,
  displayCurrentMetrics,
  displayTrends,
  exportToCSV
};
