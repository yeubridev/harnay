"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const done = new WeakSet<Element>();

/**
 * Reveals `[data-reveal]` elements as they scroll into view.
 *
 * It animates with the Web Animations API instead of toggling a class or an
 * attribute: this runs before React has hydrated the rest of the page, and
 * changing markup React still has to hydrate would be a mismatch.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          done.add(el);
          const order = Number(getComputedStyle(el).getPropertyValue("--reveal-order")) || 0;
          el.animate(
            [
              { opacity: 0, transform: "translateY(24px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 600, delay: order * 70, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
          );
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!done.has(el)) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
