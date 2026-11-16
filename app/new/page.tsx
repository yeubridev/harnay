import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { catalog, defaultConfig, parseConfig } from "@/lib/harness/catalog";
import { previewFiles } from "@/lib/harness/preview";

export const metadata: Metadata = {
  title: "Build your harness",
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
      <main id="main" className="shell pb-24 pt-6 md:pt-10">
        <h1 className="display text-[clamp(2.75rem,6vw,4.5rem)]">Build your harness</h1>
        <p className="mb-10 mt-4 max-w-[40rem] md:mb-14">Pick what applies to your project. The file list is exactly what the command writes, so read it first.</p>
        {/* The free default is in the static page, so the builder works before the link's choices arrive. */}
        <Suspense fallback={<Builder catalog={catalog} initialConfig={defaultConfig} initialFiles={previewFiles(defaultConfig, false)} />}>
          <BuilderFromLink searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
