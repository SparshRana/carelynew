# Verification — 30 October 2026

This file supersedes earlier verification notes. See RELEASE_NOTES.md for the complete issue-by-issue matrix and verification limits.

- `pnpm test`: 37 passing tests, 0 failures.
- `pnpm run render:build` (Next.js Webpack): passed Next.js production compilation, TypeScript, page generation and routes.
- `pnpm run build`: passed portable vinext production build. Its static route-classification notice is informational.
- Isolated PostgreSQL integration check: migration execution, revision conflicts, cabinet isolation, family grant/read/revoke, quota windows and counter write protection passed. The test uses PGlite with test auth functions and identities; no live Supabase connection.
- Browser: Three.js WebGL ready, moving capsule frames, bounded interactive card tilt/return with stable dimensions, manual save/reload, two owners, profile filtering, Hindi labels, history search, last-checked status, generated QR upload and 375/768px responsive widths. No browser console errors during the motion checks.
- Reduced-motion media handling is implemented; no OS preference was changed during verification.

The visual preview screenshot contains clearly named QA entries created only in a temporary localhost browser. No sample medicine is seeded in the shipped app. Source records in data/cdsco-alerts.json are official dated CDSCO reports, not simulation.

Pending owner acceptance: actual phone camera and physical packs; real Supabase signup/confirmation/two-account cloud and family flow; live OpenAI/voice; optional OpenMRP product identification and coverage. The quota and cloud features require the current SQL migration. Public data coverage remains limited to enumerated official tables.

Current command logs and the isolated SQL verifier are in verification/.

Theme update: default Turbopack build hit an environment port-binding restriction. The Webpack production build and portable build passed. Light/dark theme switching and reload persistence were exercised in the browser. See current theme logs in verification/.
