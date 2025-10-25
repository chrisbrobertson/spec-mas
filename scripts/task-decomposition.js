#!/usr/bin/env node

/**
 * Spec-MAS Task Decomposition System
 * Analyzes validated specs and generates execution plans for implementation agents
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Agent type detection keywords
const AGENT_KEYWORDS = {
  database: [
    'table', 'schema', 'migration', 'model', 'entity', 'relationship',
    'database', 'sql', 'postgres', 'mysql', 'mongodb', 'column', 'index',
    'foreign key', 'primary key', 'constraint', 'query'
  ],
  backend: [
    'api', 'endpoint', 'route', 'service', 'controller', 'authentication',
    'authorization', 'middleware', 'express', 'fastify', 'handler',
    'request', 'response', 'jwt', 'session', 'business logic'
  ],
  frontend: [
    'component', 'ui', 'page', 'form', 'button', 'display', 'navigation',
    'react', 'vue', 'angular', 'state', 'redux', 'hooks', 'props',
    'render', 'layout', 'style', 'css', 'responsive', 'user interface'
  ],
  integration: [
    'external', 'third-party', 'webhook', 'api client', 'integration',
    'sendgrid', 'stripe', 'oauth', 'rest client', 'graphql client',
    'external service', 'adapter', 'connector', 'sdk'
  ]
};

// Task complexity estimates (in tokens)
const TOKEN_ESTIMATES = {
  simple_crud: { min: 1000, max: 2000, cost: { min: 0.50, max: 1.00 } },
  complex_logic: { min: 2000, max: 4000, cost: { min: 1.00, max: 2.00 } },
  security_integration: { min: 4000, max: 8000, cost: { min: 2.00, max: 4.00 } },
  database_schema: { min: 1500, max: 3000, cost: { min: 0.75, max: 1.50 } },
  api_endpoint: { min: 1500, max: 3000, cost: { min: 0.75, max: 1.50 } },
  frontend_component: { min: 1000, max: 2500, cost: { min: 0.50, max: 1.25 } },
  integration_adapter: { min: 3000, max: 6000, cost: { min: 1.50, max: 3.00 } },
  auth_system: { min: 4000, max: 8000, cost: { min: 2.00, max: 4.00 } },
  validation: { min: 500, max: 1000, cost: { min: 0.25, max: 0.50 } },
  error_handling: { min: 800, max: 1500, cost: { min: 0.40, max: 0.75 } }
};

/**
 * Main decomposition function
 */
function decomposeSpec(specPath) {
  try {
    // Parse the spec
    const spec = parseSpec(specPath);

    // Extract metadata
    const metadata = {
      id: spec.metadata.id || 'unknown',
      name: spec.metadata.name || spec.metadata.title || 'Unnamed Spec',
      complexity: spec.metadata.complexity || 'MODERATE',
      maturity: spec.metadata.maturity || spec.metadata.maturity_level || 1
    };

    // Analyze spec content
    const tasks = analyzeTasks(spec);

    // Build dependency graph
    const tasksWithDeps = buildDependencies(tasks);

    // Create execution phases
    const executionPlan = createExecutionPlan(tasksWithDeps);

    // Calculate estimates
    const analysis = calculateEstimates(tasksWithDeps, metadata);

    return {
      spec: metadata,
      analysis,
      tasks: tasksWithDeps,
      executionPlan
    };

  } catch (error) {
    throw new Error(`Failed to decompose spec: ${error.message}`);
  }
}

/**
 * Analyze spec and identify tasks
 */
function analyzeTasks(spec) {
  const tasks = [];
  let taskId = 1;

  // Extract all content for analysis
  const allContent = extractAllContent(spec);

  // Analyze data models
  const dataModelTasks = analyzeDataModels(spec, taskId);
  tasks.push(...dataModelTasks);
  taskId += dataModelTasks.length;

  // Analyze functional requirements
  const functionalTasks = analyzeFunctionalRequirements(spec, taskId, allContent);
  tasks.push(...functionalTasks);
  taskId += functionalTasks.length;

  // Analyze integration points
  const integrationTasks = analyzeIntegrationPoints(spec, taskId);
  tasks.push(...integrationTasks);
  taskId += integrationTasks.length;

  // Analyze user stories for frontend tasks
  const frontendTasks = analyzeUserStories(spec, taskId);
  tasks.push(...frontendTasks);
  taskId += frontendTasks.length;

  // Add error handling and validation tasks
  const robustnessTasks = analyzeRobustness(spec, taskId);
  tasks.push(...robustnessTasks);

  return tasks;
}

