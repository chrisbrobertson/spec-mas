# Spec-MAS Implementation Plan: Crawl → Walk → Run

**Document Version:** 1.0  
**Last Updated:** 2025-10-18  
**Purpose:** Progressive implementation guide from simple to enterprise-scale

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Preparation](#phase-0-preparation-pre-crawl)
3. [Phase 1: CRAWL - Solo Developer](#phase-1-crawl---solo-developer)
4. [Phase 2: WALK - Small Team](#phase-2-walk---small-team)
5. [Phase 3: RUN - Enterprise Scale](#phase-3-run---enterprise-scale)
6. [Appendix: Quick Reference](#appendix-quick-reference)

---

## Overview

### Implementation Philosophy

Each phase is **independently valuable** and can be used in production. You're not building a throw-away prototype - you're building incrementally toward full capability.

```
CRAWL  → Working system for 1 developer
  ↓
WALK   → Extended for 2-5 person team
  ↓
RUN    → Scaled to enterprise (5-100+ people)
```

### Success Criteria by Phase

| Phase | Duration | Team Size | Complexity | Key Achievement |
|-------|----------|-----------|------------|-----------------|
| **Preparation** | 1-2 days | 1 | Setup | Environment ready |
| **CRAWL** | 1-2 weeks | 1 | EASY features | First AI-generated feature |
| **WALK** | 2-4 weeks | 2-5 | EASY-MODERATE | Team collaboration working |
| **RUN** | 2-3 months | 5-100+ | ALL | Enterprise orchestration |

### Decision Tree: Where Should You Start?

```
Are you working solo or with <3 people?
  ├─ YES → Start with CRAWL
  └─ NO → Do you have >5 engineers?
      ├─ YES → Skip to WALK, plan for RUN
      └─ NO → Start with WALK
```

---

## Phase 0: Preparation (Pre-Crawl)

**Goal:** Set up your development environment and validate prerequisites.

**Duration:** 1-2 days  
**Cost:** $0 (free tier) or ~$20 for API access

### 0.1 Prerequisites Checklist

```bash
# Required Tools
□ Git installed and configured
□ Node.js 18+ OR Python 3.9+
□ Code editor (VS Code recommended)
□ Terminal access (bash/zsh)
□ GitHub/GitLab account

# API Access
□ Anthropic API key (https://console.anthropic.com)
□ $20 credit loaded (enough for initial testing)

# Optional but Recommended
□ Docker installed
□ Basic understanding of markdown
□ Familiarity with command line
```

### 0.2 Environment Setup

```bash
# 1. Create project directory
mkdir my-specmas-project
cd my-specmas-project

# 2. Initialize git
git init
git checkout -b main

# 3. Create basic structure
mkdir -p specs/{features,architecture}
mkdir -p tests/{unit,integration}
mkdir -p src
mkdir -p .claude

# 4. Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.pyc
__pycache__/
.claude/cache/
reports/
EOF

# 5. Initialize package management
# For Node.js:
npm init -y

# OR for Python:
cat > requirements.txt << 'EOF'
pytest>=7.0.0
pyyaml>=6.0
markdown>=3.4.0
EOF
```

### 0.3 Install Core Tools

```bash
# Install Claude Agent SDK
npm install -g @anthropic-ai/claude-agent-sdk
# OR
pip install claude-agent-sdk

# Set up API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Verify installation
claude-agent --version
```

### 0.4 Create First Files

**Create: `.claude/settings.json`**
```json
{
  "permissionMode": "acceptEdits",
  "allowedTools": ["Read", "Write", "Bash"],
  "maxTurns": 20,
  "autoCompact": true
}
```

**Create: `memory/constitution.md`**
```markdown
# Project Coding Standards

## Principles
- Write tests first (TDD)
- Keep functions small (<50 lines)
- Use meaningful variable names
- Handle errors explicitly

## Tech Stack
- Language: [JavaScript/Python/etc.]
- Framework: [React/Express/etc.]
- Testing: [Jest/Pytest/etc.]
```

**Create: `specs/README.md`**
```markdown
# Specifications

This directory contains all feature specifications.

## Structure
- `features/` - Individual feature specs
- `architecture/` - System architecture docs

## Template
Use `specs/TEMPLATE.md` for new specifications.
```

### 0.5 Validation

```bash
# Test your setup
claude-agent query "What files are in this directory?"

# If this works, you're ready for CRAWL!
```

**Success Criteria:**
- ✅ All tools installed
- ✅ API key working
- ✅ Directory structure created
- ✅ Claude agent responds to queries

---

## Phase 1: CRAWL - Solo Developer

**Goal:** Implement one feature using AI agents, validate the pattern works.

**Duration:** 1-2 weeks  
**Team:** Just you  
**Cost:** ~$50-100 in API costs  
**Complexity:** EASY features only

### 1.1 What You'll Build

**Stack:**
```
You (Human)
    ↓
Specification (Markdown)
    ↓
Claude Agent SDK
    ↓
Tests + Implementation
```

**What You'll Learn:**
- How to write effective specifications
- How agents interpret and implement specs
- When agents succeed vs. when they need help
- How to review AI-generated code

### 1.2 Week 1: Your First Feature

#### Day 1: Write Your First Spec

**Choose a simple feature:**
- Add a form to collect user input
- Display a list with filtering
- Create a simple API endpoint
- Add validation to existing form

**Example: "Add User Profile Form"**

**Create: `specs/features/user-profile-form.md`**
```markdown
---
specmas: v3
kind: FeatureSpec
id: feat-001
name: User Profile Form
version: 0.1.0
owners:
  - name: Your Name
    email: you@example.com
complexity: EASY
maturity: 1
tags: [ui, form, user]
---

# Overview
Users need to be able to update their profile information.

**Out of Scope:**
- Profile picture upload (future feature)
- Social media links (future feature)

**Success Metrics:**
- Form submission completes in <2 seconds
- 90% of users complete profile on first attempt

# Functional Requirements

- FR-1: User can enter their full name
  - **Validation criteria:** Name is 2-50 characters
  
- FR-2: User can enter their email
  - **Validation criteria:** Valid email format (RFC 5322)
  
- FR-3: User can save changes
  - **Validation criteria:** Data persists after page refresh

# Non-Functional Requirements

- Performance: Form submission < 2 seconds
- Accessibility: All inputs have labels, keyboard navigable
- Mobile: Responsive design, works on 320px width

# Security

- Authentication: User must be logged in to access form
- Authorization: Users can only edit their own profile
- Data handling: No PII logged, encrypted in transit (HTTPS)
- Validation: Server-side validation for all inputs

# Acceptance Tests

- AT-1: User with valid data can save profile
- AT-2: User with invalid email sees error message
- AT-3: User without authentication is redirected to login
- AT-4: Form is accessible via keyboard only

# Glossary

- PII: Personally Identifiable Information (name, email)
- RFC 5322: Email address format standard
```

**Time:** 2-4 hours

#### Day 2: Generate Tests

```bash
# Create a simple test generator script
cat > generate-tests.js << 'EOF'
const fs = require('fs');
const yaml = require('js-yaml');

// Read spec
const spec = fs.readFileSync('specs/features/user-profile-form.md', 'utf8');

// Extract acceptance tests (simple parser)
const atRegex = /- AT-\d+: (.+)/g;
const tests = [...spec.matchAll(atRegex)].map(m => m[1]);

// Generate test file
const testCode = `
describe('User Profile Form', () => {
${tests.map((test, i) => `
  test('AT-${i+1}: ${test}', () => {
    // TODO: Implement test
    expect(true).toBe(false);
  });
`).join('')}
});
`;

fs.writeFileSync('tests/unit/user-profile-form.test.js', testCode);
console.log('Generated tests:', tests.length);
EOF

node generate-tests.js
```

**Alternative: Ask Claude to generate tests**
```bash
claude-agent query "Read specs/features/user-profile-form.md and generate Jest tests in tests/unit/ covering all acceptance criteria"
```

**Time:** 1-2 hours

#### Day 3-4: Agent Implementation

```bash
# Start development session
claude-agent develop --spec specs/features/user-profile-form.md

# Claude will:
# 1. Read the spec
# 2. Read existing codebase
# 3. Generate implementation
# 4. Run tests
# 5. Fix failures
# 6. Report completion
```

**What to expect:**
- Agent may ask clarifying questions
- Some tests may fail initially (agent will retry)
- You may need to provide guidance on integration points
- Review each file change carefully

**Time:** 4-8 hours (including review)

#### Day 5: Human Review & Refinement

```bash
# Review changes
git diff

# Things to check:
# - Does it match the spec?
# - Is the code readable?
# - Are there any security issues?
# - Does it follow project conventions?

# Make manual adjustments
code src/components/UserProfileForm.js

# Run tests
npm test

# Commit when satisfied
git add .
git commit -m "feat: add user profile form per spec feat-001

SPEC: specs/features/user-profile-form.md v0.1.0
AGENT: claude-agent-sdk
APPROVER: your@email.com
APPROVAL_DATE: 2025-10-18"
```

**Time:** 2-4 hours

### 1.3 Week 2: Refine the Process

#### Improve Your Spec Template

**Create: `specs/TEMPLATE.md`**
```markdown
---
specmas: v3
kind: FeatureSpec
id: feat-XXX
name: Feature Name
version: 0.1.0
owners:
  - name: Your Name
    email: you@example.com
complexity: EASY
maturity: 3
tags: [tag1, tag2]
---

# Overview
[Problem statement]

**Out of Scope:** [What we're NOT building]

**Success Metrics:** [How we measure success]

# Functional Requirements

- FR-1: [Requirement]
  - **Validation criteria:** [How to verify]

# Non-Functional Requirements

- Performance: [Specific targets]
- Security: [Security considerations]

# Acceptance Tests

- AT-1: [Testable criterion]

# Glossary

- [Term]: [Definition]
```

#### Build 2-3 More Features

**Feature ideas:**
1. User settings page (EASY)
2. Search functionality (EASY)
3. Data export (EASY-MODERATE)

**For each:**
1. Write spec (use template)
2. Generate tests
3. Run agent
4. Review & commit
5. Learn from mistakes

#### Create Your First "Constitution"

**Update: `memory/constitution.md`**
```markdown
# Project Coding Standards

## What I've Learned

### Specs That Work Well
- Specific validation criteria (not "validate input")
- Numeric targets (not "should be fast")
- Examples of good and bad inputs

### Specs That Don't Work
- Vague requirements ("user-friendly")
- Unstated assumptions
- Missing error scenarios

## Patterns to Use

### Form Validation
```typescript
// Always use this pattern
function validateEmail(email: string): ValidationResult {
  if (!email) return { valid: false, error: 'Email required' };
  if (!RFC5322_REGEX.test(email)) return { valid: false, error: 'Invalid email' };
  return { valid: true };
}
```

### Error Handling
- Never silent failures
- Always log errors
- User-friendly messages
```

### 1.4 CRAWL Success Criteria

**You've completed CRAWL when:**

✅ You've implemented 3+ features using specs + agents  
✅ You understand what makes a good spec  
✅ You can review AI-generated code effectively  
✅ Your tests are passing consistently  
✅ You have a working constitution/standards doc  
✅ You're saving 30-50% of implementation time  

**Metrics to Track:**
- Time from spec to implementation (target: <1 day per EASY feature)
- Test coverage (target: >80%)
- Agent success rate (target: >70% acceptance without major changes)
- Manual intervention frequency (target: <30% of tasks)

### 1.5 Common CRAWL Challenges

**Challenge 1: "Agent doesn't understand my spec"**
```
Solution: Add examples
❌ "Validate input properly"
✅ "Reject emails without @ symbol. Example: 'test' is invalid, 'test@example.com' is valid"
```

**Challenge 2: "Agent generates bad code"**
```
Solution: Update constitution with patterns
Add anti-patterns: "Never use eval()"
Add good patterns: "Always use parameterized queries"
```

**Challenge 3: "Tests keep failing"**
```
Solution: Start simpler
Break feature into smaller specs
Each spec should be implementable in <4 hours
```

**Challenge 4: "Too much manual cleanup"**
```
Solution: Improve spec quality
Add architectural constraints to spec
Reference existing patterns by name
```

### 1.6 When to Move to WALK

**Move to WALK when:**
- You're comfortable writing Level 3 specs
- Agent acceptance rate is >70%
- You want to collaborate with others
- You're ready for MODERATE complexity features
- You want more automation

**Don't move to WALK if:**
- Still struggling with EASY features
- Agent success rate <50%
- Haven't built 3+ features yet
- Need to establish more patterns first

---

## Phase 2: WALK - Small Team

**Goal:** Scale to 2-5 people with shared specifications and multi-agent workflow.

**Duration:** 2-4 weeks  
**Team:** 2-5 people  
**Cost:** ~$200-500/month  
**Complexity:** EASY and MODERATE features

### 2.1 What You'll Build

**Stack:**
```
Team (2-5 people)
    ↓
Shared Specs (Git)
    ↓
Multiple Agent Types
    ↓
Coordinated Development
```

**New Capabilities:**
- Multiple people working on same codebase
- Specialized agents (dev, test, review)
- Specification review process
- Validation gates
- Basic orchestration

### 2.2 Week 1: Team Foundation

#### Day 1: Team Setup

**1. Establish Roles:**
```markdown
# Team Structure

## Primary Roles
- Spec Owner (1 person): Writes and maintains specs
- Implementer (1-2 people): Reviews AI output, handles complex logic
- QA (1 person): Reviews tests and validation

## Backup Roles
Everyone should be able to:
- Write basic specs
- Review agent output
- Run validation
```

**2. Create Shared Repository:**
```bash
# If not already done
git remote add origin https://github.com/yourteam/project.git
git push -u origin main

# Set up branch protection
# Via GitHub/GitLab:
# - Require PR reviews (1 person minimum)
# - Require status checks (tests must pass)
# - Require spec validation
```

**3. Team Convention Document:**

**Create: `.github/CONTRIBUTING.md`**
```markdown
# Contributing to [Project]

## Workflow

1. **Spec First**: Never code without an approved spec
2. **Branch Naming**: `feature/[spec-id]-[short-name]`
3. **PR Template**: See `.github/pull_request_template.md`
4. **Review**: All PRs require 1 approval

## Spec Process

1. Draft spec in `specs/features/[name].md`
2. Create PR for spec review
3. Team reviews and approves spec
4. Only then: implement feature

## Agent Usage

- Dev Agent: For implementation
- Test Agent: For test generation
- Review Agent: For code review

## Commit Message Format

```
feat: [short description]

SPEC: specs/features/[name].md v[version]
AGENT: [agent-name]
APPROVER: [email]
APPROVAL_DATE: [date]
```
```

#### Day 2-3: Install Validation Framework

**1. Create Validator Script:**

**Create: `scripts/validate-spec.js`**
```javascript
#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

function validateSpec(specPath) {
  const content = fs.readFileSync(specPath, 'utf8');
  const errors = [];
  const warnings = [];
  
  // G1: Structure
  if (!content.includes('---\n')) {
    errors.push('Missing YAML front matter');
  }
  
  const frontMatter = content.match(/---\n([\s\S]*?)\n---/);
  if (frontMatter) {
    const meta = yaml.load(frontMatter[1]);
    
    // Check required fields
    const required = ['specmas', 'kind', 'id', 'name', 'version', 'complexity', 'maturity'];
    required.forEach(field => {
      if (!meta[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Check complexity vs maturity
    const minMaturity = {
      'EASY': 3,
      'MODERATE': 4,
      'HIGH': 5
    };
    
    if (meta.complexity && meta.maturity < minMaturity[meta.complexity]) {
      errors.push(`${meta.complexity} complexity requires maturity level ${minMaturity[meta.complexity]}, got ${meta.maturity}`);
    }
  }
  
  // G2: Semantics
  const frRegex = /- FR-\d+:/g;
  const frs = content.match(frRegex);
  if (!frs || frs.length === 0) {
    errors.push('No functional requirements found (FR-1, FR-2, etc.)');
  }
  
  // Check for validation criteria
  if (frs) {
    frs.forEach(fr => {
      const frSection = content.substring(content.indexOf(fr));
      if (!frSection.includes('Validation criteria:')) {
        warnings.push(`${fr} missing validation criteria`);
      }
    });
  }
  
  // Check for vague terms
  const vague = ['fast', 'slow', 'secure', 'user-friendly', 'scalable', 'soon'];
  vague.forEach(term => {
    if (content.toLowerCase().includes(term)) {
      warnings.push(`Vague term found: "${term}". Add to glossary with specific meaning.`);
    }
  });
  
  // G3: Traceability
  const atRegex = /- AT-\d+:/g;
  const ats = content.match(atRegex);
  if (!ats || ats.length === 0) {
    errors.push('No acceptance tests found (AT-1, AT-2, etc.)');
  }
  
  // Report
  console.log('\n=== Spec Validation Report ===\n');
  console.log(`File: ${specPath}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);
  
  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(e => console.log(`  - ${e}`));
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log();
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validation passed!');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run
const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: validate-spec.js <path-to-spec.md>');
  process.exit(1);
}

validateSpec(specPath);
```

**2. Add to package.json:**
```json
{
  "scripts": {
    "validate-spec": "node scripts/validate-spec.js",
    "validate-all": "find specs -name '*.md' -exec node scripts/validate-spec.js {} \\;"
  }
}
```

**3. Add GitHub Action:**

**Create: `.github/workflows/validate-specs.yml`**
```yaml
name: Validate Specifications

on:
  pull_request:
    paths:
      - 'specs/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Validate Changed Specs
        run: |
          # Get changed spec files
          git diff --name-only origin/main...HEAD | grep '^specs/.*\.md$' | while read spec; do
            echo "Validating $spec"
            npm run validate-spec "$spec"
          done
```

#### Day 4-5: First Team Feature

**1. Choose a MODERATE complexity feature:**
- User authentication flow
- Data export with multiple formats
- Integration with external API
- Multi-step workflow

**2. Collaborative Spec Writing:**
```bash
# Spec Owner creates draft
git checkout -b spec/auth-flow
code specs/features/auth-flow.md

# Write Level 4 spec (MODERATE requirement)
# - All Level 3 content
# - Architecture patterns section
# - Observability requirements
# - Compliance considerations

git add specs/features/auth-flow.md
git commit -m "spec: add authentication flow (draft)"
git push -u origin spec/auth-flow

# Create PR for spec review
# Team comments and suggests improvements
# Iterate until approved
```

**3. Parallel Implementation:**
```bash
# After spec approved, create implementation branch
git checkout -b feature/auth-flow-impl main
git merge spec/auth-flow

# Assign to team members:
# - Person A: Backend auth logic
# - Person B: Frontend login form
# - Person C: Test suite

# Each person runs agent on their portion
claude-agent develop --spec specs/features/auth-flow.md --focus backend
claude-agent develop --spec specs/features/auth-flow.md --focus frontend
claude-agent develop --spec specs/features/auth-flow.md --focus tests

# Coordinate via git branches
git checkout -b feature/auth-backend
git checkout -b feature/auth-frontend
git checkout -b feature/auth-tests
```

### 2.3 Week 2-3: Multiple Agent Types

#### Create Specialized Agents

**1. Test Agent Definition:**

**Create: `.claude/agents/test-agent.md`**
```markdown
# Test Generation Agent

You are a test specialist. Your job is to generate comprehensive test suites from specifications.

## Responsibilities
- Read specification thoroughly
- Generate unit tests for all FRs
- Generate integration tests for workflows
- Generate edge case tests
- Ensure >80% coverage

## Test Structure
- Use describe() for features
- Use test() for acceptance criteria
- Include setup/teardown
- Mock external dependencies

## Quality Standards
- Every FR must have ≥1 test
- Every AT must be tested
- Tests must be deterministic
- Use meaningful descriptions
```

**2. Review Agent Definition:**

**Create: `.claude/agents/review-agent.md`**
```markdown
# Code Review Agent

You are a code reviewer. Your job is to review implementations against specifications.

## Review Checklist
- Does code match specification?
- Are all FRs implemented?
- Do all tests pass?
- Is code readable and maintainable?
- Are there security issues?
- Does it follow project conventions?

## Review Format
Provide feedback in this format:

**Summary:** [Pass/Needs Changes/Reject]

**Strengths:**
- [What was done well]

**Issues:**
- [P0] Critical issues (must fix)
- [P1] Important issues (should fix)
- [P2] Nice to have (optional)

**Approval:** [Yes/No]
```

**3. Using Specialized Agents:**
```bash
# Generate tests
claude-agent develop --agent test-agent --spec specs/features/auth-flow.md

# Review implementation
claude-agent review --agent review-agent --spec specs/features/auth-flow.md --code src/auth/
```

#### Add Multi-Agent Coordination

**Create: `scripts/run-workflow.sh`**
```bash
#!/bin/bash

SPEC=$1

if [ -z "$SPEC" ]; then
  echo "Usage: run-workflow.sh <spec-path>"
  exit 1
fi

echo "=== Running Multi-Agent Workflow ==="
echo "Spec: $SPEC"
echo

# Step 1: Validate spec
echo "1. Validating specification..."
npm run validate-spec "$SPEC" || exit 1
echo "✓ Spec valid"
echo

# Step 2: Generate tests
echo "2. Generating tests..."
claude-agent develop --agent test-agent --spec "$SPEC"
echo "✓ Tests generated"
echo

# Step 3: Implement feature
echo "3. Implementing feature..."
claude-agent develop --spec "$SPEC"
echo "✓ Implementation complete"
echo

# Step 4: Run tests
echo "4. Running tests..."
npm test || exit 1
echo "✓ All tests passed"
echo

# Step 5: Review code
echo "5. Reviewing code..."
claude-agent review --agent review-agent --spec "$SPEC"
echo "✓ Review complete"
echo

echo "=== Workflow Complete ==="
echo "Ready for human review"
```

### 2.4 Week 4: Advanced Team Patterns

#### Implement Spec Complexity Assessment

**Create: `scripts/assess-complexity.js`**
```javascript
#!/usr/bin/env node

const fs = require('fs');

function assessComplexity(specPath) {
  const content = fs.readFileSync(specPath, 'utf8').toLowerCase();
  
  const easyIndicators = [
    'crud', 'form', 'list', 'display', 'basic',
    'simple', 'ui', 'style', 'validation'
  ];
  
  const moderateIndicators = [
    'integration', 'workflow', 'api', 'process',
    'calculate', 'transform', 'report', 'dashboard',
    'multi-step', 'notification'
  ];
  
  const highIndicators = [
    'security', 'authentication', 'architecture',
    'performance', 'real-time', 'compliance',
    'encryption', 'distributed', 'migration',
    'payment', 'healthcare', 'financial'
  ];
  
  let score = { easy: 0, moderate: 0, high: 0 };
  
  highIndicators.forEach(term => {
    if (content.includes(term)) score.high++;
  });
  
  moderateIndicators.forEach(term => {
    if (content.includes(term)) score.moderate++;
  });
  
  easyIndicators.forEach(term => {
    if (content.includes(term)) score.easy++;
  });
  
  let complexity;
  if (score.high > 0) {
    complexity = 'HIGH';
  } else if (score.moderate > 0) {
    complexity = 'MODERATE';
  } else {
    complexity = 'EASY';
  }
  
  console.log('Complexity Assessment:');
  console.log(`  Easy indicators: ${score.easy}`);
  console.log(`  Moderate indicators: ${score.moderate}`);
  console.log(`  High indicators: ${score.high}`);
  console.log(`  Suggested complexity: ${complexity}`);
  
  const minMaturity = { EASY: 3, MODERATE: 4, HIGH: 5 };
  console.log(`  Required maturity level: ${minMaturity[complexity]}`);
}

assessComplexity(process.argv[2]);
```

#### Add Metrics Collection

**Create: `scripts/metrics.js`**
```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function collectMetrics() {
  const metrics = {
    specs: {
      total: 0,
      byComplexity: { EASY: 0, MODERATE: 0, HIGH: 0 },
      byMaturity: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    implementation: {
      avgTimeToImplement: 0,
      agentSuccessRate: 0,
      testCoverage: 0
    }
  };
  
  // Count specs
  const specs = execSync('find specs -name "*.md" -type f').toString().trim().split('\n');
  metrics.specs.total = specs.length;
  
  // Analyze each spec
  specs.forEach(specPath => {
    const content = fs.readFileSync(specPath, 'utf8');
    const frontMatter = content.match(/---\n([\s\S]*?)\n---/);
    
    if (frontMatter) {
      const yaml = require('js-yaml');
      const meta = yaml.load(frontMatter[1]);
      
      if (meta.complexity) {
        metrics.specs.byComplexity[meta.complexity]++;
      }
      
      if (meta.maturity) {
        metrics.specs.byMaturity[meta.maturity]++;
      }
    }
  });
  
  // Test coverage (example for Jest)
  try {
    const coverage = execSync('npm test -- --coverage --silent').toString();
    const match = coverage.match(/All files.*?(\d+\.?\d*)/);
    if (match) {
      metrics.implementation.testCoverage = parseFloat(match[1]);
    }
  } catch (e) {
    metrics.implementation.testCoverage = 0;
  }
  
  console.log('=== Spec-MAS Metrics ===\n');
  console.log('Specifications:');
  console.log(`  Total: ${metrics.specs.total}`);
  console.log(`  By Complexity:`);
  console.log(`    EASY: ${metrics.specs.byComplexity.EASY}`);
  console.log(`    MODERATE: ${metrics.specs.byComplexity.MODERATE}`);
  console.log(`    HIGH: ${metrics.specs.byComplexity.HIGH}`);
  console.log(`  By Maturity:`);
  Object.keys(metrics.specs.byMaturity).forEach(level => {
    console.log(`    Level ${level}: ${metrics.specs.byMaturity[level]}`);
  });
  console.log(`\nImplementation:`);
  console.log(`  Test Coverage: ${metrics.implementation.testCoverage}%`);
  
  // Save metrics
  fs.writeFileSync('.specmas/metrics.json', JSON.stringify(metrics, null, 2));
}

collectMetrics();
```

### 2.5 WALK Success Criteria

**You've completed WALK when:**

✅ 2-5 people collaborating effectively  
✅ Specification review process working  
✅ Multiple agent types in use (dev, test, review)  
✅ Validation gates automated in CI/CD  
✅ Built 5+ MODERATE complexity features  
✅ Team saving 50-60% of implementation time  
✅ Test coverage consistently >80%  

**Metrics to Track:**
- Specs per week (target: 3-5 for MODERATE)
- PR review time (target: <4 hours)
- Agent acceptance rate (target: >80%)
- Merge failures due to spec issues (target: <10%)
- Team satisfaction (target: 4/5)

### 2.6 When to Move to RUN

**Move to RUN when:**
- Team is >5 people OR growing rapidly
- Working on multiple projects/services simultaneously
- Need true parallel development (not just parallel PRs)
- Have HIGH complexity features regularly
- Want advanced orchestration and observability

**Don't move to RUN if:**
- Team is happy with current workflow
- MODERATE complexity is sufficient
- Don't have infrastructure resources
- Cost is a major constraint

---

## Phase 3: RUN - Enterprise Scale

**Goal:** Full enterprise deployment with orchestrated multi-agent system.

**Duration:** 2-3 months  
**Team:** 5-100+ people  
**Cost:** $2,000-10,000/month  
**Complexity:** All levels including HIGH

### 3.1 What You'll Build

**Full Stack:**
```
Multiple Teams (5-100+ people)
    ↓
Shared Specs (Git) + Governance
    ↓
LangGraph Orchestration Server
    ↓
Parallel Multi-Agent Execution
    ↓
MCP Tool Integration
    ↓
Enterprise Observability
    ↓
Distributed Implementation
```

**New Capabilities:**
- True parallel agent execution
- Workflow orchestration
- Cross-team coordination
- Advanced state management
- Full observability
- Compliance features

### 3.2 Month 1: Infrastructure

#### Week 1: Planning & Design

**1. Architecture Decision:**
```bash
# Create architecture documentation
mkdir -p docs/architecture

cat > docs/architecture/deployment-plan.md << 'EOF'
# Deployment Plan

## Infrastructure Components

### Core Services
- LangGraph Orchestration Server (Kubernetes)
- Redis Cluster (State Management)
- PostgreSQL (Persistence)
- MCP Server Cluster (Tool Access)

### Observability
- LangSmith (LangGraph tracing)
- Prometheus + Grafana (Metrics)
- ELK Stack (Logging)

### Networking
- Load Balancer (HA)
- Service Mesh (Istio)
- API Gateway

## Scaling Strategy
- Horizontal: Add orchestrator replicas
- Vertical: Scale MCP servers
- Geographic: Multi-region deployment

## Cost Estimate
- Infrastructure: $1,500/month
- API Costs: $3,000-8,000/month
- Observability: $500/month
- Total: ~$5,000-10,000/month
EOF
```

**2. Team Organization:**
```markdown
# Enterprise Team Structure

## Platform Team (3-5 people)
- Maintain Spec-MAS infrastructure
- Develop shared tooling
- Support other teams

## Feature Teams (5-10 people each)
- Product Owner (spec ownership)
- Architects (architecture review)
- Engineers (implementation review)
- QA (validation)

## Governance
- Spec Review Board (weekly)
- Architecture Review Board (weekly)
- Security Review Board (as needed)
```

#### Week 2-3: Deploy Infrastructure

**1. Kubernetes Deployment:**

**Create: `k8s/langgraph-deployment.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: specmas-orchestrator
  namespace: specmas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: specmas-orchestrator
  template:
    metadata:
      labels:
        app: specmas-orchestrator
    spec:
      containers:
      - name: langgraph
        image: langgraph/langgraph:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: specmas-secrets
              key: anthropic-key
        - name: REDIS_URL
          value: redis://redis-cluster:6379
        - name: POSTGRES_URL
          valueFrom:
            secretKeyRef:
              name: specmas-secrets
              key: postgres-url
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
        ports:
        - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: specmas-orchestrator
  namespace: specmas
spec:
  selector:
    app: specmas-orchestrator
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**2. Deploy Redis Cluster:**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: specmas
spec:
  serviceName: redis
  replicas: 6
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

**3. Deploy PostgreSQL:**
```bash
# Use managed service (AWS RDS, Google Cloud SQL, etc.)
# Or deploy with operator
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/master/manifests/postgres-operator.yaml

# Create database
cat > postgres-specmas.yaml << EOF
apiVersion: "acid.zalan.do/v1"
kind: postgresql
metadata:
  name: specmas-db
  namespace: specmas
spec:
  teamId: "specmas"
  volume:
    size: 100Gi
  numberOfInstances: 3
  users:
    specmas: []
  databases:
    specmas: specmas
  postgresql:
    version: "14"
EOF

kubectl apply -f postgres-specmas.yaml
```

#### Week 4: LangGraph Setup

**1. Create Workflow Definitions:**

**Create: `langgraph/workflows/feature_development.py`**
```python
from langgraph.graph import StateGraph, Send, END
from typing import TypedDict, List, Dict, Annotated
import operator

class SpecMASState(TypedDict):
    spec_content: str
    spec_sha: str
    spec_id: str
    plan: Dict
    tasks: List[Dict]
    implementations: Annotated[List[Dict], operator.add]
    test_results: Dict
    validation_status: str
    findings: Annotated[List[Dict], operator.add]
    approval_status: str

def parse_specification(state: SpecMASState) -> SpecMASState:
    """Parse and validate spec structure"""
    print(f"Parsing spec: {state['spec_id']}")
    
    # Extract front matter, sections, etc.
    # (Implementation details)
    
    return {
        **state,
        "validation_status": "parsed"
    }

def validate_specification(state: SpecMASState) -> SpecMASState:
    """Run validation gates G1-G4"""
    print(f"Validating spec against gates")
    
    # Run gate validation
    # (Implementation details)
    
    return {
        **state,
        "validation_status": "validated"
    }

def analyze_requirements(state: SpecMASState) -> SpecMASState:
    """Analyze requirements for completeness"""
    print(f"Analyzing requirements")
    
    # Use Claude to analyze
    # (Implementation details)
    
    return state

def decompose_work(state: SpecMASState) -> SpecMASState:
    """Break spec into parallel tasks"""
    print(f"Decomposing work into tasks")
    
    tasks = [
        {"type": "backend", "component": "auth", "priority": 1},
        {"type": "frontend", "component": "login", "priority": 1},
        {"type": "tests", "component": "integration", "priority": 2}
    ]
    
    return {
        **state,
        "tasks": tasks,
        "plan": {"total_tasks": len(tasks)}
    }

def develop_backend(state: SpecMASState) -> Dict:
    """Backend development agent"""
    print(f"Backend agent working on task")
    
    # Use Claude Agent SDK
    # (Implementation details)
    
    return {
        "implementations": [{
            "agent": "backend",
            "files": ["src/auth.ts"],
            "status": "complete"
        }]
    }

def develop_frontend(state: SpecMASState) -> Dict:
    """Frontend development agent"""
    print(f"Frontend agent working on task")
    
    return {
        "implementations": [{
            "agent": "frontend",
            "files": ["src/LoginForm.tsx"],
            "status": "complete"
        }]
    }

def run_tests(state: SpecMASState) -> SpecMASState:
    """Execute test suite"""
    print(f"Running tests")
    
    # Run tests
    # (Implementation details)
    
    return {
        **state,
        "test_results": {
            "passed": 24,
            "failed": 0,
            "coverage": 85
        }
    }

def route_on_tests(state: SpecMASState) -> str:
    """Route based on test results"""
    if state["test_results"]["failed"] == 0:
        return "pass"
    else:
        return "fail"

def create_workflow():
    workflow = StateGraph(SpecMASState)
    
    # Planning nodes
    workflow.add_node("parse", parse_specification)
    workflow.add_node("validate", validate_specification)
    workflow.add_node("analyze", analyze_requirements)
    workflow.add_node("decompose", decompose_work)
    
    # Development nodes
    workflow.add_node("dev_backend", develop_backend)
    workflow.add_node("dev_frontend", develop_frontend)
    
    # Validation nodes
    workflow.add_node("test", run_tests)
    
    # Planning flow
    workflow.add_edge("parse", "validate")
    workflow.add_edge("validate", "analyze")
    workflow.add_edge("analyze", "decompose")
    
    # Parallel development
    workflow.add_conditional_edges(
        "decompose",
        lambda state: [
            Send("dev_backend", state),
            Send("dev_frontend", state)
        ]
    )
    
    workflow.add_edge("dev_backend", "test")
    workflow.add_edge("dev_frontend", "test")
    
    # Test routing
    workflow.add_conditional_edges(
        "test",
        route_on_tests,
        {
            "pass": END,
            "fail": "decompose"
        }
    )
    
    workflow.set_entry_point("parse")
    
    return workflow.compile()

if __name__ == "__main__":
    workflow = create_workflow()
    
    # Test run
    result = workflow.invoke({
        "spec_content": "...",
        "spec_sha": "abc123",
        "spec_id": "feat-001",
        "plan": {},
        "tasks": [],
        "implementations": [],
        "test_results": {},
        "validation_status": "",
        "findings": [],
        "approval_status": "pending"
    })
    
    print(f"Workflow result: {result}")
```

**2. Deploy Workflow:**
```bash
# Build Docker image
docker build -t specmas/langgraph-workflow:v1 -f langgraph/Dockerfile .

# Push to registry
docker push specmas/langgraph-workflow:v1

# Deploy to Kubernetes
kubectl apply -f k8s/langgraph-deployment.yaml
```

### 3.3 Month 2: MCP Integration

#### Week 1-2: Deploy MCP Servers

**1. File System Server:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-filesystem
  namespace: specmas
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: mcp-fs
        image: modelcontextprotocol/server-filesystem:latest
        env:
        - name: ALLOWED_PATHS
          value: "/workspace,/specs"
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        persistentVolumeClaim:
          claimName: workspace-pvc
```

**2. Git Server:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-git
  namespace: specmas
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: mcp-git
        image: specmas/mcp-git-server:latest
        env:
        - name: GIT_TOKEN
          valueFrom:
            secretKeyRef:
              name: specmas-secrets
              key: git-token
```

**3. Database Server:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-postgres
  namespace: specmas
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: mcp-db
        image: modelcontextprotocol/server-postgres:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: specmas-secrets
              key: postgres-url
```

#### Week 3-4: Agent Configuration

**Create: `config/agent-config.yaml`**
```yaml
agents:
  requirements_analyzer:
    model: claude-opus-4
    temperature: 0.3
    max_tokens: 4096
    tools:
      - filesystem
      - git
    
  architecture_validator:
    model: claude-opus-4
    temperature: 0.2
    max_tokens: 4096
    tools:
      - filesystem
      - git
      - documentation
  
  dev_backend:
    model: gpt-4o
    temperature: 0.5
    max_tokens: 8192
    tools:
      - filesystem
      - git
      - database
      - test_framework
    count: 5  # Deploy 5 instances
  
  dev_frontend:
    model: claude-sonnet-4
    temperature: 0.5
    max_tokens: 8192
    tools:
      - filesystem
      - git
      - test_framework
    count: 3  # Deploy 3 instances
  
  qa_validator:
    model: gemini-pro
    temperature: 0.3
    max_tokens: 4096
    tools:
      - filesystem
      - git
      - test_framework
    count: 2
  
  security_auditor:
    model: claude-opus-4
    temperature: 0.2
    max_tokens: 4096
    tools:
      - filesystem
      - git
      - security_scanner
```

### 3.4 Month 3: Observability & Governance

#### Week 1-2: Observability Setup

**1. LangSmith Integration:**
```python
from langsmith import Client

client = Client(api_key=os.getenv("LANGSMITH_API_KEY"))

# Trace workflow execution
with client.trace("feature_development", metadata={"spec_id": "feat-001"}):
    result = workflow.invoke(state)
```

**2. Prometheus Metrics:**
```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
spec_validations = Counter('specmas_spec_validations_total', 'Total spec validations')
agent_tasks = Counter('specmas_agent_tasks_total', 'Agent tasks', ['agent_type', 'status'])
task_duration = Histogram('specmas_task_duration_seconds', 'Task duration', ['agent_type'])
active_agents = Gauge('specmas_active_agents', 'Currently active agents', ['agent_type'])

# Expose metrics endpoint
from prometheus_client import start_http_server
start_http_server(9090)
```

**3. Grafana Dashboards:**
```json
{
  "dashboard": {
    "title": "Spec-MAS Operations",
    "panels": [
      {
        "title": "Agent Task Success Rate",
        "targets": [
          {
            "expr": "rate(specmas_agent_tasks_total{status=\"success\"}[5m]) / rate(specmas_agent_tasks_total[5m])"
          }
        ]
      },
      {
        "title": "Active Agents by Type",
        "targets": [
          {
            "expr": "specmas_active_agents"
          }
        ]
      },
      {
        "title": "Average Task Duration",
        "targets": [
          {
            "expr": "rate(specmas_task_duration_seconds_sum[5m]) / rate(specmas_task_duration_seconds_count[5m])"
          }
        ]
      }
    ]
  }
}
```

#### Week 3: Governance Framework

**1. Spec Review Board:**
```markdown
# Spec Review Board Charter

## Purpose
Ensure all specifications meet quality standards before implementation.

## Membership
- 1 Product Representative
- 1 Architecture Representative
- 1 Security Representative
- Rotating Engineer (changes monthly)

## Meeting Schedule
- Weekly on Thursdays, 1 hour
- Async reviews via GitHub for simple specs

## Review Criteria
- [ ] Complexity correctly assessed
- [ ] Maturity level appropriate
- [ ] All required sections complete
- [ ] Validation gates passed
- [ ] No CRITICAL adversarial findings
- [ ] Technical feasibility confirmed

## Decision Process
- Approval requires 3/4 votes
- Security veto on security-critical specs
- Architect veto on HIGH complexity specs
```

**2. Architecture Review Board:**
```markdown
# Architecture Review Board Charter

## Purpose
Ensure architectural consistency across all teams.

## Scope
- Review all MODERATE+ complexity specs
- Approve architecture patterns
- Maintain architecture standards
- Review cross-team integration points

## Review Triggers
- New HIGH complexity spec
- Changes to core architecture
- New architectural patterns
- Cross-service integration
```

#### Week 4: Documentation & Training

**1. Create Documentation Portal:**
```bash
# Use Docusaurus or similar
npx create-docusaurus@latest specmas-docs classic

# Structure:
specmas-docs/
├── docs/
│   ├── getting-started/
│   │   ├── quickstart.md
│   │   ├── your-first-spec.md
│   │   └── team-setup.md
│   ├── guides/
│   │   ├── writing-specs.md
│   │   ├── using-agents.md
│   │   └── reviewing-code.md
│   ├── reference/
│   │   ├── spec-format.md
│   │   ├── validation-gates.md
│   │   └── api-docs.md
│   └── architecture/
│       └── system-design.md
```

**2. Training Program:**
```markdown
# Training Program

## Week 1: Spec Writing
- What makes a good spec
- Maturity levels explained
- Complexity assessment
- Hands-on: Write 3 specs

## Week 2: Working with Agents
- Agent capabilities and limitations
- Running agents effectively
- Reviewing AI-generated code
- Hands-on: Implement 2 features

## Week 3: Team Collaboration
- Spec review process
- Multi-agent coordination
- Git workflow
- Hands-on: Team exercise

## Week 4: Advanced Topics
- HIGH complexity features
- Architecture patterns
- Debugging agent issues
- Observability tools
```

### 3.5 RUN Success Criteria

**You've completed RUN when:**

✅ 5+ teams using the platform  
✅ True parallel development working  
✅ LangGraph orchestration deployed  
✅ Full observability in place  
✅ Governance processes established  
✅ Documentation comprehensive  
✅ Training program active  
✅ Building HIGH complexity features successfully  
✅ Team saving 60-70% of implementation time  

**Enterprise Metrics:**
- Specs per team per sprint (target: 5-8 for MODERATE)
- Deployment frequency (target: daily)
- Agent success rate (target: >85%)
- Mean time to implement (target: <2 days for MODERATE)
- Cross-team coordination efficiency (target: <10% overhead)
- Platform uptime (target: 99.9%)

---

## Appendix: Quick Reference

### Quick Decision Matrix

| You Are | Start Here | Duration | Cost/Month |
|---------|-----------|----------|-----------|
| Solo developer | CRAWL | 1-2 weeks | $50-100 |
| 2-3 person startup | CRAWL | 1-2 weeks | $100-200 |
| 4-5 person team | WALK | 2-4 weeks | $200-500 |
| 10-20 person team | WALK → RUN | 2-3 months | $500-2000 |
| 20+ person org | RUN (but pilot with WALK) | 3-6 months | $2000-10000 |

### Phase Comparison

| Feature | CRAWL | WALK | RUN |
|---------|-------|------|-----|
| Team Size | 1 | 2-5 | 5-100+ |
| Orchestration | None | Scripts | LangGraph |
| Agent Types | 1-2 | 3-5 | 10+ |
| Parallel Execution | No | Limited | Full |
| State Management | Git | Git + local | Redis cluster |
| Observability | Logs | Logs + metrics | Full platform |
| MCP Integration | Optional | Optional | Required |
| Infrastructure | Local | Local/Cloud | Cloud |
| Setup Time | Days | Weeks | Months |
| Complexity Support | EASY | EASY-MODERATE | ALL |

### Common Pitfalls by Phase

**CRAWL Pitfalls:**
- Specs too vague → Add examples
- Skipping validation → Use validation script
- Not reviewing AI output → Always review carefully
- Jumping to MODERATE complexity too soon

**WALK Pitfalls:**
- Poor team communication → Establish clear processes
- Inconsistent spec quality → Use templates
- Not using specialized agents → Set them up
- Skipping CI/CD integration → Automate early

**RUN Pitfalls:**
- Infrastructure complexity → Start simple, add gradually
- Over-engineering → Use what you need
- Poor documentation → Document as you build
- Neglecting training → Invest in people

### Emergency Contacts

**When things go wrong:**

| Problem | Solution |
|---------|----------|
| Agent not working | Check API key, retry with fresh context |
| Specs failing validation | Run `validate-spec.js` for details |
| Tests failing | Check if spec changed, regenerate tests |
| Team blocked | Escalate to spec owner, clarify requirements |
| Infrastructure down | Check status dashboard, contact platform team |

### Resource Links

- **Spec-MAS Documentation:** [Internal wiki]
- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/
- **Claude Agent SDK:** https://docs.anthropic.com/agent-sdk
- **MCP Protocol:** https://modelcontextprotocol.io
- **Community Forum:** [Internal/External forum]
- **Support:** support@yourcompany.com

---

**Document Status:** Complete  
**Next Review:** After first teams complete each phase  
**Feedback:** Submit via GitHub issues or email architecture@yourcompany.com

