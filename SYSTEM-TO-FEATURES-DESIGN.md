# System-to-Features Generation - Design Document

**Date:** 2025-11-01  
**Status:** Design Phase  
**Goal:** Enable automated/semi-automated creation of feature specs from System Architecture Spec

---

## Problem Statement

After creating a System Architecture Spec with an Implementation Roadmap, users need to create multiple individual feature specs. Currently this is manual and error-prone:

- ❌ **Repetitive:** Same boilerplate for each feature
- ❌ **Inconsistent:** Easy to miss cross-references or dependencies
- ❌ **Time-consuming:** Creating 8+ feature specs manually is tedious
- ❌ **Context loss:** System-level decisions not properly propagated to features

**Example Roadmap from System Spec:**
```markdown
## 8.1 Feature Spec Breakdown
1. Auth Service Feature Spec (Level 4)
2. API Gateway Setup (Level 3)
3. User Profile Service (Level 3)
4. Product Service (Level 4)
5. Order Service (Level 4)
6. Billing Service (Level 5)
7. Notification Service (Level 3)
8. Admin Dashboard (Level 3)
```

**Need:** Way to generate all 8 feature specs efficiently with proper context.

---

## Proposed Solution: Hybrid Approach

### Two-Stage Process

**Stage 1: CLI Tool - Automated Generation**
- Parse System Architecture Spec
- Extract roadmap and component details
- Generate feature spec **stubs** with boilerplate
- Inject system context into each stub
- Create cross-references between specs

**Stage 2: Agent Refinement (Optional)**
- User works with Claude Project agent
- Agent reads stub + system spec
- Agent helps fill in detailed implementation
- Agent ensures consistency with system design

---

## Architecture

```
System Architecture Spec
         ↓
    [Parser Module]
         ↓
   Extract Components:
   - Component details
   - API contracts
   - Data models
   - Dependencies
   - Roadmap order
         ↓
    [Generator Module]
         ↓
   For each component:
   - Create feature spec stub
   - Inject system context
   - Add cross-references
   - Set metadata
         ↓
   Feature Spec Stubs (Markdown)
         ↓
   [Optional: Agent Refinement]
         ↓
   Complete Feature Specs
```

---

## Component 1: System Spec Parser

**File:** `.spec-mas/src/system/system-spec-parser.js`

### Responsibilities
1. Parse System Architecture Spec markdown
2. Extract component definitions
3. Extract API contracts between components
4. Extract data model relationships
5. Extract implementation roadmap
6. Extract cross-cutting concerns (auth, logging, etc.)

### Output Structure
```javascript
{
  systemMetadata: {
    id: 'sys-ecommerce',
    name: 'E-commerce Platform',
    complexity: 'MODERATE',
    maturity: 4
  },
  
  components: [
    {
      name: 'Auth Service',
      responsibility: 'Handle user authentication and authorization',
      technology: 'Node.js + Express',
      features: ['User registration', 'Login', 'JWT tokens'],
      apisExposed: [
        { method: 'POST', path: '/api/v1/auth/login', description: '...' },
        { method: 'POST', path: '/api/v1/auth/register', description: '...' }
      ],
      dependencies: [],
      featureSpecId: 'feat-auth-service'
    },
    // ... more components
  ],
  
  apiContracts: [
    {
      from: 'Auth Service',
      to: 'User Service',
      contract: { /* TypeScript interface */ }
    }
  ],
  
  dataArchitecture: {
    strategy: 'PostgreSQL primary, Redis cache',
    ownership: [
      { domain: 'Users, Auth', owner: 'Auth Service', access: 'Direct DB, cached' }
    ]
  },
  
  crossCuttingConcerns: {
    authentication: { /* auth model */ },
    logging: { /* logging strategy */ },
    security: { /* security requirements */ },
    performance: { /* performance targets */ }
  },
  
  roadmap: [
    {
      phase: 1,
      phaseName: 'Foundation',
      features: [
        {
          name: 'Auth Service Feature Spec',
          complexity: 'MODERATE',
          maturity: 4,
          dependencies: [],
          estimatedDays: '3-5',
          componentRef: 0  // Index into components array
        }
      ]
    }
  ]
}
```

