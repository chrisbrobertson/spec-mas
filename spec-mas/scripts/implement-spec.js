#!/usr/bin/env node

/**
 * Spec-MAS Implementation Orchestrator
 * Executes decomposed tasks using AI agents to generate production code
 */

const fs = require('fs');
const path = require('path');
const { callAI, calculateCost } = require('./ai-helper');
const { resolveStepModel } = require('../src/ai/client');
const { decomposeSpec } = require('./task-decomposition');
const { validateSpec } = require('./validate-spec');
const { parseSpec } = require('./spec-parser');
const { isAgentReady } = require('../src/validation/gates');

// Color codes for terminal output
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
  white: '\x1b[37m',
};

// Cost tracking
const COST_PER_1M_INPUT_TOKENS = 3.00;  // $3.00 per 1M input tokens
const COST_PER_1M_OUTPUT_TOKENS = 15.00; // $15.00 per 1M output tokens
const COST_WARNING_THRESHOLD = 10.00;    // Warn at $10
const COST_ABORT_THRESHOLD = 50.00;      // Abort at $50

// Global state
let totalCost = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;
let generatedFiles = [];
let warnings = [];
let startTime = null;

/**
 * Print formatted section header
 */
function printHeader(text, char = '═', width = 60) {
  console.log('\n' + colors.bright + colors.cyan + char.repeat(width) + colors.reset);
  console.log(colors.bright + colors.cyan + `  ${text}` + colors.reset);
  console.log(colors.bright + colors.cyan + char.repeat(width) + colors.reset + '\n');
}

/**
 * Print sub-header
 */
function printSubHeader(text) {
  console.log('\n' + colors.bright + colors.blue + `─── ${text} ` + '─'.repeat(Math.max(0, 60 - text.length - 5)) + colors.reset);
}

/**
 * Format cost
 */
function formatCost(cost) {
  return colors.magenta + `$${cost.toFixed(2)}` + colors.reset;
}

/**
 * Calculate cost from tokens (local implementation)
 */
function calculateLocalCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000000) * COST_PER_1M_INPUT_TOKENS;
  const outputCost = (outputTokens / 1000000) * COST_PER_1M_OUTPUT_TOKENS;
  return inputCost + outputCost;
}

/**
 * Update cost tracking
 */
function updateCostTracking(inputTokens, outputTokens) {
  totalInputTokens += inputTokens;
  totalOutputTokens += outputTokens;
  const cost = calculateLocalCost(inputTokens, outputTokens);
  totalCost += cost;
  return cost;
}

/**
 * Check if cost limits exceeded
 */
function checkCostLimits() {
  if (totalCost >= COST_ABORT_THRESHOLD) {
    throw new Error(`Cost limit exceeded: ${formatCost(totalCost)} >= ${formatCost(COST_ABORT_THRESHOLD)}`);
  }
  if (totalCost >= COST_WARNING_THRESHOLD) {
    console.log(colors.yellow + `\n⚠ Warning: Cost approaching limit (${formatCost(totalCost)})` + colors.reset);
  }
}

/**
 * Validate prerequisites
 */
