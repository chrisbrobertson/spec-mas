---
specmas: 3.0
kind: feature
id: feat-example-001
name: Example Feature Name
complexity: EASY
maturity: 3
owner: YourName
created: 2025-10-25
updated: 2025-10-25
status: draft
tags: [backend, frontend, api]
---

# Example Feature Name

<!--
INSTRUCTIONS:
1. Replace all placeholder text with your actual content
2. Delete these instruction comments
3. Fill out EVERY section - validation requires them
4. Aim for Maturity Level 3-4 for first spec (not perfect)
5. Target validation score: 70-80/100

COMPLEXITY GUIDE:
- EASY: Single entity CRUD, simple UI, <1 week
- MODERATE: Multiple entities, integration, 1-2 weeks
- HIGH: Complex workflows, multiple services, 2-4 weeks

QUICK START:
1. Copy this file: cp specs/TEMPLATE-STARTUP.md specs/features/001-your-feature.md
2. Fill out front-matter above (YAML between ---s)
3. Fill out all ## sections below
4. Validate: npm run validate-spec specs/features/001-your-feature.md
5. Iterate until score > 70
-->

## Overview

### Problem Statement

<!--
What problem are you solving?
- Be specific: Who has this problem?
- Quantify impact: How often does it occur?
- Explain pain: Why is the current state bad?

GOOD EXAMPLE:
"Sales team spends 3-4 hours/week manually copying customer data from
email into CRM. This causes data entry errors (15% of records have typos)
and delays follow-up by 1-2 days, resulting in 10% lower conversion rates."

BAD EXAMPLE:
"Users need a better way to manage data."
-->

[Describe the specific problem this feature solves. Include who is affected, how often, and the impact of NOT solving it.]

### Goals

<!--
What do you want to achieve?
- Be specific and measurable
- Include success metrics
- Keep to 3-5 goals max

GOOD EXAMPLES:
- Reduce manual data entry time by 80% (from 4hrs to <1hr/week)
- Achieve 95%+ data accuracy (vs current 85%)
- Enable same-day follow-up for 100% of leads
-->

- **Goal 1:** [Specific, measurable goal]
- **Goal 2:** [Specific, measurable goal]
- **Goal 3:** [Specific, measurable goal]

### Success Metrics

<!--
How will you measure success?
- Use numbers and thresholds
- Include both user and system metrics
- Make them testable

GOOD EXAMPLES:
- Response time < 2 seconds (p95)
- User task completion < 30 seconds
- Error rate < 1%
- User satisfaction score > 4/5

BAD EXAMPLES:
- Fast response time
- Users are happy
- System is reliable
-->

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric name] | [Numeric target] | [How to measure] |
| Response time (p95) | < 2 seconds | API monitoring |
| Task completion time | < 30 seconds | User analytics |
| Error rate | < 1% | Error logs |

### Scope

#### In Scope

<!--
What IS included in this feature?
- List specific capabilities
- Be concrete and detailed

EXAMPLE:
- Display list of active customers
- Search customers by name, email, or ID
- View customer details (name, email, phone, orders)
- Export customer list to CSV
-->

- [Specific capability 1]
- [Specific capability 2]
- [Specific capability 3]

#### Out of Scope

<!--
What is NOT included?
- Helps set boundaries
- Prevents scope creep

EXAMPLE:
- Customer editing (future feature)
- Bulk operations (defer to v2)
- Advanced filtering (not needed for MVP)
-->

- [Out of scope item 1]
- [Out of scope item 2]
- [Out of scope item 3]

---

## User Stories

<!--
Who will use this and why?
- Format: "As a [role], I want to [action] so that [benefit]"
- 3-6 stories that cover main use cases
- Include different user types

GOOD EXAMPLE:
"As a sales rep, I want to search customers by company name so that
I can quickly find the right contact before a meeting."

BAD EXAMPLE:
"User can search."
-->

