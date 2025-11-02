#!/usr/bin/env node

/**
 * System Spec Parser
 * Extracts components and roadmap from system architecture specifications
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');

/**
 * Parse a system architecture spec
 * @param {string} systemSpecPath - Path to system spec file
 * @returns {object} Parsed system information
 */
function parseSystemSpec(systemSpecPath) {
  const spec = parseSpec(systemSpecPath);
  
  // Validate this is a system spec
  if (spec.metadata.kind !== 'SystemArchitecture') {
    throw new Error('Not a system architecture spec. Expected kind: SystemArchitecture');
  }
  
  return {
    systemName: spec.metadata.name,
    systemId: spec.metadata.id,
    version: spec.metadata.version || '1.0.0',
    complexity: spec.metadata.complexity,
    components: extractComponents(spec),
    roadmap: extractRoadmap(spec),
    integrations: extractIntegrations(spec),
    dataArchitecture: extractDataArchitecture(spec),
    metadata: spec.metadata,
    raw: spec.raw
  };
}

/**
 * Extract components from system spec
 */
function extractComponents(spec) {
  const components = [];
  const componentSection = spec.sections.system_components || 
                          spec.sections['2_system_components'] ||
                          {};
  
  // If section is an object, look for subsections matching "component_N"
  if (typeof componentSection === 'object') {
    const componentKeys = Object.keys(componentSection)
      .filter(key => key.match(/component_\d+/i) || key.match(/^\d+_/));
    
    for (const key of componentKeys) {
      const componentText = componentSection[key];
      const component = parseComponentSection(componentText, key);
      if (component) {
        components.push(component);
      }
    }
  }
  
  // Fallback: parse from text
  if (components.length === 0 && spec.raw) {
    return parseComponentsFromText(spec.raw);
  }
  
  return components;
}

/**
 * Parse individual component section
 */
