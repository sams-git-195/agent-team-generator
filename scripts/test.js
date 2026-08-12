#!/usr/bin/env node
/**
 * Smoke test: installer works end-to-end and the skill payload is internally consistent.
 * No dependencies — plain Node. Run with `npm test`.
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const skillDir = path.join(root, 'skills', 'agent-team-generator');
const templatesDir = path.join(skillDir, 'references', 'templates');

let failures = 0;
function check(ok, label) {
  console.log(`${ok ? 'ok' : 'FAIL'} - ${label}`);
  if (!ok) failures++;
}

// --- 1. Installer round-trip into a temp project dir ---------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-test-'));
try {
  const cli = path.join(root, 'bin', 'cli.js');
  execFileSync(process.execPath, [cli, '--project'], { cwd: tmp });
  const installed = path.join(tmp, '.claude', 'skills', 'agent-team-generator');
  check(fs.existsSync(path.join(installed, 'SKILL.md')), 'CLI --project installs SKILL.md');
  check(
    fs.existsSync(path.join(installed, 'references', 'templates', 'project-manager.md')),
    'CLI --project installs references/templates'
  );

  let refusedRerun = false;
  try {
    execFileSync(process.execPath, [cli, '--project'], { cwd: tmp, stdio: 'pipe' });
  } catch (e) {
    refusedRerun = e.status === 1;
  }
  check(refusedRerun, 'CLI refuses to overwrite without --force');

  execFileSync(process.execPath, [cli, '--project', '--force'], { cwd: tmp });
  check(fs.existsSync(path.join(installed, 'SKILL.md')), 'CLI --force reinstalls');

  execFileSync(process.execPath, [cli, '--project', '--uninstall'], { cwd: tmp });
  check(!fs.existsSync(installed), 'CLI --uninstall removes the install');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// --- 2. Template integrity ------------------------------------------------------------
const REQUIRED_BASH_LINES = [
  '"*": allow',
  '"git push*": ask',
  '"gh pr create*": ask',
  '"rm *": ask',
  '"npm install*": ask',
  '"npx *": ask',
  '"pnpm add*": ask',
  '"yarn add*": ask',
  '"curl *": ask',
  '"git push --force*": deny',
  '"git push -f*": deny',
  '"git reset --hard*": deny',
  '"git clean -fd*": deny',
  '"sudo *": deny',
  '"* | sh": deny',
  '"* | bash": deny',
  '{DEPLOY_DENY_LINES',
  '{POLICY_ADJUSTMENT_LINES',
];

const templates = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.md'));
check(templates.length >= 7, `templates present (found ${templates.length}, expected >= 7)`);

for (const file of templates) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  const missing = REQUIRED_BASH_LINES.filter((line) => !text.includes(line));
  check(missing.length === 0, `${file}: full bash policy block${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
  check(/## Handoff/.test(text), `${file}: has a Handoff section`);
  check(/mode: (subagent|primary)/.test(text), `${file}: has an OpenCode mode`);
}

const pm = fs.readFileSync(path.join(templatesDir, 'project-manager.md'), 'utf8');
check(/mode: primary/.test(pm), 'project-manager is mode: primary');
check(!/^model:/m.test(pm.split('## Body')[0].replace(/\{[^}]*\}/g, '')), 'project-manager has no model pin');

// --- 3. Skill/interview cross-references ------------------------------------------------
const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
const interview = fs.readFileSync(path.join(skillDir, 'references', 'interview.md'), 'utf8');
check(/Phase 5\.3/.test(skillMd) && /Agent bash-permission policy/.test(interview), 'permission-policy question wired (SKILL.md <-> interview Phase 5.3)');
check(/Phase 7\.0/.test(skillMd) && /Builder split/.test(interview), 'builder-split question wired (SKILL.md <-> interview Phase 7.0)');
check(/Phase 9/.test(skillMd) && /Optional skill add-ons/.test(interview), 'add-ons phase wired (SKILL.md <-> interview Phase 9)');
check(
  fs.existsSync(path.join(templatesDir, 'fullstack-developer.md')),
  'fullstack-developer template exists for Phase 7.0'
);

// --- 4. Plugin/marketplace/package metadata agree ---------------------------------------
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const plugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
check(pkg.name === plugin.name && plugin.name === marketplace.plugins[0].name, 'package/plugin/marketplace names agree');
check(pkg.version === plugin.version, `package and plugin versions agree (${pkg.version})`);
check(pkg.files.includes('skills'), 'npm files list includes skills/');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
