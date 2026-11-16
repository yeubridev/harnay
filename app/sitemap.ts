import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://harnay.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/new", "/docs"].map((path) => ({ url: `${site}${path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}
