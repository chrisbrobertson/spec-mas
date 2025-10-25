---
specmas: v3
kind: FeatureSpec
id: feat-exec-assistant-001
name: AI Executive Assistant for Communication Tracking
version: 1.0.0
checksum: 10435c08d09c529fec08c6072763703c9cb2ebd388313185d2b9c94e4e626697
created: 2025-10-25
updated: 2025-10-25
owners:
  - name: Executive User
    email: user@company.com
complexity: HIGH
maturity: 5
tags: [ai, nlp, productivity, communication-tracking, multi-integration]
---

# AI Executive Assistant - Specification

## Overview

### Problem Statement

Executives receive hundreds of communications daily across email, Slack, and meetings, making it nearly impossible to track all asks, commitments, and actions manually. Critical items fall through the cracks, follow-ups are missed, and accountability becomes difficult to maintain. There is no centralized system that automatically extracts and tracks these action items from multiple communication channels, prioritizes them intelligently, and provides a unified view of what needs attention.

### Scope

**In Scope:**
- Automatic extraction of asks, commitments, and actions from Office 365 email, Slack messages, and Zoom meeting transcripts
- AI-powered classification and prioritization of items
- Person/responsibility tracking and assignment
- Relationship mapping between asks, commitments, and actions
- Priority-based follow-up flagging (High: 1-2 days, Medium: 3-7 days, Low: 1-2 weeks)
- Manual editing capabilities for all tracked items
- Full-text search across all items
- 18-month archival policy for completed items
- Optional historical data processing with date range selection
- Local-only deployment on macOS with web dashboard
- Secure API key storage via macOS Keychain

**Out of Scope:**
- General task management (not Asana/Jira replacement)
- Calendar integration or meeting scheduling
- Email/Slack message composition or sending
- Conversational AI interface or chatbot functionality
- CRM or detailed contact management
- Document storage or knowledge base
- File attachment handling
- Mobile applications (web-only in v1.0)
- Multi-user support (single executive use only)
- Real-time collaboration features

### Success Metrics

**Primary Goal: Zero Missed Items**
- **Recall Rate**: ≥95% of actual asks/commitments/actions are captured (validated through periodic manual audits)
- **Precision Rate**: ≥90% of flagged items are genuine asks/commitments/actions (not false positives)
- **False Negative Prevention**: Zero critical/high-priority items fall through the cracks (validated through stakeholder feedback)

**Secondary Goals:**
- **Latency**: Items appear in tracking system within 2 minutes of being communicated
- **Relationship Accuracy**: ≥90% of linked items (ask→commitment→action) are correctly associated
- **Person Identification Accuracy**: ≥85% of items correctly identify the responsible person
- **Manual Override Frequency**: Track how often manual edits are needed to improve AI over time
- **Timely Follow-ups**: ≥95% of items flagged for follow-up within their priority-based timeframe

---

## Functional Requirements

### FR-001: Automatic Communication Monitoring

**Description:**
The system must continuously monitor Office 365 email, Slack messages, and Zoom meeting transcripts in real-time, detecting new communications and queuing them for AI processing.

**Validation:**
- Email: New messages detected within 60 seconds via Microsoft Graph API delta queries
- Slack: Messages received within 5 seconds via Socket Mode WebSocket connection
- Zoom: New transcripts detected within 15 minutes via polling
- All detected communications queued to SQLite job queue with unique source_id
- No duplicate processing of the same message (enforced by UNIQUE constraint)

**Test Coverage:**
- DT-001: Email with single ask extraction
- DT-005: Multiple asks in Zoom transcript
- Acceptance Criteria: Email/Slack/Zoom detection timing

### FR-002: AI-Powered Item Extraction

**Description:**
The system must use GPT-5 (primary) or Claude Sonnet 4.5 (fallback) to extract asks, commitments, and actions from communication content, identifying responsible persons and inferring priority levels.

**Validation:**
- Single unified prompt used for both AI models
- Extraction completes within 30 seconds (p95) per message
- Output includes: type (ask/commitment/action), title, description, responsible person, priority, confidence score, due date
- Confidence score between 0.0-1.0 returned for each extraction
- Items with confidence <0.5 flagged for manual review
- Automatic fallback to Claude if GPT-5 rate limited or errors

**Test Coverage:**
- DT-001: Single ask extraction
- DT-002: High priority keyword detection
- DT-003: Commitment with action linkage
- DT-004: Informational message (no items)

### FR-003: Relationship Tracking

**Description:**
The system must automatically link related items, tracking the lifecycle: Ask → Commitment → Action(s).

**Validation:**
- Commitments linked to originating asks when detected in responses
- Multiple actions can be linked to single commitment
- Asks can exist without commitments (status: "Awaiting Commitment")
- Relationship graph visible in dashboard with parent-child hierarchy
- Cross-platform tracking (ask via email, commitment via Slack)
- Circular relationships prevented by validation logic

