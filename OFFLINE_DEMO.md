# Carely offline hackathon demonstration

## Run
Use Node 22.13+ and pnpm 11.25.0. Install dependencies before going offline:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run render:build
corepack pnpm run render:start
```

Open http://localhost:3000. No API keys, cloud configuration or sign-in are required for this demonstration. The source ZIP is not a double-clickable HTML app; run it with the commands above.

## Present in this order
1. Open the compact **Demo studio** strip below the navigation. Wait for **Offline records ready** and **App cached for offline demo reload on this device**.
2. Click **Load Dad's Sample Cabinet**. Three fictional entries appear; personal entries remain separate.
3. Open DEMO-892: three cards show neutral status, bilingual pantoprazole information and an explicitly illustrative generic price comparison.
4. Close the drawer. Click **Simulate Quality Alert**: DEMO-892 turns crimson, DEMO-893 and MT-104 stay neutral. The demo bell gets one unread indicator. Repeated clicks do not create duplicate events.
5. Preview Rohan's fictional caregiver view, or open the bell. Neither action sends anything or grants real family access.
6. Open DEMO-892: the alert and invented laboratory finding are prominently labelled SIMULATED. The Hindi transcript also says it is fictional.
7. **Reset Demo** restores the initial three neutral sample entries and clears the unread event. **Exit Demo** returns to personal entries. Demo medicines are never saved in personal storage or synced to a cloud account. A session-only flag resumes a fresh neutral demo after reload; simulation state is deliberately cleared.
8. Use **Scan new medicine** to access quick examples, local name search, camera and photo decoding. The indexed official example is Alzomac-0.5, batch 60098. Its exact manufacturer and dissolution finding come from the bundled CDSCO record. ACNEMOIST 2200388 from the supplied image is not in the snapshot, so its example is marked unverified rather than invented as a real alert.

## Offline scope
The three cards, five curated formulation mappings, local search, sample cabinet, simulation, caregiver preview and barcode decoding use no external API. The bundled dataset has 7,005 published CDSCO NSQ/spurious records, retrieved 29 October 2026. It is a historical indexed snapshot, not a live or comprehensive supply-chain history. A batch number alone cannot confirm product identity. Product/brand, manufacturer and exact batch must agree for an official match. Candidate or incomplete identities need confirmation.

Open the production app once on localhost or HTTPS to install the service worker and cache the app shell/static assets. The cache-ready message confirms warm-up. After that, the demo can reload from browser cache; if your browser disallows service workers, keep the local server running (internet is still unnecessary). Do not clear browser site data during the demo. API/account responses are never cached. Official source links and clinical source links need internet when opened.

Outside Demo Mode, pre-existing optional cloud accounts, AI assistant, live CDSCO refresh and GTIN provider still require their existing providers/configuration. They are not part of the offline demonstration. A barcode encodes only what its issuer put into it: ordinary retail GTINs do not contain universal medicine/batch history. This demo does not invent a GTIN-to-product registry. The scanner shows readable errors for unsupported images and unavailable camera permission. Camera requires HTTPS or localhost and a real accessible camera.

## Hindi audio
Uses native speechSynthesis only, with hi-IN and an installed Hindi voice marked local by the browser. No OpenAI, cloud login, audio download or server request is used. Install an offline Hindi speech voice in the device's OS before the presentation and test in your chosen browser. Some browsers expose Hindi voices only after device setup; reload and retry after installation. If no local Hindi voice exists, the app shows a clear message and always retains the visible transcript. Exact duration varies by voice; it is not guaranteed to be ten seconds. The test browser had no installed local Hindi voice, so the fallback was verified; audible Hindi output needs a suitable device.

## Clinical and price limitations
Only exact curated salt, strength, dosage form and release matches expose generic comparisons. Unknown brands, combinations, unknown release types and wrong strengths do not receive guessed substitutions. Pantofix is an explicitly fictional demo alias for pantoprazole; it is never inferred for real personal entries. Unknown release remains Unknown; it is never silently changed to immediate release.

PMBJP formulations are based on the government list linked in the cards. **All displayed market and generic prices are illustrative demonstration amounts, not verified current government MRPs.** The requested ₹48.50/₹9.20 example gives approximately 81% savings for equal 10-tablet packs; this is arithmetic on example values, not a price guarantee. Current price, pack size, stock and pharmacist-approved substitution must be checked before purchase. No claim of government certification, complete batch history, authenticity or clinical safety is made.

Clinical references reviewed 30 October 2026:
- https://www.nhs.uk/medicines/pantoprazole/how-and-when-to-take-pantoprazole/
- https://www.nhs.uk/medicines/paracetamol-for-adults/
- https://www.nhs.uk/medicines/metformin/
- https://www.nhs.uk/medicines/amoxicillin/how-and-when-to-take-amoxicillin/
- https://medlineplus.gov/druginfo/meds/a601249.html
- PMBJP formulation list: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2224371&lang=1&reg=1

General educational information only. Discuss treatment and substitution with the prescribing doctor or registered pharmacist. Never stop or change treatment on your own.