function validatePrerequisites(specPath, options) {
  console.log(colors.bright + 'Validating prerequisites...' + colors.reset);

  // Check AI provider is configured
  const { provider } = resolveStepModel('implementation');

  if (provider === 'claude') {
    console.log(colors.green + '✓ AI Provider: Claude CLI' + colors.reset);
    console.log(colors.dim + '  (Ensure Claude CLI is configured: claude config set api-key YOUR_KEY)' + colors.reset);
  } else if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      console.error(colors.red + '✗ OPENAI_API_KEY environment variable not set' + colors.reset);
      console.error(colors.yellow + '\nSet it in .env file or with:' + colors.reset);
      console.error(colors.dim + '  export OPENAI_API_KEY=your-api-key-here\n' + colors.reset);
      process.exit(1);
    }
    console.log(colors.green + '✓ AI Provider: OpenAI (ChatGPT)' + colors.reset);
  } else {
    console.error(colors.red + `✗ Unknown AI provider: ${provider}` + colors.reset);
    console.error(colors.yellow + 'Valid providers: claude, openai' + colors.reset);
    process.exit(1);
  }

  // Check spec file exists
  if (!fs.existsSync(specPath)) {
    console.error(colors.red + `✗ Spec file not found: ${specPath}` + colors.reset);
    process.exit(1);
  }
  console.log(colors.green + `✓ Spec file found: ${specPath}` + colors.reset);

  // Validate spec
  try {
    const spec = parseSpec(specPath);
    const { runAllGates } = require('../src/validation/gates');
    const gateResults = runAllGates(spec);
    const { complexity, maturity } = spec.metadata;
    const agentReady = isAgentReady(gateResults, complexity, maturity);

    if (!agentReady) {
      console.error(colors.red + '✗ Spec failed validation' + colors.reset);
      console.error(colors.yellow + '\nRun validation first:' + colors.reset);
      console.error(colors.dim + `  npm run validate-spec ${specPath}\n` + colors.reset);
      process.exit(1);
    }
    console.log(colors.green + '✓ Spec passed validation' + colors.reset);

    return spec;
  } catch (error) {
    console.error(colors.red + `✗ Spec validation failed: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

/**
 * Load task decomposition
 */
function loadTaskDecomposition(specPath) {
  console.log('\n' + colors.bright + 'Loading task decomposition...' + colors.reset);

  try {
    const decomposition = decomposeSpec(specPath);

    console.log(colors.green + '✓ Decomposition complete' + colors.reset);
    console.log(colors.dim + `  Tasks: ${decomposition.tasks.length}` + colors.reset);
    console.log(colors.dim + `  Phases: ${decomposition.executionPlan.phases.length}` + colors.reset);
    console.log(colors.dim + `  Agents: ${decomposition.analysis.requiredAgents.join(', ')}` + colors.reset);
    console.log(colors.dim + `  Estimated Cost: ${decomposition.analysis.estimatedCost}` + colors.reset);

    return decomposition;
  } catch (error) {
    console.error(colors.red + `✗ Failed to decompose spec: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

/**
 * Show execution plan
 */
function showExecutionPlan(decomposition, options) {
  printSubHeader('Execution Plan');

  const { spec, analysis, tasks, executionPlan } = decomposition;

  console.log(`${colors.bright}Spec:${colors.reset} ${spec.name}`);
  console.log(`${colors.bright}Mode:${colors.reset} ${options.mode}`);
  console.log(`${colors.bright}Output:${colors.reset} ${options.outputDir}`);
  console.log('');

  executionPlan.phases.forEach((phase, idx) => {
    const phaseTasks = phase.tasks.map(id => tasks.find(t => t.id === id)).filter(Boolean);

    console.log(colors.bright + colors.blue + `Phase ${phase.phase}: ${phase.name}` + colors.reset);

    phaseTasks.forEach(task => {
      const agentColor = getAgentColor(task.agent);
      console.log(`  ${colors.dim}[${task.id}]${colors.reset} ` +
                  `${agentColor}${task.agent.padEnd(11)}${colors.reset} ` +
                  `${task.title}  ${colors.green}${task.estimatedCost}${colors.reset}`);
    });

    if (phase.parallelizable && options.mode === 'parallel') {
      console.log(`  ${colors.dim}↳ Running in parallel${colors.reset}`);
    }
    console.log('');
  });

  console.log(colors.dim + `Total Estimated Cost: ${analysis.estimatedCost}` + colors.reset);
  console.log(colors.dim + `Estimated Time: ${analysis.estimatedTime}` + colors.reset);
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
 * Setup environment
 */
/**
 * Check if implementation already exists and prompt user
 */
async function checkExistingImplementation(options) {
  // Check if output directory exists and has files
  if (!fs.existsSync(options.outputDir)) {
    return true; // No existing implementation, proceed
  }

  const files = fs.readdirSync(options.outputDir);
  if (files.length === 0) {
    return true; // Directory exists but empty, proceed
  }

  // Check for implementation report
  const reportPath = path.join(options.outputDir, 'IMPLEMENTATION_REPORT.md');
  let reportInfo = '';

  if (fs.existsSync(reportPath)) {
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    const durationMatch = reportContent.match(/Duration:\*\* ([\d.]+)s/);
    const filesMatch = reportContent.match(/Files Created:\*\* (\d+)/);
    const dateMatch = reportContent.match(/Started:\*\* (.+)/);

    if (dateMatch || filesMatch) {
      reportInfo = '\n  ' + colors.dim;
      if (dateMatch) reportInfo += `Last run: ${dateMatch[1]} `;
      if (filesMatch) reportInfo += `(${filesMatch[1]} files generated)`;
      reportInfo += colors.reset;
    }
  }

  // Show warning
  console.log('');
  console.log(colors.yellow + '⚠ Implementation already exists!' + colors.reset);
  console.log(colors.dim + `  Directory: ${options.outputDir}` + colors.reset);
  console.log(colors.dim + `  Files: ${files.length} file(s) found` + colors.reset);
  if (reportInfo) console.log(reportInfo);
  console.log('');
  console.log(colors.bright + 'What would you like to do?' + colors.reset);
  console.log(colors.dim + '  [c] Continue and overwrite (creates backup)' + colors.reset);
  console.log(colors.dim + '  [s] Skip - abort implementation' + colors.reset);
  console.log('');

  // Prompt user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(colors.bright + 'Your choice (c/s): ' + colors.reset, (answer) => {
      rl.close();
      const choice = answer.toLowerCase().trim();

      if (choice === 'c' || choice === 'continue') {
        console.log(colors.green + '\n✓ Continuing - existing files will be backed up' + colors.reset);
        resolve(true);
      } else {
        console.log(colors.yellow + '\n⚠ Implementation aborted by user' + colors.reset);
        console.log(colors.dim + '\nTip: Use --output-dir to specify a different directory' + colors.reset);
        resolve(false);
      }
    });
  });
}

