import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { catalog, defaultConfig, parseConfig } from "@/lib/harness/catalog";
import { previewFiles } from "@/lib/harness/preview";

export const metadata: Metadata = {
  title: "Get Harnay",
  description: "Pick your stack, your agents and your packs. Read every file, then copy one command.",
  alternates: { canonical: "/new" },
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** A shared link such as /new?stack=expo&packs=quality opens with those choices already made. */
async function BuilderFromLink({ searchParams }: { searchParams: PageProps<"/new">["searchParams"] }) {
  const params = await searchParams;
  const parsed = parseConfig({ stack: one(params.stack), agents: one(params.agents), packs: one(params.packs) });
  const config = "config" in parsed ? parsed.config : defaultConfig;
  return <Builder catalog={catalog} initialConfig={config} initialFiles={previewFiles(config, false)} />;
}

export default function NewHarness({ searchParams }: PageProps<"/new">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap flex flex-col gap-12 pb-24 pt-24">
        <div className="flex flex-col gap-4">
          <h1 className="heading-2">Harness builder</h1>
          <p className="body-7 max-w-xl text-muted">Pick what applies to your project. The file list is exactly what the command writes, so read it first.</p>
        </div>
        {/* The free default is in the static page, so the builder works before the link's choices arrive. */}
        <Suspense fallback={<Builder catalog={catalog} initialConfig={defaultConfig} initialFiles={previewFiles(defaultConfig, false)} />}>
          <BuilderFromLink searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
