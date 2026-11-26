#!/usr/bin/env node
/**
 * render-team.cjs — renders a generated agent team from `team.json` and the skill's templates.
 *
 *   node <skill-dir>/scripts/render-team.cjs [path/to/team.json] [--no-verify] [--dry-run]
 *
 * Run from the target project's root (default team.json: .agents/team.json). Writes CLAUDE.md,
 * the protocol, every agent file for the chosen harness(es), the allow-all permission files
 * (merged into what is there), copies verify-team.cjs into .agents/ and runs it. Plain Node, no
 * dependencies; .cjs so it runs inside a `"type": "module"` project too.
 *
 * Safe to re-run on a project that has grown its own files:
 *   - AGENTS.md is written whole only when missing. Afterwards only the block between
 *     <!-- team:start --> and <!-- team:end --> is replaced; with no markers the file is left
 *     alone and the render goes to .agents/AGENTS.generated.md for the user to merge.
 *   - documentation/ and the OpenCode security-review command are seeded only when missing.
 *   - Any path in team.json `keep` that exists is never written.
 *   - A file whose content would not change is not rewritten.
 *   - .agents/.rendered.json lists what this skill owns, so the verifier checks only those.
 *
 * Template syntax (references/templates/*.md): {{key}} value (arrays of strings join with
 * newlines; a missing key is an error) · {{#key}}…{{/key}} render when truthy (arrays iterate,
 * objects merge into scope) · {{^key}}…{{/key}} render when falsy · {{> name}} include
 * references/templates/partials/<name>.md · {{.}} the current array item. Numbered lists are
 * renumbered after rendering, so a conditional rule can drop out without leaving a gap.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const skillDir = path.join(__dirname, '..');
const templatesDir = path.join(skillDir, 'references', 'templates');
const partialsDir = path.join(templatesDir, 'partials');

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const teamArg = argv.find((a) => !a.startsWith('--'));
const root = process.cwd();
const teamPath = path.resolve(root, teamArg || path.join('.agents', 'team.json'));
const dryRun = flags.has('--dry-run');

function die(msg) { console.error(`render-team: ${msg}`); process.exit(1); }
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const exists = (p) => fs.existsSync(p);

// ----------------------------------------------------------------- template engine
const TAG = /\{\{(\/|#|\^|>)?\s*([\w.-]+)\s*\}\}/g;

function lookup(ctx, key) {
  if (key === '.') return ctx['.'];
  let cur = ctx;
  for (const part of key.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}
const truthy = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== false && v !== '');
function stringify(v, key, file) {
  if (v === undefined || v === null) throw new Error(`missing field "${key}" (used by ${file})`);
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n');
  if (typeof v === 'object') throw new Error(`field "${key}" is an object; use {{#${key}}}…{{/${key}}} (in ${file})`);
  return String(v);
}

function findClose(src, from, name, file) {
  const re = new RegExp(TAG.source, 'g');
  re.lastIndex = from;
  let depth = 1; let m;
  while ((m = re.exec(src))) {
    if (m[2] !== name) continue;
    if (m[1] === '#' || m[1] === '^') depth++;
    else if (m[1] === '/') { depth--; if (depth === 0) return { start: m.index, end: re.lastIndex }; }
  }
  throw new Error(`unclosed {{#${name}}} in ${file}`);
}

const partialCache = {};
function partial(name) {
  if (!partialCache[name]) {
    const p = path.join(partialsDir, `${name}.md`);
    if (!exists(p)) throw new Error(`unknown partial {{> ${name}}} (expected ${p})`);
    partialCache[name] = read(p);
  }
  return partialCache[name];
}

function renderTemplate(src, ctx, file) {
  // Standalone section tags do not leave an empty line behind.
  src = src.replace(/^[ \t]*(\{\{[#^/][^}]*\}\})[ \t]*\n/gm, '$1');
  let out = ''; let pos = 0;
  const re = new RegExp(TAG.source, 'g');
  let m;
  while ((m = re.exec(src))) {
    out += src.slice(pos, m.index);
    const [, sigil, name] = m;
    if (sigil === '/') throw new Error(`stray {{/${name}}} in ${file}`);
    if (sigil === '>') { out += renderTemplate(partial(name), ctx, `partials/${name}.md`); pos = re.lastIndex; continue; }
    if (sigil === '#' || sigil === '^') {
      const close = findClose(src, re.lastIndex, name, file);
      const inner = src.slice(re.lastIndex, close.start);
      const val = lookup(ctx, name);
      if (sigil === '#' && truthy(val)) {
        if (Array.isArray(val)) for (const item of val) out += renderTemplate(inner, typeof item === 'object' ? { ...ctx, ...item, '.': item } : { ...ctx, '.': item }, file);
        else if (typeof val === 'object') out += renderTemplate(inner, { ...ctx, ...val, '.': val }, file);
        else out += renderTemplate(inner, ctx, file);
      } else if (sigil === '^' && !truthy(val)) out += renderTemplate(inner, ctx, file);
      pos = close.end; re.lastIndex = pos; continue;
    }
    out += stringify(lookup(ctx, name), name, file);
    pos = re.lastIndex;
  }
  return out + src.slice(pos);
}

function renumber(text) {
  // Sequential numbers per tight numbered list; a heading or an unindented non-list paragraph resets.
  const lines = text.split('\n');
  let n = 0; let inFence = false;
  return lines.map((line) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; n = 0; return line; }
    if (inFence) return line;
    const m = line.match(/^(\d+)\.\s/);
    if (m) { n++; return `${n}.${line.slice(m[1].length + 1)}`; }
    if (line.trim() !== '' && !/^\s/.test(line) && !/^[-*|>]/.test(line)) n = 0;
    return line;
  }).join('\n');
}

function squeeze(text) {
  return text.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
}

function frontmatterSplit(src, file) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: src.slice(m[0].length) };
}

// ----------------------------------------------------------------- team.json → context
if (!exists(teamPath)) die(`${path.relative(root, teamPath)} not found (write it per references/team-schema.md first)`);
let team;
try { team = JSON.parse(read(teamPath)); } catch (e) { die(`team.json is not valid JSON: ${e.message}`); }

const req = (obj, key, where) => { if (!truthy(lookup(obj, key))) die(`team.json: "${where}.${key}" is required`); };
for (const k of ['harness', 'project', 'commands', 'stack', 'risk', 'report_style', 'gated', 'roster', 'roles', 'agents_md', 'protocol']) req(team, k, '');
for (const k of ['name', 'pitch', 'stack']) req(team.project, k, 'project');
for (const k of ['gates', 'build']) req(team.commands, k, 'commands');
for (const k of ['surfaces']) req(team.risk, k, 'risk');
req(team.gated, 'deploy_commands', 'gated');
req(team.protocol, 'shared_root_files', 'protocol');
if (!['both', 'claude', 'opencode', 'other'].includes(team.harness)) die('team.json: harness must be both | claude | opencode | other');
if (team.harness === 'other' && !(team.other_harness && team.other_harness.name)) die('team.json: other_harness.name is required when harness is "other"');

const hasCC = team.harness === 'both' || team.harness === 'claude';
const hasOC = team.harness === 'both' || team.harness === 'opencode';
const hasNeutral = team.harness === 'other';

const styles = {
  'Technical': { what: 'every file and decision, trade-offs stated', evidence: 'full gate output quoted' },
  'Direct with technical summary': { what: 'files touched with a one-line reason each', evidence: 'gate names with pass/fail, failures quoted verbatim' },
  'Plain English': { what: 'what the product now does, no file paths in prose', evidence: '"gates passed" or the failure in words' },
};
if (!styles[team.report_style]) die(`team.json: report_style must be one of ${Object.keys(styles).map((s) => `"${s}"`).join(', ')}`);

const backtick = (s) => `\`${s}\``;
const gateCommands = team.commands.gates.map(backtick).join(' · ');
const agentDir = hasNeutral ? '.agents/agents' : hasCC ? '.claude/agents' : '.opencode/agents';
const agentDirs = hasNeutral ? '`.agents/agents/*.md`' : team.harness === 'both' ? '`.claude/agents/*.md` for Claude Code, `.opencode/agents/*.md` for OpenCode' : hasCC ? '`.claude/agents/*.md`' : '`.opencode/agents/*.md`';
const permissionFiles = hasNeutral ? 'your harness\'s own settings' : [hasCC && '`.claude/settings.json`', hasOC && '`opencode.json`'].filter(Boolean).join(' and ');

const i18n = team.i18n && team.i18n.locale_files ? {
  ...team.i18n,
  rule: `No hardcoded user-facing strings — every key in ALL locale files (${team.i18n.locale_files}), ${team.i18n.interpolation || 'the project\'s'} interpolation.`,
  check: `Every new key present in all locale files (${team.i18n.locale_files}) — grepped, not assumed`,
} : null;

const riskQuestion = team.risk.surfaces.split(/,\s*/).map((s) => `${s}?`).join(' ');

