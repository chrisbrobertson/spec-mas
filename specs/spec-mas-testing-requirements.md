---
specmas: v3
kind: QASpec
id: qa-spec-mas-testing
name: Spec-MAS Testing Requirements
version: 1.1.0
owners:
  - name: Chris
complexity: MODERATE
maturity: 4
tags: [testing, qa, specmas, validation, traceability]
---

# Overview

## Purpose
Define comprehensive tests for Spec-MAS core capabilities: parsing, validation gates, traceability inference, CLI tools, pipeline orchestration, configuration, cost estimation, and reporting.

## Testing Philosophy
- Test pyramid: unit-heavy, focused integration, minimal e2e.
- Determinism: tests must be fully deterministic and avoid network dependence.
- No API mocks: tests must not mock external API calls. If a test would require a live API call, it must be explicitly gated behind environment variables and skipped when not configured.

## Testing Stack
- Unit/Integration/E2E: Jest
- Coverage: Jest coverage reporting

# Scope

## In Scope
- Markdown spec parsing with YAML front-matter
- Formal template section parsing and extraction
- Validation gates (G1-G4)
- Traceability inference from FR/AT patterns
- Traceability matrix report generation
- validate-spec CLI output and exit codes
- Config manager behavior
- Cost estimation for pipeline phases
- Spec analyzer (complexity and split recommendations)
- Pipeline orchestrator non-network behavior (state, phase selection)
- Coverage report analysis (when coverage data exists)

## Out of Scope
- External AI provider calls (OpenAI/Anthropic/etc)
- LangGraph orchestration runtime execution
- Network-dependent integrations

# Unit Testing Requirements

## 1. Spec Parser
- UP-PARSE-001: Parses YAML front-matter at file start
- UP-PARSE-002: Normalizes legacy fields (maturity_level -> maturity)
- UP-PARSE-003: Generates id from name when missing
- UP-PARSE-004: Handles front-matter after title
- UP-PARSE-005: Returns null front-matter when missing
- UP-PARSE-010: Parses H1 sections into normalized keys
- UP-PARSE-011: Parses H2 subsections into nested objects
- UP-PARSE-012: Recognizes formal template sections
- UP-PARSE-013: Extracts functional requirements with validation criteria
- UP-PARSE-014: Extracts acceptance criteria in Given/When/Then format
- UP-PARSE-015: Extracts deterministic tests from JSON code blocks

## 2. Validation Gates
- UP-G1-001: Missing required front-matter fails
- UP-G1-002: Invalid complexity fails
- UP-G1-003: Invalid maturity fails
- UP-G1-004: Required sections enforced by maturity
- UP-G2-001: Flags vague terms
- UP-G2-002: Requires validation criteria for each FR
- UP-G2-003: Requires Given/When/Then acceptance criteria
- UP-G2-004: Requires quantifiable success metrics
- UP-G2-005: Requires security coverage for MODERATE/HIGH
- UP-G3-001: Infers FR -> AT mapping by ID (FR-1 -> AT-1)
- UP-G3-002: Infers coverage by count when IDs are missing
- UP-G3-003: Fails when no acceptance criteria exist for FRs
- UP-G3-004: Does not require explicit Traceability section
- UP-G4-001: Requires deterministic tests for HIGH complexity
- UP-G4-002: Accepts deterministic tests with expected output (no checksum required)
- UP-G4-003: Rejects malformed JSON blocks

## 3. Config Manager
- UP-CONFIG-001: Loads defaults when no config files exist
- UP-CONFIG-002: Applies environment overrides
- UP-CONFIG-003: set() writes project config file
- UP-CONFIG-004: reset() removes config file

## 4. Cost Estimator
- UP-COST-001: estimateCost returns totals for valid spec
- UP-COST-002: skip options remove phases
- UP-COST-003: CostTracker accumulates costs

## 5. Spec Analyzer
- UP-ANALYZE-001: High-complexity spec triggers split recommendation
- UP-ANALYZE-002: Low-complexity spec does not trigger split

## 6. Traceability Matrix
- UP-TRACE-001: Extracts FR/US/AC requirements
- UP-TRACE-002: Maps tests by ID when present
- UP-TRACE-003: JSON report format includes traceability

# Integration Testing Requirements

## 7. validate-spec CLI
- IT-CLI-001: Valid spec exits 0 and reports PASS for all applicable gates
- IT-CLI-002: Invalid spec exits non-zero and reports failed checks
- IT-CLI-003: JSON report contains metadata and gate status

## 8. traceability CLI
- IT-TRACE-001: Generates matrix report file
- IT-TRACE-002: Supports JSON output format

## 9. Pipeline Orchestrator (offline)
- IT-PIPE-001: Applicable phases respect skip flags
- IT-PIPE-002: State file is created and updated

# E2E Testing Requirements

## 10. Spec-MAS CLI Smoke
- E2E-CLI-001: specmas validate <spec> runs without crash
- E2E-CLI-002: specmas traceability <spec> emits report
- E2E-BUILD-001: specmas run <spec> builds a project (gated by SPECMAS_E2E_BUILD=1 and API credentials)

# Deterministic Tests

```json
{"id":"DT-001","description":"Parse front-matter and sections","preconditions":"Spec file exists","input":"parseSpec(file)","expected":"metadata.name set; sections.overview set"}
```

```json
{"id":"DT-002","description":"G3 inferred traceability","preconditions":"Spec has FR-1 and AT-1","input":"runAllGates(spec)","expected":"G3 passed"}
```

# Acceptance Tests

## User Stories
- As a maintainer, I want validation to enforce structure and semantics so that specs are consistently actionable.
- As a maintainer, I want traceability to be inferred from IDs so that explicit mapping is optional.
- As a maintainer, I want CLI validation to fail fast on invalid specs so that errors are caught early.

## Acceptance Criteria
- [ ] AT-1: Given a valid spec, When I run validate-spec, Then all applicable gates pass.
- [ ] AT-2: Given a spec missing front-matter, When I run validate-spec, Then it fails with a clear error.
- [ ] AT-3: Given FR-1 and AT-1, When G3 runs, Then traceability is inferred and passes.
- [ ] AT-4: Given HIGH complexity without deterministic tests, When G4 runs, Then it fails.