function setupEnvironment(spec, options) {
  console.log('\n' + colors.bright + 'Setting up environment...' + colors.reset);

  // Create output directory
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
    console.log(colors.green + `✓ Created output directory: ${options.outputDir}` + colors.reset);
  } else {
    console.log(colors.yellow + `⚠ Output directory exists: ${options.outputDir}` + colors.reset);

    // Backup existing files
    const backupDir = path.join('.backups', new Date().toISOString().replace(/[:.]/g, '-'));
    if (fs.readdirSync(options.outputDir).length > 0) {
      fs.mkdirSync(backupDir, { recursive: true });

      // Copy files to backup
      const files = fs.readdirSync(options.outputDir, { recursive: true });
      files.forEach(file => {
        const srcPath = path.join(options.outputDir, file);
        const destPath = path.join(backupDir, file);

        if (fs.statSync(srcPath).isFile()) {
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
        }
      });

      console.log(colors.green + `✓ Backed up existing files to: ${backupDir}` + colors.reset);
    }
  }

  // Create git branch if in a git repo
  try {
    const { execSync } = require('child_process');
    const branchName = `feat/spec-${spec.id || 'implementation'}`;

    // Check if git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });

      // Create and checkout branch
      try {
        execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
        console.log(colors.green + `✓ Created git branch: ${branchName}` + colors.reset);
      } catch (error) {
        // Branch might already exist
        try {
          execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
          console.log(colors.yellow + `⚠ Switched to existing branch: ${branchName}` + colors.reset);
        } catch (e) {
          console.log(colors.yellow + `⚠ Could not create/switch branch: ${e.message}` + colors.reset);
        }
      }
    } catch (error) {
      console.log(colors.dim + '  Not a git repository, skipping branch creation' + colors.reset);
    }
  } catch (error) {
    console.log(colors.dim + '  Git not available, skipping branch creation' + colors.reset);
  }
}

/**
 * Load agent prompt
 */
