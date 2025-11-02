# Spec-MAS Validation Integration Guide

## Purpose

This guide explains how validation is integrated into the Claude Project specification workflow to ensure specs are syntactically correct and complete before marking them as agent-ready.

## Validation Overview

Spec-MAS uses a multi-gate validation system to ensure specifications meet quality standards:

- **G1: Structure & Format** - YAML front-matter, required sections
- **G2: Content Completeness** - All required fields populated, no placeholders
- **G3: Testability** - Acceptance criteria, deterministic tests
- **G4: Implementation Readiness** - Clear requirements, specific criteria

## When Validation Occurs

### During Development (Advisory)
- **Level 2-3 transition**: Light validation check on structure
- **Level 4-5 transition**: More comprehensive check
- **User requests `/validate`**: Full validation run

### Before Completion (Mandatory)
- **Before marking as "agent-ready"**: Full validation required
- **Before `/export`**: Validation must pass
- **Final handoff**: User should run CLI validator to confirm

## What Validation Checks

### 1. YAML Front-Matter (G1)

**Required Structure:**
```yaml
---
specmas: 3.0
kind: feature
id: feat-[name]
name: Feature Name
complexity: EASY|MODERATE|HIGH
maturity: 1|2|3|4|5
owner: Name
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft|review|approved
tags: [tag1, tag2]
---
```

**Validation Rules:**
- ✅ Front-matter must exist and be valid YAML
- ✅ All required fields must be present
- ✅ `complexity` must be EASY, MODERATE, or HIGH
- ✅ `maturity` must be 1-5
- ✅ `specmas` must be "3.0" or "v3"
- ✅ `kind` should be "feature" or "FeatureSpec"
- ✅ `id` should follow pattern: feat-[descriptive-name]

### 2. Required Sections (G1, G2)

**Based on Maturity Level:**

**Level 1-2 (All Complexity):**
```
## Overview
## User Stories
## Functional Requirements
```

**Level 3 (EASY):**
All above, plus:
```
## Non-Functional Requirements
## Security
## Data Model
## Testing Strategy
## Deterministic Tests
```

**Level 4 (MODERATE):**
All above, plus:
```
## API Specification (if applicable)
## External Integrations (if applicable)
## Deployment
```

**Level 5 (HIGH):**
All above, plus:
```
## Architecture & Design
## Compliance Requirements
## Monitoring & Observability
```

### 3. Functional Requirements (G2, G3)

**Each FR Must Have:**
- Unique ID (FR-1, FR-2, etc.)
- Clear description
- **Validation criteria** (at least 2)
- Priority (MUST/SHOULD/NICE)
- Dependencies (or "None")

**Example:**
```markdown
### FR-1: User Login

**Description:**
Users must be able to log in using email and password.

**Validation Criteria:**
- User can submit email and password
- Invalid credentials show error message
- Valid credentials redirect to dashboard
- Session persists across page refreshes

**Priority:** MUST
**Dependencies:** None
```

### 4. Deterministic Tests (G3)

**Requirements:**
- **Minimum 3 tests** (5+ recommended)
- Concrete input data
- Exact expected output
- Checksums or specific values
- No ambiguous results

