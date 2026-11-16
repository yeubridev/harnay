// Harnay guard: shell reader.
//
// Turns a command line into the simple commands it would run, so rules can look
// at `rm` and its arguments instead of grepping a string. It follows pipes,
// `&&` chains, `$(...)`, backticks, `bash -c "..."`, `eval`, `ssh host "..."`,
// heredocs fed to a shell and `find -exec`, and it strips wrappers such as
// `sudo`, `env`, `xargs`, `npx` and `uv run`.
//
// It is a reader, not a shell: it never executes anything and never throws on
// odd input. No dependencies.

import path from 'node:path';

/** Placeholder left in a word where a `$(...)` or backtick substitution was. */
export const SUB = '\u0001';

const OPS = ['&>>', '<<<', '<<-', '&&', '||', '|&', ';;', '<<', '>>', '&>', '>&', '<&', '>|', '|', ';', '&', '\n', '(', ')', '<', '>'];
const REDIRECTS = new Set(['<', '>', '>>', '&>', '&>>', '>&', '<&', '>|', '<<<']);
const RESERVED = new Set(['if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'while', 'until', 'esac', '!', '{', '}']);

export const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'ash']);
export const INTERPRETERS = new Set(['node', 'deno', 'bun', 'python', 'ruby', 'perl', 'php', 'pwsh', 'powershell', 'osascript', 'lua']);

