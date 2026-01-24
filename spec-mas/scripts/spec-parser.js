/**
 * Spec-MAS v3 Spec Parser
 * Parses markdown files with YAML front-matter into structured JSON
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Parse a spec file and return structured JSON representation
 * @param {string} filePath - Path to the spec markdown file
 * @returns {object} Parsed spec with metadata and sections
 */
function parseSpec(filePath) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');

    // Parse front-matter and body
    const { frontMatter, body } = extractFrontMatter(content);

    // Parse markdown sections
    const sections = parseMarkdownSections(body);

    // Combine into structured format
    const spec = {
      metadata: frontMatter || {},
      sections: sections,
      raw: content,
      filePath: path.resolve(filePath)
    };

    return spec;
  } catch (error) {
    throw new Error(`Failed to parse spec file ${filePath}: ${error.message}`);
  }
}

/**
 * Normalize front-matter field names to v3 standard
 * @param {object} frontMatter - Raw front-matter object
 * @returns {object} Normalized front-matter
 */
function normalizeFrontMatter(frontMatter) {
  const normalized = { ...frontMatter };

  // Map legacy field names to v3 standard
  const fieldMappings = {
    'maturity_level': 'maturity',
    'title': 'name',
    'author': 'owners'
  };

  for (const [oldField, newField] of Object.entries(fieldMappings)) {
    if (normalized[oldField] !== undefined && normalized[newField] === undefined) {
      normalized[newField] = normalized[oldField];
    }
  }

  // Handle special cases
  if (normalized.owners && typeof normalized.owners === 'string') {
    // Convert string author to owners array
    normalized.owners = [{ name: normalized.owners }];
  }

  // Ensure specmas version is set if not present
  if (!normalized.specmas) {
    normalized.specmas = 'v3';
  }

  // Set default kind if not present
  if (!normalized.kind && normalized.title) {
    normalized.kind = 'FeatureSpec';
  }

  // Generate ID from title if missing
  if (!normalized.id && normalized.name) {
    normalized.id = 'feat-' + normalized.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  return normalized;
}

/**
 * Extract YAML front-matter from markdown content
 * @param {string} content - Raw markdown content
 * @returns {object} Front-matter object and remaining body
 */
function extractFrontMatter(content) {
  // Try standard front-matter at beginning
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  let match = content.match(frontMatterRegex);

  // Try front-matter after title (common in examples)
  if (!match) {
    const altRegex = /^#[^\n]*\n\n---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    match = content.match(altRegex);

    if (match) {
      try {
        let frontMatter = yaml.load(match[1]);
        frontMatter = normalizeFrontMatter(frontMatter);
        const body = content.slice(content.indexOf('---'));
        return { frontMatter, body };
      } catch (error) {
        return { frontMatter: null, body: content };
      }
    }
  }

  if (!match) {
    return { frontMatter: null, body: content };
  }

  try {
    let frontMatter = yaml.load(match[1]);

    // Normalize legacy field names to v3 format
    if (frontMatter) {
      frontMatter = normalizeFrontMatter(frontMatter);
    }

    const body = match[2];
    return { frontMatter, body };
  } catch (error) {
    throw new Error(`Failed to parse YAML front-matter: ${error.message}`);
  }
}

/**
 * Detect which format the spec is using
 * @param {object} sections - Parsed sections
 * @returns {string} 'maturity-level' or 'formal-template'
 */
function detectSpecFormat(sections) {
  // Check for maturity-level format (Level 1, Level 2, etc.)
  const hasLevelSections = Object.keys(sections).some(key =>
    key.match(/^level_\d+/)
  );

  if (hasLevelSections) {
    return 'maturity-level';
  }

  // Check for formal template sections
  const formalSections = ['overview', 'functional_requirements', 'acceptance_tests'];
  const hasFormalSections = formalSections.some(section => sections[section]);

  if (hasFormalSections) {
    return 'formal-template';
  }

  // Default to formal template if unclear
  return 'formal-template';
}

/**
 * Map maturity-level sections to semantic categories
 * @param {object} sections - Sections with maturity-level format
 * @returns {object} Mapped sections
 */
function mapMaturityLevelSections(sections) {
  const mapped = { ...sections };

  // Level 1: Foundation -> User Stories, Acceptance Criteria, Success Metrics
  const level1 = sections.level_1_foundation || sections.level_1 || {};
  if (typeof level1 === 'object' && Object.keys(level1).length > 0) {
    // Extract overview from Level 1 content
    const level1Text = Object.values(level1).join('\n');
    if (!mapped.overview) {
      mapped.overview = level1Text;
    }

    // Extract acceptance criteria from Level 1
    if (level1.acceptance_criteria && !mapped.acceptance_criteria) {
      mapped.acceptance_criteria = level1.acceptance_criteria;
    }
  }

  // Level 2: Technical Context -> Technical Constraints, Integration Points, Data Models
  const level2 = sections.level_2_technical_context || sections.level_2 || {};
  if (typeof level2 === 'object' && Object.keys(level2).length > 0) {
    // Map data models
    if (level2.data_models && !mapped.data_model) {
      mapped.data_model = level2.data_models;
    }

    // Map integration points to interfaces
    if (level2.integration_points && !mapped.interfaces_and_contracts) {
      mapped.interfaces_and_contracts = level2.integration_points;
    }

    // Map technical constraints to non-functional requirements
    if (level2.technical_constraints && !mapped.non_functional_requirements) {
      mapped.non_functional_requirements = level2.technical_constraints;
    }
  }

  // Level 3: Robustness -> Error Scenarios, Performance, Security
  const level3 = sections.level_3_robustness || sections.level_3 || {};
  if (typeof level3 === 'object' && Object.keys(level3).length > 0) {
    // Map security considerations
    if (level3.security_considerations && !mapped.security) {
      mapped.security = level3.security_considerations;
    }

    // Map performance requirements to NFRs
    if (level3.performance_requirements && !mapped.non_functional_requirements) {
      mapped.non_functional_requirements = level3.performance_requirements;
    }

    // Combine NFRs if both exist
    if (level3.performance_requirements && mapped.non_functional_requirements &&
        mapped.non_functional_requirements !== level3.performance_requirements) {
      mapped.non_functional_requirements = `${mapped.non_functional_requirements}\n\n${level3.performance_requirements}`;
    }
  }

  // Level 4: Architecture & Governance
  const level4 = sections.level_4_architecture_and_governance ||
                 sections.level_4_architecture_governance ||
                 sections.level_4 || {};
  if (typeof level4 === 'object' && Object.keys(level4).length > 0) {
    // Map architectural patterns to interfaces
    if (level4.architectural_patterns && !mapped.interfaces_and_contracts) {
      mapped.interfaces_and_contracts = level4.architectural_patterns;
    }
  }

  // Level 5: Complete Specification -> Concrete Examples, Edge Cases
  const level5 = sections.level_5_complete_specification || sections.level_5 || {};
  if (typeof level5 === 'object' && Object.keys(level5).length > 0) {
    // Map concrete examples to acceptance tests
    if (level5.concrete_examples && !mapped.acceptance_tests) {
      mapped.acceptance_tests = level5.concrete_examples;
    }
  }

  return mapped;
}

/**
 * Parse markdown body into structured sections
 * @param {string} body - Markdown body content
 * @returns {object} Sections with their content
 */
function parseMarkdownSections(body) {
  const sections = {};
  const lines = body.split('\n');

  let currentSection = null;
  let currentSubsection = null;
  let currentContent = [];

  // Section patterns
  const h1Pattern = /^#\s+(.+)$/;
  const h2Pattern = /^##\s+(.+)$/;
  const h3Pattern = /^###\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for H1 headers (main sections)
    const h1Match = line.match(h1Pattern);
    if (h1Match) {
      // Save previous section
      if (currentSection) {
        saveSection(sections, currentSection, currentSubsection, currentContent);
      }

      currentSection = normalizeKey(h1Match[1]);
      currentSubsection = null;
      currentContent = [];
      continue;
    }

    // Check for H2 headers (subsections or main sections)
    const h2Match = line.match(h2Pattern);
    if (h2Match) {
      // Save previous section/subsection
      if (currentSection && currentSubsection) {
        saveSection(sections, currentSection, currentSubsection, currentContent);
      } else if (currentSection) {
        saveSection(sections, currentSection, null, currentContent);
      }

      // Normalize the section name to check if it's a formal template section
      const sectionName = normalizeKey(h2Match[1]);

      // Check if this is a formal template main section
      const isFormalSection = Object.values(FORMAL_SECTION_MAPPINGS).includes(sectionName);

      // Check if this is a "Level X:" pattern - treat as main section
      const isLevelSection = h2Match[1].match(/^Level\s+\d+/i);

      if (isLevelSection || isFormalSection || !currentSection) {
        // Treat as main section
        currentSection = sectionName;
        currentSubsection = null;
      } else {
        // Treat as subsection
        currentSubsection = sectionName;
      }

      currentContent = [];
      continue;
    }

    // Check for H3 headers (subsections within H2)
    const h3Match = line.match(h3Pattern);
    if (h3Match && currentSection) {
      // Save previous subsection if exists
      if (currentSubsection) {
        saveSection(sections, currentSection, currentSubsection, currentContent);
        currentContent = [];
      }

      // Start new subsection
      currentSubsection = normalizeKey(h3Match[1]);
      continue;
    }

    // Regular content
    if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    saveSection(sections, currentSection, currentSubsection, currentContent);
  }

  // Detect format and map if necessary
  const format = detectSpecFormat(sections);
  let finalSections = sections;

  if (format === 'maturity-level') {
    finalSections = mapMaturityLevelSections(sections);
  }

  // Extract specific structured data
  finalSections.functionalRequirements = extractFunctionalRequirements(finalSections);
  finalSections.userStories = extractUserStories(finalSections);
  finalSections.acceptanceCriteria = extractAcceptanceCriteria(finalSections);
  finalSections.deterministicTests = extractDeterministicTests(finalSections);

  return finalSections;
}

