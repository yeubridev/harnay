// `harnay doctor`: prove the harness in this folder is installed, unmodified and
// actually stops things. Exit code 1 on any failed check, so it works in CI.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readManifest, sha } from './plan.mjs';

const MIN_CLAUDE = [2, 1, 295]; // first version with `onFailure: "block"` on hooks

const run = (cmd, args, options = {}) => spawnSync(cmd, args, { encoding: 'utf8', timeout: 20_000, ...options });
const newer = (a, b) => {
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) > b[i];
  return true;
};

export function doctor(root) {
  const checks = [];
  const pass = (name, detail = '') => checks.push({ name, level: 'ok', detail });
  const fail = (name, detail) => checks.push({ name, level: 'fail', detail });
  const warn = (name, detail) => checks.push({ name, level: 'warn', detail });

  const manifest = readManifest(root);
  if (!manifest) {
    fail('Harness installed', 'No harnay.json here. Run `npx harnay init` in the root of your project.');
    return checks;
  }
  pass('Harness installed', `version ${manifest.version}, ${manifest.stack}, ${(manifest.agents ?? []).join(' + ')}`);

  const missing = [];
  const changed = [];
  for (const [rel, hash] of Object.entries(manifest.files)) {
    let content;
    try {
      content = fs.readFileSync(path.join(root, rel), 'utf8');
    } catch {
      missing.push(rel);
      continue;
    }
    if (sha(content) !== hash) changed.push(rel);
  }
  if (missing.length) fail('Managed files present', `Missing: ${missing.join(', ')}. Run \`npx harnay sync\`.`);
  else pass('Managed files present', `${Object.keys(manifest.files).length} files`);
  if (changed.length) fail('Managed files unmodified', `Changed since install: ${changed.join(', ')}. Run \`npx harnay sync --force\` to restore them (a backup is kept).`);
  else if (!missing.length) pass('Managed files unmodified');

  const agents = manifest.agents ?? [];
  const hookDirs = [agents.includes('claude') && '.claude/hooks', agents.includes('cursor') && '.cursor/hooks'].filter(Boolean);

  if (agents.includes('claude')) {
    try {
      const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
      const hooks = (settings.hooks?.PreToolUse ?? []).flatMap((group) => group.hooks ?? []);
      const guard = hooks.find((h) => JSON.stringify(h).includes('.claude/hooks/guard.mjs'));
      if (!guard) fail('Guard registered with Claude Code', '.claude/settings.json has no PreToolUse hook pointing at guard.mjs.');
      else if (settings.disableAllHooks) fail('Guard registered with Claude Code', 'disableAllHooks is set in .claude/settings.json.');
      else pass('Guard registered with Claude Code', guard.onFailure === 'block' ? 'fails closed' : 'registered');
    } catch (error) {
      fail('Guard registered with Claude Code', `.claude/settings.json could not be read (${error.message}).`);
    }
    const local = path.join(root, '.claude/settings.local.json');
    if (fs.existsSync(local) && /"disableAllHooks"\s*:\s*true/.test(fs.readFileSync(local, 'utf8'))) {
      fail('Hooks enabled', 'disableAllHooks is set in .claude/settings.local.json, which switches the guard off.');
    }
  }

  for (const dir of hookDirs) {
    const guard = path.join(root, dir, 'guard.mjs');
    const self = run(process.execPath, [guard, '--self-test', '--json']);
    let result = null;
    try {
      result = JSON.parse(self.stdout);
    } catch {
      // handled below
    }
    if (!result) fail(`Guard runs (${dir})`, `Could not run ${dir}/guard.mjs: ${(self.stderr || self.error?.message || 'no output').trim().split('\n')[0]}`);
    else if (result.failures.length) fail(`Guard rules (${dir})`, `${result.failures.length} of ${result.cases} examples misbehave, starting with ${result.failures[0].rule}.`);
    else pass(`Guard rules (${dir})`, `${result.rules} rules, ${result.cases} examples replayed`);

    // The real path: a tool call on stdin, a decision on stdout.
    const call = { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push --force origin main' }, cwd: root };
    const live = run(process.execPath, [guard], { input: JSON.stringify(call), env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
    const decision = /"permissionDecision":"deny"/.test(live.stdout ?? '');
    if (decision) pass(`Guard blocks a force-push to main (${dir})`);
    else fail(`Guard blocks a force-push to main (${dir})`, 'The hook did not answer "deny" to a test call.');
  }

  if (agents.includes('claude')) {
    const out = run('claude', ['--version']);
    const version = out.stdout?.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
    if (!version) warn('Claude Code version', '`claude` was not found on PATH, so its version was not checked.');
    else if (newer(version, MIN_CLAUDE)) pass('Claude Code version', version.join('.'));
    else warn('Claude Code version', `${version.join('.')} is older than ${MIN_CLAUDE.join('.')}. On older versions a crashing guard lets calls through. Update Claude Code.`);
  }

  const inRepo = run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root }).status === 0;
  if (!inRepo) warn('Secrets ignored by git', 'This folder is not a git repository yet.');
  else if (run('git', ['check-ignore', '-q', '.env'], { cwd: root }).status === 0) pass('Secrets ignored by git', '.env is in .gitignore');
  else fail('Secrets ignored by git', '.env is not ignored. Add `.env` and `.env.*` to .gitignore.');

  try {
    const project = fs.readFileSync(path.join(root, 'PROJECT.md'), 'utf8');
    if (/<[A-Z][^>\n]{8,}>/.test(project)) warn('PROJECT.md filled in', 'It still has placeholders. Open your agent and type /project-brief.');
    else pass('PROJECT.md filled in');
  } catch {
    warn('PROJECT.md filled in', 'PROJECT.md is missing. Run `npx harnay sync` to get the template back.');
  }

  return checks;
}
