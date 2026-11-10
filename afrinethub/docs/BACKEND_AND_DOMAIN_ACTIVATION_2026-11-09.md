# Afrinet Hub — verified Supabase & Cloudflare setup
Updated 2026-11-10. This is a **verified status ledger** and an explicit hold on unsafe production operations.

## Dedicated database — DONE
- User authorized the free ($0/month quote) Supabase project creation.
- Separate Supabase organization: **MyRP**; fresh project: **Afrinet Hub**, ref `soqjthnzyntkhthcnucj`, region **eu-west-1**, status **ACTIVE_HEALTHY**.
- The unrelated **Global Webstores**, **SLT TradeHub**, and old paused **unilesh** projects were **not modified**.
- Two tracked migrations successfully applied:
  1. `afrinethub_initial_secure_schema` (11 app tables, all with RLS; 47 initial policies; admin mapping; private/public storage buckets).
  2. `harden_order_numbers_and_admin_media` (non-privileged random order-number RPC; PDF support for published admin media).
- Verified: 11/11 app tables have RLS; all initially contain zero rows. Anonymous role has INSERT but not SELECT on orders, portal and project requests. Anonymous INSERT on project requests succeeded in a rollback-only transaction; 0 test rows remained.
- Storage buckets: `afrinethub-private` (not publicly readable; **no anonymous upload policy**) and `afrinethub-media` (public marketing media, writes restricted to authenticated approved administrator).
- Verified RPC `generate_order_number` returns a unique-style order reference and no longer runs SECURITY DEFINER.
- **Security advisor still warns** about `get_order_by_id(uuid)`, the intentional guest checkout bearer-UUID lookup using SECURITY DEFINER. Before public orders launch, replace it with a rate-limited, authenticated/token-verified server endpoint and remove its public grant. This is **not fully certified**.
- Service-role keys were **not retrieved, printed, committed or embedded** anywhere.

## Frontend / Vercel — CONNECTED ON STAGING
- Existing repository: `SMT-cmd/Unileh-PrintHub`, branch `feature/afrinethub-platform-20261106`, directory `afrinethub/`.
- `public/assets/js/database.js` and `public/assets/js/storageService.js` both use the new project's URL and **publishable** key (not secret/service-role key). All four public-media uploads in the admin JS use `{kind:'public-media'}`.
- Vercel project `prj_GU7VD4gMpTe9sE6KOUDHHYkKuC77` has public environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for preview, development and production.
- Latest staged direct deployment: **https://afrinethub-qj24wrwsl-kingsmt.vercel.app/**; deployment `dpl_9VDKoeZ1aMdqjDsVAHizEWEsd6ia`, **READY**, automated tests **16 pass / 0 fail**; homepage and sample inner pages returned HTTP 200 on direct URL verification.
- Preview explicitly blocks form/database writes, uploads, and live admin actions. **Do not lift that guard** until secure upload, administration, and submission safeguards have been tested.
- Customer document/receipt uploads are now *fail-closed*: they will not be misrouted to the public-media bucket. The private signed-upload flow must be implemented and tested; **customer uploads are not yet functional on the new backend**.

## Vercel domain attachment — DONE, traffic switch NOT DONE
- Vercel project now includes `afrinethub.com.ng` and `www.afrinethub.com.ng` (www redirects to apex with 308). Vercel reports both as **verified ownership**.
- Vercel **still reports the domain as misconfigured** because public DNS does not point to Vercel. Attaching a Vercel domain is not the same as routing public visitors.
- The old live site at `https://afrinethub.com.ng/` has not been overwritten.

## Cloudflare — PREPARED, ZONE STILL PENDING
- Connected Cloudflare account: `959b3bd7b4b4280b90b55e9d648a8986`.
- New pending zone `d6f5c0e55c146288256c5051901adaa4`, intended domain `afrinethub.com.ng`, assigned NS **chip.ns.cloudflare.com** and **haley.ns.cloudflare.com**.
- Current **authoritative** nameservers are still **denver.ns.cloudflare.com** and **vera.ns.cloudflare.com**, controlled from a *different Cloudflare account/zone not accessible via the connected account*.
- In the inactive new zone, **8 records were staged**, based on authoritative public DNS inventory and Vercel's own recommended values: apex A `76.76.21.21`, www CNAME `cname.vercel-dns.com`, 3 existing Cloudflare Email Routing MX entries (priorities 39/50/80), existing SPF TXT and two existing Google verification TXT values. Apex/www records are DNS-only (no double proxy). None affects current public traffic while the zone is pending.
- **Do not change registrar nameservers now.** Cloudflare Email Routing forwarding rules and verified destination addresses live in the *old Cloudflare account* and **will not transfer by just copying MX records**. Some less-obvious subdomain DNS records may also exist. Connect the account owning the denver/vera zone, audit routing rules and entire DNS zone, and perform an approved no-downtime cutover.
- Do not add the new zone's assigned nameservers to registrar or activate the incomplete email-routing setup before that check.

## Unfinished launch blockers — treat as mandatory
1. **Administrator provisioning:** the dedicated Supabase project has no approved administrator record yet. Provision an Auth user through a trusted route and insert its exact user UUID into `admin_config`; verify non-admin denial.
2. **Private customer file uploads:** implement server-signed private uploads, short-lived admin/customer read links, ownership checks, file retention/deletion, MIME/size validation, origin controls, per-IP throttling/Turnstile and malware handling. Do not expose documents or payment receipts in the public bucket.
3. **Public submission abuse controls:** replace open direct anonymous database inserts / order lookup with a protected rate-limited server workflow. Current RLS prevents reading other customers' orders but *does not block spam*.
4. **Payment/checkout:** verify the new database workflow, UUID secrecy, pricing totals, receipt capture, admin statuses and WhatsApp notification end-to-end.
5. **Domain migration:** connect the *existing* authoritative Cloudflare account, inventory email routing and all DNS records, confirm Vercel deployment is production-safe, then cut over. New pending zone's records alone do not make the domain live on Vercel.
6. **Mobile QA:** browser emulation for 320/390/768px not completed. TinyFish account reports insufficient wallet for the fresh post-backend smoke test; Vercel direct HTTP and 16 automated source tests passed instead.

## Safety decisions
- The production website, its authoritative DNS, registrar nameservers, and existing email routing **have not been changed**.
- No paid Supabase project plan, Cloudflare upgrade, GitHub Actions, or service-role key exposure was used.
- No actual customer payments, files, or administrative data were created.
- **Status: backend schema deployed, frontend configured on staging, domain staged but not switched, end-to-end launch NOT complete.**
