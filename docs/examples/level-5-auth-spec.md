# Example: User Authentication System (Level 5)

---
title: User Authentication System
maturity_level: 5
complexity: HIGH
agent_ready: true
version: 1.0.0
created: 2024-10-16
author: Security Team
---

## Level 1: Foundation

### User Stories

**Story 1:** As a registered user, I want to securely log in with my email and password, so that I can access my personal account and data.

**Story 2:** As a user who forgot their password, I want to reset it via email, so that I can regain access to my account.

**Story 3:** As an administrator, I want to see failed login attempts, so that I can identify potential security threats.

### Acceptance Criteria

- [ ] Given valid credentials, When user submits login, Then user is authenticated and redirected to dashboard
- [ ] Given invalid credentials, When user submits login, Then error "Invalid email or password" is shown
- [ ] Given 5 failed attempts, When user tries to login, Then account is locked for 15 minutes
- [ ] Given locked account, When lockout expires, Then user can attempt login again
- [ ] Given forgotten password, When user requests reset, Then email sent within 60 seconds
- [ ] Given reset token, When user submits new password, Then password is updated and user can login
- [ ] Given expired token, When user attempts reset, Then error shown and new token required
- [ ] Given successful login, When user clicks logout, Then session is terminated immediately
- [ ] Given active session, When 24 hours pass without activity, Then session expires
- [ ] Given admin role, When viewing audit log, Then all auth events visible with timestamps

### Success Metrics

- 95% of login attempts complete in < 500ms
- Password reset emails delivered within 60 seconds for 99% of requests
- Zero security breaches from authentication vulnerabilities

## Level 2: Technical Context

### Technical Constraints

- **Backend:** Node.js 18+ with Express 4.x
- **Authentication:** JWT with RSA-256 signing
- **Password Hashing:** BCrypt with cost factor 12
- **Session Storage:** Redis 7.x
- **Email Service:** SendGrid v3 API
- **Database:** PostgreSQL 14+
- **Frontend:** React 18 with React Router 6

### Integration Points

1. **PostgreSQL Database**
   - Table: `users` (id, email, password_hash, created_at, updated_at)
   - Table: `auth_logs` (id, user_id, event_type, ip_address, timestamp)
   - Table: `password_resets` (id, user_id, token_hash, expires_at)

2. **Redis Cache**
   - Key: `session:{token}` → User session data
   - Key: `lockout:{email}` → Failed attempt counter
   - TTL: 24 hours for sessions, 15 minutes for lockouts

3. **SendGrid API**
   - Template: `password-reset` with dynamic variables
   - From: noreply@example.com
   - Rate limit: 100 emails/minute

### Data Models

```typescript
interface LoginRequest {
  email: string;      // RFC 5322 compliant
  password: string;   // 8-128 characters
  remember?: boolean; // Optional, extends session
}

interface AuthResponse {
  token: string;           // JWT token
  refreshToken?: string;   // Optional refresh token
  user: {
    id: number;
    email: string;
    role: string;
  };
  expiresAt: string;      // ISO 8601 timestamp
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetSubmit {
  token: string;        // From email link
  newPassword: string;  // Must meet requirements
}
```

## Level 3: Robustness

### Error Scenarios

1. **Invalid email format**
   - Response: 400 Bad Request
   - Message: "Please enter a valid email address"
   - Log: Validation failure, no sensitive data

2. **Account locked (5 failed attempts)**
   - Response: 423 Locked
   - Message: "Account temporarily locked. Try again in 15 minutes"
   - Action: Increment Redis counter, set TTL

3. **Database connection failure**
   - Response: 503 Service Unavailable
   - Message: "Service temporarily unavailable"
   - Action: Circuit breaker opens, retry after 30s

4. **SendGrid API timeout**
   - Response: 200 OK to user (don't reveal failure)
   - Action: Queue for retry with exponential backoff
   - Log: Email failure with retry count

5. **Expired reset token**
   - Response: 410 Gone
   - Message: "Reset link expired. Please request a new one"
   - Action: Delete expired token from database

6. **Redis connection lost**
   - Fallback: Continue without sessions (degrade gracefully)
   - Log: Critical error, page operations team
   - Action: Attempt reconnection every 5 seconds

### Performance Requirements

- **Login endpoint:** < 200ms at p95, < 500ms at p99
- **Password reset request:** < 100ms response (async email)
- **Email delivery:** < 60 seconds for 99% of emails
- **Concurrent users:** Support 10,000 active sessions
- **Database connections:** Max pool size 20
- **Redis operations:** < 10ms for all operations

### Security Considerations

1. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase, 1 lowercase, 1 number
   - No common passwords (check against list)
   - Not similar to email address

2. **Session Security**
   - HTTPOnly, Secure, SameSite cookies
   - JWT expires in 24 hours
   - Refresh token expires in 30 days
   - Rotate tokens on refresh

3. **Rate Limiting**
   - 10 login attempts per email per hour
   - 5 password reset requests per email per day
   - 100 requests per IP per minute (global)

4. **Audit Requirements**
   - Log all authentication attempts
   - Log all password changes
   - Never log passwords or tokens
   - Retain logs for 90 days

## Level 4: Architecture & Governance

### Architectural Patterns

1. **Repository Pattern**
   - `UserRepository` for data access
   - `AuthLogRepository` for audit logs
   - No direct database queries in services

2. **Service Layer**
   - `AuthenticationService` for business logic
   - `EmailService` for notifications
   - `TokenService` for JWT operations

3. **Middleware Pipeline**
   ```javascript
   app.use(rateLimiter);
   app.use(requestValidator);
   app.use(authMiddleware);
   app.use(errorHandler);
   ```

4. **Circuit Breaker Pattern**
   - For database connections
   - For external API calls
   - Open after 5 failures, retry after 30s

### Compliance Requirements

1. **GDPR Compliance**
   - Right to deletion includes all auth logs
   - Password reset emails include privacy notice
   - Consent required for extended session cookies
   - Data minimization: only store necessary fields

2. **SOC 2 Type II**
   - All auth events must be logged
   - Logs must be tamper-proof
   - Regular security audits required
   - Encryption at rest and in transit

3. **PCI DSS** (if payment data involved)
   - Session timeout after 15 minutes of inactivity
   - Strong cryptography for all transmissions
   - Regular security testing required

### Observability

1. **Metrics**
   ```
   auth.login.attempts (counter)
   auth.login.success (counter)
   auth.login.failure (counter)
   auth.login.duration (histogram)
   auth.password_reset.requests (counter)
   auth.session.active (gauge)
   ```

2. **Logging**
   ```json
   {
     "timestamp": "2024-10-16T10:30:00Z",
     "level": "info",
     "event": "login_attempt",
     "user_id": 12345,
     "ip": "192.168.1.1",
     "success": true,
     "duration_ms": 145
   }
   ```

3. **Alerts**
   - Failed login rate > 100/minute → Security alert
   - Login success rate < 90% → Engineering alert
   - p99 latency > 1000ms → Performance alert
   - Database connection pool exhausted → Critical alert

## Level 5: Complete Specification

### Concrete Examples

**Example 1: Successful Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "remember": true
}

