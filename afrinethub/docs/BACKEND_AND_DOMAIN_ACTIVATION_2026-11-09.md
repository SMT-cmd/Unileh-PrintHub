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

## ONLY USER-SIDE IDENTITY STEP STILL REQUIRED
**There is currently no registered Supabase Auth user and no populated `admin_config` record.** The site cannot administratively manage live orders until the owner completes first-time registration and email confirmation.

Owner action:
1. Visit **https://afrinethub.com.ng/admin/**.
2. Choose **One-Time Registration**.
3. The approved owner email is fixed as `timilehintallest@gmail.com`. Enter a **new private password of at least 12 characters**.
4. Confirm the email message from Supabase, then sign in. Successful verified sign-in calls the restricted admin-claim RPC and makes the admin dashboard accessible.
5. Verify admin listing/receipt review and bank-transfer verification with an actual authorized account. **Do not paste passwords, login codes or confirmation links into a public chat.**

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
  - Primary `setup` account: `timilehintallest@gmail.com`.
  - Second `brother` account: `afrinetnig@gmail.com`.
  - Admin table CHECK constraint permits only `setup` and `brother`, each with a unique Supabase Auth UUID, and the restricted claim function accepts only those two specific *email-confirmed* identities.
  - Updated private RLS role predicate, Supabase Edge function (version 3) and frontend sign-in checks to allow either registered administrator and deny everyone else.
  - Both choose their own private password (minimum 12 characters) on https://afrinethub.com.ng/admin/ using the selected fixed email, confirm that email, then sign in. **No passwords, OTPs, or account sessions were generated or stored by the release process**. Both admin slots still start empty until the people register.
- **Favicon and logo** generated directly from accepted original 160×160 `afrinethub-round.webp`. Added real `favicon.ico` with 16/32/48 layers, PNG 32, PNG 48, PNG 96, Apple touch PNG 180, Android PNG 192; consistent icon links and web app manifest across homepage and all interior pages.
- **Google branding metadata:** homepage `Organization` logo is original square 160×160 WebP (Google minimum 112×112) plus `WebSite` and `WebPage` JSON-LD. The 48×48 and 96×96 PNG favicons are linked from the homepage.
- **SEO:** robots.txt exposes the sitemap, canonical root URLs, and keeps admin/API blocked. XML sitemap includes 12 publicly indexable canonical marketing/legal pages and real image references. It omits order, checkout and administrator forms. The live sitemap, robots, favicon and all PNG files were verified HTTP 200, with appropriate MIME types. Google indexing/favicon display is **not guaranteed** and may update over several days or weeks; Search Console URL inspection/sitemap submission is recommended.
- **Supabase Auth email delivery caveat:** newly created free projects using built-in SMTP can only email addresses on the Supabase organization team, with a low rate limit. If either administrator receives `email_address_not_authorized`, configure custom SMTP in Supabase Authentication or authorize delivery through appropriate verified SMTP setup. Do not bypass email confirmation or add broad administrator access merely to fix email.
- **No GitHub Actions, nameserver changes, mail-routing changes, or Global Webstores changes.**
