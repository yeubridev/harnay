import raw from "@/harness/catalog.json";

export type AgentId = "claude" | "cursor" | "codex";

export type Agent = { id: AgentId; title: string; enforcement: string };

export type Stack = {
  id: string;
  title: string;
  blurb: string;
  pro: boolean;
  skills: string[];
  allow: string[];
  commands: Record<string, string>;
};

export type Pack = {
  id: string;
  title: string;
  blurb: string;
  pro: boolean;
  required?: boolean;
  skills: string[];
  agents: string[];
  files?: { from: string; to: string; owner: "you" | "harnay" }[];
};

export type Catalog = { version: string; agents: Agent[]; stacks: Stack[]; packs: Pack[] };

export const catalog = raw as Catalog;

export type Config = { stack: string; agents: AgentId[]; packs: string[] };

export const defaultConfig: Config = { stack: "universal", agents: ["claude"], packs: ["guard"] };

const list = (value: string | null | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Validate untrusted input (query string, CLI flags) against the catalog. */
export function parseConfig(input: {
  stack?: string | null;
  agents?: string | null;
  packs?: string | null;
}): { config: Config } | { error: string } {
  const stack = input.stack?.trim() || defaultConfig.stack;
  if (!catalog.stacks.some((s) => s.id === stack)) {
    return { error: `Unknown stack "${stack.slice(0, 40)}". Available: ${catalog.stacks.map((s) => s.id).join(", ")}.` };
  }

  const agents = [...new Set(list(input.agents))];
  const unknownAgent = agents.find((id) => !catalog.agents.some((a) => a.id === id));
  if (unknownAgent) {
    return { error: `Unknown agent "${unknownAgent.slice(0, 40)}". Available: ${catalog.agents.map((a) => a.id).join(", ")}.` };
  }

  const packs = [...new Set(["guard", ...list(input.packs)])];
  const unknownPack = packs.find((id) => !catalog.packs.some((p) => p.id === id));
  if (unknownPack) {
    return { error: `Unknown pack "${unknownPack.slice(0, 40)}". Available: ${catalog.packs.map((p) => p.id).join(", ")}.` };
  }

  // Keep catalog order so the same choices always produce the same command and files.
  return {
    config: {
      stack,
      agents: catalog.agents.map((a) => a.id).filter((id) => (agents.length ? agents : defaultConfig.agents).includes(id)),
      packs: catalog.packs.map((p) => p.id).filter((id) => packs.includes(id)),
    },
  };
}

export const stackOf = (config: Config) => catalog.stacks.find((s) => s.id === config.stack)!;
export const packsOf = (config: Config) => catalog.packs.filter((p) => config.packs.includes(p.id));

/** True when the configuration includes anything that needs a license. */
export const needsLicense = (config: Config) => stackOf(config).pro || packsOf(config).some((p) => p.pro);

/** The one line a user pastes. Flags are readable on purpose: you can see what you run. */
export function commandFor(config: Config): string {
  const parts = ["npx harnay@latest init"];
  if (config.stack !== defaultConfig.stack) parts.push(config.stack);
  if (config.agents.join() !== defaultConfig.agents.join()) parts.push(`--agents ${config.agents.join(",")}`);
  const extra = config.packs.filter((id) => id !== "guard");
  if (extra.length) parts.push(`--packs ${extra.join(",")}`);
  return parts.join(" ");
}

export function queryFor(config: Config): string {
  return new URLSearchParams({ stack: config.stack, agents: config.agents.join(","), packs: config.packs.join(",") }).toString();
}
