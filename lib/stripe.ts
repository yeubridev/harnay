import "server-only";
import Stripe from "stripe";
import { checkLicense, type LicenseCheck } from "./license";

let client: Stripe | null | undefined;

/** The Stripe client, or null when STRIPE_SECRET_KEY is not set (local development, previews). */
export function stripe(): Stripe | null {
  if (client === undefined) client = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  return client;
}

export const licenseSecret = () => process.env.HARNAY_LICENSE_SECRET;

export const priceFor = (plan: string) => (plan === "team" ? process.env.STRIPE_PRICE_TEAM : plan === "pro" ? process.env.STRIPE_PRICE_PRO : undefined);

export function verifyLicense(key: string | null | undefined): Promise<LicenseCheck> {
  const api = stripe();
  return checkLicense(key, {
    secret: licenseSecret(),
    getStatus: api ? async (id) => (await api.subscriptions.retrieve(id)).status : undefined,
  });
}

/** Public origin for redirects. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = (request: Request) => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
