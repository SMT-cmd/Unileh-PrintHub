# AfriNet Hub platform rebuild

## Source and ownership
The production site at https://afrinethub.com.ng/ matches public GitHub repository `beek40413-alt/afrinethub` (CNAME and five-service homepage). That repository is read-only to the connected SMT-cmd GitHub installation. This migration carries the working source into SMT-cmd/Unileh-PrintHub, under `afrinethub/`, without altering the existing Unilesh Print Hub files at repository root.

## React application
- Run: `cd afrinethub && npm install && npm run dev`
- Production build: `npm run build`
- Preview locally: `npm run preview`
- Framework: React, Vite, Lucide icons
- Vercel root directory: `afrinethub`
- Brand: approved Africa/network AF RINET HUB logo, round WebP; original UNILESA watermark image copied by matching Git blob SHA from existing Unilesh repo.
- Homepage sections: accessible multi-slide hero, 5 core services, value proposition, how it works, student support links, footer; responsive nav and reduced-motion support.
- SEO: canonical URL, Organization schema, social tags, sitemap, robots excluding private/admin pages.

## Existing service routes retained
The site contains original, independently functional pages for /printing/, /order/, /checkout/, /gadgets/, /housing/, /project/, /portal/, /news/, /partners/, /about/, /privacy/, /terms/, /refund/ and /admin/ (including dashboard). All are copied from the exact source website and built into Vite `dist/` as static resources. The homepage is React; these pages are preserved incrementally while individual React replacements are built, regression-tested, and swapped in. The existing UI is intentionally retained on these routes during migration rather than replacing proven transactional flows with untested rewrites.

## Backend dependencies and safeguards
- The live source uses **Supabase** (project ref `uuuoqexhuwwiwpvqgypy`) for its tables/auth/files and realtime subscriptions, **not** the historical Firebase backend documented in the old README. Do not substitute a different database.
- The connected Supabase accounts do not list the live project at the time of audit. Until it is connected, RLS, private object access, orders, checkout, admin roles, and file deletion **cannot be certified**.
- Portal requests: removed password field, browser submission, and display in the staged frontend. The old DB column is now sent as `null`; historical records remain in the remote DB and require controlled cleanup via authorized database access. Never print or export them.
- Printing checkout is **manual transfer and receipt submission**, not automatic gateway payment verification. Do not show paid status without confirmation.
- Preserve the production domain and DNS until a complete preview test has passed. Never connect a preview build to Global Webstores billing, database, or auth.
- The existing `public/assets/vendor/` JS libraries are mirrored so the current transactional pages do not rely on missing CDNs.
- For image assets, the approved logo and exact university background are included. Other historical images stored in Supabase continue to be referenced from listing data.

## Current release state
This build is a **staging implementation**. Do not represent it as a completed full React conversion or production-certified migration. The source project does not expose verifiable backend admin access through the current connectors. Before live cutover, verify RLS policies, file storage security, order flow with a test document, checkout order retrieval, bank-transfer confirmation status, ads/news, gadgets and housing list visibility, WhatsApp inquiries, and all admin role checks.

## Production checklist
- [ ] `npm run build` succeeds on reviewed branch SHA
- [ ] Responsive visual checks at 360, 390, 768, 1024, 1440 and desktop keyboard navigation
- [ ] Verify all original service URLs and PWA assets
- [ ] Confirm actual Supabase project is accessible and RLS / public storage is safe
- [ ] Test order ID, price calculation, document uploads, receipt uploads and admin order status
- [ ] Verify no new student portal passwords are saved and historical sensitive records are addressed
- [ ] Verify listings, enquiries, news, adverts and partner administration
- [ ] Confirm Vercel target team has no shared Global Webstores project and attach only AfriNet domain
- [ ] Verify domain zone access, snapshot existing DNS, then perform tested switch with rollback
- [ ] Recheck canonical and sitemap URLs after domain cutover
