import Link from "next/link";
import { Buckle } from "@/components/logo";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="screen">
        <div className="wrap flex flex-col items-start gap-6">
          <Buckle className="h-12 w-12 text-signal" />
          <h1 className="heading-2">This page is not on the harness</h1>
          <p className="body-7 max-w-md text-muted">The link may be old. The builder and the docs are one step away.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/new" className="btn btn-primary">
              Get Harnay
            </Link>
            <Link href="/docs" className="btn btn-secondary">
              Read the docs
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
