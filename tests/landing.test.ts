import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildGuardData, serialize } from "../scripts/guard-data.mjs";
import { guardStats, layers, proofRows, ruleReference, sessionReplay } from "@/lib/landing";

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

  it("explains every layer with a non-empty excerpt of a file that is really generated", () => {
    const { steps, tree } = layers();
    expect(steps.map((s) => s.id)).toEqual(["rules", "brief", "permissions", "guard", "skills"]);
    for (const step of steps) expect(step.excerpt.filter(Boolean).length, step.id).toBeGreaterThan(2);
    expect(tree.find((row) => row.label === "skills/")?.note).toMatch(/^\d+ skills$/);
  });

  it("lists every rule once in the reference", () => {
    const rows = ruleReference();
    expect(rows.length).toBe(guardStats().rules);
    expect(rows.every((r) => r.title.length > 5)).toBe(true);
  });
});