### US-1: [Story Title]

**As a** [user role]
**I want to** [action/capability]
**So that** [business value/benefit]

**Acceptance Criteria:**
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

### US-2: [Story Title]

**As a** [user role]
**I want to** [action/capability]
**So that** [business value/benefit]

**Acceptance Criteria:**
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]

### US-3: [Story Title]

**As a** [user role]
**I want to** [action/capability]
**So that** [business value/benefit]

**Acceptance Criteria:**
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]

---

## Functional Requirements

<!--
WHAT the system must do (not HOW).
- Each requirement gets an ID (FR-1, FR-2, etc.)
- Include validation criteria
- Be specific and testable
- Aim for 3-7 requirements (EASY), 8-12 (MODERATE), 12+ (HIGH)

STRUCTURE:
- Description: Clear statement of requirement
- Validation Criteria: How to verify it works
- Priority: MUST/SHOULD/NICE (start with MUST only)
- Dependencies: What else is needed
-->

### FR-1: [Requirement Name]

**Description:**
[Clear, specific statement of what the system must do]

**Validation Criteria:**
- [How to verify this works - criterion 1]
- [How to verify this works - criterion 2]
- [How to verify this works - criterion 3]

**Priority:** MUST
**Dependencies:** [List other FRs, systems, or "None"]

**Example:**
```
Input: [Example input]
Output: [Expected output]
```

### FR-2: [Requirement Name]

**Description:**
[Clear, specific statement]

**Validation Criteria:**
- [Testable criterion 1]
- [Testable criterion 2]

**Priority:** MUST
**Dependencies:** FR-1

### FR-3: [Requirement Name]

**Description:**
[Clear, specific statement]

**Validation Criteria:**
- [Testable criterion 1]
- [Testable criterion 2]

**Priority:** MUST
**Dependencies:** None

<!-- Add more FRs as needed -->

---

## Non-Functional Requirements

<!--
HOW the system should behave.
Include: performance, reliability, scalability, usability
-->

### Performance

<!--
Response times, throughput, resource usage
Be specific with numbers!

GOOD:
- API responses < 500ms (p95)
- Page load < 2s (p95)
- Support 100 concurrent users

BAD:
- Fast responses
- Quick page loads
- Handle many users
-->

- **Response Time:** [Specific target, e.g., "< 500ms for 95% of requests"]
- **Throughput:** [Requests per second target]
- **Resource Usage:** [Memory, CPU limits]

### Reliability

<!--
Uptime, error rates, data integrity
-->

- **Uptime:** [Target, e.g., "99.9% uptime (< 43 minutes downtime/month)"]
- **Error Rate:** [Target, e.g., "< 0.1% of requests fail"]
- **Data Integrity:** [How to ensure data consistency]

### Scalability

<!--
Growth expectations, scaling strategy
-->

- **Expected Growth:** [Users, data, traffic over time]
- **Scaling Strategy:** [Horizontal, vertical, caching, etc.]

### Usability

<!--
User experience requirements
-->

- **Task Completion Time:** [Target, e.g., "< 30 seconds for primary task"]
- **Learning Curve:** [Target, e.g., "New users productive in < 5 minutes"]
- **Accessibility:** [WCAG level, screen reader support, etc.]

### Observability

<!--
Logging, monitoring, alerting
-->

- **Logging:** [What to log, log levels, retention]
- **Monitoring:** [What metrics to track]
- **Alerting:** [What triggers alerts, who gets notified]

---

## Security

<!--
CRITICAL: Every spec needs security considerations.
Even simple features need auth, input validation, audit logging.
-->

### Authentication & Authorization

<!--
Who can access this feature and what can they do?
-->

**Authentication:**
- [How users authenticate, e.g., "JWT tokens from auth service"]
- [Session management]

**Authorization:**
- **Role:** [Role name] | **Permissions:** [What they can do]
- **Role:** [Role name] | **Permissions:** [What they can do]

