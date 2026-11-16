declare module "@/harness/guard/guard-rules.mjs" {
  type Verdict = { decision: "deny" | "ask"; rule: string; detail: string; reason: string } | null;
  type Rule = { id: string; title: string; decision?: "ask"; deny?: unknown[]; ask?: unknown[]; allow?: unknown[] };
  export const shellRules: Rule[];
  export const rawRules: Rule[];
  export const fileRules: Rule[];
  export const contentRules: Rule[];
  export const everyday: string[];
  export const TEST_CONTEXT: Record<string, unknown>;
  export function checkShell(command: string, context?: Record<string, unknown>): Verdict;
  export function checkFile(op: "read" | "write", file: string, context?: Record<string, unknown>): Verdict;
  export function checkContent(text: string): Verdict;
  export function evaluate(tool: string, toolInput?: Record<string, unknown>, context?: Record<string, unknown>): Verdict;
  export function selfTest(): { rules: number; cases: number; failures: { rule: string; example: string; want: string; got: string; by?: string }[] };
}
