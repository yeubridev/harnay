import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildGuardData, serialize } from "../scripts/guard-data.mjs";
import { guardStats, inside, proofRows, ruleReference, sessionReplay, steps } from "@/lib/landing";

describe("lib/guard-data.json", () => {
  it("is what the guard produces right now (run `npm run guard:data` if this fails)", () => {
    expect(fs.readFileSync("lib/guard-data.json", "utf8")).toBe(serialize(buildGuardData()));
  });
});

describe("what the landing page shows", () => {
  it("replays a session whose verdicts come from the real guard", () => {
    expect(sessionReplay().map((line) => [line.command, line.decision, line.rule])).toEqual([
      ["npx prisma migrate reset --force", "deny", "database-reset"],
      ["cat .env.production", "deny", "read-secret-file"],
      ["git push --force origin main", "deny", "git-force-push"],
      ["vercel --prod", "ask", "deploy"],
      ["npm run test", "allow", null],
    ]);
  });

  it("only quotes guard numbers when every example passes", () => {
    const stats = guardStats();
    expect(stats.failures).toBe(0);
    expect(stats.rules).toBe(stats.commandRules + stats.fileRules + stats.contentRules);
  });

  it("shows proof rows that still behave as labelled", () => {
    const rows = proofRows();
    expect(rows.map((r) => r.decision)).toEqual(["deny", "deny", "deny", "ask", "allow", "allow"]);
    expect(rows[0].command).toBe("git -C . push --force origin main");
    expect(rows[1].command).toContain(".env");
  });

  it("plays four setup steps whose terminals show what the CLI really prints", () => {
    const all = steps();
    expect(all.map((s) => s.number)).toEqual(["01", "02", "03", "04"]);
    const paste = all[0].lines.map((l) => l.text);
    expect(paste[0]).toBe("npx harnay@latest init");
    expect(paste).toContain(".claude/hooks/guard.mjs");
    expect(paste.at(-1)).toMatch(/^Guard is live: \d+ rules, \d+ examples replayed on this machine\.$/);
    expect(all[2].lines.map((l) => l.decision)).toEqual(["deny", "deny", "deny", "ask", "allow"]);
    expect(all[3].lines.at(-1)?.text).toBe("Harness is intact.");
  });

  it("describes the five layers from the files that are really generated", () => {
    const layers = inside();
    expect(layers.rules).toHaveLength(3);
    expect(layers.rules[0]).toMatch(/^1\. Understand first\.$/);
    expect(layers.denied).toContain("Read(.env)");
    expect(layers.skills).toHaveLength(9);
    expect(layers.reviewers).toEqual(["code-reviewer", "design-critic", "security-reviewer"]);
  });

  it("lists every rule once in the reference", () => {
    const rows = ruleReference();
    expect(rows.length).toBe(guardStats().rules);
    expect(rows.every((r) => r.title.length > 5)).toBe(true);
  });
});
