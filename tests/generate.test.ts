import { describe, expect, it } from "vitest";
import { catalog, type AgentId, type Config } from "@/lib/harness/catalog";
import { generate } from "@/lib/harness/generate";

const allPacks = catalog.packs.map((p) => p.id);
const paths = (config: Config) => generate(config).map((f) => f.path);
const file = (config: Config, path: string) => {
  const found = generate(config).find((f) => f.path === path);
  if (!found) throw new Error(`${path} was not generated`);
  return found;
};

const free: Config = { stack: "universal", agents: ["claude"], packs: ["guard"] };
const full: Config = { stack: "next-supabase", agents: ["claude", "cursor", "codex"], packs: allPacks };

describe("the free harness", () => {
  it("is exactly these files", () => {
    expect(paths(free).sort()).toEqual(
      [
        ".claude/hooks/guard-rules.mjs",
        ".claude/hooks/guard-shell.mjs",
        ".claude/hooks/guard.mjs",
        ".claude/settings.json",
        ".claude/skills/project-brief/SKILL.md",
        "AGENTS.md",
        "CLAUDE.md",
        "PROJECT.md",
      ].sort(),
    );
  });

  it("contains nothing that needs a licence", () => {
    expect(generate(free).filter((f) => f.pro)).toEqual([]);
  });

  it("leaves PROJECT.md to the user and manages everything else", () => {
    expect(generate(free).filter((f) => f.owner === "you").map((f) => f.path)).toEqual(["PROJECT.md"]);
  });
});