/**
 * Save section content to the sections object
 */
function saveSection(sections, sectionKey, subsectionKey, content) {
  const contentStr = content.join('\n').trim();

  if (subsectionKey) {
    if (!sections[sectionKey]) {
      sections[sectionKey] = {};
    }
    if (typeof sections[sectionKey] === 'string') {
      // Convert to object if it was a string
      const oldContent = sections[sectionKey];
      sections[sectionKey] = { _main: oldContent };
    }
    sections[sectionKey][subsectionKey] = contentStr;
  } else {
    sections[sectionKey] = contentStr;
  }
}

/**
 * Map formal template section names to standardized keys
 */
const FORMAL_SECTION_MAPPINGS = {
  'overview': 'overview',
  'functional_requirements': 'functional_requirements',
  'non_functional_requirements': 'non_functional_requirements',
  'nonfunctional_requirements': 'non_functional_requirements',
  'security': 'security',
  'security_considerations': 'security',
  'data_inventory': 'data_inventory',
  'data_model': 'data_model',
  'datamodel': 'data_model',
  'interfaces_and_contracts': 'interfaces_and_contracts',
  'interfaces_contracts': 'interfaces_and_contracts',
  'deterministic_tests': 'deterministic_tests',
  'deterministictests': 'deterministic_tests',
  'acceptance_tests': 'acceptance_tests',
  'acceptancetests': 'acceptance_tests',
  'testing_strategy': 'acceptance_tests',
  'testingstrategy': 'acceptance_tests',
  'traceability': 'traceability',
  'glossary_and_definitions': 'glossary_and_definitions',
  'glossary_definitions': 'glossary_and_definitions',
  'risks_and_open_questions': 'risks_and_open_questions',
  'risks_open_questions': 'risks_and_open_questions'
};

