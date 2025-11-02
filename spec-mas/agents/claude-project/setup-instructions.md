# Claude Project Setup Instructions

## Setting Up the Spec-MAS Specification Assistant

### Step 1: Create New Claude Project

1. Go to Claude.ai
2. Click on "Projects" in the sidebar
3. Click "Create Project"
4. Name it: "Spec-MAS Specification Assistant"

### Step 2: Add Project Knowledge

1. Click "Add Knowledge" in your project
2. Upload these files from the `claude-project/` directory:
   - `system-prompt.md` (REQUIRED - Primary instructions)
   - `maturity-model.md` (REQUIRED - Level definitions)
   - `validation-rules.md` (REQUIRED - Quality checks)

### Step 3: Add Example Specifications

Upload files from the `examples/` directory:
- `level-3-filter-spec.md` (Easy complexity example)
- `level-5-auth-spec.md` (High complexity example)

These provide Claude with concrete examples of well-formed specifications.

### Step 4: Configure Project Instructions

In the Project Instructions field, paste the following:

```
You are the Spec-MAS Specification Assistant. Your role is to guide users through creating agent-ready specifications using progressive refinement.

Primary behaviors:
1. Automatically assess complexity (Easy/Moderate/High)
2. Determine required maturity level (3/4/5)
3. Guide users level by level - never skip
4. Validate completeness before progression
5. Export specifications in Spec Kit format

Key commands:
- /new [description] - Start new spec
- /assess - Evaluate current spec
- /enhance - Guide to next level
- /validate - Check if agent-ready
- /export - Generate markdown

Refer to system-prompt.md for detailed behavior guidelines.
```

### Step 5: Test the Assistant

Start a conversation in your project with:
```
/new I want to build a user registration form with email verification
```

Claude should:
1. Assess this as EASY or MODERATE complexity
2. Set required level (3 or 4)
3. Begin with Level 1 requirements
4. Guide you through progressive refinement

### Common Use Patterns

#### Starting Fresh
```
User: /new payment processing system
Assistant: [Assesses as HIGH complexity, requires Level 5]
```

#### Building Incrementally
```
User: [Provides user story]
Assistant: "Good! For Level 1, I also need..."
User: [Provides acceptance criteria]
Assistant: "✅ Level 1 complete! For Level 2..."
```

#### Quick Validation
```
User: /validate
Assistant: [Shows what's complete, what's missing]
```

### Tips for Best Results

1. **Be Specific**: Instead of "make a form", say "create a user registration form with email and password"

2. **Follow Guidance**: Claude will ask specific questions - answer them directly

3. **Don't Skip**: Even if you know what's needed, let Claude guide you through each level

4. **Review Examples**: Look at the example specs to understand the expected format

5. **Iterate**: Use /enhance repeatedly to reach required maturity

### Troubleshooting

**Issue**: Claude doesn't recognize commands
**Solution**: Ensure system-prompt.md is in project knowledge

**Issue**: Complexity assessment seems wrong
**Solution**: Provide more detail about technical requirements

**Issue**: Claude skips levels
**Solution**: Remind it to follow progressive refinement

**Issue**: Specifications aren't detailed enough
**Solution**: Use /enhance to add missing elements

### Integration with Tools

Once you have a Level 3+ specification:

1. **Export**: Use /export to get markdown
2. **Save**: Store in your `/specs` directory
3. **Validate**: Run through your CI/CD pipeline
4. **Execute**: Provide to AI agents for implementation

### Advanced Usage

#### Continuing Previous Work
```
User: Here's my partial spec: [paste]
User: /assess
Assistant: "You're at Level 2, need Level 4..."
User: /enhance
```

#### Bulk Processing
Create multiple specs in sequence:
```
User: /new feature 1
[Complete spec 1]
User: /export
User: /new feature 2
[Continue...]
```

#### Team Collaboration
Export specs and share with team for review:
```
User: /export
Assistant: [Generates markdown]
User: [Copy to shared repository]
Team: [Reviews via PR]
```

## Support Resources

- **Documentation**: See README.md
- **Examples**: Check examples/ directory
- **Validation Rules**: Review validation-rules.md
- **Maturity Model**: Understand levels via maturity-model.md

## Version History

- v1.0.0 - Initial release with 5-level maturity model
- Supports Easy/Moderate/High complexity assessment
- Claude 3.5 Sonnet optimized
