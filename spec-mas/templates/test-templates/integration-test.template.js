/**
 * Integration Test Template for Spec-MAS v3
 * Generated from specification: {{specName}}
 *
 * This file contains integration tests for {{featureName}}.
 * Tests focus on API endpoints, database interactions, and service integration.
 *
 * @see Spec: {{specPath}}
 */

{{imports}}

describe('{{testSuiteName}} - Integration Tests', () => {
  // ==========================================
  // Test Environment Setup
  // ==========================================

  let testServer;
  let testDatabase;
  let testClient;

  beforeAll(async () => {
    {{beforeAllSetup}}

    // Example: Initialize test server
    // testServer = await startTestServer();

    // Example: Initialize test database
    // testDatabase = await setupTestDatabase();

    // Example: Initialize API client
    // testClient = createTestClient(testServer.url);
  });

  beforeEach(async () => {
    {{beforeEachSetup}}

    // Example: Clear database between tests
    // await testDatabase.clear();

    // Example: Reset test data
    // await seedTestData();
  });

  afterEach(async () => {
    {{afterEachCleanup}}

    // Example: Clean up test data
    // await cleanupTestData();
  });

  afterAll(async () => {
    {{afterAllCleanup}}

    // Example: Close database connections
    // await testDatabase.close();

    // Example: Shutdown test server
    // await testServer.close();
  });

  // ==========================================
  // API Endpoint Tests
  // ==========================================

  describe('{{endpoint}} - {{method}}', () => {
{{apiTestCases}}

    // Example test case:
    // it('should return 200 and data for valid request', async () => {
    //   // Arrange
    //   const requestBody = { /* test data */ };
    //
    //   // Act
    //   const response = await testClient
    //     .{{method}}('{{endpoint}}')
    //     .send(requestBody);
    //
    //   // Assert
    //   expect(response.status).toBe(200);
    //   expect(response.body).toMatchObject({
    //     // expected shape
    //   });
    // });
  });

  // ==========================================
  // Database Integration Tests
  // ==========================================

  describe('Database Operations', () => {
{{databaseTestCases}}

    // Example test case:
    // it('should persist data correctly', async () => {
    //   // Arrange
    //   const testData = { /* test record */ };
    //
    //   // Act
    //   await repository.create(testData);
    //   const result = await repository.findById(testData.id);
    //
    //   // Assert
    //   expect(result).toMatchObject(testData);
    // });
  });

  // ==========================================
  // Service Integration Tests
  // ==========================================

  describe('External Service Integration', () => {
{{serviceTestCases}}

    // Example test case:
    // it('should handle external service response', async () => {
    //   // Arrange
    //   const mockResponse = { /* mocked data */ };
    //   mockExternalService.mockResolvedValue(mockResponse);
    //
    //   // Act
    //   const result = await serviceUnderTest.fetch();
    //
    //   // Assert
    //   expect(result).toEqual(mockResponse);
    //   expect(mockExternalService).toHaveBeenCalledTimes(1);
    // });
  });

  // ==========================================
  // Error Scenarios
  // ==========================================

  describe('Error Handling', () => {
    it('should return 400 for invalid request', async () => {
      // Arrange
      const invalidRequest = {{invalidRequestExample}};

      // Act
      const response = await testClient
        .{{method}}('{{endpoint}}')
        .send(invalidRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for database failure', async () => {
      // Arrange
      // Mock database failure
      {{databaseFailureMock}}

      // Act
      const response = await testClient
        .{{method}}('{{endpoint}}')
        .send({{validRequestExample}});

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Service unavailable');
    });

{{errorTestCases}}
  });

  // ==========================================
  // Performance Tests
  // ==========================================

  describe('Performance Requirements', () => {
    it('should respond within acceptable latency', async () => {
      // Arrange
      const startTime = Date.now();
      const requestBody = {{validRequestExample}};

      // Act
      const response = await testClient
        .{{method}}('{{endpoint}}')
        .send(requestBody);

      const duration = Date.now() - startTime;

      // Assert
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan({{maxLatencyMs}}); // From spec NFRs
    });

{{performanceTestCases}}
  });

  // ==========================================
  // Security Tests
  // ==========================================

  describe('Security Validations', () => {
    it('should require authentication', async () => {
      // Arrange
      const requestWithoutAuth = testClient.{{method}}('{{endpoint}}');

      // Act
      const response = await requestWithoutAuth.send({{validRequestExample}});

      // Assert
      expect(response.status).toBe(401);
    });

{{securityTestCases}}
  });
});

// ==========================================
// Test Helpers and Utilities
// ==========================================

{{helperFunctions}}

// Example helper:
// async function createTestUser(overrides = {}) {
//   return {
//     id: 'test-user-id',
//     email: 'test@example.com',
//     ...overrides
//   };
// }

// Example fixture:
// const VALID_REQUEST_BODY = {
//   field1: 'value1',
//   field2: 'value2'
// };

/**
 * Integration Test Coverage:
 * - Endpoints tested: {{endpointsCoverage}}
 * - Database operations: {{databaseOperationsCoverage}}
 * - External services: {{externalServicesCoverage}}
 * - Error scenarios: {{errorScenariosCoverage}}
 *
 * Environment Requirements:
 * {{environmentRequirements}}
 *
 * Manual Setup Required:
 * {{manualSetupNotes}}
 */
