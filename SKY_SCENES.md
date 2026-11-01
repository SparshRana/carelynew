# Carely — light-only sky-blue character scenes

This release supersedes the previous editorial light/dark design. Dark mode, the header switch and automatic device-theme selection are removed. Previously saved dark preferences are ignored without touching cabinet records.

## What is implemented
- A light sky-blue family world, two original illustrated family characters, a CSS-built dimensional phone, and an original teal river-otter mascot. No Alan characters, logos, videos, screenshots or ratings were copied.
- On desktop, normal vertical scrolling controls a persistent phone's rotation/lift, three screen crossfades, character transitions, explanation text and blue/aqua/pale-blue backgrounds. The page does not intercept wheel events or lock scrolling. Arrows and numbered scene controls provide another way through the story.
- On mobile, the scene stays in normal page flow. Use arrows or swipe horizontally to change scenes; vertical gestures continue scrolling the page. All important information is outside the decorative phone and remains readable.
- Reduced-motion preferences disable continuous character/card motion and use static selectable scenes instead of the pinned scroll timeline.
- The mascot section has floating feature cards describing existing capabilities. There are no fabricated testimonials, user ratings, or clinical claims.
- The phone is an explicitly fictional interface illustration, with no patient data. It is not a second working app embedded in the page. The real buttons open the existing cabinet, sample medicine details and quality records.
- The cabinet, matching, medicine data, API routes and safety guardrails remain intact. Optional cloud/AI and voice setup requirements are unchanged.
- A small modal focus-restoration fix avoids moving the page when a dialog closes.

## Run

Use Node 22.13+ and pnpm 11.25.0:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run render:build
corepack pnpm run render:start
```

Open http://localhost:3000. The portable `pnpm run build` workflow is retained. Initial dependency installation requires internet; the cabinet demo and bundled records need no external API. Open once and wait for the cache-ready message in Demo studio before presenting offline. The current cache version is `carely-sky-v3`; navigation fallback reads that version explicitly. Read OFFLINE_DEMO.md for the medicine-data, price and local Hindi voice limits.

## Artwork

Generated using the built-in image generation tool, inspected, then encoded as WebP with preserved alpha transparency. Three runtime assets total about 670 KB. No image processing or generation service is called by the website.

Saved asset paths inside the source ZIP:
- Carely/public/images/sky/grandmother.webp
- Carely/public/images/sky/daughter.webp
- Carely/public/images/sky/otter.webp

Generation prompts:

**Grandmother:** An original high-end 3D clay character cutout for Carely, an Indian family medicine-information website. A warm, dignified Indian grandmother age 68, silver hair in a low bun, subtle round coral glasses, cream kurta with pale teal shawl and soft blue trousers, sensible cream shoes. Full body seated on a simple rounded pale peach armchair, smiling gently, holding a small completely blank ivory medicine carton and looking slightly towards the right. Polished dimensional materials, soft tactile fabric, delicate realistic shadows on objects, kind expressive face, sophisticated miniature animated film aesthetic, not a flat illustration. Three-quarter view, entire chair and feet visible, centered with room around edges. Transparent background, no floor or environment, no sky. No text, no logos, no watermarks, no brand-specific character, no bear. Make face and hands anatomically coherent, two arms and two hands only. Lighting soft warm studio light from upper left. This is a standalone website scene layer, not a website screenshot.

**Daughter:** Original premium 3D clay character cutout for Carely, Indian family medicine information website. One caring Indian daughter age 30, shoulder-length dark wavy hair, warm peach cardigan over ivory blouse, sage trousers and cream sneakers, sitting on a small rounded mint ottoman. Holding a plain teal smartphone in her right hand and smiling towards the left; left hand rests naturally in lap. Full body including entire ottoman and shoes. Warm sophisticated animated-film character design with polished tactile fabric and gently rounded proportions, coherent realistic hands, soft studio lighting, subtle material depth. Centered standalone cutout on genuine transparent background. No floor, scenery, text, logos, watermarks, medicine advice or other people. Original character, no resemblance to existing branded mascots.

**Daughter cutout cleanup:** Edit this character cutout only to remove ALL background, coloured halo, mist and ground shadow surrounding the character. Keep the exact same woman, face, hair, clothes, phone, seated pose, ottoman and shoes unchanged. The background right up to hair, shoes, clothes and ottoman must be genuinely fully transparent. No added background or soft vignette. Preserve character material lighting and texture. Output a clean isolated character+ottoman with alpha transparency for compositing on a sky-blue website.

**Otter:** An original premium 3D mascot cutout for Carely, a friendly healthcare information website. A small adorable upright river otter with smooth velvety muted teal fur, cream belly and muzzle, tiny rounded ears, expressive dark brown eyes and a small brown nose, short rounded tail visible at side. One paw raised in a welcoming wave, other paw holds a tiny completely blank ivory medicine carton. Full body, elegant soft tactile 3D rendering, sophisticated family friendly animated-film quality, warm light from upper left, soft highlights and coherent anatomy. Character centered and completely visible. Genuine transparent background, no floor, no scenery, no text or logos or watermark. Distinctive original river otter design, NOT a bear, NOT purple, no resemblance to Alan's mascot. Intended as an animated layered website asset, not a website UI mockup.

These are layered 3D-style rendered assets animated with CSS and scroll-driven transforms, not rigged WebGL characters. The removed global capsule canvas is no longer rendered, so the new visual presentation does not load an extra continuous WebGL scene.
