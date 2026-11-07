# Responsive AfriNet Hub homepage — integrated asset map

All nine selected creative assets are stored as optimized JPEGs in `public/assets/images/`. They are **used by the React page**; they are not separate posters or flyers.

| Section | Asset | Layout |
| --- | --- | --- |
| Rotating hero slide 1 | `hero-services.jpg` | Full visual with live HTML headline over safe white space |
| Rotating hero slide 2 and printing card | `service-printing.jpg` | Printing/photocopying |
| Rotating hero slide 3 and gadgets card | `service-gadgets.jpg` | Electronics |
| Rotating hero slide 4 and data card | `service-data.jpg` | Data and airtime |
| Rotating hero slide 5 and housing card | `service-housing.jpg` | Accommodation |
| Rotating hero slide 6 and academic card | `service-project.jpg` | Projects and seminars |
| Why AfriNet Hub? | `connected-services.jpg` | Editorial picture beside trust benefits |
| Campus life | `campus-essentials.jpg` | Assignment/laptop/housing feature image |
| Community/connection | `connected-community.jpg` | Wide editorial banner with real HTML overlay |

The banner copy, service titles, descriptions and buttons remain DOM elements, including the carousel headline. Mobile CSS uses a vertically stacked text + art composition **inside one banner** instead of splitting them into disconnected page sections. The illustrations crop differently at tablet and mobile breakpoints, preserving readable text and tap targets. Existing approved logo, existing University of Ilesa watermark and all legacy transaction routes are retained.

## QA checklist
- Check hero slides at 320/360/390/430px, tablets at 768px, desktop 1024/1440px.
- Confirm headline contrast, image loading, carousel arrows/dots, pause control, no horizontal scroll.
- Confirm five card images, campus image, community image, both CTAs and the footer navigation.
- Preview write operations intentionally blocked: verify design only on Vercel until live Supabase RLS/storage and domain are approved.