function loadAgentPrompt(agentType) {
  const promptPath = path.join(__dirname, '../agents/implementers', `${agentType}-agent.md`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Agent prompt not found: ${promptPath}`);
  }

  return fs.readFileSync(promptPath, 'utf8');
}

/**
 * Build task context for agent
 */
function buildTaskContext(spec, task, decomposition) {
  const specContent = fs.readFileSync(spec.filePath, 'utf8');

  // Extract relevant sections based on task agent
  const relevantSections = extractRelevantSections(spec, task);

  return `# Implementation Task

## Task Details
**ID:** ${task.id}
**Title:** ${task.title}
**Description:** ${task.description}
**Agent:** ${task.agent}
**Complexity:** ${task.complexity}

## Full Specification
${specContent}

## Relevant Sections for This Task
${relevantSections}

## Requirements
- Follow the coding standards in your agent prompt
- Generate complete, production-ready code
- Include error handling as specified in the spec
- Add comments explaining complex logic
- Make code testable
- Follow security best practices
- Implement all error scenarios from the spec

## Output Format

**CRITICAL: You MUST provide the ACTUAL CODE IMPLEMENTATION, not a summary or description!**

Use this EXACT format for ALL files:

\`\`\`filepath:path/to/file.ext
// Actual working code here
\`\`\`

Example:
\`\`\`filepath:src/routes/products.routes.ts
import express from 'express';
export const router = express.Router();
router.get('/products', async (req, res) => {
  // actual implementation
});
\`\`\`

**DO NOT:**
- Provide summaries like "I have completed..."
- List what you would implement
- Use standard code blocks (must use filepath: format)

**DO:**
- Write the complete, production-ready code
- Use the filepath: format for every file
- Include all necessary imports, types, and logic

START YOUR RESPONSE WITH THE FIRST CODE BLOCK NOW:
`;
}

/**
 * Extract relevant sections based on task
 */
function extractRelevantSections(spec, task) {
  const sections = [];

  // Always include metadata
  sections.push(`### Metadata`);
  sections.push(`- Name: ${spec.metadata.name || 'N/A'}`);
  sections.push(`- Complexity: ${spec.metadata.complexity || 'N/A'}`);
  sections.push(`- Maturity: Level ${spec.metadata.maturity || 'N/A'}`);
  sections.push('');

  // Include sections based on agent type
  if (task.agent === 'database') {
    if (spec.sections.data_model || spec.sections.data_models) {
      sections.push('### Data Models');
      sections.push(JSON.stringify(spec.sections.data_model || spec.sections.data_models, null, 2));
      sections.push('');
    }
  }

  if (task.agent === 'backend') {
    if (spec.sections.functionalRequirements) {
      sections.push('### Functional Requirements');
      sections.push(JSON.stringify(spec.sections.functionalRequirements, null, 2));
      sections.push('');
    }
    if (spec.sections.integration_points) {
      sections.push('### Integration Points');
      sections.push(JSON.stringify(spec.sections.integration_points, null, 2));
      sections.push('');
    }
  }

  if (task.agent === 'frontend') {
    if (spec.sections.userStories) {
      sections.push('### User Stories');
      sections.push(JSON.stringify(spec.sections.userStories, null, 2));
      sections.push('');
    }
  }

  if (task.agent === 'integration') {
    if (spec.sections.integration_points) {
      sections.push('### Integration Points');
      sections.push(JSON.stringify(spec.sections.integration_points, null, 2));
      sections.push('');
    }
  }

  // Always include error scenarios
  if (spec.sections.level_3_robustness) {
    sections.push('### Error Scenarios & Robustness');
    sections.push(JSON.stringify(spec.sections.level_3_robustness, null, 2));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Call AI with agent prompt using unified AI helper
 */
async function callAgent(agentPrompt, taskContext, taskId) {
  try {
    const startTime = Date.now();

    // Get AI provider configuration
    const routing = resolveStepModel('implementation');
    const provider = routing.provider;
    const model = routing.model;

    // Call AI using unified interface
    const result = await callAI(
      agentPrompt,
      taskContext,
      {
        provider,
        model,
        maxTokens: 8192,
        fallback: routing.fallback
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      content: result.content,
      tokens: {
        input: result.tokens.input,
        output: result.tokens.output
      },
      duration
    };
  } catch (error) {
    throw new Error(`AI call failed for ${taskId}: ${error.message}`);
  }
}

/**
 * Extract code blocks from agent response
 */
function extractCode(agentResponse) {
  const codeBlocks = [];

  // Match both filepath: format and standard code blocks
  const filepathRegex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
  const standardRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let match;

  // First try filepath format
  while ((match = filepathRegex.exec(agentResponse)) !== null) {
    const filepath = match[1].trim();
    const code = match[2].trim();

    codeBlocks.push({
      filepath,
      code,
      language: getLanguageFromPath(filepath)
    });
  }

  // If no filepath blocks found, try standard blocks
  if (codeBlocks.length === 0) {
    while ((match = standardRegex.exec(agentResponse)) !== null) {
      const language = match[1] || 'javascript';
      const code = match[2].trim();

      // Try to infer filename from code or use generic name
      const filepath = inferFilepathFromCode(code, language);

      codeBlocks.push({
        filepath,
        code,
        language
      });
    }
  }

  return codeBlocks;
}

/**
 * Get language from file path
 */
function getLanguageFromPath(filepath) {
  const ext = path.extname(filepath);
  const langMap = {
    '.ts': 'typescript',
    '.js': 'javascript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.sql': 'sql',
    '.json': 'json',
    '.md': 'markdown'
  };
  return langMap[ext] || 'text';
}

/**
 * Infer filepath from code content
 */
function inferFilepathFromCode(code, language) {
  // Try to find file path comments
  const pathComment = code.match(/\/\/\s*([^\n]+\.(ts|js|tsx|jsx|py|sql))/);
  if (pathComment) {
    return pathComment[1].trim();
  }

  // Use language to create generic filename
  const extMap = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    sql: 'sql'
  };

  const ext = extMap[language] || 'txt';
  const timestamp = Date.now();

  return `generated/code-${timestamp}.${ext}`;
}

/**
 * Write code to files
 */
function writeCodeToFiles(codeBlocks, outputDir, taskId) {
  const createdFiles = [];

  codeBlocks.forEach((block, idx) => {
    const fullPath = path.join(outputDir, block.filepath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, block.code, 'utf8');
    createdFiles.push(fullPath);

    console.log(colors.green + `  ✓ Created: ${block.filepath}` + colors.reset);
  });

  return createdFiles;
}

/**
 * Execute a single task
 */
async function executeTask(task, spec, decomposition, options, retryCount = 0) {
  const agentColor = getAgentColor(task.agent);
  console.log(`  ${colors.dim}[${task.id}]${colors.reset} ${agentColor}${task.agent.padEnd(11)}${colors.reset} ${task.title}  ${colors.yellow}⏳ Running${colors.reset}`);

  try {
    const taskStartTime = Date.now();

    // Load agent prompt
    const agentPrompt = loadAgentPrompt(task.agent);

    // Build task context
    const taskContext = buildTaskContext(spec, task, decomposition);

    // Call agent
    const response = await callAgent(agentPrompt, taskContext, task.id);

    // Update cost tracking
    const cost = updateCostTracking(response.tokens.input, response.tokens.output);
    checkCostLimits();

    // Extract code from response
    const codeBlocks = extractCode(response.content);

    if (codeBlocks.length === 0) {
      warnings.push(`${task.id}: No code blocks found in agent response`);
      console.log(colors.yellow + `  ⚠ No code blocks found` + colors.reset);
    }

    // Write code to files
    const createdFiles = writeCodeToFiles(codeBlocks, options.outputDir, task.id);
    generatedFiles.push(...createdFiles);

    // Print summary
    console.log(colors.green + `  ✓ Completed` + colors.reset);
    console.log(colors.dim + `    Tokens: ${response.tokens.input.toLocaleString()} in, ${response.tokens.output.toLocaleString()} out | ` +
                `Cost: ${formatCost(cost)} | Time: ${response.duration}s` + colors.reset);

    return {
      taskId: task.id,
      success: true,
      files: createdFiles,
      tokens: response.tokens,
      cost,
      duration: response.duration
    };

  } catch (error) {
    // Retry logic with exponential backoff
    if (retryCount < 3 && error.message.includes('API')) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(colors.yellow + `  ⚠ Retrying in ${delay/1000}s... (attempt ${retryCount + 1}/3)` + colors.reset);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeTask(task, spec, decomposition, options, retryCount + 1);
    }

    console.log(colors.red + `  ✗ Failed: ${error.message}` + colors.reset);
    warnings.push(`${task.id}: ${error.message}`);

    return {
      taskId: task.id,
      success: false,
      error: error.message
    };
  }
}

/**
 * Execute tasks in a phase
 */
async function executePhase(phase, tasks, spec, decomposition, options) {
  printSubHeader(`Phase ${phase.phase}: ${phase.name}`);

  // Get all tasks for this phase
  let phaseTasks = phase.tasks.map(id => tasks.find(t => t.id === id)).filter(Boolean);

  // Filter by agent if specified
  if (options.agents && options.agents.length > 0) {
    phaseTasks = phaseTasks.filter(task => options.agents.includes(task.agent));
  }

  // Skip phase if no tasks match
  if (phaseTasks.length === 0) {
    console.log(colors.dim + `  (Skipping - no tasks for selected agents)` + colors.reset);
    return [];
  }

  if (options.mode === 'parallel' && phase.parallelizable) {
    // Execute in parallel
    const results = await Promise.all(
      phaseTasks.map(task => executeTask(task, spec, decomposition, options))
    );
    return results;
  } else {
    // Execute sequentially
    const results = [];
    for (const task of phaseTasks) {
      const result = await executeTask(task, spec, decomposition, options);
      results.push(result);
    }
    return results;
  }
}

/**
 * Run post-processing
 */
function runPostProcessing(spec, decomposition, options, phaseResults) {
  console.log('\n' + colors.bright + 'Running post-processing...' + colors.reset);

  // Run prettier/eslint if available
  try {
    const { execSync } = require('child_process');

    // Try prettier
    try {
      execSync(`npx prettier --write "${options.outputDir}/**/*.{js,ts,jsx,tsx}" 2>/dev/null`, { stdio: 'ignore' });
      console.log(colors.green + '✓ Formatted code with Prettier' + colors.reset);
    } catch (error) {
      console.log(colors.dim + '  Prettier not available, skipping formatting' + colors.reset);
    }
  } catch (error) {
    console.log(colors.dim + '  Skipping code formatting' + colors.reset);
  }

  // Generate implementation report
  const report = generateImplementationReport(spec, decomposition, phaseResults, options);
  const reportPath = path.join(options.outputDir, 'IMPLEMENTATION_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(colors.green + `✓ Generated implementation report: ${reportPath}` + colors.reset);

  // Commit to git if in a repo
  try {
    const { execSync } = require('child_process');

    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });

      // Add files
      execSync(`git add ${options.outputDir}`, { stdio: 'ignore' });

      // Commit
      const commitMessage = `feat: implement ${spec.name || 'specification'}\n\nGenerated from spec: ${spec.filePath}\nAgent implementation using Spec-MAS`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'ignore' });

      console.log(colors.green + '✓ Committed to git' + colors.reset);
    } catch (error) {
      console.log(colors.dim + '  Could not commit to git (may be no changes or not a git repo)' + colors.reset);
    }
  } catch (error) {
    console.log(colors.dim + '  Git not available, skipping commit' + colors.reset);
  }
}

