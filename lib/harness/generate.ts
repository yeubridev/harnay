import "server-only";
import fs from "node:fs";
import path from "node:path";
import { catalog, packsOf, stackOf, type Config } from "./catalog";

export type HarnessFile = {
  path: string;
  content: string;
  /** "you": written once, never overwritten by sync. "harnay": replaced by sync while unmodified. */
  owner: "harnay" | "you";
  pro: boolean;
};

// The templates are read from disk on purpose (they are data, not modules). The ignore comment keeps
// the bundler from following them; next.config.ts ships the folder with outputFileTracingIncludes.
const ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "harness");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const GUARD_FILES = ["guard.mjs", "guard-rules.mjs", "guard-shell.mjs"];

const SECRET_DENY = [
  "Read(.env)",
  "Read(.env.local)",
  "Read(.env.*.local)",
  "Read(.env.development)",
  "Read(.env.production)",
  "Read(.env.staging)",
  "Read(.env.test)",
  "Read(**/secrets/**)",
  "Read(~/.ssh/id_*)",
  "Read(~/.aws/credentials)",
  "Read(~/.netrc)",
];

const HARNESS_DENY = [
  "Edit(/.claude/settings.json)",
  "Edit(/.claude/settings.local.json)",
  "Edit(/.claude/hooks/**)",
  "Edit(/harnay.json)",
];

function claudeSettings(config: Config): string {
  return json({
    $schema: "https://json.schemastore.org/claude-code-settings.json",
    permissions: {
      deny: [...SECRET_DENY, ...HARNESS_DENY],
      allow: stackOf(config).allow,
    },
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash|PowerShell|Read|Edit|Write|NotebookEdit|Grep|Glob",
          hooks: [
            {
              type: "command",
              command: "node",
              args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.mjs"],
              timeout: 10,
              // Without this a missing or crashing guard would let every call through.
              onFailure: "block",
            },
          ],
        },
      ],
    },
  });
}

function cursorHooks(): string {
  const command = "node .cursor/hooks/guard.mjs";
  return json({
    version: 1,
    hooks: {
      beforeShellExecution: [{ command, failClosed: true }],
      beforeReadFile: [{ command }],
      preToolUse: [{ command }],
    },
  });
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function commandLines(commands: Record<string, string>): string {
  const entries = Object.entries(commands);
  if (!entries.length) return "Not recorded yet. Find them in the repo and add them to PROJECT.md.";
  return entries.map(([name, cmd]) => `- ${name}: \`${cmd}\``).join("\n");
}

/** Where each agent looks for skills. Cursor also reads `.claude/skills`, so it needs its own copy only when alone. */
function skillRoots(config: Config): string[] {
  const roots: string[] = [];
  if (config.agents.includes("claude")) roots.push(".claude/skills");
  if (config.agents.includes("codex") || !config.agents.includes("claude")) roots.push(".agents/skills");
  return roots;
}

export function generate(config: Config): HarnessFile[] {
  const stack = stackOf(config);
  const packs = packsOf(config);
  const files: HarnessFile[] = [];
  const add = (file: HarnessFile) => files.push(file);

  const sections = [
    { text: read(`rules/${stack.id}.md`), pro: stack.pro },
    ...packs.filter((p) => fs.existsSync(path.join(ROOT, "rules", `${p.id}.md`))).map((p) => ({ text: read(`rules/${p.id}.md`), pro: p.pro })),
  ];

  add({
    path: "AGENTS.md",
    owner: "harnay",
    pro: sections.some((s) => s.pro),
    content: read("base/AGENTS.md")
      .replace("{{sections}}", sections.map((s) => s.text.trim()).join("\n\n"))
      .replace("{{commands}}", commandLines(stack.commands)),
  });

  const inline = Object.entries(stack.commands)
    .map(([name, cmd]) => `${name} \`${cmd}\``)
    .join(", ");
  add({
    path: "PROJECT.md",
    owner: "you",
    pro: false,
    content: read("base/PROJECT.md")
      .replace("{{stack}}", stack.id === "universal" ? "<framework, database, hosting>" : stack.title)
      .replace("{{commands}}", inline || "<dev, test, lint, type-check>"),
  });

  if (config.agents.includes("claude")) {
    add({ path: "CLAUDE.md", owner: "harnay", pro: false, content: read("base/CLAUDE.md") });
    add({ path: ".claude/settings.json", owner: "harnay", pro: false, content: claudeSettings(config) });
    for (const name of GUARD_FILES) add({ path: `.claude/hooks/${name}`, owner: "harnay", pro: false, content: read(`guard/${name}`) });
  }
  if (config.agents.includes("cursor")) {
    add({ path: ".cursor/hooks.json", owner: "harnay", pro: false, content: cursorHooks() });
    for (const name of GUARD_FILES) add({ path: `.cursor/hooks/${name}`, owner: "harnay", pro: false, content: read(`guard/${name}`) });
  }

  const skills = [
    ...packs.flatMap((p) => p.skills.map((name) => ({ name, pro: p.pro }))),
    ...stack.skills.map((name) => ({ name, pro: stack.pro })),
  ];
  for (const root of skillRoots(config)) {
    for (const skill of skills) {
      add({ path: `${root}/${skill.name}/SKILL.md`, owner: "harnay", pro: skill.pro, content: read(`skills/${skill.name}/SKILL.md`) });
    }
  }

  if (config.agents.includes("claude")) {
    for (const pack of packs) {
      for (const name of pack.agents) add({ path: `.claude/agents/${name}.md`, owner: "harnay", pro: pack.pro, content: read(`agents/${name}.md`) });
    }
  }

  for (const pack of packs) {
    for (const file of pack.files ?? []) add({ path: file.to, owner: file.owner, pro: pack.pro, content: read(file.from) });
  }

  return files;
}

export const harnessVersion = catalog.version;