export function tokenize(src) {
  const tokens = [];
  const heredocs = [];
  const n = src.length;
  let i = 0;
  let word = null;

  const add = (text, flags) => {
    word ??= { t: 'w', v: '', dyn: false, quoted: false, subs: [] };
    word.v += text;
    if (flags?.dyn) word.dyn = true;
    if (flags?.quoted) word.quoted = true;
  };
  const flush = () => {
    if (word) tokens.push(word);
    word = null;
  };

  // Index just past the parenthesis that closes the one opened before `from`.
  const closeParen = (from) => {
    let depth = 1;
    let quote = null;
    let j = from;
    for (; j < n && depth > 0; j++) {
      const ch = src[j];
      if (quote) {
        if (ch === '\\' && quote === '"') j++;
        else if (ch === quote) quote = null;
      } else if (ch === '\\') j++;
      else if (ch === "'" || ch === '"') quote = ch;
      else if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }
    return { end: j, closed: depth === 0 };
  };

  // `$(...)`, `<(...)` and `>(...)`: src[i + 1] is the opening parenthesis.
  const substitution = () => {
    const { end, closed } = closeParen(i + 2);
    const inner = src.slice(i + 2, closed ? end - 1 : end);
    add(SUB, { dyn: true });
    if (!inner.startsWith('(')) word.subs.push(inner); // `$((1 + 2))` is arithmetic
    i = end;
  };
  const backtick = () => {
    let j = i + 1;
    while (j < n && src[j] !== '`') j += src[j] === '\\' ? 2 : 1;
    add(SUB, { dyn: true });
    word.subs.push(src.slice(i + 1, j).replace(/\\`/g, '`'));
    i = j + 1;
  };

  while (i < n) {
    const ch = src[i];
    if (ch === '\\') {
      if (src[i + 1] === '\n') i += 2;
      else {
        add(src[i + 1] ?? '', { quoted: true });
        i += 2;
      }
      continue;
    }
    if (ch === "'" || (ch === '$' && src[i + 1] === "'")) {
      const open = ch === '$' ? i + 1 : i;
      const close = src.indexOf("'", open + 1);
      const end = close === -1 ? n : close;
      add(src.slice(open + 1, end), { quoted: true });
      i = end + 1;
      continue;
    }
    if (ch === '"') {
      add('', { quoted: true });
      i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < n && '"\\$`\n'.includes(src[i + 1])) {
          if (src[i + 1] !== '\n') add(src[i + 1]);
          i += 2;
        } else if (src[i] === '$' && src[i + 1] === '(') substitution();
        else if (src[i] === '`') backtick();
        else add(src[i++]);
      }
      i++;
      continue;
    }
    if ((ch === '$' || ch === '<' || ch === '>') && src[i + 1] === '(') {
      substitution();
      continue;
    }
    if (ch === '`') {
      backtick();
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      flush();
      i++;
      continue;
    }
    if (ch === '#' && !word) {
      const eol = src.indexOf('\n', i);
      i = eol === -1 ? n : eol;
      continue;
    }
    const op = OPS.find((candidate) => src.startsWith(candidate, i));
    if (!op) {
      add(src[i++]);
      continue;
    }
    // `2>` and `1>>`: a bare number glued to a redirect is a file descriptor.
    if (word && !word.quoted && /^\d+$/.test(word.v) && /^[<>]/.test(op)) word = null;
    flush();
    i += op.length;
    if (op === '<<' || op === '<<-') {
      while (src[i] === ' ' || src[i] === '\t') i++;
      let delimiter = '';
      while (i < n && !/[\s;|&<>()]/.test(src[i])) delimiter += src[i++];
      heredocs.push({ delimiter: delimiter.replace(/['"\\]/g, ''), strip: op === '<<-' });
      continue;
    }
    if (op === '\n') {
      while (heredocs.length) {
        const { delimiter, strip } = heredocs.shift();
        let body = '';
        while (i < n) {
          const eol = src.indexOf('\n', i);
          const line = src.slice(i, eol === -1 ? n : eol);
          i = eol === -1 ? n : eol + 1;
          if ((strip ? line.replace(/^\t+/, '') : line) === delimiter) break;
          body += `${line}\n`;
        }
        tokens.push({ t: 'hd', body });
      }
    }
    tokens.push({ t: 'op', v: op });
  }
  flush();
  return tokens;
}

function newCommand() {
  return { argv: [], words: [], redirects: [], heredoc: '', prev: null, next: null, subs: [], derived: [] };
}

/**
 * Parse a command line. Returns the top-level simple commands in order. Each has:
 *   name, args   the real program and its arguments once wrappers are stripped
 *   sudo         true when it runs through sudo or doas
 *   redirects    [{ op, target }]
 *   prev, next   neighbours in a pipeline
 *   subs         commands from `$(...)` and backticks inside its words
 *   derived      commands it hands to another shell (`bash -c`, `eval`, `ssh`, `find -exec`)
 */
export function parseShell(src, depth = 0) {
  if (typeof src !== 'string' || !src.trim() || depth > 4) return [];
  const commands = [];
  let cur = newCommand();
  let pipedFrom = null;
  const end = (isPipe) => {
    while (cur.argv.length && RESERVED.has(cur.argv[0]) && !cur.words[0].quoted) {
      cur.argv.shift();
      cur.words.shift();
    }
    if (cur.argv.length || cur.redirects.length) {
      if (pipedFrom) {
        pipedFrom.next = cur;
        cur.prev = pipedFrom;
      }
      commands.push(cur);
      pipedFrom = isPipe ? cur : null;
    } else if (!isPipe) pipedFrom = null;
    cur = newCommand();
  };

  const tokens = tokenize(src);
  for (let k = 0; k < tokens.length; k++) {
    const token = tokens[k];
    if (token.t === 'w') {
      cur.argv.push(token.v);
      cur.words.push(token);
    } else if (token.t === 'hd') {
      (cur.argv.length ? cur : (commands.at(-1) ?? cur)).heredoc += token.body;
    } else if (REDIRECTS.has(token.v)) {
      const target = tokens[k + 1];
      if (target?.t === 'w') {
        cur.redirects.push({ op: token.v, target: target.v, word: target });
        k++;
      }
    } else end(token.v === '|' || token.v === '|&');
  }
  end(false);

  for (const command of commands) finish(command, depth);
  return commands;
}

function fromArgv(argv, depth) {
  const command = newCommand();
  command.argv = argv;
  command.words = argv.map((v) => ({ t: 'w', v, dyn: v.includes(SUB), quoted: true, subs: [] }));
  finish(command, depth);
  return command;
}

function finish(command, depth) {
  Object.assign(command, unwrap(command.argv));
  const inner = [...command.words, ...command.redirects.map((r) => r.word)].flatMap((w) => w?.subs ?? []);
  command.subs = inner.flatMap((text) => parseShell(text, depth + 1));
  command.derived = derive(command, depth);
}

function derive(command, depth) {
  const sub = (text) => (text ? parseShell(text, depth + 1) : []);
  const { name, args } = command;
  if (SHELLS.has(name)) {
    const flag = args.findIndex((a) => /^-[a-z]*c$/.test(a));
    const hereString = command.redirects.filter((r) => r.op === '<<<').map((r) => r.target);
    return [...sub(flag === -1 ? '' : args[flag + 1]), ...sub(command.heredoc), ...hereString.flatMap(sub)];
  }
  if (name === 'eval') return sub(args.join(' '));
  if (name === 'ssh') {
    const rest = operands(args, ['-b', '-c', '-D', '-E', '-e', '-F', '-I', '-i', '-J', '-L', '-l', '-m', '-O', '-o', '-p', '-Q', '-R', '-S', '-W', '-w']);
    return rest.length > 1 ? sub(rest.slice(1).join(' ')) : [];
  }
  if (name === 'find') {
    const out = [];
    for (let i = 0; i < args.length; i++) {
      if (!['-exec', '-execdir', '-ok', '-okdir'].includes(args[i])) continue;
      let j = i + 1;
      while (j < args.length && args[j] !== ';' && args[j] !== '+') j++;
      if (j > i + 1 && depth < 4) out.push(fromArgv(args.slice(i + 1, j), depth + 1));
      i = j;
    }
    return out;
  }
  return [];
}

/** Program name without its folder, `.exe`, `@version` or a Python version suffix. */
export function base(arg) {
  if (!arg) return '';
  const name = path.posix
    .basename(arg.replace(/\\/g, '/'))
    .toLowerCase()
    .replace(/\.exe$/, '')
    .replace(/(?<=.)@[\w.^~-]+$/, '');
  if (/^python[\d.]*$/.test(name)) return 'python';
  if (name === 'nodejs') return 'node';
  return name;
}

const isAssignment = (arg) => /^[A-Za-z_][A-Za-z0-9_]*\+?=/.test(arg ?? '');

function skipFlags(argv, i, takesValue = []) {
  while (i < argv.length && argv[i].startsWith('-') && argv[i] !== '-') {
    if (argv[i] === '--') return i + 1;
    i += takesValue.includes(argv[i]) ? 2 : 1;
  }
  return i;
}
const flags = (takesValue) => (argv, i) => skipFlags(argv, i, takesValue);
const afterDashes = (argv, i) => {
  const at = argv.indexOf('--', i);
  return at === -1 ? argv.length : at + 1;
};

// Programs that run another program. Each entry returns the index where that
// other program starts.
const WRAPPERS = {
  sudo: flags(['-u', '-g', '-h', '-p', '-C', '-T', '-r', '-t', '-U']),
  doas: flags(['-u', '-C']),
  env: (argv, i) => {
    i = skipFlags(argv, i, ['-u', '-C']);
    while (isAssignment(argv[i])) i++;
    return i;
  },
  command: flags(),
  exec: flags(['-a']),
  builtin: flags(),
  nohup: flags(),
  time: flags(['-f', '-o']),
  setsid: flags(),
  caffeinate: flags(['-t', '-w']),
  stdbuf: flags(['-i', '-o', '-e']),
  nice: flags(['-n']),
  ionice: flags(['-c', '-n', '-p']),
  timeout: (argv, i) => skipFlags(argv, i, ['-k', '-s']) + 1,
  xargs: flags(['-I', '-n', '-P', '-d', '-L', '-s', '-E', '-a']),
  watch: flags(['-n']),
  npx: flags(['-p', '--package', '-c', '--call']),
  pnpx: flags(),
  bunx: flags(),
  uvx: flags(['--from', '--with', '-p', '--python']),
  dotenv: afterDashes,
  doppler: afterDashes,
  op: afterDashes,
  infisical: afterDashes,
};

// `pnpm exec prisma ...`, `uv run alembic ...`, `bundle exec rake ...`
const RUN_SUBCOMMANDS = {
  npm: ['exec', 'x'],
  pnpm: ['exec', 'dlx'],
  yarn: ['exec', 'dlx'],
  bun: ['x'],
  uv: ['run'],
  poetry: ['run'],
  pipenv: ['run'],
  pdm: ['run'],
  hatch: ['run'],
  rye: ['run'],
  bundle: ['exec'],
  mise: ['exec', 'x'],
};

export function unwrap(argv) {
  let i = 0;
  let sudo = false;
  for (let hops = 0; hops < 8; hops++) {
    while (isAssignment(argv[i])) i++;
    const name = base(argv[i]);
    let next = -1;
    if (WRAPPERS[name]) next = WRAPPERS[name](argv, i + 1);
    else if (RUN_SUBCOMMANDS[name]?.includes(argv[i + 1])) next = skipFlags(argv, i + 2);
    else if (name === 'python' && argv[i + 1] === '-m') next = i + 2;
    if (next === -1 || next >= argv.length) break; // nothing after the wrapper: it is the command
    if (name === 'sudo' || name === 'doas') sudo = true;
    i = next;
  }
  return { name: base(argv[i]), args: argv.slice(i + 1), sudo };
}

/** Arguments that are not flags. Everything after `--` counts. */
export function operands(args, takesValue = []) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') return out.concat(args.slice(i + 1));
    if (arg.startsWith('-') && arg !== '-') {
      if (takesValue.includes(arg)) i++;
    } else out.push(arg);
  }
  return out;
}

/** True for `-r` and for clusters such as `-rf`. */
export const hasShort = (args, letter) => args.some((a) => /^-[A-Za-z]+$/.test(a) && a.includes(letter));
export const hasLong = (args, ...names) => args.some((a) => names.includes(a.split('=')[0]));

/** Arguments of `tool` whether it is called directly or as `pnpm tool`, `yarn tool`, `bun tool`. */
export function toolArgs(command, ...tools) {
  if (tools.includes(command.name)) return command.args;
  if (['pnpm', 'yarn', 'bun', 'npm'].includes(command.name) && tools.includes(base(command.args[0]))) return command.args.slice(1);
  return null;
}

/** `git -C dir -c x=y push ...` gives { sub: 'push', rest: [...] }. */
export function git(command) {
  if (command.name !== 'git') return null;
  const i = skipFlags(command.args, 0, ['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
  return command.args[i] ? { sub: command.args[i], rest: command.args.slice(i + 1) } : null;
}

/** Text of a command and of everything piped into it, for scanning SQL and request bodies. */
export function pipelineText(command) {
  const parts = [];
  for (let c = command; c; c = c.prev) parts.unshift(`${c.argv.join(' ')}\n${c.heredoc}`);
  return parts.join('\n');
}

/** Code passed inline to an interpreter: `python -c`, `node -e`, a heredoc on stdin. */
export function inlineCode(command) {
  if (!INTERPRETERS.has(command.name)) return '';
  const { args } = command;
  const at = args.findIndex((a) => /^(-e|-c|-p|-r|-pe|-E|--eval|--print|-Command|-command)$/.test(a) || (command.name === 'deno' && a === 'eval'));
  return `${at === -1 ? '' : (args[at + 1] ?? '')}\n${command.heredoc}`.trim();
}
