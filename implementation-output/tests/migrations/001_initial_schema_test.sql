-- Test data setup
BEGIN;

-- Test inserting valid person
INSERT INTO persons (name, email)
VALUES ('Test User', 'test@example.com');

-- Test person validation rules
DO $$
BEGIN
    -- Test empty name
    BEGIN
        INSERT INTO persons (name, email) VALUES ('', 'invalid@example.com');
        RAISE EXCEPTION 'Expected error for empty name';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    -- Test invalid email
    BEGIN
        INSERT INTO persons (name, email) VALUES ('Invalid Email', 'not-an-email');
        RAISE EXCEPTION 'Expected error for invalid email';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    -- Test no identifier
    BEGIN
        INSERT INTO persons (name) VALUES ('No Identifier');
        RAISE EXCEPTION 'Expected error for missing identifier';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;

-- Test item creation and validation
DO $$
DECLARE
    person_id UUID;
BEGIN
    SELECT id INTO person_id FROM persons LIMIT 1;

    -- Test valid item
    INSERT INTO items (
        type, title, description, priority, priority_source, status,
        responsible_person_id, confidence_score, source_type, source_id
    )
    VALUES (
        'ask', 'Test Item', 'Description', 'high', 'ai', 'pending',
        person_id, 0.95, 'email', 'test-source-1'
    );

    -- Test invalid type
    BEGIN
        INSERT INTO items (
            type, title, description, priority, priority_source, status,
            responsible_person_id, confidence_score, source_type, source_id
        )
        VALUES (
            'invalid', 'Test Item', 'Description', 'high', 'ai', 'pending',
            person_id, 0.95, 'email', 'test-source-2'
        );
        RAISE EXCEPTION 'Expected error for invalid type';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    -- Test confidence score range
    BEGIN
        INSERT INTO items (
            type, title, description, priority, priority_source, status,
            responsible_person_id, confidence_score, source_type, source_id
        )
        VALUES (
            'ask', 'Test Item', 'Description', 'high', 'ai', 'pending',
            person_id, 1.5, 'email', 'test-source-3'
        );
        RAISE EXCEPTION 'Expected error for invalid confidence score';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;

-- Test relationships
DO $$
DECLARE
    person_id UUID;
    ask_id UUID;
    commitment_id UUID;
    action_id UUID;
BEGIN
    SELECT id INTO person_id FROM persons LIMIT 1;

    -- Create ask
    INSERT INTO items (
        type, title, description, priority, priority_source, status,
        responsible_person_id, confidence_score, source_type, source_id
    )
    VALUES (
        'ask', 'Test Ask', 'Description', 'high', 'ai', 'pending',
        person_id, 0.95, 'email', 'test-source-ask'
    )
    RETURNING id INTO ask_id;

    -- Create commitment
    INSERT INTO items (
        type, title, description, priority, priority_source, status,
        responsible_person_id, confidence_score, source_type, source_id
    )
    VALUES (
        'commitment', 'Test Commitment', 'Description', 'high', 'ai', 'pending',
        person_id, 0.95, 'email', 'test-source-commitment'
    )
    RETURNING id INTO commitment_id;

    -- Create action
    INSERT INTO items (
        type, title, description, priority, priority_source, status,
        responsible_person_id, confidence_score, source_type, source_id
    )
    VALUES (
        'action', 'Test Action', 'Description', 'high', 'ai', 'pending',
        person_id, 0.95, 'email', 'test-source-action'
    )
    RETURNING id INTO action_id;

    -- Test valid relationships
    INSERT INTO relationships (parent_item_id, child_item_id, relationship_type, confidence_score)
    VALUES (ask_id, commitment_id, 'ask_to_commitment', 0.9);

    INSERT INTO relationships (parent_item_id, child_item_id, relationship_type, confidence_score)
    VALUES (commitment_id, action_id, 'commitment_to_action', 0.9);

    -- Test invalid relationship type
    BEGIN
        INSERT INTO relationships (parent_item_id, child_item_id, relationship_type, confidence_score)
        VALUES (ask_id, action_id, 'ask_to_action', 0.9);
        RAISE EXCEPTION 'Expected error for invalid relationship type';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    -- Test circular relationship
    BEGIN
        INSERT INTO relationships (parent_item_id, child_item_id, relationship_type, confidence_score)
        VALUES (action_id, ask_id, 'ask_to_commitment', 0.9);
        RAISE EXCEPTION 'Expected error for circular relationship';
    EXCEPTION WHEN raise_exception THEN
        -- Expected 'Circular relationship detected'
    END;
END $$;

-- Test manual edits
DO $$
DECLARE
    item_id UUID;
BEGIN
    SELECT id INTO item_id FROM items LIMIT 1;

    INSERT INTO manual_edits (item_id, field_name, old_value, new_value)
    VALUES (item_id, 'priority', '"medium"', '"high"');
END $$;

-- Test learning feedback
DO $$
DECLARE
    item_id UUID;
BEGIN
    SELECT id INTO item_id FROM items LIMIT 1;

    INSERT INTO learning_feedback (
        item_id, feedback_type, ai_prediction, user_correction
    )
    VALUES (
        item_id,
        'priority_correction',
        '{"priority": "medium", "confidence": 0.8}',
        '{"priority": "high", "reason": "CEO involvement"}'
    );

    -- Test invalid JSON
    BEGIN
        INSERT INTO learning_feedback (
            item_id, feedback_type, ai_prediction, user_correction
        )
        VALUES (
            item_id,
            'priority_correction',
            'not-json',
            '{"priority": "high"}'
        );
        RAISE EXCEPTION 'Expected error for invalid JSON';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;

-- Test jobs
DO $$
BEGIN
    INSERT INTO jobs (job_type, source_id, status, payload)
    VALUES (
        'process_email',
        'email:123',
        'pending',
        '{"subject": "Test", "body": "Test email"}'
    );

    -- Test retry count limit
    BEGIN
        INSERT INTO jobs (job_type, source_id, status, payload, retry_count)
        VALUES (
            'process_email',
            'email:124',
            'failed',
            '{"subject": "Test", "body": "Test email"}',
            4
        );
        RAISE EXCEPTION 'Expected error for retry count > 3';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
END $$;

-- Test full-text search
DO $$
DECLARE
    person_id UUID;
    search_result UUID;
BEGIN
    SELECT id INTO person_id FROM persons LIMIT 1;

    INSERT INTO items (
        type, title, description, priority, priority_source, status,
        responsible_person_id, confidence_score, source_type, source_id
    )
    VALUES (
        'ask',
        'Search Test Item',
        'This is a test description for full-text search',
        'high', 'ai', 'pending',
        person_id, 0.95, 'email', 'test-source-search'
    );

    -- Test full-text search
    SELECT id INTO search_result
    FROM items
    WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'test & search');

    IF search_result IS NULL THEN
        RAISE EXCEPTION 'Full-text search failed to find inserted item';
    END IF;
END $$;

ROLLBACK;