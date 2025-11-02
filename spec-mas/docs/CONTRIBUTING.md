# Contributing to Spec-MAS

Thank you for your interest in contributing to Spec-MAS! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Contribution Workflow](#contribution-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Commit Messages](#commit-messages)
9. [Pull Request Process](#pull-request-process)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or derogatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Violations may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
1. Check existing issues to avoid duplicates
2. Gather relevant information (error messages, environment, steps to reproduce)
3. Verify it's actually a bug (not expected behavior)

**Submitting a bug report:**
```markdown
**Bug Description:**
Clear description of what's wrong

**Steps to Reproduce:**
1. Run command X
2. With spec Y
3. See error Z

**Expected Behavior:**
What should have happened

**Actual Behavior:**
What actually happened

**Environment:**
- Spec-MAS version: 3.0.0
- Node version: 18.17.0
- OS: macOS 13.5
- AI Provider: Claude CLI

**Logs/Screenshots:**
Attach relevant logs or screenshots
```

### Suggesting Features

**Before suggesting a feature:**
1. Check if it's already suggested or implemented
2. Consider if it aligns with Spec-MAS goals (startup focus, simplicity, cost-effectiveness)
3. Think through the implications (cost, complexity, maintenance)

**Feature request template:**
```markdown
**Feature Description:**
What feature do you want?

**Problem It Solves:**
What problem does this address?

**Proposed Solution:**
How would it work?

**Alternatives Considered:**
What other approaches did you consider?

**Cost Impact:**
Would this increase API costs?

**Target Users:**
Who benefits? (solo devs, teams, enterprises)
```

### Improving Documentation

Documentation is critical! We welcome:
- Fixing typos and grammar
- Clarifying confusing sections
- Adding examples and use cases
- Creating tutorials and guides
- Translating documentation (coming soon)

**Small fixes:** Submit a PR directly
**Large changes:** Open an issue first to discuss

### Contributing Code

We welcome code contributions! See sections below for detailed guidelines.

---

## Development Setup

### Prerequisites

```bash
# Required
node >= 18.0.0
npm >= 9.0.0
git

# Optional
claude CLI (for testing)
OpenAI API key (for testing)
```

### Initial Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Spec-MAS.git
cd Spec-MAS

# 3. Add upstream remote
git remote add upstream https://github.com/original/Spec-MAS.git

# 4. Install dependencies
npm install

# 5. Create .env for testing
cp .env.example .env
# Edit .env with your API keys

# 6. Run tests
npm test

# 7. Validate a sample spec
npm run validate-spec specs/examples/security-critical-template.yaml
```

### Project Structure

```
Spec-MAS/
├── scripts/              # CLI scripts and orchestration
│   ├── specmas.js       # Main CLI entry point
│   ├── validate-spec.js # Phase 1: Validation
│   ├── review-spec.js   # Phase 2: Reviews
│   ├── generate-tests.js # Phase 3: Test generation
│   ├── implement-spec.js # Phase 4-7: Implementation
│   └── ai-helper.js     # AI abstraction layer
├── src/
│   ├── validation/      # Validation gates (G1-G4)
│   ├── parsers/         # Spec parsing logic
│   └── utils/           # Shared utilities
├── assistants/
│   ├── reviewers/       # Adversarial review prompts
│   └── implementers/    # Code generation prompts
├── templates/           # Test and code templates
├── specs/               # Spec templates and examples
├── tests/               # Test suite
└── docs/                # Documentation
```

---

## Contribution Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/bug-description
```

### 2. Make Changes

- Follow coding standards (see below)
- Write tests for new functionality
- Update documentation
- Keep commits logical and atomic

### 3. Test Thoroughly

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Test with real specs
npm run validate-spec specs/examples/security-critical-template.yaml
npm run generate-tests specs/examples/security-critical-template.yaml --dry-run

# Check code quality
npm run lint
npm run format
```

### 4. Commit Changes

```bash
# Stage changes
git add -p  # Interactively stage chunks

# Commit with good message
git commit -m "feat: Add support for multi-file specs"

# See "Commit Messages" section for guidelines
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create Pull Request
# Fill out the PR template completely
```

---

## Coding Standards

### JavaScript Style

**Follow these conventions:**

```javascript
// Use modern JavaScript (ES6+)
const myFunction = async (param1, param2) => {
  // Use const/let, never var
  const result = await someAsyncOperation();

  // Destructuring when appropriate
  const { property1, property2 } = result;

  // Early returns for error cases
  if (!result) {
    return { error: 'No result found' };
  }

  // Clear variable names
  const isValidUser = checkUserValidity(result);

  return { success: true, data: result };
};

// Use JSDoc for complex functions
/**
 * Validates a spec against all validation gates
 * @param {Object} spec - Parsed spec object
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Use strict mode
 * @returns {Promise<Object>} Validation result with score and findings
 */
async function validateSpec(spec, options = {}) {
  // Implementation
}

// Prefer named exports
export { validateSpec, parseSpec };

// Use async/await over callbacks
async function fetchData() {
  try {
    const data = await apiCall();
    return processData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```

**Formatting:**
```bash
# Auto-format before committing
npm run format

# Auto-fix linting issues
npm run lint:fix
```

### Error Handling

```javascript
// Always handle errors gracefully
async function riskyOperation() {
  try {
    const result = await mightFail();
    return { success: true, data: result };
  } catch (error) {
    // Log error with context
    console.error('[riskyOperation] Failed:', error.message, {
      stack: error.stack,
      context: 'additional info'
    });

    // Return error object, don't throw to caller unless necessary
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

// Validate inputs
function processSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid spec: must be an object');
  }

  if (!spec.frontMatter) {
    throw new Error('Invalid spec: missing front-matter');
  }

  // Process validated spec
}
```

### File Organization

```javascript
// Order: imports, constants, helpers, main functions, exports

// 1. External imports
const fs = require('fs');
const path = require('path');

// 2. Internal imports
const { parseSpec } = require('./spec-parser');
const { validateGates } = require('../src/validation/gates');

// 3. Constants
const DEFAULT_OPTIONS = {
  strict: false,
  verbose: false
};

// 4. Helper functions (not exported)
function formatScore(score) {
  return `${score}/100`;
}

// 5. Main functions
async function validateSpecFile(filePath, options = {}) {
  // Implementation
}

// 6. Exports
module.exports = {
  validateSpecFile
};
```

---

## Testing Guidelines

### Test Structure

```javascript
// tests/unit/spec-parser.test.js

describe('Spec Parser', () => {
  describe('parseSpec', () => {
    it('should parse valid spec with YAML front-matter', () => {
      // Arrange
      const input = `---
specmas: 3.0
kind: feature
---
# Overview
Test content`;

      // Act
      const result = parseSpec(input);

      // Assert
      expect(result.frontMatter.specmas).toBe('3.0');
      expect(result.sections.overview).toBeDefined();
    });

    it('should handle missing front-matter gracefully', () => {
      // Arrange
      const input = '# Just a heading\nNo front-matter';

      // Act
      const result = parseSpec(input);

      // Assert
      expect(result.error).toBeDefined();
      expect(result.error).toContain('missing front-matter');
    });

    it('should normalize section names correctly', () => {
      // Test edge cases
      const input = `---
specmas: 3.0
---
## Functional Requirements
## Non-Functional Requirements`;

      const result = parseSpec(input);

      expect(result.sections.functional_requirements).toBeDefined();
      expect(result.sections.non_functional_requirements).toBeDefined();
    });
  });
});
```

### Coverage Requirements

- **Unit tests:** >80% coverage for new code
- **Integration tests:** Critical paths covered
- **E2E tests:** Main workflows covered

```bash
# Check coverage
npm run test:coverage

# Should see:
# Statements   : 85% ( 1200/1400 )
# Branches     : 80% ( 400/500 )
# Functions    : 85% ( 150/175 )
# Lines        : 85% ( 1150/1350 )
```

### Test Data

```javascript
// Use fixtures for complex test data
// tests/fixtures/sample-specs.js

module.exports = {
  validEasySpec: {
    frontMatter: {
      specmas: '3.0',
      kind: 'feature',
      complexity: 'EASY',
      maturity: 3
    },
    sections: {
      overview: 'Test overview',
      functional_requirements: [
        { id: 'FR-1', description: 'Test requirement' }
      ]
    }
  },

  invalidSpec: {
    frontMatter: {
      // Missing required fields
    }
  }
};

// Use in tests
const { validEasySpec } = require('../fixtures/sample-specs');

it('should validate valid spec', () => {
  const result = validateSpec(validEasySpec);
  expect(result.score).toBeGreaterThan(70);
});
```

---

## Documentation

### Code Comments

```javascript
// Good comments explain WHY, not WHAT

// Bad: Loop through items
for (const item of items) { ... }

// Good: Process items in order to maintain checksum consistency
for (const item of items) { ... }

// Good: Complex logic explanation
// We combine system and user prompts because Claude CLI doesn't support
// the --system flag as of v1.0. This workaround uses XML tags to maintain
// prompt separation while keeping compatibility.
const combinedPrompt = `<SYSTEM_INSTRUCTIONS>...`;
```

### README Updates

When adding features, update README.md:
- Add to feature list
- Update examples if needed
- Add to roadmap if major feature
- Update version info

### Documentation Files

Create documentation for:
- **New phases:** `docs/phase-X-name.md`
- **New workflows:** `docs/workflow-name.md`
- **Tutorials:** `docs/tutorials/tutorial-name.md`

**Documentation template:**
```markdown
# Feature/Phase Name

## Overview
What is this and why does it exist?

## How It Works
Technical explanation

## Usage
Concrete examples

## Configuration
Options and settings

## Troubleshooting
Common issues and solutions

## Related
Links to related docs
```

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code formatting (no functional changes)
- **refactor:** Code refactoring (no functional changes)
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, build, etc.)

### Examples

```bash
# Good commits
feat(validation): Add support for multi-file specs
fix(parser): Handle edge case with empty sections
docs(readme): Update quick start guide
test(validation): Add tests for G4 gate

# With body
feat(ai): Add OpenAI fallback support

Adds automatic fallback to OpenAI API when Claude CLI fails.
Configurable via AI_FALLBACK_ENABLED in .env.

Closes #123

# Breaking change
feat(api)!: Change spec parser API

BREAKING CHANGE: parseSpec() now returns Promise instead of sync result.
Migration: await parseSpec(content) instead of parseSpec(content)
```

### Commit Guidelines

- **One logical change per commit**
- **Present tense:** "Add feature" not "Added feature"
- **Imperative mood:** "Fix bug" not "Fixes bug"
- **50 char subject line** (hard limit: 72)
- **Wrap body at 72 characters**
- **Reference issues:** "Closes #123" or "Fixes #456"

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Documentation updated
- [ ] Commits are clean and logical
- [ ] Branch is up to date with main

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout your-branch
git rebase main

# Fix any conflicts, then
git push --force-with-lease origin your-branch
```

### PR Template

```markdown
## Description
Clear description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Relates to #456

## Testing
How did you test this?

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested with specs: [list specs]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. **Automated checks run** (tests, linting)
2. **Maintainer reviews code**
3. **Feedback addressed** via new commits or force-push
4. **Approval given**
5. **Merged to main**

**Response time:**
- Small PRs (<100 lines): 1-2 days
- Medium PRs (100-500 lines): 3-5 days
- Large PRs (>500 lines): 1-2 weeks

**Tips for faster review:**
- Keep PRs focused and small
- Write clear descriptions
- Add tests
- Respond to feedback promptly

---

## Community

### Getting Help

**For Contributors:**
- **Questions:** Open a GitHub Discussion
- **Issues:** Check existing issues first
- **Chat:** Discord (coming soon)

**For Maintainers:**
- **Weekly sync:** Fridays, async via GitHub Discussions
- **Roadmap planning:** Quarterly, in GitHub Projects

### Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes
- GitHub contributors page

**Hall of Fame:**
- 10+ merged PRs: Gold Contributor badge
- First-time contributors: Welcome badge
- Major features: Special recognition in releases

---

## Additional Resources

### Useful Links

- [Architecture Overview](ARCHITECTURE.md)
- [Quick Start Guide](STARTUP-QUICK-START.md)
- [Phase 2 Review System](docs/phase-2-review-system.md)
- [Phase 3 Test Generation](docs/phase-3-test-generation-guide.md)
- [CLI Reference](docs/cli-reference.md)

### Development Tools

**Recommended:**
- VS Code with ESLint extension
- Cursor (for AI-assisted development)
- Prettier extension

**Optional:**
- GitHub CLI (`gh` command)
- Claude CLI
- Jest Runner extension

---

## Questions?

**Open an issue or discussion if:**
- Something in this guide is unclear
- You're not sure how to contribute
- You want to propose a major change
- You need help getting started

**We're here to help!** Don't hesitate to ask questions.

---

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

**Thank you for contributing to Spec-MAS!** 🎉

Every contribution, no matter how small, helps make this tool better for the entire community.

---

*Last Updated: October 25, 2025*
*Spec-MAS v3.0*