/**
 * Extract all content from spec for keyword analysis
 */
function extractAllContent(spec) {
  let content = '';

  // Add sections content
  if (spec.sections) {
    for (const key in spec.sections) {
      const section = spec.sections[key];
      if (typeof section === 'string') {
        content += ' ' + section;
      } else if (typeof section === 'object') {
        content += ' ' + JSON.stringify(section);
      }
    }
  }

  return content.toLowerCase();
}

/**
 * Analyze data models and create database tasks
 */
function analyzeDataModels(spec, startId) {
  const tasks = [];
  const sections = spec.sections;

  // Check for data models in various sections
  const dataModelSection = sections.data_model || sections.data_models ||
                          (sections.level_2_technical_context && sections.level_2_technical_context.data_models);

  if (!dataModelSection) return tasks;

  const content = typeof dataModelSection === 'string' ? dataModelSection : JSON.stringify(dataModelSection);

  // Count interfaces/models (look for 'interface' keyword or '```typescript' blocks)
  const interfaceMatches = content.match(/interface\s+\w+/gi) || [];
  const modelCount = interfaceMatches.length;

  if (modelCount > 0) {
    // Create schema task
    tasks.push({
      id: `task-${String(startId).padStart(3, '0')}`,
      agent: 'database',
      title: 'Create database schemas and migrations',
      description: `Create ${modelCount} database table(s) with appropriate schema, indexes, and constraints. Include migration scripts.`,
      estimatedTokens: 1500 * modelCount,
      estimatedCost: `$${(0.75 * modelCount).toFixed(2)}`,
      dependencies: [],
      priority: 1,
      complexity: 'database_schema'
    });

    // Create model task for backend
    tasks.push({
      id: `task-${String(startId + 1).padStart(3, '0')}`,
      agent: 'backend',
      title: 'Implement data models and repositories',
      description: `Create ${modelCount} data model(s) with repository pattern for database access.`,
      estimatedTokens: 1200 * modelCount,
      estimatedCost: `$${(0.60 * modelCount).toFixed(2)}`,
      dependencies: [`task-${String(startId).padStart(3, '0')}`],
      priority: 2,
      complexity: 'simple_crud'
    });

    return tasks;
  }

  return tasks;
}

/**
 * Analyze functional requirements for API tasks
 */
