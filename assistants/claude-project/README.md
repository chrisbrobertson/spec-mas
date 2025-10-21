# Spec-MAS Claude Project

> **A specialized Claude Project for creating agent-ready specifications using the Spec-MAS v3 framework**

This directory contains everything you need to set up a Claude AI assistant that guides users through creating comprehensive, high-quality specifications that AI agents can implement without human clarification.

---

## 🎯 What This Does

This Claude Project helps you create specifications that are:

- ✅ **Complete** - All information needed for implementation
- ✅ **Clear** - No ambiguous or vague requirements
- ✅ **Testable** - Every requirement has validation criteria
- ✅ **Agent-Ready** - AI agents can implement without asking questions
- ✅ **Progressive** - Built incrementally through 5 maturity levels

---

## 🚀 Quick Start

1. **Create Claude Project** at [claude.ai/projects](https://claude.ai)
2. **Paste** `CUSTOM_INSTRUCTIONS.md` into Custom Instructions
3. **Upload** required knowledge files (see checklist below)
4. **Test** with: `/new Add a contact form to the website`

**Estimated Setup Time:** 5 minutes

📖 **Full Setup Guide:** See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

---

## 📁 Files in This Directory

### Core Configuration

| File | Purpose | Use |
|------|---------|-----|
| `CUSTOM_INSTRUCTIONS.md` | System prompt | Paste into Claude Project settings |
| `SETUP_INSTRUCTIONS.md` | Complete setup guide | Follow for detailed setup |
| `README.md` | This file | Overview and navigation |

### Knowledge Base Files

| File | Priority | Description |
|------|----------|-------------|
| `QUICK_REFERENCE.md` | Required | Complexity guide, maturity levels, quick lookup |
| `WORKFLOW_GUIDE.md` | Required | Step-by-step process through all levels |
| `maturity-model.md` | Required | Detailed requirements for each level |
| `validation-rules.md` | Required | Quality rules and validation logic |
| `EXAMPLE_CONVERSATIONS.md` | Recommended | Real conversation examples |

### Templates

| File | Purpose |
|------|---------|
| `templates/base-template.md` | Starting point for all new specifications |

---

## 📦 Setup Checklist

### ✅ Required Steps

- [ ] Create Claude Project named "Spec-MAS Specification Assistant"
- [ ] Paste `CUSTOM_INSTRUCTIONS.md` into Custom Instructions
- [ ] Upload `QUICK_REFERENCE.md` to project knowledge
- [ ] Upload `WORKFLOW_GUIDE.md` to project knowledge
- [ ] Upload `maturity-model.md` to project knowledge
- [ ] Upload `validation-rules.md` to project knowledge
- [ ] Test with `/new` command

### 📚 Recommended Additions

- [ ] Upload `EXAMPLE_CONVERSATIONS.md`
- [ ] Upload `templates/base-template.md`
- [ ] Upload example specs from `../docs/examples/`

---

## 🎮 How to Use

### Commands

```bash
/new [description]    # Start a new specification
/assess [spec]        # Evaluate existing specification
/enhance              # Progress to next maturity level
/validate             # Check if agent-ready
/export               # Generate final markdown
/examples             # Show relevant examples
/help                 # Display capabilities
```

### Typical Workflow

```
1. /new Add user authentication system
   ↓
2. Answer Level 1 questions (users, goals, metrics)
   ↓
3. Answer Level 2 questions (tech stack, integrations)
   ↓
4. Answer Level 3 questions (errors, performance, security)
   ↓
5. Continue to Level 4 or 5 if needed
   ↓
6. /validate to check agent readiness
   ↓
7. /export to get final specification
```

---

## 📊 Complexity & Maturity Levels

### Complexity (What You're Building)

| Complexity | Examples | Required Level |
|------------|----------|----------------|
| **EASY** | CRUD, forms, lists, basic UI | Level 3 |
| **MODERATE** | Integrations, workflows, APIs | Level 4 |
| **HIGH** | Security, real-time, compliance | Level 5 |

### Maturity (Specification Completeness)

| Level | Name | Time | What You Add |
|-------|------|------|--------------|
| 1 | Foundation | 15-20 min | User stories, acceptance criteria |
| 2 | Technical | 20-30 min | Tech stack, integrations |
| 3 | Robustness | 30-45 min | Errors, performance, security |
| 4 | Governance | 45-60 min | Architecture, compliance |
| 5 | Complete | 60-90 min | Examples, edge cases |

---

## 💡 Key Features

- **Progressive Disclosure** - One level at a time, never overwhelming
- **Automatic Complexity Assessment** - Assistant classifies for you
- **Quality Enforcement** - Can't skip levels or leave vague requirements
- **Context-Aware Guidance** - Specific questions based on your feature
- **Validation & Export** - Checks readiness and exports standard format

---

## 🔧 Troubleshooting

### Setup Issues

**Commands not recognized?**
- Verify `CUSTOM_INSTRUCTIONS.md` is pasted correctly
- Ensure knowledge files are uploaded

**Generic responses?**
- Upload required knowledge files
- Restart conversation in project

### Usage Issues

**Assistant skips levels?**
- Remind: "We need to complete Level N first"

**Too many questions?**
- Ask: "One question at a time please"

**Stuck on a question?**
- Use `/examples` command
- Ask: "Can you show me options?"

---

## 📚 Documentation

### Getting Started
- **Setup:** [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
- **Quick Reference:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Workflow:** [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)

### Detailed Information
- **Maturity Model:** [maturity-model.md](maturity-model.md)
- **Validation Rules:** [validation-rules.md](validation-rules.md)
- **Example Conversations:** [EXAMPLE_CONVERSATIONS.md](EXAMPLE_CONVERSATIONS.md)

### Examples
- **Simple (EASY):** `../docs/examples/level-3-filter-spec.md`
- **Complex (HIGH):** `../docs/examples/level-5-auth-spec.md`

---

## 🎯 Try It Now

After setup, start your first specification:

```
/new Add a user profile avatar upload feature
```

The assistant will guide you through creating a complete, agent-ready specification step by step.

---

## 📈 Success Metrics

**You'll know it's working when:**

- ✅ Specifications completed in expected time
- ✅ AI agents implement without clarification
- ✅ Fewer bugs from unclear requirements
- ✅ Team references specs during development
- ✅ Faster onboarding for new members

---

## 🤝 Contributing

To improve this Claude Project:

1. Test with various feature types
2. Note areas of confusion
3. Suggest additional examples
4. Share successful specifications
5. Update templates as patterns emerge

---

## 📄 License

Part of the Spec-MAS project. See repository root for license information.

---

**Ready to create your first agent-ready specification? Follow the [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) to get started!**
