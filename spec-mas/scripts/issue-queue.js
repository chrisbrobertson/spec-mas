#!/usr/bin/env node

/**
 * Spec-MAS GitHub Issues Work Queue
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');
const { decomposeSpec } = require('./task-decomposition');
const { buildIssuePayload, buildCommentBody, createIssue, commentIssue } = require('./github-issues');

function printUsage() {
  console.log(`
Usage:
  node scripts/issue-queue.js create <spec-file>
  node scripts/issue-queue.js comment <issue-number> <status>

Environment:
  GITHUB_TOKEN=...
  GITHUB_REPO=owner/name
`);
}

async function handleCreate(specPath) {
  const spec = parseSpec(specPath);
  const analysis = decomposeSpec(spec);
  const tasks = analysis.tasks || [];
  const created = [];

  for (const task of tasks) {
    const labels = [
      `spec:${spec.metadata.id}`,
      'phase:implement',
      `agent:${task.agent}`,
      `area:${task.agent}`
    ];

    const body = [
      `Spec: ${spec.metadata.id}`,
      `Scope: ${task.title}`,
      `Description: ${task.description}`,
      `Acceptance: ${task.acceptance || 'TBD'}`,
      `Definition of Done: ${task.definitionOfDone || 'TBD'}`,
      `Dependencies: ${(task.dependencies || []).join(', ') || 'none'}`
    ].join('\n');

    const payload = buildIssuePayload({
      title: `[${spec.metadata.id}] ${task.title}`,
      body,
      labels
    });

    const issue = await createIssue(payload);
    created.push(issue.number);
  }

  console.log(`Created issues: ${created.join(', ')}`);
}

async function handleComment(issueNumber, status) {
  const body = buildCommentBody({
    agent: 'specmas',
    status,
    context: 'Automated update',
    findings: [],
    next: []
  });
  await commentIssue(issueNumber, body);
  console.log(`Commented on issue ${issueNumber}`);
}

async function main() {
  const [cmd, arg1, arg2] = process.argv.slice(2);
  if (!cmd) {
    printUsage();
    process.exit(1);
  }

  try {
    if (cmd === 'create') {
      if (!arg1) throw new Error('spec-file required');
      await handleCreate(path.resolve(arg1));
    } else if (cmd === 'comment') {
      if (!arg1 || !arg2) throw new Error('issue-number and status required');
      await handleComment(arg1, arg2);
    } else {
      printUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { handleCreate, handleComment };
