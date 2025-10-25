# Phase 2: Adversarial Review System

## Overview

Phase 2 of Spec-MAS implements a **multi-agent adversarial review system** that critiques validated specifications from different expert perspectives before implementation. This human-in-the-loop system helps identify potential issues early, reducing defects and improving spec quality.

## Components

### 1. Reviewer Agents (5 Specialized Perspectives)

Located in `assistants/reviewers/`, each reviewer provides expert analysis:

#### 🔴 Security Red Team (`security-red-team.md`)
- **Role:** Offensive security specialist with hacker mindset
- **Focus:** Vulnerabilities, attack vectors, security gaps
- **Key Areas:**
  - Authentication/Authorization bypass
  - Injection attacks (SQL, XSS, Command, etc.)
  - Cryptographic weaknesses
  - Session management vulnerabilities
  - Data exposure and privacy violations
  - Business logic flaws

#### 🔵 Security Blue Team (`security-blue-team.md`)
- **Role:** Defensive security specialist
- **Focus:** Security controls, monitoring, incident response
- **Key Areas:**
  - Logging and audit trails
  - Monitoring and alerting
  - Incident response procedures
  - Defense-in-depth strategies
  - Compliance requirements
  - Disaster recovery

#### 🏗️ Architecture Review (`architecture-review.md`)
- **Role:** Senior software architect
- **Focus:** Design quality, scalability, maintainability
- **Key Areas:**
  - SOLID principles compliance
  - Design patterns and anti-patterns
  - Coupling and cohesion
  - Scalability concerns
  - Technology stack appropriateness
  - Technical debt prevention

#### ✅ QA & Testing Review (`qa-review.md`)
- **Role:** QA engineer and test architect
- **Focus:** Testability, coverage, edge cases
- **Key Areas:**
  - Acceptance criteria quality
  - Test scenario completeness
  - Edge case identification
  - Testability assessment
  - Non-functional testing requirements
  - Test data and environment needs

#### ⚡ Performance Engineering (`performance-review.md`)
- **Role:** Performance engineer
- **Focus:** Bottlenecks, resource usage, scalability
- **Key Areas:**
  - Database query optimization
  - N+1 query problems
  - Caching strategies
  - Algorithm complexity
  - Network efficiency
  - Resource leak detection

### 2. Review Orchestration (`scripts/review-spec.js`)

Main script that coordinates the multi-agent review process:

**Features:**
- Sequential or parallel review execution
- Customizable reviewer selection
- Human-readable and JSON output formats
- Token usage tracking and cost estimation
- Severity-based findings categorization
- Exit codes for CI/CD integration

**Usage:**
```bash
# Run all reviewers
npm run review-spec docs/examples/level-5-auth-spec.md

# Run specific reviewers in parallel
npm run review-spec my-spec.md --reviewers security-red-team,security-blue-team --parallel

# Generate JSON report
npm run review-spec my-spec.md --json --output review-report.json

# Quick summary
npm run review-spec my-spec.md --summary
```

**Exit Codes:**
- `0` - No critical/high issues (approved)
- `1` - Critical issues found (blocked)
- `2` - High severity issues found (proceed with caution)

### 3. Approval Workflow (`scripts/review-approval.js`)

Interactive human-in-the-loop approval system:

**Features:**
- Review critical and high findings interactively
- Require explicit acknowledgment of each finding
- Capture approver information and justification
- Generate approval logs with timestamps
- Support for automatic approval if no critical/high issues

**Workflow:**
1. Load review report (JSON from review-spec.js)
2. Display critical findings and require acknowledgment
3. Display high findings and require acknowledgment
4. Collect approver information
5. Make final approval decision with justification
6. Save approval log to `.specmas/approvals/`

**Usage:**
```bash
# Generate review report
npm run review-spec my-spec.md --json --output review.json

# Interactive approval
npm run review-approve review.json

# Custom approval log directory
npm run review-approve review.json --output-dir approvals/
```

## Severity Levels

All reviewers use consistent severity classifications:

