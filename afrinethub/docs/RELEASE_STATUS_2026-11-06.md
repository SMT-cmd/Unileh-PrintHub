# AfriNet Hub deployment and test record — 2026-11-06

## Source and code
- Source repository: `beek40413-alt/afrinethub`, commit `62bb019b762b2eaed4e83b7a642c77b89de81eb0` (public/read-only in connected primary account).
- Destination: `SMT-cmd/Unileh-PrintHub` branch `feature/afrinethub-platform-20261106`.
- Initial migration commit: `5b8779a530023158d13876f94f275e6c04f4b40a`.
- Existing Unilesh root/site and PR #1 remain separate and untouched.
- Code includes original static service pages, pricing scripts, local JS libraries and original university watermark, alongside new React/Vite homepage.

## Vercel isolated deployment
- Team: KINGSMT, ID `team_wTJ5BJ3cFDmuE4GfFJWAjUFV`.
- Project: `afrinethub`, ID `prj_GU7VD4gMpTe9sE6KOUDHHYkKuC77`.
- Staging deployment: `dpl_AweYFaa8JoKfMXRE8xXku72Qddx8`.
- Staging URL: `https://afrinethub-i19njr74w-kingsmt.vercel.app/` (protected with Vercel authentication).
- Staging access links may be generated through Vercel; do not publish share secrets in this repository.
- `vite build` verified successful in Vercel build logs: `1579 modules transformed`, `built in 2.21s`, state `READY`.
- Temporary standalone Vercel deployment uses GitHub raw URLs for brand assets because the Vercel account has no GitHub login connection. The repository production build uses local public asset files.
- Site is not linked to the live `afrinethub.com.ng` domain.

## HTTP smoke checks (all returned 200)
- /
- /printing/
- /order/
- /gadgets/
- /housing/
- /project/
- /portal/
- /admin/
- /assets/vendor/supabase-2.117.2.js
- /assets/images/icons/secure.svg
- /robots.txt
- /sitemap.xml

## Browser inspection
- Six hero carousel slides verified with next/previous and dot switching.
- New circular approved logo loads and wordmark is visible.
- Primary nav, print order link and service links resolve.
- No obvious text overlaps or broken visible images were observed in the inspected desktop view.
- No transactional forms submitted and no orders created.
- No verified mobile/tablet screenshots available; responsive behavior requires further device-specific tests.

## Limitations and unverified dependencies
1. Production Supabase project `uuuoqexhuwwiwpvqgypy` is not among connected Supabase projects; no production RLS, private storage, payment status or admin role checks could be verified. This prevents full release certification.
2. Vercel does not have a GitHub login connection for the KINGSMT team. The app is deployed from uploaded source files; automatic deploy-on-push not enabled.
3. Connected Cloudflare account does not contain the `afrinethub.com.ng` DNS zone; no safe DNS edit or domain cutover can occur.
4. Only the main homepage is a compiled React implementation; preserved service/admin routes use audited legacy HTML/JS until fully rewritten and tested.
5. Existing live source accepted a plaintext portal password in a remote database column. Staged form collection and admin display are removed. Historical stored values are not known to be deleted; require controlled DB access and retention review.
6. The staging-only OG image URL of certain legacy pages is malformed after GitHub raw URL substitution; canonical metadata in the source repository is correct for intended production hostname, but preview metadata needs final polish.

## Production deployment gate
Do not switch the custom domain, mark financial transactions verified, change live keys, or merge the draft PR until role/data access, order/payments, mobile QA, and DNS management are confirmed.
