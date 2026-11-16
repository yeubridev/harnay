import { SiteFooter, SiteHeader } from "@/components/site-header";

/** The shell for reading pages: docs, terms, privacy, account, welcome. */
export function ProsePage({ title, lead, children }: { title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap flex flex-col gap-12 pb-24 pt-24">
        <div className="flex flex-col gap-4">
          <h1 className="heading-2">{title}</h1>
          {lead ? <p className="body-7 max-w-2xl text-muted">{lead}</p> : null}
        </div>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function ProseSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <h2 className="heading-5">{title}</h2>
      <div className="body-3 flex max-w-2xl flex-col gap-4 text-muted">{children}</div>
    </section>
  );
}

/** Inline code inside prose. */
export function C({ children }: { children: React.ReactNode }) {
  return <code className="caption-2 rounded-md border border-line bg-panel px-1 text-fg">{children}</code>;
}
