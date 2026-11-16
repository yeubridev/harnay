"use client";

import { useRef, useState } from "react";

type Props = {
  command: string;
  /** What the command is pasted into, read out to screen readers: "terminal", "Claude Code". */
  where?: string;
  className?: string;
};

/** A command with a copy button. The whole point of the product is that setup is paste, paste, paste. */
export function CopyCommand({ command, where = "terminal", className = "" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className={`flex min-w-0 items-stretch rounded-control border-2 border-ink bg-chalk ${className}`}>
      <code className="min-w-0 flex-1 self-center overflow-x-auto whitespace-nowrap px-3 py-2.5 text-[0.9375rem] [scrollbar-width:none]">
        <span aria-hidden="true" className="select-none text-ink-2">
          {where === "terminal" ? "$ " : "> "}
        </span>
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy the command to paste in your ${where}`}
        className="min-w-[5.25rem] shrink-0 cursor-pointer rounded-r-[4px] border-l-2 border-ink bg-signal px-3 text-base font-bold transition-colors duration-150 active:bg-ink active:text-signal [@media(hover:hover)_and_(pointer:fine)]:hover:bg-ink [@media(hover:hover)_and_(pointer:fine)]:hover:text-signal"
      >
        <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select it" : "Copy"}</span>
      </button>
    </div>
  );
}
