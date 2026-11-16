import { NextResponse } from "next/server";
import { priceFor, siteUrl, stripe } from "@/lib/stripe";

// POST /api/checkout (form field `plan`: pro | team). Redirects to Stripe Checkout.
export async function POST(request: Request) {
  const origin = siteUrl(request);
  const form = await request.formData().catch(() => null);
  const plan = String(form?.get("plan") ?? "pro");
  const price = priceFor(plan);
  const api = stripe();
  if (!api || !price) return NextResponse.redirect(`${origin}/welcome?error=billing_off`, 303);

  const session = await api.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    subscription_data: { metadata: { plan } },
  });
  if (!session.url) return NextResponse.redirect(`${origin}/welcome?error=checkout_failed`, 303);
  return NextResponse.redirect(session.url, 303);
}
