# Scope map — verified from actual website and source

**Canonical domain:** https://afrinethub.com.ng/  
**Actual source:** beek40413-alt/afrinethub, SHA 62bb019b762b2eaed4e83b7a642c77b89de81eb0, custom CNAME afrinethub.com.ng.  
**Destination:** SMT-cmd/Unileh-PrintHub / afrinethub/ in a separate feature branch. Source preserved in its original GitHub repo.

| Area | Source routes | Experience |
|---|---|---|
| Home | / | 5 services, multi-service navigation |
| Printing | /printing/, /order/, /checkout/ | 3-file upload, page pricing, manual bank-transfer confirmation |
| Gadgets | /gadgets/ | Phones, laptops, tablets, watches and cars, filters, cart and WhatsApp checkout |
| Data | https://afrinethub.com/ | Separate virtual-top-up platform; link only, preserve separate billing and credentials |
| Housing | /housing/ | Listings/filtering and direct WhatsApp enquiry |
| Academic | /project/ | Quote form and seminar / research assistance |
| Student support | /portal/ | Request workflow; remove password collection |
| Community | /news/, /partners/ | Announcements and partner directory |
| Admin | /admin/, /admin/dashboard/ | Order, portal, project, feedback, adverts, partners, gadgets and housing management |
| Legal | /about/, /privacy/, /terms/, /refund/ | Policy and contact pages |

Existing source code contains both current Supabase implementation and stale Firebase config docs. Never deploy obsolete Firestore security rules as though they govern Supabase. The source repo's GitHub permissions showed no write permission for the connected account. No domain ownership or DNS control is implied by a CNAME file.

**Hosting isolation verified:** Vercel team `smartsystems` was empty at audit time. Global Webstores runs under a different connected account/team `slttradehub-3256`. The connected Cloudflare zone list included only globalwebstores.com and slttradehub.trade, **not afrinethub.com.ng**. No domain DNS writes should be attempted until that zone is added/authorized.

## Brand use
- Use only accepted Africa network logo; no reimagined mark.
- Original `unilesa_background.png` matches SHA `76c1f7cf1949d1caad3408bccbca142b5e956442` in both old and AfriNet source, and is present in the staged public assets.
- Colors: navy `#0A1F44`, orange `#ED701F`, white.
- Hero graphics are interface illustrations, never a baked screenshot or an unverified statement.
- Do not put the owner's portrait on every slide. Use a true original photo only if an approved campaign requires it.