/**
 * Generate implementation report
 */
function generateImplementationReport(spec, decomposition, phaseResults, options) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successfulTasks = phaseResults.flat().filter(r => r.success).length;
  const failedTasks = phaseResults.flat().filter(r => !r.success).length;

  return `# Implementation Report

## Specification
- **Name:** ${spec.name || 'N/A'}
- **ID:** ${spec.id || 'N/A'}
- **Complexity:** ${spec.metadata.complexity || 'N/A'}
- **Maturity Level:** ${spec.metadata.maturity || 'N/A'}
- **Source File:** ${spec.filePath}

## Execution Summary
- **Mode:** ${options.mode}
- **Started:** ${new Date(startTime).toISOString()}
- **Duration:** ${duration}s
- **Status:** ${failedTasks === 0 ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}

## Tasks
- **Total:** ${decomposition.tasks.length}
- **Successful:** ${successfulTasks}
- **Failed:** ${failedTasks}

## Generated Files
${generatedFiles.map(f => `- \`${path.relative(options.outputDir, f)}\``).join('\n')}

## Cost Summary
- **Total Cost:** $${totalCost.toFixed(2)}
- **Input Tokens:** ${totalInputTokens.toLocaleString()}
- **Output Tokens:** ${totalOutputTokens.toLocaleString()}

