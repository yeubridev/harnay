import "server-only";
import type { Config } from "./catalog";
import { generate } from "./generate";

export type PreviewFile = {
  path: string;
  owner: "harnay" | "you";
  pro: boolean;
  locked: boolean;
  content: string;
  /** Lines held back from a locked file. */
  hiddenLines?: number;
};

const EXCERPT_LINES = 12;

/** The files of a harness as shown before purchase: paid files are cut to an excerpt unless licensed. */
export function previewFiles(config: Config, licensed: boolean): PreviewFile[] {
  return generate(config).map((file) => {
    if (!file.pro || licensed) return { ...file, locked: false };
    const lines = file.content.split("\n");
    return {
      path: file.path,
      owner: file.owner,
      pro: true,
      locked: true,
      content: lines.slice(0, EXCERPT_LINES).join("\n"),
      hiddenLines: Math.max(0, lines.length - EXCERPT_LINES),
    };
  });
}
