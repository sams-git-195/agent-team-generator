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

  // Other harness presets and explicit directories.
  execFileSync(process.execPath, [cli, '--harness', 'opencode', '--project'], { cwd: tmp });
  const opencodeInstalled = path.join(tmp, '.opencode', 'skills', 'agent-team-generator');
  check(
    fs.existsSync(path.join(opencodeInstalled, 'SKILL.md')),
    'CLI --harness opencode --project installs to .opencode/skills'
  );
  execFileSync(process.execPath, [cli, '--harness', 'opencode', '--project', '--uninstall'], { cwd: tmp });
  check(!fs.existsSync(opencodeInstalled), 'CLI --uninstall works with --harness');

  const customDir = path.join(tmp, 'custom');
  execFileSync(process.execPath, [cli, '--to', customDir], { cwd: tmp });
  check(
    fs.existsSync(path.join(customDir, 'agent-team-generator', 'SKILL.md')),
    'CLI --to <dir> installs into <dir>/agent-team-generator'
  );

  let rejectedHarness = false;
  try {
    execFileSync(process.execPath, [cli, '--harness', 'bogus'], { cwd: tmp, stdio: 'pipe' });
  } catch (e) {
    rejectedHarness = e.status === 1;
  }
  check(rejectedHarness, 'CLI --harness bogus exits 1');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// --- 2. Template integrity ------------------------------------------------------------
