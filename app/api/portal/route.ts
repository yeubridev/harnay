import { NextResponse } from "next/server";
import { siteUrl, stripe, verifyLicense } from "@/lib/stripe";

// POST /api/portal (form field `key`). Redirects to the Stripe customer portal
// for the subscription behind a license key: invoices, card, cancel.
export async function POST(request: Request) {
  const origin = siteUrl(request);
  const form = await request.formData().catch(() => null);
  const check = await verifyLicense(String(form?.get("key") ?? ""));
  const api = stripe();
  // An expired key still opens the portal, so a lapsed customer can renew.
  const subscriptionId = check.ok ? check.subscriptionId : null;
  if (!api || (!subscriptionId && !(check.ok === false && check.reason === "inactive"))) {
    return NextResponse.redirect(`${origin}/account?error=${check.ok ? "billing_off" : check.reason}`, 303);
  }
  if (!subscriptionId) return NextResponse.redirect(`${origin}/account?error=inactive`, 303);

  const subscription = await api.subscriptions.retrieve(subscriptionId);
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const portal = await api.billingPortal.sessions.create({ customer, return_url: `${origin}/account` });
  return NextResponse.redirect(portal.url, 303);
}
