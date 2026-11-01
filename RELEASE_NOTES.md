# Carely premium motion and reliability release — 30 October 2026

This release retains the existing navigation, typefaces, palette and layout. It adds exactly two decorative motion treatments and fixes the concrete issues found in the prior review. New interface text is limited to functional feedback, cloud-save review, related/catalogue results and Hindi translations.

## The two animations

1. **Floating 3D capsules:** lazily loaded Three.js scene; cyan, blue and white physical materials; translucent shells, reflections, soft projected shadows, varied depths, slow rotation/vertical motion and smoothed pointer parallax. The canvas has no pointer events and renders only into peripheral gutters, protecting the reading column. The animation is capped at 30 frames/second with pixel ratio capped at 1.5 and reduced transmission resolution. It stops while hidden or a dialog is open. WebGL failure uses static decorative capsules.
2. **Floating medicine/dashboard cards:** existing medicine, service and evidence cards get 3px vertical drift, pointer-based tilt bounded to 3 degrees, a small hover elevation, soft lighting/shadow and a smooth return. No wrappers or dimension changes are introduced. Touch devices have no hover tilt. Reduced-motion mode stops movement; hidden pages pause the drift. Other controls, navigation and pages have no new animation.

Only one runtime dependency was added: three. @types/three is a development typing dependency. No React Three Fiber, animation framework, model download, HDR download, image asset or logo was added.

## Reliability fixes

| Prior issue | This release |
| --- | --- |
| Reload rejected cabinets above 100 entries | Restore accepts larger cabinets and skips malformed entries individually; regression tested at 125 entries. |
| Same pack for Dad and Mom was collapsed | Duplicate identity includes the owner; browser-tested two separate entries. |
| Sign-out cleared device entries | Sign-out leaves local medicine records intact. Local storage remains device-local, not a separate account vault. |
| Cloud overwrite/conflict risk | Load merges records. Save previews conflicts, retains cloud-only entries, checks for device edits since review, and uses an atomic database revision check to reject concurrent cloud changes. Conflicting notes/expiry keep device values only after the user confirms the save. |
| Refresh removed previously checked periods on failure | Only successfully fetched report tables replace stored tables. Failed periods retain their prior records and original retrieval times, with explicit gaps. |
| Name-only information disappeared when batch was absent | Matching-batch results stay separate from related reports for other batches. Product catalogue candidates are fetched independently and labelled as product information rather than batch history. |
| Address formatting prevented exact manufacturer comparisons | Exact corporate name normalization can omit a comma-separated report address for recognized corporate suffixes. Other differences remain candidates. Batch punctuation and leading zeros are never fuzzy-matched. |
| Camera and provider flow were fragile | Rear-camera preference, specific permission/device errors, stale camera/photo cancellation protection, image validation, and direct review of provider-identified products even if the separate name catalogue has no result. |
| Chips, last-checked and Hindi UI were incomplete | Profile chips filter. Saved medicine checks update status and timestamp. Hindi labels, safety text, scan forms, history, family/account panels and core FAQ text are translated. User data and official evidence stay verbatim. Keyboard focus stays inside dialogs. |
| Family inbox required manual refresh | Polls every 30 seconds while visible/signed in, refreshes on return/focus, and serializes token refresh. This is in-app polling, not push/SMS/email/WhatsApp or automatic medicine monitoring. |
| Paid endpoints had no quotas | Durable account quotas: 6 requests per minute combined, 20 chat requests/day and 10 speech requests/day (UTC), atomically reserved before paid calls. Missing quota setup fails closed. |
| Tests covered too few failure cases | 37 automated tests plus an isolated PostgreSQL schema/RLS/quota integration check and browser regression checks. |

## Required cloud upgrade

**Run the entire current supabase/schema.sql in your Supabase SQL editor before using the upgraded cloud save or AI features.** It is written as a repeatable migration. It adds cabinet revisions, the conflict-checking save RPC and protected usage quota tables/functions. Existing cloud data is not cleared by the migration.

Then set the real owner-controlled settings described in SETUP.md and rebuild after any NEXT_PUBLIC setting changes. No credentials are included. No external accounts, public hosting or paid services were provisioned.

## Verification and remaining acceptance

- 37 automated tests passed. Next.js/Render (Webpack) and portable vinext production builds passed.
- The real scene initialized with WebGL ready and no console errors. Separate gutter screenshots changed across frames. Card tilt reached approximately 2.15° / −1.38° under pointer input, returned to zero on leave, and retained its 400×332px measured dimensions.
- Browser tested: manual save, same pack for two owners, profile filtering, reload persistence, Hindi cabinet controls, history submission, saved-card last-checked update and generated QR-image decoding into batch history.
- Phone 375px and tablet 768px checks had matching document widths, with no horizontal overflow.
- Reduced-motion handling is implemented through the native media query and CSS; the operating-system preference was not changed during QA.
- The actual SQL migration was executed in isolated PostgreSQL (PGlite) with test auth identities. Cabinet isolation, family read/revoke, revision conflict rejection, quota windows and counter write denial passed. This does not certify a real Supabase project's configuration, email delivery, JWT setup or deployment.
- Real camera hardware, live two-account Supabase flows, live OpenAI/voice billing and OpenMRP coverage still require owner credentials and device testing. Existing code tests cannot supply missing product/batch records or manufacturer distribution history.

No claim is made that every medicine/batch is in the official alert source, that a missing alert means safe, or that any medicine's complete manufacturing/distribution history is available. Read README.md for exact data coverage.

## Light / dark theme update

Added an accessible sun/moon switch, saved browser preference, device-theme default, cross-tab preference updates, pre-paint theme initialization and theme-aware capsule lighting. Existing layout and the two motion effects remain. The dark palette uses explicit readable surfaces and lighter semantic status colours rather than image inversion.

37 automated tests pass. The portable production build passes. The Next.js production build uses Webpack by default for reliable builds in restricted environments; the sandbox blocked Turbopack's internal port binding. Browser checks covered both directions, preference persistence across reload, rendered palettes, capsule initialization and responsive controls.
