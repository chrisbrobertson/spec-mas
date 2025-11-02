/**
 * Spec-MAS Architecture Analyzer
 * Analyzes specifications for complexity and recommends splitting when appropriate
 */

/**
 * Complexity indicators that suggest a spec might be too large
 */
const COMPLEXITY_INDICATORS = {
  // Multiple distinct user personas (beyond basic role variations)
  multiplePersonas: {
    weight: 3,
    threshold: 3,
    patterns: [/as an? ([^,]+),/gi],
    description: 'Multiple distinct user personas'
  },
  
  // High number of functional requirements
  manyRequirements: {
    weight: 2,
    threshold: 12,
    patterns: [/^#{2,3}\s*FR[-_]?\d+/gm],
    description: 'Large number of functional requirements'
  },
  
  // Multiple data entities
  manyEntities: {
    weight: 2,
    threshold: 8,
    patterns: [/^#{2,3}\s*Entity:\s*\[?(\w+)\]?/gm],
    description: 'Many data entities'
  },
  
  // Multiple API endpoints
  manyEndpoints: {
    weight: 1.5,
    threshold: 10,
    patterns: [/^#{2,3}\s*Endpoint:\s*\[?(GET|POST|PUT|PATCH|DELETE)/gm],
    description: 'Many API endpoints'
  },
  
  // Multiple external integrations
  manyIntegrations: {
    weight: 3,
    threshold: 3,
    patterns: [/^#{2,3}\s*Integration:\s*\[?([^\]]+)\]?/gm],
    description: 'Multiple external integrations'
  },
  
  // Multiple workflows or processes
  multipleWorkflows: {
    weight: 2,
    threshold: 4,
    patterns: [/workflow|process|flow|pipeline/gi],
    description: 'Multiple workflows or processes'
  },
  
  // Complex security requirements (multiple auth methods, many roles)
  complexSecurity: {
    weight: 2,
    threshold: 5,
    patterns: [/\*\*Role:\*\*\s*([^|]+)\s*\|/gm],
    description: 'Complex security with many roles'
  },
  
  // Mentions of multiple UI views/screens
  manyViews: {
    weight: 1.5,
    threshold: 5,
    patterns: [/^#{2,3}\s*(.+)\s*(View|Screen|Page|Modal|Form)/gm],
    description: 'Many UI views or screens'
  }
};

/**
 * Cohesion indicators that suggest distinct feature boundaries
 */
const COHESION_INDICATORS = {
  // Different business domains mentioned
  multipleDomains: {
    weight: 3,
    keywords: ['user management', 'authentication', 'authorization', 'billing', 'payment', 
               'reporting', 'analytics', 'notification', 'messaging', 'search', 'inventory',
               'order', 'shipping', 'customer', 'product', 'catalog'],
    threshold: 3,
    description: 'Multiple business domains'
  },
  
  // Different data lifecycle operations
  multipleCRUD: {
    weight: 2,
    keywords: ['create', 'read', 'update', 'delete', 'import', 'export', 'sync', 'migrate'],
    threshold: 6,
    description: 'Multiple CRUD operations across entities'
  },
  
  // Different integration patterns
  multipleIntegrationTypes: {
    weight: 2,
    keywords: ['webhook', 'api', 'queue', 'stream', 'batch', 'real-time', 'sync', 'async'],
    threshold: 4,
    description: 'Multiple integration patterns'
  }
};

/**
 * Analyze a specification and determine if it should be split
 * @param {object} spec - Parsed spec object
 * @returns {object} Analysis result with recommendations
 */
function analyzeSpec(spec) {
  const content = spec.raw || '';
  const complexity = spec.metadata?.complexity || 'MODERATE';
  const maturity = spec.metadata?.maturity || 3;
  
  // Score the spec based on various indicators
  const complexityScore = calculateComplexityScore(content);
  const cohesionScore = calculateCohesionScore(content);
  const sizeScore = calculateSizeScore(content);
  
  // Determine if splitting is recommended
  const totalScore = complexityScore.score + cohesionScore.score + sizeScore.score;
  const shouldSplit = totalScore >= 10 || (complexity === 'HIGH' && totalScore >= 7);
  
  // Generate specific recommendations
  const recommendations = generateRecommendations(
    spec,
    complexityScore,
    cohesionScore,
    sizeScore,
    shouldSplit
  );
  
  return {
    shouldSplit,
    confidence: calculateConfidence(totalScore),
    totalScore,
    scores: {
      complexity: complexityScore,
      cohesion: cohesionScore,
      size: sizeScore
    },
    recommendations,
    summary: generateSummary(spec, shouldSplit, totalScore)
  };
}

/**
 * Calculate complexity score based on indicators
 */
function calculateComplexityScore(content) {
  let score = 0;
  const findings = [];
  
  for (const [key, indicator] of Object.entries(COMPLEXITY_INDICATORS)) {
    let count = 0;
    
    for (const pattern of indicator.patterns) {
      const matches = content.match(pattern) || [];
      count += matches.length;
    }
    
    if (count >= indicator.threshold) {
      const points = indicator.weight * Math.min(2, count / indicator.threshold);
      score += points;
      findings.push({
        indicator: key,
        description: indicator.description,
        count,
        threshold: indicator.threshold,
        contribution: points.toFixed(1)
      });
    }
  }
  
  return { score: Math.round(score * 10) / 10, findings };
}

/**
 * Calculate cohesion score (lower is better - indicates distinct concerns)
 */
function calculateCohesionScore(content) {
  let score = 0;
  const findings = [];
  const contentLower = content.toLowerCase();
  
  for (const [key, indicator] of Object.entries(COHESION_INDICATORS)) {
    const matchedKeywords = indicator.keywords.filter(kw => 
      contentLower.includes(kw.toLowerCase())
    );
    
    if (matchedKeywords.length >= indicator.threshold) {
      const points = indicator.weight * (matchedKeywords.length / indicator.threshold);
      score += points;
      findings.push({
        indicator: key,
        description: indicator.description,
        matched: matchedKeywords,
        count: matchedKeywords.length,
        threshold: indicator.threshold,
        contribution: points.toFixed(1)
      });
    }
  }
  
  return { score: Math.round(score * 10) / 10, findings };
}

/**
 * Calculate size score based on spec length
 */
function calculateSizeScore(content) {
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).length;
  const chars = content.length;
  
  let score = 0;
  const findings = [];
  
  // Thresholds for size indicators
  if (lines > 1000) {
    score += 2;
    findings.push({
      metric: 'lines',
      value: lines,
      threshold: 1000,
      description: 'Very long specification'
    });
  } else if (lines > 700) {
    score += 1;
    findings.push({
      metric: 'lines',
      value: lines,
      threshold: 700,
      description: 'Long specification'
    });
  }
  
  if (words > 5000) {
    score += 1.5;
    findings.push({
      metric: 'words',
      value: words,
      threshold: 5000,
      description: 'Very high word count'
    });
  }
  
  return { score: Math.round(score * 10) / 10, findings, metrics: { lines, words, chars } };
}

/**
 * Calculate confidence in the recommendation
 */
function calculateConfidence(totalScore) {
  if (totalScore >= 15) return 'very high';
  if (totalScore >= 12) return 'high';
  if (totalScore >= 8) return 'medium';
  if (totalScore >= 5) return 'low';
  return 'very low';
}

/**
 * Generate specific recommendations for splitting
 */
function generateRecommendations(spec, complexityScore, cohesionScore, sizeScore, shouldSplit) {
  const recommendations = [];
  
  if (!shouldSplit) {
    return [{
      type: 'no-split',
      priority: 'info',
      title: 'Spec size is manageable',
      description: 'This specification appears to be well-scoped and does not require splitting.',
      reason: 'Total complexity score is within acceptable range'
    }];
  }
  
  // Analyze specific split opportunities
  const splitOpportunities = identifySplitOpportunities(spec, complexityScore, cohesionScore);
  
  // Priority 1: Multiple business domains
  const domainFinding = cohesionScore.findings.find(f => f.indicator === 'multipleDomains');
  if (domainFinding && domainFinding.count >= 3) {
    recommendations.push({
      type: 'domain-split',
      priority: 'high',
      title: 'Split by business domain',
      description: `This spec covers ${domainFinding.count} distinct business domains: ${domainFinding.matched.slice(0, 3).join(', ')}${domainFinding.count > 3 ? ', and others' : ''}`,
      suggestedSpecs: domainFinding.matched.map(domain => ({
        name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Feature`,
        focus: domain
      })),
      reason: 'Different business domains typically have different stakeholders, timelines, and requirements'
    });
  }
  
  // Priority 2: Multiple personas with distinct workflows
  const personaFinding = complexityScore.findings.find(f => f.indicator === 'multiplePersonas');
  if (personaFinding && personaFinding.count >= 4) {
    recommendations.push({
      type: 'persona-split',
      priority: 'high',
      title: 'Split by user persona',
      description: `This spec addresses ${personaFinding.count} different user personas with potentially different needs`,
      reason: 'Each persona may have distinct workflows, priorities, and success criteria'
    });
  }
  
  // Priority 3: Many functional requirements
  const reqFinding = complexityScore.findings.find(f => f.indicator === 'manyRequirements');
  if (reqFinding && reqFinding.count >= 12) {
    recommendations.push({
      type: 'functional-split',
      priority: 'medium',
      title: 'Split into smaller feature sets',
      description: `With ${reqFinding.count} functional requirements, consider grouping related requirements into separate specs`,
      reason: 'Large requirement sets are harder to implement, test, and maintain'
    });
  }
  
  // Priority 4: Multiple integration points
  const integrationFinding = complexityScore.findings.find(f => f.indicator === 'manyIntegrations');
  if (integrationFinding && integrationFinding.count >= 3) {
    recommendations.push({
      type: 'integration-split',
      priority: 'medium',
      title: 'Separate integration concerns',
      description: `This spec includes ${integrationFinding.count} external integrations that could be isolated`,
      reason: 'Each integration adds complexity and may have different timelines and dependencies'
    });
  }
  
  // Priority 5: Size-based split
  if (sizeScore.score >= 2) {
    recommendations.push({
      type: 'size-split',
      priority: 'low',
      title: 'Consider splitting for maintainability',
      description: `At ${sizeScore.metrics.lines} lines and ${sizeScore.metrics.words} words, this spec is becoming difficult to navigate`,
      reason: 'Smaller specs are easier to review, update, and implement'
    });
  }
  
  // Add general guidance
  if (recommendations.length > 0) {
    recommendations.push({
      type: 'guidance',
      priority: 'info',
      title: 'Splitting best practices',
      description: 'When splitting specs, ensure each new spec:\n' +
                   '• Has a clear, single purpose\n' +
                   '• Can be implemented independently (or with minimal dependencies)\n' +
                   '• Has its own success criteria and acceptance tests\n' +
                   '• Maintains proper references to related specs',
      reason: 'Well-split specs improve team velocity and reduce integration issues'
    });
  }
  
  return recommendations;
}

/**
 * Identify specific split opportunities in the spec
 */
function identifySplitOpportunities(spec, complexityScore, cohesionScore) {
  const opportunities = [];
  
  // Look for natural boundaries in the spec
  const sections = spec.sections || {};
  
  // Check if there are multiple distinct feature sets in functional requirements
  if (sections.functional_requirements) {
    const frText = typeof sections.functional_requirements === 'string' 
      ? sections.functional_requirements 
      : JSON.stringify(sections.functional_requirements);
    
    // Analyze FR groupings
    const frMatches = frText.match(/^#{2,3}\s*FR[-_]?(\d+):\s*([^\n]+)/gm) || [];
    if (frMatches.length >= 8) {
      opportunities.push({
        type: 'functional-grouping',
        count: frMatches.length,
        suggestion: 'Group related FRs into separate feature specs'
      });
    }
  }
  
  return opportunities;
}

/**
 * Generate a summary of the analysis
 */
function generateSummary(spec, shouldSplit, totalScore) {
  const name = spec.metadata?.name || 'this specification';
  
  if (!shouldSplit) {
    return `The specification "${name}" is well-scoped and does not require splitting. ` +
           `The complexity score (${totalScore}) indicates it can be implemented as a single feature.`;
  }
  
  return `The specification "${name}" shows signs of being too large or covering multiple concerns ` +
         `(complexity score: ${totalScore}). Consider splitting it into smaller, more focused specifications ` +
         `to improve implementation speed, reduce risk, and enable parallel development.`;
}

/**
 * Format analysis results for display
 */
function formatAnalysisReport(analysis) {
  const lines = [];
  
  lines.push('═'.repeat(80));
  lines.push('SPEC ARCHITECTURE ANALYSIS');
  lines.push('═'.repeat(80));
  lines.push('');
  
  // Overall recommendation
  lines.push(`**Recommendation:** ${analysis.shouldSplit ? '⚠️  SPLIT RECOMMENDED' : '✓ No split needed'}`);
  lines.push(`**Confidence:** ${analysis.confidence.toUpperCase()}`);
  lines.push(`**Total Score:** ${analysis.totalScore}/20 (threshold: 10)`);
  lines.push('');
  
  // Summary
  lines.push('**Summary:**');
  lines.push(analysis.summary);
  lines.push('');
  
  // Detailed scores
  if (analysis.scores.complexity.findings.length > 0) {
    lines.push('**Complexity Indicators:**');
    for (const finding of analysis.scores.complexity.findings) {
      lines.push(`  • ${finding.description}: ${finding.count} (threshold: ${finding.threshold}) [+${finding.contribution}pts]`);
    }
    lines.push(`  Total complexity score: ${analysis.scores.complexity.score}`);
    lines.push('');
  }
  
  if (analysis.scores.cohesion.findings.length > 0) {
    lines.push('**Cohesion Indicators:**');
    for (const finding of analysis.scores.cohesion.findings) {
      lines.push(`  • ${finding.description}: ${finding.count} domains detected [+${finding.contribution}pts]`);
      if (finding.matched && finding.matched.length > 0) {
        lines.push(`    Domains: ${finding.matched.slice(0, 5).join(', ')}${finding.matched.length > 5 ? '...' : ''}`);
      }
    }
    lines.push(`  Total cohesion score: ${analysis.scores.cohesion.score}`);
    lines.push('');
  }
  
  if (analysis.scores.size.findings.length > 0) {
    lines.push('**Size Metrics:**');
    lines.push(`  • Lines: ${analysis.scores.size.metrics.lines}`);
    lines.push(`  • Words: ${analysis.scores.size.metrics.words}`);
    lines.push(`  • Characters: ${analysis.scores.size.metrics.chars}`);
    for (const finding of analysis.scores.size.findings) {
      lines.push(`  • ${finding.description} [+${finding.contribution || 0}pts]`);
    }
    lines.push(`  Total size score: ${analysis.scores.size.score}`);
    lines.push('');
  }
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push('**Recommendations:**');
    lines.push('');
    
    for (const rec of analysis.recommendations) {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : rec.priority === 'low' ? '🔵' : 'ℹ️';
      lines.push(`${priority} **${rec.title}** [${rec.priority.toUpperCase()}]`);
      lines.push(`   ${rec.description}`);
      if (rec.reason) {
        lines.push(`   *Reason: ${rec.reason}*`);
      }
      if (rec.suggestedSpecs) {
        lines.push(`   *Suggested specs:*`);
        for (const spec of rec.suggestedSpecs.slice(0, 3)) {
          lines.push(`     - ${spec.name} (focus: ${spec.focus})`);
        }
      }
      lines.push('');
    }
  }
  
  lines.push('═'.repeat(80));
  
  return lines.join('\n');
}

module.exports = {
  analyzeSpec,
  formatAnalysisReport,
  COMPLEXITY_INDICATORS,
  COHESION_INDICATORS
};