// Templates are rendered by scripts/render-team.js from team.json: {{tags}}, partials, no
// hand-filled {PLACEHOLDERS}. Permissions are allow-all in both harnesses; protocol §6 guards.
function readText(p) { return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'); }
const ref = (name) => readText(path.join(skillDir, 'references', name));
const tpl = (name) => readText(path.join(templatesDir, name));
const partial = (name) => readText(path.join(templatesDir, 'partials', `${name}.md`));

const ROLE_TEMPLATES = ['architect.md', 'backend-developer.md', 'code-reviewer.md', 'fullstack-developer.md', 'product-specialist.md', 'qa-tester.md', 'ui-ux-developer.md'];
const templates = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.md'));
check(ROLE_TEMPLATES.every((t) => templates.includes(t)), `core role templates present (${ROLE_TEMPLATES.join(', ')})`);
check(!templates.includes('project-manager.md'), 'no project-manager template (the main agent leads)');
for (const f of ['protocol.md', 'agents-md.md', 'docs-readme.md', 'docs-page.md', 'docs-known-issues.md', 'security-review-command.md']) check(templates.includes(f), `template ${f} present`);
for (const p of ['design-bar', 'gated-builder', 'grounding']) check(fs.existsSync(path.join(templatesDir, 'partials', `${p}.md`)), `partial ${p} present`);
for (const gone of ['permission-policy.md', 'design-standard.md']) check(!fs.existsSync(path.join(skillDir, 'references', gone)), `references/${gone} removed (tiers gone; the Design bar is a partial)`);
check(fs.existsSync(path.join(skillDir, 'references', 'fable-playbook.md')), 'fable-playbook.md kept as background');

for (const file of ROLE_TEMPLATES) {
  const text = tpl(file);
  const fm = (text.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || '';
  check(/^description: .+/m.test(fm) && /^color: /m.test(fm) && /^cc_model: (sonnet|opus)$/m.test(fm) && /^kind: (builder|reporter)$/m.test(fm) && /^work_type: /m.test(fm), `${file}: frontmatter has description, color, cc_model, kind, work_type`);
  check(!/^(tools|permissions?|temperature|mode|name):/m.test(fm), `${file}: no harness frontmatter in the template (the renderer adds it)`);
  check(!/\{[A-Z][A-Z0-9_]+[^}]*\}/.test(text), `${file}: no old-style {PLACEHOLDER} tokens`);
  check(/## Scope & focus/.test(text), `${file}: has Scope & focus`);
  check(/user-gated/i.test(text) || /\{\{> gated-builder\}\}/.test(text), `${file}: states the user-gated rule`);
  check(/## Handoff/.test(text) && /→ main agent/.test(text) && !/project-manager/.test(text), `${file}: hands off to the main agent`);
  check(/\{\{risk\.surfaces\}\}/.test(text), `${file}: names the risk surfaces`);
  const bare = [...text.matchAll(/.{0,12}\{\{risk\.surfaces\}\}/g)].map((m) => m[0]).filter((x) => !/\(\{\{risk\.surfaces\}\}$/.test(x));
  check(bare.length === 0, `${file}: risk.surfaces only appears as a bracketed list${bare.length ? ` (${bare.join(' | ')})` : ''}`);
}
for (const file of ['backend-developer.md', 'ui-ux-developer.md', 'fullstack-developer.md']) {
  const text = tpl(file);
  check(/\{\{> gated-builder\}\}/.test(text) && /\{\{> grounding\}\}/.test(text), `${file}: uses the gated-builder and grounding partials`);
  check(/\{\{stack\.hygiene_rule\}\}/.test(text) && !/zero `any`/.test(text), `${file}: language hygiene comes from team.json, not hard-coded`);
  check(/\{\{gate_commands\}\} — tests included, on every change/.test(text), `${file}: runs every gate, tests included, on every change`);
  check(/\{\{expensive_mistake\}\}/.test(text), `${file}: carries the expensive-mistake contrast`);
}
check(/Senior ladder before any code/.test(partial('grounding')) && /error handling/.test(partial('grounding')), 'grounding partial: senior ladder with its floor');
check(/without\s+asking again/.test(partial('gated-builder')) && /\{\{gated\.deploy_commands\}\}/.test(partial('gated-builder')), 'gated-builder partial: deploy commands named, no re-asking once instructed');
for (const file of ['ui-ux-developer.md', 'fullstack-developer.md']) {
  check(/\{\{> design-bar\}\}/.test(tpl(file)) && /- \[ \] Usability bar held/.test(tpl(file)) && /^ui: true$/m.test(tpl(file)), `${file}: embeds the Design bar partial, self-checks the Usability bar, is flagged ui`);
}
check(!/design-bar/.test(tpl('backend-developer.md')), 'backend-developer: no Design bar');
const designBlock = partial('design-bar');
for (const s of ['## Design bar', '## Usability bar', "Hick's law", "Fitts's law", "Jakob's law", '{{project.core_flows}}', '**Do / Don\'t**', 'The slop list', 'prefers-reduced-motion', '{{#project.takes_payments}}', '{{#design.skills}}']) {
  check(designBlock.includes(s), `design-bar partial carries ${s}`);
}

const protocolTpl = tpl('protocol.md');
check(/## 1\. The main agent leads/.test(protocolTpl) && /## 6\. Autonomy & user-gated actions/.test(protocolTpl) && /don't ask again/.test(protocolTpl), 'protocol: main agent leads; §6 user-gated, no re-asking');
check(/The senior ladder/.test(protocolTpl) && /The floor/.test(protocolTpl) && /Engineering standard \(every language/.test(protocolTpl) && /Red flags/.test(protocolTpl), 'protocol §2: senior ladder, floor, engineering standard, red flags');
for (const light of ['🔴 **Blocker**', '🟠 **Should fix**', '🟡 **Nit**', '🔵 **FYI**', '🟣 **Minor**']) check(protocolTpl.includes(light), `protocol §5 defines ${light}`);
check(/The 🟣 gate/.test(protocolTpl) && /Who does it reach\?/.test(protocolTpl) && /Seen or unseen\?/.test(protocolTpl) && /Can it actually happen\?/.test(protocolTpl) && /Triaged out/.test(protocolTpl), 'protocol §5: the 🟣 gate and Triaged out');
check(/names a\s+failure scenario/.test(protocolTpl) && /Unverified concerns/.test(protocolTpl) && /Usability-bar breach/.test(protocolTpl), 'protocol §5: failure scenarios, unverified concerns, Usability-bar breach is 🟠');
check(/the test suite runs on every change/.test(protocolTpl), 'protocol §5: tests are a gate on every change');
check(/Self-QA is the gate for an \*\*S\*\* task off every risk surface/.test(protocolTpl), 'protocol §5: small tasks off a risk surface rely on self-QA; qa-tester for M/L and risk surfaces');
check(/step up to the stronger model/.test(protocolTpl) && /Judges never step down/.test(protocolTpl) && /\{\{#model_rows\}\}/.test(protocolTpl), 'protocol §3: builders step up per dispatch; judges stay on the strong model');
check(/Local secrets are not gated/.test(protocolTpl) && /\{\{protocol\.shared_root_files\}\}/.test(protocolTpl), 'protocol §6: local secrets readable; shared root files owned by the main agent');
check(/\{\{#security_review\}\}/.test(protocolTpl) && /\{\{#security_review\}\}/.test(tpl('qa-tester.md')), 'security review has a slot in protocol §5 and the qa-tester checklist');
check(!/→ project-manager|PM_STYLE|permission tier/i.test(protocolTpl), 'protocol: no project-manager persona, no permission tiers');

const qa = tpl('qa-tester.md');
check(/protocol §5/.test(qa) && !/\*\*(Critical|High|Medium|Low)\*\*:/.test(qa) && /Any 🔴 or 🟠 ⇒ FAIL/.test(qa), 'qa-tester: grades on protocol §5, no second scale, fails on 🔴 or 🟠');
check(/\{\{#project\.has_ui\}\}[\s\S]*Design bar[\s\S]*Usability bar[\s\S]*\{\{\/project\.has_ui\}\}/.test(qa), 'qa-tester: Design/Usability checks only when the project has a UI');
check(/Prove the tests can fail/.test(qa) && /Triaged out/.test(qa) && /Unverified concerns/.test(qa), 'qa-tester: mutation proof, triaged out, unverified concerns');
const reviewer = tpl('code-reviewer.md');
check(/Use ONLY when the user asks for a code review/.test(reviewer), 'code-reviewer: runs only on the user\'s request');
check(/Mutation check/.test(reviewer) && /shasum/.test(reviewer), 'code-reviewer: mutation check with a restore proof');
check(/Fix prompt — required/.test(reviewer) && /known-issues\.md/.test(reviewer) && /protocol §5/.test(reviewer), 'code-reviewer: fix prompts, logs minors, grades on protocol §5');
check(/\*\*Who:\*\*/.test(tpl('docs-known-issues.md')) && /\*\*Happens:\*\*/.test(tpl('docs-known-issues.md')) && /🟣 gate/.test(tpl('docs-known-issues.md')), 'known-issues seed records who / seen / happens / effect and names the gate');
check(/## How we work/.test(tpl('agents-md.md')) && /The main agent leads/.test(tpl('agents-md.md')) && /Senior ladder/.test(tpl('agents-md.md')) && /user-gated/i.test(tpl('agents-md.md')), 'AGENTS.md template: How we work (main agent, user-gated, senior ladder)');

const standard = ref('engineering-standard.md');
for (const stack of ['TypeScript / JS', 'Python', 'Go', 'Rust', 'Other']) check(standard.includes(`| **${stack}**`), `engineering-standard: stack hygiene row for ${stack}`);

// Every {{tag}} a template uses is documented in team-schema.md (as a field or a derived key).
{
  const schema = ref('team-schema.md');
  const documented = new Set([...schema.matchAll(/`([\w.<>]+)`/g)].map((m) => m[1]));
  const roots = (k) => { const parts = k.split('.'); return [k, parts[0], parts.slice(0, 2).join('.'), parts.slice(-1)[0], parts.slice(-2).join('.')]; };
  const used = new Set();
  const all = [...templates.map(tpl), ...['design-bar', 'gated-builder', 'grounding'].map(partial)];
  for (const text of all) for (const m of text.matchAll(/\{\{[#^]?\s*([\w.-]+)\s*\}\}/g)) if (m[1] !== '.') used.add(m[1]);
  const scoped = new Set(['rule', 'module', 'state_step', 'check', 'locale_files', 'interpolation', 'name', 'focus', 'handoff', 'work_type', 'cc_model', 'oc_model', 'escalate', 'cmd', 'note', 'route', 'one_liner', 'file', 'pages']);
  const docList = [...documented];
  const undocumented = [...used].filter((k) => !scoped.has(k) && !roots(k).some((r) => documented.has(r) || docList.some((d) => d.endsWith(`.${r}`))));
  check(undocumented.length === 0, `team-schema.md documents every template tag${undocumented.length ? ` (missing: ${undocumented.join(', ')})` : ''}`);
}

// --- 3. Skill/interview cross-references ------------------------------------------------
const skillMd = readText(path.join(skillDir, 'SKILL.md'));
const interview = ref('interview.md');
check(/render-team\.js/.test(skillMd) && /team-schema\.md/.test(skillMd) && /team\.json/.test(skillMd), 'SKILL.md: team.json → render-team.js workflow');
check(/Step 0/.test(skillMd) && /team\.json`\s+exists, this is a re-run/.test(skillMd), 'SKILL.md: survey step detects a re-run');
check(/## 1\. Intake/.test(interview) && /## 2\. Summary table/.test(interview) && /## 3\. The gates/.test(interview), 'interview: one-message intake, summary table, gates');
for (const gate of ['Harness', 'Builder split', 'Report style', 'Security review', 'Design skill']) check(new RegExp(`\\*\\*${gate}\\*\\*`).test(interview), `interview gate: ${gate}`);
check(/Claude Code only/.test(interview) && /OpenCode\s+only/.test(interview) && /Another/.test(interview), 'interview: harness offers CC / OC / both / other');
check(/AskUserQuestion\)/.test(interview) && /numbered list in chat/.test(interview), 'interview: harness-neutral questioning with a Claude Code fallback named');
check(/risk surfaces and the\s+never-do list/.test(interview), 'interview: risk surfaces and never-do list always confirmed explicitly');
check(!/permission tier|Autonomous|Guarded|Strict/.test(interview + skillMd), 'no permission tiers anywhere in the skill flow');
check(/sonnet for product-specialist and builders, opus for architect, qa-tester and\s+code-reviewer/.test(interview), 'interview: sonnet builders / opus judges default matrix');
check(/frontend-design/.test(ref('add-ons.md')) && /Security review/.test(ref('add-ons.md')), 'add-ons: design skills and the security-review option');
check(/production-ready from the first commit/.test(ref('greenfield.md')) && /Every gate runs on every change/.test(ref('greenfield.md')), 'greenfield: strict gates, every gate on every change');
check(fs.existsSync(path.join(skillDir, 'fixtures', 'sample-brief.md')) && fs.existsSync(path.join(skillDir, 'fixtures', 'team.json')), 'fixtures: sample-brief.md and team.json exist');

// --- 3a. render-team.js end to end on the fixture ---------------------------------------
const render = path.join(skillDir, 'scripts', 'render-team.js');
const verify = path.join(skillDir, 'scripts', 'verify-team.js');
check(fs.existsSync(render) && fs.existsSync(verify), 'scripts/render-team.js and verify-team.js exist');
const fixture = JSON.parse(readText(path.join(skillDir, 'fixtures', 'team.json')));

function writeTree(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
}
const SCAFFOLD = {
  'package.json': JSON.stringify({ name: 't', scripts: { dev: 'x', lint: 'x', typecheck: 'x', test: 'x', build: 'x' } }),
  Makefile: 'lint:\n\ttrue\ntypecheck:\n\ttrue\ntest:\n\ttrue\n',
};
function runRender(team, extraFiles = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-render-'));
  try {
    writeTree(dir, { ...SCAFFOLD, ...extraFiles, '.agents/team.json': JSON.stringify(team) });
    let r;
    try { r = { code: 0, out: execFileSync(process.execPath, [render], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (e) { r = { code: e.status, out: String(e.stdout) + String(e.stderr) }; }
    const snapshot = {};
    (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else snapshot[path.relative(dir, p).split(path.sep).join('/')] = readText(p); } })(dir);
    const file = (rel) => (rel in snapshot ? snapshot[rel] : null);
    return { ...r, file };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
{
  const r = runRender(fixture);
  check(r.code === 0 && /verify-team: all checks passed/.test(r.out), `render-team renders the fixture and the verifier passes${r.code ? `\n${r.out.split('\n').filter((l) => /FAIL|render-team:/.test(l)).join('\n')}` : ''}`);
  if (r.code === 0) {
    const proto = r.file('.agents/rules/claude-agent-protocol.md') || '';
    const agents = r.file('AGENTS.md') || '';
    const backend = r.file('.claude/agents/backend-developer.md') || '';
    const ui = r.file('.claude/agents/ui-ux-developer.md') || '';
    const ocQa = r.file('.opencode/agents/qa-tester.md') || '';
    check(!r.file('.claude/agents/project-manager.md') && !r.file('.opencode/agents/project-manager.md'), 'rendered: no project-manager file');
    check(/fly deploy/.test(proto) && /alembic upgrade head/.test(proto) && /stripe` CLI in live mode/.test(proto), 'rendered protocol §6 names the deploy channels and live tools');
    check(/\| backend-developer \| sonnet \|/.test(proto) && /\| qa-tester \| opus \|/.test(proto) && /up to opus for money/.test(proto), 'rendered protocol §3: sonnet builders with a step-up trigger, opus judges');
    check(/no bare `except:`/.test(backend) && /zero `any`/.test(backend) && /money\.py/.test(backend) && /Never edit an applied migration/.test(backend), 'rendered backend-developer: merged TS + Python hygiene, money module, migration rule');
    check(/^1\. \*\*One database session/m.test(backend) && /^8\. \*\*Unclear data shape/m.test(backend), 'rendered backend-developer: numbered rules stay sequential');
    check(/## Design bar/.test(ui) && /## Usability bar/.test(ui) && /create invoice → send/.test(ui) && /Load the `frontend-design` skill/.test(ui) && /Trust before payment/.test(ui), 'rendered ui-ux-developer: Design + Usability bars with core flows, design skill, payments rule');
    check(/^mode: subagent$/m.test(ocQa) && /^model: anthropic\/claude-opus-5-5#high$/m.test(ocQa) && !/^name:/m.test(ocQa), 'rendered OpenCode file: subagent, provider/model#variant, no name');
    check(/⚠️ undecided — the UI developer proposes a direction/.test(agents) && /Refund window \| ⚠️ undecided/.test(agents) && /Load the `frontend-design` skill/.test(agents), 'rendered AGENTS.md: undecided markers and the design-skill line');
    check(r.file('documentation/pages/invoices-new.md') !== null && /agent: qa-tester/.test(r.file('.opencode/commands/security-review.md') || ''), 'rendered docs page from route and the OpenCode security-review command');
    check(JSON.parse(r.file('opencode.json')).permissions.length === 1 && JSON.parse(r.file('.claude/settings.json')).permissions.allow.includes('Bash'), 'rendered permissions: allow-all in both harnesses');
    check(r.file('.agents/verify-team.js') !== null, 'rendered: verifier copied into .agents/');
  }
}
{
  const claudeOnly = runRender({ ...fixture, harness: 'claude' });
  check(claudeOnly.code === 0 && claudeOnly.file('CLAUDE.md') !== null && claudeOnly.file('.opencode/agents/qa-tester.md') === null && claudeOnly.file('opencode.json') === null, 'render-team: harness claude writes no OpenCode files');
  const other = runRender({ ...fixture, harness: 'other', other_harness: { name: 'Gemini CLI' } });
  check(other.code === 0 && other.file('GEMINI.md') !== null && other.file('.agents/agents/architect.md') !== null && other.file('.claude/settings.json') === null && !/^---/.test(other.file('.agents/agents/architect.md')), 'render-team: another harness gets body-only files and a pointer file');
  const pm = runRender({ ...fixture, roster: [...fixture.roster, 'project-manager'] });
  check(pm.code === 1 && /no project-manager/.test(pm.out), 'render-team refuses a project-manager role');
  const fs2 = runRender({ ...fixture, roster: [...fixture.roster, 'fullstack-developer'], roles: { ...fixture.roles, 'fullstack-developer': { oc_model: 'x/y', focus: 'x', owned_paths: 'x', forbidden_paths: 'x', expensive_mistake: 'x' } } });
  check(fs2.code === 1 && /fullstack-developer replaces/.test(fs2.out), 'render-team refuses fullstack-developer beside the two builders');
  const missing = runRender({ ...fixture, stack: { ...fixture.stack, client_rule: undefined } });
  check(missing.code === 1 && /missing field "stack\.client_rule"/.test(missing.out), 'render-team names a missing field');
  const noOc = runRender({ ...fixture, roles: { ...fixture.roles, architect: { focus: 'x' } } });
  check(noOc.code === 1 && /roles\.architect\.oc_model is required/.test(noOc.out), 'render-team requires OpenCode model pins when OpenCode is a target');
}

// --- 3b. verify-team.js against a synthetic generated tree ------------------------------
const BODY = (name) => `# ${name}\n\n## Scope & focus\nYour lane: x. User-gated actions (protocol §6): only on the user's instruction.\n\n## Handoff\nDone → main agent\n`;
const ocAgent = (name, extra = '') => `---\ndescription: x\nmode: subagent\nmodel: anthropic/claude-opus-5-5#high\n${extra}---\n${BODY(name)}`;
const ccAgent = (name, extra = '') => `---\nname: ${name}\ndescription: x\nmodel: opus\n${extra}---\n${BODY(name)}`;
const rule = (action, resource, effect) => ({ action, resource, effect });
const CC_ALLOW = ['Bash', 'Edit', 'Write', 'WebFetch'];
const ROLES = ['backend-developer', 'ui-ux-developer', 'qa-tester', 'code-reviewer'];
const goodTree = {
  'AGENTS.md': `# T — Agent Guide\n\n## How we work\nThe main agent leads. Open permissions, user-gated actions.\n\n## Agent team\n| Agent | Focus (owns) | Hands off to |\n|---|---|---|\n| **Main agent** (the session itself — no file) | plans | all |\n${ROLES.map((r) => `| ${r} | x | main agent |`).join('\n')}\n\n## Dev commands\n- \`npm run lint\`\n`,
  'CLAUDE.md': '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n',
  '.agents/rules/claude-agent-protocol.md': '# Protocol\n\nThe senior ladder. See documentation/ and run `npm run lint`. Handoff `{ROLE} Complete → …`.\n\n## 6. Autonomy & user-gated actions\nx\n',
  '.claude/settings.json': JSON.stringify({ permissions: { allow: CC_ALLOW } }, null, 2),
  'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow')] }, null, 2),
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
  try { return { code: 0, out: execFileSync(process.execPath, [verify, dir], { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout) }; }
}
function withTree(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atg-verify-'));
  try { writeTree(dir, files); return fn(runVerify(dir)); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const failLines = (r) => r.out.split('\n').filter((l) => l.startsWith('FAIL'));

withTree(goodTree, (r) => check(r.code === 0, `verify-team passes on a consistent generated tree${r.code ? `\n${failLines(r).join('\n')}` : ''}`));
withTree({ ...goodTree, 'AGENTS.md': goodTree['AGENTS.md'] + '\n## Business rules\n| Role | Sees |\n|---|---|\n| translator | own invoices |\n' },
  (r) => check(r.code === 0, `verify-team reads roster rows from the Agent team section only${r.code ? `\n${failLines(r).join('\n')}` : ''}`));

const agentsNoGuard = goodTree['AGENTS.md'].replace('## How we work\nThe main agent leads. Open permissions, user-gated actions.\n\n', '');
const cases = [
  ['unfilled placeholder', { 'AGENTS.md': goodTree['AGENTS.md'] + '\nColors: {PALETTE}\n' }, /no unfilled placeholders/],
  ['unrendered template section', { 'AGENTS.md': goodTree['AGENTS.md'] + '\n{{#has_ui}}x{{/has_ui}}\n' }, /no unfilled placeholders/],
  ['a project-manager file', { '.claude/agents/project-manager.md': ccAgent('project-manager') }, /no \.claude\/agents\/project-manager\.md/],
  ['a legacy .opencode/agent directory', { '.opencode/agent/qa-tester.md': ocAgent('qa-tester') }, /no legacy OpenCode 1 directory/],
  ['OpenCode 1 frontmatter keys', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester', 'temperature: 0.1\npermission:\n  edit: deny\n') }, /no OpenCode 1 frontmatter keys/],
  ['a per-agent permissions list', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester', 'permissions:\n  - action: edit\n    resource: "*"\n    effect: deny\n') }, /no per-agent permissions list/],
  ['a model without a provider', { '.opencode/agents/qa-tester.md': ocAgent('qa-tester').replace('anthropic/claude-opus-5-5#high', 'opus') }, /model is provider\/model/],
  ['OpenCode 1 action names in opencode.json', { 'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow'), rule('bash', 'git push *', 'ask')] }) }, /OpenCode 2 action names/],
  ['an OpenCode 1 permission map', { 'opencode.json': JSON.stringify({ permission: { bash: { '*': 'allow' } } }) }, /"permissions" rule list/],
  ['a first rule that is not allow-all', { 'opencode.json': JSON.stringify({ permissions: [rule('shell', '*', 'ask')] }) }, /first permission rule is the allow-all/],
  ['an edit deny rule', { 'opencode.json': JSON.stringify({ permissions: [rule('*', '*', 'allow'), rule('edit', 'src/*', 'deny')] }) }, /no edit deny rule/],
  ['CC settings without Bash', { '.claude/settings.json': JSON.stringify({ permissions: { allow: ['Edit'] } }) }, /allows Edit and Bash/],
  ['CC agent with a tools: line', { '.claude/agents/qa-tester.md': ccAgent('qa-tester', 'tools: Read, Grep\n') }, /no tools: line/],
  ['handoff to a project-manager', { '.claude/agents/qa-tester.md': ccAgent('qa-tester').replace('→ main agent', '→ project-manager') }, /hands off to the main agent/],
  ['agent missing the user-gated rule', { '.claude/agents/qa-tester.md': ccAgent('qa-tester').replace(/User-gated[^\n]*/, '') }, /states the user-gated rule/],
  ['AGENTS.md missing How we work', { 'AGENTS.md': agentsNoGuard }, /How we work/],
  ['protocol missing §6', { '.agents/rules/claude-agent-protocol.md': '# Protocol\n\nThe senior ladder. documentation/ `npm run lint` `{ROLE} Complete`.\n' }, /§6 Autonomy/],
  ['missing known-issues.md', { 'documentation/known-issues.md': null }, /known-issues\.md exists/],
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
const pkg = JSON.parse(readText(path.join(root, 'package.json')));
const plugin = JSON.parse(readText(path.join(root, '.claude-plugin', 'plugin.json')));
const marketplace = JSON.parse(readText(path.join(root, '.claude-plugin', 'marketplace.json')));
check(pkg.name === plugin.name && plugin.name === marketplace.plugins[0].name, 'package/plugin/marketplace names agree');
check(pkg.version === plugin.version, `package and plugin versions agree (${pkg.version})`);
check(pkg.files.includes('skills'), 'npm files list includes skills/');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
