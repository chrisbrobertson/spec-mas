/**
 * Spec-MAS Cost Estimator
 * Estimates API costs for pipeline execution
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');
const { PIPELINE_PHASES } = require('./pipeline-orchestrator');

// Cost constants (per 1M tokens)
const COST_PER_1M_INPUT_TOKENS = 3.00;
const COST_PER_1M_OUTPUT_TOKENS = 15.00;

// Average token estimates per phase
const TOKEN_ESTIMATES = {
  validation: {
    input: 5000,
    output: 1000,
    apiCalls: 1
  },
  review: {
    input: 8000,
    output: 3000,
    apiCalls: 5, // Default number of reviewers
    multiplier: (spec) => {
      // More reviewers = more cost
      return 1;
    }
  },
  'test-generation': {
    input: 6000,
    output: 4000,
    apiCalls: 1,
    multiplier: (spec) => {
      // More requirements = more tests = higher cost
      const reqCount = (spec.requirements?.functional?.length || 0) +
                      (spec.requirements?.nonFunctional?.length || 0);
      return Math.max(1, reqCount / 5);
    }
  },
  implementation: {
    input: 10000,
    output: 8000,
    apiCalls: 4, // Average task count
    multiplier: (spec) => {
      // Estimate based on complexity
      const complexity = spec.metadata?.complexity || 'MODERATE';
      const multipliers = {
        LOW: 0.5,
        EASY: 0.5,
        MODERATE: 1.0,
        MEDIUM: 1.0,
        HIGH: 2.0,
        CRITICAL: 3.0
      };
      return multipliers[complexity] || 1.0;
    }
  },
  integration: {
    input: 3000,
    output: 1000,
    apiCalls: 0 // No API calls, just file operations
  },
  'qa-validation': {
    input: 5000,
    output: 2000,
    apiCalls: 0 // No API calls, just analysis
  }
};

/**
 * Calculate cost for a given token usage
 */
function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000000) * COST_PER_1M_INPUT_TOKENS;
  const outputCost = (outputTokens / 1000000) * COST_PER_1M_OUTPUT_TOKENS;
  return inputCost + outputCost;
}

/**
 * Estimate cost for a single phase
 */
function estimatePhaseTokens(phaseId, spec) {
  const estimate = TOKEN_ESTIMATES[phaseId];
  if (!estimate) {
    return { input: 0, output: 0, apiCalls: 0, cost: 0 };
  }

  // Apply multiplier if available
  const multiplier = estimate.multiplier ? estimate.multiplier(spec) : 1.0;

  const totalInput = estimate.input * estimate.apiCalls * multiplier;
  const totalOutput = estimate.output * estimate.apiCalls * multiplier;
  const cost = calculateCost(totalInput, totalOutput);

  return {
    input: Math.round(totalInput),
    output: Math.round(totalOutput),
    apiCalls: estimate.apiCalls,
    cost: cost
  };
}

/**
 * Estimate total pipeline cost
 */
