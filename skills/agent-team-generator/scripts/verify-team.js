#!/usr/bin/env node
/**
 * verify-team.js — mechanical checks for a generated agent team.
 *
 * Run from the target project's root after generation (SKILL.md Step 6), and again whenever
 * the roster or a convention changes:
 *
 *   node .agents/verify-team.js            # after the skill copies it there
 *   node <skill-dir>/scripts/verify-team.js [target-root]
 *
 * Plain Node, no dependencies. Exit 1 on any FAIL. Warnings do not fail the run.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
let failures = 0;
let warnings = 0;

const ok = (label) => console.log(`ok   - ${label}`);
const fail = (label) => { failures++; console.log(`FAIL - ${label}`); };
const warn = (label) => { warnings++; console.log(`warn - ${label}`); };
const check = (cond, label) => (cond ? ok(label) : fail(label));

const P = (...p) => path.join(root, ...p);
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8');
const mdFiles = (dir) => (exists(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []);
const stem = (f) => f.replace(/\.md$/, '');

// ---------------------------------------------------------------- 1. required files
const protocolPath = P('.agents', 'rules', 'claude-agent-protocol.md');
check(exists(P('AGENTS.md')), 'AGENTS.md exists');
check(exists(protocolPath), '.agents/rules/claude-agent-protocol.md exists');
check(exists(P('documentation', 'README.md')), 'documentation/README.md exists');

const ccDir = P('.claude', 'agents');
const ocDir = P('.opencode', 'agent');
const neutralDir = P('.agents', 'agents');
const hasCC = exists(ccDir);
const hasOC = exists(ocDir);
const hasNeutral = exists(neutralDir);
check(hasCC || hasOC || hasNeutral, 'at least one agent directory exists (.claude/agents, .opencode/agent, .agents/agents)');

if (hasCC) {
  check(exists(P('CLAUDE.md')), 'CLAUDE.md exists (Claude Code harness)');
  if (exists(P('CLAUDE.md'))) {
    const c = read(P('CLAUDE.md'));
    check(/@AGENTS\.md/.test(c) && /@\.agents\/rules\/claude-agent-protocol\.md/.test(c), 'CLAUDE.md imports AGENTS.md and the protocol');
  }
  check(!exists(path.join(ccDir, 'project-manager.md')), 'no .claude/agents/project-manager.md (PM is the main session)');
  check(exists(P('.claude', 'settings.json')), '.claude/settings.json exists (permission tier for Claude Code)');
}

// ---------------------------------------------------------------- 2. placeholders
// Unfilled generator placeholders are ALL-CAPS tokens in braces. Fenced code blocks are
// skipped (roles copy output templates from them); {ROLE} is the protocol's generic token;
// lowercase {var} is i18n syntax.
const PLACEHOLDER = /\{[A-Z][A-Z0-9_]+(?:[\s—–-][^}]*)?\}/g;
const ALLOWED = new Set(['{ROLE}']);

function findPlaceholders(text) {
  const hits = [];
  let inFence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    for (const m of line.match(PLACEHOLDER) || []) {
      if (!ALLOWED.has(m)) hits.push(`${i + 1}: ${m}`);
    }
  });
  return hits;
}

function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(md|json|mdc)$/.test(e.name)) out.push(p);
  }
  return out;
}

const generated = [
  P('AGENTS.md'), P('CLAUDE.md'), P('GEMINI.md'), protocolPath, P('.claude', 'settings.json'),
  ...walk(ccDir), ...walk(ocDir), ...walk(neutralDir), ...walk(P('documentation')),
  ...walk(P('.opencode', 'command')),
].filter(exists);

for (const f of generated) {
  const hits = findPlaceholders(read(f));
  check(hits.length === 0, `${path.relative(root, f)}: no unfilled placeholders${hits.length ? ` (${hits.slice(0, 3).join('; ')}${hits.length > 3 ? '; …' : ''})` : ''}`);
}

// ---------------------------------------------------------------- 3. frontmatter helpers
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}
function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}
// Lines of an indented YAML sub-block: from `<indent>key:` to the next line at <= indent.
function subBlock(fm, key, indent) {
  const lines = fm.split('\n');
  const start = lines.findIndex((l) => l === `${' '.repeat(indent)}${key}:`);
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') continue;
    const ind = l.match(/^ */)[0].length;
    if (ind <= indent) break;
    out.push(l);
  }
  return out;
}

// ---------------------------------------------------------------- 4. roster vs files
const agentsMd = exists(P('AGENTS.md')) ? read(P('AGENTS.md')) : '';
const rosterNames = new Set();
{
  const section = agentsMd.split(/^## Agent team/m)[1] || '';
  for (const line of section.split('\n')) {
    const m = line.match(/^\|\s*([a-z][a-z0-9-]*)(?:\s*\([^)]*\))?\s*\|/);
    if (m) rosterNames.add(m[1]);
  }
  check(rosterNames.size > 0, `AGENTS.md roster table parsed (${[...rosterNames].join(', ') || 'none'})`);
}

