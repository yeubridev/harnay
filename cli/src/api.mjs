import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertHarnessPath } from './paths.mjs';

export const VERSION = '0.1.0';

export class CliError extends Error {
  constructor(message) {
    super(message);
    this.userMessage = message;
  }
}

export function apiBase() {
  const base = (process.env.HARNAY_API || 'https://harnay.dev').replace(/\/$/, '');
  const url = new URL(base);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !local) throw new CliError(`HARNAY_API must use https (got ${base}).`);
  return base;
}

const keyFile = () => path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'harnay', 'key');

export function saveKey(key) {
  const file = keyFile();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, `${key.trim()}\n`, { mode: 0o600 });
  return file;
}

export function forgetKey() {
  fs.rmSync(keyFile(), { force: true });
}

export function loadKey(flag) {
  if (flag) return flag.trim();
  if (process.env.HARNAY_KEY) return process.env.HARNAY_KEY.trim();
  try {
    return fs.readFileSync(keyFile(), 'utf8').trim() || null;
  } catch {
    return null;
  }
}

/** Download a harness. Every path is checked before the bundle is handed back. */
export async function fetchHarness(config, key) {
  const query = new URLSearchParams({ stack: config.stack ?? '', agents: (config.agents ?? []).join(','), packs: (config.packs ?? []).join(',') });
  const url = `${apiBase()}/api/harness?${query}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'user-agent': `harnay-cli/${VERSION}`, accept: 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new CliError(`Could not reach ${apiBase()} (${error?.cause?.code ?? error?.name ?? 'network error'}). Check your connection and try again.`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new CliError(body?.message ?? `The server answered ${response.status}.`);
  if (!body || !Array.isArray(body.files) || !body.files.length || typeof body.version !== 'string' || !body.config) {
    throw new CliError('The server sent something that is not a harness. Nothing was written.');
  }
  for (const file of body.files) {
    assertHarnessPath(file.path);
    if (typeof file.content !== 'string' || file.locked) throw new CliError(`The server sent no content for ${file.path}. Nothing was written.`);
    if (file.owner !== 'you' && file.owner !== 'harnay') throw new CliError(`Unexpected owner for ${file.path}. Nothing was written.`);
  }
  return body;
}