---

## Component 2: Feature Spec Generator

**File:** `.spec-mas/src/system/feature-spec-generator.js`

### Responsibilities
1. Read parsed system spec data
2. Load feature spec template
3. For each component in roadmap:
   - Create feature spec file
   - Populate metadata from system spec
   - Inject component details
   - Add relevant API contracts
   - Add relevant data models
   - Add dependencies and cross-references
   - Set appropriate sections based on complexity/maturity

### Template Variables
```javascript
const templateVars = {
  // From component
  featureId: 'feat-auth-service',
  featureName: 'Auth Service',
  description: 'Handle user authentication and authorization',
  complexity: 'MODERATE',
  maturity: 4,
  technology: 'Node.js + Express',
  
  // From system spec
  systemId: 'sys-ecommerce',
  systemName: 'E-commerce Platform',
  
  // Extracted context
  authenticationModel: '/* from system spec */',
  securityRequirements: '/* from system spec */',
  performanceTargets: '/* from system spec */',
  loggingStrategy: '/* from system spec */',
  
  // Dependencies
  dependsOn: ['feat-none'],
  requiredBy: ['feat-user-profile', 'feat-product-service'],
  
  // API contracts
  apisExposed: [/* list */],
  apisConsumed: [/* list */],
  
  // Data
  dataOwnership: 'Users, Auth data',
  databaseStrategy: 'PostgreSQL primary, Redis cache'
};
```

### Generation Logic
```javascript
function generateFeatureSpec(component, systemSpec, roadmapItem) {
  const template = loadTemplate(component.complexity, component.maturity);
  
  // Populate metadata
  const frontMatter = generateFrontMatter(component, systemSpec, roadmapItem);
  
  // Populate sections
  const sections = {
    overview: generateOverview(component, systemSpec),
    userStories: generateUserStoryStubs(component),
    functionalRequirements: generateFRStubs(component),
    apiSpecification: generateAPISection(component, systemSpec),
    dataModel: generateDataModelSection(component, systemSpec),
    security: injectSecurityFromSystem(systemSpec),
    testing: generateTestingSection(component),
    deployment: injectDeploymentFromSystem(systemSpec)
  };
  
  // Combine into full spec
  return combineIntoMarkdown(frontMatter, sections);
}
```

---

## Component 3: CLI Tool

**File:** `.spec-mas/scripts/generate-feature-specs.js`

### Usage
```bash
# Generate all feature specs from system spec
npm run generate-features specs/architecture/system-ecommerce.md

# Generate specific feature
npm run generate-features specs/architecture/system-ecommerce.md --feature "Auth Service"

# Generate with options
npm run generate-features specs/architecture/system-ecommerce.md \
  --output-dir specs/features \
  --dry-run \
  --verbose

# Interactive mode
npm run generate-features:interactive specs/architecture/system-ecommerce.md
```

### CLI Flow
```
1. Parse system spec
   ✓ Found 8 components in roadmap
   ✓ Extracted API contracts
   ✓ Extracted data architecture

2. Preview generation plan
   Will create 8 feature specs:
   - feat-auth-service.md (MODERATE, Level 4) → specs/features/
   - feat-api-gateway.md (EASY, Level 3) → specs/features/
   - feat-user-profile.md (EASY, Level 3) → specs/features/
   - ... (5 more)
   
3. Confirm? [Y/n]

4. Generate feature specs
   ✓ Generated feat-auth-service.md (2.3 KB)
   ✓ Generated feat-api-gateway.md (1.8 KB)
   ✓ Generated feat-user-profile.md (1.9 KB)
   ... (5 more)
   
5. Summary
   ✓ Created 8 feature spec stubs
   ✓ All specs have system context
   ✓ Cross-references added
   
6. Next steps
   Review and refine each spec:
   1. Open feat-auth-service.md in Claude Project
   2. Use agent to fill in details
   3. Run: npm run validate-spec feat-auth-service.md
   4. Repeat for each feature
```

