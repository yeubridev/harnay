import "server-only";
import guard from "./guard-data.json";
import { catalog, type Config } from "./harness/catalog";
import { generate } from "./harness/generate";

// Everything the marketing pages say about the product is computed from the
// product itself. Guard facts come from lib/guard-data.json, which
// scripts/guard-data.mjs writes by running the guard; file excerpts come from
// the generator. The site cannot drift from what the command installs.

export type Decision = "deny" | "ask" | "allow";
export type ReplayLine = { command: string; decision: Decision; rule: string | null; detail: string | null };
export type RuleRow = { id: string; title: string; decision: "Blocks" | "Asks you"; kind: "Commands" | "Files" | "File contents" };

export const guardStats = () => guard.stats;
export const sessionReplay = () => guard.replay as ReplayLine[];
export const ruleReference = () => guard.rules as RuleRow[];
export const proofRows = () => guard.proof as { command: string; decision: Decision; rule: string }[];

export const fullConfig: Config = {
  stack: "next-supabase",
  agents: ["claude"],
  packs: catalog.packs.map((p) => p.id),
};

export type FrameLine = { kind: "command" | "prompt" | "agent" | "new" | "ok" | "plain" | "result"; text: string; decision?: Decision; rule?: string | null };
export type Step = { id: string; number: string; title: string; text: string; window: string; lines: FrameLine[] };

/** The four steps of setup, each with the terminal it plays. Outputs are the CLI's real ones. */
export function steps(): Step[] {
  const stats = guard.stats;
  const free = generate({ stack: "universal", agents: ["claude"], packs: ["guard"] });
  const managed = free.filter((f) => f.owner === "harnay").length;
  return [
    {
      id: "paste",
      number: "01",
      title: "Paste one command",
      text: "The installer lists every file it will write and waits for your yes. Anything it replaces is backed up first.",
      window: "Terminal",
      lines: [
        { kind: "command", text: "npx harnay@latest init" },
        ...free.map((f) => ({ kind: "new" as const, text: f.path })),
        { kind: "plain", text: `Write ${free.length} files to ~/my-app? [Y/n] y` },
        { kind: "result", text: `Guard is live: ${stats.rules} rules, ${stats.examples} examples replayed on this machine.` },
      ],
    },
    {
      id: "brief",
      number: "02",
      title: "Answer six questions",
      text: "Type /project-brief. The agent interviews you, one question at a time, and writes PROJECT.md, the one file that is yours.",
      window: "Claude Code",
      lines: [
        { kind: "prompt", text: "/project-brief" },
        { kind: "agent", text: "I read package.json and the routes. First question: what are we building, in one sentence?" },
        { kind: "prompt", text: "Online booking for independent dog groomers." },
        { kind: "agent", text: "Who is it for? Name a person and a situation." },
        { kind: "prompt", text: "A groomer with one van who loses bookings to phone tag." },
        { kind: "agent", text: "What must work for this version to count as done?" },
        { kind: "result", text: "Wrote PROJECT.md" },
      ],
    },
    {
      id: "guard",
      number: "03",
      title: "Let the guard check each call",
      text: "Before a command or a file access runs, the hook reads it. It blocks, asks you, or stays out of the way.",
      window: "Claude Code",
      lines: (guard.replay as ReplayLine[]).map((line) => ({ kind: "command" as const, text: line.command, decision: line.decision, rule: line.rule })),
    },
    {
      id: "proof",
      number: "04",
      title: "Replay the proof",
      text: "npx harnay doctor replays every rule example and fires a test call through the hook. It exits 1 on failure, so it works in CI.",
      window: "Terminal",
      lines: [
        { kind: "command", text: "npx harnay doctor" },
        { kind: "ok", text: `Harness installed  version ${catalog.version}` },
        { kind: "ok", text: `Managed files present  ${managed} files` },
        { kind: "ok", text: "Managed files unmodified" },
        { kind: "ok", text: "Guard registered with Claude Code  fails closed" },
        { kind: "ok", text: `Guard rules  ${stats.rules} rules, ${stats.examples} examples replayed` },
        { kind: "ok", text: "Guard blocks a force push to main" },
        { kind: "ok", text: "Secrets ignored by git" },
        { kind: "result", text: "Harness is intact." },
      ],
    },
  ];
}

/** The five layers the command writes, each with a short real excerpt. */
export function inside() {
  const files = generate(fullConfig);
  const get = (path: string) => files.find((f) => f.path === path)!.content;
  const names = (prefix: string) => files.filter((f) => f.path.startsWith(prefix)).map((f) => f.path.slice(prefix.length).split("/")[0].replace(/\.md$/, ""));
  const rules = get("AGENTS.md")
    .split("\n")
    .filter((l) => /^\d\. /.test(l))
    .slice(0, 3)
    .map((l) => l.replace(/^(\d\. [^.]+\.).*/, "$1"));
  const denied = JSON.parse(get(".claude/settings.json")).permissions.deny as string[];
  return {
    rules,
    denied: [...denied.slice(0, 3), ...denied.slice(-1)],
    deniedCount: denied.length,
    skills: names(".claude/skills/"),
    reviewers: names(".claude/agents/"),
    verdicts: (guard.replay as ReplayLine[]).slice(0, 4),
    brief: get("PROJECT.md")
      .split("\n")
      .filter((l) => l.startsWith("## "))
      .map((l) => l.slice(3)),
  };
}