**Test Coverage:**
- DT-003: Ask-commitment-action linkage
- INV-003: Relationship integrity
- INV-010: Acyclic relationship graph

### FR-004: Intelligent Prioritization

**Description:**
The system must assign priority levels (Low/Medium/High) based on AI inference from language cues, with support for manual overrides and learning from user corrections.

**Validation:**
- Initial priority assigned by AI based on urgency indicators, leadership involvement, deadlines, and language tone
- Manual priority overrides always take precedence over AI
- User corrections stored in learning_feedback table
- Priority adjustments reflected immediately in dashboard
- System learns patterns over time from manual corrections

**Test Coverage:**
- DT-002: Urgency keyword priority inference
- INV-002: Priority hierarchy (manual > AI)
- Acceptance Criteria: Priority assignment and override

### FR-005: Follow-Up Flagging

**Description:**
The system must automatically flag items for follow-up based on priority and time since last update.

**Validation:**
- High priority: Flagged after 1-2 days with no update
- Medium priority: Flagged after 3-7 days with no update
- Low priority: Flagged after 1-2 weeks with no update
- Flagged items highlighted prominently in dashboard
- Follow-up flags cleared when item updated or completed

**Test Coverage:**
- INV-004: Follow-up flag consistency
- Acceptance Criteria: Priority-based follow-up timing

### FR-006: Person Identification and Tracking

**Description:**
The system must identify and track individuals responsible for each item, merging duplicate person records when detected.

**Validation:**
- Person extracted from email sender/recipient, Slack user, or Zoom participant
- Person record includes: name, email, slack_user_id, zoom_user_id
- Duplicate detection based on email address matching
- User prompted to merge suspected duplicates
- Items can be manually reassigned to different persons
- Person names/emails linked across all platforms

**Test Coverage:**
- DT-005: Multiple person identification in transcript
- INV-006: Person identity consistency
- Acceptance Criteria: Person extraction and assignment

### FR-007: Manual Editing and Correction

**Description:**
Users must be able to manually edit any tracked item, with all changes logged for AI learning.

**Validation:**
- All item fields editable: title, description, priority, status, responsible person, due date
- Manual edits immediately reflected in dashboard
- Edit history tracked in manual_edits table with old/new values
- Corrections fed to learning_feedback for AI improvement
- False positives can be deleted or marked as "not an action item"
- Manual item linking/unlinking supported

**Test Coverage:**
- Acceptance Criteria: Manual editing and audit trail
- INV-002: Manual priority overrides

### FR-008: Search and Filtering

**Description:**
The system must provide comprehensive search and filtering capabilities across all tracked items.

**Validation:**
- Full-text search using SQLite FTS5 across title and description
- Filter by: priority, person, status, source type, date range
- String search for project names or keywords
- Search results returned within 500ms (p95)
- Combined filters supported (e.g., "High priority + Assigned to Sarah + Last 30 days")

**Test Coverage:**
- Performance Requirements: Search query performance target
- Acceptance Criteria: Search and filtering functionality

### FR-009: Historical Data Processing

**Description:**
Users must have the option to process historical communications with configurable date ranges.

**Validation:**
- Optional setup step with date range picker per source (email/Slack/Zoom)
- Maximum 1 year range per historical processing request
- Processing runs in background without blocking dashboard
- Progress indicator shows: total items, processed items, estimated time remaining
- User can pause/resume historical processing
- Historical processing respects rate limits (slower than real-time)

**Test Coverage:**
- Acceptance Criteria: Historical processing functionality
- Architecture: Historical processing job management

### FR-010: Archival Management

**Description:**
Completed items must be automatically archived after 18 months and remain searchable.

**Validation:**
- Items with status='completed' automatically archived after 18 months
- Archived items excluded from default dashboard views
- Archived items searchable via "Include Archived" toggle
- Archived items can be restored if needed
- Database space reclaimed through VACUUM operations

**Test Coverage:**
- INV-005: Archival timeline enforcement
- Acceptance Criteria: Archival functionality

---

## Non-Functional Requirements

### Performance

**Processing Latency:**
- Items detected and added to system within 2 minutes of communication
- AI extraction completes within 30 seconds (p95) per message
- GPT-5 target: <10 seconds (p50)
- Claude Sonnet 4.5 target: <15 seconds (p50)

**Dashboard Performance:**
- Dashboard loads within 1 second (p95) with <10,000 active items
- Search queries complete within 500ms (p95) across 50,000+ items
- Full-text search leverages SQLite FTS5 indexing

**Throughput:**
- Sustained: 100 messages per hour
- Peak: 500 messages per hour for 15 minutes (historical processing)
- Concurrent AI processing: Up to 5 parallel extraction calls

### Reliability & Scalability

**Uptime:**
- Target: 99% uptime (excluding Mac sleep/shutdown)
- Automatic process restart on crashes via supervisor
- Health checks every 30 seconds for all child processes

**Scalability:**
- Support up to 10,000 active items without performance degradation
- SQLite database handles millions of records efficiently
- AI worker processes scalable (3 workers default, configurable)

