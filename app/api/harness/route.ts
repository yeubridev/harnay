import { NextResponse, type NextRequest } from "next/server";
import { commandFor, needsLicense, parseConfig } from "@/lib/harness/catalog";
import { harnessVersion } from "@/lib/harness/generate";
import { previewFiles } from "@/lib/harness/preview";
import { verifyLicense } from "@/lib/stripe";

// GET /api/harness?stack=&agents=&packs=[&preview=1]
// The CLI and the builder both read this. A paid configuration needs
// `Authorization: Bearer <license key>`, except with preview=1, which returns
// the file list with paid files cut to an excerpt.
// shortcut: no rate limit here; put Vercel's firewall rule on /api/* before launch day.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = parseConfig({ stack: params.get("stack"), agents: params.get("agents"), packs: params.get("packs") });
  if ("error" in parsed) return NextResponse.json({ error: "bad_config", message: parsed.error }, { status: 400 });

  const { config } = parsed;
  const paid = needsLicense(config);
  const preview = params.get("preview") === "1";

  let licensed = false;
  if (paid) {
    const key = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    const check = await verifyLicense(key);
    licensed = check.ok;
    if (!check.ok && !preview) {
      const message = {
        not_configured: "Paid templates are not switched on for this server yet.",
        missing: "This harness includes Pro content. Add your license key with `npx harnay login <key>` or get one at https://harnay.dev/#pricing.",
        invalid: "That license key is not valid. Copy it again from your welcome page.",
        inactive: "The subscription behind this license key is no longer active. Renew it at https://harnay.dev/account.",
      }[check.reason];
      return NextResponse.json({ error: "license_required", reason: check.reason, message }, { status: 402 });
    }
  }

  const files = previewFiles(config, licensed);

  return NextResponse.json(
    { version: harnessVersion, config, command: commandFor(config), paid, licensed, files },
    { headers: { "Cache-Control": paid ? "private, no-store" : "public, max-age=300" } },
  );
}
