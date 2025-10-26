# Spec-MAS v3.0: Startup Quick Start Guide

> **Get from zero to shipping features in 15 minutes.**

This guide will help you set up Spec-MAS and ship your first feature using AI-assisted implementation.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Your First Spec](#your-first-spec)
4. [Running the Pipeline](#running-the-pipeline)
5. [Understanding the Output](#understanding-the-output)
6. [Cost Management](#cost-management)
7. [Team Workflow](#team-workflow)
8. [Scaling Strategies](#scaling-strategies)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need

**Required:**
- Node.js 18+ and npm 9+ ([Download](https://nodejs.org))
- Git ([Download](https://git-scm.com))
- Text editor (VS Code, Cursor, or similar)

**AI Provider (choose one):**
- Claude CLI (`npm install -g @anthropic-ai/claude-cli`) - **RECOMMENDED**
- OpenAI API key ([Get one](https://platform.openai.com))

**Estimated Cost:**
- First month: $20-50
- Ongoing: $50-150/month

### Time Commitment

- **Setup:** 15 minutes
- **Learning:** 2-3 hours
- **First feature:** 2-4 hours
- **Ongoing:** 2-5 hours per feature

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Spec-MAS.git
cd Spec-MAS
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure AI Provider

**Option A: Claude CLI (Recommended)**

```bash
# Install Claude CLI globally
npm install -g @anthropic-ai/claude-cli

# Authenticate (follow prompts)
npx claude auth

# Create .env file
cp .env.example .env

# Edit .env and set:
AI_PROVIDER=claude
AI_MODEL_CLAUDE=sonnet
```

**Option B: OpenAI API**

```bash
# Create .env file
cp .env.example .env

# Edit .env and set:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL_OPENAI=gpt-4
```

**Option C: Both (with fallback)**

```bash
# Edit .env and set:
AI_PROVIDER=claude
AI_MODEL_CLAUDE=sonnet
OPENAI_API_KEY=sk-...
AI_FALLBACK_ENABLED=true
```

### Step 4: Verify Installation

```bash
# Test the validator
npm run validate-spec specs/examples/001-sample-dashboard.md

# Should see output like:
# ✓ G1 - Structure: PASS (100%)
# ✓ Overall Score: 85/100
```

**Congratulations!** Spec-MAS is installed.

---

## Your First Spec

### Step 1: Choose a Simple Feature

Start with an **EASY** complexity feature for your first spec:

**Good First Features:**
- User profile page
- Simple dashboard
- Basic CRUD for one entity
- Contact form
- Settings page

**Avoid for First Spec:**
- Payment integration
- Real-time features
- Complex workflows
- Multi-service architecture

### Step 2: Copy the Template

```bash
# Create your feature spec
cp specs/TEMPLATE-STARTUP.md specs/features/001-user-profile.md
```

### Step 3: Fill Out the Template

Open `specs/features/001-user-profile.md` and fill in:

**Front Matter (YAML):**
```yaml
---
specmas: 3.0
kind: feature
id: feat-user-profile-001
name: User Profile Page
complexity: EASY
maturity: 3
owner: YourName
created: 2025-10-25
---
```

**Required Sections:**
1. **Overview** - What problem does this solve?
2. **Functional Requirements** - What should it do? (3-5 requirements)
3. **Acceptance Criteria** - How do you know it works? (5-10 criteria)
4. **Data Model** - What data is needed? (Keep simple)
5. **Security** - Basic auth and validation
6. **Deterministic Tests** - 3-5 concrete test cases with expected outputs

**Example Overview:**
```markdown
## Overview

### Problem Statement
Users need a way to view and edit their profile information. Currently, there's no user-facing page to manage name, email, and avatar.

### Success Metrics
- Page loads in < 2 seconds
- Users can update profile in < 30 seconds
- 90%+ of updates succeed without errors
```

**Example Functional Requirement:**
```markdown
## Functional Requirements

### FR-1: Display User Profile
**Description:** Display current user's profile information including name, email, and avatar.

**Validation Criteria:**
- Avatar displays correctly or shows default placeholder
- Email is masked if user has privacy mode enabled
- Last updated timestamp is shown

**Dependencies:** User authentication system
```

**Pro Tip:** Spend 30-60 minutes on your first spec. Quality here = speed later!

### Step 4: Validate Your Spec

```bash
npm run validate-spec specs/features/001-user-profile.md
```

**Target Score for First Spec:** 70-80/100

**Common Issues:**
- ❌ "Missing acceptance criteria" → Add more specific criteria
- ❌ "Vague terms detected" → Replace "should" with "must", "fast" with "< 2s"
- ❌ "Missing deterministic tests" → Add concrete test cases with checksums/outputs

**Fix Issues and Re-validate:**
```bash
# Edit the spec...
npm run validate-spec specs/features/001-user-profile.md

# Repeat until score > 70
```

---

## Running the Pipeline

Now the fun part - let AI implement your feature!

### Phase 1: Validation (Free)

```bash
npm run validate-spec specs/features/001-user-profile.md
```

**Expected Output:**
```
✓ G1 - Structure: PASS (100%)
✓ G2 - Semantic: PASS (80%)
✓ G3 - Traceability: PASS (85%)
✓ G4 - Invariants: PASS (75%)
Overall Score: 85/100 - READY FOR IMPLEMENTATION
```

### Phase 2: Adversarial Review (Optional, ~$2-3)

Get 5 AI experts to review your spec:

```bash
npm run review-spec specs/features/001-user-profile.md
```

**What This Does:**
- Security Red Team finds vulnerabilities
- Security Blue Team checks defensive measures
- Architecture Reviewer evaluates design
- QA Reviewer checks testability
- Performance Reviewer identifies bottlenecks

**Output:** `specs/features/001-user-profile.REVIEW.md` with findings

**Decision Point:**
- If 0-5 findings: Proceed to implementation
- If 6-10 findings: Fix critical issues first
- If 10+ findings: Revise spec significantly

### Phase 3: Test Generation (Free)

Generate test scaffolds from your acceptance criteria:

```bash
npm run generate-tests specs/features/001-user-profile.md
```

**Generated Files:**
```
tests/unit/user-profile.test.js           (15-20 tests)
tests/integration/user-profile.integration.test.js  (3-5 tests)
tests/e2e/user-profile.e2e.test.js        (3-5 tests)
tests/TEST_MAPPING.md                     (requirements → tests)
```

**Optional: AI-Enhanced Tests (~$1-2)**
```bash
npm run enhance-tests specs/features/001-user-profile.md
```

This fills in the test implementations automatically.

### Phase 4: Cost Estimation (Free)

Before running expensive AI code generation:

```bash
npm run decompose-tasks specs/features/001-user-profile.md
```

**Output:**
```
Task Decomposition Report
─────────────────────────
Spec: User Profile Page (feat-user-profile-001)

Tasks Identified: 2

Task 1: Backend API Endpoints (backend)
  - Estimated tokens: 8,000
  - Estimated cost: $4.80
  - Can parallelize: Yes

Task 2: Frontend Components (frontend)
  - Estimated tokens: 6,000
  - Estimated cost: $3.60
  - Depends on: Task 1

Total Estimated Cost: $8-10
Estimated Time: 30-45 minutes
```

### Phase 5-7: Implementation (Costs $8-10 for EASY feature)

**Full Pipeline:**
```bash
npm run implement-spec specs/features/001-user-profile.md
```

**What Happens:**
1. **Task Decomposition:** Breaks spec into atomic tasks
2. **Code Generation:** AI agents generate code files
3. **Integration:** Merges code into your project
4. **Quality Validation:** Runs security scans, test coverage, traceability checks
5. **Git Commit:** Creates feature branch and commits changes

**Interactive Prompts:**
```
Estimated cost: $8-10
Proceed? (y/n): y

Running Task 1: Backend API Endpoints...
✓ Generated 3 files (src/api/profile/*.js)

Running Task 2: Frontend Components...
✓ Generated 2 files (src/components/Profile/*.jsx)

Integration Check...
✓ No conflicts detected
✓ ESLint: All checks passed
✓ Tests: 23/23 passing

Create git commit? (y/n): y
✓ Created branch: feature/user-profile-001
✓ Committed: "feat: Add user profile page"

Done! Review the code and merge when ready.
```

**Dry Run (No API Costs):**
```bash
npm run implement-spec specs/features/001-user-profile.md --dry-run
```

Shows what would be generated without actually calling AI.

---

## Understanding the Output

### Directory Structure After Implementation

```
your-project/
├── specs/
│   └── features/
│       ├── 001-user-profile.md           # Your spec
│       └── 001-user-profile.REVIEW.md    # Review findings (if run)
├── src/
│   ├── api/
│   │   └── profile/
│   │       ├── get-profile.js            # Generated
│   │       └── update-profile.js         # Generated
│   └── components/
│       └── Profile/
│           ├── ProfileView.jsx           # Generated
│           └── ProfileEdit.jsx           # Generated
├── tests/
│   ├── unit/
│   │   └── user-profile.test.js          # Generated
│   ├── integration/
│   │   └── user-profile.integration.test.js  # Generated
│   └── e2e/
│       └── user-profile.e2e.test.js      # Generated
└── .specmas/
    ├── tasks/
    │   └── 001-user-profile-tasks.json   # Task breakdown
    └── reports/
        ├── 001-user-profile-validation.md    # QA report
        └── 001-user-profile-traceability.md  # Requirements → Code map
```

### What to Review

**Always Review (Critical):**
1. **Security:** Check auth, validation, SQL injection protection
2. **Business Logic:** Ensure rules are correctly implemented
3. **Error Handling:** Verify edge cases are handled

**Spot Check (Important):**
1. **Database Queries:** Check for N+1 queries, proper indexing
2. **API Contracts:** Verify request/response formats
3. **Tests:** Run tests and check coverage

**Optional Review:**
1. **Code Style:** AI usually follows best practices
2. **Comments:** AI adds helpful comments
3. **Imports:** AI uses correct dependencies

**Trust but Verify:** AI is good at ~85-90% of code. Your job is the critical 10-15%.

---

## Cost Management

### Budgeting Guidelines

**Monthly Budget Tiers:**

| Budget | Features/Month | Best For |
|--------|----------------|----------|
| $20-50 | 5-10 EASY | Learning, side projects |
| $50-150 | 15-25 mixed | Building MVP |
| $150-300 | 30-50 mixed | Full product development |

### Cost Control Strategies

**1. Start Small**
```bash
# Generate only backend first
npm run implement-spec specs/features/001-user-profile.md --tasks backend

# Review and test, then generate frontend
npm run implement-spec specs/features/001-user-profile.md --tasks frontend
```

**2. Use Cost Limits**
```bash
# Set max cost in .env
MAX_COST_PER_FEATURE=10.00
BUDGET_ALERT_THRESHOLD=100.00
```

**3. Dry Run First**
```bash
# Always check cost before running
npm run decompose-tasks specs/features/001-user-profile.md
```

**4. Optimize Specs**
- Shorter specs = lower costs
- Clear acceptance criteria = fewer retries
- Better maturity level = better output

### Cost Tracking

**View Spending:**
```bash
npm run metrics

# Output:
# This Month: $87.50
# Features: 12
# Avg Cost/Feature: $7.29
# Budget Remaining: $62.50 (41%)
```

**Cost Reports:**
```
.specmas/costs/
├── 2025-10.json          # Monthly costs
└── by-feature.json       # Per-feature breakdown
```

---

## Team Workflow

### Solo Developer

**Daily Workflow:**
1. Morning: Write 1-2 specs (30-60 min)
2. Afternoon: Run implementation (1-2 hours)
3. Evening: Review & test (30-60 min)

**Weekly Target:** 3-5 features shipped

### 2-3 Person Team

**Roles:**
- **Spec Writer:** Focuses on requirements and acceptance criteria
- **Reviewer:** Reviews AI-generated code, handles complex logic
- **QA/Integration:** Runs tests, merges features

**Workflow:**
```
Monday:
  - Team: Review last week, plan this week's features
  - Spec Writer: Write 2-3 specs

Tuesday-Thursday:
  - Spec Writer: Validate and run implementations
  - Reviewer: Review generated code, add complex logic
  - QA: Test features, create git commits

Friday:
  - QA: Final testing, merge to main
  - Team: Sprint review, retro
```

**Weekly Target:** 8-12 features shipped

### Async/Remote Teams

**Key Practices:**
1. **Specs are the contract** - Write detailed specs, async implementation
2. **Use git branches** - Each feature gets own branch
3. **Review via GitHub PRs** - AI generates code → PR → human review
4. **Track in Linear/Notion** - Sync specs with project management tools

**Tools:**
- Specs in Git (single source of truth)
- AI implementation in CI/CD (GitHub Actions)
- Code review in GitHub
- Coordination in Slack/Discord

---

## Scaling Strategies

### Month 1: Learning Phase

**Goals:**
- Ship 8-12 EASY features
- Learn the spec template
- Understand validation gates
- Get comfortable with AI review

**Focus:**
- Quality over quantity
- Iterate on specs
- Build muscle memory

**Budget:** $20-50

### Months 2-3: MVP Phase

**Goals:**
- Ship 15-25 features/month
- Mix of EASY (60%), MODERATE (30%), HIGH (10%)
- Build core product features
- Establish team workflow

**Focus:**
- Sustainable velocity
- Test coverage >80%
- Security best practices

**Budget:** $50-150/month

### Months 4-6: Scale Phase

**Goals:**
- Ship 30-50 features/month
- Complex features with confidence
- Parallel development
- Team coordination

**Focus:**
- Developer efficiency
- Code quality
- User feedback integration

**Budget:** $150-300/month

### When to Upgrade to "WALK" Pattern

Move to advanced multi-team pattern when:
- Team grows to 4-5+ people
- Need parallel feature development
- Building multiple products
- >50 features/month

See [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) for WALK pattern details.

---

## Troubleshooting

### Common Issues

**Issue: "Validation score < 70"**

**Causes:**
- Missing sections (Overview, FRs, Security, Tests)
- Vague terms ("should", "fast", "good")
- Missing acceptance criteria

**Fix:**
```bash
# Check which gates failed
npm run validate-spec specs/features/your-feature.md

# Look for specific failures:
# ✗ G2 - Semantic: FAIL (55%) - Contains vague terms: should (5), fast (2)
# ✗ G4 - Invariants: FAIL (40%) - Only 2 deterministic tests (need 3)

# Fix issues and re-validate
```

**Issue: "AI implementation failed"**

**Causes:**
- API key issues
- Rate limiting
- Spec too vague
- Budget exceeded

**Fix:**
```bash
# Check API key
echo $AI_PROVIDER
npx claude auth  # or check OpenAI key

# Check rate limits
# Claude: 500 requests/day (Sonnet)
# OpenAI: Varies by plan

# Try with smaller tasks
npm run implement-spec your-spec.md --tasks backend --dry-run
```

**Issue: "Tests not generating"**

**Causes:**
- Missing acceptance criteria
- No deterministic tests in spec
- Parser couldn't extract criteria

**Fix:**
```bash
# Validate spec first
npm run validate-spec specs/features/your-feature.md

# Check G4 gate:
# ✗ G4 - Invariants: FAIL - No deterministic tests found

# Add deterministic tests to spec:
## Deterministic Tests

### DT-1: Valid Profile Update
Input: { name: "Alice", email: "alice@example.com" }
Output: { success: true, checksum: "a1b2c3d4" }
```

**Issue: "Generated code has bugs"**

**Expected:** AI gets 85-90% right, you fix the rest.

**Fix:**
1. Run tests: `npm test`
2. Check validation report: `.specmas/reports/*-validation.md`
3. Fix critical issues first (security, business logic)
4. File issues for patterns to improve

**Issue: "Costs are too high"**

**Causes:**
- Running full pipeline on HIGH complexity specs
- Not using dry-run first
- Generating too much code at once

**Fix:**
```bash
# Set budget limits in .env
MAX_COST_PER_FEATURE=15.00

# Use incremental generation
npm run decompose-tasks your-spec.md  # Check cost first
npm run implement-spec your-spec.md --tasks backend  # One at a time

# Use cheaper models for simple tasks
AI_MODEL_CLAUDE=haiku  # Faster, cheaper for EASY features
```

### Getting Help

**Documentation:**
- [Architecture](ARCHITECTURE.md) - System internals
- [Phase 2 Guide](docs/phase-2-review-system.md) - Adversarial reviews
- [Phase 3 Guide](docs/phase-3-test-generation-guide.md) - Test generation
- [CLI Reference](docs/cli-reference.md) - All commands

**Community:**
- GitHub Issues - Bug reports, feature requests
- Discussions - Questions, tips, showcases
- Discord (coming soon) - Real-time help

**Commercial Support:**
- Email: support@specmas.dev (coming soon)
- Custom training
- Architecture review
- Priority support

---

## Next Steps

**You're Ready!**

1. ✅ Spec-MAS is installed
2. ✅ You understand the workflow
3. ✅ You know how to manage costs
4. ✅ You have a team workflow plan

**Now:**

```bash
# Create your first spec
cp specs/TEMPLATE-STARTUP.md specs/features/001-your-feature.md

# Edit the spec (30-60 min)

# Validate it
npm run validate-spec specs/features/001-your-feature.md

# Ship it!
npm run implement-spec specs/features/001-your-feature.md
```

**Welcome to Spec-MAS!** 🚀

---

## Additional Resources

**Templates:**
- [specs/TEMPLATE-STARTUP.md](specs/TEMPLATE-STARTUP.md) - Feature spec template
- [specs/examples/](specs/examples/) - Example specs

**Guides:**
- [Writing Good Specs](docs/writing-good-specs.md) - Best practices (coming soon)
- [AI Best Practices](docs/ai-best-practices.md) - Optimizing AI output (coming soon)

**Reference:**
- [Maturity Levels](ARCHITECTURE.md#maturity-levels) - Level 1-5 explained
- [Complexity Tiers](ARCHITECTURE.md#complexity-tiers) - EASY/MODERATE/HIGH
- [Validation Gates](ARCHITECTURE.md#validation-gates) - G1-G4 details

---

**Questions?** Open an issue on GitHub or ask in Discussions!

**Building something cool?** Share it in Discussions → Show & Tell!

---

*Last Updated: October 25, 2025*
*Spec-MAS v3.0*
