-- Initial schema migration for exec-assistant
-- Creates tables: items, persons, relationships, manual_edits, learning_feedback, jobs

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Create items table
CREATE TABLE items (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    type TEXT NOT NULL CHECK (type IN ('ask', 'commitment', 'action')),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
    description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 2000),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    priority_source TEXT NOT NULL CHECK (priority_source IN ('ai', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    responsible_person_id TEXT NOT NULL,
    confidence_score REAL NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    source_type TEXT NOT NULL CHECK (source_type IN ('email', 'slack', 'zoom')),
    source_id TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    flagged_for_followup INTEGER NOT NULL DEFAULT 0 CHECK (flagged_for_followup IN (0, 1)),
    flagged_at TIMESTAMP,
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
    archived_at TIMESTAMP,
    historical_import INTEGER NOT NULL DEFAULT 0 CHECK (historical_import IN (0, 1)),
    UNIQUE(source_type, source_id),
    CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    ),
    CHECK (
        (archived = 1 AND archived_at IS NOT NULL) OR
        (archived = 0 AND archived_at IS NULL)
    ),
    CHECK (
        (flagged_for_followup = 1 AND flagged_at IS NOT NULL) OR
        (flagged_for_followup = 0 AND flagged_at IS NULL)
    ),
    CHECK (
        due_date IS NULL OR 
        due_date > created_at
    ),
    FOREIGN KEY (responsible_person_id) REFERENCES persons(id) ON DELETE RESTRICT
);

-- Create persons table
CREATE TABLE persons (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    email TEXT UNIQUE CHECK (
        email IS NULL OR 
        (length(email) <= 255 AND email LIKE '%@%.%')
    ),
    slack_user_id TEXT UNIQUE,
    zoom_user_id TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        email IS NOT NULL OR
        slack_user_id IS NOT NULL OR
        zoom_user_id IS NOT NULL
    )
);

-- Create relationships table
CREATE TABLE relationships (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    parent_item_id TEXT NOT NULL,
    child_item_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (
        relationship_type IN ('ask_to_commitment', 'commitment_to_action')
    ),
    confidence_score REAL NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (parent_item_id != child_item_id),
    FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (child_item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(parent_item_id, child_item_id)
);

-- Create manual_edits table
CREATE TABLE manual_edits (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    item_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT NOT NULL, -- JSON serialized
    new_value TEXT NOT NULL, -- JSON serialized
    edited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Create learning_feedback table
CREATE TABLE learning_feedback (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    item_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (
        feedback_type IN ('priority_correction', 'false_positive', 'relationship_correction')
    ),
    ai_prediction TEXT NOT NULL, -- JSON serialized
    user_correction TEXT NOT NULL, -- JSON serialized
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Create jobs table
CREATE TABLE jobs (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID
    job_type TEXT NOT NULL CHECK (
        job_type IN ('process_email', 'process_slack', 'process_zoom')
    ),
    source_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
    payload TEXT NOT NULL CHECK (json_valid(payload)),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    CHECK (
        (status IN ('completed', 'failed') AND completed_at IS NOT NULL) OR
        (status NOT IN ('completed', 'failed') AND completed_at IS NULL)
    ),
    CHECK (
        (status = 'processing' AND started_at IS NOT NULL) OR
        (status != 'processing' AND started_at IS NULL)
    )
);

-- Create indexes for performance optimization
CREATE INDEX idx_items_responsible_person ON items(responsible_person_id);
CREATE INDEX idx_items_source ON items(source_type, source_id);
CREATE INDEX idx_items_priority_status ON items(priority, status) WHERE archived = 0;
CREATE INDEX idx_items_due_date ON items(due_date) WHERE archived = 0;
CREATE INDEX idx_items_flagged ON items(flagged_for_followup) WHERE archived = 0;
CREATE INDEX idx_items_created ON items(created_at);
CREATE INDEX idx_items_completed ON items(completed_at);
CREATE INDEX idx_persons_email ON persons(email) WHERE email IS NOT NULL;
CREATE INDEX idx_persons_slack ON persons(slack_user_id) WHERE slack_user_id IS NOT NULL;
CREATE INDEX idx_persons_zoom ON persons(zoom_user_id) WHERE zoom_user_id IS NOT NULL;
CREATE INDEX idx_relationships_parent ON relationships(parent_item_id);
CREATE INDEX idx_relationships_child ON relationships(child_item_id);
CREATE INDEX idx_manual_edits_item ON manual_edits(item_id);
CREATE INDEX idx_learning_feedback_item ON learning_feedback(item_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_items_timestamp 
AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_persons_timestamp
AFTER UPDATE ON persons
BEGIN
    UPDATE persons SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create virtual table for full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    description,
    content='items',
    content_rowid='id',
    tokenize='porter unicode61'
);

-- Create triggers to keep FTS table in sync
CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, description)
    VALUES('delete', old.id, old.title, old.description);
END;

CREATE TRIGGER items_au AFTER UPDATE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, description)
    VALUES('delete', old.id, old.title, old.description);
    INSERT INTO items_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;