const path = require('path');
const {
  parseSpec,
  extractFrontMatter,
  parseMarkdownSections,
  getRequiredSections
} = require('../../scripts/spec-parser');

describe('Spec Parser', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');

  it('UP-PARSE-001: parses YAML front-matter at file start', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    expect(spec.metadata.name).toBe('Validation Fixture');
    expect(spec.metadata.id).toBe('feat-validate-001');
  });

  it('UP-PARSE-004: parses front-matter after title', () => {
    const content = '# Title\n\n---\nname: After Title\ncomplexity: EASY\nmaturity: 2\n---\n\n# Overview\ntext';
    const { frontMatter } = extractFrontMatter(content);
    expect(frontMatter.name).toBe('After Title');
  });

  it('UP-PARSE-005: returns null front-matter when missing', () => {
    const content = '# Overview\ntext';
    const { frontMatter } = extractFrontMatter(content);
    expect(frontMatter).toBeNull();
  });

  it('UP-PARSE-010: parses H1 sections into normalized keys', () => {
    const body = '# Functional Requirements\n- FR-1: Test\n';
    const sections = parseMarkdownSections(body);
    expect(sections.functional_requirements).toBeDefined();
  });

  it('UP-PARSE-013: extracts functional requirements with validation criteria', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    expect(spec.sections.functionalRequirements).toHaveLength(1);
    expect(spec.sections.functionalRequirements[0].id).toBe('FR-1');
    expect(spec.sections.functionalRequirements[0].validationCriteria.length).toBeGreaterThan(0);
  });

  it('UP-PARSE-014: extracts acceptance criteria in Given/When/Then format', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    expect(spec.sections.acceptanceCriteria.length).toBe(1);
    expect(spec.sections.acceptanceCriteria[0].toLowerCase()).toContain('given');
    expect(spec.sections.acceptanceCriteria[0].toLowerCase()).toContain('when');
    expect(spec.sections.acceptanceCriteria[0].toLowerCase()).toContain('then');
  });

  it('UP-PARSE-015: extracts deterministic tests from JSON code blocks', () => {
    const spec = parseSpec(path.join(fixtures, 'high-with-dt.md'));
    expect(spec.sections.deterministicTests.length).toBe(1);
    expect(spec.sections.deterministicTests[0].expected).toBe('bar');
  });

  it('UP-PARSE-002: normalizes legacy fields', () => {
    const content = '---\nname: Legacy\nmaturity_level: 3\ntitle: Legacy Title\n---\n\n# Overview\ntext';
    const { frontMatter } = extractFrontMatter(content);
    expect(frontMatter.maturity).toBe(3);
    expect(frontMatter.name).toBe('Legacy');
  });

  it('UP-PARSE-003: generates id from name when missing', () => {
    const content = '---\nname: Example Name\ncomplexity: EASY\nmaturity: 2\n---\n\n# Overview\ntext';
    const { frontMatter } = extractFrontMatter(content);
    expect(frontMatter.id).toBe('feat-example-name');
  });

  it('UP-PARSE-011: parses H2 subsections into nested objects', () => {
    const body = '# Acceptance Tests\n## Acceptance Criteria\n- [ ] AT-1: Given x, When y, Then z';
    const sections = parseMarkdownSections(body);
    expect(sections.acceptance_tests.acceptance_criteria).toBeDefined();
  });

  it('UP-PARSE-012: recognizes formal template sections', () => {
    const body = '# Overview\ntext\n# Acceptance Tests\ntext';
    const sections = parseMarkdownSections(body);
    expect(sections.overview).toBeDefined();
    expect(sections.acceptance_tests).toBeDefined();
  });

  it('UP-PARSE-016: required sections include data inventory for maturity 3+', () => {
    const required = getRequiredSections('MODERATE', 3);
    expect(required).toContain('data_inventory');
  });
});
