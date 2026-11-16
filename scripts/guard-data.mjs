// Writes lib/guard-data.json: everything the site says about the guard, computed
// by running the guard. The site imports the JSON, never the guard itself, so
// the hook code stays out of the server bundle. `npm run guard:data` refreshes
// it, `npm run build` does so automatically, and tests fail when it is stale.

import fs from 'node:fs';
import path from 'node:path';
import { checkShell, contentRules, fileRules, rawRules, selfTest, shellRules, TEST_CONTEXT } from '../harness/guard/guard-rules.mjs';

const text = (example) => (typeof example === 'string' ? example : example.cmd);

export function buildGuardData() {
  const result = selfTest();
  const commandRules = [...shellRules, ...rawRules];
  const pick = (id, kind, index) => ({ command: text(commandRules.find((r) => r.id === id)[kind][index]), decision: kind, rule: id });
  const row = (kind) => (rule) => ({ id: rule.id, title: rule.title, decision: rule.decision === 'ask' && !rule.deny?.length ? 'Asks you' : 'Blocks', kind });
  const reset = shellRules.find((r) => r.id === 'database-reset');

  return {
    stats: {
      rules: result.rules,
      examples: result.cases,
      failures: result.failures.length,
      commandRules: commandRules.length,
      fileRules: fileRules.length,
      contentRules: contentRules.length,
    },
    // The hero session: each command judged by the real rules.
    replay: ['npx prisma migrate reset --force', 'cat .env.production', 'git push --force origin main', 'vercel --prod', 'npm run test'].map((command) => {
      const verdict = checkShell(command, TEST_CONTEXT);
      return { command, decision: verdict?.decision ?? 'allow', rule: verdict?.rule ?? null, detail: verdict?.detail ?? null };
    }),
    rules: [...commandRules.map(row('Commands')), ...fileRules.map(row('Files')), ...contentRules.map(row('File contents'))],
    proof: [
      pick('git-force-push', 'deny', 3),
      pick('read-secret-file', 'deny', 22),
      pick('pipe-to-shell', 'deny', 0),
      pick('git-discard-work', 'ask', 0),
      pick('database-reset', 'allow', 0),
      pick('delete-outside-project', 'allow', 0),
    ],
    sampleRule: {
      id: reset.id,
      deny: reset.deny.slice(0, 3).map(text),
      ask: reset.ask.slice(0, 1).map(text),
      allow: reset.allow.slice(0, 2).map(text),
    },
  };
}

const target = path.join(import.meta.dirname, '../lib/guard-data.json');
export const serialize = (data) => `${JSON.stringify(data, null, 2)}\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const data = buildGuardData();
  if (data.stats.failures) {
    console.error(`guard self-test has ${data.stats.failures} failing example(s); refusing to publish numbers.`);
    process.exit(1);
  }
  fs.writeFileSync(target, serialize(data));
  console.log(`lib/guard-data.json: ${data.stats.rules} rules, ${data.stats.examples} examples`);
}
