"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@/components/terminal";
import type { Step } from "@/lib/landing";

/**
 * How it works, as pinned chapters: on a desktop the section holds the screen for
 * four screens of scroll while the steps advance and the terminal on the right
 * plays each one. Phones, reduced motion and pages without script get the same
 * four steps stacked, each with its terminal.
 */
export function Steps({ heading, steps }: { heading: string; steps: Step[] }) {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      if (travel <= 0) return;
      const progress = Math.min(0.999, Math.max(0, -box.top / travel));
      setActive(Math.floor(progress * steps.length));
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
  }, [steps.length]);

  function go(index: number) {
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (index / steps.length) * travel + 8, behavior: "smooth" });
  }

  return (
    <section id="how" ref={section} className="steps relative">
      <div className="steps-pinned sticky top-0 h-svh items-center">
        <div className="wrap grid grid-cols-2 items-center gap-16">
          <div className="flex flex-col gap-10">
            <h2 className="heading-2">{heading}</h2>
            <ol className="flex flex-col gap-2">
              {steps.map((step, i) => {
                const on = i === active;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={on ? "step" : undefined}
                      className="group flex w-full cursor-pointer gap-4 rounded-xl p-3 text-left transition-colors duration-300 ease-base hover:bg-panel"
                    >
                      <span className={`chip mt-1 self-start font-mono transition-colors duration-300 ease-base ${on ? "chip-ask" : "chip-plain"}`}>{step.number}</span>
                      <span className="flex min-w-0 flex-col gap-2">
                        <span className={`heading-5 transition-colors duration-300 ease-base ${on ? "text-fg" : "text-muted group-hover:text-fg"}`}>{step.title}</span>
                        {on ? <span className="body-3 max-w-md text-muted">{step.text}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="relative h-120">
            {steps.map((step, i) => (
              <div
                key={step.id}
                aria-hidden={i !== active}
                className={`absolute inset-0 flex items-center transition duration-500 ease-base ${i === active ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
              >
                <Terminal window={step.window} lines={step.lines} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="steps-stacked wrap flex-col gap-16 py-24">
        <h2 className="heading-2" data-reveal>
          {heading}
        </h2>
        <ol className="flex flex-col gap-16">
          {steps.map((step) => (
            <li key={step.id} className="flex flex-col gap-6" data-reveal>
              <div className="flex flex-col gap-2">
                <span className="chip chip-ask self-start font-mono">{step.number}</span>
                <h3 className="heading-5">{step.title}</h3>
                <p className="body-3 max-w-md text-muted">{step.text}</p>
              </div>
              <Terminal window={step.window} lines={step.lines} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