function analyzeFunctionalRequirements(spec, startId, allContent) {
  const tasks = [];
  const functionalReqs = spec.sections.functionalRequirements || [];

  if (functionalReqs.length === 0) return tasks;

  // Look for API/endpoint keywords
  const hasApiEndpoints = allContent.includes('endpoint') ||
                          allContent.includes('api') ||
                          allContent.includes('route');

  if (hasApiEndpoints) {
    // Count endpoints from integration points or FR descriptions
    const integrationSection = spec.sections.interfaces_and_contracts ||
                              spec.sections.integration_points ||
                              (spec.sections.level_2_technical_context &&
                               spec.sections.level_2_technical_context.integration_points);

    let endpointCount = 0;

    if (integrationSection) {
      const content = typeof integrationSection === 'string' ? integrationSection : JSON.stringify(integrationSection);
      // Count HTTP methods or endpoint definitions
      const methodMatches = content.match(/(GET|POST|PUT|DELETE|PATCH)\s+\//gi) || [];
      endpointCount = methodMatches.length;
    }

    // Default to functional requirements count if no explicit endpoints
    if (endpointCount === 0) {
      endpointCount = Math.min(functionalReqs.length, 5);
    }

    if (endpointCount > 0) {
      // Determine complexity
      const hasAuth = allContent.includes('auth') || allContent.includes('jwt') || allContent.includes('token');
      const hasSecurity = allContent.includes('security') || allContent.includes('encryption');

      const complexity = (hasAuth || hasSecurity) ? 'security_integration' : 'api_endpoint';
      const estimate = TOKEN_ESTIMATES[complexity];

      tasks.push({
        id: `task-${String(startId).padStart(3, '0')}`,
        agent: 'backend',
        title: `Implement ${endpointCount} API endpoint(s)`,
        description: `Create ${endpointCount} REST API endpoint(s) with controllers, services, and business logic. Include validation and error handling.`,
        estimatedTokens: Math.round((estimate.min + estimate.max) / 2) * endpointCount,
        estimatedCost: `$${((estimate.cost.min + estimate.cost.max) / 2 * endpointCount).toFixed(2)}`,
        dependencies: [],
        priority: 3,
        complexity
      });
    }
  }

  return tasks;
}

/**
 * Analyze integration points for external service tasks
 */
function analyzeIntegrationPoints(spec, startId) {
  const tasks = [];
  const sections = spec.sections;

  const integrationSection = sections.integration_points ||
                            sections.interfaces_and_contracts ||
                            (sections.level_2_technical_context &&
                             sections.level_2_technical_context.integration_points);

  if (!integrationSection) return tasks;

  const content = typeof integrationSection === 'string' ? integrationSection : JSON.stringify(integrationSection);

  // Detect external services
  const externalServices = [];
  const serviceKeywords = ['sendgrid', 'stripe', 'twilio', 'aws', 'oauth', 'external'];

  for (const keyword of serviceKeywords) {
    if (content.toLowerCase().includes(keyword)) {
      externalServices.push(keyword);
    }
  }

  if (externalServices.length > 0) {
    const estimate = TOKEN_ESTIMATES.integration_adapter;

    tasks.push({
      id: `task-${String(startId).padStart(3, '0')}`,
      agent: 'integration',
      title: `Create integration adapters for external services`,
      description: `Implement adapters for ${externalServices.join(', ')}. Include error handling, retries, and circuit breakers.`,
      estimatedTokens: estimate.max * externalServices.length,
      estimatedCost: `$${(estimate.cost.max * externalServices.length).toFixed(2)}`,
      dependencies: [],
      priority: 3,
      complexity: 'integration_adapter'
    });
  }

  return tasks;
}

/**
 * Analyze user stories for frontend component tasks
 */
function analyzeUserStories(spec, startId) {
  const tasks = [];
  const userStories = spec.sections.userStories || [];

  if (userStories.length === 0) return tasks;

  // Count UI components needed
  const allContent = extractAllContent(spec);
  const hasForm = allContent.includes('form') || allContent.includes('input');
  const hasFilter = allContent.includes('filter');
  const hasTable = allContent.includes('table') || allContent.includes('list');
  const hasModal = allContent.includes('modal') || allContent.includes('dialog');

  let componentCount = 0;
  const components = [];

  if (hasForm) { componentCount++; components.push('form'); }
  if (hasFilter) { componentCount++; components.push('filter'); }
  if (hasTable) { componentCount++; components.push('table/list'); }
  if (hasModal) { componentCount++; components.push('modal'); }

  // Default to user story count if no specific components detected
  if (componentCount === 0) {
    componentCount = Math.min(userStories.length, 3);
    components.push('UI components');
  }

  const estimate = TOKEN_ESTIMATES.frontend_component;

  tasks.push({
    id: `task-${String(startId).padStart(3, '0')}`,
    agent: 'frontend',
    title: `Build ${componentCount} frontend component(s)`,
    description: `Create ${components.join(', ')} component(s) with state management, validation, and responsive design.`,
    estimatedTokens: Math.round((estimate.min + estimate.max) / 2) * componentCount,
    estimatedCost: `$${((estimate.cost.min + estimate.cost.max) / 2 * componentCount).toFixed(2)}`,
    dependencies: [],
    priority: 4,
    complexity: 'frontend_component'
  });

  return tasks;
}

/**
 * Analyze robustness section for error handling tasks
 */
function analyzeRobustness(spec, startId) {
  const tasks = [];
  const sections = spec.sections;

  const errorSection = sections.error_scenarios ||
                      (sections.level_3_robustness && sections.level_3_robustness.error_scenarios);

  if (errorSection) {
    const content = typeof errorSection === 'string' ? errorSection : JSON.stringify(errorSection);

    // Count error scenarios
    const errorScenarios = content.match(/\d+\.\s+\*\*/g) || content.match(/^-\s+/gm) || [];

    if (errorScenarios.length > 0) {
      const estimate = TOKEN_ESTIMATES.error_handling;

      tasks.push({
        id: `task-${String(startId).padStart(3, '0')}`,
        agent: 'backend',
        title: 'Implement error handling and validation',
        description: `Add comprehensive error handling for ${errorScenarios.length} scenario(s), input validation, and graceful degradation.`,
        estimatedTokens: estimate.max,
        estimatedCost: `$${estimate.cost.max.toFixed(2)}`,
        dependencies: [],
        priority: 5,
        complexity: 'error_handling'
      });
    }
  }

  return tasks;
}

/**
 * Build dependency graph for tasks
 */
function buildDependencies(tasks) {
  // Standard dependency rules:
  // 1. Database tasks first (no dependencies)
  // 2. Backend models depend on database
  // 3. Backend API depends on models
  // 4. Frontend depends on API
  // 5. Integration can run parallel with backend

  const tasksByAgent = {
    database: [],
    backend: [],
    frontend: [],
    integration: []
  };

  // Group tasks by agent
  tasks.forEach(task => {
    if (tasksByAgent[task.agent]) {
      tasksByAgent[task.agent].push(task);
    }
  });

  // Update dependencies
  const updatedTasks = [...tasks];

  // Backend model tasks depend on database
  const dbTasks = tasksByAgent.database;
  const backendModelTasks = tasksByAgent.backend.filter(t =>
    t.title.toLowerCase().includes('model') ||
    t.title.toLowerCase().includes('repository')
  );

  if (dbTasks.length > 0 && backendModelTasks.length > 0) {
    backendModelTasks.forEach(task => {
      if (!task.dependencies.includes(dbTasks[0].id)) {
        task.dependencies.push(dbTasks[0].id);
      }
    });
  }

  // Backend API tasks depend on models
  const backendApiTasks = tasksByAgent.backend.filter(t =>
    t.title.toLowerCase().includes('api') ||
    t.title.toLowerCase().includes('endpoint')
  );

  if (backendModelTasks.length > 0 && backendApiTasks.length > 0) {
    backendApiTasks.forEach(task => {
      backendModelTasks.forEach(modelTask => {
        if (!task.dependencies.includes(modelTask.id)) {
          task.dependencies.push(modelTask.id);
        }
      });
    });
  }

  // Frontend depends on API
  const frontendTasks = tasksByAgent.frontend;

  if (backendApiTasks.length > 0 && frontendTasks.length > 0) {
    frontendTasks.forEach(task => {
      backendApiTasks.forEach(apiTask => {
        if (!task.dependencies.includes(apiTask.id)) {
          task.dependencies.push(apiTask.id);
        }
      });
    });
  }

  return updatedTasks;
}

/**
 * Create execution plan with phases
 */
function createExecutionPlan(tasks) {
  const phases = [];

  // Organize tasks into phases based on dependencies
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const completed = new Set();
  let phaseNum = 1;

  while (completed.size < tasks.length) {
    // Find tasks that can run (all dependencies completed)
    const readyTasks = tasks.filter(task =>
      !completed.has(task.id) &&
      task.dependencies.every(dep => completed.has(dep))
    );

    if (readyTasks.length === 0) break; // Prevent infinite loop

    // Group by agent type
    const phaseTasksByAgent = {};
    readyTasks.forEach(task => {
      if (!phaseTasksByAgent[task.agent]) {
        phaseTasksByAgent[task.agent] = [];
      }
      phaseTasksByAgent[task.agent].push(task.id);
    });

    // Create phases for each agent type
    for (const agent in phaseTasksByAgent) {
      const phaseName = getPhaseName(agent, readyTasks);
      const parallelizable = phaseTasksByAgent[agent].length > 1 ||
                            Object.keys(phaseTasksByAgent).length > 1;

      phases.push({
        phase: phaseNum,
        name: phaseName,
        tasks: phaseTasksByAgent[agent],
        parallelizable
      });
    }

    // Mark tasks as completed
    readyTasks.forEach(task => completed.add(task.id));
    phaseNum++;
  }

  return { phases };
}

/**
 * Get phase name based on agent and tasks
 */
function getPhaseName(agent, tasks) {
  const agentTasks = tasks.filter(t => t.agent === agent);

  if (agent === 'database') {
    return 'Database Schema';
  } else if (agent === 'backend') {
    const hasModel = agentTasks.some(t => t.title.toLowerCase().includes('model'));
    const hasApi = agentTasks.some(t => t.title.toLowerCase().includes('api'));

    if (hasModel && hasApi) return 'Backend Services';
    if (hasModel) return 'Data Models';
    if (hasApi) return 'API Endpoints';
    return 'Backend Logic';
  } else if (agent === 'frontend') {
    return 'Frontend Components';
  } else if (agent === 'integration') {
    return 'External Integrations';
  }

  return 'Implementation';
}

/**
 * Calculate time and cost estimates
 */
function calculateEstimates(tasks, metadata) {
  const totalTasks = tasks.length;
  const agents = [...new Set(tasks.map(t => t.agent))];

  // Calculate total tokens
  const totalTokens = tasks.reduce((sum, task) => sum + task.estimatedTokens, 0);

  // Calculate total cost (parse from cost strings)
  const totalCost = tasks.reduce((sum, task) => {
    const cost = parseFloat(task.estimatedCost.replace('$', ''));
    return sum + cost;
  }, 0);

  // Estimate time based on complexity and maturity
  const timeEstimate = estimateTime(totalTasks, metadata.complexity, metadata.maturity);

  return {
    totalTasks,
    requiredAgents: agents,
    estimatedTime: timeEstimate,
    estimatedCost: `$${Math.floor(totalCost)}-${Math.ceil(totalCost * 1.2)}`,
    tokensEstimate: totalTokens
  };
}

/**
 * Estimate time based on task count and complexity
 */
function estimateTime(taskCount, complexity, maturity) {
  let baseTime = taskCount * 0.25; // 15 minutes per task baseline

  // Adjust for complexity
  if (complexity === 'HIGH') {
    baseTime *= 2;
  } else if (complexity === 'MODERATE') {
    baseTime *= 1.5;
  }

  // Adjust for maturity (higher maturity = more detailed = faster)
  if (maturity >= 4) {
    baseTime *= 0.8;
  } else if (maturity <= 2) {
    baseTime *= 1.3;
  }

  // Convert to hours
  const hours = Math.ceil(baseTime);

  if (hours <= 1) return '< 1 hour';
  if (hours <= 3) return '1-3 hours';
  if (hours <= 6) return '3-6 hours';
  if (hours <= 12) return '6-12 hours';
  return '1-2 days';
}

/**
 * Print formatted console output
 */
function printReport(decomposition, options = {}) {
  const { spec, analysis, tasks, executionPlan } = decomposition;

  // If summary only, print condensed version
  if (options.summary) {
    printSummary(decomposition);
    return;
  }

  // Full report
  console.log('\n' + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.cyan + '  TASK DECOMPOSITION REPORT' + colors.reset);
  console.log(colors.bright + '═'.repeat(60) + colors.reset + '\n');

  // Spec info
  console.log(colors.bright + `Spec: ${spec.name}` + colors.reset);
  console.log(`Complexity: ${getComplexityColor(spec.complexity)}${spec.complexity}${colors.reset} | ` +
              `Maturity: ${colors.blue}Level ${spec.maturity}${colors.reset}\n`);

  // Analysis section
  console.log(colors.bright + '─── Analysis ' + '─'.repeat(44) + colors.reset);
  console.log(`  ${colors.bright}Total Tasks:${colors.reset}     ${colors.green}${analysis.totalTasks}${colors.reset}`);
  console.log(`  ${colors.bright}Agents Needed:${colors.reset}   ${colors.cyan}${analysis.requiredAgents.join(', ')}${colors.reset}`);
  console.log(`  ${colors.bright}Estimated Time:${colors.reset}  ${colors.yellow}${analysis.estimatedTime}${colors.reset}`);
  console.log(`  ${colors.bright}Estimated Cost:${colors.reset}  ${colors.magenta}${analysis.estimatedCost}${colors.reset}`);
  console.log(`  ${colors.bright}Tokens:${colors.reset}          ${colors.dim}~${analysis.tokensEstimate.toLocaleString()}${colors.reset}\n`);

  // Execution plan
  console.log(colors.bright + '─── Execution Plan ' + '─'.repeat(38) + colors.reset + '\n');

  executionPlan.phases.forEach((phase, idx) => {
    const phaseTasks = phase.tasks.map(id => tasks.find(t => t.id === id)).filter(Boolean);

    console.log(colors.bright + colors.blue + `Phase ${phase.phase}: ${phase.name}` + colors.reset);

    phaseTasks.forEach(task => {
      const agentColor = getAgentColor(task.agent);
      const depInfo = task.dependencies.length > 0
        ? colors.dim + ` (depends: ${task.dependencies.join(', ')})` + colors.reset
        : '';

      console.log(`  ${colors.dim}[${task.id}]${colors.reset} ` +
                  `${agentColor}${task.agent.padEnd(11)}${colors.reset} ` +
                  `${task.title}  ${colors.green}${task.estimatedCost}${colors.reset}${depInfo}`);
    });

    if (phase.parallelizable) {
      console.log(`  ${colors.dim}↳ Can run in parallel${colors.reset}`);
    }
    console.log('');
  });

  // Task details
  if (options.verbose) {
    console.log(colors.bright + '─── Task Details ' + '─'.repeat(40) + colors.reset + '\n');
    tasks.forEach(task => {
      console.log(colors.bright + `${task.id}: ${task.title}` + colors.reset);
      console.log(`  ${colors.dim}${task.description}${colors.reset}`);
      console.log(`  Agent: ${getAgentColor(task.agent)}${task.agent}${colors.reset} | ` +
                  `Tokens: ${task.estimatedTokens} | Cost: ${task.estimatedCost}`);
      if (task.dependencies.length > 0) {
        console.log(`  Dependencies: ${task.dependencies.join(', ')}`);
      }
      console.log('');
    });
  }

  console.log(colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

/**
 * Print summary only
 */
function printSummary(decomposition) {
  const { spec, analysis, tasks } = decomposition;

  console.log(`\n${colors.bright}${spec.name}${colors.reset}`);
  console.log(`  Tasks: ${colors.green}${analysis.totalTasks}${colors.reset} | ` +
              `Agents: ${colors.cyan}${analysis.requiredAgents.join(', ')}${colors.reset} | ` +
              `Time: ${colors.yellow}${analysis.estimatedTime}${colors.reset} | ` +
              `Cost: ${colors.magenta}${analysis.estimatedCost}${colors.reset}\n`);
}

/**
 * Get color for complexity
 */
function getComplexityColor(complexity) {
  if (complexity === 'EASY') return colors.green;
  if (complexity === 'MODERATE') return colors.yellow;
  if (complexity === 'HIGH') return colors.red;
  return colors.white;
}

/**
 * Get color for agent type
 */
function getAgentColor(agent) {
  if (agent === 'database') return colors.magenta;
  if (agent === 'backend') return colors.blue;
  if (agent === 'frontend') return colors.cyan;
  if (agent === 'integration') return colors.yellow;
  return colors.white;
}

/**
 * Save to JSON file
 */
function saveToJson(decomposition, outputPath) {
  try {
    const json = JSON.stringify(decomposition, null, 2);
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`\n${colors.green}✓${colors.reset} Saved to ${colors.bright}${outputPath}${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to save JSON: ${error.message}\n`);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.bright}Spec-MAS Task Decomposition${colors.reset}

${colors.bright}USAGE:${colors.reset}
  node scripts/task-decomposition.js <spec-file> [options]

${colors.bright}OPTIONS:${colors.reset}
  --output, -o <file>    Save decomposition to JSON file
  --summary, -s          Show summary only (condensed output)
  --verbose, -v          Show detailed task descriptions
  --help, -h             Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.dim}# Analyze a spec${colors.reset}
  node scripts/task-decomposition.js docs/examples/level-3-filter-spec.md

  ${colors.dim}# Save to JSON${colors.reset}
  node scripts/task-decomposition.js spec.md --output plan.json

  ${colors.dim}# Summary only${colors.reset}
  node scripts/task-decomposition.js spec.md --summary
`);
}

/**
 * Main CLI
 */
function main() {
  const args = process.argv.slice(2);

  // Show help
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Parse arguments
  const specPath = args[0];
  const options = {
    summary: args.includes('--summary') || args.includes('-s'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    output: null
  };

  // Get output path if specified
  const outputIdx = args.findIndex(arg => arg === '--output' || arg === '-o');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.output = args[outputIdx + 1];
  }

  // Validate spec file exists
  if (!fs.existsSync(specPath)) {
    console.error(`${colors.red}✗${colors.reset} Spec file not found: ${specPath}\n`);
    process.exit(1);
  }

  try {
    // Decompose the spec
    const decomposition = decomposeSpec(specPath);

    // Print report
    printReport(decomposition, options);

    // Save to JSON if requested
    if (options.output) {
      saveToJson(decomposition, options.output);
    }

    process.exit(0);
  } catch (error) {
    console.error(`\n${colors.red}✗ Error:${colors.reset} ${error.message}\n`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  decomposeSpec,
  analyzeTasks,
  buildDependencies,
  createExecutionPlan,
  calculateEstimates
};
