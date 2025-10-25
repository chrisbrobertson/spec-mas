#!/usr/bin/env node

/**
 * Spec-MAS v3 Coverage Report Generator
 *
 * Test coverage analysis and reporting tool.
 * Collects coverage metrics, identifies gaps, and generates detailed reports.
 *
 * Usage:
 *   node scripts/coverage-report.js [spec-file] [options]
 *
 * Options:
 *   --spec <path>           Spec file to map coverage to requirements
 *   --threshold <num>       Minimum coverage % (default: 80)
 *   --output <path>         Output report file (optional)
 *   --json                  Output in JSON format
 *   --collect               Run tests to collect fresh coverage
 *   --verbose               Detailed output
 *
 * Examples:
 *   npm run coverage-report
 *   npm run coverage-report -- --spec docs/examples/level-3-filter-spec.md
 *   npm run coverage-report -- --threshold 90 --output coverage.txt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseSpec } = require('./spec-parser');

// ==========================================
// Coverage Collection
// ==========================================

function collectCoverage(collect, verbose) {
  if (!collect) {
    // Try to read existing coverage
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

    if (fs.existsSync(coveragePath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return {
          collected: false,
          exists: true,
          data: summary
        };
      } catch (error) {
        return {
          collected: false,
          exists: false,
          error: 'Failed to parse existing coverage report'
        };
      }
    }

    return {
      collected: false,
      exists: false,
      error: 'No existing coverage data found. Run with --collect to generate.'
    };
  }

  // Run tests with coverage
  try {
    if (verbose) {
      console.log('  Running tests with coverage...');
    }

    execSync('npm test -- --coverage --coverageReporters=json-summary --coverageReporters=text', {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe'
    });

    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

    if (fs.existsSync(coveragePath)) {
      const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return {
        collected: true,
        exists: true,
        data: summary
      };
    }

    return {
      collected: true,
      exists: false,
      error: 'Coverage data not generated'
    };

  } catch (error) {
    return {
      collected: true,
      exists: false,
      error: error.message
    };
  }
}

// ==========================================
// Coverage Analysis
// ==========================================

function analyzeCoverage(coverageData) {
  const analysis = {
    overall: {
      lines: { total: 0, covered: 0, pct: 0 },
      statements: { total: 0, covered: 0, pct: 0 },
      functions: { total: 0, covered: 0, pct: 0 },
      branches: { total: 0, covered: 0, pct: 0 }
    },
    byFile: [],
    uncoveredFiles: [],
    wellCoveredFiles: [],
    poorlyCoveredFiles: []
  };

  if (!coverageData || !coverageData.total) {
    return analysis;
  }

  // Overall metrics
  const total = coverageData.total;
  analysis.overall = {
    lines: {
      total: total.lines.total,
      covered: total.lines.covered,
      pct: total.lines.pct
    },
    statements: {
      total: total.statements.total,
      covered: total.statements.covered,
      pct: total.statements.pct
    },
    functions: {
      total: total.functions.total,
      covered: total.functions.covered,
      pct: total.functions.pct
    },
    branches: {
      total: total.branches.total,
      covered: total.branches.covered,
      pct: total.branches.pct
    }
  };

  // Per-file analysis
  for (const [filePath, metrics] of Object.entries(coverageData)) {
    if (filePath === 'total') continue;

    const relativePath = path.relative(process.cwd(), filePath);

    const fileAnalysis = {
      file: relativePath,
      lines: metrics.lines.pct,
      statements: metrics.statements.pct,
      functions: metrics.functions.pct,
      branches: metrics.branches.pct,
      overall: (metrics.lines.pct + metrics.statements.pct + metrics.functions.pct + metrics.branches.pct) / 4
    };

    analysis.byFile.push(fileAnalysis);

    // Categorize
    if (fileAnalysis.overall >= 90) {
      analysis.wellCoveredFiles.push(fileAnalysis);
    } else if (fileAnalysis.overall < 60) {
      analysis.poorlyCoveredFiles.push(fileAnalysis);
    }

    if (fileAnalysis.overall === 0) {
      analysis.uncoveredFiles.push(fileAnalysis);
    }
  }

  // Sort by coverage (ascending for poor, descending for good)
  analysis.byFile.sort((a, b) => a.overall - b.overall);
  analysis.wellCoveredFiles.sort((a, b) => b.overall - a.overall);
  analysis.poorlyCoveredFiles.sort((a, b) => a.overall - b.overall);

  return analysis;
}

// ==========================================
// Uncovered Lines Detection
// ==========================================

function findUncoveredLines(verbose) {
  const uncovered = [];

  // Try to read coverage-final.json for detailed line info
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');

  if (!fs.existsSync(coveragePath)) {
    return uncovered;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

    for (const [filePath, data] of Object.entries(coverage)) {
      const relativePath = path.relative(process.cwd(), filePath);

      // Find uncovered line ranges
      const uncoveredLines = [];
      const lineCoverage = data.s; // statement coverage by line

      for (const [lineNum, covered] of Object.entries(lineCoverage)) {
        if (covered === 0) {
          uncoveredLines.push(parseInt(lineNum));
        }
      }

      if (uncoveredLines.length > 0) {
        // Group consecutive lines into ranges
        const ranges = [];
        let start = uncoveredLines[0];
        let end = uncoveredLines[0];

        for (let i = 1; i < uncoveredLines.length; i++) {
          if (uncoveredLines[i] === end + 1) {
            end = uncoveredLines[i];
          } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = end = uncoveredLines[i];
          }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);

        // Try to get context for first uncovered line
        let context = '';
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8').split('\n');
          const firstLine = uncoveredLines[0] - 1;
          if (fileContent[firstLine]) {
            context = fileContent[firstLine].trim().substring(0, 50);
          }
        } catch (error) {
          // Ignore
        }

        uncovered.push({
          file: relativePath,
          lines: ranges.join(', '),
          context
        });
      }
    }
  } catch (error) {
    if (verbose) {
      console.error(`Error reading detailed coverage: ${error.message}`);
    }
  }

  return uncovered;
}

// ==========================================
// Requirement Coverage Mapping
// ==========================================

function mapCoverageToRequirements(spec, coverageAnalysis, testFiles) {
  const mapping = [];

  if (!spec || !spec.sections.functionalRequirements) {
    return mapping;
  }

  const requirements = spec.sections.functionalRequirements;

  for (const req of requirements) {
    const reqMapping = {
      id: req.id,
      description: req.description,
      coverage: null,
      testFiles: [],
      implementationFiles: []
    };

    // Find related files by searching for requirement ID
    const reqIdLower = req.id.toLowerCase();
    const descWords = req.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Search in test files
    for (const testFile of testFiles) {
      try {
        const content = fs.readFileSync(testFile, 'utf8').toLowerCase();

        if (content.includes(reqIdLower) ||
            descWords.some(word => content.includes(word) && descWords.filter(w => content.includes(w)).length >= 2)) {
          reqMapping.testFiles.push(path.relative(process.cwd(), testFile));
        }
      } catch (error) {
        // Ignore
      }
    }

    // Find coverage for related files
    const relatedFiles = coverageAnalysis.byFile.filter(file => {
      const fileLower = file.file.toLowerCase();
      return descWords.some(word => fileLower.includes(word));
    });

    if (relatedFiles.length > 0) {
      reqMapping.implementationFiles = relatedFiles.map(f => f.file);
      // Average coverage of related files
      const avgCoverage = relatedFiles.reduce((sum, f) => sum + f.overall, 0) / relatedFiles.length;
      reqMapping.coverage = Math.round(avgCoverage);
    }

    mapping.push(reqMapping);
  }

  return mapping;
}

// ==========================================
// Test File Discovery
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

// ==========================================
// Report Generation
// ==========================================

function generateReport(coverageAnalysis, uncoveredLines, requirementMapping, threshold, format = 'text') {
  if (format === 'json') {
    return JSON.stringify({
      overall: coverageAnalysis.overall,
      byFile: coverageAnalysis.byFile,
      uncoveredLines,
      requirementMapping,
      threshold
    }, null, 2);
  }

  // Text format
  let report = '';

  report += '════════════════════════════════════════════════════════\n';
  report += '  TEST COVERAGE REPORT\n';
  report += '════════════════════════════════════════════════════════\n\n';

  // Overall coverage
  const overall = coverageAnalysis.overall;
  const avgCoverage = (overall.lines.pct + overall.statements.pct + overall.functions.pct + overall.branches.pct) / 4;
  const status = avgCoverage >= threshold ? '✓' : '✗';

  report += `Overall Coverage: ${status} ${avgCoverage.toFixed(1)}%\n\n`;

  // By type
  report += '─── By Type ─────────────────────────────────────────────\n';

  const types = [
    { name: 'Lines', data: overall.lines },
    { name: 'Statements', data: overall.statements },
    { name: 'Functions', data: overall.functions },
    { name: 'Branches', data: overall.branches }
  ];

  for (const { name, data } of types) {
    const typeStatus = data.pct >= threshold ? '✓' : '⚠';
    const padding = ' '.repeat(12 - name.length);
    report += `  ${name}:${padding}${data.covered}/${data.total} (${data.pct.toFixed(1)}%) ${typeStatus}\n`;
  }

  report += '\n';

  // By file
  if (coverageAnalysis.byFile.length > 0) {
    report += '─── By File ─────────────────────────────────────────────\n';

    // Show worst files first (most need attention)
    const filesToShow = coverageAnalysis.byFile.slice(0, 10);

    for (const file of filesToShow) {
      const fileStatus = file.overall >= threshold ? '✓' : '⚠';
      const filename = file.file.length > 35 ? '...' + file.file.slice(-32) : file.file;
      const padding = ' '.repeat(Math.max(1, 38 - filename.length));
      report += `  ${filename}${padding}${file.overall.toFixed(0)}% ${fileStatus}\n`;
    }

    if (coverageAnalysis.byFile.length > 10) {
      report += `  ... and ${coverageAnalysis.byFile.length - 10} more files\n`;
    }

    report += '\n';
  }

  // Uncovered lines
  if (uncoveredLines.length > 0) {
    report += '─── Uncovered Lines ─────────────────────────────────────\n';

    for (const item of uncoveredLines.slice(0, 10)) {
      report += `  ${item.file}:${item.lines}\n`;
      if (item.context) {
        report += `    ${item.context}\n`;
      }
    }

    if (uncoveredLines.length > 10) {
      report += `  ... and ${uncoveredLines.length - 10} more files\n`;
    }

    report += '\n';
  }

  // Requirement coverage
  if (requirementMapping.length > 0) {
    report += '─── Requirement Coverage ────────────────────────────────\n';

    for (const req of requirementMapping) {
      const covStr = req.coverage !== null ? `${req.coverage}%` : 'N/A';
      const reqStatus = req.coverage !== null && req.coverage >= threshold ? '✓' : '⚠';
      const testStatus = req.testFiles.length > 0 ? '✓' : '✗';

      report += `  ${req.id}: ${covStr} ${reqStatus} (tests: ${testStatus})\n`;
    }

    report += '\n';
  }

  // Summary
  report += '════════════════════════════════════════════════════════\n';

  if (avgCoverage >= threshold) {
    report += `Status: ✓ PASSED (threshold: ${threshold}%)\n`;
  } else {
    const gap = threshold - avgCoverage;
    report += `Status: ✗ FAILED (${gap.toFixed(1)}% below threshold of ${threshold}%)\n`;
  }

  report += '════════════════════════════════════════════════════════\n';

  return report;
}

// ==========================================
// Recommendations
// ==========================================

function generateRecommendations(coverageAnalysis, threshold) {
  const recommendations = [];

  const avgCoverage = (
    coverageAnalysis.overall.lines.pct +
    coverageAnalysis.overall.statements.pct +
    coverageAnalysis.overall.functions.pct +
    coverageAnalysis.overall.branches.pct
  ) / 4;

  if (avgCoverage < threshold) {
    recommendations.push({
      priority: 'high',
      message: `Increase overall coverage from ${avgCoverage.toFixed(1)}% to ${threshold}%`
    });
  }

  // Branch coverage is often the lowest
  if (coverageAnalysis.overall.branches.pct < coverageAnalysis.overall.lines.pct - 10) {
    recommendations.push({
      priority: 'medium',
      message: `Branch coverage (${coverageAnalysis.overall.branches.pct.toFixed(1)}%) is significantly lower than line coverage - add tests for conditional logic`
    });
  }

  // Poorly covered files
  if (coverageAnalysis.poorlyCoveredFiles.length > 0) {
    recommendations.push({
      priority: 'high',
      message: `${coverageAnalysis.poorlyCoveredFiles.length} file(s) have less than 60% coverage - prioritize these for testing`
    });
  }

  // Uncovered files
  if (coverageAnalysis.uncoveredFiles.length > 0) {
    recommendations.push({
      priority: 'critical',
      message: `${coverageAnalysis.uncoveredFiles.length} file(s) have 0% coverage - add basic tests`
    });
  }

  return recommendations;
}

// ==========================================
// Main Execution
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  const config = {
    specPath: null,
    threshold: 80,
    output: null,
    json: false,
    collect: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Spec-MAS v3 Coverage Report Generator

Usage: node scripts/coverage-report.js [options]

Options:
  --spec <path>           Spec file to map coverage to requirements
  --threshold <num>       Minimum coverage % (default: 80)
  --output <path>         Output report file (optional)
  --json                  Output in JSON format
  --collect               Run tests to collect fresh coverage
  --verbose               Detailed output

Examples:
  node scripts/coverage-report.js
  node scripts/coverage-report.js --spec docs/examples/level-3-filter-spec.md
  node scripts/coverage-report.js --threshold 90 --output coverage.txt
        `);
        process.exit(0);
        break;
      case '--spec':
        config.specPath = args[++i];
        break;
      case '--threshold':
        config.threshold = parseFloat(args[++i]);
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--json':
        config.json = true;
        break;
      case '--collect':
        config.collect = true;
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

  console.log('════════════════════════════════════════════════════════');
  console.log('  SPEC-MAS COVERAGE REPORT');
  console.log('════════════════════════════════════════════════════════\n');

  // Collect or load coverage
  console.log('Collecting coverage data...');
  const coverage = collectCoverage(config.collect, config.verbose);

  if (!coverage.exists) {
    console.error(`✗ ${coverage.error}`);
    process.exit(1);
  }

  if (coverage.collected) {
    console.log('✓ Coverage collected\n');
  } else {
    console.log('✓ Using existing coverage data\n');
  }

  // Analyze coverage
  console.log('Analyzing coverage...');
  const analysis = analyzeCoverage(coverage.data);
  const avgCoverage = (
    analysis.overall.lines.pct +
    analysis.overall.statements.pct +
    analysis.overall.functions.pct +
    analysis.overall.branches.pct
  ) / 4;
  console.log(`✓ Overall coverage: ${avgCoverage.toFixed(1)}%\n`);

  // Find uncovered lines
  console.log('Finding uncovered lines...');
  const uncoveredLines = findUncoveredLines(config.verbose);
  console.log(`✓ Found ${uncoveredLines.length} files with uncovered lines\n`);

  // Map to requirements if spec provided
  let requirementMapping = [];
  if (config.specPath) {
    console.log('Mapping coverage to requirements...');
    try {
      const spec = parseSpec(config.specPath);
      const testFiles = findTestFiles();
      requirementMapping = mapCoverageToRequirements(spec, analysis, testFiles);
      console.log(`✓ Mapped ${requirementMapping.length} requirements\n`);
    } catch (error) {
      console.warn(`⚠ Failed to map requirements: ${error.message}\n`);
    }
  }

  // Generate report
  console.log('Generating report...');
  const report = generateReport(
    analysis,
    uncoveredLines,
    requirementMapping,
    config.threshold,
    config.json ? 'json' : 'text'
  );

  // Output report
  if (config.output) {
    fs.writeFileSync(config.output, report, 'utf8');
    console.log(`✓ Report saved to: ${config.output}\n`);
  } else {
    console.log(report);
  }

  // Generate recommendations
  if (!config.json) {
    const recommendations = generateRecommendations(analysis, config.threshold);

    if (recommendations.length > 0) {
      console.log('\n─── Recommendations ─────────────────────────────────────');
      for (const rec of recommendations) {
        const icon = rec.priority === 'critical' ? '✗' : rec.priority === 'high' ? '⚠' : 'ℹ';
        console.log(`  ${icon} [${rec.priority.toUpperCase()}] ${rec.message}`);
      }
      console.log();
    }
  }

  // Exit code based on threshold
  if (avgCoverage < config.threshold) {
    console.log(`✗ Coverage below threshold (${avgCoverage.toFixed(1)}% < ${config.threshold}%)\n`);
    process.exit(1);
  }

  console.log('✓ Coverage meets threshold\n');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  collectCoverage,
  analyzeCoverage,
  findUncoveredLines,
  mapCoverageToRequirements,
  generateReport,
  generateRecommendations
};
