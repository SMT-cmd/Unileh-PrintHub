# Unilesh Print Hub — React redesign (staging)

A custom, responsive React + Vite **homepage preview** for the existing Unilesh Print Hub. The current public website, print ordering, payment confirmation, portal workflow, news, partner listings and admin dashboard remain untouched by this app until their migrations are tested. This is an **incremental migration**, not a production switch.

## Run
```bash
cd react-next
npm install
cp .env.example .env.local
# Fill the public Firebase web config from ../assets/js/database.js
npm run dev
npm run build
npm run preview
```

For Firebase-connected announcements, adverts and inquiry forms, supply the four public VITE_FIREBASE_* variables. Never add service-role secrets or admin credentials to Vite env variables. Missing Firebase config disables those optional features in preview, rather than showing fake data.

**Route preservation:** Existing /order/, /checkout/, /portal/, /news/, /partners/, /about/, /privacy/, /terms/, /refund/, /admin/ remain the source of truth until their React replacements pass real tests. Local Vite dev serves the homepage; the other links are intended for the eventual root deployment, not a live preview of the legacy flows.

## Image direction
The hero currently uses purposeful CSS artwork (no external image dependency). Replace it with an approved, optimized WebP/AVIF photo after visual review. Candidate imagery: real Nigerian student collecting a bound project in a beautiful navy/orange professional print shop, natural light and ample clean negative space for headline text. Use the same photographic art direction for service, campus assistance and footer sections. Use approved owned/licensed brand images and keep actual logo proportions.

## Publishing criteria
- Preserve and test checkout order ID, upload, receipt, pricing, status, collection and admin journeys.
- Remove student password collection; audit existing sensitive Firestore records for cleanup.
- Validate admin access **by role/UID server-side**, not merely any authenticated user.
- Use private Supabase Storage with authorization/signed URLs for student files.
- Escape/untrust HTML and URL content from ads, announcements, users and orders.
- Test screens at 360, 390, 768, 1024, 1440 px; keyboard, reduced motion, Lighthouse.
- Verify redirect behavior, custom CNAME and hosting build **before** replacing root HTML.
- Avoid GitHub Actions or paid CI for now; run tests locally/with available free tooling.
