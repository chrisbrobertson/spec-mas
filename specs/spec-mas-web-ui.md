---
specmas: v3
kind: FeatureSpec
id: feat-specmas-web-ui
name: Spec-MAS Web Control UI
version: 0.1.0
owners:
  - name: Chris
complexity: MODERATE
maturity: 3
tags: [webui, orchestration, observability]
---

# Overview
- Problem statement: Teams need a single UI to monitor runs, queue status, and configure agents.
- Out of scope: Editing specs directly in the UI (v1).
- Success metrics: Operators can find run status in <30s and update agent config in <2 min.

# Functional Requirements
### FR-1: Live Run Dashboard
Display current run status per spec (phase, progress, last update, next step).
- **Validation Criteria:**
  - Given a run is active, When I open the dashboard, Then I see the current phase and next step.

### FR-2: Work Queue View
Show GitHub issue queue with status, labels, assignee, and latest agent comment.
- **Validation Criteria:**
  - Given issues exist, When I view the queue, Then each issue shows status and latest comment.

### FR-3: Issue Detail Panel
Provide issue detail with full comment history and links to artifacts.
- **Validation Criteria:**
  - Given an issue, When I open details, Then I see comments and artifact links.

### FR-4: Agent Registry Management
Allow enabling/disabling tools and selecting default models per agent.
- **Validation Criteria:**
  - Given registry entries, When I toggle enablement, Then it updates the stored config.

### FR-5: Alerts and Failures
Surface failures (gate failures, blocked issues, cost warnings) in a global alert panel.
- **Validation Criteria:**
  - Given a failure occurs, When I view alerts, Then the failure is visible with a link.

# Non-Functional Requirements
- Performance: Dashboard updates within 10s of backend state changes.
- Observability: UI logs load errors to a central log sink.

# Data Inventory
- Data classes: Run status, issues, agent registry (Internal)
- Retention: UI caches last 7 days of run history

# Security
- Authentication: Required (SSO or token)
- Authorization: Role-based (viewer/admin)
- Data handling: No PII stored
- Encryption: TLS in transit
- Audit & logging: Track agent registry changes

# Data Model
- Run { id, specId, phase, status, updatedAt, nextStep }
- Issue { id, title, labels, status, assignee, latestComment }
- Agent { id, provider, model, enabled }

# Interfaces & Contracts
- GET /api/ui/runs
- GET /api/ui/issues
- GET /api/ui/issues/:id
- GET /api/ui/agents
- PATCH /api/ui/agents/:id

# Acceptance Tests
### Acceptance Criteria
- [ ] AT-1: Given a run exists, When I open dashboard, Then I see phase and next step.
- [ ] AT-2: Given issues exist, When I open queue, Then I see labels and latest comment.
- [ ] AT-3: Given an agent entry, When I disable it, Then it is no longer selectable for new issues.

# Risks & Open Questions
- R-1: UI performance with large issue queues.