**Example:**
```markdown
### DT-1: Valid Login

**Input:**
```json
{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

**Expected Output:**
```json
{
  "success": true,
  "userId": "user-123",
  "token": "[JWT token]",
  "expiresIn": 3600
}
```

**Verification:**
- Response status: 200
- Token is valid JWT
- User object contains id and email
- No errors in logs
```

### 5. Security Section (G2, G4)

**Must Include:**
- Authentication method
- Authorization rules (roles/permissions)
- Input validation approach
- Data protection (encryption)
- Audit logging requirements

**Cannot be empty or placeholder!**

### 6. Data Model (G2, G4)

**Must Include:**
- At least 1 entity definition
- Field names and types
- Required/optional flags
- Relationships (if any)
- Example records

**Cannot be:** "TBD", "[To be defined]", or empty

## Validation Process in Claude Project

### Phase 1: Continuous Monitoring
As users provide information:
- Track which sections have been completed
- Monitor for placeholder text
- Check for vague requirements
- Warn about missing validation criteria

### Phase 2: Pre-Completion Check
Before declaring spec complete:
```
🔍 **Running Pre-Completion Validation...**

**Structure Check:**
✓ YAML front-matter present
✓ All required sections present

**Content Check:**
✓ No [placeholder] text found
✓ All FRs have validation criteria
✓ Security section complete
✓ Data model defined

**Testability Check:**
✓ 5 deterministic tests defined
✓ All tests have concrete inputs/outputs
✓ Acceptance criteria present

**Ready for final validation!**
```

### Phase 3: Full Validation
When user requests `/validate` or before `/export`:

```
🔍 **Running Full Validation...**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**YAML Front-Matter**
✓ Valid YAML syntax
✓ specmas: 3.0
✓ kind: feature  
✓ id: feat-user-auth
✓ name: User Authentication
✓ complexity: MODERATE
✓ maturity: 4
✓ All required fields present

**Required Sections (Maturity 4)**
✓ Overview
✓ User Stories (3 defined)
✓ Functional Requirements (6 defined)
✓ Non-Functional Requirements
✓ Security
✓ Data Model (2 entities)
✓ API Specification (8 endpoints)
✓ Testing Strategy
✓ Deterministic Tests (5 defined)
✓ Deployment

**Content Quality**
✓ No placeholder text found
✓ All FRs have validation criteria
✓ All user stories have acceptance criteria
✓ Security section complete (auth + authz + input validation + logging)
✓ Data model complete with example records

**Testability**
✓ 5 deterministic tests defined
✓ All tests have concrete inputs
✓ All tests have exact expected outputs
✓ Test coverage: CRUD + edge cases + errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **VALIDATION PASSED!**

**Readiness Score:** 92/100

This specification is **agent-ready** and can proceed to implementation.

**Next Steps:**
1. Save as: specs/features/user-auth.md
2. Confirm: npm run validate-spec specs/features/user-auth.md
3. Optional: npm run analyze-spec specs/features/user-auth.md
4. Generate: npm run generate-tests specs/features/user-auth.md
5. Implement: npm run implement-spec specs/features/user-auth.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 4: Issue Reporting
If validation fails:

```
⚠️ **VALIDATION ISSUES FOUND**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Critical Issues (Must Fix):**

❌ **Missing YAML Field:** 'maturity'
   → Add to front-matter: maturity: 4

❌ **Incomplete FR-3:** Missing validation criteria
   → Add at least 2 validation criteria to FR-3

❌ **Insufficient Tests:** Only 2 deterministic tests (need 3+)
   → Add at least 1 more deterministic test

❌ **Empty Section:** Security section is placeholder
   → Define auth method, authz rules, input validation, audit logging

**Warnings (Should Fix):**

⚠️ **Data Model:** Only 1 entity defined, relationships unclear
   → Add related entities or clarify this is standalone

⚠️ **NFRs:** Performance targets are vague ("fast response")
   → Specify: "< 500ms for 95% of requests"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Readiness Score:** 65/100 (Need 80+)

**To Fix:** Address all critical issues above, then run /validate again.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like me to help you fix these issues? I can:
1. Add the missing maturity field
2. Complete FR-3 with validation criteria
3. Add deterministic tests
4. Fill out the security section

Let me know which you'd like to tackle first!
```

## Common Validation Issues

### Issue 1: Missing Validation Criteria

**Problem:**
```markdown
### FR-1: User Login
**Description:** Users can log in
```

**Fixed:**
```markdown
### FR-1: User Login

**Description:** 
Users can log in using email and password combination.

**Validation Criteria:**
- Login form accepts email and password inputs
- Invalid credentials return 401 with error message
- Valid credentials return 200 with auth token
- Token expiry is set to 1 hour
- Failed login attempts are logged

**Priority:** MUST
**Dependencies:** None
```

### Issue 2: Vague Deterministic Tests

**Problem:**
```markdown
### DT-1: Login Test
**Input:** Valid credentials
**Expected:** Success
```

**Fixed:**
```markdown
### DT-1: Valid Login Credentials

**Input:**
```json
{
  "email": "test@example.com",
  "password": "ValidPass123!",
  "rememberMe": false
}
```

**Expected Output:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "test@example.com",
    "name": "Test User"
  },
  "expiresIn": 3600
}
```

**Verification:**
- HTTP Status: 200
- Token is valid JWT
- Token payload contains userId
- expiresIn = 3600 seconds
```

### Issue 3: Placeholder Security Section

**Problem:**
```markdown
## Security
[TBD - Will add security requirements]
```

**Fixed:**
```markdown
## Security

### Authentication & Authorization

**Authentication:**
- JWT tokens from auth service
- Token expiry: 1 hour
- Refresh token: 30 days
- Logout clears both tokens

**Authorization:**
| Role | Permissions |
|------|------------|
| Admin | Full access to all resources |
| User | Read/write own data only |
| Guest | Read public data only |

### Input Validation

- All inputs validated server-side
- Email: Valid RFC 5322 format, max 255 chars
- Password: Min 8 chars, must include uppercase, lowercase, number, symbol
- SQL injection prevention: Parameterized queries only
- XSS prevention: All HTML output sanitized

### Data Protection

- Passwords hashed with bcrypt (cost factor: 12)
- Tokens encrypted with AES-256
- HTTPS required for all endpoints
- PII encrypted at rest

### Audit Logging

Log all:
- Login attempts (success/failure)
- Password changes
- Permission changes
- Data access to sensitive resources

**Log Format:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "userId": "user-123",
  "action": "LOGIN_SUCCESS",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```
```

## Validation Commands

### In Claude Project
```
/validate              # Run full validation
/validate --fix        # Get guided fixes for issues
/validate --report     # Detailed report
```

### CLI Commands
```bash
# Validate a spec
npm run validate-spec specs/features/my-feature.md

# Validate all specs
npm run validate-all

# JSON output
npm run validate-spec specs/features/my-feature.md --json

# Save report
npm run validate-spec specs/features/my-feature.md --output report.txt
```

## Quality Thresholds

### Minimum (Agent-Ready):
- Score: 80/100
- All critical issues resolved
- All required sections present
- All FRs have validation criteria
- At least 3 deterministic tests
- Security section complete

### Target (High Quality):
- Score: 90/100
- All warnings addressed
- 5+ deterministic tests
- Comprehensive examples
- Clear acceptance criteria

### Excellent (Best Practice):
- Score: 95+/100
- Multiple examples per section
- Edge cases covered
- Performance targets specified
- Complete traceability matrix

## Integration Workflow

### Development Flow:
1. **Start spec** → Claude guides through levels
2. **Monitor quality** → Continuous validation feedback
3. **Level transitions** → Light validation checks
4. **Pre-completion** → Comprehensive validation
5. **Final export** → Full validation must pass
6. **CLI confirm** → User runs actual validator

### Quality Gates:
```
Level 1-2 → Structure check
Level 3   → Content check + basic testability
Level 4   → Full validation recommended
Level 5   → Full validation required
Export    → Full validation required (blocking)
```

## Best Practices

### DO:
- ✅ Validate frequently during development
- ✅ Fix issues as they're identified
- ✅ Use specific, measurable criteria
- ✅ Include concrete examples
- ✅ Complete all required sections
- ✅ Run CLI validator before handoff

### DON'T:
- ❌ Skip validation to "finish faster"
- ❌ Use placeholder text
- ❌ Use vague terms ("fast", "user-friendly")
- ❌ Leave sections empty
- ❌ Assume validation will pass without checking
- ❌ Ignore warnings

## Troubleshooting

### "Validation keeps failing on the same issue"
- Review the specific error message
- Check examples in this guide
- Ask Claude: "Can you show me a correct example for [section]?"
- Reference the template: specs/TEMPLATE-STARTUP.md

### "I don't understand what validation wants"
- Each error message includes what's missing
- Claude can explain: "/validate --explain"
- Look at passing examples in specs/examples/

### "Can I skip validation?"
- Not for agent-ready specs
- Validation ensures AI agents can implement without clarification
- Skipping validation = implementation will stall on questions

## Summary

Validation integration ensures:
1. **Syntactic correctness** - Proper structure and format
2. **Completeness** - All required information present
3. **Clarity** - Specific, actionable requirements
4. **Testability** - Can be verified and validated
5. **Agent-readiness** - AI can implement without human clarification

**Remember:** Validation is not a hurdle - it's a quality assurance step that saves time during implementation by catching issues early.
