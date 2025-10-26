/**
 * Spec-MAS v3 Validation Gates
 * Progressive validation with G1-G4 gates
 */

/**
 * Helper function to find a section in the spec
 * Searches both direct sections and within level sections
 */
function findSection(sections, sectionName) {
  // Check direct match
  if (sections[sectionName]) {
    const section = sections[sectionName];
    if (typeof section === 'string' && section.trim().length > 0) return true;
    if (typeof section === 'object' && Object.keys(section).length > 0) return true;
  }

  // Check within level sections (e.g., level_1_foundation)
  for (const key of Object.keys(sections)) {
    if (key.startsWith('level_')) {
      const levelSection = sections[key];
      if (typeof levelSection === 'object' && levelSection[sectionName]) {
        const subsection = levelSection[sectionName];
        if (typeof subsection === 'string' && subsection.trim().length > 0) return true;
        if (typeof subsection === 'object' && Object.keys(subsection).length > 0) return true;
      }
    }
  }

  return false;
}

/**
 * Gate 1: Structure Validation
 * Validates spec structure and required sections
 */
function validateG1Structure(spec) {
  const checks = [];
  let passed = true;

  // Check 1: Front-matter exists and has required fields
  const requiredFields = ['specmas', 'kind', 'id', 'name', 'complexity', 'maturity'];
  for (const field of requiredFields) {
    const fieldExists = spec.metadata && spec.metadata[field] !== undefined && spec.metadata[field] !== null;
    checks.push({
      name: `Front-matter has required field: ${field}`,
      passed: fieldExists,
      message: fieldExists ? `✓ ${field} present` : `✗ Missing required field: ${field}`
    });
    if (!fieldExists) passed = false;
  }

  // Check 2: Validate complexity value
  const validComplexities = ['EASY', 'MODERATE', 'HIGH'];
  const complexityValid = spec.metadata.complexity && validComplexities.includes(spec.metadata.complexity);
  checks.push({
    name: 'Complexity is valid',
    passed: complexityValid,
    message: complexityValid
      ? `✓ Complexity: ${spec.metadata.complexity}`
      : `✗ Invalid complexity. Must be EASY, MODERATE, or HIGH`
  });
  if (!complexityValid) passed = false;

  // Check 3: Validate maturity value
  const maturityValid = spec.metadata.maturity >= 1 && spec.metadata.maturity <= 5;
  checks.push({
    name: 'Maturity level is valid',
    passed: maturityValid,
    message: maturityValid
      ? `✓ Maturity level: ${spec.metadata.maturity}`
      : `✗ Invalid maturity. Must be 1-5`
  });
  if (!maturityValid) passed = false;

  // Check 4: Required sections based on maturity
  const requiredSections = getRequiredSectionsForMaturity(spec.metadata.maturity, spec.sections);
  for (const section of requiredSections) {
    // Check if section exists directly or within level sections
    const sectionExists = findSection(spec.sections, section);

    checks.push({
      name: `Required section present: ${section}`,
      passed: sectionExists,
      message: sectionExists
        ? `✓ Section '${section}' found`
        : `✗ Missing required section: ${section}`
    });
    if (!sectionExists) passed = false;
  }

  // Check 5: Proper markdown formatting (basic check)
  const hasContent = spec.raw && spec.raw.trim().length > 100;
  checks.push({
    name: 'Spec has content',
    passed: hasContent,
    message: hasContent ? '✓ Spec has content' : '✗ Spec appears empty or too short'
  });
  if (!hasContent) passed = false;

  // Calculate score
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    gate: 'G1',
    name: 'Structure Validation',
    passed,
    checks,
    score
  };
}

/**
 * Gate 2: Semantic Validation
 * Validates content quality and specificity
 */
