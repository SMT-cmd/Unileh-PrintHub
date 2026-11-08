# AfriNet Hub — November 7, 2026 staging release status

## Status
**Staging deployed and verified, NOT production-certified.**

- Current feature branch: `feature/afrinethub-platform-20261106`
- Feature code before this note: `769f23eff8e27524cff873b7d51c4d4623ea7519`
- Original repository (live site source): `beek40413-alt/afrinethub`
- Writable destination: `SMT-cmd/Unileh-PrintHub`, isolated `afrinethub/` folder
- Draft PR #2: https://github.com/SMT-cmd/Unileh-PrintHub/pull/2
- Original main branch checked and preserved: `8358dfb33a689c62cd2df8117a19a3e52e601852`

## Vercel
- Separate target account/team: KINGSMT `team_wTJ5BJ3cFDmuE4GfFJWAjUFV`, **not** the Global Webstores team.
- Project: `afrinethub` / `prj_GU7VD4gMpTe9sE6KOUDHHYkKuC77`.
- Latest verified staged deployment: `dpl_H3C6hHYz98UH89Fh3zs9pS1CZbks`
- Protected staging: https://afrinethub-loijp59qu-kingsmt.vercel.app/
- Deployment state: **READY**. Vite production bundle built and React HTML prerender completed.
- Manual source-file deployment; GitHub login connection is missing in KINGSMT, so automatic deploy-on-push is not active.
- **Custom domain not attached.** The current afrinethub.com.ng production site has not been changed.

## User-visible improvements completed
- Accepted AfriNet Hub Africa-network logo, round WebP.
- Exact existing University of Ilesa watermark binary retained and corrected in legacy CSS.
- Six-slide homepage carousel; image-only, optimized hero photographs are integrated for multi-service and printing slides. Other four slides use separate decorative 3D-style CSS compositions, avoiding repetition.
- Main React homepage: responsive nav, readable real HTML headlines/buttons, services, steps, trust, students, support, footer, animation opt-outs.
- Cropped the authentic portrait within the About layout without altering face or complexion.
- Real HTML prerender for crawlable homepage copy, canonical metadata, social image, Organization JSON-LD, robots.txt, sitemap.xml, and relevant page canonical tags.
- Standardized branding and compact mobile menu across retained original service pages.
- Updated About page presents the complete multi-service business and uses ONE authentic owner-supplied portrait. No invented identity/name or owner portrait in all slides.
- Readable responsive cards, native navigation, simple business-facing words.

## Original workflows preserved in separate legacy pages
- Printing, order details, manual-transfer checkout
- Gadgets and listing enquiries
- Housing enquiries
- Projects/seminars
- Student portal assistance
- News, partner directory, privacy, terms and refund pages
- Staff authentication and dashboard
- Separate data/airtime link: https://afrinethub.com/ (do not merge payment systems until authorized).

The service and admin pages remain HTML/JS using Supabase. **The homepage is React, not yet every route.** The source was preserved intentionally; a complete React replacement for all transactional/admin workflows still needs real backend access and regression testing.

## Safety changes
- Student portal password field and password submission removed; admin no longer displays any stored password field.
- Browser-side administrator sign-up and automatic admin-slot claiming disabled. The admin dashboard waits for an exact UID match in `admin_config` before loading records.
- Staging `.vercel.app` previews reject record creation, uploads and file deletion, and prevent live admin edits.
- Payment flow remains manual transfer with receipt; never label funds paid without confirmation.
- Source legacy storage still uses `getPublicUrl` for some uploaded documents/receipts. Treat this as a high-priority privacy blocker requiring authorized Supabase access for private bucket migration and signed URLs.

## Verified staging URLs
Each returned HTTP 200 at the newest staged deployment:
- `/` (server-rendered services and real hero image references verified)
- `/about/` (new copy and owner portrait reference verified)
- `/assets/images/afrinethub-owner.jpg`
- `/assets/images/hero-multiservice.jpg`
- `/assets/images/hero-printing.jpg`
- `/portal/` (no password field)
- `/admin/` (public signup hidden/disabled)
- `/assets/js/database.js` (preview write guard present)

Earlier version also returned HTTP 200 for printing, order, gadgets, housing, project, partners and sitemap. Latest versions of those routes inherit the same source files, but full transactional browser tests were **not** performed. A prior browser review confirmed carousel navigation and no obvious desktop layout overlap; new photography and About portrait still require cross-device visual acceptance tests.

