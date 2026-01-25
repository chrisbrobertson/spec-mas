---
specmas: v3
kind: FeatureSpec
id: feat-specmas-issue-queue
name: GitHub Issues Work Queue
version: 0.1.0
owners:
  - name: Chris
complexity: MODERATE
maturity: 3
tags: [github, issues, orchestration]
---

# Overview
- Problem statement: Orchestrated work needs a durable, auditable queue.
- Out of scope: Non-GitHub trackers.
- Success metrics: 100% of tasks are represented as issues with status and agent assignment.

# Functional Requirements
### FR-1: Spec Decomposition to Issues
Decompose each spec into issues by task area (backend, frontend, tests, docs).
- **Validation Criteria:**
  - Given a spec, When decomposed, Then at least one issue is created per task area.

### FR-2: Issue Labeling
Apply required labels: `spec:<id>`, `phase:*`, `agent:*`, `area:*`.
- **Validation Criteria:**
  - Given an issue is created, When labels are applied, Then all required labels exist.

### FR-3: Agent Routing
Assign issues to agents based on `agent:<tool>` label.
- **Validation Criteria:**
  - Given `agent:claude`, When the queue is processed, Then Claude is selected.

### FR-4: Comment-Based Communication
All agent status updates and handoffs happen via issue comments with @mentions, using a structured update format (patterned after ai-coord run updates).
- **Validation Criteria:**
  - Given an agent completes work, When it comments, Then the comment includes STATUS and next action.

**Structured Update Format (Required)**
```
@agent-<tool> STATUS: <STARTED|BLOCKED|PASS|FAIL>
Run: <run-id>
Spec: <spec-id>
Issue: <issue-number>
Phase: <phase>
Completeness: <0-100>%
Findings:
- <gap or result>
Next:
- <next action or handoff>
Artifacts:
- <links to reports/commits>
```

### FR-5: Verification Workflow
Validator agents comment PASS/FAIL and link artifacts.
- **Validation Criteria:**
  - Given validation passes, When validator comments, Then issue is marked ready to close.

# Non-Functional Requirements
- Reliability: Issue creation and updates must be idempotent.
- Observability: Log all issue transitions.

# Data Inventory
- Data classes: Issue metadata, comments (Internal)
- Retention: Respect GitHub retention policies

# Security
- Authentication: GitHub App or PAT
- Authorization: Repo-scoped permissions
- Data handling: No PII stored
- Encryption: TLS in transit
- Audit & logging: Store issue events in audit log

# Data Model
- Issue { id, specId, labels, status, assignee, createdAt, updatedAt }
- Comment { id, issueId, author, body, createdAt }

# Interfaces & Contracts
- POST /api/issues/create
- POST /api/issues/comment
- GET /api/issues/:id
- GET /api/issues?specId=...

# Acceptance Tests
### Acceptance Criteria
- [ ] AT-1: Given a spec, When decomposed, Then issues are created with required labels.
- [ ] AT-2: Given a comment with @agent, When posted, Then it is visible in issue history.
- [ ] AT-3: Given validator PASS, When comment posted, Then issue can be closed.

# Risks & Open Questions
- R-1: GitHub rate limits under heavy automation.