## Phase Results

${phaseResults.map((results, idx) => {
  const phase = decomposition.executionPlan.phases[idx];
  return `### Phase ${phase.phase}: ${phase.name}

${results.map(r => {
  if (r.success) {
    return `- ✅ **${r.taskId}** - Generated ${r.files.length} file(s) - Cost: $${r.cost.toFixed(2)} - Time: ${r.duration}s`;
  } else {
    return `- ❌ **${r.taskId}** - Failed: ${r.error}`;
  }
}).join('\n')}`;
}).join('\n\n')}

## Warnings
${warnings.length > 0 ? warnings.map(w => `- ⚠️ ${w}`).join('\n') : '_No warnings_'}

## Next Steps

1. **Review Generated Code**
   - Check all generated files in \`${options.outputDir}\`
   - Verify business logic is correct
   - Ensure error handling is comprehensive

2. **Run Tests**
   - Execute generated tests (if any)
   - Add additional test coverage as needed

3. **Integration**
   - Integrate generated code into your project
   - Update dependencies in package.json
   - Configure environment variables

4. **Deploy**
   - Review security settings
   - Configure production environment
   - Deploy when ready

---

*Generated by Spec-MAS v3.0 - ${new Date().toISOString()}*
`;
}

/**
 * Show cost summary
 */