// Roster: template metadata gives each role its description, colour, work type and defaults.
const roleMeta = {};
function loadRole(name) {
  const r = team.roles[name] || {};
  const tplName = r.template || name;
  const tplPath = path.join(templatesDir, `${tplName}.md`);
  let src;
  if (exists(tplPath)) src = read(tplPath);
  else if (r.body_file) src = read(path.resolve(root, r.body_file));
  else die(`roster role "${name}": no template references/templates/${tplName}.md and no roles.${name}.body_file`);
  const { meta, body } = frontmatterSplit(src, tplPath);
  const kind = r.kind || meta.kind || 'builder';
  roleMeta[name] = { name, body, meta, kind, work_type: r.work_type || meta.work_type || name, cc_model: r.cc_model || meta.cc_model || 'sonnet', oc_model: r.oc_model || '', escalate: r.escalate || meta.escalate || '—', color: r.color || meta.color || '#95A5A6', description_tpl: r.description || meta.description || '', handoff: r.hands_off_to || meta.hands_off_to || 'main agent', focus: r.focus || '' };
  return roleMeta[name];
}
if (team.roster.includes('project-manager')) die('team.json: no project-manager role — the main agent leads');
for (const name of team.roster) loadRole(name);

const builders = team.roster.filter((n) => roleMeta[n].kind === 'builder');
const builderNames = builders.join(' / ') || 'developer';
const tplOf = (n) => (team.roles[n] && team.roles[n].template) || n;
const uiRoles = team.roster.filter((n) => ['ui-ux-developer', 'fullstack-developer'].includes(tplOf(n)) || roleMeta[n].meta.ui === 'true');
if (team.roster.includes('fullstack-developer') && (team.roster.includes('backend-developer') || team.roster.includes('ui-ux-developer'))) die('team.json: fullstack-developer replaces backend-developer + ui-ux-developer, never sits beside them');

