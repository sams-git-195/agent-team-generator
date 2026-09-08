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
// The bash policy lives in ONE place (references/permission-policy.md); every template and
// the skeleton carry only the placeholder. A literal policy line in a template is drift.
const OLD_POLICY_LINES = ['"git push*": ask', '"git push --force*": deny', '"sudo *": deny'];

const templates = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.md'));
check(templates.length >= 7, `templates present (found ${templates.length}, expected >= 7)`);

for (const file of templates) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  check(text.includes('{PERMISSION_POLICY_BLOCK'), `${file}: carries {PERMISSION_POLICY_BLOCK}`);
  check(!OLD_POLICY_LINES.some((l) => text.includes(l)), `${file}: no inlined bash policy lines`);
  check(/## Handoff/.test(text), `${file}: has a Handoff section`);
  check(/mode: (subagent|primary)/.test(text), `${file}: has an OpenCode mode`);
}

const skeleton = fs.readFileSync(path.join(skillDir, 'references', 'agent-skeleton.md'), 'utf8');
check(skeleton.includes('{PERMISSION_POLICY_BLOCK'), 'agent-skeleton carries {PERMISSION_POLICY_BLOCK}');

const policy = fs.readFileSync(path.join(skillDir, 'references', 'permission-policy.md'), 'utf8');
for (const tier of ['Sandbox', 'Open', 'Guarded', 'Standard', 'Strict']) {
  check(new RegExp(`\\*\\*${tier}\\*\\*`).test(policy), `permission-policy: ${tier} tier has an OC block`);
}
const DESTRUCTIVE = [
  '"git push --force*": deny',
  '"git push* --force*": deny',
  '"git reset --hard*": deny',
  '"git clean -f*": deny',
  '"git branch -D*": deny',
  '"git stash drop*": deny',
  '"sudo *": deny',
  '"chmod *": deny',
  '"chown *": deny',
  '"npm publish*": deny',
  '{DEPLOY_DENY_LINES}',
];
const missingDestructive = DESTRUCTIVE.filter((l) => !policy.includes(l));
check(missingDestructive.length === 0, `permission-policy: destructive set complete${missingDestructive.length ? ` (missing: ${missingDestructive.join(', ')})` : ''}`);
check(policy.includes('"wget *": ask') && policy.includes('"pip install*": ask') && policy.includes('"bun add*": ask'), 'permission-policy: install/network coverage beyond npm');
check(!/"npx \*": ask/.test(policy), 'permission-policy: no wholesale npx ask (collides with add-on installs and npx gates)');
check(/"allow": \["Bash"\]/.test(policy) && /Bash\(git push \*\)/.test(policy), 'permission-policy: Claude Code settings.json translation present');

// Templates are stack-agnostic: language-specific hygiene comes from engineering-standard.md.
const standard = fs.readFileSync(path.join(skillDir, 'references', 'engineering-standard.md'), 'utf8');
for (const stack of ['TypeScript / JS', 'Python', 'Go', 'Rust', 'Other']) {
  check(standard.includes(`| **${stack}**`), `engineering-standard: stack hygiene row for ${stack}`);
}
for (const file of ['backend-developer.md', 'ui-ux-developer.md', 'fullstack-developer.md']) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  check(text.includes('{LANGUAGE_HYGIENE_RULE'), `${file}: language hygiene is a placeholder`);
  check(!/\*\*Zero `any` types/.test(text), `${file}: no hard-coded TypeScript rule`);
  check(/Engineering Standard/.test(text), `${file}: points at the Engineering Standard`);
}
const protocolTpl = fs.readFileSync(path.join(skillDir, 'references', 'protocol-template.md'), 'utf8');
check(/Engineering standard \(every language/.test(protocolTpl), 'protocol template embeds the engineering standard in §2');

const pm = fs.readFileSync(path.join(templatesDir, 'project-manager.md'), 'utf8');
check(/mode: primary/.test(pm), 'project-manager is mode: primary');
check(!/^model:/m.test(pm.split('## Body')[0].replace(/\{[^}]*\}/g, '')), 'project-manager has no model pin');

