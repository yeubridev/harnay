import { describe, expect, it } from "vitest";
import { catalog, commandFor, needsLicense, parseConfig, queryFor } from "@/lib/harness/catalog";

const ok = (input: Parameters<typeof parseConfig>[0]) => {
  const result = parseConfig(input);
  if ("error" in result) throw new Error(result.error);
  return result.config;
};

describe("parseConfig", () => {
  it("falls back to the free default: any project, Claude Code, guard", () => {
    expect(ok({})).toEqual({ stack: "universal", agents: ["claude"], packs: ["guard"] });
  });

  it("always includes the guard pack", () => {
    expect(ok({ packs: "design" }).packs).toEqual(["guard", "design"]);
  });

  it("orders agents and packs like the catalog whatever order they arrive in", () => {
    const config = ok({ agents: "codex, claude", packs: "ship,quality" });
    expect(config.agents).toEqual(["claude", "codex"]);
    expect(config.packs).toEqual(["guard", "quality", "ship"]);
  });

  it("rejects values that are not in the catalog", () => {
    expect(parseConfig({ stack: "../../etc/passwd" })).toHaveProperty("error");
    expect(parseConfig({ agents: "claude,skynet" })).toHaveProperty("error");
    expect(parseConfig({ packs: "guard,<script>" })).toHaveProperty("error");
  });

  it("does not echo more than 40 characters of a rejected value", () => {
    const result = parseConfig({ stack: "x".repeat(500) });
    expect("error" in result && result.error.length).toBeLessThan(200);
  });
});

describe("commandFor", () => {
  it("is the bare command for the free default", () => {
    expect(commandFor(ok({}))).toBe("npx harnay@latest init");
  });

  it("spells out stack, agents and packs so the user can read what they run", () => {
    expect(commandFor(ok({ stack: "next-supabase", agents: "claude,cursor", packs: "quality,design" }))).toBe(
      "npx harnay@latest init next-supabase --agents claude,cursor --packs quality,design",
    );
  });

  it("round-trips through the query string the API reads", () => {
    const config = ok({ stack: "fastapi", agents: "codex", packs: "ship" });
    const params = new URLSearchParams(queryFor(config));
    expect(ok({ stack: params.get("stack"), agents: params.get("agents"), packs: params.get("packs") })).toEqual(config);
  });
});

describe("needsLicense", () => {
  it("is false for the default and true as soon as a paid stack or pack is chosen", () => {
    expect(needsLicense(ok({}))).toBe(false);
    expect(needsLicense(ok({ stack: "expo" }))).toBe(true);
    expect(needsLicense(ok({ packs: "quality" }))).toBe(true);
  });

  it("keeps exactly one free stack and one free pack in the catalog", () => {
    expect(catalog.stacks.filter((s) => !s.pro).map((s) => s.id)).toEqual(["universal"]);
    expect(catalog.packs.filter((p) => !p.pro).map((p) => p.id)).toEqual(["guard"]);
  });
});
