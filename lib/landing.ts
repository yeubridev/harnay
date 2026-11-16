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

const body = (markdown: string) => markdown.replace(/^---\n[\s\S]*?\n---\n+/, "");
const lines = (text: string, from: number, count: number) => text.split("\n").slice(from, from + count);
const clip = (line: string) => (line.length > 132 ? `${line.slice(0, 129)}...` : line);

/** What `init` writes for the full harness, grouped the way the landing page explains it. */
export function layers() {
  const files = generate(fullConfig);
  const get = (path: string) => files.find((f) => f.path === path)!.content;
  const count = (prefix: string) => files.filter((f) => f.path.startsWith(prefix)).length;

  const agentsMd = get("AGENTS.md").split("\n");
  const howAt = agentsMd.findIndex((l) => l.startsWith("## How to work"));
  const denied = JSON.parse(get(".claude/settings.json")).permissions.deny as string[];
  const sample = guard.sampleRule;

  return {
    tree: [
      { label: "AGENTS.md", layer: "rules", depth: 0 },
      { label: "CLAUDE.md", layer: "rules", depth: 0 },
      { label: "PROJECT.md", layer: "brief", depth: 0, note: "yours" },
      { label: "DESIGN.md", layer: "brief", depth: 0, note: "yours" },
      { label: ".claude/", layer: null, depth: 0 },
      { label: "settings.json", layer: "permissions", depth: 1 },
      { label: "hooks/", layer: "guard", depth: 1, note: `${count(".claude/hooks/")} files` },
      { label: "skills/", layer: "skills", depth: 1, note: `${count(".claude/skills/")} skills` },
      { label: "agents/", layer: "skills", depth: 1, note: `${count(".claude/agents/")} reviewers` },
      { label: "harnay.json", layer: "guard", depth: 0, note: "manifest" },
    ],
    steps: [
      {
        id: "rules",
        title: "Rules every agent reads",
        text: "Six working rules, five boundaries and the conventions of your stack, in one short file. Claude Code, Cursor and Codex all read it.",
        file: "AGENTS.md",
        excerpt: agentsMd.slice(howAt, howAt + 6).map(clip),
        pro: false,
      },
      {
        id: "brief",
        title: "Your brief",
        text: "The one file that is yours. Type /project-brief and the agent interviews you, one question at a time, then writes it. Sync never touches it.",
        file: "PROJECT.md",
        excerpt: lines(get("PROJECT.md").replace(/<!--[\s\S]*?-->\n+/, ""), 0, 11),
        pro: false,
      },
      {
        id: "permissions",
        title: "Permissions",
        text: "Deny rules for .env files, private keys and the harness itself. Claude Code applies deny rules in every permission mode, bypass included.",
        file: ".claude/settings.json",
        excerpt: ['"deny": [', ...denied.slice(0, 4).map((r) => `  "${r}",`), `  ... ${denied.length - 6} more`, ...denied.slice(-2).map((r) => `  "${r}",`), "]"],
        pro: false,
      },
      {
        id: "guard",
        title: "The guard",
        text: `A hook that runs before every command and file access. It parses the command line, so git -C . push --force and bash -c "..." are read for what they do. ${guard.stats.rules} rules, ${guard.stats.examples} examples.`,
        file: ".claude/hooks/guard-rules.mjs",
        excerpt: [`rule    ${sample.id}`, ...sample.deny.map((e) => `block   ${e}`), ...sample.ask.map((e) => `ask     ${e}`), ...sample.allow.map((e) => `allow   ${e}`)],
        pro: false,
      },
      {
        id: "skills",
        title: "Skills and reviewers",
        text: "How the work gets done: test first, find the root cause, prove it before saying done, design from tokens, check security before merge. Three read-only reviewers check the result.",
        file: ".claude/skills/verify-before-done/SKILL.md",
        excerpt: lines(body(get(".claude/skills/verify-before-done/SKILL.md")), 6, 6).map(clip),
        pro: true,
      },
    ],
  };
}
