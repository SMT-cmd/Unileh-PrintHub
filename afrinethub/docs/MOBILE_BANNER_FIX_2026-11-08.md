# Mobile banner alignment and review access — 2026-11-08

## Reported defects
- Review link became inaccessible after the protected Vercel sharing URL expired.
- On phones, banner headings/CTA did not visibly sit on the image composition and some large images looked like empty banners.
- Existing mobile styles were not present in the previously published Vercel source tree.

## Corrective changes
- Included `src/banner-fix.css` **after** the base and editorial styles in `src/main.jsx`.
- Added last-in-cascade mobile overrides to keep all six hero slides inside one branded banner with a photographic upper region and live white text on a dark navy lower overlay, including buttons and accessible carousel controls.
- Protected long headings using content-driven height, `overflow-wrap:anywhere`, responsive type and safe full-width tap targets. No hard-coded banner height clips paragraphs on small phones.
- Kept five service photos and their matching visible headings and CTA together in image-overlaid cards.
- Merged trust, campus-life and community artwork with corresponding live headings in the same responsive panel.
- Aligned top media region to the image fade using `--mobile-hero-art` and `--mobile-feature-art` instead of percentages of variable-height cards, making the pictures more visible.
- Covered phone widths including <=365px, <=650px and intermediate 651–1080px viewports.
- No change to live domains, production databases or Global Webstores.

## Build / staging verification
- Feature branch latest CSS fix: `87a3e19cc2ce42ac5e70edd11b64fdf90edb5863`, followed by this evidence update.
- Isolated KINGSMT Vercel staged deployment: `dpl_E35RpNmJcHYC7n5X7rgCF5pm1Lxw`.
- Preview: `https://afrinethub-gtgcgknjg-kingsmt.vercel.app/` (protected, share links expire).
- Deployment status: **READY**.
- `npm run test && vite build && node scripts/prerender.mjs`: **11 passed, 0 failed**; JS bundle and crawlable HTML generated.
- Homepage and compiled CSS served HTTP 200. Bundle contains mobile banner variables / breakpoint styles. All nine integrated images returned HTTP 200.
- User-visible linked staging preview is separate from live `afrinethub.com.ng` domain.

## Still outstanding
- Visual screenshot-based acceptance at 320/360/390/430/768/1024px was not available in this connected browser session. No claim of pixel-perfect cross-device sign-off.
- Previous release blockers remain: production Supabase authorization/RLS/storage, full migration of legacy HTML/JS transactions and admin pages to React, Cloudflare access to authoritative AfriNet DNS, and Vercel GitHub automation connection.
- Do not merge the draft PR or switch production DNS until those are complete.