**Resource Constraints:**
- Background service: <512MB RAM idle, <2GB RAM during processing
- Web server: <256MB RAM
- Total system: <2.5GB RAM maximum
- CPU: <5% idle, <50% sustained, <80% peak
- Disk: ~100MB per 10,000 items, <1GB typical usage

### Observability

**Metrics Tracked (30+ metrics):**
- Process health: uptime, crash counts
- Queue status: pending/processing/failed jobs, job age
- Items: created counts by type/priority
- AI performance: API calls, errors, extraction time, confidence distribution, rate limit hits
- Integration health: messages polled, API errors, connection status
- User activity: manual edits, false positives marked, searches

**Logging:**
- Structured JSON logging to `~/Library/Logs/ExecAssistant/`
- Levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Daily rotation, 7-day retention
- Max 50MB per log file
- No sensitive data in logs (content redacted, API keys never logged)

**Alerting:**
- Dashboard visual alerts for: queue backlog, failed jobs, low confidence items, process crashes, API failures, low disk space
- Optional email notifications for critical alerts (rate limited to 1 per hour per alert type)

### Compliance & Privacy

**Data Privacy:**
- All data stored locally on Mac (no cloud storage)
- SQLite database protected by macOS FileVault full-disk encryption
- API keys stored in macOS Keychain (never in code/config/logs)
- No telemetry or usage tracking
- User can delete all data at any time

**AI Data Processing:**
- OpenAI and Anthropic do not use API data for model training (per current policies)
- Communication content sent to AI APIs for processing only
- User notified during setup that data will be sent to AI providers

**Integration Security:**
- OAuth 2.0 for all integrations (Office 365, Slack, Zoom)
- Minimum required permissions only
- No password storage (token-based authentication only)
- Tokens encrypted in Keychain

---

## Security Considerations

### Authentication

**API Authentication:**
- Office 365: OAuth 2.0 with delegated permissions (Mail.Read, User.Read)
- Slack: OAuth 2.0 with User Token (channels:history, users:read, etc.)
- Zoom: Server-to-Server OAuth (meeting:read, recording:read)
- OpenAI: API key authentication
- Anthropic: API key authentication

**Web Dashboard:**
- Initial deployment: No authentication (localhost-only access)
- Optional: Password protection via Flask-Login if user wants
- Access restricted to 127.0.0.1 (not accessible over network)

### Authorization

**Role-Based Access:**
- Single user system (executive only)
- No multi-user support or role hierarchy in v1.0

**Data Access Control:**
- All tracked items visible to user
- No row-level security (single user)
- Items can be manually deleted by user

### Data Handling

**PII Classification:**
- **High PII**: Email content, Slack messages, Zoom transcripts, person names/emails
- **Retention**: Active items indefinitely, archived items 18 months, then auto-deleted
- **Encryption**: macOS FileVault full-disk encryption (no additional layer needed)

**Data Minimization:**
- Only store necessary excerpts from communications (not full bodies)
- Zoom transcripts: Store relevant sections only, not complete transcripts
- Person records: Name and email only (no phone, address, etc.)

**Data Deletion:**
- Manual deletion: Immediate removal from database
- Automatic archival: Completed items after 18 months
- "Delete All Data" button in settings for complete wipe

### Encryption & Key Management

**At Rest:**
- SQLite database encrypted via macOS FileVault
- API keys encrypted in macOS Keychain
- OAuth tokens encrypted in Keychain

**In Transit:**
- All external API calls use HTTPS/TLS 1.2+
- SSL certificate verification enabled (no insecure connections)

**Key Management:**
- API keys stored in macOS Keychain via `keyring` Python library
- Keys never logged or displayed in UI
- Quarterly key rotation recommended

### Audit & Logging

**Security Events Logged:**
- API authentication failures
- Unusual API access patterns
- Database write failures
- Manual edits to high-priority items
- Data deletion operations

**Log Protection:**
- Logs stored in `~/Library/Logs/ExecAssistant/`
- Protected by macOS file permissions
- No sensitive content (email bodies, API keys redacted)
- Daily rotation, 7-day retention

---

## Data Model

### Entities

#### Entity: `items`

Primary table for storing all asks, commitments, and actions.

```sql
CREATE TABLE items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL CHECK (type IN ('ask', 'commitment', 'action')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    priority_source TEXT NOT NULL CHECK (priority_source IN ('ai', 'manual')),
    status TEXT NOT NULL DEFAULT 'open',
    responsible_person_id TEXT REFERENCES persons(id),
    source_type TEXT NOT NULL CHECK (source_type IN ('email', 'slack', 'zoom')),
    source_id TEXT NOT NULL,
    source_url TEXT,
    detected_at TEXT NOT NULL DEFAULT (datetime('now')),
    due_date TEXT,
    last_update_at TEXT,
    follow_up_flagged_at TEXT,
    completed_at TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_responsible ON items(responsible_person_id);
CREATE INDEX idx_items_follow_up ON items(follow_up_flagged_at) WHERE follow_up_flagged_at IS NOT NULL;
CREATE UNIQUE INDEX idx_items_source ON items(source_type, source_id);

-- Full-text search (SQLite FTS5)
CREATE VIRTUAL TABLE items_fts USING fts5(
    title, 
    description, 
    content='items', 
    content_rowid='rowid'
);
```

