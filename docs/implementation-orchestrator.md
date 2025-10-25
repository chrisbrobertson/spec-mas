# Implementation Orchestrator

The Implementation Orchestrator (`scripts/implement-spec.js`) is the core execution engine of Spec-MAS that transforms validated specifications into production code using AI agents.

## Overview

This orchestrator:
1. Validates specifications and prerequisites
2. Decomposes specs into executable tasks
3. Calls specialized AI agents to generate code
4. Manages costs and progress tracking
5. Generates comprehensive implementation reports

## Features

### Core Functionality

- **Multi-Agent Execution**: Coordinates database, backend, frontend, and integration agents
- **Execution Modes**: Sequential (safe) or parallel (fast) task execution
- **Cost Control**: Built-in cost tracking with warnings and abort thresholds
- **Dry Run Mode**: Preview execution plan and cost estimates without API calls
- **Git Integration**: Automatic branch creation and commits
- **Progress Tracking**: Real-time progress with detailed logging
- **Error Handling**: Automatic retries with exponential backoff
- **Code Formatting**: Automatic prettier/eslint formatting (if available)

### Safety Features

1. **Prerequisites Validation**
   - API key verification
   - Spec file existence check
   - Validation gate compliance

2. **Cost Controls**
   - Warning at $10
   - Abort at $50
   - Real-time cost tracking
   - Token usage monitoring

3. **Backup & Recovery**
   - Automatic backup of existing files
   - Git branch creation
   - Detailed implementation reports

## Usage

### Basic Usage

```bash
# Generate code from a validated spec
npm run implement-spec docs/examples/level-3-filter-spec.md

# Or directly
node scripts/implement-spec.js path/to/spec.md
```

### Dry Run (Recommended First)

```bash
# Preview execution plan without generating code
npm run implement-spec:dry-run docs/examples/level-3-filter-spec.md

# See cost estimates and task breakdown
npm run implement-spec docs/examples/level-3-filter-spec.md --dry-run
```

### Advanced Options

```bash
# Custom output directory
npm run implement-spec spec.md --output-dir src/features/filters

# Parallel execution (faster, requires more API capacity)
npm run implement-spec spec.md --mode parallel

# Only run specific agents
npm run implement-spec spec.md --agents frontend,backend

# Combine options
npm run implement-spec spec.md --mode parallel --output-dir src/ --agents backend
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Show plan without generating code | false |
| `--output-dir <path>` | Output directory for generated code | `implementation-output/` |
| `--mode <mode>` | Execution mode: `sequential` or `parallel` | `sequential` |
| `--agents <list>` | Comma-separated agent list | auto-detect |
| `--verbose, -v` | Show detailed error information | false |
| `--help, -h` | Show help message | - |

## Output

### Generated Files

The orchestrator generates:

1. **Source Code Files**
   - Routes/controllers
   - Services/business logic
   - Database models/migrations
   - Frontend components
   - Integration adapters

2. **Implementation Report** (`IMPLEMENTATION_REPORT.md`)
   - Execution summary
   - Task results
   - Cost breakdown
   - File list
   - Next steps

3. **Git Commit** (if in a repo)
   - Feature branch creation
   - Automatic commit with details

### Example Output Structure

```
implementation-output/
├── src/
│   ├── routes/
│   │   └── products.routes.ts
│   ├── controllers/
│   │   └── product.controller.ts
│   ├── services/
│   │   └── product.service.ts
│   ├── models/
│   │   └── Product.ts
│   └── components/
│       └── ProductFilter.tsx
├── migrations/
│   └── 001_create_products.sql
└── IMPLEMENTATION_REPORT.md
```

## Example: Dry Run Output

```
════════════════════════════════════════════════════════════
  IMPLEMENTATION IN PROGRESS
════════════════════════════════════════════════════════════

Spec: Product List Price Filter
Mode: Sequential | Output: implementation-output/

Validating prerequisites...
✓ ANTHROPIC_API_KEY found
✓ Spec file found: docs/examples/level-3-filter-spec.md
✓ Spec passed validation

