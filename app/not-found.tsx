import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="shell pb-24 pt-6 md:pt-10">
        <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">That page is not here</h1>
        <p className="mt-5 max-w-[40rem]">The link may be old. The builder and the docs are one click away.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/new" className="button">
            Build your harness
          </Link>
          <Link href="/docs" className="button button-quiet">
            Read the docs
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
