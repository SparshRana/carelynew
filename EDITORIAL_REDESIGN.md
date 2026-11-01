# Carely editorial redesign

The new visual direction draws inspiration from the large typography, generous space, human photography and sliding presentation at https://www.hioscar.com/ and https://alan.com/. Carely's composition, copy, artwork, colours and interface illustrations are original. No reference-site images, logos, video or source code were reused.

## What changed
- Warm ivory, deep evergreen, sage, lilac and peach surfaces with a coordinated dark palette.
- An original family photograph, a quieter still life, expressive local typography, headline entry and a drawn underline.
- A three-scene story. On wide screens with motion enabled, ordinary vertical scroll drives its horizontal movement. Arrows and progress buttons select scenes. Scrolling is never intercepted or locked. On smaller screens the story is a native scroll-snap carousel; arrows still work.
- Word-by-word colour emphasis as the editorial headline enters view. Unemphasised words remain readable in the normal secondary text colour.
- Reduced-motion preferences disable entrance, drawing, reveal and floating effects and turn off the sticky scroll presentation. Carousel controls remain available. No external animation dependency was added.
- A compact expandable Demo studio strip. All sample, simulation, reset, notification and caregiver actions remain available.
- Cleaner cabinet cards and forms, less competing decoration, and optional cloud backup in its own expandable section.
- English/Hindi homepage copy, natural Devanagari spacing, keyboard-operable controls, focus indicators and large touch targets.

All API routes, the data snapshot and all 28 compared files under lib/, data/ and app/api/ are byte-for-byte unchanged from Carely_Offline_Hackathon_Final.zip. Storage, matching, sample isolation and safety guardrails are retained.

## Run and verify
Use Node 22.13+ and pnpm 11.25.0:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run render:build
corepack pnpm run render:start
```

Open http://localhost:3000. The existing portable `pnpm run build` also builds successfully. Use OFFLINE_DEMO.md for the offline setup and medicine-data limitations. This ZIP is source code; it requires installation/build before the first offline use.

The local machine's development watcher hit an open-file limit, so browser QA used the production server. Both production builds and the existing test suite completed successfully. Reduced-motion handling is included in CSS and media-query guards; the OS motion preference was not changed during browser QA.

## Original imagery and prompts
Created with the built-in image generation tool. Project assets are locally served JPEGs, encoded at quality 85 from the generated originals, approximately 776 KB combined. No runtime image service is used.

Final asset paths inside the ZIP:
- `Carely/public/images/editorial/family-moment.jpg`
- `Carely/public/images/editorial/medicine-corner.jpg`

Family photograph prompt:
> Use case: photorealistic-natural. Asset type: original editorial photograph for Carely, an Indian family medicine information website. Create a premium, warm, candid lifestyle photo, landscape 1536x1024 composition: an Indian grandmother in her late 60s with silver hair, wearing a tasteful pale sage cotton sari, and her adult granddaughter in a soft ivory blouse, smiling naturally together at a light oak kitchen table in a bright contemporary Indian home. The granddaughter gently holds a small unbranded medicine carton while listening to her grandmother, not administering medicine. Close medium shot, both people comfortably fill the center-right composition, warm morning window light, subtle real skin texture, elegant campaign photography, gentle film grain, muted cream and sage environment, one small orange marigold arrangement softly blurred in background. Emotion: closeness, agency, everyday family care. Sophisticated magazine aesthetic, natural eye contact between people rather than posed looking at camera. No text, no logos, no visible medicine branding, no medical uniforms, no stethoscopes, no hospital, no diagrams, no watermark. Entire image is a photograph, not a website mockup.

Still-life prompt:
> Use case: product-mockup. Original photographic editorial still life for Carely, a family medicine-information app. Wide landscape 1536x1024. A beautifully arranged small everyday medicine corner at home: two minimal unbranded ivory paper medicine cartons with absolutely no printed text, a neat plain silver blister strip with a few white tablets, rounded tortoiseshell reading glasses, one folded pale sage linen cloth, and a small ceramic cup. Warm cream oak shelf or tabletop in natural afternoon light. Rich subtle tactile paper, foil, linen and ceramic textures, soft shadows, restrained premium health editorial art direction. Background muted light blue-green wall. Subject composition mainly right half, left half airy negative space. Slight top-down 45 degree camera angle, realistic objects, natural imperfections. Not a pharmacy advertisement, no promise of health, no prescription information, no pills scattered, no brands, no logos, no text, no watermark. Beautiful, quiet, sophisticated, reassuring rather than clinical.

Generated artwork illustrates a family-care context. It is not a real patient testimonial, clinical endorsement or depiction of a medicine supplier.
