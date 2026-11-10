# Afrinet Hub — Production launch and verification ledger
Last checked: **2026-11-10 (WAT)**.

## PRODUCTION STATUS — LIVE
- **Main domain:** https://afrinethub.com.ng/
- **www:** https://www.afrinethub.com.ng/ — verified permanent 308 redirect to apex.
- **Vercel project:** `afrinethub` (`prj_GU7VD4gMpTe9sE6KOUDHHYkKuC77`), final production deployment `dpl_73D5c1j2qrtYvDu79wE9K3698346` (`afrinethub-30ux6qbyg-kingsmt.vercel.app`). Build READY.
- **Server health:** https://afrinethub.com.ng/api/health => HTTP 200: `{"ok":true,"service":"Afrinet Hub","backendReady":true,"status":"connected"}`.
- **Automated regression tests:** 19/19 passed, 0 failed, including all secondary pages and classic inline JavaScript syntax checks.
- **No GitHub Actions were run.** All deployments made directly through Vercel from checked files in `SMT-cmd/Unileh-PrintHub`, branch `feature/afrinethub-platform-20261106`, directory `afrinethub/`.

## LIVE CLOUDFLARE DNS — VERIFIED AFTER CUTOVER
The *authoritative* Cloudflare account is **timilehintallest@gmail.com** (account ID `3581c09094b9e87022bb91c4734ba974`, zone `e8abb9f17602cab82dc34900d0c84b0c`). It remains ACTIVE, with original nameservers `denver.ns.cloudflare.com` / `vera.ns.cloudflare.com` — the registrar nameservers were **not** touched.
- Apex A = `76.76.21.21` (DNS-only, Vercel-recommended).
- `www` CNAME = `cname.vercel-dns.com` (DNS-only). Vercel confirms the apex and www domains are correctly configured.
- `unilesh.afrinethub.com.ng` CNAME = `beek40413-alt.github.io` (**preserved**).
- Three MX entries, SPF TXT, DKIM TXT, two Google verification TXT records, Email Routing and the catch-all forward-to-verified-destination setting were **preserved**.
- Removed the duplicate *pending only* Afrinet Hub zone that had been created in the other Cloudflare account. It was non-authoritative and did not affect live DNS.
- No Global Webstores or SLT TradeHub DNS, Supabase or live app data were modified.

## DEDICATED SUPABASE DATABASE — LIVE
- Account organization **MyRP**; isolated project `Afrinet Hub`, ref `soqjthnzyntkhthcnucj`, region `eu-west-1`. Quoted **$0/month** creation cost.
- 11 application tables, **all RLS enabled**, least-privilege public listing reads, private customer-order/request reads, and trusted admin writes.
- Supabase Edge function `afrinethub-api`, `verify_jwt=false` with **per-request authorization, strict Origin checks, Cloudflare Turnstile, hash-scoped guest sessions and rate limiting**. Endpoint runtime health was verified through the production Vercel health probe.
- Cloudflare Turnstile public sitekey `0x4AAAAAAF62eebvoGKdOf2X`; secret stored **encrypted in Supabase Vault**, not in Git/source files or public Vercel environment variables.
- Private student documents and receipts use `afrinethub-private` with server-controlled uploads and short-lived signed links; published marketing media use a separate `afrinethub-media` bucket.
- The guest checkout calculates bundle and colour print prices on the server. Receipt upload **does not mark a transfer paid**; only an approved administrator can verify the bank transfer, then mark the order paid/ready/collected.
- Admin access uses Supabase Auth with a restrictive `claim_afrinethub_admin` function: only a **confirmed** `timilehintallest@gmail.com` user may claim the singleton administrator ID. The owner registration UI is present at `/admin/` with a minimum 12-character password.
- No Supabase service-role key, secret token or private file is embedded in browser code.