### CRITICAL
- Security breaches, data loss, compliance violations
- Fundamental architectural flaws causing system failure
- Untestable requirements
- O(n²) or worse in critical paths
- **Action:** Block implementation until resolved

### HIGH
- Major functional issues, significant risk
- Severe coupling or scalability bottlenecks
- Incomplete acceptance criteria for critical features
- Major N+1 query problems
- **Action:** Require fixes or documented justification

### MEDIUM
- Important improvements, moderate risk
- Suboptimal design patterns
- Ambiguous acceptance criteria
- Missing pagination or caching
- **Action:** Consider addressing, document decisions

### LOW
- Minor issues, best practices
- Documentation gaps
- Optimization opportunities
- **Action:** Address if time permits

### INFO
- Suggestions and observations
- Future considerations
- Alternative approaches
- **Action:** Consider for future iterations

## Finding Format

Each finding includes:

```markdown
### [SEVERITY] Finding Title

**Location:** [Section of spec where issue appears]

**Issue Description:**
[Clear description of the problem]

**Why This Matters:**
[Impact on quality, security, performance, etc.]

**Current Approach:**
[What the spec currently describes]

**Problems:**
[Specific issues that will arise]

**Recommended Solution:**
[Better approach with implementation guidance]

**Benefits:**
[Why the recommendation is superior]

**Trade-offs:**
[Any costs or complexity of the recommendation]
```

## Setup

### Prerequisites
- Node.js 18+
- Anthropic API key

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. **Verify installation:**
```bash
npm run review-spec -- --help
npm run review-approve -- --help
```

## Cost Estimates

Based on Claude 3.5 Sonnet pricing (as of October 2024):

**Per Review:**
- Input tokens: ~5,000-10,000 (reviewer prompt + spec)
- Output tokens: ~2,000-4,000 (review findings)
- **Cost per reviewer:** ~$0.05-$0.15
- **Cost for all 5 reviewers:** ~$0.25-$0.75

**Example Costs:**
- Small spec (Level 1-2): ~$0.15-$0.30
- Medium spec (Level 3-4): ~$0.30-$0.50
- Large spec (Level 5): ~$0.50-$1.00

**Optimization Tips:**
- Use `--reviewers` flag to run only needed reviewers
- Use `--parallel` for faster execution (same cost)
- Review smaller specs more frequently
- Batch similar specs together

## Workflow Integration

### Full Pipeline
```bash
# Step 1: Validate spec structure
npm run validate-spec my-spec.md

# Step 2: Run adversarial review
npm run review-spec my-spec.md --json --output review.json

# Step 3: Human approval
npm run review-approve review.json

# Step 4: Implementation (if approved)
# ... proceed with development
```

### CI/CD Integration
```yaml
# .github/workflows/spec-review.yml
name: Spec Review
on:
  pull_request:
    paths:
      - 'specs/**/*.md'

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - name: Validate Spec
        run: npm run validate-spec ${{ github.event.pull_request.changed_files }}
      - name: Review Spec
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm run review-spec ${{ github.event.pull_request.changed_files }} \
            --json --output review-report.json
      - name: Upload Review Report
        uses: actions/upload-artifact@v3
        with:
          name: review-report
          path: review-report.json
      - name: Check for Critical Issues
        run: |
          CRITICAL_COUNT=$(jq '.summary.criticalCount' review-report.json)
          if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo "❌ Critical issues found: $CRITICAL_COUNT"
            exit 1
          fi
```

## Example Output

### Terminal Output
```
═══════════════════════════════════════════════════════════════════════════
  ADVERSARIAL REVIEW REPORT
═══════════════════════════════════════════════════════════════════════════

Specification:
  Name:       User Authentication System
  ID:         feat-user-authentication-system
  Complexity: HIGH
  Maturity:   Level 5
  File:       /path/to/spec.md

Review Summary:
  Reviewers:  5
  Findings:   2 Critical, 4 High, 8 Medium, 5 Low, 3 Info
  Tokens:     45,234
  Cost:       $0.67

─────────────────────────────────────────────────────────────────────────────
CRITICAL FINDINGS (2)
─────────────────────────────────────────────────────────────────────────────

1. N+1 Query Problem in Authentication Flow [Performance Engineering]
   The authentication flow executes 27 database queries per login...

2. Missing Rate Limiting Enables Brute Force [Security Red Team]
   No rate limiting specified on login endpoint...

[... more findings ...]

─────────────────────────────────────────────────────────────────────────────
OVERALL ASSESSMENT
─────────────────────────────────────────────────────────────────────────────

  Recommendation: BLOCKED - Critical issues must be resolved
```

