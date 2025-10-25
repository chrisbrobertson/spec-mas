# Test Mapping: User Authentication System

**Spec ID:** feat-user-authentication-system  
**Spec File:** /Users/chrisrobertson/repos/Spec-MAS/docs/examples/level-5-auth-spec.md  
**Generated:** 2025-10-21T14:58:56.408Z  

## Test Coverage

### Acceptance Criteria

1. Given valid credentials, When user submits login, Then user is authenticated and redirected to dashboard
   - **Test Type:** e2e
   - **Test File:** `user-authentication-system.e2e.test.js`

2. Given invalid credentials, When user submits login, Then error "Invalid email or password" is shown
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

3. Given 5 failed attempts, When user tries to login, Then account is locked for 15 minutes
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

4. Given locked account, When lockout expires, Then user can attempt login again
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

5. Given forgotten password, When user requests reset, Then email sent within 60 seconds
   - **Test Type:** integration
   - **Test File:** `user-authentication-system.integration.test.js`

6. Given reset token, When user submits new password, Then password is updated and user can login
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

7. Given expired token, When user attempts reset, Then error shown and new token required
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

8. Given successful login, When user clicks logout, Then session is terminated immediately
   - **Test Type:** e2e
   - **Test File:** `user-authentication-system.e2e.test.js`

9. Given active session, When 24 hours pass without activity, Then session expires
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

10. Given admin role, When viewing audit log, Then all auth events visible with timestamps
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

11. Given valid credentials, When user submits login, Then user is authenticated and redirected to dashboard
   - **Test Type:** e2e
   - **Test File:** `user-authentication-system.e2e.test.js`

12. Given invalid credentials, When user submits login, Then error "Invalid email or password" is shown
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

13. Given 5 failed attempts, When user tries to login, Then account is locked for 15 minutes
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

14. Given locked account, When lockout expires, Then user can attempt login again
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

15. Given forgotten password, When user requests reset, Then email sent within 60 seconds
   - **Test Type:** integration
   - **Test File:** `user-authentication-system.integration.test.js`

16. Given reset token, When user submits new password, Then password is updated and user can login
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

17. Given expired token, When user attempts reset, Then error shown and new token required
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

18. Given successful login, When user clicks logout, Then session is terminated immediately
   - **Test Type:** e2e
   - **Test File:** `user-authentication-system.e2e.test.js`

19. Given active session, When 24 hours pass without activity, Then session expires
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

20. Given admin role, When viewing audit log, Then all auth events visible with timestamps
   - **Test Type:** unit
   - **Test File:** `user-authentication-system.test.js`

### User Stories

1. *Story 1:** As a registered user, I want to securely log in with my email and password, so that I can access my personal account and data.
   - **Test File:** `user-authentication-system.e2e.test.js`

2. *Story 2:** As a user who forgot their password, I want to reset it via email, so that I can regain access to my account.
   - **Test File:** `user-authentication-system.e2e.test.js`

3. As an administrator, I want to see failed login attempts, so that I can identify potential security threats.
   - **Test File:** `user-authentication-system.e2e.test.js`

## Test Files Generated

- `/Users/chrisrobertson/repos/Spec-MAS/tests-auth/unit/user-authentication-system.test.js` (unit tests, 22 test cases)
- `/Users/chrisrobertson/repos/Spec-MAS/tests-auth/integration/user-authentication-system.integration.test.js` (integration tests, 7 test cases)
- `/Users/chrisrobertson/repos/Spec-MAS/tests-auth/e2e/user-authentication-system.e2e.test.js` (e2e tests, 9 test cases)

## Running Tests

```bash
# Run all tests
npm test

# Run by type
npm run test:unit
npm run test:integration
npm run test:e2e
```
