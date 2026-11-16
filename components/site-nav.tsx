"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Buckle } from "@/components/logo";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

/**
 * A compact bar that floats off the top edge, centred and sized to its content.
 * On a phone the menu opens as a full height panel and its links arrive one after another.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = (href: string) => (href === pathname ? ("page" as const) : undefined);
  const bar = "transition-transform duration-500 ease-base";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-4">
      <nav aria-label="Main" className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-line bg-panel/70 p-1 backdrop-blur-xl">
        <Link href="/" aria-label="Harnay, home" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2">
          <Buckle className="h-6 w-6 text-signal" />
          <span className="title-3 text-fg">harnay</span>
        </Link>

        <ul className="hidden items-center md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current(link.href)}
                className="title-4 block rounded-xl px-3 py-2 text-muted transition-colors duration-300 ease-base hover:text-fg aria-[current=page]:bg-panel-2 aria-[current=page]:text-fg"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/new" aria-current={current("/new")} onClick={() => setOpen(false)} className="btn btn-primary btn-sm ml-2">
          Get Harnay
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className="relative ml-1 flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl md:hidden"
        >
          <span aria-hidden="true" className={`block h-0.5 w-4 rounded-full bg-fg ${bar} ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span aria-hidden="true" className={`block h-0.5 w-4 rounded-full bg-fg ${bar} ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {open ? (
        <div id="mobile-menu" className="pointer-events-auto fixed inset-0 -z-10 flex flex-col justify-center bg-ground/95 px-8 backdrop-blur-2xl md:hidden">
          <ul className="flex flex-col gap-6" data-enter>
            {[...LINKS, { href: "/new", label: "Get Harnay" }].map((link, i) => (
              // Each link starts 60ms after the one before it; four links stay under 400ms in all.
              <li key={link.href} style={{ "--i": i * 0.67 } as React.CSSProperties}>
                <Link href={link.href} aria-current={current(link.href)} onClick={() => setOpen(false)} className="heading-3 block py-2 text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