**Example:**
```
Role: Admin | Can: Create, read, update, delete all records
Role: User  | Can: Read own records only
Role: Guest | Can: Read public records only
```

### Input Validation

<!--
How to prevent injection attacks and bad data
-->

- **All inputs must be validated** on server side (not just client)
- **Allowed characters:** [Specify allowed patterns]
- **Max lengths:** [Specify max lengths for each field]
- **SQL injection prevention:** [Use parameterized queries]
- **XSS prevention:** [Sanitize HTML output]

**Example:**
```
Field: email
- Pattern: Valid email format (RFC 5322)
- Max length: 255 characters
- Required: Yes
- Sanitization: Trim, lowercase
```

### Data Protection

<!--
Encryption, PII handling, data retention
-->

- **Encryption at rest:** [What data is encrypted, using what]
- **Encryption in transit:** [TLS version, certificate requirements]
- **PII handling:** [What data is considered PII, how it's protected]
- **Data retention:** [How long data is kept, deletion policy]

### Audit Logging

<!--
What actions are logged for security audits
-->

Log the following events:
- [Event 1: e.g., "User login attempts (success and failure)"]
- [Event 2: e.g., "Data modifications (who, what, when)"]
- [Event 3: e.g., "Permission changes"]

**Log format:**
```json
{
  "timestamp": "2025-10-25T10:30:00Z",
  "userId": "user-123",
  "action": "UPDATE_PROFILE",
  "resource": "/api/users/123",
  "result": "SUCCESS",
  "ip": "192.168.1.1"
}
```

---

## Data Model

<!--
What data structures are needed?
- Define entities (tables/collections)
- Include fields with types
- Show relationships
- Specify indexes

Keep it simple for EASY features (1-3 entities)
MODERATE: 4-8 entities
HIGH: 8+ entities
-->

### Entity: [EntityName]

**Description:** [What this entity represents]

**Fields:**

| Field | Type | Required | Unique | Default | Validation | Description |
|-------|------|----------|--------|---------|------------|-------------|
| id | UUID | Yes | Yes | auto | - | Primary key |
| [field1] | String | Yes | No | - | Max 255 chars | [Description] |
| [field2] | Integer | No | No | 0 | >= 0 | [Description] |
| createdAt | DateTime | Yes | No | now() | - | Creation timestamp |
| updatedAt | DateTime | Yes | No | now() | - | Last update timestamp |

**Indexes:**
- Primary: `id`
- Secondary: `[field1]` (for fast lookups)

**Relationships:**
- `belongsTo` [OtherEntity] via `[foreignKey]`
- `hasMany` [OtherEntity]

**Example Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "field1": "example value",
  "field2": 42,
  "createdAt": "2025-10-25T10:00:00Z",
  "updatedAt": "2025-10-25T10:00:00Z"
}
```

### Entity: [AnotherEntity]

<!-- Repeat structure above for each entity -->

---

## API Specification

<!--
Define API endpoints
Include request/response formats
Specify error codes

For frontend-only features, you can skip this section.
-->

### Endpoint: [GET /api/resource]

**Description:** [What this endpoint does]

**Authentication:** Required (JWT token)

**Request:**
```http
GET /api/resource?param1=value1 HTTP/1.1
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | String | No | [Description] |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "field1": "value1",
    "field2": 42
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid parameter",
  "code": "INVALID_PARAM"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

### Endpoint: [POST /api/resource]

**Description:** [What this endpoint does]