/**
 * Normalize section keys with formal template mapping
 */
function normalizeKey(key) {
  const normalized = key
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  // Check if this matches a formal template section
  return FORMAL_SECTION_MAPPINGS[normalized] || normalized;
}

/**
 * Extract functional requirements with validation criteria
 */
function extractFunctionalRequirements(sections) {
  const requirements = [];
  const frSection = sections.functional_requirements || sections.functionalrequirements || '';

  if (!frSection) return requirements;

  // Handle object format (subsections from H2 headers)
  if (typeof frSection === 'object') {
    for (const key of Object.keys(frSection)) {
      // Try to extract FR ID from the key (e.g., "fr_1_create_records" -> "FR-1")
      const idMatch = key.match(/fr[-_]?(\d+)/i);
      if (idMatch) {
        const content = frSection[key];
        const lines = content.split('\n');

        // First non-empty line is description
        const description = lines.find(l => l.trim() && !l.trim().startsWith('**'));

        // Extract validation criteria
        const validationCriteria = [];
        let inValidation = false;

        for (const line of lines) {
          if (line.toLowerCase().includes('validation criteria')) {
            inValidation = true;
            continue;
          }
          if (inValidation && line.trim()) {
            const criterionMatch = line.match(/^\s*[-*]\s*(.+)$/);
            if (criterionMatch) {
              validationCriteria.push(criterionMatch[1].trim());
            }
          }
        }

        requirements.push({
          id: `FR-${idMatch[1]}`,
          description: description || key,
          validationCriteria
        });
      }
    }
    return requirements;
  }

  // Handle string format
  const frText = frSection;
  const lines = frText.split('\n');

  let currentFR = null;

  for (const line of lines) {
    // Match FR-X: pattern (can be in headings too)
    const frMatch = line.match(/^#{1,3}\s*(FR[-_]?\d+):\s*(.+)$/i) || line.match(/^[-*]?\s*(FR[-_]?\d+):\s*(.+)$/i);
    if (frMatch) {
      if (currentFR) {
        requirements.push(currentFR);
      }
      currentFR = {
        id: frMatch[1],
        description: frMatch[2].trim(),
        validationCriteria: []
      };
      continue;
    }

    // Match validation criteria
    if (currentFR && line.trim()) {
      const validationMatch = line.match(/^\s*[-*]\s*(.+)$/);
      if (validationMatch && !line.toLowerCase().includes('validation criteria:')) {
        currentFR.validationCriteria.push(validationMatch[1].trim());
      }
    }
  }

  if (currentFR) {
    requirements.push(currentFR);
  }

  return requirements;
}

/**
 * Extract user stories
 */
function extractUserStories(sections) {
  const stories = [];

  // Check multiple possible locations
  const storySection = sections.user_stories || sections.userstories ||
                       (sections.acceptance_tests && sections.acceptance_tests.user_stories) || '';

  // Also check Level 1 section
  const level1 = sections.level_1_foundation || sections.level_1 || {};
  const level1UserStories = typeof level1 === 'object' ? level1.user_stories : '';

  // Combine all sources
  const combinedSection = storySection + '\n' + (level1UserStories || '');

  if (!combinedSection.trim()) return stories;

  const storyText = typeof combinedSection === 'object' ? JSON.stringify(combinedSection) : combinedSection;
  const lines = storyText.split('\n');

  for (const line of lines) {
    // Match "As a ... I want ... so that ..." pattern
    if (line.match(/as\s+a\s+.+,?\s+i\s+want\s+.+,?\s+so\s+that/i)) {
      stories.push(line.replace(/^[-*]\s*/, '').trim());
    }
    // Also match "Story X:" pattern
    else if (line.match(/^\*\*Story\s+\d+:/i)) {
      stories.push(line.replace(/^\*\*Story\s+\d+:\*\*\s*/i, '').trim());
    }
  }

  return stories;
}

/**
 * Extract acceptance criteria
 */
function extractAcceptanceCriteria(sections) {
  const criteria = [];

  // Check multiple possible locations
  const acSection = sections.acceptance_criteria || sections.acceptancecriteria ||
                   (sections.acceptance_tests && sections.acceptance_tests.acceptance_criteria) || '';

  // Also check Level 1 section
  const level1 = sections.level_1_foundation || sections.level_1 || {};
  const level1AC = typeof level1 === 'object' ? level1.acceptance_criteria : '';

  // Combine all sources
  const combinedSection = acSection + '\n' + (level1AC || '');

  if (!combinedSection.trim()) return criteria;

  const acText = typeof combinedSection === 'object' ? JSON.stringify(combinedSection) : combinedSection;
  const lines = acText.split('\n');

  for (const line of lines) {
    // Match Given/When/Then pattern
    if (line.match(/given\s+.+,?\s+when\s+.+,?\s+then/i)) {
      const cleaned = line.replace(/^[-*\[\]\s]+/, '').trim();
      criteria.push(cleaned);
    }
  }

  return criteria;
}

/**
 * Extract deterministic tests
 */
function extractDeterministicTests(sections) {
  const tests = [];

  // Check multiple possible locations
  const dtSection = sections.deterministic_tests || sections.deterministictests || '';

  // Also check Level 5 section
  const level5 = sections.level_5_complete_specification || sections.level_5 || {};
  const level5Text = typeof level5 === 'object' ? JSON.stringify(level5) : String(level5);

  // Combine all sources
  const combinedSection = dtSection + '\n' + level5Text;

  if (!combinedSection.trim()) return tests;

  const dtText = typeof combinedSection === 'object' ? JSON.stringify(combinedSection) : combinedSection;

  // Find JSON blocks
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let match;

  while ((match = jsonBlockRegex.exec(dtText)) !== null) {
    try {
      const testCase = JSON.parse(match[1]);
      tests.push(testCase);
    } catch (error) {
      // Invalid JSON, skip
    }
  }

  return tests;
}

/**
 * Get required sections based on complexity and maturity
 */
function getRequiredSections(complexity, maturity) {
  const base = [
    'overview',
    'functional_requirements',
    'acceptance_tests'
  ];

  const level2 = [...base];
  const level3 = [...level2, 'non_functional_requirements', 'security', 'data_inventory'];
  const level4 = [...level3, 'data_model', 'interfaces_and_contracts', 'risks_and_open_questions'];
  const level5 = [...level4, 'deterministic_tests', 'glossary_and_definitions'];

  // Map maturity to required sections
  if (maturity >= 5) return level5;
  if (maturity >= 4) return level4;
  if (maturity >= 3) return level3;
  if (maturity >= 2) return level2;
  return base;
}

/**
 * Validate spec structure matches Spec-MAS v3 format
 */
function validateStructure(spec) {
  const errors = [];
  const warnings = [];

  // Check front-matter exists
  if (!spec.metadata || Object.keys(spec.metadata).length === 0) {
    errors.push('Missing YAML front-matter');
    return { valid: false, errors, warnings };
  }

  // Check required front-matter fields
  const requiredFields = ['specmas', 'kind', 'id', 'name', 'complexity', 'maturity'];
  for (const field of requiredFields) {
    if (!spec.metadata[field]) {
      errors.push(`Missing required front-matter field: ${field}`);
    }
  }

  // Validate complexity
  if (spec.metadata.complexity && !['EASY', 'MODERATE', 'HIGH'].includes(spec.metadata.complexity)) {
    errors.push(`Invalid complexity: ${spec.metadata.complexity}. Must be EASY, MODERATE, or HIGH`);
  }

  // Validate maturity
  if (spec.metadata.maturity && (spec.metadata.maturity < 1 || spec.metadata.maturity > 5)) {
    errors.push(`Invalid maturity: ${spec.metadata.maturity}. Must be 1-5`);
  }

  // Check required sections based on maturity
  if (spec.metadata.complexity && spec.metadata.maturity) {
    const required = getRequiredSections(spec.metadata.complexity, spec.metadata.maturity);
    for (const section of required) {
      if (!spec.sections[section]) {
        warnings.push(`Missing recommended section for maturity ${spec.metadata.maturity}: ${section}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  parseSpec,
  validateStructure,
  extractFrontMatter,
  parseMarkdownSections,
  getRequiredSections
};
