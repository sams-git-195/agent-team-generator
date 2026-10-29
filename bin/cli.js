#!/usr/bin/env node
/**
 * agent-team-generator installer.
 *
 * Copies the skill (an agentskills.io-format SKILL.md folder) into a harness's skills directory:
 *   npx agent-team-generator                       → ~/.claude/skills/agent-team-generator (global)
 *   npx agent-team-generator --project             → ./.claude/skills/agent-team-generator (this repo only)
 *   npx agent-team-generator --harness opencode    → ~/.config/opencode/skills/agent-team-generator
 *   npx agent-team-generator --to ./vendor/skills  → ./vendor/skills/agent-team-generator
 *   npx agent-team-generator --force               → overwrite an existing install
 *   npx agent-team-generator --uninstall [--project] [--harness <name> | --to <dir>]
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'agent-team-generator';
const args = process.argv.slice(2);

// Skill directories per harness, verified against each project's docs (see README "Install").
// `global` is relative to the home directory, `project` to the current working directory.
const HARNESSES = {
  claude: { global: ['.claude', 'skills'], project: ['.claude', 'skills'], label: 'Claude Code' },
  opencode: {
    global: ['.config', 'opencode', 'skills'],
    project: ['.opencode', 'skills'],
    label: 'OpenCode (also scans .claude/skills and .agents/skills)',
  },
  // Codex's current docs list only the shared .agents/skills locations (plus /etc/codex/skills);
  // ~/.codex/skills is not documented, so this preset is the same as `agents`.
  codex: { global: ['.agents', 'skills'], project: ['.agents', 'skills'], label: 'Codex CLI' },
  cursor: { global: ['.cursor', 'skills'], project: ['.cursor', 'skills'], label: 'Cursor (also scans .agents, .claude, .codex)' },
  gemini: { global: ['.gemini', 'skills'], project: ['.gemini', 'skills'], label: 'Gemini CLI (also scans .agents/skills)' },
  agents: { global: ['.agents', 'skills'], project: ['.agents', 'skills'], label: 'shared .agents/skills convention' },
};
const DEFAULT_HARNESS = 'claude';

function presetTable() {
  return Object.entries(HARNESSES)
    .map(([name, h]) => {
      const g = path.posix.join('~', ...h.global);
      const p = path.posix.join('.', ...h.project);
      return `    ${name.padEnd(9)} ${g.padEnd(28)} ${p.padEnd(20)} ${h.label}`;
    })
    .join('\n');
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npx ${SKILL_NAME} [options]

Installs the ${SKILL_NAME} skill (SKILL.md format) for Claude Code, OpenCode, Codex CLI,
Cursor, Gemini CLI or any other harness that loads Agent Skills.

Options:
  (none)             install to ~/.claude/skills/${SKILL_NAME} (available in every project)
  --project          install into this repo instead of the home directory
  --harness <name>   pick a harness preset (default: ${DEFAULT_HARNESS}); combine with --project
  --to <dir>         install into <dir>/${SKILL_NAME} instead of a preset location
  --force            overwrite an existing installation
  --uninstall        remove the installation from the same target
  -h, --help         show this help

Presets:
    ${'name'.padEnd(9)} ${'global'.padEnd(28)} ${'project'.padEnd(20)} harness
${presetTable()}
`);
  process.exit(0);
}

// --- parse flags ---------------------------------------------------------------------
const FLAGS = ['--project', '--force', '--uninstall'];
const opts = { harness: null, to: null };
const unknown = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (FLAGS.includes(a)) continue;
  if (a === '--harness' || a === '--to') {
    const value = args[i + 1];
    if (value === undefined || value.startsWith('--')) {
      console.error(`${a} needs a value (try --help)`);
      process.exit(1);
    }
    opts[a.slice(2)] = value;
    i++;
    continue;
  }
  unknown.push(a);
}
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(' ')} (try --help)`);
  process.exit(1);
}
if (opts.harness && opts.to) {
  console.error('--harness and --to are mutually exclusive (try --help)');
  process.exit(1);
}
if (opts.harness && !HARNESSES[opts.harness]) {
  console.error(`Unknown harness "${opts.harness}". Presets: ${Object.keys(HARNESSES).join(', ')}`);
  process.exit(1);
}

// --- resolve target ------------------------------------------------------------------
const project = args.includes('--project');
let baseDir;
let harnessLabel;
if (opts.to) {
  baseDir = path.resolve(process.cwd(), opts.to);
  harnessLabel = 'your harness';
} else {
  const h = HARNESSES[opts.harness || DEFAULT_HARNESS];
  baseDir = project
    ? path.join(process.cwd(), ...h.project)
    : path.join(os.homedir(), ...h.global);
  harnessLabel = h.label.replace(/ \(.*\)$/, '');
}
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

const isClaude = !opts.to && (opts.harness || DEFAULT_HARNESS) === 'claude';
console.log(`Installed ${SKILL_NAME} → ${target}

Next steps:
  1. Open ${harnessLabel} in the project you want an agent team for.
  2. ${isClaude
    ? `Run /${SKILL_NAME} (or just describe the setup you want — the skill`
    : `Describe the setup you want (or invoke the ${SKILL_NAME} skill — it`}
     triggers on "set up my agent team", "scaffold agents", etc.).
`);
