// The bundle comes from a server. Before anything is written, every path in it
// must be one of the places a harness lives, and must stay inside the project.

import fs from 'node:fs';
import path from 'node:path';

const ALLOWED = [
  /^(AGENTS|CLAUDE|PROJECT|DESIGN)\.md$/,
  /^\.claude\/settings\.json$/,
  /^\.claude\/hooks\/[\w.-]+$/,
  /^\.claude\/skills\/[\w-]+\/SKILL\.md$/,
  /^\.claude\/agents\/[\w-]+\.md$/,
  /^\.cursor\/hooks\.json$/,
  /^\.cursor\/hooks\/[\w.-]+$/,
  /^\.agents\/skills\/[\w-]+\/SKILL\.md$/,
];

export class UnsafePath extends Error {
  constructor(rel, why) {
    super(`refusing to write "${String(rel).slice(0, 120)}": ${why}`);
    this.userMessage = `${this.message}. Nothing was written. Please report this at https://harnay.dev.`;
  }
}

/** Throws unless `rel` is a harness location. */
export function assertHarnessPath(rel) {
  if (typeof rel !== 'string' || !rel) throw new UnsafePath(rel, 'not a path');
  if (rel.includes('\0') || rel.includes('\\')) throw new UnsafePath(rel, 'unexpected character');
  if (path.posix.isAbsolute(rel) || /^[A-Za-z]:/.test(rel)) throw new UnsafePath(rel, 'absolute path');
  if (rel.split('/').some((part) => part === '..' || part === '.' || part === '')) throw new UnsafePath(rel, 'path traversal');
  if (!ALLOWED.some((re) => re.test(rel))) throw new UnsafePath(rel, 'not a harness location');
  return rel;
}

/**
 * Absolute path for `rel` under `root`. Refuses to go through a symlink, so a
 * link named `.claude` pointing at your home folder cannot redirect a write.
 */
export function resolveInside(root, rel) {
  assertHarnessPath(rel);
  const base = fs.realpathSync(root);
  let current = base;
  for (const part of rel.split('/')) {
    current = path.join(current, part);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch {
      continue; // does not exist yet
    }
    if (stat.isSymbolicLink()) throw new UnsafePath(rel, `"${path.relative(base, current)}" is a symlink`);
  }
  const rest = path.relative(base, current);
  if (rest.startsWith('..') || path.isAbsolute(rest)) throw new UnsafePath(rel, 'escapes the project');
  return current;
}
