"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

type Props = {
  command: string;
  /** What the command is pasted into, read out to screen readers: "terminal", "Claude Code". */
  where?: string;
  className?: string;
};

/** A command with a copy button. Setup is paste, paste, paste, so this is the product's main control. */
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
    <div className={`flex min-w-0 items-center gap-1 rounded-xl border border-line bg-well p-1 ${className}`}>
      <code className="caption-2 min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-3 py-2 text-fg [scrollbar-width:none]">
        <span aria-hidden="true" className="select-none text-muted">
          {where === "terminal" ? "$ " : "> "}
        </span>
        {command}
      </code>
      <button type="button" onClick={copy} aria-label={`Copy the command to paste in your ${where}`} className="btn btn-secondary btn-sm shrink-0 rounded-lg">
        {state === "copied" ? <CheckIcon aria-hidden="true" weight="bold" className="h-4 w-4 text-go" /> : <CopyIcon aria-hidden="true" weight="bold" className="h-4 w-4" />}
        <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select it" : "Copy"}</span>
      </button>
    </div>
  );
}
