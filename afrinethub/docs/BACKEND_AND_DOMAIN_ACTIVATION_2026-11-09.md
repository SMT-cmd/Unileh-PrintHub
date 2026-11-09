# AfriNet Hub — backend and domain activation ledger
Updated 2026-11-09. **Staging only. No production domain, live data or unrelated project has been changed.**

## Verified connected resources

- React/Vite staging, Vercel project \`afrinethub\`, project ID \`prj_GU7VD4gMpTe9sE6KOUDHHYkKuC77\`.
- Staging design build: \`https://afrinethub-prapugy0c-kingsmt.vercel.app/\`, 15 automated tests passed.
- App source: \`SMT-cmd/Unileh-PrintHub\`, feature branch \`feature/afrinethub-platform-20261106\`, directory \`afrinethub/\`.
- Live legacy site: \`https://afrinethub.com.ng/\`; do not replace/redirect without end-to-end validation.
- **Do not touch** Supabase \`Gwebstore\` (\`enqhdnietkphwgafnmhf\`) or any other active organization's databases.
- Current source files \`public/assets/js/database.js\` and \`public/assets/js/storageService.js\` refer to an older project ref \`uuuoqexhuwwiwpvqgypy\` that is **not listed in the connected Supabase accounts**. This is not a verified, functioning connection. Do not silently redirect its contents.
- Supabase account \`MyRP\`, org \`bgwmmlepgkgkggniquel\`, has the paused unrelated \`MY-RP Development\` project. New project quote: **$0/month**. Creating a dedicated \`Afrinet Hub\` project needs cost-confirmation ID; no account authorization was granted.
- Supabase \`Smart Systems\` org has paused project \`unilesh\` (\`oxyvzcgjracrlyckhent\`). The restore request failed: *administrator/member has already reached the limit of two active free projects*. Its data was not inspected or modified.
- Cloudflare authenticated account \`959b3bd7b4b4280b90b55e9d648a8986\` originally contained \`globalwebstores.com\` and \`slttradehub.trade\` only. We created a new **pending**, empty zone for \`afrinethub.com.ng\`, zone \`d6f5c0e55c146288256c5051901adaa4\`.
- Cloudflare new zone nameservers are \`chip.ns.cloudflare.com\` and \`haley.ns.cloudflare.com\`, but Cloudflare reports **original nameservers** \`denver.ns.cloudflare.com\` and \`vera.ns.cloudflare.com\`. These are from a different Cloudflare configuration. **DO NOT change registrar nameservers or enable the empty zone.** First connect the account holding the active zone, verify all DNS/MX/TXT/CAA records, then plan a no-downtime migration or manage the existing zone.

## Proposed data model

The migration \`supabase/migrations/20261109_000001_afrinethub_initial_secure_schema.sql\` is **prepared only, not executed**. It creates:
- Private orders, portal requests, projects/seminar requests, advertising requests, feedback and administrator mapping.
- Public listings, partners, active adverts, announcements and gadget/housing catalogue.
- RLS on every application table, allowing anonymous creation of customer requests but keeping their data visible only to a provisioned administrator.
- Public reads of published data only; private admin functions have restricted execution privileges.
- A publicly readable media bucket and a private documents/receipts bucket (with **no anonymous storage upload policies**).
- Compatibility RPCs for order numbers and lookup by an opaque UUID; bearer-link privacy and rate limiting must be tested before launch.

**Security-critical remaining tasks:** The current browser-only file-upload service uploads to a public bucket called \`unilesh\` and uses public file URLs. This is inappropriate for customer documents and payment receipts. Replace with short-lived server-signed upload/download URLs, MIME/size checks, UUID-safe paths, retention/deletion, rate limiting and upload authentication. Never embed Supabase secret/service keys in the browser. Do not enable public anonymous storage writes as a shortcut.

## Work needed before a launch or DNS switch

1. Resolve the free-project limit/cost-confirmation requirement and create a dedicated \`Afrinet Hub\` Supabase project with explicit billing acknowledgement (no nonzero charges authorized).
2. Apply and test the migration **only on that new verified project**. Query schema, RLS policies and security advisors. Run anonymous negative tests (cannot SELECT orders, receipts, project and portal requests; cannot upload/delete media).
3. Provision the initial administrator as a Supabase Auth user, and insert their exact auth UUID into \`admin_config\` via trusted backend setup; ensure other signed-in users are denied.
4. Introduce a unified frontend/backend configuration using only the dedicated project's URL and publishable key; update both \`database.js\` and \`storageService.js\` together. Do not expose the service-role key.
5. Replace direct public document uploads with authenticated/signed private storage; validate document preview, receipt upload, price calculation, reference generation, order retrieval, status updates, media creation and cleanup.
6. Add rate limits/CAPTCHA or a protected server submission endpoint for anonymous requests; evaluate personal-data retention, abuse controls, audit logs, and authorization.
7. On an **authorized testing domain** validate full checkout + admin flow end-to-end (without production payments), then independently verify the exact production domain is pointing at the desired application.
8. Confirm who manages the **current** \`denver/vera\` Cloudflare zone and inventory its original DNS records (including MX, SPF, DKIM and DMARC) before *any* DNS transfer or nameserver switch. Keep the old website live until cutover is authorized.
9. Run real-device or viewport-specific visual checks at 320, 390, 768, 1024 and 1440px. Existing automated CSS tests and TinyFish desktop QA are not a substitute.
10. Continue to use no GitHub Actions; use Vercel direct deployment only when configuration and checks are complete.

## Current protection status

The \`.vercel.app\` previews explicitly disable database writes, file uploads and admin dashboard actions. **Do not remove this guard** merely to make staging appear functional. Instead use a dedicated, access-controlled test deployment environment after the backend has been secured.

No database migration, secret insertion, DNS record, registrar nameserver change, checkout order, file upload, or public production deployment has been performed in this backend setup attempt.