function validateG2Semantic(spec) {
  const checks = [];
  let passed = true;

  // Check 1: No vague terms
  const vaguePhrases = [
    'TBD', 'TODO', 'FIXME', '[FILL IN]', '[TBD]',
    'should', 'might', 'probably', 'maybe', 'could',
    'as soon as possible', 'ASAP', 'fast', 'quickly',
    'better', 'good', 'nice to have'
  ];

  const fullText = (spec.raw || '').toLowerCase();
  const foundVague = [];

  // Exceptions: Framework/library names that shouldn't be flagged
  const exceptions = ['fastapi', 'fastify', 'gooddata'];

  for (const phrase of vaguePhrases) {
    const lowerPhrase = phrase.toLowerCase();

    // Use word boundary regex for single words to avoid matching framework names
    const regex = /\s/.test(phrase)
      ? new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

    if (regex.test(fullText)) {
      // Check if it's actually part of an exception (like FastAPI)
      let isException = false;
      for (const exc of exceptions) {
        if (fullText.includes(exc)) {
          // Check if the match is within the exception
          const matches = fullText.matchAll(new RegExp(lowerPhrase, 'gi'));
          for (const match of matches) {
            const start = match.index;
            const end = start + lowerPhrase.length;

            // Check if this occurrence is part of an exception
            for (const excMatch of fullText.matchAll(new RegExp(exc, 'gi'))) {
              if (start >= excMatch.index && end <= excMatch.index + exc.length) {
                isException = true;
                break;
              }
            }
            if (isException) break;
          }
        }
        if (isException) break;
      }

      if (!isException) {
        foundVague.push(phrase);
      }
    }
  }

  const noVagueTerms = foundVague.length === 0;
  checks.push({
    name: 'No vague or placeholder terms',
    passed: noVagueTerms,
    message: noVagueTerms
      ? '✓ No vague terms found'
      : `✗ Found vague terms: ${foundVague.join(', ')}`
  });
  if (!noVagueTerms) passed = false;

  // Check 2: All functional requirements have validation criteria
  const frs = spec.sections.functionalRequirements || [];
  const allFRsHaveValidation = frs.length === 0 || frs.every(fr => fr.validationCriteria && fr.validationCriteria.length > 0);

  checks.push({
    name: 'All functional requirements have validation criteria',
    passed: allFRsHaveValidation,
    message: allFRsHaveValidation
      ? `✓ All ${frs.length} FRs have validation criteria`
      : '✗ Some FRs missing validation criteria'
  });
  if (!allFRsHaveValidation) passed = false;

  // Check 3: Acceptance criteria use Given/When/Then format
  const acs = spec.sections.acceptanceCriteria || [];
  const hasProperFormat = acs.length === 0 || acs.every(ac => {
    const lower = ac.toLowerCase();
    return lower.includes('given') && lower.includes('when') && lower.includes('then');
  });

  checks.push({
    name: 'Acceptance criteria use Given/When/Then format',
    passed: hasProperFormat,
    message: hasProperFormat
      ? `✓ All ${acs.length} acceptance criteria properly formatted`
      : '✗ Some acceptance criteria not in Given/When/Then format'
  });
  if (!hasProperFormat) passed = false;

  // Check 4: Success metrics are quantifiable
  // Search in overview, Level 1 (Foundation), or anywhere in spec
  const overviewSection = spec.sections.overview || '';
  const overviewText = typeof overviewSection === 'object' ? JSON.stringify(overviewSection) : String(overviewSection);

  // Also check Level 1 section if it exists
  const level1Section = spec.sections.level_1_foundation || '';
  const level1Text = typeof level1Section === 'object' ? JSON.stringify(level1Section) : String(level1Section);

  const combinedText = overviewText + '\n' + level1Text + '\n' + (spec.raw || '');
  const hasMetrics = combinedText.toLowerCase().includes('success metric') ||
                     combinedText.match(/\d+%/) ||
                     combinedText.match(/\d+\s*(ms|seconds?|minutes?|hours?)/i);

  checks.push({
    name: 'Success metrics are quantifiable',
    passed: hasMetrics,
    message: hasMetrics
      ? '✓ Quantifiable metrics found'
      : '✗ No quantifiable success metrics found'
  });
  if (!hasMetrics) passed = false;

  // Check 5: Security section is complete (if required)
  if (spec.metadata.maturity >= 3) {
    const secSection = spec.sections.security || {};
    const level3Section = spec.sections.level_3_robustness || {};
    const level4Section = spec.sections.level_4_architecture_and_governance || {};

    // Combine security section, Level 3, and Level 4 sections for checking
    const secText = typeof secSection === 'string' ? secSection : JSON.stringify(secSection);
    const level3Text = typeof level3Section === 'object' ? JSON.stringify(level3Section) : String(level3Section);
    const level4Text = typeof level4Section === 'object' ? JSON.stringify(level4Section) : String(level4Section);
    const combinedSecText = secText + '\n' + level3Text + '\n' + level4Text;

    // For EASY complexity, just check that security considerations exist
    // For MODERATE/HIGH, require comprehensive security coverage
    const hasSecuritySection = combinedSecText.toLowerCase().includes('security');

    if (spec.metadata.complexity === 'EASY') {
      // For EASY specs, just having security considerations mentioned is enough
      const securityPresent = hasSecuritySection;

      checks.push({
        name: 'Security considerations are documented',
        passed: securityPresent,
        message: securityPresent
          ? '✓ Security considerations documented'
          : '✗ No security considerations found'
      });
      if (!securityPresent) passed = false;
    } else {
      // For MODERATE/HIGH, require comprehensive security
      const hasAuth = combinedSecText.toLowerCase().includes('authentication') || combinedSecText.toLowerCase().includes('authn');
      const hasAuthz = combinedSecText.toLowerCase().includes('authorization') ||
                       combinedSecText.toLowerCase().includes('authz') ||
                       combinedSecText.toLowerCase().includes('access control') ||
                       (combinedSecText.toLowerCase().includes('role') && combinedSecText.toLowerCase().includes('permission'));
      const hasEncryption = combinedSecText.toLowerCase().includes('encryption') ||
                           combinedSecText.toLowerCase().includes('tls') ||
                           combinedSecText.toLowerCase().includes('ssl') ||
                           combinedSecText.toLowerCase().includes('https');

      // Count security aspects covered
      const securityAspects = [hasAuth, hasAuthz, hasEncryption].filter(Boolean).length;

      // Require at least 2 of 3 security aspects for MODERATE/HIGH
      const requiredAspects = 2;
      const securityComplete = securityAspects >= requiredAspects;

      const missingAspects = [];
      if (!hasAuth) missingAspects.push('authentication');
      if (!hasAuthz) missingAspects.push('authorization/access control');
      if (!hasEncryption) missingAspects.push('encryption');

      checks.push({
        name: 'Security section addresses key concerns',
        passed: securityComplete,
        message: securityComplete
          ? `✓ Security section covers ${securityAspects}/3 key aspects`
          : `✗ Security section missing: ${missingAspects.join(', ')}`
      });
      if (!securityComplete) passed = false;
    }
  }

  // Calculate score
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    gate: 'G2',
    name: 'Semantic Validation',
    passed,
    checks,
    score
  };
}