// --- 3. Skill/interview cross-references ------------------------------------------------
const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
const interview = fs.readFileSync(path.join(skillDir, 'references', 'interview.md'), 'utf8');
check(/Phase 0/.test(skillMd) && /## Phase 0 — Harness/.test(interview), 'harness question wired (SKILL.md <-> interview Phase 0)');
check(/settings\.json/.test(skillMd) && /Claude Code only/.test(interview) && /OpenCode only/.test(interview) && /Another harness/.test(interview), 'harness choice offers CC / OC / both / other, and CC settings.json is generated');
check(/Phase 5\.3/.test(skillMd) && /Agent bash-permission policy/.test(interview), 'permission-policy question wired (SKILL.md <-> interview Phase 5.3)');
{
  const agentsTpl = fs.readFileSync(path.join(skillDir, 'references', 'agents-md-template.md'), 'utf8');
  const wired = /Project-manager answer style/.test(interview) && /## 7\. Talking to the User/.test(protocolTpl)
    && /## Talking to the User/.test(pm) && /\{PM_STYLE\}/.test(agentsTpl) && /PM_STYLE/.test(skillMd);
  check(wired, 'PM answer style wired (interview 5.4 <-> protocol §7 <-> OC PM template <-> AGENTS.md <-> SKILL.md verify)');
}
check(/Phase 7\.0/.test(skillMd) && /Builder split/.test(interview), 'builder-split question wired (SKILL.md <-> interview Phase 7.0)');
check(/Phase 9/.test(skillMd) && /Optional skill add-ons/.test(interview), 'add-ons phase wired (SKILL.md <-> interview Phase 9)');
check(
  fs.existsSync(path.join(templatesDir, 'fullstack-developer.md')),
  'fullstack-developer template exists for Phase 7.0'
);

check(fs.existsSync(path.join(skillDir, 'fixtures', 'sample-brief.md')), 'fixtures/sample-brief.md exists for the application-scenario test');
check(/accept the recommended defaults/i.test(interview) && /fast path/i.test(skillMd), 'interview fast path wired (interview <-> SKILL.md Step 1)');

// --- 3b. verify-team.js against a synthetic generated tree ------------------------------
const verify = path.join(skillDir, 'scripts', 'verify-team.js');
check(fs.existsSync(verify), 'scripts/verify-team.js exists');

function writeTree(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
}
const OC_POLICY = [
  '  bash:', '    "*": allow', '    "git push*": ask', '    "rm *": ask',
  '    "git push --force*": deny', '    "sudo *": deny', '    "fly deploy*": deny',
].join('\n');
const ocAgent = (name, mode, edits, extra = '') =>
  `---\nname: ${name}\ndescription: x\nmode: ${mode}\n${extra}permission:\n  read: allow\n  edit:\n    "*": deny\n${edits.map((g) => `    "${g}": allow`).join('\n')}\n${OC_POLICY}\n  todowrite: allow\n---\n# ${name}\n\n## Scope (hard contract)\nx\n\n## Handoff\nDone → project-manager\n`;
const ccAgent = (name) => `---\nname: ${name}\ndescription: x\ntools: Read\nmodel: opus\n---\n# ${name}\n\n## Scope (hard contract)\nx\n\n## Handoff\nDone → project-manager\n`;
const goodTree = {
  'AGENTS.md': '# T — Agent Guide\n\n## Agent team\n| Agent | Owns | Hands off to |\n|---|---|---|\n| project-manager (MAIN session) | docs | all |\n| backend-developer | server/** | qa-tester |\n| ui-ux-developer | web/** | qa-tester |\n| qa-tester | tests | project-manager |\n\n## Dev commands\n- `npm run lint`\n',
  'CLAUDE.md': '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n',
  '.agents/rules/claude-agent-protocol.md': '# Protocol\n\nSee documentation/ and run `npm run lint`. Handoff `{ROLE} Complete → …`.\n',
  '.claude/agents/backend-developer.md': ccAgent('backend-developer'),
  '.claude/agents/ui-ux-developer.md': ccAgent('ui-ux-developer'),
  '.claude/agents/qa-tester.md': ccAgent('qa-tester'),
  '.claude/settings.json': JSON.stringify({ permissions: { allow: ['Bash'], ask: ['Bash(git push *)', 'Bash(rm *)'], deny: ['Bash(git push --force *)', 'Bash(sudo *)', 'Bash(fly deploy *)'] } }, null, 2),
  '.opencode/agent/project-manager.md': ocAgent('project-manager', 'primary', ['AGENTS.md', 'documentation/**']),
  '.opencode/agent/backend-developer.md': ocAgent('backend-developer', 'subagent', ['server/**'], 'model: m\n'),
  '.opencode/agent/ui-ux-developer.md': ocAgent('ui-ux-developer', 'subagent', ['web/**'], 'model: m\n'),
  '.opencode/agent/qa-tester.md': ocAgent('qa-tester', 'subagent', ['**/*.test.*'], 'model: m\n'),
  'documentation/README.md': '# Docs\n',
  'documentation/pages/.gitkeep': '',
  'documentation/features/.gitkeep': '',
  'package.json': JSON.stringify({ name: 't', scripts: { lint: 'x' } }),
};
function runVerify(dir) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [verify, dir], { encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status, out: String(e.stdout) };
  }
}
const vt = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-verify-'));
try {
  writeTree(vt, goodTree);
  const good = runVerify(vt);
  check(good.code === 0, `verify-team passes on a consistent generated tree${good.code ? `\n${good.out.split('\n').filter((l) => l.startsWith('FAIL')).join('\n')}` : ''}`);

  const cases = [
    ['unfilled placeholder', { 'AGENTS.md': goodTree['AGENTS.md'] + '\nColors: {PALETTE}\n' }, /no unfilled placeholders/],
    ['overlapping builder globs', { '.opencode/agent/ui-ux-developer.md': ocAgent('ui-ux-developer', 'subagent', ['web/**', 'server/lib/**'], 'model: m\n') }, /do not overlap/],
    ['divergent OC policy', { '.opencode/agent/qa-tester.md': ocAgent('qa-tester', 'subagent', ['**/*.test.*'], 'model: m\n').replace('"rm *": ask\n', '') }, /identical across all OC files/],
    ['PM with a model pin', { '.opencode/agent/project-manager.md': ocAgent('project-manager', 'primary', ['AGENTS.md'], 'model: m\n') }, /no model pin/],
    ['CC settings missing a deploy deny', { '.claude/settings.json': JSON.stringify({ permissions: { deny: ['Bash(sudo *)'] } }) }, /covers every OC deny prefix/],
    ['gate script missing from package.json', { 'package.json': JSON.stringify({ name: 't', scripts: {} }) }, /exists in package.json/],
    ['roster/file mismatch', { '.claude/agents/mobile-developer.md': ccAgent('mobile-developer') }, /roster minus PM/],
  ];
  for (const [label, mutation, expected] of cases) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-verify-bad-'));
    try {
      writeTree(dir, { ...goodTree, ...mutation });
      const r = runVerify(dir);
      const failLines = r.out.split('\n').filter((l) => l.startsWith('FAIL'));
      check(r.code === 1 && failLines.some((l) => expected.test(l)), `verify-team catches: ${label}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
} finally {
  fs.rmSync(vt, { recursive: true, force: true });
}

// --- 4. Plugin/marketplace/package metadata agree ---------------------------------------
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const plugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
check(pkg.name === plugin.name && plugin.name === marketplace.plugins[0].name, 'package/plugin/marketplace names agree');
check(pkg.version === plugin.version, `package and plugin versions agree (${pkg.version})`);
check(pkg.files.includes('skills'), 'npm files list includes skills/');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