const design = team.design || {};
const base = {
  ...team,
  has_cc: hasCC, has_oc: hasOC, has_neutral: hasNeutral, has_both: team.harness === 'both',
  i18n,
  personas_line: (team.project.personas || []).join(' · '),
  gate_commands: gateCommands,
  agent_dir: agentDir, agent_dirs: agentDirs, permission_files: permissionFiles,
  what_changed_depth: styles[team.report_style].what, evidence_depth: styles[team.report_style].evidence,
  risk: { ...team.risk, question: riskQuestion },
  builders, builder_names: builderNames,
  has_browser_tester: team.roster.includes('browser-tester'),
  builder_1: builders[0] || 'developer', builder_2: builders[1] || builders[0] || 'developer',
  design: { ...design, direction_or_marker: design.direction || '⚠️ undecided — the UI developer proposes a direction and gets it approved before the first screen; never invent a look screen by screen', skills: design.skills || [] },
  roster_rows: team.roster.map((n) => ({ name: n, focus: roleMeta[n].focus || `⚠️ undecided — fill roles.${n}.focus`, handoff: roleMeta[n].handoff })),
  persona_rows: team.roster.map((n) => ({ name: n, work_type: roleMeta[n].work_type })),
  model_rows: team.roster.map((n) => ({ name: n, cc_model: roleMeta[n].cc_model, escalate: roleMeta[n].escalate })), // escalate rendered below
  main_branch: team.main_branch || 'main',
  test_globs: '`**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`',
  today: new Date().toISOString().slice(0, 10),
};
const tryRender = (fn) => { try { return fn(); } catch (e) { die(e.message); } };
for (const row of base.model_rows) row.escalate = tryRender(() => renderTemplate(row.escalate, base, `templates/${row.name}.md (escalate)`));
if (!base.project.has_ui && uiRoles.length) die('team.json: project.has_ui is false but the roster has a UI role');
if (!base.project.has_ui && base.has_browser_tester) die('team.json: project.has_ui is false but the roster has browser-tester');

// ----------------------------------------------------------------- outputs
const outputs = {};
const put = (rel, content) => { outputs[rel] = content; };
const renderFile = (tplFile, ctx) => tryRender(() => squeeze(renumber(renderTemplate(read(path.join(templatesDir, tplFile)), ctx, tplFile))));

