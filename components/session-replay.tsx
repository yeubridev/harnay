"use client";

import { useEffect, useRef, useState } from "react";
import type { ReplayLine } from "@/lib/landing";

const CHIP = { deny: ["chip-deny", "Blocked"], ask: ["chip-ask", "Asks you"], allow: ["chip-allow", "Runs"] } as const;

const FIRST_AT = 900;
const STEP = 1100;

/** The hero's live product: one agent session, each command judged by the rules the product ships. */
export function SessionReplay({ prompt, lines }: { prompt: string; lines: ReplayLine[] }) {
  // Changing the key remounts the list, which restarts the CSS animations.
  const [run, setRun] = useState(0);
  const frame = useRef<HTMLDivElement>(null);

  // Below the fold (phones), the replay would finish before anyone sees it: start it again on arrival.
  useEffect(() => {
    const el = frame.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (performance.now() > 1500) setRun((n) => n + 1);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} className="rounded-2xl border border-line bg-panel p-2">
      <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-1">
        <p className="caption-4 text-muted">Claude Code, guard on</p>
        <button type="button" onClick={() => setRun((n) => n + 1)} className="link-draw caption-4 cursor-pointer py-1 text-muted motion-reduce:hidden">
          Replay
        </button>
      </div>

      <ol key={run} className="flex flex-col gap-4 rounded-lg bg-well p-4">
        <li className="replay-line caption-2 flex gap-2 font-mono" style={{ "--at": 300 } as React.CSSProperties}>
          <span aria-hidden="true" className="select-none text-signal">
            &gt;
          </span>
          <span className="text-fg">{prompt}</span>
        </li>
        {lines.map((line, i) => {
          const [chip, label] = CHIP[line.decision];
          const at = FIRST_AT + i * STEP;
          return (
            <li key={line.command} className="flex flex-col gap-2">
              <code className="replay-line caption-2 flex min-w-0 gap-2" style={{ "--at": at } as React.CSSProperties}>
                <span aria-hidden="true" className="select-none text-muted">
                  $
                </span>
                <span className="min-w-0 text-fg [overflow-wrap:anywhere]">{line.command}</span>
              </code>
              <p className="replay-verdict flex flex-wrap items-baseline gap-x-2 gap-y-1" style={{ "--at": at + 420 } as React.CSSProperties}>
                <span className={`chip ${chip}`}>{label}</span>
                <span className="caption-2 text-muted">{line.detail ? sentence(line.detail) : "No rule matched, so it runs as usual."}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const sentence = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}.`.replace(/`/g, "");
