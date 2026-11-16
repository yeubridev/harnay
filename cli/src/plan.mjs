// Decide what to do with each file of a bundle, then do it.
//
//   create    the file does not exist
//   same      it exists with exactly this content
//   update    Harnay wrote it and you have not touched it since
//   keep      it is yours (PROJECT.md, DESIGN.md) and already exists
//   replace   it exists and is not ours, or you changed it: backed up, then overwritten
//   skip      same situation during `sync` without --force: left alone
//   remove    Harnay wrote it, you have not touched it, and it left the harness

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { assertHarnessPath, resolveInside } from './paths.mjs';

export const MANIFEST = 'harnay.json';
export const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');

export function readManifest(root) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8'));
    return manifest && typeof manifest.files === 'object' ? manifest : null;
  } catch {
    return null;
  }
}

const readIfPresent = (abs) => {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
};

/** @param {{mode: 'init' | 'sync', force?: boolean}} options */
export function plan(root, files, manifest, options) {
  const known = manifest?.files ?? {};
  const entries = files.map((file) => {
    const abs = resolveInside(root, file.path);
    const local = readIfPresent(abs);
    let action;
    if (local === null) action = 'create';
    else if (file.owner === 'you') action = 'keep';
    else if (local === file.content) action = 'same';
    else if (known[file.path] && known[file.path] === sha(local)) action = 'update';
    else action = options.mode === 'init' || options.force ? 'replace' : 'skip';
    return { path: file.path, abs, action, content: file.content, owner: file.owner };
  });

  const incoming = new Set(files.map((f) => f.path));
  for (const [rel, hash] of Object.entries(known)) {
    if (incoming.has(rel)) continue;
    try {
      assertHarnessPath(rel);
    } catch {
      continue; // a hand-edited manifest must not make us delete arbitrary files
    }
    const abs = resolveInside(root, rel);
    const local = readIfPresent(abs);
    if (local !== null && sha(local) === hash) entries.push({ path: rel, abs, action: 'remove', owner: 'harnay' });
  }
  return entries;
}

export function apply(root, entries, stamp = new Date().toISOString().replace(/[:.]/g, '-')) {
  const backupRoot = path.join(root, '.harnay', 'backup', stamp);
  let backedUp = 0;
  for (const entry of entries) {
    if (entry.action === 'replace') {
      const to = path.join(backupRoot, entry.path);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(entry.abs, to);
      backedUp++;
    }
    if (['create', 'update', 'replace'].includes(entry.action)) {
      fs.mkdirSync(path.dirname(entry.abs), { recursive: true });
      fs.writeFileSync(entry.abs, entry.content);
    }
    if (entry.action === 'remove') fs.rmSync(entry.abs, { force: true });
  }
  return backedUp ? path.relative(root, backupRoot) : null;
}

/** Record what was installed. Only files Harnay manages are hashed; yours are never tracked. */
export function writeManifest(root, bundle, entries, previous) {
  const files = {};
  for (const entry of entries) {
    if (entry.owner !== 'harnay' || entry.action === 'remove') continue;
    if (entry.action === 'skip') {
      if (previous?.files?.[entry.path]) files[entry.path] = previous.files[entry.path];
    } else files[entry.path] = sha(entry.content);
  }
  const manifest = { harnay: 1, version: bundle.version, ...bundle.config, files };
  fs.writeFileSync(path.join(root, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** Make sure secrets and guard backups are ignored by git. Returns the lines it added. */
export function ensureGitignore(root) {
  const file = path.join(root, '.gitignore');
  const current = readIfPresent(file) ?? '';
  const lines = new Set(current.split(/\r?\n/).map((line) => line.trim()));
  const has = (...patterns) => patterns.some((pattern) => lines.has(pattern));
  const needed = [];
  if (!has('.env', '.env*')) needed.push('.env');
  if (!has('.env.*', '.env*')) needed.push('.env.*');
  if (!has('!.env.example')) needed.push('!.env.example');
  if (!has('.harnay/', '.harnay')) needed.push('.harnay/');
  if (!needed.length) return [];
  const gap = !current ? '' : current.endsWith('\n') ? '\n' : '\n\n';
  fs.writeFileSync(file, `${current}${gap}# Harnay: secrets and guard backups stay out of git\n${needed.join('\n')}\n`);
  return needed;
}
