# Carely backend handover

The backend code is ready to configure. A live Supabase project has not been created or connected. AI and barcode-provider API setup is deferred.

## Activate cloud storage and accounts

1. Create a Supabase project in your own account. Keep database passwords private.
2. Open SQL Editor, paste the complete `supabase/schema.sql`, and run it. The script is repeatable and preserves existing records.
3. In Authentication settings, enable email/password and email confirmation. Set Site URL to your real HTTPS website. Configure your email delivery settings for production.
4. Copy the project URL and public anon key from project settings into your hosting environment as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never use a secret/service-role key. For local development copy `.env.example` to `.env.local` and set those two values.
5. Rebuild and redeploy. The Render blueprint prompts for both public settings. The optional Render PostgreSQL database only caches catalogue records; it does not replace Supabase Auth or private cabinets.
6. Test with two confirmed accounts: sign in, save/load a cabinet, grant the other account access, send an inbox message, then revoke access. Reload the recipient inbox to verify revocation. Device-local medicines remain on that device after sign-out; use a separate browser profile on shared computers.

## Backend contract

- `/api/cloud` accepts only the cabinet, family permissions and inbox operations used by the UI. Every request verifies the visitor with Supabase Auth. Writes derive owner identity from the verified account.
- Row-level security independently protects direct database calls. Recipients can read messages only while permission is enabled, and cannot read the owner's cabinet.
- Cabinet saves require review and a matching revision. Concurrent updates are rejected rather than overwritten. Invalid fields, oversized payloads and demo entries are rejected server-side and by database triggers.
- Cloud errors leave local cabinet storage available. No private API response is cached by the service worker.
- Sharing sends manual in-app messages only. It does not send email, push, SMS or automatic drug alerts.

## Deferred integrations

AI keys, live barcode catalogue providers and map/location providers are not enabled by this backend work. Existing scanner decoding and bundled quality-alert checks remain available with their existing coverage limits. Adding Supabase does not create universal barcode coverage or full medicine history.

## Checks

Run `pnpm test`, `pnpm render:build` and `pnpm build` from the application directory. The isolated SQL verifier in `verification/sql-check` checks the actual SQL using synthetic identities; it is not a substitute for the two-account acceptance test on your configured Supabase project.