---

## Component 4: Agent Integration

**File:** Update `.spec-mas/agents/claude-project/system-prompt.md`

### New Command: `/generate-features`

**Purpose:** Help user iterate through system spec to create feature specs

**Agent Behavior:**
```
User: /generate-features

Agent: I'll help you generate feature specs from your system architecture spec.

**Step 1: Locate System Spec**
Where is your system architecture spec?
- If you have it open, paste the Implementation Roadmap section
- If it's a file, provide the path

**Step 2: Select Generation Mode**
1. **CLI Mode** (recommended) - Automated stub generation
   Run: npm run generate-features [system-spec-file]
   Then we'll refine each spec together

2. **Guided Mode** - I'll walk you through each feature
   We'll create each spec one by one with full context

3. **Single Feature Mode** - Create just one feature from the system
   Choose which component to spec out

Which mode would you like to use?
```

### New Workflow: Iterate Through Features

**Guided Mode Flow:**
```
Agent: Let's create feature specs from your system architecture.

I found 8 features in your roadmap:
1. Auth Service (MODERATE, Level 4) - No dependencies
2. API Gateway (EASY, Level 3) - Depends on: Auth Service
3. User Profile (EASY, Level 3) - Depends on: Auth Service
4. Product Service (MODERATE, Level 4) - Depends on: Auth Service
5. Order Service (MODERATE, Level 4) - Depends on: Auth, Product, User
6. Billing Service (HIGH, Level 5) - Depends on: Auth, Order
7. Notification Service (EASY, Level 3) - Depends on: Auth, Order, Billing
8. Admin Dashboard (EASY, Level 3) - Depends on: All above

**Recommended Order:** Following dependency chain (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8)

Let's start with #1: Auth Service

I'll create this spec with context from your system architecture:
- Authentication model: JWT tokens
- Security requirements: [from system spec]
- Data strategy: PostgreSQL + Redis
- API contracts: [relevant APIs]

Ready to begin? I'll guide you through:
- Overview (from component description)
- User Stories (for auth flows)
- Functional Requirements (detailed FRs)
- API Specification (endpoints from system spec)
- Data Model (auth tables)
- Security (system security model)
- Testing Strategy
- Deployment (from system deployment section)

Let's start with the Overview section...
```

---

## Component 5: Context Injection System

**Purpose:** Ensure each feature spec gets relevant context from system spec

### Context Mapping

**For Auth Service Feature Spec:**
```markdown
## Injected from System Spec

### Authentication Model (from System Spec)
This feature implements the authentication model defined in the system architecture:
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry
- Token payload: { userId, roles, permissions }
- Enforced at API Gateway level

[See System Architecture: sys-ecommerce.md#authentication-authorization-model]

### Security Requirements (from System Spec)
Security controls from system design:
- Input validation on all endpoints
- SQL injection prevention: Parameterized queries only
- Rate limiting: Per user, per endpoint
- Audit logging: All authentication events

[See System Architecture: sys-ecommerce.md#security-model]

### Performance Targets (from System Spec)
- API Response Time (p95): < 500ms
- Login endpoint: < 200ms
- Token validation: < 50ms

[See System Architecture: sys-ecommerce.md#performance-targets]

### Data Strategy (from System Spec)
- Primary DB: PostgreSQL (user credentials, sessions)
- Cache: Redis (active sessions, token blacklist)
- Ownership: This service owns Users, Sessions, Tokens tables

[See System Architecture: sys-ecommerce.md#data-architecture]
```

### Cross-Reference System

