---
name: security-check
description: Review a change for the security mistakes that ship most often in AI-written apps. Use before merging anything that touches authentication, authorisation, database access, row level security, payments, webhooks, file uploads, user input, environment variables or third-party API calls, and when the user asks "is this safe to launch?".
---

# Security check

Work through the list against the diff. For each item write: fine, problem (with file and line), or not checked (and why).

## Who is asking

- Every server entry point (route handler, server action, edge function, RPC) checks who the caller is. Hidden UI is not protection.
- It also checks that this caller may touch this particular row. "Signed in" is not "owns it".
- With Supabase or Postgres RLS: every table has RLS on and a policy for each operation. Test as an anonymous visitor and as another user.

## What they send

- Input is validated on the server with a schema (zod, Pydantic) before use. Client validation is a convenience.
- Database queries use bound parameters. No string-built SQL.
- User content is never rendered as HTML unless it has been sanitised. No `dangerouslySetInnerHTML`, `innerHTML` or `eval` on user data.
- A URL supplied by a user is not fetched by the server without an allowlist.
- Uploads: type and size checked on the server, stored outside the web root, served with a safe content type.

## Secrets

- No key, token or password in the code, the logs or an error message.
- Nothing secret behind a public prefix (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`).
- `.env` is in `.gitignore`. `.env.example` lists names only.
- A `service_role` or admin key is used on the server only.

## Money and webhooks

- Webhook handlers verify the signature and can safely receive the same event twice.
- Prices and entitlements are decided on the server from your data, never taken from the request.

## Edges

- Login, signup, password reset and anything expensive are rate limited.
- Session cookies are `httpOnly`, `secure` and `sameSite`. No tokens in localStorage.
- CORS names your origins. No `*` with credentials.
- Errors shown to users contain no stack trace, query or file path.
- `npm audit --omit=dev` (or the equivalent) shows no high or critical issue.

## Output

A table: item, verdict, where, fix. Then a "not checked" list. If anything is a problem, the change is not ready, and you say so in the first line.