async function estimateCost(specFile, options = {}) {
  try {
    // Read and parse spec
    const specPath = path.resolve(specFile);
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec file not found: ${specFile}`);
    }

    const spec = parseSpec(specPath);

    // Get applicable phases
    const phases = PIPELINE_PHASES.filter(phase => {
      // Check skip options
      const skipOption = `skip${phase.id.split('-').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join('')}`;
      return !options[skipOption];
    });

    // Estimate each phase
    const phaseEstimates = phases.map(phase => {
      const tokens = estimatePhaseTokens(phase.id, spec);
      return {
        id: phase.id,
        name: phase.name,
        ...tokens,
        estimatedTime: phase.estimatedTime
      };
    });

    // Calculate totals
    const totalInput = phaseEstimates.reduce((sum, p) => sum + p.input, 0);
    const totalOutput = phaseEstimates.reduce((sum, p) => sum + p.output, 0);
    const totalCost = phaseEstimates.reduce((sum, p) => sum + p.cost, 0);
    const totalApiCalls = phaseEstimates.reduce((sum, p) => sum + p.apiCalls, 0);

    return {
      phases: phaseEstimates,
      total: totalCost,
      totalInput: totalInput,
      totalOutput: totalOutput,
      totalApiCalls: totalApiCalls,
      estimatedTime: estimateTimeFromPhases(phaseEstimates),
      spec: {
        complexity: spec.metadata?.complexity || 'MODERATE',
        requirementCount: (spec.requirements?.functional?.length || 0) +
                         (spec.requirements?.nonFunctional?.length || 0)
      }
    };

  } catch (error) {
    throw new Error(`Cost estimation failed: ${error.message}`);
  }
}

/**
 * Estimate total time from phase estimates
 */
function estimateTimeFromPhases(phases) {
  // Convert time estimates to seconds
  const timeMap = {
    '10s': 10,
    '30s': 30,
    '1-2min': 90,
    '2-5min': 210,
  };

  let totalSeconds = 0;
  phases.forEach(phase => {
    const seconds = timeMap[phase.estimatedTime] || 60;
    totalSeconds += seconds;
  });

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Track actual costs during execution
 */
class CostTracker {
  constructor(budget = 50.0) {
    this.budget = budget;
    this.costs = {
      validation: 0,
      review: 0,
      'test-generation': 0,
      implementation: 0,
      integration: 0,
      'qa-validation': 0,
      total: 0
    };
    this.tokens = {
      input: 0,
      output: 0
    };
    this.warningThreshold = budget * 0.8; // 80% of budget
  }

  /**
   * Record cost for a phase
   */
  recordPhase(phaseId, inputTokens, outputTokens) {
    const cost = calculateCost(inputTokens, outputTokens);

    if (this.costs[phaseId] !== undefined) {
      this.costs[phaseId] += cost;
    }

    this.costs.total += cost;
    this.tokens.input += inputTokens;
    this.tokens.output += outputTokens;

    return {
      phaseCost: cost,
      totalCost: this.costs.total,
      budgetRemaining: this.budget - this.costs.total,
      percentUsed: (this.costs.total / this.budget) * 100
    };
  }

  /**
   * Check if budget is exceeded
   */
  isBudgetExceeded() {
    return this.costs.total >= this.budget;
  }

  /**
   * Check if warning threshold reached
   */
  isWarningThreshold() {
    return this.costs.total >= this.warningThreshold;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget() {
    return Math.max(0, this.budget - this.costs.total);
  }

  /**
   * Get cost summary
   */
  getSummary() {
    return {
      budget: this.budget,
      spent: this.costs.total,
      remaining: this.getRemainingBudget(),
      percentUsed: (this.costs.total / this.budget) * 100,
      tokens: this.tokens,
      byPhase: { ...this.costs }
    };
  }

  /**
   * Print cost warning
   */
  printWarning() {
    console.log('\n⚠️  WARNING: Cost threshold reached!');
    console.log(`   Spent: $${this.costs.total.toFixed(2)} / $${this.budget}`);
    console.log(`   Remaining: $${this.getRemainingBudget().toFixed(2)}\n`);
  }

  /**
   * Export cost data to JSON
   */
  exportToJson(outputPath) {
    const data = {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      details: {
        inputTokens: this.tokens.input,
        outputTokens: this.tokens.output,
        inputCost: calculateCost(this.tokens.input, 0),
        outputCost: calculateCost(0, this.tokens.output),
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }
}

/**
 * Estimate cost with confidence intervals
 */
function estimateCostWithConfidence(specFile) {
  // Provide low, mid, high estimates
  const baseEstimate = estimateCost(specFile);

  return {
    low: baseEstimate.total * 0.7,    // 30% under estimate
    mid: baseEstimate.total,           // Base estimate
    high: baseEstimate.total * 1.5,    // 50% over estimate
    confidence: 0.7                     // 70% confidence
  };
}

/**
 * Compare actual vs estimated costs
 */
function compareActualVsEstimated(estimated, actual) {
  const difference = actual - estimated;
  const percentDiff = (difference / estimated) * 100;

  return {
    estimated,
    actual,
    difference,
    percentDiff: percentDiff.toFixed(1),
    accuracy: 100 - Math.abs(percentDiff),
    status: Math.abs(percentDiff) < 20 ? 'accurate' : 'needs_adjustment'
  };
}

module.exports = {
  estimateCost,
  calculateCost,
  CostTracker,
  estimateCostWithConfidence,
  compareActualVsEstimated,
  COST_PER_1M_INPUT_TOKENS,
  COST_PER_1M_OUTPUT_TOKENS
};