const cc = new Set(mdFiles(ccDir).map(stem));
const oc = new Set(mdFiles(ocDir).map(stem));
const neutral = new Set(mdFiles(neutralDir).map(stem));
const rosterMinusPM = new Set([...rosterNames].filter((n) => n !== 'project-manager'));
const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const diff = (a, b) => [...a].filter((x) => !b.has(x));

if (hasCC) check(same(cc, rosterMinusPM), `.claude/agents == roster minus PM${same(cc, rosterMinusPM) ? '' : ` (extra: ${diff(cc, rosterMinusPM).join(',') || '-'}; missing: ${diff(rosterMinusPM, cc).join(',') || '-'})`}`);
if (hasOC) check(same(oc, rosterNames), `.opencode/agent == full roster incl. PM${same(oc, rosterNames) ? '' : ` (extra: ${diff(oc, rosterNames).join(',') || '-'}; missing: ${diff(rosterNames, oc).join(',') || '-'})`}`);
if (hasNeutral) check(same(neutral, rosterNames), `.agents/agents == full roster incl. PM`);
if (hasCC && hasOC) check(same(cc, new Set([...oc].filter((n) => n !== 'project-manager'))), 'CC roster == OC roster minus PM');

// ---------------------------------------------------------------- 5. per-agent file shape
function checkAgentFile(file, kind) {
  const text = read(file);
  const rel = path.relative(root, file);
  const fm = frontmatter(text);
  if (kind !== 'neutral') {
    check(fm.length > 0, `${rel}: has frontmatter`);
    check(fmValue(fm, 'name') === stem(path.basename(file)), `${rel}: frontmatter name matches filename`);
  }
  check(/^## Handoff/m.test(text), `${rel}: has a Handoff section`);
  check(/^## (Scope \(hard contract\)|Scope)/m.test(text), `${rel}: has a Scope contract`);
  return { text, fm, rel };
}

for (const f of mdFiles(ccDir)) checkAgentFile(path.join(ccDir, f), 'cc');
for (const f of mdFiles(neutralDir)) checkAgentFile(path.join(neutralDir, f), 'neutral');

const ocFiles = mdFiles(ocDir).map((f) => ({ name: stem(f), ...checkAgentFile(path.join(ocDir, f), 'oc') }));

// ---------------------------------------------------------------- 6. OpenCode specifics
if (hasOC) {
  const pmFile = ocFiles.find((a) => a.name === 'project-manager');
  if (pmFile) {
    check(fmValue(pmFile.fm, 'mode') === 'primary', 'OC project-manager is mode: primary');
    check(fmValue(pmFile.fm, 'model') === null, 'OC project-manager has no model pin');
    const edit = subBlock(pmFile.fm, 'edit', 2) || [];
    check(!edit.some((l) => /src|server|app\//.test(l) && /allow/.test(l)), 'OC project-manager edit rights are docs-only (no src/server/app allow)');
  } else fail('OC project-manager.md exists');

  for (const a of ocFiles.filter((x) => x.name !== 'project-manager')) {
    check(fmValue(a.fm, 'mode') === 'subagent', `${a.rel}: mode: subagent`);
  }

  // One policy: the bash block (and external_directory, if any) identical in every OC file.
  const policyOf = (a) => {
    const bash = subBlock(a.fm, 'bash', 2);
    const ext = fmValue(a.fm, '  external_directory') || (a.fm.match(/^  external_directory:\s*(.+)$/m) || [])[1] || '';
    return bash ? `${bash.map((l) => l.trim()).join('\n')}\n[external_directory=${ext.trim()}]` : null;
  };
  const policies = ocFiles.map((a) => ({ rel: a.rel, policy: policyOf(a) }));
  for (const p of policies) check(p.policy !== null, `${p.rel}: has a bash permission block`);
  const distinct = new Set(policies.map((p) => p.policy).filter(Boolean));
  check(distinct.size <= 1, `bash policy identical across all OC files${distinct.size > 1 ? ` (${distinct.size} variants)` : ''}`);

  const sample = policies.find((p) => p.policy)?.policy || '';
  // Tolerate trailing "# comments" so a commented line can't silently drop out of the checks.
  const bashLines = sample.split('\n')
    .map((l) => l.replace(/\s+#.*$/, ''))
    .filter((l) => /^".*":\s*(allow|ask|deny)$/.test(l));
  if (bashLines.length) {
    check(/^"\*":\s*(allow|ask)$/.test(bashLines[0]), `bash block starts with the "*" default (${bashLines[0]})`);
    const lastAskIdx = bashLines.map((l) => /: ask$/.test(l)).lastIndexOf(true);
    const firstDenyIdx = bashLines.findIndex((l) => /: deny$/.test(l));
    check(firstDenyIdx === -1 || lastAskIdx === -1 || firstDenyIdx > lastAskIdx, 'bash block: deny lines come after ask lines (OpenCode: last match wins)');
    const isSandbox = bashLines.length === 1 && /allow$/.test(bashLines[0]);
    if (isSandbox) warn('Sandbox tier: no mechanical deploy guard — the hand-over must say so');
    else check(bashLines.some((l) => /git push --force\*": deny/.test(l)), 'destructive set present (force push denied)');
  }

  // Ownership: builder edit globs must not overlap unless a line is marked "# shared".
  const builders = ocFiles.filter((a) => !['project-manager', 'qa-tester', 'product-specialist', 'architect'].includes(a.name));
  const globsOf = (a) => (subBlock(a.fm, 'edit', 2) || [])
    .filter((l) => /:\s*allow/.test(l) && !/# shared/.test(l))
    .map((l) => (l.match(/"([^"]+)"/) || [])[1]).filter(Boolean);
  // Single-pass glob → regex so replacement text is never re-processed.
  const toRegex = (g) => new RegExp('^' + g.replace(/\*\*\/|\*\*|\*|[.+^${}()|[\]\\]/g, (t) =>
    t === '**/' ? '(?:.*/)?' : t === '**' ? '.*' : t === '*' ? '[^/]*' : `\\${t}`) + '$');
  const samplePath = (g) => g.replace(/\*\*\//g, 'x/y/').replace(/\*\*/g, 'x/y').replace(/\*/g, 'x');
  for (let i = 0; i < builders.length; i++) {
    for (let j = i + 1; j < builders.length; j++) {
      const A = builders[i]; const B = builders[j];
      const overlaps = [];
      for (const ga of globsOf(A)) for (const gb of globsOf(B)) {
        if (ga === gb || toRegex(ga).test(samplePath(gb)) || toRegex(gb).test(samplePath(ga))) overlaps.push(`${ga} ~ ${gb}`);
      }
      check(overlaps.length === 0, `ownership: ${A.name} and ${B.name} do not overlap${overlaps.length ? ` (${overlaps.join('; ')}) — mark deliberate shared files with "# shared"` : ''}`);
    }
  }

  // Claude Code settings carry the same denies, if CC is also generated.
  if (hasCC && exists(P('.claude', 'settings.json'))) {
    let settings = null;
    try { settings = JSON.parse(read(P('.claude', 'settings.json'))); } catch (e) { settings = null; }
    check(settings && settings.permissions, '.claude/settings.json is valid JSON with a permissions key');
    if (settings && settings.permissions) {
      // Compare shapes, not spacing: OC `git push* --force*` and CC `Bash(git push * --force *)`
      // both normalise to `gitpush--force`.
      const norm = (s) => s.replace(/^Bash\((.*)\)$/, '$1').replace(/[\s*]/g, '');
      const ccDeny = (settings.permissions.deny || []).map(norm);
      const ocDenies = bashLines.filter((l) => /: deny$/.test(l)).map((l) => l.match(/^"([^"]+)"/)[1]);
      const missing = ocDenies
        .filter((d) => !/\|/.test(d)) // pipe-to-shell has no CC equivalent
        .filter((d) => !ccDeny.some((c) => c === norm(d)));
      check(missing.length === 0, `.claude/settings.json deny covers every OC deny prefix${missing.length ? ` (missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''})` : ''}`);
    }
  }
}

// ---------------------------------------------------------------- 7. gate commands exist
if (exists(P('package.json'))) {
  let scripts = {};
  try { scripts = JSON.parse(read(P('package.json'))).scripts || {}; } catch (e) { scripts = {}; }
  const texts = [agentsMd, exists(protocolPath) ? read(protocolPath) : '', ...ocFiles.map((a) => a.text)];
  const referenced = new Set();
  for (const t of texts) for (const m of t.matchAll(/npm run ([\w:.-]+)/g)) referenced.add(m[1]);
  const missing = [...referenced].filter((s) => !scripts[s]);
  check(missing.length === 0, `every "npm run <script>" quoted as a gate exists in package.json${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
} else if (!/verify scripts exist after first scaffold/.test(agentsMd)) {
  warn('no package.json — gate commands could not be verified; AGENTS.md should carry "⚠️ verify scripts exist after first scaffold"');
}

// ---------------------------------------------------------------- 8. docs seeded
for (const d of ['pages', 'features']) {
  const dir = P('documentation', d);
  check(exists(dir) && fs.readdirSync(dir).length > 0, `documentation/${d}/ exists and is tracked (.gitkeep or a doc)`);
}
if (exists(protocolPath)) check(/documentation\//.test(read(protocolPath)), 'protocol references documentation/');

// ---------------------------------------------------------------- summary
console.log(`\n${failures === 0 ? 'verify-team: all checks passed' : `verify-team: ${failures} check(s) FAILED`}${warnings ? ` (${warnings} warning(s))` : ''}`);
process.exit(failures === 0 ? 0 : 1);
