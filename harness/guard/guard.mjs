#!/usr/bin/env node
// Harnay guard: the hook your coding agent calls before every tool use.
//
//   Claude Code   PreToolUse hook in .claude/settings.json
//   Cursor        beforeShellExecution, beforeReadFile and preToolUse in .cursor/hooks.json
//
// It reads the pending tool call on stdin, runs it through guard-rules.mjs and
// answers allow, ask or deny. It never runs the command and never calls a network.
//
//   node .claude/hooks/guard.mjs --self-test          replay every rule example
//   node .claude/hooks/guard.mjs --check "rm -rf ~"   see what the guard says about a command

import { spawnSync } from 'node:child_process';
import { evaluate, checkShell, selfTest, shellRules, rawRules, fileRules, contentRules } from './guard-rules.mjs';

const args = process.argv.slice(2);

if (args[0] === '--self-test') {
  const result = selfTest();
  if (args.includes('--json')) console.log(JSON.stringify(result));
  else {
    for (const f of result.failures) console.log(`FAIL ${f.rule}: wanted ${f.want}, got ${f.got}${f.by ? ` (from ${f.by})` : ''} for ${f.example}`);
    const groups = `${shellRules.length + rawRules.length} command rules, ${fileRules.length} file rules, ${contentRules.length} content rules`;
    console.log(`${result.failures.length ? 'FAILED' : 'OK'}  ${groups}  ${result.cases - result.failures.length}/${result.cases} examples behave as written`);
  }
  process.exit(result.failures.length ? 1 : 0);
}

if (args[0] === '--check') {
  const found = checkShell(args.slice(1).join(' '), context(process.cwd(), process.cwd()));
  console.log(found ? `${found.decision.toUpperCase()}  ${found.reason}` : 'ALLOW  no rule matched');
  process.exit(0);
}

function context(cwd, projectDir) {
  return {
    cwd,
    projectDir,
    branch: () => {
      const out = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, encoding: 'utf8', timeout: 1500 });
      return out.status === 0 ? out.stdout.trim() : null;
    },
  };
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

const CURSOR_EVENTS = new Set(['beforeShellExecution', 'beforeReadFile', 'preToolUse', 'beforeMCPExecution']);

function answer(event, found) {
  if (CURSOR_EVENTS.has(event)) {
    // Cursor only honours "ask" for shell commands; elsewhere an ask becomes allow.
    const permission = !found ? 'allow' : found.decision === 'ask' && event !== 'beforeShellExecution' ? 'allow' : found.decision;
    return permission === 'allow' ? { permission } : { permission, user_message: found.reason, agent_message: found.reason };
  }
  if (!found) return null;
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: found.decision, permissionDecisionReason: found.reason } };
}

let event = 'PreToolUse';
try {
  const call = JSON.parse(await readStdin());
  event = call.hook_event_name ?? event;
  const projectDir = process.env.CLAUDE_PROJECT_DIR || call.workspace_roots?.[0] || call.cwd || process.cwd();
  const ctx = context(call.cwd || projectDir, projectDir);
  let found;
  if (event === 'beforeShellExecution') found = evaluate('bash', { command: call.command }, ctx);
  else if (event === 'beforeReadFile') found = evaluate('read', { file_path: call.file_path }, ctx);
  else found = evaluate(call.tool_name, call.tool_input ?? {}, ctx);
  const out = answer(event, found);
  if (out) process.stdout.write(JSON.stringify(out));
} catch (error) {
  // A guard that crashes must not turn into a silent "yes": hand the call to the user.
  const reason = `Harnay guard could not read this tool call (${error?.message ?? error}). Confirm it yourself.`;
  process.stdout.write(JSON.stringify(answer(event, { decision: 'ask', reason }) ?? {}));
}
