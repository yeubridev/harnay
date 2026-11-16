import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contentRules, evaluate, fileRules, rawRules, selfTest, shellRules, TEST_CONTEXT } from "@/harness/guard/guard-rules.mjs";

const hookPath = path.resolve(__dirname, "../harness/guard/guard.mjs");
const hook = (payload: unknown, env: Record<string, string> = {}) => {
  const out = spawnSync("node", [hookPath], { input: typeof payload === "string" ? payload : JSON.stringify(payload), encoding: "utf8", env: { ...process.env, ...env } });
  return { status: out.status, json: out.stdout ? JSON.parse(out.stdout) : null };
};

describe("guard rules", () => {
  it("behave as every example they carry says", () => {
    const result = selfTest();
    expect(result.failures).toEqual([]);
    expect(result.cases).toBeGreaterThan(700);
  });

  it("each carry at least one blocked and one allowed example", () => {
    for (const rule of [...shellRules, ...rawRules, ...fileRules, ...contentRules]) {
      expect((rule.deny?.length ?? 0) + (rule.ask?.length ?? 0), rule.id).toBeGreaterThan(0);
      expect(rule.allow?.length ?? 0, rule.id).toBeGreaterThan(0);
    }
  });

  it("have unique ids", () => {
    const ids = [...shellRules, ...rawRules, ...fileRules, ...contentRules].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("scripts the agent writes", () => {
  it("are read like commands: a script that wipes the home folder is refused", () => {
    const verdict = evaluate("Write", { file_path: "/work/app/cleanup.sh", content: "#!/bin/bash\nrm -rf ~\n" }, TEST_CONTEXT);
    expect(verdict).toMatchObject({ decision: "deny", rule: "delete-outside-project" });
  });

  it("are not held up for commands the user would only be asked about", () => {
    expect(evaluate("Write", { file_path: "/work/app/deploy.sh", content: "#!/bin/bash\nvercel --prod\n" }, TEST_CONTEXT)).toBeNull();
  });
});

describe("guard hook process", () => {
  const cwd = "/work/app";

  it("answers Claude Code with a deny decision and a reason", () => {
    const { status, json } = hook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npx prisma migrate reset" }, cwd });
    expect(status).toBe(0);
    expect(json.hookSpecificOutput).toMatchObject({ hookEventName: "PreToolUse", permissionDecision: "deny" });
    expect(json.hookSpecificOutput.permissionDecisionReason).toContain("database-reset");
  });

  it("stays silent, exit 0, when nothing matches", () => {
    expect(hook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm test" }, cwd })).toEqual({ status: 0, json: null });
  });

  it("resolves the project from CLAUDE_PROJECT_DIR, not from where the agent wandered", () => {
    const call = { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "rm -rf ../dist" }, cwd: "/work/app/src" };
    // Inside the project when the root is /work/app, outside it when the guard only knows the sub-folder.
    expect(hook(call, { CLAUDE_PROJECT_DIR: "/work/app" }).json).toBeNull();
    expect(hook(call, { CLAUDE_PROJECT_DIR: "" }).json.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("hands the call to the user instead of allowing it when its input is unreadable", () => {
    const { status, json } = hook("not json");
    expect(status).toBe(0);
    expect(json.hookSpecificOutput.permissionDecision).toBe("ask");
  });

  it("answers Cursor in Cursor's format", () => {
    expect(hook({ hook_event_name: "beforeShellExecution", command: "git push --force origin main", cwd, workspace_roots: [cwd] }).json).toMatchObject({ permission: "deny" });
    expect(hook({ hook_event_name: "beforeShellExecution", command: "npm test", cwd, workspace_roots: [cwd] }).json).toEqual({ permission: "allow" });
    expect(hook({ hook_event_name: "beforeReadFile", file_path: "/work/app/.env", workspace_roots: [cwd] }).json).toMatchObject({ permission: "deny" });
  });

  it("passes its own self-test from the command line", () => {
    const out = spawnSync("node", [hookPath, "--self-test"], { encoding: "utf8" });
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/^OK/);
  });
});
