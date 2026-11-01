# Saved-batch watch

Carely checks published quality alerts, not the chemical contents or authenticity of a physical pack. NSQ and spurious report types remain separate in notification text. No-match results are limited to checked records and do not certify safety.

## Use it

1. Sign in under My cabinet → Optional cloud backup & family sharing.
2. Add a medicine using its actual label, including manufacturer and batch. Save and confirm the cloud cabinet.
3. Choose Check saved cloud batches now. Entries missing identification details need confirmation.
4. Optionally enable Check every 15 minutes while this page is open. This is opt-in, not a background service when the page is closed.
5. In Family, grant the recipient's confirmed account access and refresh the inbox. Messages are shared only while that grant is enabled. There is no SMS, email or push delivery.

Each exact published match records the medicine, owner label, batch, manufacturer, NSQ/spurious type, reporting period, finding and source. Deterministic account-scoped notification IDs prevent duplicate inserts, including concurrent checks. A new reported finding produces a new message. Demo medicines never enter cloud checks.

The server reads the signed-in account's saved cabinet under Supabase RLS; it does not accept a cabinet or owner identity from the request body. Report tables refresh through the existing CDSCO loader. Historical matches may still be reported during upstream outages; no-match reassurance is withheld when live refresh fails. Snapshot and check timestamps appear in the summary. Full intervening monthly coverage is not guaranteed by a latest-table refresh.

## Still external or unverified

- Closed-browser monitoring needs an authenticated scheduled worker, quota policy and deployment configuration. It is not configured by this release.
- Real push/email delivery needs a delivery provider and consent configuration.
- Universal barcode-to-medicine data is not available. Provider access remains unconfigured.
- Live two-account acceptance (save, check, recipient read and revoke) requires account sign-in. Automated tests use synthetic identities, not real patients.
- No personal dosage recommendations or automatic generic substitutions are provided. Existing curated generic information is illustrative and requires pharmacist review; prices are not guaranteed current.

No additional SQL migration is required beyond the existing schema. The notification primary key provides idempotency.