**Request:**
```http
POST /api/resource HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "field1": "value1",
  "field2": 42
}
```

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| field1 | String | Yes | Max 255 chars |
| field2 | Integer | No | >= 0 |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "field1": "value1",
    "field2": 42,
    "createdAt": "2025-10-25T10:00:00Z"
  }
}
```

<!-- Add more endpoints as needed -->

---

## User Interface

<!--
Describe the UI/UX
Include wireframes (text-based is fine)
Specify user flows
-->

### Main View

**Description:** [What this view shows and its purpose]

**Layout:**
```
┌─────────────────────────────────────┐
│ Header                              │
│ [Logo]  [Nav]  [User Menu]         │
├─────────────────────────────────────┤
│ Sidebar      │ Main Content         │
│              │                       │
│ [Nav Item 1] │ [Content Area]       │
│ [Nav Item 2] │                       │
│ [Nav Item 3] │ [Action Buttons]     │
│              │                       │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

**Components:**
1. **Header:** [Description of header elements]
2. **Sidebar:** [Description of sidebar navigation]
3. **Main Content:** [Description of main content area]
4. **Action Buttons:** [List of buttons and their actions]

**User Flow:**
1. User lands on page
2. User sees [what they see]
3. User clicks [action]
4. System responds with [response]
5. User sees [result]

### Form/Modal (if applicable)

**Description:** [What this form does]

**Fields:**
- **Field 1:** [Type, validation, placeholder text]
- **Field 2:** [Type, validation, placeholder text]

**Validation:**
- Real-time validation on blur
- Submit button disabled until valid
- Clear error messages

**Example:**
```
┌─────────────────────────┐
│  Create New Item        │
├─────────────────────────┤
│  Name: [______________] │
│  Email: [_____________] │
│  ✓ Valid email          │
│                         │
│  [Cancel]  [Create]     │
└─────────────────────────┘
```

---

## External Integrations

<!--
List any external services or APIs
Include authentication, rate limits, error handling
-->

### Integration: [Service Name]

**Purpose:** [Why this integration is needed]

**Authentication:**
- Type: [API key, OAuth, etc.]
- Credentials storage: [Environment variables, secrets manager]

**Endpoints Used:**
- `GET /api/endpoint1` - [Purpose]
- `POST /api/endpoint2` - [Purpose]

**Rate Limits:**
- [Requests per minute/hour]
- **Handling:** [How to handle rate limit errors]

**Error Handling:**
- **Timeout:** [Retry strategy]
- **Auth failure:** [What to do]
- **Service unavailable:** [Fallback behavior]

**Example Request:**
```javascript
const response = await fetch('https://api.service.com/endpoint', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Testing Strategy

<!--
How will this be tested?
Include unit, integration, and e2e test plans
-->

### Unit Tests

**Coverage Target:** 80%+

**Test Cases:**
- [Test case 1: e.g., "Validate email format correctly"]
- [Test case 2: e.g., "Calculate total correctly"]
- [Test case 3: e.g., "Handle null inputs gracefully"]

### Integration Tests

**Test Cases:**
- [Test case 1: e.g., "API endpoint returns correct data"]
- [Test case 2: e.g., "Database transaction commits correctly"]
- [Test case 3: e.g., "External service integration works"]

### End-to-End Tests

**User Flows to Test:**
- [Flow 1: e.g., "User can complete signup flow"]
- [Flow 2: e.g., "User can create and edit item"]
- [Flow 3: e.g., "User sees error when validation fails"]

---

## Deterministic Tests

<!--
CRITICAL: These are concrete, reproducible tests with known outputs.
Must have at least 3 for validation to pass.
Include checksums or exact expected outputs.

Format:
- Test ID
- Input (exact data)
- Expected Output (exact result)
- Checksum (if applicable)
-->

### DT-1: [Test Name]

**Input:**
```json
{
  "field1": "test value",
  "field2": 42
}
```

**Expected Output:**
```json
{
  "success": true,
  "result": "processed",
  "checksum": "a1b2c3d4e5f6"
}
```

**Verification:**
- Checksum matches: `a1b2c3d4e5f6`
- Response time: < 100ms
- No errors in logs

### DT-2: [Test Name]

**Input:**
```json
{
  "field1": "",
  "field2": -1
}
```

**Expected Output:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field1": "Required field cannot be empty",
    "field2": "Must be >= 0"
  }
}
```

