"use client";

import { useEffect, useRef, useState } from "react";
import type { ReplayLine } from "@/lib/landing";

const VERDICT = {
  deny: { label: "Blocked", className: "bg-stop text-chalk border-stop" },
  ask: { label: "Asks you", className: "bg-signal text-ink border-ink" },
  allow: { label: "Runs", className: "bg-transparent text-go border-go" },
} as const;

const FIRST_AT = 700;
const STEP = 1150;

/** The hero's live thing: one agent session, each command judged by the rules the product ships. */
export function SessionReplay({ prompt, lines }: { prompt: string; lines: ReplayLine[] }) {
  // Changing the key remounts the list, which restarts the CSS animations.
  const [run, setRun] = useState(0);
  const figure = useRef<HTMLElement>(null);

  // Below the fold (phones), the replay would finish before anyone sees it: start it again on arrival.
  useEffect(() => {
    const el = figure.current;
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
    <figure ref={figure} className="overflow-hidden rounded-panel bg-chalk-2">
      <div aria-hidden="true" className="strap h-2.5" />
      <figcaption className="flex items-center justify-between gap-3 px-4 pt-3 text-[0.9375rem] font-semibold sm:px-5">
        <span>Claude Code session, guard on</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="link -mr-2 cursor-pointer rounded-control px-2 py-2.5 font-medium decoration-ink/40 motion-reduce:hidden"
        >
          Replay
        </button>
      </figcaption>

      <ol key={run} className="flex flex-col gap-3.5 px-4 pb-5 pt-2 sm:px-5">
        <li className="replay-line flex gap-2 text-base" style={{ "--at": 150 } as React.CSSProperties}>
          <span aria-hidden="true" className="font-mono text-ink-2">
            &gt;
          </span>
          <span className="font-medium">{prompt}</span>
        </li>
        {lines.map((line, i) => {
          const verdict = VERDICT[line.decision];
          const at = FIRST_AT + i * STEP;
          return (
            <li key={line.command} className="flex flex-col gap-1.5">
              <code className="replay-line block overflow-x-auto whitespace-nowrap rounded-control bg-chalk px-3 py-2 text-[0.875rem] [scrollbar-width:none]" style={{ "--at": at } as React.CSSProperties}>
                <span className="mr-2 text-ink-2">Bash</span>
                {line.command}
              </code>
              <p className="replay-verdict flex flex-wrap items-baseline gap-x-2 gap-y-1 pl-1 text-[0.9375rem] leading-snug" style={{ "--at": at + 420 } as React.CSSProperties}>
                <span className={`rounded-[4px] border-2 px-1.5 py-px text-[0.8125rem] font-bold ${verdict.className}`}>{verdict.label}</span>
                {line.rule ? <code className="text-[0.8125rem] font-semibold">{line.rule}</code> : null}
                <span>{line.detail ? sentence(line.detail) : "No rule matched, so it runs as usual."}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

const sentence = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}.`.replace(/`/g, "");