## END-TO-END REAL BACKEND TEST — PASSED AND CLEANED
A restricted, short-lived staging harness performed **real Edge API operations** against this dedicated Supabase project:
1. Secure PDF upload to the private bucket returned HTTP 200.
2. Created an order with one two-copy black-and-white page; **server calculated ₦150**.
3. Retrieved the order using its scoped guest session, checked the generated order number.
4. Uploaded a separate private receipt (HTTP 200), associated it with the order and verified `status=Pending`, `paymentStatus=Receipt submitted — awaiting manual verification`.
5. Attempted to delete a document belonging to a submitted order: correctly denied (HTTP 400).
6. Deleted the test order, **both private storage objects**, and the guest session. Verified counts afterward: **0 orders, 0 private storage files, 0 test guest sessions, 0 uploaded-file metadata rows**.

This restricted QA harness exists only on a staging deployment (not in the production source). The production `/api/qa` route returns **HTTP 404**. The temporary guest session was removed, invalidating its access token.

## RESPONSIVE AND ROUTE VERIFICATION
- Production homepage, order, checkout, and administrator routes returned HTTP 200 through Vercel.
- Cloudflare's actual rendered browser check recorded **no horizontal overflow at 320px** on the homepage and **no horizontal overflow at 390px** on the order page.
- Other device-size rendering checks were rate limited by Cloudflare HTTP 429; do not claim all screen widths were browser-verified. Responsive CSS and 19 automated regression tests passed.

## REQUIRED FIRST-TIME ACCOUNT ACTIVATION — UPDATED 2026-11-10
Two independent, approved full-administrator email addresses are supported. Nobody may become a full administrator except the holders of those two verified addresses.

Visit **https://afrinethub.com.ng/admin/**, choose **Administrator Setup**, select the appropriate address, and request a secure one-time email link. AfriNet Hub uses Cloudflare Turnstile and the separately verified Resend sender to email a Supabase Auth link; the recipient follows the link to set their own private password of at least 12 characters and signs in.

The `afrinetnig@gmail.com` account manages Print Staff invitations via the full dashboard's **Print Staff** tab; `timilehintallest@gmail.com` remains a separate full administrator. No primary/secondary labels are shown in the UI. No third full administrator is allowed, but the manager may invite and revoke restricted print operators.

**Activation is not completed by the release itself:** account owners must open their own confirmation emails and set passwords. Do not share passwords or invitation links in public conversations. Signed-in administrator workflows require a real account and a verified payment for full operational testing.

## RECOMMENDED OPERATIONS BEFORE GROWTH
- Set email template and redirect URLs in Supabase Auth settings to `https://afrinethub.com.ng/admin/` if the default signup confirmation redirect does not return to the site.
- Add a data-retention job to prune expired `app_private.guest_sessions`, guest metadata and old rate-limit rows. Guarded private-object cleanup must use Storage API, not a direct SQL delete of object rows.
- Add malware scanning and richer document validation for broader file types if adoption grows.
- Supabase security advisor flags `claim_afrinethub_admin()` as a SECURITY DEFINER function callable by authenticated users. Its SQL checks both the *exact owner email* and confirmed email status, then inserts only if the admin slot is empty. Private-schema tables with RLS and no policies are intentional, not exposed.
- Verify actual owner-administrator login and manual bank-transfer workflow after the owner confirms the account. Automated tests do not substitute for verifying a real bank deposit.

**Production site and secured customer backend are deployed and reachable; identity verification for the first administrator is the one remaining owner-controlled step.**


## 2026-11-10 additional release — two administrators and Google branding

