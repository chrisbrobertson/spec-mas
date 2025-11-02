# Spec-MAS CLI Reference

Complete reference for the `specmas` command-line interface.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Commands](#commands)
   - [specmas run](#specmas-run)
   - [specmas validate](#specmas-validate)
   - [specmas review](#specmas-review)
   - [specmas generate-tests](#specmas-generate-tests)
   - [specmas implement](#specmas-implement)
   - [specmas integrate](#specmas-integrate)
   - [specmas qa](#specmas-qa)
   - [specmas init](#specmas-init)
   - [specmas status](#specmas-status)
   - [specmas cost](#specmas-cost)
   - [specmas report](#specmas-report)
   - [specmas config](#specmas-config)
4. [Configuration](#configuration)
5. [Workflow Examples](#workflow-examples)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Local Installation

```bash
cd /path/to/Spec-MAS
npm install
npm link  # Makes 'specmas' available globally
```

### Usage Without Installation

```bash
npm run specmas -- <command> [options]
```

### Verify Installation

```bash
specmas --version
specmas help
```

---

## Quick Start

```bash
# Initialize new project
specmas init my-project
cd my-project

# Validate a spec
specmas validate specs/my-feature.md

# Run full pipeline
specmas run specs/my-feature.md

# Check status
specmas status specs/my-feature.md
```

---

## Commands

### specmas run

Run the complete spec-to-code pipeline (all phases).

#### Syntax

```bash
specmas run <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--skip-validation` | Skip spec validation phase | false |
| `--skip-review` | Skip adversarial review phase | false |
| `--skip-tests` | Skip test generation phase | false |
| `--skip-implementation` | Skip code implementation phase | false |
| `--skip-integration` | Skip code integration phase | false |
| `--skip-qa` | Skip QA validation phase | false |
| `--dry-run` | Show execution plan without running | false |
| `--budget <amount>` | Set maximum API cost budget (USD) | 50 |
| `--output-dir <dir>` | Output directory for generated code | implementation-output |
| `--resume` | Resume from last checkpoint | false |
| `--parallel` | Run tasks in parallel (faster, more expensive) | false |
| `--no-git` | Skip git operations | false |
| `-y, --yes` | Skip all confirmations | false |

#### Examples

```bash
# Basic usage
specmas run specs/my-feature.md

# Dry run to see what would happen
specmas run specs/my-feature.md --dry-run

# Set custom budget
specmas run specs/my-feature.md --budget 100

# Skip certain phases
specmas run specs/my-feature.md --skip-review --skip-tests

# Run with custom output directory
specmas run specs/my-feature.md --output-dir src/generated

# Resume from failure
specmas run specs/my-feature.md --resume

# Skip all prompts (CI/CD)
specmas run specs/my-feature.md -y
```

#### Output

```
═══════════════════════════════════════════════════════════
  SPEC-MAS PIPELINE v3.0
═══════════════════════════════════════════════════════════

Spec: my-feature.md
Mode: Sequential
Budget: $50.00
Phases: 6

─── Cost Estimate ────────────────────────────────────────
  Spec Validation           $0.00
  Adversarial Review        $0.50
  Test Generation           $0.25
  Code Implementation       $5.00
  Code Integration          $0.00
  QA Validation             $0.00

  Total Estimated:          $5.75

Continue? [Y/n]: y

─── Running Pipeline ─────────────────────────────────────

[1/6] Spec Validation...
  ✓ G1: Structure validation passed
  ✓ G2: Semantic validation passed
  ✓ G3: Traceability passed

[2/6] Adversarial Review...
  Running 5 reviewers in parallel...
  ✓ Complete

...

═══════════════════════════════════════════════════════════
  ✓ PIPELINE COMPLETE
═══════════════════════════════════════════════════════════

Total Time: 6m 15s
Total Cost: $6.58 / $50.00
```

---

### specmas validate

Validate spec structure and completeness (Phase 1).

#### Syntax

```bash
specmas validate <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--strict` | Use strict validation mode | false |

#### Examples

```bash
# Basic validation
specmas validate specs/my-feature.md

# Strict mode (fail on warnings)
specmas validate specs/my-feature.md --strict
```

#### Output

Validates against gates G1-G4:
- **G1:** Structure validation
- **G2:** Semantic validation
- **G3:** Traceability
- **G4:** Agent-readiness

---

### specmas review

Run adversarial reviews on specification (Phase 2).

#### Syntax

```bash
specmas review <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--reviewers <list>` | Comma-separated list of reviewer types | All |
| `--parallel` | Run reviewers in parallel | false |

#### Reviewer Types

- `security-red-team` - Security attacker perspective
- `security-blue-team` - Security defender perspective
- `architecture` - System architecture review
- `qa` - Quality assurance review
- `performance` - Performance review

#### Examples

```bash
# Run all reviewers
specmas review specs/my-feature.md

# Run specific reviewers
specmas review specs/my-feature.md --reviewers security-red-team,qa

# Run in parallel (faster)
specmas review specs/my-feature.md --parallel
```

---

### specmas generate-tests

Generate test scaffolds from specification (Phase 3).

#### Syntax

```bash
specmas generate-tests <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Test type: unit, integration, e2e, or all | all |
| `--ai` | Use AI to enhance test implementations | false |

#### Examples

```bash
# Generate all test types
specmas generate-tests specs/my-feature.md

# Generate only unit tests
specmas generate-tests specs/my-feature.md --type unit

# Generate with AI enhancement
specmas generate-tests specs/my-feature.md --ai
```

---

### specmas implement

Implement specification using AI agents (Phase 4).

#### Syntax

```bash
specmas implement <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Show task breakdown without implementing | false |
| `--parallel` | Run tasks in parallel | false |
| `--output-dir <dir>` | Output directory | implementation-output |

#### Examples

```bash
# Basic implementation
specmas implement specs/my-feature.md

# See task breakdown first
specmas implement specs/my-feature.md --dry-run

# Parallel execution (faster)
specmas implement specs/my-feature.md --parallel

# Custom output directory
specmas implement specs/my-feature.md --output-dir src/features
```

---

### specmas integrate

Integrate generated code into project (Phase 5).

#### Syntax

```bash
specmas integrate [output-dir] [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--check-only` | Check for conflicts without integrating | false |

#### Examples

```bash
# Integrate from default directory
specmas integrate

# Check for conflicts first
specmas integrate --check-only

# Integrate from custom directory
specmas integrate src/generated
```

---

### specmas qa

Run QA validation on implementation (Phase 6).

#### Syntax

```bash
specmas qa <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--strict` | Use strict validation mode | false |
| `--report-only` | Generate report without failing | false |

#### Examples

```bash
# Basic QA validation
specmas qa specs/my-feature.md

# Strict mode
specmas qa specs/my-feature.md --strict

# Generate report only
specmas qa specs/my-feature.md --report-only
```

---

### specmas init

Initialize a new Spec-MAS project.

#### Syntax

```bash
specmas init [project-name] [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--template <name>` | Project template to use |

#### Examples

```bash
# Interactive initialization
specmas init

# Initialize with project name
specmas init my-awesome-app

# Use template
specmas init my-app --template react-nextjs
```

#### What Gets Created

```
my-project/
├── .specmas/
│   └── config.json
├── specs/
│   ├── TEMPLATE.md
│   └── examples/
│       └── auth-example.md
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── generated/
├── implementation-output/
├── .env.example
├── .gitignore
└── README.md
```

---

### specmas status

Show pipeline status for a specification.

#### Syntax

```bash
specmas status <spec-file>
```

#### Examples

```bash
specmas status specs/my-feature.md
```

#### Output

```
═══════════════════════════════════════════════════════════
  PIPELINE STATUS
═══════════════════════════════════════════════════════════

Spec: my-feature.md
Status: in_progress
Current Phase: implementation
Completed Phases: 3/6

Total Cost: $2.75

Completed:
  ✓ validation
  ✓ review
  ✓ test-generation

Pending:
  ○ implementation
  ○ integration
  ○ qa-validation
```

---

### specmas cost

Estimate API costs for running pipeline.

#### Syntax

```bash
specmas cost <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--detailed` | Show detailed cost breakdown | false |

#### Examples

```bash
# Quick estimate
specmas cost specs/my-feature.md

# Detailed breakdown
specmas cost specs/my-feature.md --detailed
```

#### Output

```
═══════════════════════════════════════════════════════════
  COST ESTIMATE
═══════════════════════════════════════════════════════════

Phase Breakdown:
  Spec Validation           $0.00
  Adversarial Review        $0.50
  Test Generation           $0.25
  Code Implementation       $5.00
  Code Integration          $0.00
  QA Validation             $0.00

Total Estimated Cost: $5.75
Estimated Time: 6m 15s
```

---

### specmas report

Generate comprehensive pipeline report.

#### Syntax

```bash
specmas report <spec-file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <type>` | Report format: text, json, html | text |
| `--output <file>` | Output file (default: stdout) | - |

#### Examples

```bash
# Text report to stdout
specmas report specs/my-feature.md

# JSON report to file
specmas report specs/my-feature.md --format json --output report.json

# HTML report
specmas report specs/my-feature.md --format html --output report.html
```

---

### specmas config

Manage configuration values.

#### Syntax

```bash
specmas config [key] [value] [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--list` | List all configuration values |
| `--reset` | Reset to default configuration |
| `--global` | Use global config (~/.specmas/config.json) |

#### Configuration Keys

- `api.anthropic_key` - Anthropic API key
- `api.model` - AI model to use
- `api.max_tokens` - Maximum tokens per request
- `costs.budget_limit` - Default budget limit
- `output.directory` - Default output directory
- `validation.strict_mode` - Enable strict validation
- `git.auto_commit` - Auto-commit changes
- `git.auto_branch` - Auto-create branches

#### Examples

```bash
# List all config
specmas config --list

# Get specific value
specmas config api.model

# Set value (project config)
specmas config api.model claude-3-opus-20240229

# Set value globally
specmas config api.model claude-3-opus-20240229 --global

# Reset to defaults
specmas config --reset
```

---

## Configuration

### Configuration Hierarchy

Configuration is loaded in this order (later overrides earlier):

1. **Default config** (hardcoded in code)
2. **Global config** (`~/.specmas/config.json`)
3. **Project config** (`.specmas/config.json`)
4. **Environment variables** (`ANTHROPIC_API_KEY`, etc.)
5. **CLI flags** (highest priority)

### Default Configuration

```json
{
  "api": {
    "anthropic_key": null,
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 8192,
    "temperature": 0.7
  },
  "costs": {
    "budget_warning": 10.00,
    "budget_limit": 50.00,
    "input_token_cost": 3.00,
    "output_token_cost": 15.00
  },
  "output": {
    "directory": "implementation-output",
    "tests_directory": "tests/generated",
    "reports_directory": "."
  },
  "validation": {
    "strict_mode": false,
    "coverage_threshold": 80,
    "security_threshold": 7
  },
  "git": {
    "auto_commit": true,
    "auto_branch": true,
    "branch_prefix": "feat/spec-"
  },
  "pipeline": {
    "parallel_execution": false,
    "auto_resume": true,
    "checkpoint_enabled": true
  }
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (required) |
| `ANTHROPIC_MODEL` | AI model to use |
| `SPECMAS_BUDGET` | Default budget limit |
| `DEBUG` | Enable debug output |

---

## Workflow Examples

### Complete Feature Development

```bash
# 1. Initialize project
specmas init my-app
cd my-app

# 2. Write spec
cp specs/TEMPLATE.md specs/user-auth.md
# Edit specs/user-auth.md...

# 3. Validate spec
specmas validate specs/user-auth.md

# 4. Get cost estimate
specmas cost specs/user-auth.md --detailed

# 5. Run full pipeline
specmas run specs/user-auth.md

# 6. Review generated code
git diff

# 7. Run tests
npm test

# 8. Deploy
git push
```

### Iterative Development

```bash
# First iteration - validation and review only
specmas run specs/feature.md --skip-implementation --skip-integration --skip-qa

# Review feedback, update spec...

# Second iteration - full implementation
specmas run specs/feature.md --resume
```

### CI/CD Integration

```bash
# Validate all specs in CI
for spec in specs/*.md; do
  specmas validate "$spec" --strict
done

# Run pipeline with budget control
specmas run specs/feature.md \
  --budget 20 \
  --yes \
  --no-git
```

### Cost-Conscious Development

```bash
# Check cost first
specmas cost specs/feature.md

# If too expensive, skip AI phases
specmas run specs/feature.md \
  --skip-review \
  --skip-implementation

# Or use lower budget
specmas run specs/feature.md --budget 10
```

---

## Troubleshooting

### API Key Issues

```bash
# Error: ANTHROPIC_API_KEY not found

# Solution 1: Set environment variable
export ANTHROPIC_API_KEY=your-key-here

# Solution 2: Set in config
specmas config api.anthropic_key your-key-here

# Solution 3: Add to .env file
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
```

### Budget Exceeded

```bash
# Error: Budget exceeded! Stopping pipeline.

# Solution 1: Increase budget
specmas run specs/feature.md --budget 100

# Solution 2: Skip expensive phases
specmas run specs/feature.md --skip-review

# Solution 3: Resume from checkpoint
specmas run specs/feature.md --resume
```

### State/Checkpoint Issues

```bash
# Error: Corrupted state file

# Solution: Remove state and start fresh
rm .specmas/*-state.json
specmas run specs/feature.md
```

### Permission Errors

```bash
# Error: EACCES: permission denied

# Solution: Fix script permissions
chmod +x scripts/*.js

# Or reinstall
npm unlink
npm link
```

### Module Not Found

```bash
# Error: Cannot find module

# Solution: Reinstall dependencies
npm install

# Or link again
npm link
```

---

## Advanced Usage

### Custom Pipeline Phase Order

While the CLI enforces the standard pipeline order, you can run individual phases:

```bash
# Custom workflow
specmas validate specs/feature.md
specmas implement specs/feature.md  # Skip review and tests
specmas qa specs/feature.md
```

### Multiple Specs in Parallel

```bash
# Process multiple specs
for spec in specs/*.md; do
  specmas run "$spec" --yes &
done
wait
```

### Cost Tracking

```bash
# Track costs across multiple runs
specmas run specs/feature1.md | tee logs/feature1.log
specmas run specs/feature2.md | tee logs/feature2.log

# Analyze total costs
grep "Total Cost" logs/*.log
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Validation failed |
| 3 | Budget exceeded |
| 4 | API error |
| 5 | Configuration error |

---

## Getting Help

### Command Help

```bash
# General help
specmas help

# Command-specific help
specmas help run
specmas run --help
```

### Additional Resources

- [Quick Start Guide](../STARTUP-QUICK-START.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [GitHub Issues](https://github.com/yourusername/Spec-MAS/issues)

---

## Version History

- **v3.0.0** - Initial unified CLI release
  - Complete pipeline orchestration
  - Cost estimation and tracking
  - Configuration management
  - Project initialization

---

**Last Updated:** 2025-10-25
**CLI Version:** 3.0.0
