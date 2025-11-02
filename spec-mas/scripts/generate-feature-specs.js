#!/usr/bin/env node

/**
 * Feature Spec Generator
 * Generates feature specification files from system architecture spec
 */

const fs = require('fs');
const path = require('path');
const { parseSystemSpec } = require('./parse-system-spec');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Generate feature specs from system spec
 */
async function generateFeatureSpecs(systemSpecPath, options = {}) {
  console.log(colors.bright + colors.cyan + '\n🏗️  Generating Feature Specs from System Architecture\n' + colors.reset);
  
  // Parse system spec
  console.log(`Parsing: ${systemSpecPath}`);
  const system = parseSystemSpec(systemSpecPath);
  
  console.log(colors.green + `✓ Found ${system.components.length} components\n` + colors.reset);
  
  // Determine output directory
  const outputDir = options.outputDir || 'specs/features';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate specs
  const featureSpecs = [];
  
  for (const component of system.components) {
    console.log(`Generating: ${component.name}...`);
    
    const featureSpec = generateFeatureSpec(system, component, options);
    const fileName = `${component.id}.md`;
    const filePath = path.join(outputDir, fileName);
    
    // Write file
    fs.writeFileSync(filePath, featureSpec, 'utf8');
    
    featureSpecs.push({
      id: component.id,
      name: component.name,
      path: filePath,
      complexity: component.complexity,
      dependencies: component.dependencies
    });
    
    console.log(colors.green + `  ✓ Created: ${filePath}` + colors.reset);
  }
  
  // Create tracking file
  const trackingPath = await createTrackingFile(system, featureSpecs, options);
  
  // Print summary
  console.log(colors.bright + colors.cyan + '\n✅ Feature Spec Generation Complete!\n' + colors.reset);
  console.log(`Generated ${featureSpecs.length} feature specs in: ${outputDir}/`);
  console.log(`Progress tracker: ${trackingPath}\n`);
  
  // Show next steps
  printNextSteps(featureSpecs);
  
  return {
    system,
    featureSpecs,
    trackingPath
  };
}

/**
 * Generate a single feature spec from component
 */