#### Entity: `relationships`

Tracks parent-child relationships between items.

```sql
CREATE TABLE relationships (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    parent_item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    child_item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('ask_to_commitment', 'commitment_to_action')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(parent_item_id, child_item_id)
);

CREATE INDEX idx_relationships_parent ON relationships(parent_item_id);
CREATE INDEX idx_relationships_child ON relationships(child_item_id);
```

#### Entity: `persons`

Stores information about individuals.

```sql
CREATE TABLE persons (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    slack_user_id TEXT,
    zoom_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_slack ON persons(slack_user_id);
```

#### Entity: `manual_edits`

Audit log of manual changes.

```sql
CREATE TABLE manual_edits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_manual_edits_item ON manual_edits(item_id);
```

#### Entity: `ai_extractions`

Raw AI extraction results.

```sql
CREATE TABLE ai_extractions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    extracted_items TEXT NOT NULL,
    model_used TEXT NOT NULL,
    confidence_score REAL,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_extractions_source ON ai_extractions(source_type, source_id);
CREATE INDEX idx_ai_extractions_model ON ai_extractions(model_used);
```

#### Entity: `learning_feedback`

User corrections for AI improvement.

```sql
CREATE TABLE learning_feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('false_positive', 'false_negative', 'priority_correction', 'person_correction')),
    original_value TEXT,
    corrected_value TEXT,
    context TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_learning_feedback_type ON learning_feedback(feedback_type);
```

#### Entity: `job_queue`

Job queue for processing.

```sql
CREATE TABLE job_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_type TEXT NOT NULL CHECK (source_type IN ('email', 'slack', 'zoom')),
    source_id TEXT NOT NULL UNIQUE,
    source_url TEXT,
    raw_content TEXT NOT NULL,
    metadata TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'processing', 'completed', 'failed')),
    claimed_by TEXT,
    claimed_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_job_queue_status ON job_queue(status, priority DESC, created_at);
CREATE INDEX idx_job_queue_source ON job_queue(source_type, source_id);
```

#### Entity: `processing_checkpoints`

Tracks last processed timestamp.

```sql
CREATE TABLE processing_checkpoints (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_type TEXT NOT NULL,
    last_processed_timestamp TEXT NOT NULL,
    checkpoint_data TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source_type)
);
```

#### Entity: `historical_processing_jobs`

Historical data processing jobs.

```sql
CREATE TABLE historical_processing_jobs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    errors TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_historical_jobs_status ON historical_processing_jobs(status);
```

#### Entity: `metrics`

System metrics storage.

```sql
CREATE TABLE metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
    value REAL NOT NULL,
    labels TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_metrics_name_time ON metrics(metric_name, timestamp);
```

### Relationships

- **items** ↔ **persons**: Many-to-one (many items assigned to one person)
- **items** ↔ **relationships**: One-to-many (one item can be parent/child in multiple relationships)
- **items** ↔ **manual_edits**: One-to-many (one item can have multiple edits)
- **items** ↔ **learning_feedback**: One-to-many (one item can generate multiple feedback entries)
- **ai_extractions** ↔ **items**: One-to-many (one extraction can produce multiple items)

### Validation Rules

**Item Validation:**
- `title`: Required, 1-500 characters
- `type`: Must be one of: ask, commitment, action
- `priority`: Must be one of: low, medium, high
- `status`: Valid values: open, in_progress, blocked, completed, archived
- `source_id`: Must be unique per source_type

**Relationship Validation:**
- Cannot create circular relationships
- `ask_to_commitment`: parent.type='ask', child.type='commitment'
- `commitment_to_action`: parent.type='commitment', child.type='action'
- One ask can have multiple commitments
- One commitment can have multiple actions

**Person Validation:**
- `email`: Valid email format, unique
- At least one of name or email must be present
- Duplicate detection: Merge if same email found

---

## Dependencies

### External Services

**AI/ML Services:**
- **OpenAI GPT-5** - Primary AI extraction engine
  - API Endpoint: `https://api.openai.com/v1/chat/completions`
  - Rate Limits: 10,000 TPM for standard tier
  - Fallback: Claude Sonnet 4.5
- **Anthropic Claude Sonnet 4.5** - Secondary AI extraction engine
  - API Endpoint: `https://api.anthropic.com/v1/messages`
  - Rate Limits: 80,000 TPM for standard tier
  - Model: `claude-sonnet-4-5-20250929`

**Integration Services:**
- **Microsoft Graph API** - Office 365 email access
  - API Version: v1.0
  - Authentication: OAuth 2.0
  - Permissions: Mail.Read, User.Read
