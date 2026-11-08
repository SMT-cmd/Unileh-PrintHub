# Mobile banner correction — 8 November 2026

## User-reported issue
User reviewed protected staging on a phone and reported text flowing out of image banners, empty-looking art sections, and headings appearing detached from banners. Review link also became unavailable because Vercel uses temporary protected share links.

## Fix
- Added high-specificity styles to `src/banner-fix.css` for phone, small-phone, tablet and desktop viewports.
- The phone carousel now puts visible live headline, description and buttons first on a navy high-contrast area inside the same photographic banner, followed immediately by the service illustration without an unrelated card or detached text.
- Service cards use full photographic imagery with high-contrast text over the lower image area, better card heights and safe wrapping.
- Trust, campus, and community feature banners use consistent navy reading areas with their images kept in the same single panel.
- Guarded against headline/CTA overflow, narrow viewport controls and button clipping.
- Verified `src/main.jsx` **actually imports** `./banner-fix.css`. An initial manual Vercel upload reused a stale `main.jsx` without this import and failed validation. It was corrected before release.
- The approved logo, original university watermark, source transactional routes and Supabase preview safety gates are unchanged.

## Verified staging release
- Deployment `dpl_FLo7JWfj8H8Hn4tEbZzzkzaW1NWA`
- Protected host `https://afrinethub-qbhkf3a6x-kingsmt.vercel.app/`
- Status **READY** with **11/11** automated checks passing, Vite production build and HTML prerender complete.
- HTTP 200 verified for homepage and new hero photo. Server-rendered homepage includes five image cards.
- Compiled CSS asset `/assets/index-DOulCLNp.css` verified HTTP 200 with the new mobile navy overlay rules and responsive selectors.
- A fresh share link was obtained; Vercel sharing URLs expire and should not be committed to the repository.
- Live browser pixel QA at each viewport was not possible through the connected browser-testing tool due to insufficient account balance; don't claim screenshot-based visual acceptance.

## Production restrictions
- Do not switch the live domain or merge without Supabase access, storage/RLS checks and transaction verification.
- Do not touch Global Webstores or its Vercel project.
- A separate preview is safe for viewing but intentionally blocks write operations.

## Recovery if share link fails
The project uses Vercel Deployment Protection. Open a fresh Vercel share URL including its entire `_vercel_share` query, ideally in an external browser; an ordinary bare deployment URL may ask for Vercel login. For a new link, use the Vercel project/deployment's Share action rather than exposing production.
