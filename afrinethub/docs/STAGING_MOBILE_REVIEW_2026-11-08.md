# AfriNet Hub mobile banner review — November 8, 2026

## Current reviewed build
- Vercel staging deployment: `dpl_DwxdK3fZqqNdVLEiffQSrG1YRZym`
- Deployment URL: https://afrinethub-928qmy480-kingsmt.vercel.app/
- Stable preview alias: https://afrinethub-kingsmt.vercel.app/
- State: **READY**
- Git source SHA: `32ced67dae8c54876db858ef119db0a0a5da2e99`
- Automated regression tests: **11 passed, 0 failed**.
- Vite bundle compiled and prerendered the React homepage successfully.
- Homepage HTML contains readable headline, all five photographic service cards, trust/campus/community copy and working navigation markup.
- HTTP 200 confirmed for all nine integrated images and the printing, gadgets, housing, project and About pages.
- Staging CSS bundle `/assets/index-DOulCLNp.css` includes the final responsive banner rules.
- The stable preview alias and unique deployment hostname currently return the same HTML/CSS bundle.

## Why an earlier preview was not reliable
A preceding Vercel deployment incorrectly used a stale `src/main.jsx` that omitted `banner-fix.css`, causing an automated test failure. A fresh deployment was built with the **current** GitHub source for `src/main.jsx`, `src/banner-fix.css` and `scripts/quality.test.mjs`. This passed all checks.

## Sharing the protected preview
Vercel SSO protection is enabled in the isolated KINGSMT staging project. The owner can open the project in Vercel, or generate a short-lived `?_vercel_share=...` review link. Review tokens expire, so **do not put a token in repository docs**. If the ChatGPT in-app browser fails to persist preview access, open the complete Vercel share URL in Chrome.

## Not yet verified
A real-device, pixel-level browser review at 320/360/390/768px is still unverified because the connected TinyFish browser-testing wallet has insufficient balance. A passing CSS/regression suite is not a substitute for screenshot QA.

Production stays unchanged: live AfriNet DNS, Supabase, and Global Webstores hosting remain untouched. Do not merge or redirect the live domain until real backend security/order tests and DNS ownership checks pass.
