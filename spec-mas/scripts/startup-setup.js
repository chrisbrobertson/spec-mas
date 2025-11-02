#!/usr/bin/env node

/**
 * Spec-MAS Interactive Setup Script
 *
 * Helps new users set up Spec-MAS in 15 minutes:
 * 1. Verify prerequisites
 * 2. Configure AI provider
 * 3. Create .env file
 * 4. Validate sample spec
 * 5. Display next steps
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function header(text) {
  console.log('\n' + colorize('═'.repeat(70), 'cyan'));
  console.log(colorize(text, 'bright'));
  console.log(colorize('═'.repeat(70), 'cyan'));
}

function success(text) {
  console.log(colorize('✓ ', 'green') + text);
}

function error(text) {
  console.log(colorize('✗ ', 'red') + text);
}

function warning(text) {
  console.log(colorize('⚠ ', 'yellow') + text);
}

function info(text) {
  console.log(colorize('ℹ ', 'blue') + text);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(colorize(prompt, 'cyan'), (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.clear();

  header('Spec-MAS v3.0 Interactive Setup');
  console.log('Welcome! This wizard will help you set up Spec-MAS in ~15 minutes.\n');

  const ready = await question('Ready to begin? (y/n): ');
  if (ready.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run this script again when ready!');
    rl.close();
    process.exit(0);
  }

  // Step 1: Check Prerequisites
  header('Step 1/5: Checking Prerequisites');
  await checkPrerequisites();

  // Step 2: Choose AI Provider
  header('Step 2/5: Configure AI Provider');
  const aiConfig = await configureAI();

  // Step 3: Create .env File
  header('Step 3/5: Create Configuration File');
  await createEnvFile(aiConfig);

  // Step 4: Test Installation
  header('Step 4/5: Validate Sample Spec');
  await testInstallation();

  // Step 5: Next Steps
  header('Step 5/5: Setup Complete!');
  displayNextSteps(aiConfig);

  rl.close();
}

async function checkPrerequisites() {
  console.log('Checking required software...\n');

  // Check Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      success(`Node.js ${nodeVersion} (required: >=18.0.0)`);
    } else {
      error(`Node.js ${nodeVersion} - Need version 18 or higher`);
      console.log('  Download from: https://nodejs.org\n');
      process.exit(1);
    }
  } catch (e) {
    error('Node.js not found');
    console.log('  Download from: https://nodejs.org\n');
    process.exit(1);
  }

  // Check npm version
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(npmVersion.split('.')[0]);

    if (majorVersion >= 9) {
      success(`npm ${npmVersion} (required: >=9.0.0)`);
    } else {
      warning(`npm ${npmVersion} - Recommend version 9 or higher`);
      console.log('  Update with: npm install -g npm@latest\n');
    }
  } catch (e) {
    error('npm not found');
    process.exit(1);
  }

  // Check git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    success(gitVersion);
  } catch (e) {
    warning('git not found (optional but recommended)');
    console.log('  Download from: https://git-scm.com\n');
  }

  // Check if npm packages are installed
  try {
    const packageJson = require('../package.json');

    if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
      success('Dependencies installed');
    } else {
      warning('Dependencies not installed yet');
      console.log('\nInstalling dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      success('Dependencies installed');
    }
  } catch (e) {
    error('Could not check/install dependencies');
    console.log('  Try running: npm install\n');
  }

  console.log('\n' + colorize('✓ All prerequisites met!', 'green'));

  const proceed = await question('\nProceed to AI configuration? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled.');
    rl.close();
    process.exit(0);
  }
}

async function configureAI() {
  console.log('\nSpec-MAS supports two AI providers:\n');
  console.log('1. Claude CLI (Anthropic) - RECOMMENDED');
  console.log('   - Simpler authentication (no API key needed)');
  console.log('   - Uses local claude command');
  console.log('   - Cost: ~$20-50/month for typical usage\n');

  console.log('2. OpenAI API');
  console.log('   - Requires API key');
  console.log('   - Uses GPT-4 or GPT-4o-mini');
  console.log('   - Cost: Varies by model (~$10-100/month)\n');

  console.log('3. Both (with automatic fallback)\n');

  const choice = await question('Which provider do you want to use? (1/2/3): ');

  const config = {
    provider: 'claude',
    claudeModel: 'sonnet',
    openaiKey: '',
    openaiModel: 'gpt-4',
    fallbackEnabled: false
  };

  if (choice === '1') {
    // Claude CLI
    console.log('\n' + colorize('Setting up Claude CLI...', 'bright'));

    // Check if Claude CLI is installed
    const claudeInstalled = checkClaudeCLI();

    if (!claudeInstalled) {
      console.log('\nClaude CLI is not installed. Install it now?\n');
      console.log('This will run: npm install -g @anthropic-ai/claude-cli\n');

      const install = await question('Install Claude CLI? (y/n): ');
      if (install.toLowerCase() === 'y') {
        console.log('\nInstalling Claude CLI...');
        try {
          execSync('npm install -g @anthropic-ai/claude-cli', { stdio: 'inherit' });
          success('Claude CLI installed');
        } catch (e) {
          error('Failed to install Claude CLI');
          console.log('  Try manually: npm install -g @anthropic-ai/claude-cli\n');
          process.exit(1);
        }
      } else {
        error('Claude CLI required for this option');
        console.log('  Install manually: npm install -g @anthropic-ai/claude-cli\n');
        process.exit(1);
      }
    } else {
      success('Claude CLI already installed');
    }

    // Authenticate
    console.log('\nAuthenticate with Claude CLI?\n');
    console.log('This will run: npx claude auth\n');

    const auth = await question('Authenticate now? (y/n): ');
    if (auth.toLowerCase() === 'y') {
      console.log('\nFollow the prompts to authenticate...\n');
      try {
        execSync('npx claude auth', { stdio: 'inherit' });
        success('Authentication complete');
      } catch (e) {
        warning('Authentication may have failed');
        console.log('  You can authenticate later with: npx claude auth\n');
      }
    }

    config.provider = 'claude';
    config.claudeModel = 'sonnet';

  } else if (choice === '2') {
    // OpenAI API
    console.log('\n' + colorize('Setting up OpenAI API...', 'bright'));
    console.log('\nYou\'ll need an OpenAI API key.');
    console.log('Get one at: https://platform.openai.com/api-keys\n');

    const apiKey = await question('Enter your OpenAI API key (or press Enter to skip): ');

    if (!apiKey) {
      warning('No API key provided');
      console.log('  You can add it later to .env file as OPENAI_API_KEY\n');
    } else {
      success('API key saved');
    }

    console.log('\nWhich OpenAI model do you want to use?\n');
    console.log('1. gpt-4 (best quality, higher cost ~$10-30/feature)');
    console.log('2. gpt-4o-mini (good quality, lower cost ~$1-5/feature)');
    console.log('3. gpt-4-turbo (balanced)\n');

    const modelChoice = await question('Choose model (1/2/3): ');

    const modelMap = {
      '1': 'gpt-4',
      '2': 'gpt-4o-mini',
      '3': 'gpt-4-turbo'
    };

    config.provider = 'openai';
    config.openaiKey = apiKey;
    config.openaiModel = modelMap[modelChoice] || 'gpt-4';
    success(`Using model: ${config.openaiModel}`);

  } else if (choice === '3') {
    // Both with fallback
    console.log('\n' + colorize('Setting up both providers with fallback...', 'bright'));

    // Claude setup
    const claudeInstalled = checkClaudeCLI();
    if (!claudeInstalled) {
      warning('Claude CLI not installed (will be skipped)');
    } else {
      success('Claude CLI detected');
    }

    // OpenAI setup
    console.log('\nEnter your OpenAI API key for fallback:');
    const apiKey = await question('OpenAI API key (or press Enter to skip): ');

    if (apiKey) {
      success('OpenAI API key saved');
      config.openaiKey = apiKey;
    } else {
      warning('No OpenAI key - fallback disabled');
    }

    config.provider = 'claude';
    config.claudeModel = 'sonnet';
    config.openaiModel = 'gpt-4';
    config.fallbackEnabled = !!apiKey;

  } else {
    error('Invalid choice');
    console.log('\nRe-run setup to try again.');
    rl.close();
    process.exit(1);
  }

  console.log('\n' + colorize('✓ AI provider configured!', 'green'));
  return config;
}

function checkClaudeCLI() {
  try {
    const result = spawnSync('npx', ['claude', '--version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result.status === 0;
  } catch (e) {
    return false;
  }
}

async function createEnvFile(aiConfig) {
  console.log('\nCreating .env configuration file...\n');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    warning('.env file already exists');
    const overwrite = await question('Overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      info('Keeping existing .env file');
      return;
    }
  }

  // Build .env content
  let envContent = `# Spec-MAS Configuration
# Generated by startup-setup.js on ${new Date().toISOString()}

# ─────────────────────────────────────
# AI Provider Configuration
# ─────────────────────────────────────

# Primary AI provider: 'claude' or 'openai'
AI_PROVIDER=${aiConfig.provider}

# Claude configuration
AI_MODEL_CLAUDE=${aiConfig.claudeModel}

# OpenAI configuration
${aiConfig.openaiKey ? `OPENAI_API_KEY=${aiConfig.openaiKey}` : '# OPENAI_API_KEY=sk-...'}
AI_MODEL_OPENAI=${aiConfig.openaiModel}

# Automatic fallback (if primary provider fails)
AI_FALLBACK_ENABLED=${aiConfig.fallbackEnabled}

# ─────────────────────────────────────
# Cost Management
# ─────────────────────────────────────

# Maximum cost per feature (USD)
MAX_COST_PER_FEATURE=25.00

# Monthly budget alert threshold (USD)
BUDGET_ALERT_THRESHOLD=150.00

# ─────────────────────────────────────
# Validation Settings
# ─────────────────────────────────────

# Minimum validation score to proceed (0-100)
MIN_VALIDATION_SCORE=70

# Strict mode (fail on warnings)
STRICT_MODE=false

# ─────────────────────────────────────
# Advanced Settings
# ─────────────────────────────────────

# Log level: debug, info, warn, error
LOG_LEVEL=info

# Enable detailed logging
VERBOSE=false

# Dry run mode (don't actually call APIs)
DRY_RUN=false

# ─────────────────────────────────────
# Git Integration
# ─────────────────────────────────────

# Auto-commit generated code
AUTO_COMMIT=true

# Auto-create feature branches
AUTO_BRANCH=true

# Git commit author
GIT_AUTHOR_NAME=Spec-MAS AI
GIT_AUTHOR_EMAIL=ai@specmas.dev

# ─────────────────────────────────────
# Optional: External Services
# ─────────────────────────────────────

# Supabase (for data storage)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key

# Vercel (for deployment)
# VERCEL_TOKEN=your-vercel-token

# GitHub (for PR automation)
# GITHUB_TOKEN=your-github-token
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  success('.env file created');

  console.log('\n' + colorize('Configuration saved!', 'green'));
  console.log('  File: .env');
  console.log('  Provider: ' + aiConfig.provider);
  console.log('  Model: ' + (aiConfig.provider === 'claude' ? aiConfig.claudeModel : aiConfig.openaiModel));
}

async function testInstallation() {
  console.log('\nTesting installation with a sample spec...\n');

  // Check if sample spec exists
  const sampleSpec = path.join(process.cwd(), 'specs', 'examples', 'security-critical-template.yaml');

  if (!fs.existsSync(sampleSpec)) {
    warning('Sample spec not found, skipping validation test');
    return;
  }

  const runTest = await question('Run validation test? (y/n): ');
  if (runTest.toLowerCase() !== 'y') {
    info('Skipping validation test');
    return;
  }

  console.log('\nRunning: npm run validate-spec specs/examples/security-critical-template.yaml\n');
  console.log(colorize('─'.repeat(70), 'dim'));

  try {
    execSync('npm run validate-spec specs/examples/security-critical-template.yaml', {
      stdio: 'inherit'
    });
    console.log(colorize('─'.repeat(70), 'dim'));
    success('Validation test passed!');
  } catch (e) {
    console.log(colorize('─'.repeat(70), 'dim'));
    warning('Validation test had issues (this is okay for setup)');
  }
}

function displayNextSteps(aiConfig) {
  console.log('\n' + colorize('🎉 Spec-MAS is ready to use!', 'bright'));
  console.log('\n' + colorize('Next Steps:', 'bright'));

  console.log('\n1. Create your first spec:');
  console.log(colorize('   cp specs/TEMPLATE-STARTUP.md specs/features/001-my-feature.md', 'dim'));
  console.log(colorize('   # Edit specs/features/001-my-feature.md with your feature details', 'dim'));

  console.log('\n2. Validate your spec:');
  console.log(colorize('   npm run validate-spec specs/features/001-my-feature.md', 'dim'));
  console.log(colorize('   # Target score: 70-80/100 for first spec', 'dim'));

  console.log('\n3. Generate tests (optional):');
  console.log(colorize('   npm run generate-tests specs/features/001-my-feature.md', 'dim'));

  console.log('\n4. Check implementation cost:');
  console.log(colorize('   npm run decompose-tasks specs/features/001-my-feature.md', 'dim'));

  console.log('\n5. Generate code:');
  console.log(colorize('   npm run implement-spec specs/features/001-my-feature.md', 'dim'));
  console.log(colorize('   # Or use dry-run to see what would be generated:', 'dim'));
  console.log(colorize('   npm run implement-spec specs/features/001-my-feature.md --dry-run', 'dim'));

  console.log('\n' + colorize('Useful Commands:', 'bright'));
  console.log('   npm run validate-spec <spec>   - Validate a spec');
  console.log('   npm run review-spec <spec>     - Run adversarial reviews');
  console.log('   npm run generate-tests <spec>  - Generate test scaffolds');
  console.log('   npm run implement-spec <spec>  - Generate code');
  console.log('   npm run metrics                - View cost metrics');

  console.log('\n' + colorize('Documentation:', 'bright'));
  console.log('   📖 Quick Start: STARTUP-QUICK-START.md');
  console.log('   📖 Template: specs/TEMPLATE-STARTUP.md');
  console.log('   📖 Architecture: ARCHITECTURE.md');
  console.log('   📖 Contributing: CONTRIBUTING.md');

  console.log('\n' + colorize('Configuration:', 'bright'));
  console.log('   ⚙️  AI Provider: ' + aiConfig.provider);
  console.log('   ⚙️  Config file: .env');
  console.log('   ⚙️  Edit .env to change settings');

  console.log('\n' + colorize('Estimated Costs:', 'bright'));
  if (aiConfig.provider === 'claude') {
    console.log('   💰 EASY feature: $2-5');
    console.log('   💰 MODERATE feature: $8-15');
    console.log('   💰 HIGH feature: $20-40');
    console.log('   💰 Monthly (10-20 features): $50-150');
  } else {
    console.log('   💰 Costs vary by OpenAI model and usage');
    console.log('   💰 Track spending in OpenAI dashboard');
  }

  console.log('\n' + colorize('Need Help?', 'bright'));
  console.log('   🐛 Issues: https://github.com/yourusername/Spec-MAS/issues');
  console.log('   💬 Discussions: https://github.com/yourusername/Spec-MAS/discussions');
  console.log('   📧 Email: support@specmas.dev (coming soon)');

  console.log('\n' + colorize('Happy building! 🚀', 'bright'));
  console.log('');
}

// Run the setup
main().catch((error) => {
  console.error('\n' + colorize('Setup failed:', 'red'));
  console.error(error);
  rl.close();
  process.exit(1);
});
