#!/usr/bin/env node
/**
 * agent-team-generator installer.
 *
 * Copies the skill into a Claude Code skills directory:
 *   npx agent-team-generator            → ~/.claude/skills/agent-team-generator (global)
 *   npx agent-team-generator --project  → ./.claude/skills/agent-team-generator (this repo only)
 *   npx agent-team-generator --force    → overwrite an existing install
 *   npx agent-team-generator --uninstall [--project]
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'agent-team-generator';
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npx ${SKILL_NAME} [options]

Installs the ${SKILL_NAME} skill for Claude Code.

Options:
  (none)       install to ~/.claude/skills/${SKILL_NAME} (available in every project)
  --project    install to ./.claude/skills/${SKILL_NAME} (this repo only)
  --force      overwrite an existing installation
  --uninstall  remove the installation (combine with --project for a local one)
  -h, --help   show this help
`);
  process.exit(0);
}

const unknown = args.filter((a) => !['--project', '--force', '--uninstall'].includes(a));
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(' ')} (try --help)`);
  process.exit(1);
}

const baseDir = args.includes('--project')
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(os.homedir(), '.claude', 'skills');
const target = path.join(baseDir, SKILL_NAME);
const source = path.join(__dirname, '..', 'skills', SKILL_NAME);

if (args.includes('--uninstall')) {
  if (!fs.existsSync(target)) {
    console.log(`Nothing to remove at ${target}`);
    process.exit(0);
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
  process.exit(0);
}

if (!fs.existsSync(path.join(source, 'SKILL.md'))) {
  console.error(`Package is missing its skill payload (expected ${source}). Reinstall the package.`);
  process.exit(1);
}

if (fs.existsSync(target)) {
  if (!args.includes('--force')) {
    console.error(`${target} already exists.\nRe-run with --force to overwrite it.`);
    process.exit(1);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

fs.mkdirSync(baseDir, { recursive: true });
fs.cpSync(source, target, { recursive: true });

console.log(`Installed ${SKILL_NAME} → ${target}

Next steps:
  1. Open Claude Code in the project you want an agent team for.
  2. Run /${SKILL_NAME} (or just describe the setup you want — the skill
     triggers on "set up my agent team", "scaffold agents", etc.).
`);