**In each feature spec:**
```yaml
---
# ... other metadata ...
system_spec: sys-ecommerce
related_specs:
  - id: sys-ecommerce
    relationship: implements_component
    component: "Auth Service"
  - id: feat-api-gateway
    relationship: consumed_by
    description: "API Gateway validates tokens from this service"
  - id: feat-user-profile
    relationship: enables
    description: "User Profile requires authentication from this service"
---
```

**In system spec (auto-updated):**
```yaml
---
# ... other metadata ...
feature_specs:
  - feat-auth-service
  - feat-api-gateway
  - feat-user-profile
  - feat-product-service
  - feat-order-service
  - feat-billing-service
  - feat-notification-service
  - feat-admin-dashboard
---
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (4-6 hours)

**Task 1.1: System Spec Parser**
- [ ] Create `.spec-mas/src/system/system-spec-parser.js`
- [ ] Parse markdown sections
- [ ] Extract components
- [ ] Extract API contracts
- [ ] Extract roadmap
- [ ] Extract cross-cutting concerns
- [ ] Write unit tests

**Task 1.2: Feature Spec Generator**
- [ ] Create `.spec-mas/src/system/feature-spec-generator.js`
- [ ] Load template based on complexity/maturity
- [ ] Populate metadata
- [ ] Inject system context
- [ ] Add cross-references
- [ ] Write unit tests

**Task 1.3: Feature Spec Templates (Complexity-aware)**
- [ ] Create `.spec-mas/templates/features/EASY-L3.md`
- [ ] Create `.spec-mas/templates/features/MODERATE-L4.md`
- [ ] Create `.spec-mas/templates/features/HIGH-L5.md`
- [ ] Add placeholder variables for injection

### Phase 2: CLI Tool (2-3 hours)

**Task 2.1: CLI Implementation**
- [ ] Create `.spec-mas/scripts/generate-feature-specs.js`
- [ ] Parse command line arguments
- [ ] Interactive mode
- [ ] Dry-run mode
- [ ] Verbose logging
- [ ] Error handling

**Task 2.2: Package.json Integration**
- [ ] Add `generate-features` script
- [ ] Add `generate-features:interactive` script
- [ ] Add `generate-features:dry-run` script
- [ ] Update documentation

### Phase 3: Agent Integration (2-3 hours)

**Task 3.1: System Prompt Updates**
- [ ] Add `/generate-features` command
- [ ] Add guided iteration workflow
- [ ] Add context injection instructions
- [ ] Add examples

**Task 3.2: Custom Instructions**
- [ ] Add feature generation mode
- [ ] Add iteration workflow
- [ ] Add context preservation rules

### Phase 4: Testing & Documentation (2-3 hours)

**Task 4.1: Testing**
- [ ] Create test system spec
- [ ] Generate features from test system
- [ ] Verify context injection
- [ ] Verify cross-references
- [ ] Test agent workflow

**Task 4.2: Documentation**
- [ ] Update README with generation workflow
- [ ] Create FEATURE-GENERATION-GUIDE.md
- [ ] Add examples
- [ ] Add troubleshooting

---

## Example Output

### Input: System Architecture Spec
```markdown
## 2.2 Component Details

#### Component 1: Auth Service
**Responsibility:** Handle user authentication and authorization

**Technology:** Node.js + Express

**Key Features:**
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control

**APIs Exposed:**
- POST /api/v1/auth/register - Register new user
- POST /api/v1/auth/login - Login and get token
- POST /api/v1/auth/logout - Logout and invalidate token
- POST /api/v1/auth/refresh - Refresh access token

**Dependencies:** None

**Feature Spec:** To be created
```

### Output: Generated Feature Spec Stub

**File:** `specs/features/feat-auth-service.md`

```markdown
---
specmas: 3.0
kind: feature
id: feat-auth-service
name: Auth Service
version: 1.0.0
complexity: MODERATE
maturity: 4
owner: [To be assigned]
created: 2025-11-01
updated: 2025-11-01
status: draft
tags: [authentication, security, backend]