Loading task decomposition...
✓ Decomposition complete
  Tasks: 4
  Phases: 4
  Agents: database, backend, frontend
  Estimated Cost: $7-9

─── Execution Plan ─────────────────────────────────────────

Spec: Product List Price Filter
Mode: sequential
Output: implementation-output

Phase 1: Database Schema
  [task-001] database    Create database schemas and migrations  $2.25

Phase 2: Data Models
  [task-002] backend     Implement data models and repositories  $1.80

Phase 3: Frontend Components
  [task-003] frontend    Build 3 frontend component(s)  $2.63

Phase 4: Backend Logic
  [task-004] backend     Implement error handling and validation  $0.75

Total Estimated Cost: $7-9
Estimated Time: < 1 hour

🏁 Dry run complete - no code generated

Remove --dry-run flag to execute implementation
```

## Implementation Process

### 1. Prerequisites Check

```
✓ ANTHROPIC_API_KEY environment variable
✓ Spec file exists
✓ Spec passes validation gates
```

### 2. Task Decomposition

```
✓ Parse specification
✓ Identify required agents
✓ Build dependency graph
✓ Create execution phases
✓ Estimate costs and time
```

### 3. Environment Setup

```
✓ Create output directory
✓ Backup existing files (if any)
✓ Create git feature branch
✓ Initialize progress tracking
```

### 4. Task Execution

For each phase:
- Load agent-specific prompt
- Build task context with spec details
- Call Claude API with full context
- Extract code from response
- Write files to output directory
- Track costs and tokens
- Show real-time progress

### 5. Post-Processing

```
✓ Format code with Prettier/ESLint
✓ Generate implementation report
✓ Commit to git
✓ Show cost summary
```

## Cost Tracking

### Pricing (Claude 3.5 Sonnet)

- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

### Cost Controls

```javascript
COST_WARNING_THRESHOLD = $10.00    // Warn user
COST_ABORT_THRESHOLD = $50.00      // Stop execution
```

### Example Cost Breakdown

For a Level 3 spec with 4 tasks:
```
Task 001: $2.25 (database schema)
Task 002: $1.80 (data models)
Task 003: $2.63 (frontend components)
Task 004: $0.75 (error handling)
─────────────────────────────────
Total:    $7.43
```

## Agent Integration

### Agent Types

1. **Database Agent** (`database-agent.md`)
   - Database schemas
   - Migrations
   - Indexes and constraints

2. **Backend Agent** (`backend-agent.md`)
   - API endpoints
   - Business logic
   - Validation and error handling
   - Authentication/authorization

3. **Frontend Agent** (`frontend-agent.md`)
   - React/Vue components
   - State management
   - UI/UX implementation

4. **Integration Agent** (`integration-agent.md`)
   - External API integrations
   - Third-party services
   - Webhooks and adapters

### Agent Context

Each agent receives:
- Full specification content
- Task-specific details
- Relevant spec sections
- Error scenarios
- Coding standards
- Output format requirements

## Error Handling

### Automatic Retry

- 3 retry attempts
- Exponential backoff (1s, 2s, 4s)
- Applies to API failures only

### Error Scenarios

1. **API Failures**: Retry with backoff
2. **Invalid Code**: Save with .ERROR suffix
3. **File Conflicts**: Backup to `.backups/`
4. **Git Errors**: Continue with warning
5. **Cost Limits**: Abort at threshold

## Execution Modes

### Sequential Mode (Default)

- Tasks run one at a time
- Safer for cost control
- Easier to debug
- Respects dependencies strictly

### Parallel Mode

- Tasks run concurrently within phases
- Faster execution
- Higher API throughput required
- Cost tracking per task

## Implementation Report

### Report Sections

1. **Specification Metadata**
   - Name, ID, complexity, maturity
   - Source file path

2. **Execution Summary**
   - Mode, duration, status
   - Start/end timestamps

3. **Task Results**
   - Per-phase breakdown
   - Success/failure status
   - Individual costs and timings

4. **Generated Files**
   - Complete file list
   - File paths relative to output

5. **Cost Summary**
   - Total cost
   - Token usage (input/output)
   - Cost per task

6. **Warnings**
   - Missing code blocks
   - API issues
   - Validation warnings

7. **Next Steps**
   - Review checklist
   - Testing recommendations
   - Integration instructions

## Best Practices

### Before Running

1. **Always run dry-run first**
   ```bash
   npm run implement-spec spec.md --dry-run
   ```

2. **Validate spec thoroughly**
   ```bash
   npm run validate-spec spec.md
   ```

3. **Review execution plan**
   - Check task breakdown
   - Verify cost estimates
   - Confirm agent selection

### During Execution

1. **Monitor progress**
   - Watch for warnings
   - Track cost accumulation
   - Check generated files

2. **Sequential first**
   - Test with sequential mode
   - Switch to parallel for production

### After Execution

1. **Review generated code**
   - Check logic correctness
   - Verify error handling
   - Test edge cases

2. **Run tests**
   ```bash
   npm test
   ```

3. **Format and lint**
   ```bash
   npm run format
   npm run lint
   ```

4. **Read implementation report**
   - Review warnings
   - Check cost breakdown
   - Follow next steps

## Troubleshooting

### "ANTHROPIC_API_KEY not set"

```bash
export ANTHROPIC_API_KEY=your-key-here
```

### "Spec failed validation"

```bash
npm run validate-spec your-spec.md
# Fix issues shown
# Re-run implementation
```

### "Cost limit exceeded"

- Reduce spec complexity
- Split into multiple specs
- Increase abort threshold (with caution)

### "No code blocks found"

- Check agent prompts
- Review task context
- Verify spec completeness

### Files in wrong location

- Use `--output-dir` flag
- Check filepath extraction
- Review agent output format

## Technical Details

### File Structure

```
scripts/implement-spec.js (1019 lines)
├── CLI argument parsing
├── Prerequisites validation
├── Task decomposition integration
├── Agent prompt loading
├── Claude API integration
├── Code extraction & parsing
├── File writing & management
├── Cost tracking & limits
├── Progress reporting
├── Git integration
├── Post-processing
└── Report generation
```

### Key Functions

- `validatePrerequisites()` - Check API key, spec file, validation
- `loadTaskDecomposition()` - Get execution plan
- `setupEnvironment()` - Create dirs, backup, git branch
- `executeTask()` - Run single task with agent
- `executePhase()` - Run phase (sequential or parallel)
- `callAgent()` - Claude API integration
- `extractCode()` - Parse code from response
- `writeCodeToFiles()` - Write to output directory
- `generateImplementationReport()` - Create report
- `runPostProcessing()` - Format, commit, report

### Integration Points

- `task-decomposition.js` - Task planning
- `validate-spec.js` - Spec validation
- `spec-parser.js` - Spec parsing
- Agent prompts in `assistants/implementers/`
- Anthropic SDK for API calls

## Future Enhancements

### Planned Features

1. **Incremental Implementation**
   - Resume from failures
   - Skip completed tasks

2. **Interactive Mode**
   - Approve each task
   - Review before committing

3. **Test Generation Integration**
   - Generate tests alongside code
   - Run tests automatically

4. **Code Review**
   - Static analysis
   - Security scanning
   - Quality metrics

5. **Multi-Model Support**
   - GPT-4 integration
   - Model selection per agent
   - Cost optimization

6. **Caching**
   - Cache agent responses
   - Reuse similar tasks
   - Reduce API costs

## Contributing

When modifying the orchestrator:

1. Maintain backward compatibility
2. Update cost estimates
3. Add comprehensive error handling
4. Test with multiple specs
5. Update documentation
6. Test in dry-run mode first

## See Also

- [Task Decomposition](../scripts/task-decomposition.js)
- [Spec Validation](../scripts/validate-spec.js)
- [Agent Prompts](../assistants/implementers/)
- [Spec Writing Guide](./spec-writing-guide.md)

---

*Last Updated: 2024-10-22*
*Spec-MAS v3.0*