- **Slack API** - Slack message access
  - API Version: Current
  - Authentication: OAuth 2.0 User Token
  - Permissions: channels:history, groups:history, im:history, users:read
- **Zoom API** - Meeting transcripts access
  - API Version: v2
  - Authentication: Server-to-Server OAuth
  - Permissions: meeting:read, recording:read

### Python Packages

```
openai>=1.0.0
anthropic>=0.18.0
msal>=1.24.0
msgraph-core>=1.0.0
slack-sdk>=3.23.0
keyring>=24.0.0
flask>=3.0.0
```

### System Requirements

- macOS 12.0 (Monterey) or later
- Python 3.11+
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Active internet connection

---

## Invariants

### INV-001: Unique Source Processing
**Rule:** Each communication must be processed exactly once.  
**Validation:** `(source_type, source_id)` is unique.  
**Enforcement:** UNIQUE constraint in database.

### INV-002: Priority Hierarchy
**Rule:** Manual priority overrides always take precedence over AI.  
**Validation:** If `priority_source='manual'`, AI cannot change priority.  
**Enforcement:** Application logic checks before updates.

### INV-003: Relationship Integrity
**Rule:** Child items must match relationship type constraints.  
**Validation:** ask→commitment, commitment→action type matching.  
**Enforcement:** Application validates before creating relationships.

### INV-004: Follow-up Flag Consistency
**Rule:** Items can only be flagged if not completed/archived.  
**Validation:** If flagged, status ≠ completed/archived.  
**Enforcement:** Application clears flag on completion.

### INV-005: Archival Timeline
**Rule:** Items archived only after 18 months of completion.  
**Validation:** archived_at requires completed_at + 18 months.  
**Enforcement:** Automated archival job validates dates.

### INV-006: Person Identity Consistency
**Rule:** Each person has exactly one unique email.  
**Validation:** email is UNIQUE and NOT NULL.  
**Enforcement:** Database constraint + duplicate merging.

### INV-007: Item Lifecycle State Machine
**Rule:** Valid state transitions only.  
**Validation:** Defined state transition rules enforced.  
**Enforcement:** Application validates transitions.

### INV-008: Confidence Score Bounds
**Rule:** AI confidence between 0.0 and 1.0.  
**Validation:** 0.0 ≤ confidence ≤ 1.0.  
**Enforcement:** Application validates AI responses.

### INV-009: Job Retry Limit
**Rule:** Maximum 3 retry attempts per job.  
**Validation:** attempts ≤ 3.  
**Enforcement:** Workers check count before claiming.

### INV-010: Acyclic Relationship Graph
**Rule:** No circular relationships.  
**Validation:** Item cannot be its own ancestor.  
**Enforcement:** Graph validation before creating relationships.

---

## Interfaces & Contracts

### Office 365 Email API

**Endpoint:** `https://graph.microsoft.com/v1.0/me/messages`

**Authentication:** OAuth 2.0 with delegated permissions  
**Permissions:** Mail.Read, User.Read

**Polling Strategy:** Delta queries every 60 seconds

**Response Format:**
```json
{
  "value": [{
    "id": "AAMkAGM2YWU3...",
    "subject": "Q4 Planning",
    "from": {
      "emailAddress": {
        "name": "Sarah Chen",
        "address": "sarah.chen@company.com"
      }
    },
    "receivedDateTime": "2025-10-25T09:30:00Z",
    "body": {
      "contentType": "html",
      "content": "..."
    }
  }],
  "@odata.deltaLink": "..."
}
```

### Slack API

**Endpoint:** `https://slack.com/api/conversations.history`

**Authentication:** OAuth 2.0 with User Token  
**Permissions:** channels:history, groups:history, im:history, users:read

**Strategy:** Socket Mode for real-time, polling fallback

**Message Format:**
```json
{
  "type": "message",
  "user": "U123ABC456",
  "text": "Can you review the deck by Friday?",
  "ts": "1698249000.123456",
  "channel": "C123ABC456"
}
```

### Zoom API

**Endpoint:** `https://api.zoom.us/v2/users/me/recordings`

**Authentication:** Server-to-Server OAuth  
**Permissions:** meeting:read, recording:read

**Polling:** Every 15 minutes

**Response Format:**
```json
{
  "meetings": [{
    "id": "9876543210",
    "topic": "Executive Staff Meeting",
    "start_time": "2025-10-25T10:00:00Z",
    "recording_files": [{
      "file_type": "TRANSCRIPT",
      "download_url": "https://...",
      "recording_start": "2025-10-25T10:00:00Z"
    }]
  }]
}
```

### AI Extraction API

**Primary: OpenAI GPT-5**

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Request:**
```json
{
  "model": "gpt-5",
  "messages": [{
    "role": "system",
    "content": "You are an AI assistant..."
  }, {
    "role": "user",
    "content": "Analyze the following message..."
  }],
  "temperature": 0.3,
  "max_tokens": 2000
}
```

