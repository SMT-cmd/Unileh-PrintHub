# AfriNet / Unilesh redesign — initial source audit (2026-11-06)

## Confirmed repositories
- **SMT-cmd/AfriNetHub-**: a single 50 KB index.html with React 18, ReactDOM and Babel JSX compiled in the browser, Tailwind CDN, Firebase/Cloudinary references, storefront/cart/admin logic. Main repo description: autos and gadgets. It is **already React**, but not a compiled, modular production React app. A plain-text admin passcode appears in the public JavaScript: rotate/remove it and implement real backend/Firebase claim-based access; do not copy it.
- **SMT-cmd/Unileh-PrintHub**: multiple vanilla HTML/CSS/JS pages. CNAME identifies **unilesh.afrinethub.com.ng** (not hafrenethub.com.ng); the README also references unilesaservices.com.ng, which should not be assumed to be the print hub's domain. Hosting configurations exist for Firebase and GitHub Pages. The site can support incremental React migration.

## Existing Unilesh journeys to preserve
Landing; print order uploads (up to three files); B&W / colour price estimate; bank transfer details and receipt upload; checkout via order ID; manual WhatsApp payment notification; student portal assistance; news and announcements; partner directory; public advertisement and feedback inquiries; Firebase admin login and orders/portal requests/ads/announcements/partners dashboard; PWA/manifest; privacy/terms/refund pages.

## Audit blockers — fix before production React cutover
1. **Credential handling:** portal/index.html requests students' campus passwords and inserts portalPassword into Firestore payload. It contradicts the site's privacy statement. Remove the field, stop storing new passwords, review retention of old records, and use official password reset/access guidance.
2. **Firestore access:** firestore.rules uses auth != null as the condition for nearly every admin read/write, and as a catch-all. A normal signed-in Firebase account is not synonymous with an administrator. Tighten rules to a verified UID/custom claim and lock down public order gets; test with the emulator before deployment.
3. **File confidentiality:** assets/js/storageService.js calls Supabase getPublicUrl for uploaded document files, including student material and receipts. Verify bucket access and move to a private bucket with signed access URLs/authorization.
4. **HTML injection risk:** several public and admin routes render Firestore/user data via innerHTML and template strings; switch to React JSX/textContent and allowlist links, then review all remaining admin rendering paths.
5. **Payments:** checkout currently accepts receipt submission and notifies admin on WhatsApp. This is manual verification, not an automatic verified payment gateway; never mark an order paid based only on receipt upload.
6. **Build/deployment:** there is no package-based React build or deployment test in the current Print Hub root. GitHub Pages vs Firebase hosting must be reconciled and all legacy route fallbacks verified.
7. **Content:** remove placeholder gadgets link and broken/zero-byte icon files; review logo, images and university external links.

## Intended art direction
Blue #0A1F44 / #164FCA, orange #FF6B35 and white with restrained neutrals. Custom editorial typography, premium student-focused photography, asymmetric but disciplined grids, structured cards, small purposeful motion, 360px-first navigation, accessible contrast and generous space. Separate visual identities for the wider AfriNet marketplace and Unilesh student print service, united by one design system. Avoid fake testimonials, fake counters, generic glassmorphism, emojis as key icons and AI-style gradients everywhere.

## Staged implementation
1. React + Vite landing preview in react-next/ (not published): responsive art direction and component system.
2. Migrate and validate Firebase data flows and sensitive portal workflow.
3. Rebuild print order, price calculator, file upload and checkout using shared tested services.
4. Rebuild admin dashboard with verified role authorization and safe rendering.
5. Generate/approve/compress photography; test full mobile/tablet/desktop, SEO and accessibility.
6. Build, rehearse preserving custom domain and all routes, then cut over only after acceptance.

Status: **Audit and React landing preview underway. Not deployed.**
