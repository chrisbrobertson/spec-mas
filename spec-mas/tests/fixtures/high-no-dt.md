---
specmas: v3
kind: FeatureSpec
id: feat-high-001
name: High Complexity Without DT
version: 0.1.0
owners:
  - name: Test Owner
complexity: HIGH
maturity: 4
tags: [test]
---

# Overview
- Problem statement: High complexity without deterministic tests
- Success metrics: 99% accuracy

# Functional Requirements
### FR-1: Do a thing
Do the thing.
- **Validation Criteria:**
  - Given input, When processed, Then output matches.

# Non-Functional Requirements
- Performance: <= 100ms

# Data Inventory
- Data classes: None

# Security
- Authentication: Required
- Authorization: Required
- Data handling: No PII
- Encryption & key management: TLS
- Audit & logging: Enabled

# Data Model
- Thing { id }

# Interfaces & Contracts
- API: /things

# Acceptance Tests
### Acceptance Criteria
- [ ] AT-1: Given input, When processed, Then output matches.

# Risks & Open Questions
- R-1: None