function parseComponentSection(text, key) {
  const lines = text.split('\n');
  
  // Extract name from first line or key
  const nameMatch = text.match(/^####\s*Component\s*\d+:\s*(.+)/m) ||
                   text.match(/^###\s*Component\s*\d+:\s*(.+)/m) ||
                   text.match(/^##\s*(.+)/m);
  
  const name = nameMatch ? nameMatch[1].trim() : key.replace(/_/g, ' ');
  
  // Generate ID from name
  const id = 'feat-' + name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Extract responsibility
  const responsibilityMatch = text.match(/\*\*Responsibility:\*\*\s*(.+)/);
  const responsibility = responsibilityMatch ? responsibilityMatch[1].trim() : '';
  
  // Extract technology
  const techMatch = text.match(/\*\*Technology:\*\*\s*(.+)/);
  const technology = techMatch ? techMatch[1].trim() : '';
  
  // Extract APIs
  const apis = [];
  const apiRegex = /[-*]\s*`(GET|POST|PUT|PATCH|DELETE)\s+([^`]+)`\s*-\s*(.+)/g;
  let apiMatch;
  while ((apiMatch = apiRegex.exec(text)) !== null) {
    apis.push({
      method: apiMatch[1],
      path: apiMatch[2].trim(),
      description: apiMatch[3].trim()
    });
  }
  
  // Extract dependencies
  const dependencies = [];
  const depsMatch = text.match(/\*\*Dependencies:\*\*\s*(.+)/);
  if (depsMatch && !depsMatch[1].toLowerCase().includes('none')) {
    const depsText = depsMatch[1];
    // Parse comma-separated or bulleted list
    const depsList = depsText.split(/[,\n]/).map(d => d.trim().replace(/^[-*]\s*/, ''));
    dependencies.push(...depsList.filter(d => d && d !== 'None'));
  }
  
  // Extract features
  const features = [];
  const featuresMatch = text.match(/\*\*Key Features:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  if (featuresMatch) {
    const featureLines = featuresMatch[1].split('\n');
    for (const line of featureLines) {
      const featureMatch = line.match(/^[-*]\s*(.+)/);
      if (featureMatch) {
        features.push(featureMatch[1].trim());
      }
    }
  }
  
  // Estimate complexity based on APIs and features
  let complexity = 'MODERATE';
  if (apis.length <= 3 && features.length <= 3) {
    complexity = 'EASY';
  } else if (apis.length > 8 || features.length > 8) {
    complexity = 'HIGH';
  }
  
  return {
    id,
    name,
    responsibility,
    technology,
    apis,
    features,
    dependencies,
    complexity,
    featureSpecPath: null // To be set when spec is generated
  };
}

/**
 * Parse components from raw text (fallback)
 */
function parseComponentsFromText(text) {
  const components = [];
  
  // Find "## 2. System Components" section
  const componentSectionMatch = text.match(/##\s*2\.\s*System Components([\s\S]*?)(?=\n##\s*\d+\.|$)/i);
  if (!componentSectionMatch) {
    return components;
  }
  
  const componentText = componentSectionMatch[1];
  
  // Split by "#### Component" headers
  const componentBlocks = componentText.split(/####\s*Component\s*\d+:/);
  
  for (let i = 1; i < componentBlocks.length; i++) {
    const block = componentBlocks[i];
    const component = parseComponentSection('#### Component ' + i + ':' + block, `component_${i}`);
    if (component) {
      components.push(component);
    }
  }
  
  return components;
}

/**
 * Extract implementation roadmap
 */
function extractRoadmap(spec) {
  const roadmapSection = spec.sections.implementation_roadmap ||
                        spec.sections['8_implementation_roadmap'] ||
                        {};
  
  const phases = [];
  let totalWeeks = 0;
  
  // Parse roadmap from text
  const roadmapText = typeof roadmapSection === 'object' 
    ? JSON.stringify(roadmapSection)
    : String(roadmapSection);
  
  // Extract phases
  const phaseRegex = /####\s*Phase\s*(\d+):\s*(.+?)\s*\(Weeks?\s*([\d-]+)\)/gi;
  let phaseMatch;
  
  while ((phaseMatch = phaseRegex.exec(roadmapText)) !== null) {
    const phaseNum = parseInt(phaseMatch[1]);
    const phaseName = phaseMatch[2].trim();
    const weeksStr = phaseMatch[3];
    
    phases.push({
      phase: phaseNum,
      name: phaseName,
      weeks: weeksStr,
      features: []
    });
  }
  
  // Extract feature items within phases
  // Pattern: "1. **Feature Name** (Level X - COMPLEXITY)"
  const featureRegex = /\d+\.\s*\*\*(.+?)\*\*\s*\(Level\s*(\d+)\s*-\s*(EASY|MODERATE|HIGH)\)/gi;
  let featureMatch;
  
  let currentPhaseIndex = -1;
  const lines = roadmapText.split('\n');
  
  for (const line of lines) {
    // Check if we're entering a new phase
    const phaseLineMatch = line.match(/####\s*Phase\s*(\d+)/i);
    if (phaseLineMatch) {
      currentPhaseIndex = parseInt(phaseLineMatch[1]) - 1;
      continue;
    }
    
    // Extract feature from line
    const featureLineMatch = line.match(/\d+\.\s*\*\*(.+?)\*\*\s*\(Level\s*(\d+)\s*-\s*(EASY|MODERATE|HIGH)\)/i);
    if (featureLineMatch && currentPhaseIndex >= 0 && currentPhaseIndex < phases.length) {
      const featureName = featureLineMatch[1].trim();
      const maturity = parseInt(featureLineMatch[2]);
      const complexity = featureLineMatch[3];
      
      // Try to extract estimate
      const estimateMatch = line.match(/Estimated:\s*([\d-]+)\s*days?/i);
      const estimate = estimateMatch ? estimateMatch[1] : null;
      
      // Try to extract dependencies
      const depsMatch = line.match(/Dependencies:\s*(.+?)(?:\n|Estimated|$)/i);
      let dependencies = [];
      if (depsMatch && !depsMatch[1].toLowerCase().includes('none')) {
        dependencies = depsMatch[1].split(',').map(d => d.trim());
      }
      
      phases[currentPhaseIndex].features.push({
        name: featureName,
        maturity,
        complexity,
        estimate,
        dependencies
      });
    }
  }
  
  return {
    phases,
    totalEstimate: extractTotalEstimate(roadmapText)
  };
}

/**
 * Extract total timeline estimate
 */
function extractTotalEstimate(text) {
  const totalMatch = text.match(/\*\*Total\*\*.*?(\d+)\s*weeks/i);
  if (totalMatch) {
    return {
      weeks: parseInt(totalMatch[1]),
      unit: 'weeks'
    };
  }
  return null;
}

/**
 * Extract integration information
 */
function extractIntegrations(spec) {
  const integrationSection = spec.sections.integration_architecture ||
                            spec.sections['5_integration_architecture'] ||
                            {};
  
  const integrations = [];
  const integrationText = typeof integrationSection === 'object'
    ? JSON.stringify(integrationSection)
    : String(integrationSection);
  
  // Extract external integrations
  // Pattern: "#### Integration N: Name (Service)"
  const integrationRegex = /####\s*Integration\s*\d+:\s*(.+?)\s*\((.+?)\)/gi;
  let integrationMatch;
  
  while ((integrationMatch = integrationRegex.exec(integrationText)) !== null) {
    integrations.push({
      name: integrationMatch[1].trim(),
      service: integrationMatch[2].trim()
    });
  }
  
  return integrations;
}

/**
 * Extract data architecture info
 */
function extractDataArchitecture(spec) {
  const dataSection = spec.sections.data_architecture ||
                     spec.sections['4_data_architecture'] ||
                     {};
  
  return {
    databases: extractDatabases(dataSection),
    dataModels: extractDataModels(dataSection)
  };
}

/**
 * Extract database information
 */
function extractDatabases(dataSection) {
  const databases = [];
  const text = typeof dataSection === 'object'
    ? JSON.stringify(dataSection)
    : String(dataSection);
  
  // Extract primary database
  const primaryMatch = text.match(/\*\*Primary Database:\*\*\s*(.+)/i);
  if (primaryMatch) {
    databases.push({
      type: 'primary',
      technology: primaryMatch[1].split(/[-\n]/)[0].trim()
    });
  }
  
  // Extract cache layer
  const cacheMatch = text.match(/\*\*Cache Layer:\*\*\s*(.+)/i);
  if (cacheMatch) {
    databases.push({
      type: 'cache',
      technology: cacheMatch[1].split(/[-\n]/)[0].trim()
    });
  }
  
  return databases;
}

/**
 * Extract high-level data models
 */
function extractDataModels(dataSection) {
  const models = [];
  const text = typeof dataSection === 'object'
    ? JSON.stringify(dataSection)
    : String(dataSection);
  
  // Very simple extraction - just entity names
  const entityRegex = /^([A-Z][a-zA-Z]+)$/gm;
  let entityMatch;
  
  while ((entityMatch = entityRegex.exec(text)) !== null) {
    const entityName = entityMatch[1];
    if (!models.includes(entityName)) {
      models.push(entityName);
    }
  }
  
  return models;
}

/**
 * CLI usage
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node parse-system-spec.js <system-spec-file>');
    console.log('');
    console.log('Example:');
    console.log('  node parse-system-spec.js specs/systems/ecommerce-platform.md');
    process.exit(0);
  }
  
  const systemSpecPath = args[0];
  
  try {
    const parsed = parseSystemSpec(systemSpecPath);
    
    console.log('\n=== System Architecture Spec Parsed ===\n');
    console.log(`System: ${parsed.systemName}`);
    console.log(`ID: ${parsed.systemId}`);
    console.log(`Complexity: ${parsed.complexity}`);
    console.log(`\nComponents: ${parsed.components.length}`);
    
    parsed.components.forEach((comp, idx) => {
      console.log(`\n${idx + 1}. ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Complexity: ${comp.complexity}`);
      console.log(`   APIs: ${comp.apis.length}`);
      console.log(`   Dependencies: ${comp.dependencies.length > 0 ? comp.dependencies.join(', ') : 'None'}`);
    });
    
    console.log(`\nRoadmap Phases: ${parsed.roadmap.phases.length}`);
    if (parsed.roadmap.totalEstimate) {
      console.log(`Total Estimate: ${parsed.roadmap.totalEstimate.weeks} weeks`);
    }
    
    console.log(`\nIntegrations: ${parsed.integrations.length}`);
    parsed.integrations.forEach(int => {
      console.log(`  - ${int.name} (${int.service})`);
    });
    
    // Output JSON if requested
    if (args.includes('--json')) {
      console.log('\n\n=== JSON Output ===\n');
      console.log(JSON.stringify(parsed, null, 2));
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseSystemSpec,
  extractComponents,
  extractRoadmap,
  extractIntegrations,
  extractDataArchitecture
};