function showCostSummary() {
  printSubHeader('Cost Summary');

  console.log(`  ${colors.bright}Total Cost:${colors.reset}      ${formatCost(totalCost)}`);
  console.log(`  ${colors.bright}Input Tokens:${colors.reset}    ${totalInputTokens.toLocaleString()}`);
  console.log(`  ${colors.bright}Output Tokens:${colors.reset}   ${totalOutputTokens.toLocaleString()}`);
  console.log(`  ${colors.bright}Files Created:${colors.reset}   ${generatedFiles.length}`);

  if (warnings.length > 0) {
    console.log(`  ${colors.bright}Warnings:${colors.reset}        ${colors.yellow}${warnings.length}${colors.reset}`);
  }
}

/**
 * Main implementation function
 */
async function implementSpec(specPath, options) {
  startTime = Date.now();

  printHeader('IMPLEMENTATION IN PROGRESS');

  console.log(`Spec: ${colors.bright}${path.basename(specPath)}${colors.reset}`);
  console.log(`Mode: ${colors.bright}${options.mode}${colors.reset} | Output: ${colors.bright}${options.outputDir}${colors.reset}\n`);

  try {
    // 1. Validate prerequisites
    const spec = validatePrerequisites(specPath, options);

    // 2. Load task decomposition
    const decomposition = loadTaskDecomposition(specPath);

    // 3. Show execution plan
    showExecutionPlan(decomposition, options);

    // 4. Stop here if dry-run
    if (options.dryRun) {
      console.log('\n' + colors.yellow + '🏁 Dry run complete - no code generated' + colors.reset);
      console.log(colors.dim + '\nRemove --dry-run flag to execute implementation\n' + colors.reset);
      return 0;
    }

    // 5. Check for existing implementation and prompt user (unless --force is used)
    if (!options.force) {
      const shouldContinue = await checkExistingImplementation(options);
      if (!shouldContinue) {
        return 0; // User chose to abort
      }
    }

    // 6. Setup environment
    setupEnvironment(spec, options);

    // 7. Execute tasks by phase
    printHeader('EXECUTING TASKS');

    const phaseResults = [];
    const filteredPhases = options.agents.length > 0
      ? decomposition.executionPlan.phases.filter(phase => {
          const phaseTasks = phase.tasks.map(id => decomposition.tasks.find(t => t.id === id));
          return phaseTasks.some(task => options.agents.includes(task.agent));
        })
      : decomposition.executionPlan.phases;

    for (const phase of filteredPhases) {
      const results = await executePhase(phase, decomposition.tasks, spec, decomposition, options);
      phaseResults.push(results);
    }

    // 8. Post-processing
    runPostProcessing(spec, decomposition, options, phaseResults);

    // 9. Show summary
    printHeader('IMPLEMENTATION COMPLETE');
    showCostSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${colors.green}✓ Implementation complete in ${duration}s${colors.reset}`);
    console.log(colors.dim + `\nGenerated files in: ${options.outputDir}` + colors.reset);
    console.log(colors.dim + `Implementation report: ${path.join(options.outputDir, 'IMPLEMENTATION_REPORT.md')}` + colors.reset);
    console.log('');

    return 0;

  } catch (error) {
    console.error('\n' + colors.red + `✗ Implementation failed: ${error.message}` + colors.reset);
    if (options.verbose) {
      console.error(colors.dim + error.stack + colors.reset);
    }
    console.log('');
    return 1;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    outputDir: 'implementation-output',
    mode: 'sequential',
    agents: [],
    verbose: args.includes('--verbose') || args.includes('-v'),
    filePath: null
  };

  // Parse --output-dir
  const outputIdx = args.indexOf('--output-dir');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.outputDir = args[outputIdx + 1];
  }

  // Parse --mode
  const modeIdx = args.indexOf('--mode');
  if (modeIdx !== -1 && args[modeIdx + 1]) {
    const mode = args[modeIdx + 1];
    if (!['sequential', 'parallel'].includes(mode)) {
      console.error(colors.red + `Invalid mode: ${mode}. Must be 'sequential' or 'parallel'` + colors.reset);
      process.exit(1);
    }
    options.mode = mode;
  }

  // Parse --agents
  const agentsIdx = args.indexOf('--agents');
  if (agentsIdx !== -1 && args[agentsIdx + 1]) {
    options.agents = args[agentsIdx + 1].split(',').map(a => a.trim());

    // Validate agent names
    const validAgents = ['database', 'backend', 'frontend', 'integration'];
    const invalidAgents = options.agents.filter(a => !validAgents.includes(a));
    if (invalidAgents.length > 0) {
      console.error(colors.red + `Invalid agents: ${invalidAgents.join(', ')}` + colors.reset);
      console.error(colors.yellow + `Valid agents: ${validAgents.join(', ')}` + colors.reset);
      process.exit(1);
    }
  }

  // Find file path (first non-flag argument)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.startsWith('-') &&
        arg !== options.outputDir &&
        arg !== options.mode &&
        !options.agents.includes(arg) &&
        arg !== options.agents.join(',')) {
      options.filePath = arg;
      break;
    }
  }

  return options;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.bright}Spec-MAS Implementation Orchestrator${colors.reset}

Generates production code from validated specifications using AI agents.

${colors.bright}USAGE:${colors.reset}
  node scripts/implement-spec.js <spec-file> [options]
  npm run implement-spec <spec-file> [options]

${colors.bright}ARGUMENTS:${colors.reset}
  <spec-file>    Path to validated specification file

${colors.bright}OPTIONS:${colors.reset}
  --dry-run              Show execution plan without generating code
  --force                Skip prompt and overwrite existing implementation (use with caution)
  --output-dir <path>    Output directory for generated code (default: implementation-output/)
  --mode <mode>          Execution mode: sequential or parallel (default: sequential)
  --agents <list>        Comma-separated list of agents to run (default: auto-detect)
                         Valid agents: database, backend, frontend, integration
  --verbose, -v          Show detailed error information
  --help, -h             Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.dim}# Basic usage${colors.reset}
  npm run implement-spec docs/examples/level-3-filter-spec.md

  ${colors.dim}# Dry run to see plan and cost estimate${colors.reset}
  npm run implement-spec spec.md --dry-run

  ${colors.dim}# Specify output directory${colors.reset}
  npm run implement-spec spec.md --output-dir src/features/

  ${colors.dim}# Parallel execution (faster)${colors.reset}
  npm run implement-spec spec.md --mode parallel

  ${colors.dim}# Only run specific agents${colors.reset}
  npm run implement-spec spec.md --agents frontend,backend

${colors.bright}PREREQUISITES:${colors.reset}
  - Claude CLI installed and configured: npm install -g @anthropic-ai/cli
  - Run once: claude config set api-key YOUR_KEY
  - Or use OpenAI: Set AI_PROVIDER=openai and OPENAI_API_KEY in .env
  - Spec must pass validation (run: npm run validate-spec <spec-file>)

${colors.bright}COST CONTROLS:${colors.reset}
  - Warning at: $${COST_WARNING_THRESHOLD.toFixed(2)}
  - Abort at: $${COST_ABORT_THRESHOLD.toFixed(2)}
  - Use --dry-run to estimate costs before running

${colors.bright}OUTPUT:${colors.reset}
  - Generated code files in output directory
  - IMPLEMENTATION_REPORT.md with details
  - Git commit (if in a git repository)

${colors.bright}EXIT CODES:${colors.reset}
  0 - Success
  1 - Error occurred
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const options = parseArgs();

  if (!options.filePath) {
    console.error(colors.red + 'Error: No spec file specified' + colors.reset);
    showHelp();
    process.exit(1);
  }

  const exitCode = await implementSpec(options.filePath, options);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colors.red + `Fatal error: ${error.message}` + colors.reset);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  implementSpec,
  executeTask,
  extractCode,
  buildTaskContext
};