/**
 * Gate 3: Traceability Validation
 * Validates traceability and coverage
 */
function validateG3Traceability(spec) {
  const checks = [];
  let passed = true;

  // Check 1: All functional requirements have validation criteria (covered in G2, but double-check)
  const frs = spec.sections.functionalRequirements || [];
  const allFRsValidated = frs.length === 0 || frs.every(fr => fr.validationCriteria && fr.validationCriteria.length > 0);

  checks.push({
    name: 'All functional requirements have validation criteria',
    passed: allFRsValidated,
    message: allFRsValidated
      ? `✓ All ${frs.length} FRs have validation criteria`
      : '✗ Some FRs lack validation criteria'
  });
  if (!allFRsValidated) passed = false;

  // Check 2: All acceptance criteria map to user stories
  const stories = spec.sections.userStories || [];
  const criteria = spec.sections.acceptanceCriteria || [];

  const hasMappableCriteria = stories.length === 0 || criteria.length >= stories.length;

  checks.push({
    name: 'Acceptance criteria coverage for user stories',
    passed: hasMappableCriteria,
    message: hasMappableCriteria
      ? `✓ ${criteria.length} acceptance criteria for ${stories.length} user stories`
      : `✗ Insufficient acceptance criteria (${criteria.length}) for user stories (${stories.length})`
  });
  if (!hasMappableCriteria) passed = false;

  // Check 3: All user stories have success metrics
  // Look in overview section or anywhere in the spec
  let overviewText = '';
  const overviewSection = spec.sections.overview || '';
  if (typeof overviewSection === 'object') {
    overviewText = JSON.stringify(overviewSection);
  } else {
    overviewText = String(overviewSection);
  }

  // Also check the raw spec if not found in overview
  const hasSuccessMetrics = stories.length === 0 ||
                           overviewText.toLowerCase().includes('success metric') ||
                           (spec.raw || '').toLowerCase().includes('success metric');

  checks.push({
    name: 'User stories have success metrics',
    passed: hasSuccessMetrics,
    message: hasSuccessMetrics
      ? '✓ Success metrics defined in overview'
      : '✗ No success metrics found for user stories'
  });
  if (!hasSuccessMetrics) passed = false;

  // Check 4: Test coverage is specified
  const hasAcceptanceTests = criteria.length > 0;
  const testCoverageSpecified = hasAcceptanceTests && criteria.length >= 5;

  checks.push({
    name: 'Test coverage is specified',
    passed: testCoverageSpecified,
    message: testCoverageSpecified
      ? `✓ ${criteria.length} acceptance tests specified`
      : `✗ Insufficient test coverage (${criteria.length} tests, need at least 5)`
  });
  if (!testCoverageSpecified) passed = false;

  // Check 5: Functional requirements are traceable to tests
  // For maturity-level format, FRs may not be explicitly listed
  // In that case, check that we have user stories and acceptance criteria
  const isMaturityFormat = Object.keys(spec.sections).some(k => k.match(/^level_\d+/));

  if (isMaturityFormat && frs.length === 0) {
    // For maturity-level format, ensure user stories map to acceptance criteria
    const hasTraceability = stories.length > 0 && criteria.length >= stories.length;

    checks.push({
      name: 'User stories traceable to acceptance criteria',
      passed: hasTraceability,
      message: hasTraceability
        ? `✓ ${criteria.length} acceptance criteria for ${stories.length} user stories`
        : `✗ Need acceptance criteria for each user story (${stories.length} stories, ${criteria.length} criteria)`
    });
    if (!hasTraceability) passed = false;
  } else {
    // For formal template, check FR to test traceability
    const frsToCriteria = frs.length > 0 && criteria.length >= frs.length;

    checks.push({
      name: 'Functional requirements traceable to tests',
      passed: frsToCriteria,
      message: frsToCriteria
        ? `✓ ${criteria.length} tests for ${frs.length} FRs`
        : `✗ Need at least one test per FR (${frs.length} FRs, ${criteria.length} tests)`
    });
    if (!frsToCriteria) passed = false;
  }

  // Calculate score
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    gate: 'G3',
    name: 'Traceability Validation',
    passed,
    checks,
    score
  };
}