Response 200 OK:
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "7f8a9b1c2d3e4f5g...",
  "user": {
    "id": 12345,
    "email": "john.doe@example.com",
    "role": "user"
  },
  "expiresAt": "2024-10-17T10:30:00Z"
}
```

**Example 2: Password Reset Flow**
```bash
# Step 1: Request reset
POST /api/auth/password-reset
{
  "email": "john.doe@example.com"
}

Response 200 OK:
{
  "message": "If an account exists, a reset email has been sent"
}

# Email received with link:
https://app.example.com/reset?token=a1b2c3d4e5f6g7h8

# Step 2: Submit new password
POST /api/auth/password-reset/confirm
{
  "token": "a1b2c3d4e5f6g7h8",
  "newPassword": "NewSecurePass456!"
}

Response 200 OK:
{
  "message": "Password updated successfully"
}
```

**Example 3: Account Lockout**
```bash
# After 5 failed attempts
POST /api/auth/login
{
  "email": "john.doe@example.com",
  "password": "WrongPassword"
}

Response 423 Locked:
{
  "error": "ACCOUNT_LOCKED",
  "message": "Too many failed attempts. Try again in 15 minutes",
  "retryAfter": "2024-10-16T10:45:00Z"
}
```

### Counter-Examples (What This Is NOT)

- **NOT Social Authentication:** No OAuth/Google/Facebook login (separate feature)
- **NOT Multi-Factor Auth:** No 2FA/TOTP codes (future enhancement)
- **NOT SSO:** No SAML or enterprise SSO (different system)
- **NOT Username Login:** Email only, no username support
- **NOT Magic Links:** Traditional password, not passwordless
- **NOT Biometric:** No fingerprint or face recognition

### Edge Cases

1. **User changes email during reset process**
   - Old email's reset token immediately invalidated
   - New email must request fresh reset
   - Audit log shows both events

2. **Concurrent login attempts (same user, different devices)**
   - All succeed if credentials valid
   - Each gets unique session token
   - User can see active sessions in settings

3. **Password reset requested for non-existent email**
   - Same response as successful request (security)
   - No email sent
   - Log shows attempt for monitoring

4. **JWT secret rotation during active sessions**
   - Old tokens valid until natural expiry
   - New tokens use new secret
   - Gradual migration over 24 hours

5. **Database failover during authentication**
   - Read replica can validate existing users
   - New registrations fail gracefully
   - Sessions continue via Redis

6. **Time zone edge cases**
   - All times in UTC
   - Client converts for display
   - Token expiry uses server time only

### Migration Strategy

**Phase 1: Shadow Mode (Week 1)**
- New auth system runs parallel to old
- Log discrepancies but don't affect users
- Monitor performance metrics

**Phase 2: Gradual Rollout (Week 2-3)**
- 10% of users → new system
- Monitor error rates and performance
- Increase to 50% if stable

**Phase 3: Full Migration (Week 4)**
- 100% on new system
- Old system available for rollback
- Maintain session compatibility

**Rollback Plan**
```bash
# Immediate rollback possible via feature flag
FEATURE_NEW_AUTH=false

# Sessions remain valid
# Users won't notice rollback
# Re-attempt after fixing issues
```

### Testing Strategy

**Unit Tests**
- Password hashing correctness
- JWT token generation/validation
- Input validation rules
- Rate limiting logic

**Integration Tests**
- Database operations
- Redis session management
- SendGrid email sending
- End-to-end auth flow

**Security Tests**
- SQL injection attempts
- XSS in login forms
- Brute force protection
- Token hijacking prevention

**Performance Tests**
- 10,000 concurrent logins
- Sustained load for 1 hour
- Database connection pool limits
- Redis failover scenarios

---

## Approval Status

✅ **This specification is AGENT-READY**

- Maturity Level: 5/5 (Required: 5 for HIGH complexity)
- All sections complete with concrete details
- Examples and edge cases documented
- Migration strategy defined
- Ready for AI agent implementation
