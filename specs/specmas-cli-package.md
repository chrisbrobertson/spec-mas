---
specmas: v3
kind: FeatureSpec
id: feat-specmas-cli-package
name: Spec-MAS CLI NPM Package
version: 0.1.0
owners:
  - name: Chris
complexity: EASY
maturity: 3
tags: [cli, npm, distribution]
---

# Overview
- Problem statement: Spec-MAS CLI should be installable via npm like `aic`.
- Out of scope: GUI installer.
- Success metrics: `npx specmas --help` works in <30s.

# Functional Requirements
### FR-1: Publishable NPM Package
Provide `specmas` npm package with a `specmas` bin entry.
- **Validation Criteria:**
  - Given npm package, When installed globally, Then `specmas` command is available.

### FR-2: Local Execution via npx
Support `npx specmas` without global install.
- **Validation Criteria:**
  - Given package published, When running `npx specmas validate <spec>`, Then CLI executes.

### FR-3: Version Output
`specmas --version` prints the package version.
- **Validation Criteria:**
  - Given CLI, When `--version`, Then output matches package.json.

# Non-Functional Requirements
- Performance: CLI startup <2s.

# Data Inventory
- Data classes: None

# Security
- Authentication: N/A
- Authorization: N/A
- Data handling: No PII
- Encryption: N/A
- Audit & logging: Log CLI errors to stderr

# Interfaces & Contracts
- bin: `specmas`
- package.json `bin` entry

# Acceptance Tests
### Acceptance Criteria
- [ ] AT-1: Given npm install -g specmas, When running specmas --help, Then help is shown.
- [ ] AT-2: Given npx specmas, When running validate, Then it executes.

# Risks & Open Questions
- R-1: NPM publishing permissions.