### JSON Output
```json
{
  "metadata": {
    "specName": "User Authentication System",
    "specId": "feat-user-authentication-system",
    "complexity": "HIGH",
    "maturity": 5,
    "reviewDate": "2024-10-21T10:30:00.000Z"
  },
  "summary": {
    "reviewersRun": 5,
    "totalFindings": 22,
    "criticalCount": 2,
    "highCount": 4,
    "mediumCount": 8,
    "lowCount": 5,
    "infoCount": 3,
    "recommendation": "BLOCKED",
    "totalTokens": 45234,
    "totalCost": 0.6745
  },
  "findings": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...],
    "info": [...]
  }
}
```

## Best Practices

### When to Run Reviews

**Always run reviews:**
- Before starting implementation
- After major spec revisions
- For high-complexity or high-maturity specs
- Before production deployment

**Consider running specific reviewers:**
- Security reviewers for auth/payment features
- Performance reviewer for high-scale features
- QA reviewer when test coverage is a concern
- Architecture reviewer for new system designs

### How to Use Review Results

1. **Critical Findings:** Must be addressed before implementation
2. **High Findings:** Should be addressed or explicitly documented why not
3. **Medium Findings:** Consider addressing, track as tech debt if deferred
4. **Low/Info:** Optional improvements, good for backlog

### Iterative Review Process

```
1. Write initial spec
2. Validate structure (Phase 1)
3. Run adversarial review (Phase 2)
4. Address critical/high findings
5. Update spec
6. Re-run review on changed sections
7. Approve when clean
8. Implement
```

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Copy `.env.example` to `.env`
- Add your Claude API key from https://console.anthropic.com/

### "Rate limit exceeded"
- Use `--parallel false` to run sequentially
- Add delays between reviews
- Upgrade API plan if needed

### High token usage/cost
- Use `--reviewers` to run only needed reviewers
- Use `--summary` for less verbose output
- Review smaller spec sections independently

### No findings detected
- Check that spec has detailed content (not just high-level)
- Ensure maturity level matches content depth
- Verify reviewer prompts are loading correctly (`--verbose`)

## Advanced Usage

### Custom Reviewer Selection
```bash
# Security-only review
npm run review-spec spec.md --reviewers security-red-team,security-blue-team

# Performance-only review
npm run review-spec spec.md --reviewers performance-review

# Architecture + QA
npm run review-spec spec.md --reviewers architecture-review,qa-review
```

### Parallel Execution
```bash
# Run all reviewers in parallel (faster)
npm run review-spec spec.md --parallel

# ~5x faster for 5 reviewers, same cost
```

### Automated Reports
```bash
# Generate daily review report
#!/bin/bash
DATE=$(date +%Y-%m-%d)
for spec in specs/*.md; do
  npm run review-spec "$spec" --json --output "reviews/$DATE-$(basename $spec).json"
done
```

## Future Enhancements

**Planned for Phase 3:**
- Custom reviewer prompts per project
- Review caching to avoid re-reviewing unchanged sections
- Diff-based reviews (only review changes)
- Integration with issue trackers (GitHub Issues, Jira)
- Review metrics dashboard
- Team collaboration features
- AI-assisted finding resolution

## Support

For issues, questions, or feature requests:
- GitHub Issues: [spec-mas/issues](https://github.com/yourusername/spec-mas/issues)
- Documentation: [docs/](../docs/)
- Examples: [docs/examples/](../docs/examples/)

## License

Apache 2.0 - See [LICENSE](../LICENSE)
