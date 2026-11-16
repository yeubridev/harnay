"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The tagline moment: the sentence starts muted and each word wakes up, in reading
 * order, as the block crosses the middle of the screen. One scroll listener,
 * throttled through requestAnimationFrame.
 */
export function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  const ref = useRef<HTMLParagraphElement>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const start = window.innerHeight * 0.8; // the first word wakes when the block's top reaches here
      const end = window.innerHeight * 0.35; // the last one when its bottom reaches here
      const progress = (start - box.top) / (start - end + box.height);
      setLit(Math.round(Math.min(1, Math.max(0, progress)) * words.length));
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
  }, [words.length]);

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="word" data-on={i < lit ? "" : undefined}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
