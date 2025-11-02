/**
 * Spec-MAS Project Initialization
 * Interactive wizard to set up new Spec-MAS projects
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ConfigManager } = require('./config-manager');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Ask a question and get user input
 */
function askQuestion(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue
      ? `${question} [${colorize(defaultValue, 'gray')}]: `
      : `${question}: `;

    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Ask yes/no question
 */
function askYesNo(rl, question, defaultValue = true) {
  const defaultStr = defaultValue ? 'Y/n' : 'y/N';
  return new Promise((resolve) => {
    rl.question(`${question} [${defaultStr}]: `, (answer) => {
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultValue);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * Create directory structure
 */
function createDirectoryStructure(projectPath) {
  const directories = [
    '.specmas',
    'specs',
    'specs/examples',
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/generated',
    'implementation-output',
  ];

  directories.forEach((dir) => {
    const dirPath = path.join(projectPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Create spec template file
 */
function createSpecTemplate(projectPath, projectName) {
  const templateContent = `# ${projectName} - Feature Specification Template

**Feature ID:** FEAT-001
**Status:** Draft
**Priority:** Medium
**Complexity:** LOW
**Maturity Level:** L1 (Local MVP)

---

## 1. Overview

### 1.1 Purpose
Brief description of what this feature does and why it's needed.

### 1.2 Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### 1.3 Out of Scope
What this feature explicitly does NOT include.

---

## 2. Requirements

### 2.1 Functional Requirements

**FR-1: Primary Function**
- **Description:** What the system must do
- **Priority:** High
- **Acceptance Criteria:**
  - Given [context]
  - When [action]
  - Then [expected outcome]

**FR-2: Secondary Function**
- **Description:** Additional functionality
- **Priority:** Medium
- **Acceptance Criteria:**
  - Given [context]
  - When [action]
  - Then [expected outcome]

### 2.2 Non-Functional Requirements

**NFR-1: Performance**
- Response time < 500ms for typical operations

**NFR-2: Security**
- All data must be validated
- User authentication required

---

## 3. Technical Design

### 3.1 Architecture
High-level architecture diagram or description.

### 3.2 Data Model
\`\`\`
// Example schema
{
  id: string,
  name: string,
  createdAt: timestamp
}
\`\`\`

### 3.3 API Endpoints (if applicable)
- \`POST /api/resource\` - Create new resource
- \`GET /api/resource/:id\` - Get resource by ID
- \`PUT /api/resource/:id\` - Update resource
- \`DELETE /api/resource/:id\` - Delete resource

---

## 4. Test Strategy

### 4.1 Unit Tests
- Test individual functions and components
- Target: 80% code coverage

### 4.2 Integration Tests
- Test API endpoints
- Test database operations

### 4.3 E2E Tests
- Test complete user workflows
- Test critical paths

---

## 5. Implementation Notes

### 5.1 Dependencies
- List external libraries or services needed

### 5.2 Risks and Mitigations
- **Risk 1:** Description → Mitigation strategy
- **Risk 2:** Description → Mitigation strategy

### 5.3 Rollout Plan
1. Step 1
2. Step 2
3. Step 3

---

## 6. Acceptance & Sign-off

**Reviewed by:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] QA Lead

**Approved by:** _______________
**Date:** _______________
`;

  const templatePath = path.join(projectPath, 'specs', 'TEMPLATE.md');
  fs.writeFileSync(templatePath, templateContent);
}

/**
 * Create example spec file
 */
function createExampleSpec(projectPath) {
  const exampleContent = `# User Authentication - Example Spec

**Feature ID:** AUTH-001
**Status:** Draft
**Priority:** High
**Complexity:** MODERATE
**Maturity Level:** L2 (Stable)

---

## 1. Overview

### 1.1 Purpose
Implement secure user authentication with email/password and optional social login.

### 1.2 Success Criteria
- [ ] Users can register with email/password
- [ ] Users can login securely
- [ ] Passwords are properly hashed
- [ ] JWT tokens are used for session management
- [ ] Password reset functionality works

---

## 2. Requirements

### 2.1 Functional Requirements

**FR-1: User Registration**
- **Description:** Users must be able to create new accounts
- **Priority:** High
- **Acceptance Criteria:**
  - Given a valid email and password
  - When user submits registration form
  - Then account is created and user receives confirmation

**FR-2: User Login**
- **Description:** Registered users can authenticate
- **Priority:** High
- **Acceptance Criteria:**
  - Given valid credentials
  - When user submits login form
  - Then user receives JWT token and is logged in

---

## 3. Technical Design

### 3.1 Data Model
\`\`\`javascript
User {
  id: UUID,
  email: string (unique),
  passwordHash: string,
  firstName: string,
  lastName: string,
  createdAt: timestamp,
  lastLoginAt: timestamp
}
\`\`\`

### 3.2 API Endpoints
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login user
- \`POST /api/auth/logout\` - Logout user
- \`POST /api/auth/reset-password\` - Request password reset
- \`GET /api/auth/me\` - Get current user info

---

## 4. Security Requirements

**SEC-1:** Passwords must be hashed with bcrypt (min 10 rounds)
**SEC-2:** JWT tokens expire after 24 hours
**SEC-3:** Rate limiting on login attempts (5 per minute)
**SEC-4:** Email validation required
**SEC-5:** HTTPS only for all auth endpoints
`;

  const examplePath = path.join(projectPath, 'specs', 'examples', 'auth-example.md');
  fs.writeFileSync(examplePath, exampleContent);
}

/**
 * Create .gitignore file
 */
function createGitignore(projectPath) {
  const gitignoreContent = `# Spec-MAS
.specmas/state.json
.specmas/*.log
implementation-output/
tests/generated/*.test.js

# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Build
dist/
build/
out/
.next/
`;

  const gitignorePath = path.join(projectPath, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
  }
}

/**
 * Create .env.example file
 */
function createEnvExample(projectPath) {
  const envContent = `# Anthropic API Configuration
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Spec-MAS Configuration
SPECMAS_BUDGET=50
SPECMAS_OUTPUT_DIR=implementation-output

# Application Configuration (customize as needed)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/myapp
`;

  const envExamplePath = path.join(projectPath, '.env.example');
  fs.writeFileSync(envExamplePath, envContent);
}

/**
 * Create README for the project
 */
function createProjectReadme(projectPath, projectName) {
  const readmeContent = `# ${projectName}

A project using Spec-MAS for specification-driven development.

## Getting Started

### 1. Configure API Key

\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Anthropic API key
nano .env
\`\`\`

### 2. Write Your First Spec

\`\`\`bash
# Copy the template
cp specs/TEMPLATE.md specs/my-feature.md

# Edit the spec with your feature details
nano specs/my-feature.md
\`\`\`

### 3. Run the Pipeline

\`\`\`bash
# Validate your spec
specmas validate specs/my-feature.md

# Run the full pipeline
specmas run specs/my-feature.md

# Or run individual phases
specmas review specs/my-feature.md
specmas generate-tests specs/my-feature.md
specmas implement specs/my-feature.md
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── .specmas/           # Spec-MAS configuration and state
├── specs/              # Feature specifications
│   ├── TEMPLATE.md     # Spec template
│   └── examples/       # Example specs
├── tests/              # Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── generated/      # AI-generated tests
├── implementation-output/  # Generated code
└── .env                # Environment configuration
\`\`\`

## Useful Commands

\`\`\`bash
# Check pipeline status
specmas status specs/my-feature.md

# Estimate costs before running
specmas cost specs/my-feature.md

# Generate comprehensive report
specmas report specs/my-feature.md

# Configure Spec-MAS
specmas config --list
specmas config api.model claude-3-opus-20240229
\`\`\`

## Documentation

- [Spec-MAS Documentation](https://github.com/yourusername/Spec-MAS)
- [CLI Reference](https://github.com/yourusername/Spec-MAS/blob/main/docs/cli-reference.md)
- [Quick Start Guide](https://github.com/yourusername/Spec-MAS/blob/main/STARTUP-QUICK-START.md)

## License

[Your License Here]
`;

  const readmePath = path.join(projectPath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readmeContent);
  }
}

/**
 * Main initialization function
 */
async function initProject(projectName, options = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('  Welcome to Spec-MAS!', 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');

  console.log("Let's set up your project.\n");

  try {
    // Get project details
    const name = projectName || await askQuestion(rl, 'Project name', 'my-specmas-project');
    const projectPath = path.resolve(name);

    // Check if directory exists
    if (fs.existsSync(projectPath)) {
      const overwrite = await askYesNo(rl, `Directory ${name} exists. Continue anyway?`, false);
      if (!overwrite) {
        console.log(colorize('\n✗ Initialization cancelled\n', 'yellow'));
        rl.close();
        return;
      }
    }

    // Tech stack selection
    console.log('\nTech stack:');
    console.log('  1. React + Node.js (Next.js)');
    console.log('  2. Vue + Express');
    console.log('  3. Python + FastAPI');
    console.log('  4. Other / Custom');

    const techStack = await askQuestion(rl, 'Select tech stack', '1');

    // API configuration
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    let apiKey = process.env.ANTHROPIC_API_KEY;

    if (!hasApiKey) {
      console.log(colorize('\n⚠ ANTHROPIC_API_KEY not found in environment', 'yellow'));
      apiKey = await askQuestion(rl, 'Enter your Anthropic API key (or press Enter to skip)');
    }

    // Other configuration
    const outputDir = await askQuestion(rl, 'Output directory for generated code', 'implementation-output');
    const autoCommit = await askYesNo(rl, 'Auto-commit to git?', true);
    const budget = await askQuestion(rl, 'Default API budget (USD)', '50');

    console.log(colorize('\n✓ Configuration complete. Creating project...\n', 'green'));

    // Create project structure
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Change to project directory for config creation
    const originalCwd = process.cwd();
    process.chdir(projectPath);

    // Create directory structure
    console.log('  Creating directories...');
    createDirectoryStructure(projectPath);

    // Create configuration
    console.log('  Creating configuration...');
    const configManager = new ConfigManager();
    const configPath = configManager.initProject({
      model: options.model || 'claude-3-5-sonnet-20241022',
      budget: parseFloat(budget),
      outputDir: outputDir
    });

    // Update config with git settings
    configManager.set('git.auto_commit', autoCommit);

    // Create template files
    console.log('  Creating spec templates...');
    createSpecTemplate(projectPath, name);
    createExampleSpec(projectPath);

    // Create project files
    console.log('  Creating project files...');
    createGitignore(projectPath);
    createEnvExample(projectPath);
    createProjectReadme(projectPath, name);

    // Create .env if API key provided
    if (apiKey) {
      const envPath = path.join(projectPath, '.env');
      const envContent = `ANTHROPIC_API_KEY=${apiKey}\nANTHROPIC_MODEL=claude-3-5-sonnet-20241022\nSPECMAS_BUDGET=${budget}\n`;
      fs.writeFileSync(envPath, envContent);
      console.log(colorize('  ✓ Created .env with API key', 'green'));
    }

    // Restore original directory
    process.chdir(originalCwd);

    // Print success message
    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    console.log(colorize('  ✓ Project initialized successfully!', 'green'));
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    console.log('Created:');
    console.log(`  ${colorize('✓', 'green')} Project directory: ${name}/`);
    console.log(`  ${colorize('✓', 'green')} Configuration: .specmas/config.json`);
    console.log(`  ${colorize('✓', 'green')} Spec template: specs/TEMPLATE.md`);
    console.log(`  ${colorize('✓', 'green')} Example spec: specs/examples/auth-example.md`);
    console.log(`  ${colorize('✓', 'green')} Test directories: tests/`);
    console.log(`  ${colorize('✓', 'green')} .gitignore`);
    console.log(`  ${colorize('✓', 'green')} .env.example`);
    console.log(`  ${colorize('✓', 'green')} README.md`);

    if (!apiKey) {
      console.log(colorize('\n⚠ Remember to set ANTHROPIC_API_KEY in .env', 'yellow'));
    }

    console.log('\n' + colorize('Next steps:', 'bright'));
    console.log(`  1. cd ${name}`);
    console.log('  2. Edit specs/TEMPLATE.md with your feature');
    console.log('  3. specmas run specs/TEMPLATE.md');
    console.log('\nHappy building! 🚀\n');

  } catch (error) {
    console.error(colorize('\n✗ Initialization failed: ' + error.message + '\n', 'red'));
    throw error;
  } finally {
    rl.close();
  }
}

// Allow running directly
if (require.main === module) {
  const projectName = process.argv[2];
  initProject(projectName).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { initProject };
