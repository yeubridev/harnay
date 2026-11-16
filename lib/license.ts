import "server-only";
import crypto from "node:crypto";

// A license key is the Stripe subscription id plus an HMAC of it:
//
//   hny_<base64url(subscription id)>.<signature>
//
// The signature proves we issued the key. The subscription's live status, read
// from Stripe, proves it is still paid. Nothing is stored on our side.

const PREFIX = "hny_";
const ACTIVE = new Set(["active", "trialing", "past_due"]);
const CACHE_MS = 5 * 60 * 1000;

const sign = (body: string, secret: string) => crypto.createHmac("sha256", secret).update(body).digest("base64url").slice(0, 32);

export function issueLicense(subscriptionId: string, secret: string): string {
  const body = Buffer.from(subscriptionId, "utf8").toString("base64url");
  return `${PREFIX}${body}.${sign(body, secret)}`;
}

/** The subscription id inside a key, or null when the key was not signed by us. */
export function readLicense(key: string, secret: string): string | null {
  if (!key.startsWith(PREFIX) || key.length > 400) return null;
  const [body, signature, ...rest] = key.slice(PREFIX.length).split(".");
  if (!body || !signature || rest.length) return null;
  const expected = sign(body, secret);
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, Buffer.from(expected))) return null;
  return Buffer.from(body, "base64url").toString("utf8");
}

export type LicenseCheck = { ok: true; subscriptionId: string } | { ok: false; reason: "not_configured" | "missing" | "invalid" | "inactive" };

export type LicenseDeps = {
  secret: string | undefined;
  /** Stripe status of a subscription. Omit when Stripe is not configured. */
  getStatus?: (subscriptionId: string) => Promise<string>;
  now?: () => number;
};

const cache = new Map<string, { status: string; at: number }>();

export async function checkLicense(key: string | null | undefined, deps: LicenseDeps): Promise<LicenseCheck> {
  if (!deps.secret) return { ok: false, reason: "not_configured" };
  if (!key) return { ok: false, reason: "missing" };
  const subscriptionId = readLicense(key.trim(), deps.secret);
  if (!subscriptionId) return { ok: false, reason: "invalid" };
  if (!deps.getStatus) return { ok: true, subscriptionId };

  const now = (deps.now ?? Date.now)();
  let entry = cache.get(subscriptionId);
  if (!entry || now - entry.at > CACHE_MS) {
    try {
      entry = { status: await deps.getStatus(subscriptionId), at: now };
      cache.set(subscriptionId, entry);
    } catch {
      // Stripe unreachable. A correctly signed key was paid for at least once, so a
      // paying customer is not locked out by someone else's outage.
      // shortcut: no negative cache; add one if Stripe errors ever become a traffic problem.
      return entry ? decide(entry.status, subscriptionId) : { ok: true, subscriptionId };
    }
  }
  return decide(entry.status, subscriptionId);
}

const decide = (status: string, subscriptionId: string): LicenseCheck =>
  ACTIVE.has(status) ? { ok: true, subscriptionId } : { ok: false, reason: "inactive" };

export const clearLicenseCache = () => cache.clear();
