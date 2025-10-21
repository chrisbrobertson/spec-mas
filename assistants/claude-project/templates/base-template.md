# [Feature Name] - Specification

---
specmas: v3
kind: FeatureSpec
id: feat-[xxxx]
name: [Human-Readable Feature Name]
version: 0.1.0
owners:
  - name: [Your Name]
    email: [your.email@example.com]
complexity: [EASY | MODERATE | HIGH]
maturity: 1
tags: [tag1, tag2]
---

## Overview

### Problem Statement
[Describe the problem this feature solves. What pain point does it address?]

### Scope
**In Scope:**
- [What this feature includes]
- [Key capability 2]
- [Key capability 3]

**Out of Scope:**
- [What this feature does NOT include]
- [Future enhancement 1]
- [Related but separate feature]

### Success Metrics
[How will we measure if this feature is successful?]
- [Metric 1: e.g., "80% of users complete the flow on first attempt"]
- [Metric 2: e.g., "Average completion time < 30 seconds"]
- [Metric 3: e.g., "Support tickets related to this feature < 5 per month"]

---

## Functional Requirements

### FR-1: [Requirement Title]
[Detailed description of the functional requirement]

**Validation Criteria:**
- [How to verify this requirement is met]
- [Specific conditions that must be true]
- [Measurable outcomes]

### FR-2: [Requirement Title]
[Detailed description]

**Validation Criteria:**
- [Validation criterion 1]
- [Validation criterion 2]

[Add more FRs as needed]

---

## Non-Functional Requirements

### Performance
- [Performance target with specific metrics]
- [Example: "Response time < 200ms at p95"]
- [Example: "Support 1,000 concurrent users"]

### Reliability & Scalability
- [Uptime targets]
- [Scalability requirements]
- [Resource constraints]

### Observability
- [Logging requirements]
- [Metrics to track]
- [Alerts to configure]

### Compliance & Privacy
- [Regulatory requirements (GDPR, HIPAA, etc.)]
- [Privacy considerations]
- [Data retention policies]

---

## Security

### Authentication
[How users authenticate to use this feature]
- [Authentication method]
- [Session management]

### Authorization
[Who can access what]
- [Role-based access rules]
- [Permission requirements]

### Data Handling
[How data is handled]
- **PII Classification:** [None | Low | Medium | High]
- **Data Retention:** [How long data is kept]
- **Data Deletion:** [Process for removing data]

### Encryption & Key Management
- **At Rest:** [Encryption method and key management]
- **In Transit:** [TLS version and configuration]
- **Key Rotation:** [Rotation policy if applicable]

### Audit & Logging
- **Coverage:** [What events to log]
- **Retention:** [How long logs are kept]
- **Tamper Evidence:** [How logs are protected]

---

## Data Model

### Entities
[Define the data structures]

```typescript
interface [EntityName] {
  // Define properties with types
  id: string;
  // ...
}
```

### Relationships
[Describe how entities relate to each other]
- [Entity A] has many [Entity B]
- [Entity B] belongs to [Entity A]

### Validation Rules
[Input validation and business rules]
- [Field]: [Validation rule]
- [Field]: [Constraint]

---

## Interfaces & Contracts

### APIs
[Document API endpoints if applicable]

```
POST /api/[resource]
Request:
{
  // Example request structure
}

Response 200:
{
  // Example response structure
}
```

### Events
[Document events/messages if applicable]
- **Event:** [event-name]
- **Payload:** [structure]
- **Trigger:** [when this event fires]

### External Integrations
[Document integrations with external systems]
- **System:** [External system name]
- **Purpose:** [Why we integrate]
- **Contract:** [API or protocol details]

---

## Deterministic Tests

[JSON test cases that define must-hold invariants]

```json
{
  "id": "DT-001",
  "description": "Describe what this test validates",
  "input": "Compact example input",
  "expected_checksum": "sha256-hash-of-expected-output"
}
```

```json
{
  "id": "DT-002",
  "description": "Another critical path test",
  "input": "Another example",
  "expected_checksum": "sha256-hash"
}
```

---

## Acceptance Tests

### User Stories

**Story 1:** As a [user type], I want [goal], so that [benefit].

**Story 2:** As a [user type], I want [goal], so that [benefit].

### Acceptance Criteria

- [ ] Given [context], When [action], Then [expected outcome]
- [ ] Given [context], When [action], Then [expected outcome]
- [ ] Given [context], When [action], Then [expected outcome]
- [ ] Given [context], When [action], Then [expected outcome]
- [ ] Given [context], When [action], Then [expected outcome]

[Minimum 5 criteria, typically 8-12]

---

## Glossary & Definitions

[Define domain-specific terms and disambiguate any vague language]

- **[Term]:** [Clear definition]
- **[Acronym]:** [What it stands for and means]
- **[Ambiguous word from spec]:** [Specific meaning in this context]

---

## Risks & Open Questions

### Risks
- **R-1:** [Risk description]
  - **Impact:** [High/Medium/Low]
  - **Mitigation:** [How to address]

- **R-2:** [Another risk]
  - **Impact:** [High/Medium/Low]
  - **Mitigation:** [Strategy]

### Open Questions
- **Q-1:** [Question that needs answering]
  - **Owner:** [Who will answer]
  - **Due:** [When answer is needed]

- **Q-2:** [Another question]
  - **Owner:** [Who will answer]
  - **Due:** [When needed]

---

## Notes

[Any additional context, assumptions, or considerations]

---

**Status:** 🟡 Draft - Level 1  
**Agent Ready:** ❌ No  
**Required Level:** [3 for EASY, 4 for MODERATE, 5 for HIGH]
