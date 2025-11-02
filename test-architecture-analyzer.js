/**
 * Quick test of the architecture analyzer
 */

const { parseSpec } = require('../.spec-mas/scripts/spec-parser');
const { analyzeSpec, formatAnalysisReport } = require('../.spec-mas/src/architecture/spec-analyzer');

// Test with a sample spec
const testSpecContent = `---
specmas: 3.0
kind: feature
id: feat-test
name: Test Feature
complexity: MODERATE
maturity: 3
---

# Test Feature

## Overview
This is a test feature that handles user authentication, billing management, and notification system.
It includes customer support ticketing and reporting analytics.

## User Stories

### US-1: Admin Login
**As a** system administrator
**I want to** log in securely
**So that** I can manage the system

### US-2: Customer Billing
**As a** customer
**I want to** view my billing history
**So that** I can track my expenses

### US-3: Support Agent
**As a** support agent
**I want to** manage tickets
**So that** I can help customers

### US-4: Sales Manager
**As a** sales manager
**I want to** view analytics
**So that** I can make decisions

## Functional Requirements

### FR-1: User Login
Description: Login functionality

### FR-2: User Registration
Description: Registration functionality

### FR-3: Password Reset
Description: Password reset functionality

### FR-4: Customer Create
Description: Create customer records

### FR-5: Customer Read
Description: View customer records

### FR-6: Customer Update
Description: Update customer records

### FR-7: Customer Delete
Description: Delete customer records

### FR-8: Invoice Generation
Description: Generate invoices

### FR-9: Payment Processing
Description: Process payments with Stripe

### FR-10: Payment Processing PayPal
Description: Process payments with PayPal

### FR-11: Email Notifications
Description: Send email notifications

### FR-12: SMS Notifications
Description: Send SMS notifications via Twilio

### FR-13: Push Notifications
Description: Send push notifications

### FR-14: Ticket Creation
Description: Create support tickets

### FR-15: Ticket Management
Description: Manage support tickets

## Data Model

### Entity: User
Fields: id, email, password, role

### Entity: Customer
Fields: id, name, email, phone

### Entity: Invoice
Fields: id, customerId, amount, date

### Entity: Payment
Fields: id, invoiceId, amount, method

### Entity: Notification
Fields: id, userId, message, type

### Entity: Ticket
Fields: id, customerId, subject, status

### Entity: Report
Fields: id, type, data, generatedAt

### Entity: AuditLog
Fields: id, userId, action, timestamp

### Entity: Setting
Fields: id, key, value

## External Integrations

### Integration: Stripe
Purpose: Payment processing

### Integration: PayPal
Purpose: Alternative payment processing

### Integration: Twilio
Purpose: SMS notifications

### Integration: SendGrid
Purpose: Email notifications

## API Specification

### Endpoint: GET /api/users
### Endpoint: POST /api/users
### Endpoint: GET /api/customers
### Endpoint: POST /api/customers
### Endpoint: PUT /api/customers/:id
### Endpoint: DELETE /api/customers/:id
### Endpoint: GET /api/invoices
### Endpoint: POST /api/invoices
### Endpoint: POST /api/payments
### Endpoint: GET /api/notifications
### Endpoint: POST /api/notifications
### Endpoint: GET /api/tickets
### Endpoint: POST /api/tickets
### Endpoint: PUT /api/tickets/:id
`;

console.log('Testing Architecture Analyzer...\n');

// Create a mock spec object
const mockSpec = {
  metadata: {
    specmas: '3.0',
    kind: 'feature',
    id: 'feat-test',
    name: 'Test Feature',
    complexity: 'MODERATE',
    maturity: 3
  },
  raw: testSpecContent,
  sections: {}
};

// Run analysis
const analysis = analyzeSpec(mockSpec);

// Format and display report
const report = formatAnalysisReport(analysis);
console.log(report);

// Also show JSON for verification
console.log('\n\nJSON Output:');
console.log(JSON.stringify(analysis, null, 2));

console.log('\n\n✅ Test complete!');
console.log(`\nShould Split: ${analysis.shouldSplit ? 'YES' : 'NO'}`);
console.log(`Confidence: ${analysis.confidence}`);
console.log(`Total Score: ${analysis.totalScore}/20`);
