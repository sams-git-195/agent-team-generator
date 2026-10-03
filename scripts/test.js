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
    fs.existsSync(path.join(installed, 'references', 'templates', 'code-reviewer.md')),
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
// Permissions live in ONE place per harness (opencode.json, .claude/settings.json), written
// from references/permission-policy.md. Agent templates carry no permission rules at all.
const templates = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.md'));
const EXPECTED = ['architect.md', 'backend-developer.md', 'code-reviewer.md', 'fullstack-developer.md', 'product-specialist.md', 'qa-tester.md', 'ui-ux-developer.md'];
check(EXPECTED.every((t) => templates.includes(t)), `core templates present (${templates.join(', ')})`);
check(!templates.includes('project-manager.md'), 'no project-manager template (the main agent leads)');

for (const file of templates) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  check(!/PERMISSION_POLICY_BLOCK|^permissions?:/m.test(text), `${file}: carries no permission rules`);
  check(!/^tools:/m.test(text), `${file}: no Claude Code tools: line (agents inherit all tools)`);
  check(text.includes('`.opencode/agents/') && !text.includes('.opencode/agent/'), `${file}: targets .opencode/agents/ (OpenCode 2)`);
  check(/^mode: subagent$/m.test(text), `${file}: OpenCode mode is subagent`);
  check(/^model: \{OC_MODEL_[A-Z_]+ — `provider\/model-id#variant`/m.test(text), `${file}: OpenCode model uses provider/model#variant`);
  check(!/^temperature:/m.test(text), `${file}: no top-level temperature (OpenCode 2)`);
  check(/## Scope & focus/.test(text) && !/hard contract/.test(text), `${file}: has Scope & focus, not a hard edit contract`);
  check(/user-gated/i.test(text), `${file}: states the user-gated rule`);
  check(/## Handoff/.test(text) && /→ main agent/.test(text) && !/project-manager/.test(text), `${file}: hands off to the main agent`);
}

const ref = (name) => fs.readFileSync(path.join(skillDir, 'references', name), 'utf8');
const skeleton = ref('agent-skeleton.md');
check(/OpenCode 2 frontmatter/.test(skeleton) && /Scope & focus/.test(skeleton), 'agent-skeleton describes OpenCode 2 frontmatter and Scope & focus');

const policy = ref('permission-policy.md');
for (const tier of ['Autonomous', 'Open', 'Guarded', 'Standard', 'Strict']) {
  check(new RegExp(`\\*\\*${tier}\\*\\*`).test(policy), `permission-policy: ${tier} tier documented`);
}
check(/"action": "\*", "resource": "\*", "effect": "allow"/.test(policy), 'permission-policy: OpenCode 2 allow-all rule present');
check(!/^\s*bash:\s*$/m.test(policy), 'permission-policy: no OpenCode 1 bash: map');
const DESTRUCTIVE = ['git push --force *', 'git push * --force*', 'git reset --hard *', 'git clean -f *', 'git branch -D *', 'git stash drop *', 'sudo *', 'chmod *', 'chown *', 'npm publish *'];
const missingDestructive = DESTRUCTIVE.filter((l) => !policy.includes(l));
check(missingDestructive.length === 0, `permission-policy: destructive set complete${missingDestructive.length ? ` (missing: ${missingDestructive.join(', ')})` : ''}`);
check(policy.includes('wget *') && policy.includes('pip install *') && policy.includes('bun add *'), 'permission-policy: install/network coverage beyond npm');
check(/"allow": \["Bash", "Edit", "Write"/.test(policy) && /Bash\(git push \*\)/.test(policy), 'permission-policy: Claude Code settings.json translation present, edits allowed');
check(/permission is not an instruction/i.test(policy), 'permission-policy: states that permission is not instruction');
{
  // CC: a trailing " *" matches the bare command only when it is the rule's sole wildcard, so a
  // two-wildcard rule ending in " *" misses e.g. `git push origin main --force`.
  const twoStarTrailingSpace = [...policy.matchAll(/Bash\(([^)]*)\)/g)]
    .map((m) => m[1]).filter((p) => (p.match(/\*/g) || []).length >= 2 && / \*$/.test(p));
  check(twoStarTrailingSpace.length === 0, `permission-policy: no two-wildcard CC rule ends in " *"${twoStarTrailingSpace.length ? ` (${twoStarTrailingSpace.join(', ')})` : ''}`);
}

// Templates are stack-agnostic: language-specific hygiene comes from engineering-standard.md.
const standard = ref('engineering-standard.md');
for (const stack of ['TypeScript / JS', 'Python', 'Go', 'Rust', 'Other']) {
  check(standard.includes(`| **${stack}**`), `engineering-standard: stack hygiene row for ${stack}`);
}
check(/## The senior ladder/.test(standard) && /Does this need to exist at all\?/.test(standard) && /The floor/.test(standard), 'engineering-standard: senior ladder and its floor');
const design = ref('design-standard.md');
const designBlock = design.split('```markdown\n')[1].split('\n```')[0];
for (const file of ['backend-developer.md', 'ui-ux-developer.md', 'fullstack-developer.md']) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  check(text.includes('{LANGUAGE_HYGIENE_RULE'), `${file}: language hygiene is a placeholder`);
  check(!/\*\*Zero `any` types/.test(text), `${file}: no hard-coded TypeScript rule`);
  check(/Engineering Standard/.test(text), `${file}: points at the Engineering Standard`);
  check(/Senior ladder before any code/.test(text) && /error handling/.test(text), `${file}: carries the senior ladder with its floor`);
}
for (const file of ['ui-ux-developer.md', 'fullstack-developer.md']) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  check(text.includes(designBlock), `${file}: embeds the Design bar verbatim from design-standard.md`);
}
const protocolTpl = ref('protocol-template.md');
check(/Engineering standard \(every language/.test(protocolTpl), 'protocol template embeds the engineering standard in §2');
check(/The senior ladder/.test(protocolTpl) && /## 1\. The Main Agent Leads/.test(protocolTpl), 'protocol template: main agent leads, senior ladder embedded');
check(/## 6\. Autonomy & User-Gated Actions/.test(protocolTpl) && /don't ask again/.test(protocolTpl), 'protocol template: §6 user-gated actions, no re-asking once instructed');
check(!/project-manager|PM_STYLE/.test(protocolTpl.split('```markdown')[1]), 'protocol body has no project-manager persona');

const reviewer = fs.readFileSync(path.join(templatesDir, 'code-reviewer.md'), 'utf8');
for (const light of ['🔴 **Blocker**', '🟠 **Should fix**', '🟡 **Nit**', '🔵 **FYI**', '🟣 **Minor**']) {
  check(reviewer.includes(light), `code-reviewer: defines ${light}`);
}
check(/Use ONLY when the user asks for a code review/.test(reviewer), 'code-reviewer: runs only on the user\'s request');
check(/Mutation check/.test(reviewer) && /shasum/.test(reviewer), 'code-reviewer: mutation check with a restore proof');
check(/Fix prompt — required/.test(reviewer) && /known-issues\.md/.test(reviewer), 'code-reviewer: emits fix prompts and logs minors to known-issues.md');
check(/known-issues\.md/.test(ref('documentation-convention.md')), 'documentation convention seeds known-issues.md');

// One scale, one meaning per placeholder, tests always a gate.
const qa = fs.readFileSync(path.join(templatesDir, 'qa-tester.md'), 'utf8');
for (const light of ['🔴 **Blocker**', '🟠 **Should fix**', '🟡 **Nit**', '🔵 **FYI**', '🟣 **Minor**']) {
  check(qa.includes(light) && protocolTpl.includes(light), `lights shared: ${light} in qa-tester and protocol §5`);
}
check(!/\*\*(Critical|High|Medium|Low)\*\*:/.test(qa) && /any 🔴 or 🟠 ⇒ FAIL/.test(qa), 'qa-tester: no second severity scale; fails on 🔴 or 🟠');
for (const file of templates) {
  const text = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  const bare = [...text.matchAll(/.{0,12}\{RISK_SURFACES\}/g)].map((m) => m[0]).filter((x) => !/\(\{RISK_SURFACES\}$/.test(x));
  check(bare.length === 0, `${file}: {RISK_SURFACES} only appears as a bracketed list${bare.length ? ` (${bare.join(' | ')})` : ''}`);
  check(!/\{TEST_COMMAND\}[^\n]{0,20}\bif\b|CONDITIONAL_GATES/.test(text), `${file}: the test run is never conditional`);
}
check(!/CONDITIONAL_GATES/.test(protocolTpl) && /test suite is one of the gates on\s+every change/.test(protocolTpl), 'protocol: tests are a gate on every change');
check(/Local secrets are not gated/.test(protocolTpl) && !/editing secret files/.test(protocolTpl + agentsTplEarly()), 'secrets: local secret files are readable and editable, never exposed');
check(/SHARED_ROOT_FILES/.test(protocolTpl) && /SHARED_ROOT_FILES/.test(agentsTplEarly()), 'shared root files (manifests, CI, tooling) are owned by the main agent');
check(/SECURITY_REVIEW_PARAGRAPH/.test(protocolTpl) && /SECURITY_REVIEW_LINE/.test(qa), 'security review has a slot in protocol §5 and the qa-tester checklist');
check(/`\/invoices\/:id` → `invoices-detail\.md`/.test(ref('documentation-convention.md')), 'documentation convention: page-doc filename rule for nested routes');
function agentsTplEarly() { return ref('agents-md-template.md'); }

// --- 3. Skill/interview cross-references ------------------------------------------------
const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
const interview = ref('interview.md');
const agentsTpl = ref('agents-md-template.md');
check(/Phase 0/.test(skillMd) && /## Phase 0 — Harness/.test(interview), 'harness question wired (SKILL.md <-> interview Phase 0)');
check(/settings\.json/.test(skillMd) && /opencode\.json/.test(skillMd) && /Claude Code only/.test(interview) && /OpenCode only/.test(interview) && /Another harness/.test(interview), 'harness choice offers CC / OC / both / other; settings.json and opencode.json are generated');
check(/Phase 5\.3/.test(skillMd) && /recommend Autonomous/.test(interview), 'permission-policy question wired, Autonomous recommended');
check(/Report style/.test(interview) && /## 7\. Talking to the User/.test(protocolTpl) && /\{REPORT_STYLE\}/.test(agentsTpl) && /REPORT_STYLE/.test(skillMd), 'report style wired (interview 5.4 <-> protocol §7 <-> AGENTS.md <-> SKILL.md verify)');
check(/## How we work/.test(agentsTpl) && /The main agent leads/.test(agentsTpl) && /Senior ladder/.test(agentsTpl), 'AGENTS.md template: How we work (main agent, user-gated, senior ladder)');
check(/Phase 7\.0/.test(skillMd) && /Builder split/.test(interview), 'builder-split question wired (SKILL.md <-> interview Phase 7.0)');
check(/Phase 9/.test(skillMd) && /Optional skill add-ons/.test(interview) && /frontend-design/.test(interview), 'add-ons phase wired, design skills offered');
check(skillMd.includes('`.opencode/agents/<role>.md`') && /OpenCode 1 → 2 mapping|OpenCode 1 shapes/.test(skillMd), 'SKILL.md generates the OpenCode 2 layout and warns against v1 shapes');
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
const BODY = (name) => `# ${name}\n\n## Scope & focus\nYour lane: x. User-gated actions (protocol §6): only on the user's instruction.\n\n## Handoff\nDone → main agent\n`;
const ocAgent = (name, extra = '') => `---\ndescription: x\nmode: subagent\nmodel: anthropic/claude-opus-5-5#high\n${extra}---\n${BODY(name)}`;
const ccAgent = (name, extra = '') => `---\nname: ${name}\ndescription: x\nmodel: opus\n${extra}---\n${BODY(name)}`;
const rule = (action, resource, effect) => ({ action, resource, effect });
const OC_STANDARD = { permissions: [rule('*', '*', 'allow'), rule('shell', 'git push *', 'ask'), rule('shell', 'rm *', 'ask'), rule('shell', 'git push --force *', 'deny'), rule('shell', 'git push * --force*', 'deny'), rule('shell', 'sudo *', 'deny'), rule('shell', 'fly deploy *', 'deny')] };
const CC_ALLOW = ['Bash', 'Edit', 'Write', 'WebFetch'];
const ROLES = ['backend-developer', 'ui-ux-developer', 'qa-tester', 'code-reviewer'];
const goodTree = {
  'AGENTS.md': `# T — Agent Guide\n\n## How we work\nThe main agent leads. Open permissions, user-gated actions.\n\n## Agent team\n| Agent | Focus (owns) | Hands off to |\n|---|---|---|\n| **Main agent** (the session itself — no file) | plans | all |\n${ROLES.map((r) => `| ${r} | x | main agent |`).join('\n')}\n\n## Dev commands\n- \`npm run lint\`\n`,
  'CLAUDE.md': '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n',
  '.agents/rules/claude-agent-protocol.md': '# Protocol\n\nThe senior ladder. See documentation/ and run `npm run lint`. Handoff `{ROLE} Complete → …`.\n\n## 6. Autonomy & User-Gated Actions\nx\n',
  '.claude/settings.json': JSON.stringify({ permissions: { allow: CC_ALLOW, ask: ['Bash(git push *)', 'Bash(rm *)'], deny: ['Bash(git push --force *)', 'Bash(git push * --force*)', 'Bash(sudo *)', 'Bash(fly deploy *)'] } }, null, 2),
  'opencode.json': JSON.stringify(OC_STANDARD, null, 2),
  'documentation/README.md': '# Docs\n',
  'documentation/known-issues.md': '# Known Issues\n',
  'documentation/pages/.gitkeep': '',
  'documentation/features/.gitkeep': '',
  'package.json': JSON.stringify({ name: 't', scripts: { lint: 'x' } }),
};
for (const r of ROLES) {
  goodTree[`.claude/agents/${r}.md`] = ccAgent(r);
  goodTree[`.opencode/agents/${r}.md`] = ocAgent(r);
}
function runVerify(dir) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [verify, dir], { encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status, out: String(e.stdout) };
  }
}
function withTree(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-verify-'));
  try { writeTree(dir, files); return fn(runVerify(dir)); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const failLines = (r) => r.out.split('\n').filter((l) => l.startsWith('FAIL'));

// A lowercase first cell in a later AGENTS.md table is not a roster row.
withTree({ ...goodTree, 'AGENTS.md': goodTree['AGENTS.md'] + '\n## Business rules\n| Role | Sees |\n|---|---|\n| translator | own invoices |\n' },
  (r) => check(r.code === 0, `verify-team reads roster rows from the Agent team section only${r.code ? `\n${failLines(r).join('\n')}` : ''}`));

withTree(goodTree, (r) => check(r.code === 0, `verify-team passes on a consistent generated tree (Standard tier)${r.code ? `\n${failLines(r).join('\n')}` : ''}`));

// The recommended tier: allow-all in both harnesses passes, with a warning that names the guard.
withTree({
  ...goodTree,
  'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow')] }),
  '.claude/settings.json': JSON.stringify({ permissions: { allow: CC_ALLOW } }),
}, (r) => check(r.code === 0 && /warn - Autonomous tier/.test(r.out), `verify-team passes on the Autonomous tier and warns that §6 is the guard${r.code ? `\n${failLines(r).join('\n')}` : ''}`));

// CC denies that differ from the OC resource only in spacing still count as covered.
withTree({
  ...goodTree,
  '.claude/settings.json': JSON.stringify({ permissions: { allow: CC_ALLOW, deny: ['Bash(git push --force *)', 'Bash(git push * --force *)', 'Bash(sudo *)', 'Bash(fly deploy *)'] } }),
}, (r) => check(r.code === 0, `verify-team tolerates spacing differences in CC parity${r.code ? `\n${failLines(r).join('\n')}` : ''}`));

const agentsNoGuard = goodTree['AGENTS.md'].replace('## How we work\nThe main agent leads. Open permissions, user-gated actions.\n\n', '');
const cases = [
  ['unfilled placeholder', { 'AGENTS.md': goodTree['AGENTS.md'] + '\nColors: {PALETTE}\n' }, /no unfilled placeholders/],
  ['a project-manager file', { '.claude/agents/project-manager.md': ccAgent('project-manager') }, /no \.claude\/agents\/project-manager\.md/],
  ['a legacy .opencode/agent directory', { '.opencode/agent/qa-tester.md': ocAgent('qa-tester') }, /no legacy OpenCode 1 directory/],
  ['OpenCode 1 frontmatter keys', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester', 'temperature: 0.1\npermission:\n  edit: deny\n') }, /no OpenCode 1 frontmatter keys/],
  ['a per-agent permissions list', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester', 'permissions:\n  - action: edit\n    resource: "*"\n    effect: deny\n') }, /no per-agent permissions list/],
  ['a model without a provider', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester').replace('anthropic/claude-opus-5-5#high', 'opus') }, /model is provider\/model/],
  ['OpenCode 1 action names in opencode.json', { 'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow'), rule('bash', 'git push *', 'ask')] }) }, /OpenCode 2 action names/],
  ['an OpenCode 1 permission map', { 'opencode.json': JSON.stringify({ permission: { bash: { '*': 'allow' } } }) }, /"permissions" rule list/],
  ['deny before ask', { 'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow'), rule('shell', 'sudo *', 'deny'), rule('shell', 'git push *', 'ask')] }) }, /deny rules come after ask rules/],
  ['an edit deny rule', { 'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow'), rule('edit', 'src/*', 'deny')] }) }, /no edit deny rule/],
  ['CC settings missing a deploy deny', { '.claude/settings.json': JSON.stringify({ permissions: { allow: CC_ALLOW, deny: ['Bash(sudo *)'] } }) }, /covers every OpenCode shell deny/],
  ['CC agent with a tools: line', { '.claude/agents/qa-tester.md': ccAgent('qa-tester', 'tools: Read, Grep\n') }, /no tools: line/],
  ['handoff to a project-manager', { '.claude/agents/qa-tester.md': ccAgent('qa-tester').replace('→ main agent', '→ project-manager') }, /hands off to the main agent/],
  ['agent missing the user-gated rule', { '.claude/agents/qa-tester.md': ccAgent('qa-tester').replace(/User-gated[^\n]*/, '') }, /states the user-gated rule/],
  ['AGENTS.md missing How we work', { 'AGENTS.md': agentsNoGuard }, /How we work/],
  ['protocol missing §6', { '.agents/rules/claude-agent-protocol.md': '# Protocol\n\nThe senior ladder. documentation/ `npm run lint` `{ROLE} Complete`.\n' }, /§6 Autonomy/],
  ['missing known-issues.md', { 'documentation/known-issues.md': null }, /known-issues\.md exists/],
  ['unfilled placeholder in the comma form', { 'AGENTS.md': goodTree['AGENTS.md'] + '\n## {DATA_LAYER_SECTION_NAME, named for the platform}\n' }, /no unfilled placeholders/],
  ['template prose above the AGENTS.md heading', { 'AGENTS.md': '`AGENTS.md` template below.\n\n' + goodTree['AGENTS.md'] }, /starts with its heading/],
  ['make gate missing from the Makefile', { 'AGENTS.md': goodTree['AGENTS.md'] + '- `make lint`\n', Makefile: 'test:\n\ttrue\n' }, /exists in the Makefile/],
  ['gate script missing from package.json', { 'package.json': JSON.stringify({ name: 't', scripts: {} }) }, /exists in package.json/],
  ['roster/file mismatch', { '.claude/agents/mobile-developer.md': ccAgent('mobile-developer') }, /== AGENTS\.md roster/],
];
for (const [label, mutation, expected] of cases) {
  const files = { ...goodTree, ...mutation };
  for (const k of Object.keys(files)) if (files[k] === null) delete files[k];
  withTree(files, (r) => check(r.code === 1 && failLines(r).some((l) => expected.test(l)), `verify-team catches: ${label}`));
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
