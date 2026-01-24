---
specmas: v3
kind: FeatureSpec
id: feat-specmas-agent-adapters
name: Spec-MAS Agent Adapter Layer (AI-Coord Compatible)
version: 0.1.0
owners:
  - name: Chris
complexity: MODERATE
maturity: 3
tags: [agents, tooling, ai-coord]
---

# Overview
- Problem statement: Spec-MAS needs a consistent way to invoke multiple AI CLIs (Claude/Codex/Gemini/DeepSeek) without changing core orchestration logic.
- Out of scope: Training models or building custom LLM runtimes.
- Success metrics: Adding a new CLI tool requires only a registry entry + command mapping.

# Functional Requirements
### FR-1: Tool Registry Compatibility
Support ai-coord-style tool registry definitions (name, command, version check, capabilities).
- **Validation Criteria:**
  - Given an ai-coord tool definition, When loaded, Then Spec-MAS can detect and invoke the tool.

### FR-2: Lead/Validator Role Mapping
Map Spec-MAS roles to tool permissions (lead = write, validator = read-only) using ai-coord patterns.
- **Validation Criteria:**
  - Given a validator role, When invoked, Then tool runs in read-only mode if supported.

### FR-3: Session State Interop
Persist run state in a compatible structure with ai-coord sessions (`.ai-coord/`-like metadata) for shared visibility.
- **Validation Criteria:**
  - Given a run, When state is written, Then it includes per-spec cycles and validation results.

### FR-4: Adapter Commands
Allow tool command templates to be configured via Web UI agent registry.
- **Validation Criteria:**
  - Given a new tool, When added in UI, Then it can be selected by issue label `agent:<tool>`.

# Non-Functional Requirements
- Reliability: Tool invocation must enforce timeouts and capture stdout/stderr.
- Security: Tools run with least privilege by role.

# Data Inventory
- Data classes: Tool registry config, session state (Internal)
- Retention: Session history 30 days

# Security
- Authentication: N/A
- Authorization: N/A
- Data handling: No PII stored
- Encryption: N/A
- Audit & logging: Log tool invocations and outcomes

# Interfaces & Contracts
- Tool registry schema compatible with ai-coord `TOOL_DEFINITIONS`
- Session state schema compatible with ai-coord `sessions/<id>.json`

# Acceptance Tests
### Acceptance Criteria
- [ ] AT-1: Given Claude CLI available, When selected as lead, Then Spec-MAS can execute it.
- [ ] AT-2: Given Codex CLI available, When selected as validator, Then it runs in read-only mode.
- [ ] AT-3: Given DeepSeek CLI registered, When label agent:deepseek is set, Then it is selected.

# Risks & Open Questions
- R-1: Vendor CLI breaking changes.