# System Context
system_spec: sys-ecommerce
system_component: "Auth Service"

# Relationships
related_specs:
  - id: sys-ecommerce
    relationship: implements_component
    component: "Auth Service"
  - id: feat-api-gateway
    relationship: consumed_by
    description: "API Gateway validates tokens from this service"
  - id: feat-user-profile
    relationship: enables
    description: "Requires authentication"

# Dependencies
depends_on: []
required_by: [feat-api-gateway, feat-user-profile, feat-product-service]
---

# Auth Service Feature Specification

> **System Context:** This feature implements the Auth Service component from the [E-commerce Platform System Architecture](sys-ecommerce.md).

---

## 1. Overview

### 1.1 Purpose
This service handles user authentication and authorization for the E-commerce Platform system, providing secure user registration, login, and token-based authentication.

**System Component:** Auth Service  
**Responsibility:** Handle user authentication and authorization  
**Technology Stack:** Node.js + Express

### 1.2 Scope

**In Scope:**
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control

**Out of Scope:**
- OAuth/SSO integration (future phase)
- Multi-factor authentication (future phase)
- User profile management (separate service)

### 1.3 Success Criteria
- Support 10K concurrent authenticated users
- Login response time < 200ms (p95)
- Token validation < 50ms
- 99.9% authentication service uptime

---

## 2. System Architecture Context

> **Note:** The following sections are injected from the System Architecture Spec to ensure consistency.