put('.agents/rules/claude-agent-protocol.md', renderFile('protocol.md', base));
const agentsFull = renderFile('agents-md.md', base);
const TEAM_BLOCK = /<!-- team:start[^>]*-->[\s\S]*?<!-- team:end -->/;
const notes = [];
{
  const abs = path.join(root, 'AGENTS.md');
  if (!exists(abs)) put('AGENTS.md', agentsFull);
  else {
    const current = read(abs);
    const block = agentsFull.match(TEAM_BLOCK)[0];
    if (TEAM_BLOCK.test(current)) put('AGENTS.md', current.replace(TEAM_BLOCK, () => block));
    else {
      put('.agents/AGENTS.generated.md', agentsFull);
      notes.push('AGENTS.md has no <!-- team:start --> … <!-- team:end --> block, so it was left as it is. The full render is in .agents/AGENTS.generated.md: copy its team block (markers included) into AGENTS.md in place of your How we work and Agent team sections, then re-run.');
    }
  }
}
if (hasCC) put('CLAUDE.md', '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n');
// Settings files are merged: the project's other keys (hooks, env, mcp, extra allow entries,
// extra instructions, later permission rules) survive a re-render.
const readJson = (rel) => { const abs = path.join(root, rel); if (!exists(abs)) return null; try { return JSON.parse(read(abs)); } catch (e) { die(`${rel} is not valid JSON (${e.message}); fix it or move it aside, then re-run`); } };
const union = (a, b) => [...new Set([...(a || []), ...b])];
const ALLOW_ALL = { action: '*', resource: '*', effect: 'allow' };
const isAllowAll = (r) => r && r.action === '*' && r.resource === '*' && r.effect === 'allow';
const putJson = (rel, value) => put(rel, JSON.stringify(value, null, 2) + '\n');
if (hasCC) {
  const cur = readJson('.claude/settings.json') || {};
  const allow = union(cur.permissions && cur.permissions.allow, ['Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', ...(team.mcp_servers || []).map((s) => `mcp__${s}`)]);
  putJson('.claude/settings.json', { ...cur, permissions: { ...(cur.permissions || {}), allow } });
}
if (hasOC) {
  const cur = readJson('opencode.json') || {};
  const rest = Array.isArray(cur.permissions) ? cur.permissions.filter((r) => !isAllowAll(r)) : [];
  putJson('opencode.json', { $schema: 'https://opencode.ai/config.json', ...cur, instructions: union(cur.instructions, ['.agents/rules/claude-agent-protocol.md']), permissions: [ALLOW_ALL, ...rest] });
}

for (const name of team.roster) {
  const rm = roleMeta[name];
  const ctx = { ...base, ...(team.roles[name] || {}), role: name, is_ui: uiRoles.includes(name) };
  const body = tryRender(() => squeeze(renumber(renderTemplate(rm.body, ctx, `templates/${name}.md`))));
  const description = tryRender(() => renderTemplate(rm.description_tpl, ctx, `templates/${name}.md (description)`)).replace(/\s+/g, ' ').trim();
  if (!description) die(`role "${name}": no description (template frontmatter or roles.${name}.description)`);
  if (hasCC) put(`.claude/agents/${name}.md`, `---\nname: ${name}\ndescription: ${description}\nmodel: ${rm.cc_model}\n---\n\n${body}`);
  if (hasOC) put(`.opencode/agents/${name}.md`, `---\ndescription: ${description}\nmode: subagent\n${rm.oc_model ? `model: ${rm.oc_model}\n` : ''}color: "${rm.color}"\n---\n\n${body}`);
  if (hasNeutral) put(`.agents/agents/${name}.md`, body);
}

if (hasNeutral) {
  const pointers = {
    'gemini cli': ['GEMINI.md', '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n'],
    gemini: ['GEMINI.md', '@AGENTS.md\n@.agents/rules/claude-agent-protocol.md\n'],
    cursor: ['.cursor/rules/agent-protocol.mdc', '---\nalwaysApply: true\n---\nRead `AGENTS.md`, then `.agents/rules/claude-agent-protocol.md`, before any task.\n'],
    copilot: ['.github/copilot-instructions.md', 'Read `AGENTS.md`, then `.agents/rules/claude-agent-protocol.md`, before any task.\n'],
    'github copilot': ['.github/copilot-instructions.md', 'Read `AGENTS.md`, then `.agents/rules/claude-agent-protocol.md`, before any task.\n'],
  };
  const o = team.other_harness;
  const p = o.pointer_file ? [o.pointer_file, 'Read `AGENTS.md`, then `.agents/rules/claude-agent-protocol.md`, before any task.\n'] : pointers[o.name.toLowerCase()];
  if (p) put(p[0], p[1]);
}

// Seeded files: written when missing, never overwritten (projects tune them).
const seeded = new Set();
const seededKept = [];
const seedOnly = (rel, content) => { seeded.add(rel); if (!exists(path.join(root, rel))) put(rel, content); else seededKept.push(rel); };
const emptyOrMissing = (rel) => { const abs = path.join(root, rel); return !exists(abs) || fs.readdirSync(abs).length === 0; };
if (team.security_review && hasOC) seedOnly('.opencode/commands/security-review.md', renderFile('security-review-command.md', base));