**Response:**
```json
{
  "items": [{
    "type": "ask",
    "title": "Review marketing messaging deck",
    "description": "Marketing team needs approval...",
    "responsible_person": {
      "name": "You",
      "email": "executive@company.com"
    },
    "priority": "high",
    "confidence": 0.95,
    "due_date": "2025-11-01",
    "related_to": null
  }]
}
```

**Secondary: Anthropic Claude**

Same format as GPT-5, endpoint: `https://api.anthropic.com/v1/messages`

---

## Deterministic Tests

```json
{
  "id": "DT-001",
  "description": "Email with single ask extracts one ask item",
  "input": {
    "source_type": "email",
    "content": "Can you send me the Q4 report by Friday?",
    "metadata": {
      "sender_email": "sarah@company.com",
      "recipient_email": "exec@company.com",
      "timestamp": "2025-10-25T10:00:00Z"
    }
  },
  "expected_checksum": "sha256:a7f3c8d9e2b1..."
}
```

```json
{
  "id": "DT-002",
  "description": "High priority keywords trigger high priority",
  "input": {
    "source_type": "slack",
    "content": "URGENT: The API is down!",
    "metadata": {
      "sender_email": "eng@company.com",
      "timestamp": "2025-10-25T14:30:00Z"
    }
  },
  "expected_checksum": "sha256:b8e4d9f3c2a1..."
}
```

```json
{
  "id": "DT-003",
  "description": "Commitment with action creates linked items",
  "input": {
    "source_type": "email",
    "content": "You asked for the budget. Here it is.",
    "metadata": {
      "sender_email": "tom@company.com",
      "timestamp": "2025-10-25T16:00:00Z"
    }
  },
  "expected_checksum": "sha256:c9f5e0a4d3b2..."
}
```

```json
{
  "id": "DT-004",
  "description": "Informational FYI returns empty",
  "input": {
    "source_type": "email",
    "content": "FYI - Office closed next week.",
    "metadata": {
      "sender_email": "hr@company.com",
      "timestamp": "2025-10-25T11:00:00Z"
    }
  },
  "expected_checksum": "sha256:d0a6f1b5e4c3..."
}
```

```json
{
  "id": "DT-005",
  "description": "Multiple asks in Zoom transcript",
  "input": {
    "source_type": "zoom",
    "content": "Tom, prepare the forecast. Maria, update the roadmap.",
    "metadata": {
      "meeting_id": "9876543210",
      "timestamp": "2025-10-25T10:30:00Z",
      "participants": ["exec@company.com", "tom@company.com", "maria@company.com"]
    }
  },
  "expected_checksum": "sha256:e1b7g2c6f5d4..."
}
```

---

## Testing Strategy

This specification employs a comprehensive multi-layered testing approach to ensure agent-ready implementation:

**Deterministic Tests (DT-001 through DT-005):**
- Define must-hold invariants with concrete input/output examples
- Each test includes expected checksums for validation
- Cover core extraction scenarios: single ask, priority inference, relationship linking, informational filtering, multi-person identification

**Invariants (INV-001 through INV-010):**
- Business rules that must always hold true
- Enforced through database constraints and application logic
- Cover data integrity, state management, and relationship rules

**Validation Criteria (Acceptance Tests):**
- 6 user stories defining key user journeys
- 22+ Given-When-Then acceptance criteria
- Organized by functional area: Discovery, Relationship Tracking, Follow-up, Prioritization, Manual Management, Visibility, Archival

**Test Coverage Mapping:**
- Each Functional Requirement (FR-001 through FR-010) explicitly maps to relevant tests
- Traceability from requirements → deterministic tests → invariants → acceptance criteria
- Ensures comprehensive coverage of all system behaviors

**Testing Priorities:**
1. **Critical Path**: DT-001, DT-002, DT-003 (extraction accuracy)
2. **Data Integrity**: INV-001, INV-003, INV-006, INV-010 (uniqueness, relationships, consistency)
3. **User Workflow**: All acceptance criteria related to Discovery & Tracking
4. **Performance**: Timing requirements in acceptance criteria (2min latency, 500ms search)

Agents implementing this specification should validate against all three test layers to ensure correctness, reliability, and user experience quality.

---

## Validation Criteria

### User Stories

**Story 1:** As an executive, I want the assistant to automatically track action items from my emails, Slack, and meeting transcripts, so that I don't miss important commitments.

**Story 2:** As an executive, I want to track what I've asked others to deliver and monitor the status of those requests, so that I can follow up appropriately and ensure accountability.

**Story 3:** As an executive, I want asks to be prioritized by importance (with AI inference and my manual overrides), so that I can focus on what matters most.

**Story 4:** As an executive, I want to see all my commitments in one place with their current status, so that I can manage my responsibilities effectively.

**Story 5:** As an executive, I want to manually update any tracked item (status, priority, notes), so that I can correct errors and add context the AI might miss.

