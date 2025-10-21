Example Conversations & Scenarios
This document provides example interactions to help you understand how to work effectively with the Spec-MAS assistant.

Starting New Specifications
Example 1: Simple Feature (EASY)
You:
/new Add a dark mode toggle to the application settings
```

**Assistant:**
```
I'll help you create an agent-ready specification for dark mode toggle.

Based on your description, I've classified this as EASY complexity.

📊 Requirements:
- Complexity: EASY
- Required Level: 3
- Current Level: 0

This is a straightforward UI feature. We'll need to define:
- User stories and acceptance criteria (Level 1)
- Technical implementation details (Level 2)  
- Error handling and performance (Level 3)

Let's start with the foundation.

Question 1: Who will use the dark mode toggle?
- All users?
- Logged-in users only?
- Specific user roles?
```

---

### Example 2: Integration Feature (MODERATE)

**You:**
```
/new Integrate with Stripe payment gateway for subscription payments
```

**Assistant:**
```
I'll help you create an agent-ready specification for Stripe payment integration.

Based on your description, I've classified this as MODERATE complexity.

📊 Requirements:
- Complexity: MODERATE (payment integration)
- Required Level: 4
- Current Level: 0

Payment integrations require careful attention to:
- Technical integration details
- Error handling and edge cases
- Architecture patterns
- Compliance (PCI DSS)
- Observability

This will take 1.5-2 hours to complete properly.

Let's start with understanding the requirements.

Question 1: What type of payments are we handling?
- One-time purchases?
- Recurring subscriptions?
- Both?
```

---

### Example 3: Security Feature (HIGH)

**You:**
```
/new Implement OAuth 2.0 authentication with social login
```

**Assistant:**
```
I'll help you create an agent-ready specification for OAuth 2.0 authentication.

Based on your description, I've classified this as HIGH complexity.

📊 Requirements:
- Complexity: HIGH (security-critical)
- Required Level: 5
- Current Level: 0

Authentication is HIGH complexity because:
- Security implications are critical
- Edge cases must be handled perfectly
- Compliance requirements (GDPR, etc.)
- Complex integration patterns

This will take 3-4 hours to complete thoroughly.

Let's start with the foundation.

Question 1: Which OAuth providers will you support?
- Google
- Facebook
- GitHub
- Microsoft
- Others?

And will you also support email/password authentication alongside OAuth?
```

---

## Assessing Existing Specifications

### Example 4: Evaluating an Incomplete Spec

**You:**
```
/assess

Here's my spec draft:

## User Profile Update

Users should be able to update their profile information including:
- Name
- Email
- Phone number
- Profile picture

The update should be fast and work well.
```

**Assistant:**
```
# Specification Assessment

## Current Status
- **Maturity Level:** 1 (Foundation incomplete)
- **Complexity:** EASY (basic CRUD)
- **Required Level:** 3
- **Agent Ready:** ❌ No

### ✅ What You Have (Partial)
- Basic scope identified
- Feature type clear (profile update)

### ⚠️ Issues Found (8)

**Level 1 Issues:**
1. ❌ No user stories (need "As a [user], I want...")
2. ❌ Vague term: "fast" - needs specific metric
3. ❌ Vague term: "work well" - needs definition
4. ❌ No acceptance criteria (need Given/When/Then)
5. ❌ No success metrics

**Structural Issues:**
6. ❌ No front-matter metadata
7. ❌ Missing required sections (Security, Data Model, etc.)
8. ❌ No validation criteria for requirements

### 🔧 Next Steps

To reach Level 1, let's start with user stories.

Question 1: Who is updating their profile?
- End users updating their own profile?
- Admins updating user profiles?
- Both?

Once we clarify this, I'll help you write proper user stories.
```

---

## Common Clarification Scenarios

### Example 6: Vague Requirement

**You:**
```
The search should be fast
```

**Assistant:**
```
I need to replace "fast" with a specific metric.

Let me help you determine the right performance target.

Question: What's an acceptable response time for search?

Consider:
- Google search: ~100-200ms
- Internal tools: ~500ms is often acceptable
- Complex searches: ~1-2s might be okay

For your feature:
- How complex is the search? (simple text match or complex filters?)
- What's the user expectation? (instant or willing to wait?)
- What's technically feasible with your current infrastructure?

Please provide a specific target like:
- "Search results return in <200ms at p95"
- "Search completes in <500ms for 95% of queries"
```

---

### Example 7: Missing Error Handling

**You:**
```
When user clicks save, data is saved to the database
```

**Assistant:**
```
That covers the happy path, but we need error scenarios.

Let me ask about potential failures:

Question 1: What if the database save fails?
- Network timeout?
- Database connection lost?
- Validation error from database?

How should the system respond?
A) Show generic error message
B) Show specific error based on failure type
C) Retry automatically
D) Save locally and sync later

Question 2: What if the save succeeds but confirmation fails to display?
- Should we verify the save before showing success?
- What if the user clicks save multiple times quickly?
```

---

## Tips for Effective Conversations

### Getting Better Responses

**Instead of:**
```
Make it secure
```

**Say:**
```
This handles user passwords. What security measures should I specify?
```

---

**Instead of:**
```
What about performance?
```

**Say:**
```
The API currently responds in 800ms. What's a good target for user experience?

Remember: The assistant is here to help you create the best possible specification. Ask questions, request clarification, and take your time. Quality specifications lead to quality implementations.RetryClaude can make mistakes. Please double-check responses.