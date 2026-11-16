import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { CliError, VERSION, fetchHarness, forgetKey, loadKey, saveKey } from './api.mjs';
import { audit } from './audit.mjs';
import { doctor } from './doctor.mjs';
import { apply, ensureGitignore, plan, readManifest, writeManifest } from './plan.mjs';

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = paint(1);
const dim = paint(2);
const green = paint(32);
const yellow = paint(33);
const red = paint(31);
const say = (line = '') => console.log(line);
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const HELP = `
${bold('harnay')}  put your coding agent in a harness

  npx harnay init [stack]     install a harness in this folder
      --agents claude,cursor,codex    which agents to set up (default: claude)
      --packs quality,design,ship     extra packs (Pro)
      --key <license>                 or HARNAY_KEY, or \`harnay login\`
      --dry-run                       show what would be written, write nothing
      --yes                           do not ask for confirmation

  npx harnay audit            what could an agent do in this folder right now? (read-only)
  npx harnay doctor           check that the harness is intact and the guard works
  npx harnay sync             update to the latest rules and skills
      --force                         also replace files you changed (a backup is kept)
  npx harnay login <key>      remember a license key on this machine
  npx harnay logout           forget it

  Stacks: universal (default), next-supabase, vite-supabase, fastapi, expo
  Pick yours and read every file first at https://harnay.dev/new
`;

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const booleans = new Set(['yes', 'y', 'force', 'dry-run', 'help', 'h', 'version', 'v']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      positional.push(arg);
      continue;
    }
    const [name, inline] = arg.replace(/^--?/, '').split(/=(.*)/s);
    if (booleans.has(name)) flags[name] = true;
    else if (inline !== undefined) flags[name] = inline;
    else flags[name] = argv[++i] ?? '';
  }
  return { flags, positional };
}

const LABEL = {
  create: green('+ new     '),
  update: green('~ update  '),
  same: dim('= current '),
  keep: dim('= yours   '),
  replace: yellow('! replace '),
  skip: yellow('- skipped '),
  remove: yellow('x remove  '),
};

function show(entries) {
  for (const entry of entries) say(`  ${LABEL[entry.action]} ${entry.path}`);
}

