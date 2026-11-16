"use client";

import { useEffect, useRef, useState } from "react";

type Step = { id: string; title: string; text: string; file: string; excerpt: string[]; pro: boolean };
type TreeRow = { label: string; layer: string | null; depth: number; note?: string };

function Excerpt({ step }: { step: Step }) {
  return (
    <div className="rounded-panel bg-chalk p-4">
      <p className="mb-2 font-mono text-[0.8125rem] font-semibold">{step.file}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed">{step.excerpt.join("\n")}</pre>
    </div>
  );
}

/**
 * The page's one authored scroll moment: as you read down the five layers, the
 * strap fills and the file tree on the right lights up the files each layer adds.
 */
export function Layers({ steps, tree }: { steps: Step[]; tree: TreeRow[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const strap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = list.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight * 0.5;
      const box = root.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (middle - box.top) / box.height));
      strap.current?.style.setProperty("--fill", String(progress));
      let current = 0;
      root.querySelectorAll<HTMLElement>("[data-step]").forEach((el, i) => {
        if (el.getBoundingClientRect().top <= middle) current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const current = steps[active];

  return (
    <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="relative pl-9 md:pl-12">
        {/* The strap. Empty track underneath, hazard webbing drawn over it as you scroll. */}
        <div ref={strap} aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-3 overflow-hidden rounded-full bg-chalk-3 md:w-4">
          <div className="strap h-full w-full origin-top [transform:scaleY(var(--fill,1))] motion-reduce:[transform:none]" />
        </div>

        <ol ref={list} className="flex flex-col">
          {steps.map((step, i) => (
            <li key={step.id} data-step className="flex flex-col justify-center gap-4 py-10 lg:min-h-[44vh] lg:py-0">
              <h3 className={`display text-[2rem] transition-opacity duration-300 md:text-[2.5rem] ${i === active ? "" : "lg:opacity-40"}`}>
                {step.title}
                {step.pro ? <span className="ml-3 inline-block rounded-[4px] border-2 border-ink px-1.5 align-middle font-sans text-sm font-bold [font-stretch:100%]">Pro</span> : null}
              </h3>
              <p className={`max-w-[34rem] transition-opacity duration-300 ${i === active ? "" : "lg:opacity-40"}`}>{step.text}</p>
              <div className="lg:hidden">
                <Excerpt step={step} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-[12vh] flex flex-col gap-3 rounded-panel bg-chalk-2 p-3">
          <ul aria-label="Files the command writes" className="font-mono text-[0.875rem]">
            {tree.map((row) => {
              const on = row.layer === current.id;
              return (
                <li
                  key={row.label}
                  className={`flex items-baseline justify-between gap-3 rounded-[4px] px-2 py-1 transition-colors duration-200 ${on ? "bg-signal font-semibold" : ""}`}
                  style={{ paddingLeft: `${0.5 + row.depth * 1.25}rem` }}
                >
                  <span>{row.label}</span>
                  {row.note ? <span className="font-sans text-[0.8125rem] font-normal">{row.note}</span> : null}
                </li>
              );
            })}
          </ul>
          <Excerpt step={current} />
        </div>
      </div>
    </div>
  );
}