- **New live Vercel production release:** `dpl_3asr1DHLuo2z2o8fwNVe8oeKMkin`, https://afrinethub.com.ng/. All **22/22** automated tests passed, with no failures.
- **Two independent approved administrator identities**, not one. Database migration `exactly_two_verified_administrators` applied to dedicated Supabase project `soqjthnzyntkhthcnucj`.
  - Approved full administration accounts: `timilehintallest@gmail.com` and `afrinetnig@gmail.com` (no rank labels in the site UI).
  - Admin table CHECK constraint permits only `setup` and `brother`, each with a unique Supabase Auth UUID, and the restricted claim function accepts only those two specific *email-confirmed* identities.
  - Updated private RLS role predicate, Supabase Edge function (version 3) and frontend sign-in checks to allow either registered administrator and deny everyone else.
  - Both receive verified secure email links and choose their own private password (minimum 12 characters) through AfriNet Hub. Both account slots remain empty until verified activation.
- **Favicon and logo** generated directly from accepted original 160×160 `afrinethub-round.webp`. Added real `favicon.ico` with 16/32/48 layers, PNG 32, PNG 48, PNG 96, Apple touch PNG 180, Android PNG 192; consistent icon links and web app manifest across homepage and all interior pages.
- **Google branding metadata:** homepage `Organization` logo is original square 160×160 WebP (Google minimum 112×112) plus `WebSite` and `WebPage` JSON-LD. The 48×48 and 96×96 PNG favicons are linked from the homepage.
- **SEO:** robots.txt exposes the sitemap, canonical root URLs, and keeps admin/API blocked. XML sitemap includes 12 publicly indexable canonical marketing/legal pages and real image references. It omits order, checkout and administrator forms. The live sitemap, robots, favicon and all PNG files were verified HTTP 200, with appropriate MIME types. Google indexing/favicon display is **not guaranteed** and may update over several days or weeks; Search Console URL inspection/sitemap submission is recommended.
- **Email delivery update:** the site now uses Resend and Supabase-generated secure verification links for account setup and staff invitations rather than restricted built-in SMTP. The sender domain is verified; real invitation delivery to a specific person must still be exercised after the manager activates their account.
- **No GitHub Actions, nameserver changes, mail-routing changes, or Global Webstores changes.**

## Staff workflow release — 2026-11-10

**Production Vercel deployment:** `dpl_BWCBPg4YcZMGX2MRGCRoFDcXshLE` on https://afrinethub.com.ng/, **26/26** automated tests passed. Supabase Edge function `afrinethub-api` version 6 ACTIVE. Public home, /admin/, /admin/dashboard/, /admin/print/, /favicon.ico, /sitemap.xml, /api/health verified HTTP 200; temporary /api/qa-denials returns 404 in production.

- Only confirmed `afrinetnig@gmail.com` full-administrator identity may send and revoke **Print Staff** invitations.
- Manager opens **/admin/dashboard/** → **Print Staff** → enters a recipient's email. Each invitee receives a Resend email to set their own password and accesses **/admin/print/**. Invitation links are never sent to the browser of the inviting manager.
- Print Staff can list **Paid / Printed / Ready / Collected** print orders without financial amounts or receipt details, download only order-specific printing documents through short-lived private signed URLs, and advance permitted statuses **Paid → Printed → Ready → Collected**.
- Print Staff cannot view other customer requests, receipts, bank-transfer verification, revenues, adverts, products, housing or invite/manage staff. RLS blocks raw order queries, privileged print RPCs are service-role only, and each staff Edge request rechecks verified user identity + active invitation membership.
- Revocation immediately disables subsequent staff API requests. Two full-admin accounts are unchanged.
- Outgoing sender: `notify.afrinethub.com.ng` verified with Resend, sending-only, using a domain-scoped API key held in Supabase Vault. Four distinct DKIM, SPF and return-path records are added to the active Cloudflare zone; existing MX/email forwarding and the separate `unilesh` site unchanged.
- Controlled negative API test confirmed all six unauthenticated routes returned HTTP 400; no customer records or invitations created by that test.
- **Next real-person check:** the manager activates the brother's account from their own email, invites one actual employee, and confirms employee's password setup, print download and statuses. No staff email was provided for immediate invitation, so no invitations were sent.