async function confirm(question, flags) {
  if (flags.yes || flags.y) return true;
  if (!process.stdin.isTTY) throw new CliError('Not running in a terminal. Add --yes to confirm, or --dry-run to only look.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} ${dim('[Y/n]')} `)).trim().toLowerCase();
  rl.close();
  return answer === '' || answer === 'y' || answer === 'yes';
}

function selfTest(root, config) {
  const dir = config.agents.includes('claude') ? '.claude/hooks' : config.agents.includes('cursor') ? '.cursor/hooks' : null;
  if (!dir) return null;
  const out = spawnSync(process.execPath, [path.join(root, dir, 'guard.mjs'), '--self-test', '--json'], { encoding: 'utf8', timeout: 20_000 });
  try {
    return JSON.parse(out.stdout);
  } catch {
    return { rules: 0, cases: 0, failures: [{ rule: 'guard did not run' }] };
  }
}

async function install(root, bundle, flags, mode) {
  const previous = readManifest(root);
  const entries = plan(root, bundle.files, previous, { mode, force: Boolean(flags.force) });
  const changes = entries.filter((e) => !['same', 'keep'].includes(e.action));

  say();
  show(entries);
  say();

  const replaced = entries.filter((e) => e.action === 'replace');
  if (replaced.length) say(`${yellow('!')} ${count(replaced.length, 'existing file', 'existing files')} will be replaced. Your version is copied to .harnay/backup/ first.`);
  const skipped = entries.filter((e) => e.action === 'skip');
  if (skipped.length) say(`${yellow('-')} ${count(skipped.length, 'file you changed is', 'files you changed are')} left alone. \`npx harnay sync --force\` replaces them and keeps a backup.`);

  if (flags['dry-run']) {
    say(dim('Dry run: nothing was written.'));
    return null;
  }
  if (!changes.length) {
    writeManifest(root, bundle, entries, previous);
    say(green('Already up to date.'));
    return entries;
  }
  if (!(await confirm(`Write ${count(changes.length, 'file', 'files')} to ${root}?`, flags))) {
    say('Nothing was written.');
    return null;
  }

  const backup = apply(root, entries);
  writeManifest(root, bundle, entries, previous);
  const ignored = ensureGitignore(root);
  if (backup) say(`Backup of replaced files: ${backup}`);
  if (ignored.length) say(`Added to .gitignore: ${ignored.join('  ')}`);
  return entries;
}

async function init(argv) {
  const { flags, positional } = parseArgs(argv);
  const root = path.resolve(flags.dir || process.cwd());
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new CliError(`${root} is not a folder.`);

  const config = {
    stack: positional[0] || 'universal',
    agents: (flags.agents || 'claude').split(',').filter(Boolean),
    packs: (flags.packs || '').split(',').filter(Boolean),
  };
  const bundle = await fetchHarness(config, loadKey(flags.key));
  say(`${bold('Harnay')} ${bundle.version}  ${bundle.config.stack}  ${bundle.config.agents.join(' + ')}  ${bundle.config.packs.join(' + ')}`);

  const entries = await install(root, bundle, flags, 'init');
  if (!entries) return 0;

  const test = selfTest(root, bundle.config);
  if (test) {
    if (test.failures.length) say(red(`Guard self-test failed (${test.failures[0].rule}). Run \`npx harnay doctor\`.`));
    else say(`${green('Guard is live:')} ${test.rules} rules, ${test.cases} examples replayed on this machine.`);
  }

  const claude = bundle.config.agents.includes('claude');
  say();
  say(bold('Next'));
  say(`  1. Open your agent in this folder${claude ? `:   ${bold('claude')}` : '.'}`);
  say(`  2. ${claude ? 'Type' : 'Paste'} this as your first message:   ${bold(claude ? '/project-brief' : 'Use the project-brief skill to fill in PROJECT.md.')}`);
  say('     It asks a few questions and writes PROJECT.md, the one file that is yours.');
  say(`  3. Commit the harness:   ${bold('git add -A && git commit -m "Add Harnay harness"')}`);
  say();
  say(dim('Check it any time with `npx harnay doctor`.'));
  return 0;
}

async function sync(argv) {
  const { flags } = parseArgs(argv);
  const root = path.resolve(flags.dir || process.cwd());
  const manifest = readManifest(root);
  if (!manifest) throw new CliError('No harnay.json here. Run `npx harnay init` first.');
  const bundle = await fetchHarness({ stack: manifest.stack, agents: manifest.agents, packs: manifest.packs }, loadKey(flags.key));
  say(`${bold('Harnay')} ${manifest.version} -> ${bundle.version}`);
  const entries = await install(root, bundle, flags, 'sync');
  if (!entries) return 0;
  const test = selfTest(root, bundle.config);
  if (test?.failures.length) {
    say(red('Guard self-test failed after the update. Run `npx harnay doctor`.'));
    return 1;
  }
  return 0;
}

function runDoctor(argv) {
  const { flags } = parseArgs(argv);
  const checks = doctor(path.resolve(flags.dir || process.cwd()));
  const mark = { ok: green('ok  '), warn: yellow('warn'), fail: red('FAIL') };
  say();
  for (const check of checks) say(`  ${mark[check.level]}  ${check.name}${check.detail ? dim(`  ${check.detail}`) : ''}`);
  say();
  const failed = checks.filter((c) => c.level === 'fail').length;
  const warned = checks.filter((c) => c.level === 'warn').length;
  if (failed) say(red(`${count(failed, 'check', 'checks')} failed.`));
  else say(green(`Harness is intact.${warned ? ` ${count(warned, 'thing', 'things')} to look at.` : ''}`));
  return failed ? 1 : 0;
}

function runAudit(argv) {
  const { flags } = parseArgs(argv);
  const root = path.resolve(flags.dir || process.cwd());
  const findings = audit(root);
  const mark = { ok: green('ok  '), warn: yellow('warn'), fail: red('OPEN') };
  say();
  say(`${bold('Harnay audit')}  ${root}`);
  say();
  for (const finding of findings) {
    say(`  ${mark[finding.level]}  ${finding.title}`);
    if (finding.detail && finding.level !== 'ok') say(dim(`        ${finding.detail}`));
  }
  say();
  const open = findings.filter((f) => f.level === 'fail').length;
  if (open) {
    say(red(`${count(open, 'thing is', 'things are')} open to your agent.`));
    say(`Close them with one command:  ${bold('npx harnay@latest init')}`);
  } else say(green('Nothing obvious is open. `npx harnay doctor` checks an installed harness in depth.'));
  // Exit 0 either way: an audit reports, it does not gate. Use `doctor` in CI.
  return 0;
}

export async function main(argv) {
  const [command, ...rest] = argv;
  const { flags, positional } = parseArgs(rest);
  if (command === '--version' || command === '-v') return say(VERSION), 0;
  if (!command || command === 'help' || command === '--help' || command === '-h' || flags.help || flags.h) return say(HELP), 0;
  if (command === 'init') return init(rest);
  if (command === 'sync') return sync(rest);
  if (command === 'doctor') return runDoctor(rest);
  if (command === 'audit') return runAudit(rest);
  if (command === 'login') {
    if (!positional[0]) throw new CliError('Usage: npx harnay login <license key>');
    say(`License key saved to ${saveKey(positional[0])}`);
    return 0;
  }
  if (command === 'logout') return forgetKey(), say('License key removed from this machine.'), 0;
  throw new CliError(`Unknown command "${command}". Try \`npx harnay help\`.`);
}