// documentation/ seed — never overwrite docs the project already has.
const pages = (team.project.pages || []).map((p) => ({ ...p, file: routeToFile(p.route) }));
function routeToFile(route) {
  const parts = route.replace(/^\//, '').split('/').filter(Boolean);
  if (!parts.length) return 'home';
  return parts.map((seg) => (seg.startsWith(':') || /^\[.*\]$/.test(seg) ? 'detail' : seg)).join('-');
}
seedOnly('documentation/README.md', renderFile('docs-readme.md', { ...base, pages }));
seedOnly('documentation/known-issues.md', renderFile('docs-known-issues.md', base));
for (const p of pages) seedOnly(`documentation/pages/${p.file}.md`, renderFile('docs-page.md', { ...base, ...p }));
for (const d of ['pages', 'features']) {
  seeded.add(`documentation/${d}/.gitkeep`);
  if ((d === 'features' || !pages.length) && emptyOrMissing(`documentation/${d}`)) put(`documentation/${d}/.gitkeep`, '');
}

// verifier travels with the project
put('.agents/verify-team.cjs', read(path.join(skillDir, 'scripts', 'verify-team.cjs')));

// ----------------------------------------------------------------- write
const keep = new Set((team.keep || []).map((k) => k.replace(/^\.\//, '')));
const leftover = Object.keys(outputs).filter((rel) => /\.md$/.test(rel) && /\{\{[#^/>]/.test(outputs[rel]));
if (leftover.length) die(`unrendered template sections left in: ${leftover.join(', ')}`);
const written = []; const unchanged = []; const kept = [];
for (const [rel, content] of Object.entries(outputs)) {
  const abs = path.join(root, rel);
  if (keep.has(rel) && exists(abs)) { kept.push(rel); continue; }
  if (exists(abs) && read(abs) === content) { unchanged.push(rel); continue; }
  if (!dryRun) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content); }
  written.push(rel);
}
// What the skill regenerates on every run: the verifier checks these for placeholders, nothing
// else. Seeded files belong to the project once written, so they are not listed.
const owned = Object.keys(outputs).filter((rel) => !kept.includes(rel) && !seeded.has(rel) && rel !== '.agents/verify-team.cjs').sort();
const manifestRel = '.agents/.rendered.json';
// A role dropped from the roster: remove the agent files the previous render wrote for it.
{
  let previous = [];
  try { previous = JSON.parse(read(path.join(root, manifestRel))).files || []; } catch (e) { previous = []; }
  const AGENT_DIR = /^(\.claude\/agents|\.opencode\/agents|\.agents\/agents)\/[^/]+\.md$/;
  for (const rel of previous) {
    if (!AGENT_DIR.test(rel) || rel in outputs || keep.has(rel) || !exists(path.join(root, rel))) continue;
    if (!dryRun) fs.unlinkSync(path.join(root, rel));
    notes.push(`removed ${rel} (no longer in the roster)`);
  }
}
const manifest = JSON.stringify({ note: 'Written by render-team.cjs. Files this skill rendered; verify-team.cjs checks only these.', files: owned }, null, 2) + '\n';
const manifestAbs = path.join(root, manifestRel);
if (!exists(manifestAbs) || read(manifestAbs) !== manifest) { if (!dryRun) fs.writeFileSync(manifestAbs, manifest); written.push(manifestRel); }
// The verifier used to ship as .agents/verify-team.js, which breaks in an ESM project.
const legacyVerifier = path.join(root, '.agents', 'verify-team.js');
if (exists(legacyVerifier) && /verify-team\.js — mechanical checks for a generated agent team/.test(read(legacyVerifier))) {
  if (!dryRun) fs.unlinkSync(legacyVerifier);
  notes.push('removed the old .agents/verify-team.js (replaced by .agents/verify-team.cjs)');
}
const list = (label, items) => { if (items.length) console.log(`${label} ${items.length}:\n  ${items.sort().join('\n  ')}`); };
list(dryRun ? 'would write' : 'wrote', written);
list('unchanged', unchanged);
list('kept (team.json keep)', kept);
list('kept (seeded once, already there)', seededKept);
for (const n of notes) console.log(`\nnote: ${n}`);

if (!dryRun && !flags.has('--no-verify')) {
  console.log('\nrunning .agents/verify-team.cjs …\n');
  const r = spawnSync(process.execPath, [path.join(root, '.agents', 'verify-team.cjs'), root], { stdio: 'inherit' });
  process.exit(r.status === null ? 1 : r.status);
}