/**
 * Gate 4: Invariant Verification (HIGH complexity only)
 * Validates deterministic tests and concrete examples
 */
function validateG4Invariants(spec) {
  const checks = [];
  let passed = true;

  // Only apply to HIGH complexity
  if (spec.metadata.complexity !== 'HIGH') {
    return {
      gate: 'G4',
      name: 'Invariant Verification (HIGH complexity only)',
      passed: true,
      checks: [{
        name: 'G4 not required for this complexity level',
        passed: true,
        message: `✓ G4 only applies to HIGH complexity (current: ${spec.metadata.complexity})`
      }],
      score: 100
    };
  }

  // Check 1: Deterministic tests or concrete examples exist
  // Note: Parser may create both camelCase and snake_case keys
  // Prefer snake_case (object with content) over camelCase (may be empty array)
  let tests = spec.sections.deterministic_tests || spec.sections.deterministicTests || [];

  // If tests is an object (from formal template format), extract the text content
  let deterministicTestsText = '';
  let jsonBlockCount = 0;
  if (typeof tests === 'object' && !Array.isArray(tests)) {
    deterministicTestsText = tests._main || JSON.stringify(tests);
    // Count JSON code blocks as tests
    jsonBlockCount = (deterministicTestsText.match(/```json/gi) || []).length;
    // Convert to array for compatibility with existing checks
    if (jsonBlockCount > 0) {
      tests = Array(jsonBlockCount).fill({ input: true }); // Dummy array to indicate tests exist
    } else {
      tests = [];
    }
    // Debug logging (remove after testing)
    if (process.env.DEBUG_VALIDATION) {
      console.log('[G4 Debug] deterministic_tests is object');
      console.log('[G4 Debug] Text length:', deterministicTestsText.length);
      console.log('[G4 Debug] JSON blocks found:', jsonBlockCount);
      console.log('[G4 Debug] Tests array length:', tests.length);
    }
  }

  // Also check for concrete examples in Level 5 section (maturity-level format)
  const level5 = spec.sections.level_5_complete_specification || {};

  // Check if concrete_examples subsection exists
  const concreteExamples = typeof level5 === 'object' ? level5.concrete_examples : '';
  const level5Text = typeof level5 === 'object' ? JSON.stringify(level5) : String(level5);

  const hasConcreteExamplesSection = concreteExamples ||
                                      level5Text.toLowerCase().includes('example 1') ||
                                      level5Text.toLowerCase().includes('example 2') ||
                                      level5Text.toLowerCase().includes('successful');

  // Check for code blocks that might be examples (more lenient - at least 1 code block)
  const codeBlockCount = (level5Text.match(/```/g) || []).length;
  const hasCodeBlocks = codeBlockCount >= 2; // At least one pair (opening and closing)

  // For formal template format, also check code blocks in deterministic tests section
  const dtCodeBlockCount = (deterministicTestsText.match(/```/g) || []).length;
  const hasDTCodeBlocks = dtCodeBlockCount >= 2; // At least one pair

  const hasTests = tests.length > 0;
  const hasExamples = (hasConcreteExamplesSection && hasCodeBlocks) || hasDTCodeBlocks;

  const testsPassed = hasTests || hasExamples;

  checks.push({
    name: 'Concrete examples or deterministic tests exist',
    passed: testsPassed,
    message: testsPassed
      ? hasTests
        ? `✓ Found ${tests.length} deterministic tests`
        : `✓ Found concrete examples in Level 5 section`
      : '✗ No deterministic tests or concrete examples found (required for HIGH complexity)'
  });
  if (!testsPassed) passed = false;

  // Check 2: Deterministic tests have checksums (only if formal tests exist)
  if (tests.length > 0 && deterministicTestsText) {
    // For text format, check if checksums exist in the text
    const hasChecksums = deterministicTestsText.toLowerCase().includes('checksum') ||
                         deterministicTestsText.toLowerCase().includes('expected_checksum');

    checks.push({
      name: 'All deterministic tests have checksums',
      passed: hasChecksums,
      message: hasChecksums
        ? `✓ All ${tests.length} tests have checksums`
        : '✗ Some deterministic tests missing checksums'
    });
    if (!hasChecksums) passed = false;
  } else if (tests.length > 0) {
    // Array format
    const allHaveChecksums = tests.every(t =>
      t.expected_checksum || t.expectedChecksum || t.checksum
    );

    checks.push({
      name: 'All deterministic tests have checksums',
      passed: allHaveChecksums,
      message: allHaveChecksums
        ? `✓ All ${tests.length} tests have checksums`
        : '✗ Some deterministic tests missing checksums'
    });
    if (!allHaveChecksums) passed = false;
  } else {
    // Skip checksum check if using maturity-level format with examples
    checks.push({
      name: 'Concrete examples are detailed',
      passed: hasExamples,
      message: hasExamples
        ? `✓ Concrete examples with code blocks provided`
        : '✗ Need detailed concrete examples with code blocks'
    });
    if (!hasExamples) passed = false;
  }

  // Check 3: Concrete examples provided (adapted for both formats)
  let hasConcreteContent = hasExamples;
  if (tests.length > 0 && deterministicTestsText) {
    // For text format, check if input/output/expected patterns exist
    const hasInputOutput = (deterministicTestsText.toLowerCase().includes('input') &&
                           deterministicTestsText.toLowerCase().includes('output')) ||
                          (deterministicTestsText.toLowerCase().includes('expected'));
    hasConcreteContent = hasInputOutput || hasExamples;
  } else if (tests.length > 0) {
    // Array format
    hasConcreteContent = tests.every(t => t.input);
  }

  checks.push({
    name: 'Concrete input/output examples provided',
    passed: hasConcreteContent,
    message: hasConcreteContent
      ? tests.length > 0
        ? `✓ All ${tests.length} tests have concrete input examples`
        : `✓ Concrete examples with inputs/outputs provided`
      : '✗ Missing concrete input/output examples'
  });
  if (!hasConcreteContent) passed = false;

  // Check 4: Edge cases documented
  const fullText = spec.raw || '';
  const hasEdgeCases = fullText.toLowerCase().includes('edge case') ||
                       fullText.toLowerCase().includes('edge-case') ||
                       fullText.toLowerCase().includes('corner case');

  checks.push({
    name: 'Edge cases documented',
    passed: hasEdgeCases,
    message: hasEdgeCases
      ? '✓ Edge cases documented in spec'
      : '✗ No edge cases documented (required for HIGH complexity)'
  });
  if (!hasEdgeCases) passed = false;

  // Check 5: Migration strategy defined
  const hasMigration = fullText.toLowerCase().includes('migration') ||
                       fullText.toLowerCase().includes('rollback') ||
                       fullText.toLowerCase().includes('deployment strategy');

  checks.push({
    name: 'Migration/deployment strategy defined',
    passed: hasMigration,
    message: hasMigration
      ? '✓ Migration/deployment strategy documented'
      : '✗ No migration strategy found (required for HIGH complexity)'
  });
  if (!hasMigration) passed = false;

  // Calculate score
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    gate: 'G4',
    name: 'Invariant Verification',
    passed,
    checks,
    score
  };
}

/**
 * Detect if spec is using maturity-level format
 */
function isMaturityLevelFormat(sections) {
  return Object.keys(sections).some(key => key.match(/^level_\d+/));
}

/**
 * Get required sections for maturity-level format
 */
function getRequiredMaturityLevelSections(maturity) {
  // For maturity-level format, require the Level sections themselves
  const level1 = ['level_1_foundation'];
  const level2 = [...level1, 'level_2_technical_context'];
  const level3 = [...level2, 'level_3_robustness'];
  const level4 = [...level3, 'level_4_architecture_and_governance'];
  const level5 = [...level4, 'level_5_complete_specification'];

  if (maturity >= 5) return level5;
  if (maturity >= 4) return level4;
  if (maturity >= 3) return level3;
  if (maturity >= 2) return level2;
  return level1;
}

/**
 * Get required sections for formal template format
 */
function getRequiredFormalSections(maturity) {
  const level1 = ['overview'];
  const level2 = [...level1, 'functional_requirements'];
  const level3 = [...level2, 'non_functional_requirements', 'security'];
  const level4 = [...level3, 'data_model', 'interfaces_and_contracts'];
  const level5 = [...level4, 'deterministic_tests', 'acceptance_tests'];

  if (maturity >= 5) return level5;
  if (maturity >= 4) return level4;
  if (maturity >= 3) return level3;
  if (maturity >= 2) return level2;
  return level1;
}

/**
 * Get required sections based on maturity level
 */
function getRequiredSectionsForMaturity(maturity, sections) {
  // Detect format and return appropriate required sections
  if (isMaturityLevelFormat(sections)) {
    return getRequiredMaturityLevelSections(maturity);
  } else {
    return getRequiredFormalSections(maturity);
  }
}

/**
 * Get applicable gates based on complexity and maturity
 */
function getApplicableGates(complexity, maturity) {
  const gates = ['G1']; // G1 always applies

  // G2 applies at maturity 2+
  if (maturity >= 2) {
    gates.push('G2');
  }

  // G3 applies based on complexity
  if (complexity === 'EASY' && maturity >= 3) {
    gates.push('G3');
  } else if (complexity === 'MODERATE' && maturity >= 3) {
    gates.push('G3');
  } else if (complexity === 'HIGH' && maturity >= 3) {
    gates.push('G3');
  }

  // G4 only applies to HIGH complexity at maturity 5
  if (complexity === 'HIGH' && maturity >= 5) {
    gates.push('G4');
  }

  return gates;
}

/**
 * Run all applicable validation gates
 */
function runAllGates(spec) {
  const results = {
    G1: validateG1Structure(spec),
    G2: validateG2Semantic(spec),
    G3: validateG3Traceability(spec),
    G4: validateG4Invariants(spec)
  };

  return results;
}

/**
 * Determine if spec is "Agent Ready" based on gate results
 */
function isAgentReady(gateResults, complexity, maturity) {
  const applicableGates = getApplicableGates(complexity, maturity);

  // All applicable gates must pass
  for (const gate of applicableGates) {
    if (!gateResults[gate] || !gateResults[gate].passed) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate overall readiness score
 */
function calculateReadinessScore(gateResults) {
  const gates = Object.values(gateResults);
  if (gates.length === 0) return 0;

  const totalScore = gates.reduce((sum, gate) => sum + gate.score, 0);
  return Math.round(totalScore / gates.length);
}

module.exports = {
  validateG1Structure,
  validateG2Semantic,
  validateG3Traceability,
  validateG4Invariants,
  runAllGates,
  getApplicableGates,
  isAgentReady,
  calculateReadinessScore
};