function generateFeatureSpec(system, component, options) {
  const template = loadTemplate(component.complexity);
  
  // Replace variables in template
  let spec = template;
  
  // Front matter
  spec = spec.replace(/\[feature-name\]/g, component.id.replace('feat-', ''));
  spec = spec.replace(/\[Feature Name\]/g, component.name);
  spec = spec.replace(/MODERATE/g, component.complexity);
  spec = spec.replace(/maturity: 3/g, `maturity: ${getTargetMaturity(component.complexity)}`);
  
  // Add system reference
  const systemRef = `\n> **Part of System:** [${system.systemName}](../systems/${system.systemId}.md)\n`;
  spec = spec.replace(/---\n\n#/, `---\n${systemRef}\n#`);
  
  // Related specs
  const relatedSpecs = system.components
    .filter(c => c.id !== component.id)
    .map(c => `  - id: ${c.id}\n    name: ${c.name}\n    relationship: ${getDependencyRelationship(component, c)}`)
    .join('\n');
  
  spec = spec.replace(/related_specs: \[\]/, `related_specs:\n${relatedSpecs}`);
  
  // Overview section
  const overview = generateOverview(system, component);
  spec = spec.replace(/\[Describe what this feature does.*?\]/s, overview);
  
  // Pre-populate API specification if available
  if (component.apis && component.apis.length > 0) {
    const apiSection = generateAPISection(component.apis);
    spec = spec.replace(/## API Specification[\s\S]*?(?=\n##)/,  apiSection + '\n');
  }
  
  // Pre-populate integration points
  if (component.dependencies && component.dependencies.length > 0) {
    const integrationSection = generateIntegrationSection(component, system);
    spec = spec.replace(/## Integration Points[\s\S]*?(?=\n##)/, integrationSection + '\n');
  }
  
  // Add TODO markers for what needs to be filled in
  spec = addTODOMarkers(spec, component);
  
  return spec;
}

/**
 * Load feature spec template based on complexity
 */
function loadTemplate(complexity) {
  // For now, use a basic template
  // In production, load from templates directory
  return getBasicTemplate();
}

/**
 * Get basic feature spec template
 */
function getBasicTemplate() {
  return `---
specmas: 3.0
kind: feature
id: feat-[feature-name]
name: [Feature Name]
version: 1.0.0
complexity: MODERATE
maturity: 3
owner: [Your Name]
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
status: draft
tags: [feature]
related_specs: []
---

# [Feature Name]

## Overview

[Describe what this feature does and why it's needed]

**Key Capabilities:**
- [Capability 1]
- [Capability 2]
- [Capability 3]

**Success Criteria:**
- [Metric 1]
- [Metric 2]

---

## User Stories

**Story 1:**
As a [role], I want to [action] so that [benefit].

**Acceptance Criteria:**
- Given [context], when [action], then [result]
- Given [context], when [action], then [result]

---

## Functional Requirements

### FR-1: [Requirement Name]

**Description:**
[Detailed description of what this requirement entails]

**Validation Criteria:**
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

**Priority:** MUST
**Dependencies:** None

---

## Non-Functional Requirements

### Performance
- [Performance requirement 1]
- [Performance requirement 2]

### Scalability
- [Scalability requirement]

### Reliability
- [Reliability requirement]

---

## Security

### Authentication & Authorization
[Describe authentication method and authorization rules]

### Input Validation
[Describe input validation approach]

### Data Protection
[Describe how sensitive data is protected]

### Audit Logging
[Describe what actions are logged]

---

## Data Model

### Entity: [EntityName]

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| [field] | [type] | [Yes/No] | [description] |

**Example:**
\`\`\`json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "[field]": "[value]"
}
\`\`\`

---

## API Specification

### Endpoint: [Method] /api/v1/[resource]

**Description:** [What this endpoint does]

**Request:**
\`\`\`json
{
  "[field]": "[value]"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "[field]": "[value]"
}
\`\`\`

**Error Responses:**
- 400: [Error description]
- 401: [Error description]
- 404: [Error description]

---

## Integration Points

### Integration 1: [System/Service Name]

**Purpose:** [Why this integration is needed]

**Method:** [API, Database, Message Queue, etc.]

**Authentication:** [How authentication is handled]

**Error Handling:** [How errors are handled]

---

## Testing Strategy

### Unit Tests
- [What will be unit tested]

### Integration Tests
- [What integration scenarios will be tested]

### End-to-End Tests
- [What user flows will be tested]

---

## Deterministic Tests

### DT-1: [Test Name]

**Input:**
\`\`\`json
{
  "[field]": "[value]"
}
\`\`\`

**Expected Output:**
\`\`\`json
{
  "[field]": "[expected]"
}
\`\`\`

**Verification:**
- [Verification step 1]
- [Verification step 2]

---

## Deployment

### Environment Variables
- \`ENV_VAR_1\`: [Description]
- \`ENV_VAR_2\`: [Description]

### Dependencies
- [External service 1]
- [Database]
- [Cache]

### Rollout Strategy
[Describe how this feature will be deployed]

---

## Monitoring & Observability

### Metrics to Track
- [Metric 1]
- [Metric 2]

### Alerts
- [Alert condition 1]
- [Alert condition 2]

### Logs
[What should be logged]

---

## Implementation Notes

[Any additional notes for implementers]

---

## Glossary

- **[Term]**: [Definition]
`;
}

/**
 * Generate overview section
 */
function generateOverview(system, component) {
  let overview = `${component.responsibility}\n\n`;
  
  if (component.technology) {
    overview += `**Technology Stack:** ${component.technology}\n\n`;
  }
  
  if (component.features && component.features.length > 0) {
    overview += '**Key Capabilities:**\n';
    component.features.forEach(feature => {
      overview += `- ${feature}\n`;
    });
    overview += '\n';
  }
  
  overview += '**Success Criteria:**\n';
  overview += '- [TODO: Define success metrics]\n';
  overview += '- [TODO: Define performance targets]\n';
  
  return overview;
}

/**
 * Generate API specification section
 */
function generateAPISection(apis) {
  let section = '## API Specification\n\n';
  
  section += `*Pre-populated from system architecture spec. Review and enhance with details.*\n\n`;
  
  apis.forEach((api, idx) => {
    section += `### Endpoint ${idx + 1}: ${api.method} ${api.path}\n\n`;
    section += `**Description:** ${api.description}\n\n`;
    section += `**Request:**\n`;
    section += `\`\`\`json\n`;
    section += `// TODO: Add request body schema\n`;
    section += `\`\`\`\n\n`;
    section += `**Response (200 OK):**\n`;
    section += `\`\`\`json\n`;
    section += `// TODO: Add response schema\n`;
    section += `\`\`\`\n\n`;
    section += `**Error Responses:**\n`;
    section += `- 400: Invalid input\n`;
    section += `- 401: Unauthorized\n`;
    section += `- 404: Not found\n`;
    section += `- 500: Internal server error\n\n`;
    section += `---\n\n`;
  });
  
  return section;
}

/**
 * Generate integration points section
 */
function generateIntegrationSection(component, system) {
  let section = '## Integration Points\n\n';
  
  section += `*Dependencies identified from system architecture spec.*\n\n`;
  
  if (component.dependencies && component.dependencies.length > 0) {
    component.dependencies.forEach((dep, idx) => {
      // Find the dependency component
      const depComponent = system.components.find(c => 
        c.name.toLowerCase() === dep.toLowerCase() ||
        c.id === dep
      );
      
      section += `### Integration ${idx + 1}: ${dep}\n\n`;
      
      if (depComponent) {
        section += `**Component:** [${depComponent.name}](${depComponent.id}.md)\n\n`;
        section += `**Purpose:** ${component.name} depends on ${depComponent.name}\n\n`;
      } else {
        section += `**Purpose:** [TODO: Describe why this integration is needed]\n\n`;
      }
      
      section += `**Method:** [TODO: API, Database, Message Queue, etc.]\n\n`;
      section += `**Authentication:** [TODO: How authentication is handled]\n\n`;
      section += `**Error Handling:** [TODO: How errors are handled]\n\n`;
      section += `---\n\n`;
    });
  }
  
  return section;
}

/**
 * Add TODO markers for sections that need completion
 */
function addTODOMarkers(spec, component) {
  // Add a header note
  const todoNote = `
<!-- ============================================================ -->
<!-- TODO: Complete this feature specification                    -->
<!--                                                              -->
<!-- ✓ Pre-populated: Front matter, overview, APIs, integrations  -->
<!-- ⚠ Needs completion: User stories, FRs, tests, data model    -->
<!--                                                              -->
<!-- Use Claude Project or follow maturity levels 1-${getTargetMaturity(component.complexity)} to complete -->
<!-- ============================================================ -->

`;
  
  spec = spec.replace(/---\n\n#/, `---\n${todoNote}#`);
  
  return spec;
}

/**
 * Get target maturity based on complexity
 */
function getTargetMaturity(complexity) {
  if (complexity === 'EASY') return 3;
  if (complexity === 'MODERATE') return 4;
  if (complexity === 'HIGH') return 5;
  return 3;
}

/**
 * Determine relationship between components
 */
function getDependencyRelationship(component, otherComponent) {
  if (component.dependencies.includes(otherComponent.name) || 
      component.dependencies.includes(otherComponent.id)) {
    return 'depends_on';
  }
  if (otherComponent.dependencies.includes(component.name) ||
      otherComponent.dependencies.includes(component.id)) {
    return 'required_by';
  }
  return 'related';
}

/**
 * Create progress tracking file
 */
async function createTrackingFile(system, featureSpecs, options) {
  const trackingPath = options.trackingPath || 'specs/.spec-progress.json';
  
  const tracking = {
    systemSpec: {
      id: system.systemId,
      name: system.systemName,
      path: system.metadata.filePath
    },
    generatedAt: new Date().toISOString(),
    featureSpecs: featureSpecs.map(spec => ({
      id: spec.id,
      name: spec.name,
      path: spec.path,
      complexity: spec.complexity,
      status: 'not-started',
      maturity: 0,
      targetMaturity: getTargetMaturity(spec.complexity),
      validated: false,
      implemented: false,
      dependencies: spec.dependencies.map(dep => {
        // Try to find matching feature spec
        const depSpec = featureSpecs.find(fs => 
          fs.name.toLowerCase() === dep.toLowerCase() ||
          fs.id === dep
        );
        return depSpec ? depSpec.id : dep;
      })
    }))
  };
  
  fs.writeFileSync(trackingPath, JSON.stringify(tracking, null, 2));
  
  return trackingPath;
}

/**
 * Print next steps
 */
function printNextSteps(featureSpecs) {
  console.log(colors.bright + 'Next Steps:\n' + colors.reset);
  
  // Find specs with no dependencies
  const readySpecs = featureSpecs.filter(spec => 
    spec.dependencies.length === 0
  );
  
  if (readySpecs.length > 0) {
    console.log(colors.green + '✓ Ready to start (no dependencies):' + colors.reset);
    readySpecs.forEach(spec => {
      console.log(`  - ${spec.name}: ${spec.path}`);
    });
    console.log('');
    console.log('Start with:');
    console.log(colors.cyan + `  npm run next-feature` + colors.reset);
    console.log(colors.cyan + `  # or open in Claude Project` + colors.reset);
  } else {
    console.log(colors.yellow + '⚠ All specs have dependencies' + colors.reset);
    console.log('Review dependency order in system spec.');
  }
  
  console.log('');
  console.log('Track progress:');
  console.log(colors.cyan + `  npm run feature-status` + colors.reset);
  console.log('');
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  
  const options = {
    outputDir: 'specs/features',
    trackingPath: 'specs/.spec-progress.json',
    systemSpecPath: null
  };
  
  // Find output dir
  const outputIdx = args.indexOf('--output-dir');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.outputDir = args[outputIdx + 1];
  }
  
  // Find tracking path
  const trackingIdx = args.indexOf('--tracking');
  if (trackingIdx !== -1 && args[trackingIdx + 1]) {
    options.trackingPath = args[trackingIdx + 1];
  }
  
  // Find system spec path (first non-flag argument)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.startsWith('-') &&
        arg !== options.outputDir && arg !== options.trackingPath) {
      options.systemSpecPath = arg;
      break;
    }
  }
  
  return options;
}

/**
 * Print help
 */
function printHelp() {
  console.log(`
${colors.bright}Spec-MAS Feature Spec Generator${colors.reset}

Generates individual feature specifications from a system architecture spec.

${colors.bright}Usage:${colors.reset}
  node scripts/generate-feature-specs.js <system-spec> [options]
  npm run generate-features <system-spec> [options]

${colors.bright}Arguments:${colors.reset}
  <system-spec>    Path to system architecture specification file

${colors.bright}Options:${colors.reset}
  --output-dir DIR    Output directory for feature specs (default: specs/features)
  --tracking FILE     Path to progress tracking file (default: specs/.spec-progress.json)
  --help, -h          Show this help message

${colors.bright}Examples:${colors.reset}
  npm run generate-features specs/systems/ecommerce-platform.md
  npm run generate-features specs/systems/my-system.md --output-dir src/specs

${colors.bright}Workflow:${colors.reset}
  1. Generate feature specs: npm run generate-features <system-spec>
  2. Check status: npm run feature-status
  3. Get next feature: npm run next-feature
  4. Complete feature spec (using Claude Project or manually)
  5. Validate: npm run validate-spec <feature-spec>
  6. Implement: npm run implement-spec <feature-spec>
  7. Repeat steps 3-6 for each feature
`);
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  
  if (!options.systemSpecPath) {
    console.error(colors.red + 'Error: No system spec file specified' + colors.reset);
    printHelp();
    process.exit(1);
  }
  
  try {
    await generateFeatureSpecs(options.systemSpecPath, options);
  } catch (error) {
    console.error(colors.red + `\nError: ${error.message}` + colors.reset);
    if (error.stack) {
      console.error(colors.yellow + error.stack + colors.reset);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateFeatureSpecs,
  generateFeatureSpec
};