### 2.1 Authentication Model
*[Injected from sys-ecommerce.md#authentication-authorization-model]*

This feature implements the system-wide authentication model:
- **JWT tokens** with 1-hour expiry (access tokens)
- **Refresh tokens** with 30-day expiry
- **Token payload:** `{ userId, roles, permissions }`
- **Enforcement:** At API Gateway level + service-level validation

### 2.2 Security Requirements
*[Injected from sys-ecommerce.md#security-model]*

Must implement these system security controls:
- Input validation on all endpoints
- SQL injection prevention via parameterized queries only
- Rate limiting per user, per endpoint
- Audit logging for all authentication events
- Password hashing with bcrypt (cost factor: 12)
- TLS 1.3 for all connections

### 2.3 Performance Targets
*[Injected from sys-ecommerce.md#performance-targets]*

- API Response Time (p95): < 500ms
- Login endpoint specifically: < 200ms
- Token validation: < 50ms
- Support 1000 req/sec throughput

### 2.4 Data Strategy
*[Injected from sys-ecommerce.md#data-architecture]*

- **Primary Database:** PostgreSQL (user credentials, sessions)
- **Cache Layer:** Redis (active sessions, token blacklist)
- **Data Ownership:** This service owns `users`, `sessions`, `tokens` tables
- **Access Pattern:** Direct DB write, Redis cache for reads

---

## 3. User Stories

**Note:** Detail these based on your specific requirements. Examples provided.

### Story 1: User Registration
As a new user, I want to register an account using my email and password, so that I can access the platform.

**Acceptance Criteria:**
- [ ] Given valid email and password, when I register, then my account is created and I receive a verification email
- [ ] Given an already registered email, when I try to register, then I see an error message
- [ ] Given an invalid email format, when I try to register, then I see a validation error

### Story 2: User Login
As a registered user, I want to log in with my credentials, so that I can access protected features.

**Acceptance Criteria:**
- [ ] Given valid credentials, when I log in, then I receive an access token and refresh token
- [ ] Given invalid credentials, when I try to log in, then I see an authentication error
- [ ] Given valid token, when I make API requests, then my requests are authenticated

### Story 3: Token Refresh
As an authenticated user, I want my session to persist without frequent re-login, so that I have a smooth experience.

**Acceptance Criteria:**
- [ ] Given an expired access token and valid refresh token, when I request a refresh, then I receive a new access token
- [ ] Given an invalid refresh token, when I request a refresh, then I receive an authentication error

### Story 4: Password Reset
As a user who forgot their password, I want to reset my password via email, so that I can regain access to my account.

**Acceptance Criteria:**
- [ ] Given my registered email, when I request password reset, then I receive a reset link
- [ ] Given a valid reset token, when I set a new password, then my password is updated
- [ ] Given an expired reset token, when I try to reset password, then I see an error

---

## 4. Functional Requirements

> **Note:** Add detailed validation criteria for each requirement.

### FR-1: User Registration
**Description:** System must allow new users to register with email and password.

**Validation Criteria:**
- [ ] Email must be valid RFC 5322 format, max 255 characters
- [ ] Password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, symbol)
- [ ] Email must not already exist in the system
- [ ] Verification email sent within 5 seconds
- [ ] User record created in database with hashed password

**Priority:** MUST  
**Dependencies:** None

---

### FR-2: User Login
**Description:** Registered users can log in with email and password to receive authentication tokens.

**Validation Criteria:**
- [ ] Valid credentials return 200 with access token and refresh token
- [ ] Invalid credentials return 401 with clear error message
- [ ] Token payload includes userId, roles, permissions
- [ ] Access token expires in 1 hour
- [ ] Refresh token expires in 30 days
- [ ] Failed login attempts logged for security monitoring

**Priority:** MUST  
**Dependencies:** FR-1

---

### FR-3: Token Validation
**Description:** System provides endpoint to validate JWT tokens for other services.

**Validation Criteria:**
- [ ] Valid token returns 200 with user info
- [ ] Expired token returns 401
- [ ] Invalid signature returns 401
- [ ] Response time < 50ms (p95)
- [ ] Checks token against blacklist (logout)

**Priority:** MUST  
**Dependencies:** FR-2

---

### FR-4: Token Refresh
**Description:** Users can exchange refresh token for new access token without re-login.

**Validation Criteria:**
- [ ] [Add detailed criteria]

**Priority:** MUST  
**Dependencies:** FR-2

---

### FR-5: User Logout
**Description:** Users can logout, which invalidates their tokens.

**Validation Criteria:**
- [ ] [Add detailed criteria]

**Priority:** MUST  
**Dependencies:** FR-2

---

### FR-6: Password Reset Request
**Description:** Users can request password reset via email.

**Validation Criteria:**
- [ ] [Add detailed criteria]

**Priority:** MUST  
**Dependencies:** FR-1

---

### FR-7: Password Reset Completion
**Description:** Users can set new password using reset token from email.

**Validation Criteria:**
- [ ] [Add detailed criteria]

**Priority:** MUST  
**Dependencies:** FR-6

---

### FR-8: Role-Based Access Control
**Description:** System assigns and validates user roles and permissions.

**Validation Criteria:**
- [ ] [Add detailed criteria]

**Priority:** MUST  
**Dependencies:** FR-1

---

## 5. API Specification

### 5.1 Endpoints Overview

*[Injected from sys-ecommerce.md - Component: Auth Service]*

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/v1/auth/register | Register new user | No |
| POST | /api/v1/auth/login | Login and get tokens | No |
| POST | /api/v1/auth/logout | Logout and invalidate tokens | Yes |
| POST | /api/v1/auth/refresh | Refresh access token | Yes (refresh token) |
| POST | /api/v1/auth/password-reset/request | Request password reset | No |
| POST | /api/v1/auth/password-reset/confirm | Confirm password reset | No |
| GET | /api/v1/auth/validate | Validate token (internal) | Yes |

### 5.2 Detailed Endpoints

#### POST /api/v1/auth/register

**Description:** Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "userId": "user-abc-123",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Errors:**
- 400: Invalid input (email format, password complexity)
- 409: Email already exists

---

#### POST /api/v1/auth/login

**Description:** Login and receive authentication tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-abc-123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user"]
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account not verified or disabled
- 429: Too many failed login attempts (rate limit)

---

#### [Additional endpoints - detail each]

---

## 6. Data Model

### 6.1 Database Tables

*[Context from sys-ecommerce.md#data-architecture]*

**Database:** PostgreSQL  
**Schema:** `auth`

#### Table: users

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  roles TEXT[] DEFAULT ARRAY['user'],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_email_verified ON auth.users(email_verified);
```

#### Table: sessions

```sql
CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);
```

#### Table: password_resets

```sql
CREATE TABLE auth.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user_id ON auth.password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON auth.password_resets(token_hash);
```

### 6.2 Redis Cache Structure

**Sessions Cache:**
```
Key: session:{userId}
Value: {
  "accessToken": "token...",
  "roles": ["user"],
  "permissions": ["read:own", "write:own"],
  "expiresAt": "2025-11-01T12:00:00Z"
}
TTL: 3600 seconds (1 hour)
```

**Token Blacklist:**
```
Key: blacklist:{tokenId}
Value: "1"
TTL: Time until original token expiry
```

---

## 7. Security

*[Injected from sys-ecommerce.md#security-model]*

### 7.1 Authentication Security

- **Password Hashing:** bcrypt with cost factor 12
- **JWT Signing:** HS256 with 256-bit secret key (from env)
- **Token Storage:** 
  - Access token: Client memory only (not localStorage)
  - Refresh token: HttpOnly, Secure, SameSite cookie
- **Token Rotation:** Refresh tokens rotate on use

### 7.2 Authorization

- **RBAC Implementation:** Role-based permissions
- **Roles:**
  - `user`: Standard user (read/write own data)
  - `admin`: Administrator (full access)
  - `support`: Support staff (read all, write limited)

### 7.3 Input Validation

- Email: RFC 5322 validation, max 255 chars
- Password: 
  - Min 8 characters
  - At least one uppercase
  - At least one lowercase
  - At least one number
  - At least one special character
- All inputs sanitized to prevent SQL injection, XSS

### 7.4 Rate Limiting

- Login attempts: 5 per minute per IP
- Password reset requests: 3 per hour per email
- API endpoints: 100 requests per minute per user

### 7.5 Audit Logging

Log all security events:
- Login attempts (success/failure)
- Password changes
- Password reset requests
- Token refreshes
- Logout events
- Role changes

---

## 8. Non-Functional Requirements

*[Injected from sys-ecommerce.md#performance-targets]*

### 8.1 Performance

- Login endpoint: < 200ms response time (p95)
- Token validation: < 50ms response time (p95)
- Registration: < 500ms response time (p95)
- Throughput: Handle 1000 req/sec
- Concurrent users: Support 10,000 authenticated users

### 8.2 Reliability

- Service uptime: 99.9%
- Database replication: Multi-AZ with automatic failover
- Cache redundancy: Redis cluster with replication

### 8.3 Scalability

- Horizontal scaling: Auto-scale 2-10 instances based on CPU
- Database: Connection pooling (max 100 connections per instance)
- Cache: Redis cluster for distributed caching

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Password hashing and validation
- JWT token generation and validation
- Input validation functions
- Business logic functions

### 9.2 Integration Tests

- Registration flow end-to-end
- Login flow end-to-end
- Token refresh flow
- Password reset flow
- Database operations

### 9.3 Deterministic Tests

*[Add at least 3-5 deterministic tests with concrete inputs/outputs]*

#### DT-1: Successful Registration

**Input:**
```json
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "name": "Test User"
}
```

**Expected Output:**
```json
{
  "success": true,
  "userId": "[UUID format]",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Verification:**
- HTTP Status: 201
- userId is valid UUID
- User exists in database with hashed password
- Verification email sent
- No errors in logs

---

#### [Add more deterministic tests]

---

## 10. Deployment

*[Injected from sys-ecommerce.md#deployment-architecture]*

### 10.1 Infrastructure

- **Platform:** AWS ECS (containerized)
- **Load Balancer:** Application Load Balancer
- **Auto-scaling:** 2-10 instances based on CPU (50-70% threshold)
- **Database:** RDS PostgreSQL (db.t3.medium, Multi-AZ)
- **Cache:** ElastiCache Redis (cache.t3.micro cluster)

### 10.2 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://host:6379
REDIS_TTL_ACCESS_TOKEN=3600
REDIS_TTL_REFRESH_TOKEN=2592000

# JWT
JWT_SECRET=[secure-secret-from-secrets-manager]
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d

# Email Service (for verification, password reset)
SENDGRID_API_KEY=[from-secrets-manager]
EMAIL_FROM=noreply@example.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_LOGIN=5
RATE_LIMIT_PASSWORD_RESET=3

# Monitoring
LOG_LEVEL=info
APM_ENABLED=true
```

### 10.3 Deployment Process

1. Build Docker image
2. Run tests in CI pipeline
3. Push image to ECR
4. Deploy to staging environment
5. Run smoke tests
6. Manual approval
7. Blue-green deployment to production
8. Health check validation
9. Monitor for 15 minutes
10. Complete deployment or rollback

---

## 11. Monitoring & Observability

*[Injected from sys-ecommerce.md#logging-monitoring]*

### 11.1 Metrics

Track these key metrics:
- Login success/failure rate
- Token validation latency
- API endpoint response times
- Database query performance
- Cache hit/miss rates
- Active sessions count
- Failed authentication attempts (security)

### 11.2 Logging

Structured JSON logs with:
- Timestamp
- Request ID (correlation)
- User ID (when authenticated)
- Endpoint
- Status code
- Response time
- Error details (if any)

### 11.3 Alerts

- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Login latency p95 > 300ms: Warning
- Failed auth attempts > 100/min: Security alert
- Service health check fails: Critical

---

## 12. Dependencies & Integration

### 12.1 Upstream Dependencies
*[Injected from sys-ecommerce.md]*

- None (this is a foundation service)

### 12.2 Downstream Consumers
*[Injected from sys-ecommerce.md]*

Services that depend on Auth Service:
- **API Gateway** ([feat-api-gateway](feat-api-gateway.md))
  - Uses token validation endpoint
  - Enforces authentication on all protected routes
  
- **User Profile Service** ([feat-user-profile](feat-user-profile.md))
  - Requires authenticated user context
  - Uses userId from JWT token

- **Product Service** ([feat-product-service](feat-product-service.md))
  - Requires authentication for write operations
  - Uses role-based permissions

- **Order Service** ([feat-order-service](feat-order-service.md))
  - Requires authenticated user to place orders
  - Uses userId for order attribution

[... all other services listed]

---

## 13. Acceptance Criteria

- [ ] All functional requirements implemented and tested
- [ ] All API endpoints documented and working
- [ ] Database schema created and migrated
- [ ] Security requirements met (audit passed)
- [ ] Performance targets achieved (load test passed)
- [ ] At least 90% test coverage
- [ ] No critical security vulnerabilities
- [ ] Documentation complete
- [ ] Monitoring and alerting configured
- [ ] Deployment pipeline functional

---

## 14. Future Enhancements

Items explicitly out of scope for this iteration but planned for future:

- OAuth 2.0 / OpenID Connect integration
- Multi-factor authentication (SMS, TOTP)
- Biometric authentication
- Social login (Google, Facebook, etc.)
- Single Sign-On (SSO) for enterprise
- Advanced threat detection
- Password-less authentication

---

## Appendix

### A. Related Documents

- [System Architecture](sys-ecommerce.md) - Parent system specification
- [API Gateway Feature Spec](feat-api-gateway.md) - Primary consumer
- [Deployment Runbook](../runbooks/auth-service-deployment.md) - Deployment procedures

### B. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-01 | Generated | Initial stub generated from system spec |

---

**Document Status:** STUB - Needs refinement  
**Next Steps:** Review with Claude Project agent to fill in detailed requirements