### DT-3: [Test Name]

**Input:**
```json
{
  "field1": "x".repeat(300),
  "field2": 0
}
```

**Expected Output:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field1": "Maximum length is 255 characters"
  }
}
```

### DT-4: [Edge Case Test]

**Description:** [What edge case this tests]

**Input:** [Exact input data]

**Expected Output:** [Exact expected output]

### DT-5: [Performance Test]

**Description:** Test response time under load

**Input:** 100 concurrent requests with valid data

**Expected Output:**
- p50: < 200ms
- p95: < 500ms
- p99: < 1000ms
- Error rate: 0%

---

## Deployment

<!--
How will this be deployed?
Include migration steps, rollback plan, monitoring
-->

### Prerequisites

- [Prerequisite 1: e.g., "Database schema updated"]
- [Prerequisite 2: e.g., "Environment variables configured"]
- [Prerequisite 3: e.g., "External service API key obtained"]

### Deployment Steps

1. **Prepare environment:**
   ```bash
   # Example commands
   export API_KEY=your_key_here
   ```

2. **Run database migrations:**
   ```bash
   npm run migrate
   ```

3. **Deploy application:**
   ```bash
   npm run build
   npm run deploy
   ```

4. **Verify deployment:**
   ```bash
   curl https://api.example.com/health
   ```

5. **Monitor for errors:**
   - Check error logs
   - Monitor response times
   - Verify user flows work

### Rollback Plan

**If deployment fails:**

1. **Identify issue:**
   - Check logs: `kubectl logs -f deployment/app`
   - Check metrics: [Monitoring dashboard URL]

2. **Rollback code:**
   ```bash
   git revert HEAD
   npm run deploy
   ```

3. **Rollback database (if needed):**
   ```bash
   npm run migrate:rollback
   ```

4. **Verify rollback successful:**
   - Test critical flows
   - Check error rates returned to baseline

### Monitoring

**Metrics to track:**
- Request rate
- Error rate
- Response time (p50, p95, p99)
- Database query performance
- External API call success rate

**Alerts to configure:**
- Error rate > 1%
- Response time p95 > 2s
- Any 5xx errors
- External service failures

---

## Open Questions

<!--
Things you're not sure about yet.
Remove this section before finalizing spec.
-->

- [ ] [Question 1: e.g., "Should we support file uploads in v1?"]
- [ ] [Question 2: e.g., "What's the expected data volume in year 1?"]
- [ ] [Question 3: e.g., "Do we need offline support?"]

---

## References

<!--
Links to relevant docs, designs, discussions
-->

- [Related Spec 1](link)
- [Design Doc](link)
- [Architecture Decision Record](link)
- [User Research](link)

---

## Changelog

<!--
Track changes to this spec
Format: YYYY-MM-DD - Description
-->

- **2025-10-25** - Initial draft created
- **2025-10-26** - Added security section after review
- **2025-10-27** - Updated data model based on feedback

---

<!--
VALIDATION CHECKLIST:
Before running validation, verify you have:
✓ Filled out ALL ## sections (don't delete any)
✓ Replaced all [placeholders] with real content
✓ Added at least 3 deterministic tests
✓ Specified numeric metrics (not vague terms)
✓ Included security considerations
✓ Defined data model completely
✓ Created 3-6 user stories
✓ Listed 3-7 functional requirements (for EASY)

RUN VALIDATION:
npm run validate-spec specs/features/your-feature.md

TARGET SCORE: 70-80/100 for first spec
AFTER FIXES: 85-95/100

NEXT STEPS:
1. Validate spec (score > 70)
2. Optional: Run adversarial review (npm run review-spec)
3. Generate tests (npm run generate-tests)
4. Check cost estimate (npm run decompose-tasks)
5. Generate code (npm run implement-spec)

GOOD LUCK! 🚀
-->
