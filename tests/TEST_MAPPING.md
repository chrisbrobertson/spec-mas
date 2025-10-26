# Test Mapping: AI Executive Assistant for Communication Tracking

**Spec ID:** feat-exec-assistant-001  
**Spec File:** /Users/chrisrobertson/repos/Spec-MAS/specs/executive-assistant.md  
**Generated:** 2025-10-25T23:40:07.978Z  

## Test Coverage

### Functional Requirements

- **FR-001:** The system must continuously monitor Office 365 email, Slack messages, and Zoom meeting transcripts in real-time, detecting new communications and queuing them for AI processing.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-002:** The system must use GPT-5 (primary) or Claude Sonnet 4.5 (fallback) to extract asks, commitments, and actions from communication content, identifying responsible persons and inferring priority levels.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-003:** The system must automatically link related items, tracking the lifecycle: Ask → Commitment → Action(s).
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-004:** The system must assign priority levels (Low/Medium/High) based on AI inference from language cues, with support for manual overrides and learning from user corrections.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-005:** The system must automatically flag items for follow-up based on priority and time since last update.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-006:** The system must identify and track individuals responsible for each item, merging duplicate person records when detected.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-007:** Users must be able to manually edit any tracked item, with all changes logged for AI learning.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-008:** The system must provide comprehensive search and filtering capabilities across all tracked items.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-009:** Users must have the option to process historical communications with configurable date ranges.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`
- **FR-010:** Completed items must be automatically archived after 18 months and remain searchable.
  - Test files: `ai-executive-assistant-for-communication-tracking.test.js`, `ai-executive-assistant-for-communication-tracking.integration.test.js`, `ai-executive-assistant-for-communication-tracking.e2e.test.js`

### Acceptance Criteria

1. Given a new email arrives, When it contains an ask/commitment/action, Then it is detected within 2 minutes
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

2. Given a Slack message is posted, When it contains an ask/commitment/action, Then it is captured within 60 seconds
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

3. Given a Zoom transcript is available, When it contains items, Then all are extracted and categorized
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

4. Given I made a request, When they respond with a commitment, Then the system links them
   - **Test Type:** integration
   - **Test File:** `ai-executive-assistant-for-communication-tracking.integration.test.js`

5. Given I made a request, When no commitment is made, Then the ask remains tracked as "Awaiting Commitment"
   - **Test Type:** integration
   - **Test File:** `ai-executive-assistant-for-communication-tracking.integration.test.js`

6. Given an item is detected, When a person is identifiable, Then that person is assigned
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

7. Given an ask exists, When a commitment is made, Then the commitment is linked to the ask
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

8. Given a commitment exists, When multiple actions are posted, Then all actions are linked chronologically
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

9. Given a commitment has multiple actions, When I view it, Then I see a timeline of all actions
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

10. Given I asked someone for X, When no update within follow-up window, Then it's flagged
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

11. Given an ask has no commitment, When I view dashboard, Then it's marked "uncommitted"
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

12. Given HIGH priority item with no update, When 1-2 days pass, Then it's flagged
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

13. Given MEDIUM priority item with no update, When 3-7 days pass, Then it's flagged
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

14. Given LOW priority item with no update, When 1-2 weeks pass, Then it's flagged
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

15. Given a new item is detected, When AI analyzes content, Then it assigns initial priority
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

16. Given I manually override priority, When I set it, Then manual priority takes precedence
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

17. Given I have interacted over time, When sufficient data exists, Then prioritization improves
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

18. Given any tracked item, When I edit status manually, Then change is saved immediately
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

19. Given any tracked item, When I add notes, Then notes are stored and visible
   - **Test Type:** integration
   - **Test File:** `ai-executive-assistant-for-communication-tracking.integration.test.js`

20. Given any tracked item, When I manually link it, Then relationship is created
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

21. Given incorrect detection, When I delete or mark "not an action", Then it's removed
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

22. Given any tracked item, When I change responsible person, Then assignment updates
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

23. Given multiple tracked items, When I view dashboard, Then I see all organized by priority
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

24. Given item status changes, When change is detected, Then status updates automatically
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

25. Given I want to filter, When I apply filters, Then only matching items display
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

26. Given I want to search, When I enter a string, Then all containing items display
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

27. Given item marked complete, When 18 months pass, Then it's automatically archived
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

28. Given item is archived, When I search archived, Then I can still view it
   - **Test Type:** unit
   - **Test File:** `ai-executive-assistant-for-communication-tracking.test.js`

### User Stories

1. As an executive, I want the assistant to automatically track action items from my emails, Slack, and meeting transcripts, so that I don't miss important commitments.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

2. As an executive, I want to track what I've asked others to deliver and monitor the status of those requests, so that I can follow up appropriately and ensure accountability.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

3. As an executive, I want asks to be prioritized by importance (with AI inference and my manual overrides), so that I can focus on what matters most.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

4. As an executive, I want to see all my commitments in one place with their current status, so that I can manage my responsibilities effectively.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

5. As an executive, I want to manually update any tracked item (status, priority, notes), so that I can correct errors and add context the AI might miss.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

6. As an executive, I want to know WHO is responsible for each commitment/action, so that I can follow up with the right person.
   - **Test File:** `ai-executive-assistant-for-communication-tracking.e2e.test.js`

## Test Files Generated

- `/Users/chrisrobertson/repos/Spec-MAS/tests/unit/ai-executive-assistant-for-communication-tracking.test.js` (unit tests, 30 test cases)
- `/Users/chrisrobertson/repos/Spec-MAS/tests/integration/ai-executive-assistant-for-communication-tracking.integration.test.js` (integration tests, 7 test cases)
- `/Users/chrisrobertson/repos/Spec-MAS/tests/e2e/ai-executive-assistant-for-communication-tracking.e2e.test.js` (e2e tests, 9 test cases)

## Running Tests

```bash
# Run all tests
npm test

# Run by type
npm run test:unit
npm run test:integration
npm run test:e2e
```