**Story 6:** As an executive, I want to know WHO is responsible for each commitment/action, so that I can follow up with the right person.

### Acceptance Criteria

**Discovery & Tracking:**
- [ ] Given a new email arrives, When it contains an ask/commitment/action, Then it is detected within 2 minutes
- [ ] Given a Slack message is posted, When it contains an ask/commitment/action, Then it is captured within 60 seconds
- [ ] Given a Zoom transcript is available, When it contains items, Then all are extracted and categorized
- [ ] Given I made a request, When they respond with a commitment, Then the system links them
- [ ] Given I made a request, When no commitment is made, Then the ask remains tracked as "Awaiting Commitment"
- [ ] Given an item is detected, When a person is identifiable, Then that person is assigned

**Relationship Tracking:**
- [ ] Given an ask exists, When a commitment is made, Then the commitment is linked to the ask
- [ ] Given a commitment exists, When multiple actions are posted, Then all actions are linked chronologically
- [ ] Given a commitment has multiple actions, When I view it, Then I see a timeline of all actions
- [ ] Given I asked someone for X, When no update within follow-up window, Then it's flagged
- [ ] Given an ask has no commitment, When I view dashboard, Then it's marked "uncommitted"

**Follow-up Timing:**
- [ ] Given HIGH priority item with no update, When 1-2 days pass, Then it's flagged
- [ ] Given MEDIUM priority item with no update, When 3-7 days pass, Then it's flagged
- [ ] Given LOW priority item with no update, When 1-2 weeks pass, Then it's flagged

**Prioritization:**
- [ ] Given a new item is detected, When AI analyzes content, Then it assigns initial priority
- [ ] Given I manually override priority, When I set it, Then manual priority takes precedence
- [ ] Given I have interacted over time, When sufficient data exists, Then prioritization improves

**Manual Management:**
- [ ] Given any tracked item, When I edit status manually, Then change is saved immediately
- [ ] Given any tracked item, When I add notes, Then notes are stored and visible
- [ ] Given any tracked item, When I manually link it, Then relationship is created
- [ ] Given incorrect detection, When I delete or mark "not an action", Then it's removed
- [ ] Given any tracked item, When I change responsible person, Then assignment updates

**Visibility:**
- [ ] Given multiple tracked items, When I view dashboard, Then I see all organized by priority
- [ ] Given item status changes, When change is detected, Then status updates automatically
- [ ] Given I want to filter, When I apply filters, Then only matching items display
- [ ] Given I want to search, When I enter a string, Then all containing items display

**Archival:**
- [ ] Given item marked complete, When 18 months pass, Then it's automatically archived
- [ ] Given item is archived, When I search archived, Then I can still view it

---

## Implementation Notes

### System Architecture

**Multi-Process Design:**

1. **Main Supervisor Process** - Launches and monitors child processes, health checks, graceful shutdown
2. **Email Monitor Process** - Polls Microsoft Graph API every 60 seconds
3. **Slack Monitor Process** - WebSocket connection via Socket Mode
4. **Zoom Monitor Process** - Polls Zoom API every 15 minutes
5. **AI Worker Processes (3x)** - Claim jobs, call GPT-5/Claude, write items
6. **Web Server Process** - Flask/FastAPI at localhost:5000

**Communication:** SQLite database as shared state, job queue pattern

### AI Prompt Architecture

Single unified prompt for both GPT-5 and Claude Sonnet 4.5:
- Extracts asks, commitments, actions
- Identifies responsible persons
- Infers priority levels
- Links related items
- Returns structured JSON

### Job Queue Implementation

SQLite-based queue with atomic job claiming:
- Maximum 3 retry attempts
- Priority field for future use
- Failed jobs visible in dashboard

### Error Handling Strategy

**Rate Limits:** OpenAI → Claude fallback, exponential backoff  
**Network Failures:** Offline mode, queue operations, retry logic  
**Data Quality:** Skip malformed, flag poor quality, handle missing data  
**AI Failures:** Retry alternate model, flag low confidence, queue on unavailability  
**Database Issues:** Restore from backup, disk space alerts, lock timeouts

### Observability

**Metrics:** 30+ tracked (process health, queue, AI performance, integrations)  
**Logging:** Structured JSON, daily rotation, 7-day retention  
**Health Check:** `/health` endpoint with component status

---

## Deployment Strategy

### Phase 1: Initial Setup (Week 1)

**Installation:**
```bash
git clone https://github.com/exec-assistant/exec-assistant.git
cd exec-assistant
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m exec_assistant.db.init
python -m exec_assistant.setup
```

**Setup Wizard:** Configure API keys (OpenAI, Anthropic, Office 365, Slack, Zoom) via web UI, stored in macOS Keychain

**Historical Processing (Optional):** Select date ranges, process in background, monitor progress

### Phase 2: Production Launch (Week 2)

**Background Service:**
```bash
python -m exec_assistant.install  # Creates launchd daemon
python -m exec_assistant.status   # Verify health
```