describe("Claude Code settings", () => {
  const settings = JSON.parse(file(free, ".claude/settings.json").content);
  const hook = settings.hooks.PreToolUse[0];

  it("runs the guard before every tool that can run a command or touch a file", () => {
    expect(hook.matcher.split("|")).toEqual(expect.arrayContaining(["Bash", "Read", "Edit", "Write", "NotebookEdit", "Grep", "Glob"]));
    expect(hook.hooks[0]).toMatchObject({ type: "command", command: "node", args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.mjs"] });
  });

  it("fails closed when the guard cannot start", () => {
    expect(hook.hooks[0].onFailure).toBe("block");
  });

  it("uses a matcher Claude Code reads as a list of exact tool names", () => {
    expect(hook.matcher).toMatch(/^[A-Za-z|]+$/);
  });

  it("denies reading secrets and editing the harness itself", () => {
    expect(settings.permissions.deny).toEqual(expect.arrayContaining(["Read(.env)", "Edit(/.claude/settings.json)", "Edit(/.claude/hooks/**)"]));
  });

  it("never blocks .env.example with a wildcard rule", () => {
    expect(settings.permissions.deny).not.toContain("Read(.env.*)");
    expect(settings.permissions.deny).not.toContain("Read(.env*)");
  });

  it("pre-approves only the stack's test, lint, type-check and build commands", () => {
    expect(settings.permissions.allow).toEqual([]);
    const next = JSON.parse(file({ ...free, stack: "next-supabase" }, ".claude/settings.json").content);
    expect(next.permissions.allow).toContain("Bash(npm run test)");
    expect(next.permissions.allow.every((rule: string) => /^Bash\((npm run (lint|typecheck|test|build)|npx (tsc|supabase))/.test(rule))).toBe(true);
  });
});

describe("AGENTS.md", () => {
  it("has no unfilled placeholder and stays under the 200 lines Claude Code recommends", () => {
    for (const stack of catalog.stacks) {
      const content = file({ ...full, stack: stack.id }, "AGENTS.md").content;
      expect(content).not.toMatch(/\{\{|\}\}/);
      expect(content.split("\n").length).toBeLessThan(200);
    }
  });

  it("carries the stack rules and one section per selected pack", () => {
    const content = file(full, "AGENTS.md").content;
    expect(content).toContain("## Stack: Next.js (App Router) + Supabase");
    for (const heading of ["## Quality", "## Design", "## Ship"]) expect(content).toContain(heading);
    expect(file(free, "AGENTS.md").content).not.toContain("## Quality");
  });

  it("is marked paid only when it carries paid rules", () => {
    expect(file(free, "AGENTS.md").pro).toBe(false);
    expect(file(full, "AGENTS.md").pro).toBe(true);
  });
});

describe("agents", () => {
  const only = (agents: AgentId[]): Config => ({ stack: "universal", agents, packs: ["guard", "quality"] });

  it("gives Cursor its own hook config and guard copy", () => {
    const generated = paths(only(["cursor"]));
    expect(generated).toEqual(expect.arrayContaining([".cursor/hooks.json", ".cursor/hooks/guard.mjs", ".agents/skills/test-first/SKILL.md"]));
    expect(generated.some((p) => p.startsWith(".claude/"))).toBe(false);
    expect(generated).not.toContain("CLAUDE.md");
  });

  it("gives Codex rules and skills but no hook files, because Codex cannot run one", () => {
    const generated = paths(only(["codex"]));
    expect(generated).toEqual(expect.arrayContaining(["AGENTS.md", ".agents/skills/test-first/SKILL.md"]));
    expect(generated.some((p) => p.includes("guard"))).toBe(false);
  });

  it("writes subagents for Claude Code only", () => {
    expect(paths(only(["claude"]))).toContain(".claude/agents/code-reviewer.md");
    expect(paths(only(["cursor", "codex"])).some((p) => p.includes("/agents/"))).toBe(false);
  });

  it("does not duplicate skills for Cursor when Claude Code is also selected", () => {
    expect(paths(only(["claude", "cursor"])).filter((p) => p.endsWith("test-first/SKILL.md"))).toEqual([".claude/skills/test-first/SKILL.md"]);
  });
});

describe("every combination in the catalog", () => {
  it("generates without a missing source file or a duplicate path", () => {
    for (const stack of catalog.stacks) {
      for (const agents of [["claude"], ["cursor"], ["codex"], ["claude", "cursor", "codex"]] as AgentId[][]) {
        const generated = paths({ stack: stack.id, agents, packs: allPacks });
        expect(new Set(generated).size).toBe(generated.length);
      }
    }
  });

  it("only writes to the locations the CLI accepts", () => {
    const allowed = /^(AGENTS\.md|CLAUDE\.md|PROJECT\.md|DESIGN\.md|\.claude\/(settings\.json|hooks\/[\w.-]+|skills\/[\w-]+\/SKILL\.md|agents\/[\w-]+\.md)|\.cursor\/(hooks\.json|hooks\/[\w.-]+)|\.agents\/skills\/[\w-]+\/SKILL\.md)$/;
    for (const path of paths(full)) expect(path).toMatch(allowed);
  });
});

describe("skills and subagents", () => {
  const generated = generate(full);

  it("have frontmatter with a name matching their folder and a description that says when to use them", () => {
    const skills = generated.filter((f) => f.path.startsWith(".claude/skills/"));
    expect(skills.length).toBeGreaterThanOrEqual(9);
    for (const skill of skills) {
      const folder = skill.path.split("/")[2];
      const frontmatter = skill.content.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
      expect(frontmatter).toContain(`name: ${folder}`);
      const description = frontmatter.match(/^description: (.+)$/m)?.[1] ?? "";
      expect(description).toMatch(/\bUse (when|before|after|at|for)\b/);
      expect(description.length).toBeLessThan(1536);
    }
  });

  it("gives every subagent a name, a description and read-only tools", () => {
    const agents = generated.filter((f) => f.path.startsWith(".claude/agents/"));
    expect(agents.map((a) => a.path).sort()).toEqual([".claude/agents/code-reviewer.md", ".claude/agents/design-critic.md", ".claude/agents/security-reviewer.md"]);
    for (const agent of agents) {
      const frontmatter = agent.content.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
      expect(frontmatter).toMatch(/^name: [\w-]+$/m);
      expect(frontmatter).toMatch(/^description: .+$/m);
      expect(frontmatter).toMatch(/^tools: Read, Grep, Glob, Bash$/m);
    }
  });

  it("marks paid content as paid and the brief skill as free", () => {
    expect(file(full, ".claude/skills/project-brief/SKILL.md").pro).toBe(false);
    expect(file(full, ".claude/skills/test-first/SKILL.md").pro).toBe(true);
    expect(file(full, ".claude/skills/supabase-changes/SKILL.md").pro).toBe(true);
    expect(file(full, "DESIGN.md")).toMatchObject({ pro: true, owner: "you" });
  });
});
