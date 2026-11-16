import type { FrameLine } from "@/lib/landing";

const CHIP = { deny: ["chip-deny", "Blocked"], ask: ["chip-ask", "Asks you"], allow: ["chip-allow", "Runs"] } as const;

/**
 * The product's own interface as live text: a terminal or a Claude Code session.
 * A panel with an 8px gap around a black well, so the inner radius is the outer one minus the gap.
 */
export function Terminal({ window, lines, className = "" }: { window: string; lines: FrameLine[]; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel p-2 ${className}`}>
      <p className="caption-4 px-2 pb-2 pt-1 text-muted">{window}</p>
      <ol className="caption-2 flex flex-col gap-2 rounded-lg bg-well p-4 font-mono">
        {lines.map((line, i) => (
          <li key={i} className="flex min-w-0 items-baseline gap-2">
            <Line line={line} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Line({ line }: { line: FrameLine }) {
  const text = <span className="min-w-0 [overflow-wrap:anywhere]">{line.text}</span>;
  if (line.kind === "command") {
    return (
      <>
        <span aria-hidden="true" className="select-none text-muted">
          $
        </span>
        <span className="min-w-0 flex-1 text-fg [overflow-wrap:anywhere]">{line.text}</span>
        {line.decision ? <span className={`chip ${CHIP[line.decision][0]} font-sans`}>{CHIP[line.decision][1]}</span> : null}
      </>
    );
  }
  if (line.kind === "prompt") {
    return (
      <>
        <span aria-hidden="true" className="select-none text-signal">
          &gt;
        </span>
        <span className="min-w-0 text-fg [overflow-wrap:anywhere]">{line.text}</span>
      </>
    );
  }
  if (line.kind === "new") {
    return (
      <>
        <span className="shrink-0 text-go">+ new</span>
        {text}
      </>
    );
  }
  if (line.kind === "ok") {
    return (
      <>
        <span className="shrink-0 text-go">ok</span>
        <span className="min-w-0 whitespace-pre-wrap text-muted [overflow-wrap:anywhere]">{line.text}</span>
      </>
    );
  }
  if (line.kind === "result") return <span className="min-w-0 text-go [overflow-wrap:anywhere]">{line.text}</span>;
  return <span className="min-w-0 text-muted [overflow-wrap:anywhere]">{line.text}</span>;
}