## Production release blockers (do not bypass)
1. Live Supabase project ref `uuuoqexhuwwiwpvqgypy` is absent from current connected Supabase accounts. Verify RLS, admin UID policy, private document storage, orders, receipt verification and historical sensitive data cleanup before production.
2. The authoritative Cloudflare nameservers of `afrinethub.com.ng` are **vera.ns.cloudflare.com** and **denver.ns.cloudflare.com** (read-only Vercel DNS config). The connected Cloudflare account only exposes zones `globalwebstores.com` and `slttradehub.trade`. Connect the actual AfriNet Cloudflare zone; do not create a duplicate zone or replace unrelated DNS.
3. KINGSMT Vercel account needs GitHub login connection to the intended source repository; otherwise deployments stay manual.
4. Full React conversion for service forms/admin, live order/payment/storage regression, and real 360px/390px/tablet/desktop keyboard and visual checks are unfinished.
5. Production asset delivery should be from local domain, not the temporary GitHub raw URLs used by manual Vercel staging.

## Safety of current domains
Global Webstores hosting and DNS untouched. AfriNet live domain untouched. Original source repo untouched. No production Supabase data changed. PR #2 remains draft and unmerged. Do not switch DNS until live service and security checks pass.


## November 7: responsive imagery and live staging QA

- Integrated **9 previously generated user-selected images** into the actual React website, not external flyers: 6 hero slides use image art, 5 service cards have distinct photos, and the trust/campus/community sections show supporting images.
- Updated the hero so copy and CTA remain **inside the same banner** as the image. Desktop layers HTML copy on the left over a soft contrast wash; mobile/tablet stack the live text and art within one card with size-dependent image cropping.
- Added `src/editorial.css` with art-directed breakpoints at 1180, 980, 700, 600 and 370px, plus 5 separate card images and a responsive campus panel.
- All images are optimized JPEG renditions, approximately 70–125 KB each, hosted locally inside the Vercel deployment and tracked in the same Git branch.
- React renders all hero headings, descriptions and call-to-action links as HTML. No banner text is baked into an image.
- New documentation: `docs/HOMEPAGE_VISUAL_ASSETS.md`.
- Latest **staging** release: `dpl_3xFfwhABvEzvyXtLdtxTC3UGUNV2`, READY at `https://afrinethub-6tgkwuftc-kingsmt.vercel.app/`.
- Verified Vercel build: `npm run test && vite build && node scripts/prerender.mjs`. **8/8 tests passing, 0 failing**; prerender completed.
- Verified HTTP 200 for homepage, printing, order, checkout, gadgets, housing, project, portal, news, partners, About, sitemap, robots, all nine images, approved round logo and university background.
- Homepage HTTP confirms 5 image cards, hero HTML text, campus and community image references.
- Live browser-based device screenshot QA was **not** completed because the third-party browser service account lacks credit; do not describe pixel-perfect mobile/tablet testing as verified.
- Production DNS/Supabase access and full legacy-to-React conversion remain outstanding. Do **not** repoint `afrinethub.com.ng` or enable staging transactions.

The original main branch, Global Webstores infrastructure, and live AfriNet domain remain unchanged.


## November 8, 2026 — banner overflow and missing text fix

**Staging-only visual release**: `dpl_GgtLcfSYLn1AL3pCmq5NBenhk1nT` (READY), https://afrinethub-1a21xfn5r-kingsmt.vercel.app/ .

The prior version stacked images outside their associated words on mobile, and five service illustrations were displayed in blank-looking images above separate text cards. The correction is implemented in `src/banner-fix.css` (loaded last in `src/main.jsx`):

- **Hero carousel (all six slides):** image and real HTML headline, description, service CTA and WhatsApp CTA now live inside one responsive banner. Desktop shows a readable left-aligned contrast wash. Mobile shows landscape art top with headline placed in the fading lower section of the *same banner*; no separate art block or fixed-width text.
- **Five service cards:** titles, descriptions and CTAs are actually overlaid on each image with a dark gradient for contrast. Card banners are no longer empty artwork with copy below.
- **Why AfriNet Hub:** image and “We make the everyday feel a little easier” headline share one banner. Three benefit cards retain their text.
- **Campus-life:** “Your assignments / Your next laptop / Your next place” and both CTA links appear within the same image banner; original University of Ilesa watermark remains.
- **Community:** “Good things happen when we connect” and its description share one image banner.
- **Final CTA:** tasteful full-width artwork now appears behind the readable closing message.
- Long headings can wrap; button labels wrap; min-width and max-width safeguards prevent clipping. Responsive overrides cover phones <=365 and <=650px, tablets <=980px, and desktop layouts.
- Landscape art is kept in a top-height window on small phones to stop severe portrait cropping; all text remains real accessible HTML.

**Verification:** Vercel production-style React build/prerender READY with **9/9 Node regression tests passing**. HTML and generated CSS returned HTTP 200 and contain the correct hero headline, five image cards, campus/community wording, absolute art positioning and mobile text rules. The existing printing page and hero artwork returned HTTP 200 in the final deployment.

**Limitations:** This does NOT certify pixel-perfect browser screenshots at every physical device size. The connected third-party browser session cannot run because of insufficient balance, so cross-device screenshot inspection remains a manual acceptance item. Live database/admin/payment and DNS production blockers from previous release notes remain unchanged. No changes were made to `afrinethub.com.ng`, original Unilesh main, or Global Webstores.