**Monitoring:** Daily dashboard checks, review failed queue, monitor API costs

### Phase 3: Optimization (Week 3-4)

AI learning from corrections, prompt evolution, performance tuning

---

## Rollback Plan

**Procedure:**
1. Stop services: `launchctl unload`
2. Restore database from backup
3. Rollback code: `git checkout <commit>`
4. Restart services
5. Reprocess gap period

**Data Loss:** Maximum 1 hour (hourly backups), reprocessable from APIs

---

## Glossary & Definitions

- **Ask:** A request requiring action (e.g., "Can you send the report?")
- **Commitment:** A promise to deliver by a time (e.g., "I'll have it by Friday")
- **Action:** Progress update on a commitment (e.g., "I sent the report")
- **Responsible Person:** Individual accountable for completing an item
- **Priority Levels:** High (1-7 days), Medium (1-4 weeks), Low (1-3 months)
- **Follow-up Window:** Time before flagging: High (1-2 days), Medium (3-7 days), Low (1-2 weeks)
- **Confidence Score:** AI certainty (0.0-1.0), <0.5 triggers review
- **Source ID:** Unique identifier per communication to prevent duplicates
- **Delta Query:** Efficient API pattern retrieving only new/changed items
- **Job Queue:** SQLite producer-consumer pattern for processing
- **Historical Processing:** One-time processing of past communications
- **Archival:** Removal from active views after 18 months (still searchable)

---

## Risks & Open Questions

### Risks

**R-1: AI Extraction Accuracy Below Target**
- **Impact:** High - Core functionality depends on correct identification
- **Mitigation:** Two models (GPT-5 + Claude), confidence scoring, manual review, continuous learning from corrections, 95% target validated through audits

**R-2: API Rate Limits During Peak Usage**
- **Impact:** Medium - Could delay processing
- **Mitigation:** Automatic fallback, exponential backoff, queue-based architecture, conservative polling

**R-3: Integration API Changes**
- **Impact:** Medium - External APIs may change
- **Mitigation:** Official SDKs, comprehensive error logging, health checks, regular testing

**R-4: Database Corruption or Data Loss**
- **Impact:** High - Loss of tracked items
- **Mitigation:** Hourly backups (24h), daily backups (7d), reprocessable from APIs, integrity checks

**R-5: Privacy Concerns**
- **Impact:** Medium - Sensitive data to AI services
- **Mitigation:** Clear user notification, no training on API data per policies, local storage, optional integration disabling

**R-6: Mac Sleep Missing Communications**
- **Impact:** Low - Gap during offline periods
- **Mitigation:** Automatic backfill on wake, checkpoints, dashboard "catching up" banner

### Open Questions

**Q-1: Filter asks by "made by me" vs "made to me"?**
- **Owner:** Product team
- **Due:** Before v1.0
- **Current:** All asks shown together, filterable by person

**Q-2: Handle forwarded emails with embedded asks?**
- **Owner:** Engineering team
- **Due:** During implementation
- **Current:** Extract from forwarded content, may need special handling

**Q-3: Slack DMs monitored by default or opt-in?**
- **Owner:** User privacy review
- **Due:** Before setup wizard
- **Current:** All accessible channels/DMs monitored (user grants permissions)

**Q-4: Ideal number of AI worker processes?**
- **Owner:** Performance testing
- **Due:** Week 2 optimization
- **Current:** 3 workers default, configurable

**Q-5: Extract asks from images/attachments?**
- **Owner:** Product roadmap
- **Due:** Post-v1.0 (out of scope)
- **Current:** Text-only extraction in v1.0

---

## Notes

### Technical Dependencies

**Python Packages:**
- openai>=1.0.0, anthropic>=0.18.0, msal>=1.24.0, msgraph-core>=1.0.0, slack-sdk>=3.23.0, keyring>=24.0.0, flask>=3.0.0, sqlite3 (built-in)

**System Requirements:**
- macOS 12.0+, Python 3.11+, 4GB RAM minimum (8GB recommended), 2GB disk, internet connection

### Assumptions

1. Single user (one executive)
2. English language
3. macOS only (no Windows/Linux in v1.0)
4. Valid API access for OpenAI, Anthropic, Office 365, Slack, Zoom
5. Local network (no external hosting)
6. User trusts OpenAI/Anthropic with communication content

### Future Enhancements (Out of Scope)

Mobile apps, multi-user support, project management integration, calendar integration, browser extension, NL command interface, automated responses, team analytics, custom AI training, E2E encryption for AI, additional platforms (Teams, Discord), image/PDF extraction, voice note transcription

---

**Status:** 🟢 Complete - Level 5  
**Agent Ready:** ✅ YES  
**Required Level:** 5/5 (HIGH Complexity) ✅ MET

**Specification Author:** Executive User  
**Created:** October 25, 2025  
**Last Updated:** October 25, 2025  
**Version:** 1.0.0
