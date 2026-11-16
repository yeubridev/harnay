// `harnay audit`: look at any project, with or without a harness, and say what
// a coding agent could do in it right now. Read-only, no network. It reads the
// names of secrets files, never their contents.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.venv', 'venv', 'vendor', 'target', '.harnay']);
const SECRET_NAME = /^(\.env(\.(?!example|sample|template|dist|defaults)[\w.-]+)?|\.envrc|\.dev\.vars|id_rsa|id_ed25519|credentials\.json|service[-_]?account[\w.-]*\.json|[\w.-]+\.pem|terraform\.tfstate)$/i;
// Key shapes worth flagging in agent config files. Assembled so this file does not look like a leak itself.
const KEY_IN_CONFIG = new RegExp(['sk-' + 'ant-[\\w-]{20,}', 'sk_' + 'live_\\w{16,}', 'gh[pousr]_' + '\\w{36,}', 'AK' + 'IA[0-9A-Z]{16}', 'xox[baprs]-' + '[\\w-]{10,}', 'AIza' + '[\\w-]{35}'].join('|'));

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const git = (root, ...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 10_000 });
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

function secretFiles(root, depth = 3) {
  const found = [];
  const walk = (dir, level) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (level < depth && !SKIP.has(entry.name)) walk(path.join(dir, entry.name), level + 1);
      } else if (SECRET_NAME.test(entry.name)) found.push(path.relative(root, path.join(dir, entry.name)));
    }
  };
  walk(root, 0);
  return found.sort();
}

export function audit(root, home = os.homedir()) {
  const findings = [];
  const add = (level, title, detail) => findings.push({ level, title, detail });

  const settings = [path.join(root, '.claude/settings.json'), path.join(root, '.claude/settings.local.json'), path.join(home, '.claude/settings.json')].map(readJson).filter(Boolean);
  const hooks = settings.flatMap((s) => s.hooks?.PreToolUse ?? []);
  const shellHook = hooks.some((group) => !group.matcher || group.matcher === '*' || /Bash/.test(group.matcher));
  const fileHook = hooks.some((group) => !group.matcher || group.matcher === '*' || /Read/.test(group.matcher));
  const deny = settings.flatMap((s) => s.permissions?.deny ?? []);
  const allow = settings.flatMap((s) => s.permissions?.allow ?? []);
  const hooksOff = settings.some((s) => s.disableAllHooks === true);

  // 1. Shell commands
  if (hooksOff) add('fail', 'Hooks are switched off', 'disableAllHooks is set, so no check runs before a command.');
  else if (shellHook) add('ok', 'A hook checks shell commands before they run', '');
  else add('fail', 'Nothing checks a shell command before it runs', 'A database reset, a force-push or `curl | sh` goes through if the agent decides to run it, or if you approve it in a hurry.');

  // 2. Blanket approvals
  const blanket = allow.filter((rule) => /^Bash(\((\*|:\*)\))?$/.test(rule));
  const mode = settings.map((s) => s.permissions?.defaultMode).find((m) => m === 'bypassPermissions' || m === 'dontAsk');
  if (blanket.length) add('fail', 'Every shell command is pre-approved', `permissions.allow contains ${blanket.join(', ')}.`);
  else if (mode) add('fail', `The default permission mode is ${mode}`, 'The agent is not asking before it acts.');
  else add('ok', 'Shell commands are not blanket-approved', '');

  // 3. Secrets
  const secrets = secretFiles(root);
  const inRepo = git(root, 'rev-parse', '--is-inside-work-tree').status === 0;
  if (!secrets.length) add('ok', 'No secrets files found in this folder', '');
  else {
    const shown = `${secrets.slice(0, 4).join(', ')}${secrets.length > 4 ? ` and ${secrets.length - 4} more` : ''}`;
    const covered = fileHook || deny.some((rule) => /^Read\((\*\*\/)?\.env/.test(rule));
    if (covered) add('ok', 'The agent is told not to read your secrets files', shown);
    else add('fail', `The agent can read ${count(secrets.length, 'secrets file', 'secrets files')}`, `${shown}. Their contents would land in the conversation.`);

    if (inRepo) {
      const tracked = secrets.filter((file) => git(root, 'ls-files', '--error-unmatch', file).status === 0);
      const exposed = secrets.filter((file) => !tracked.includes(file) && git(root, 'check-ignore', '-q', file).status !== 0);
      if (tracked.length) add('fail', `${count(tracked.length, 'secrets file is', 'secrets files are')} committed to git`, `${tracked.slice(0, 4).join(', ')}. Rotate those keys, then remove the files from history.`);
      else if (exposed.length) add('fail', `${count(exposed.length, 'secrets file is', 'secrets files are')} not in .gitignore`, `${exposed.slice(0, 4).join(', ')}. One \`git add -A\` would commit them.`);
      else add('ok', 'Secrets files are ignored by git', '');
    }
  }

  // 4. Keys pasted into agent config
  const leaky = ['.mcp.json', '.claude/settings.json', '.claude/settings.local.json', '.cursor/mcp.json'].filter((file) => {
    try {
      return KEY_IN_CONFIG.test(fs.readFileSync(path.join(root, file), 'utf8'));
    } catch {
      return false;
    }
  });
  if (leaky.length) add('fail', 'An API key is written into an agent config file', `${leaky.join(', ')}. Move it to an environment variable.`);

  // 5. The harness itself can be edited
  if (shellHook && !deny.some((rule) => /^Edit\(.*\.claude\/(settings|hooks)/.test(rule))) {
    add('warn', 'The agent can edit its own hooks and settings', 'No deny rule protects .claude/settings.json or .claude/hooks.');
  }

  // 6. Instructions
  const rules = ['AGENTS.md', 'CLAUDE.md', '.claude/CLAUDE.md'].filter((file) => fs.existsSync(path.join(root, file)));
  if (rules.length) add('ok', `The agent has project rules (${rules.join(', ')})`, '');
  else add('warn', 'No AGENTS.md or CLAUDE.md', 'The agent starts every session without knowing how this project wants work done.');

  return findings;
}
