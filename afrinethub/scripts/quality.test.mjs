import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFileSync(resolve(root,path),'utf8');

const publicRoutes = [
 'printing','order','checkout','gadgets','housing','project','portal',
 'news','partners','about','privacy','terms','refund','admin','admin/dashboard'
];
test('all preserved service and admin pages are present',()=>{
 for(const page of publicRoutes) {
  const path='public/'+page+'/index.html';
  assert.ok(existsSync(resolve(root,path)),path);
  const html=read(path);
  assert.match(html,/<title>[^<]+<\/title>/,path);
  assert.match(html,/<meta name="viewport"/i,path);
 }
});

test('approved brand and exact university background remain local',()=>{
 assert.ok(existsSync(resolve(root,'public/assets/images/afrinethub-round.webp')));
 assert.ok(existsSync(resolve(root,'public/assets/images/unilesa_background.png')));
 assert.ok(existsSync(resolve(root,'public/assets/images/hero-multiservice.jpg')));
 assert.ok(existsSync(resolve(root,'public/assets/images/hero-printing.jpg')));
 assert.match(read('src/App.jsx'),/afrinethub-round\.webp/);
 assert.match(read('src/App.jsx'),/hero-services\.jpg/);
 assert.match(read('src/App.jsx'),/service-printing\.jpg/);
 assert.match(read('src/styles.css'),/unilesa_background\.png/);
 const css=read('public/assets/css/style.css');
 assert.ok(css.includes("url('../images/unilesa_background.png')"));
 assert.ok(!css.includes('images//assets/images'));
});

test('student portal never asks for, transmits or renders a password',()=>{
 const portal=read('public/portal/index.html');
 const db=read('public/assets/js/database.js');
 const admin=read('public/admin/js/dashboard.js');
 const adminHtml=read('public/admin/dashboard/index.html');
 assert.doesNotMatch(portal,/id=["']portal-pass["']|type=["']password["']|portalPassword\s*:/i);
 assert.match(portal,/never ask for your university portal password/i);
 assert.match(db,/portal_password_plain:\s*null/);
 assert.doesNotMatch(admin,/row\.portal_password_plain|passwordCell/);
 assert.doesNotMatch(adminHtml,/<th>Password<\/th>/i);
});

test('safe legacy mobile navigation is keyboard operable',()=>{
 const script=read('public/assets/js/layout.js');
 const css=read('public/assets/css/modern.css');
 assert.match(script,/id="legacy-main-nav"/);
 assert.match(script,/aria-expanded="false"/);
 assert.match(script,/event\.key === 'Escape'/);
 assert.match(css,/header nav#legacy-main-nav\.is-open/);
});

test('printing pricing regression checks',()=>{
 const context={window:{}};
 vm.runInNewContext(read('public/assets/js/pricing.js'),context);
 const calc=context.window.printPricing.calculatePrintTotal;
 for(const [mode,pages,copies,expected] of [
  ['B&W',1,1,80],['B&W',2,1,150],['B&W',3,1,230],
  ['B&W',1,5,380],['B&W',2,2,300],['Color',1,1,100],
  ['Color',3,2,600]
 ]) {
  assert.equal(calc({printType:mode,pagesInFile:pages,copies}).total,expected,mode+' '+pages+'x'+copies);
 }
});

test('SEO canonical, non-indexed admin and public sitemap',()=>{
 const index=read('index.html');
 const sitemap=read('public/sitemap.xml');
 const robots=read('public/robots.txt');
 assert.match(index,/<link rel="canonical" href="https:\/\/afrinethub\.com\.ng\/"/);
 assert.match(index,/"@type":"Organization"/);
 for(const route of ['printing','gadgets','housing','project','news','about']) {
  assert.ok(sitemap.includes('https://afrinethub.com.ng/'+route+'/'),route);
 }
 assert.match(robots,/Disallow: \/admin\//);
 assert.doesNotMatch(sitemap,/\/admin\/|\/checkout\//);
});

test('staging blocks real orders, uploads and admin edits',()=>{
 const db=read('public/assets/js/database.js');
 const storage=read('public/assets/js/storageService.js');
 const auth=read('public/admin/js/auth.js');
 const dashboard=read('public/admin/js/dashboard.js');
 assert.match(db,/function assertNoPreviewWrites/);
 assert.match(db,/location\.hostname\.endsWith\('\.vercel\.app'\)/);
 assert.match(storage,/Uploads are disabled in this design preview/);
 assert.doesNotMatch(auth,/claimAdminSlot\(/);
 assert.match(auth,/timilehintallest@gmail.com/);
 assert.match(auth,/claim_afrinethub_admin/);
 assert.match(auth,/async function isAuthorizedAdmin/);
 assert.match(dashboard,/Live administration is disabled on this preview link/);
});


test('nine approved promotional images are referenced by real page sections',()=>{
 const images=['hero-services.jpg','connected-services.jpg','campus-essentials.jpg',
 'connected-community.jpg','service-printing.jpg','service-gadgets.jpg',
 'service-data.jpg','service-housing.jpg','service-project.jpg'];
 const app=read('src/App.jsx');
 for(const name of images) {
   assert.ok(existsSync(resolve(root,'public/assets/images/'+name)),name);
   assert.ok(app.includes(name),'Missing rendered image reference: '+name);
 }
 assert.match(app,/className="community-banner"/);
 assert.match(app,/className="service-media"/);
 assert.match(app,/className="campus-image"/);
});

test('brand is tightly grouped, words are correct, and pills removed',()=>{
 const app=read('src/App.jsx');
 const css=read('src/refinement.css');
 const entry=read('src/main.jsx');
 assert.match(app,/We make everyday activities/);
 assert.match(app,/feel a little easier/);
 assert.doesNotMatch(app,/className="hero-kicker"|className="service-number"|className="tile-arrow"/);
 assert.doesNotMatch(app,/className="eyebrow"/);
 assert.match(css,/\.brand-title small/);
 assert.match(css,/\.brand-title small \{[^}]*margin-top:-3px/);
 assert.doesNotMatch(app,/className="hero-overline"/);
 assert.match(entry,/import '\.\/refinement\.css';/);
 assert.doesNotMatch(entry,/import '\.\/banner-fix\.css'|import '\.\/editorial\.css'/);
});

test('responsive text remains on banners with no artificial mobile padding gap',()=>{
 const css=read('src/refinement.css');
 const app=read('src/App.jsx');
 assert.match(css,/\.hero \.hero-art \{position:absolute;inset:0/);
 assert.match(css,/\.hero \.hero-photo-wash/);
 assert.match(css,/@media \(max-width:700px\)/);
 assert.match(css,/@media \(max-width:365px\)/);
 assert.match(css,/\.hero \.hero-content \{position:relative;z-index:3/);
 assert.match(css,/\.services \.service-media::after/);
 assert.match(css,/\.trust \.trust-intro::after/);
 assert.match(css,/\.spotlight \.spotlight-panel::after/);
 assert.match(css,/\.more \.community-banner::after/);
 assert.doesNotMatch(css,/padding-top:calc\(var\(--mobile-hero-art\)/);
 assert.match(app,/className="hero-description"/);
 assert.match(app,/className="btn btn-orange"/);
});

test('all six hero slides have concise useful descriptions and navigation targets',()=>{
 const app=read('src/App.jsx');
 const data=app.slice(app.indexOf('const slides = ['),app.indexOf('];',app.indexOf('const slides = [')));
 assert.equal((data.match(/description:/g)||[]).length,6);
 assert.equal((data.match(/heading:/g)||[]).length,6);
 assert.equal((data.match(/cta:/g)||[]).length,6);
 assert.match(data,/HOUSING & ACCOMMODATION[\s\S]*?description:/);
 assert.match(app,/aria-controls="mobile-nav"/);
});


test('compact readable hero has touch-friendly carousel navigation and fallback images',()=>{
 const app=read('src/App.jsx');
 const css=read('src/refinement.css');
 assert.match(app,/loading="eager"/);
 assert.match(app,/onError=\{event=>/);
 assert.match(css,/min-height:clamp\(328px,90vw,372px\)/);
 assert.match(css,/\.hero \.hero-dots>button::before/);
 assert.match(css,/\.hero \.hero-content h1/);
});


test('interior pages share one responsive design system',()=>{
 const pages=['printing','order','checkout','gadgets','housing','project','portal',
  'news','partners','about','privacy','terms','refund','admin','admin/dashboard'];
 for(const name of pages){
  const html=read('public/'+name+'/index.html');
  const prefix=name==='admin/dashboard'?'../../':'../';
  assert.ok(html.includes('href="'+prefix+'assets/css/interior.css"'),name+' missing shared styles');
  assert.match(html,/<meta name="viewport" content="width=device-width/);
 }
 const css=read('public/assets/css/interior.css');
 assert.match(css,/@media\(max-width:980px\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/scrollbar-width:thin/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/overflow-x:visible!important/);
});
test('shared interior header and mobile printing navigation remain accessible',()=>{
 const js=read('public/assets/js/layout.js');
 assert.match(js,/class="brand-sub">HUB/);
 assert.match(js,/class="legacy-mobile-order"/);
 assert.match(js,/document\.body\.dataset\.legacyPage/);
 assert.match(js,/id="legacy-main-nav"/);
 assert.match(js,/aria-expanded="false"/);
 assert.match(js,/event\.key === 'Escape'/);
 assert.match(js,/https:\/\/wa\.me\/2348083964600/);
});
test('admin and listing pages keep authentic images and safe empty states',()=>{
 const admin=read('public/admin/dashboard/index.html');
 const gadgets=read('public/gadgets/index.html');
 const housing=read('public/housing/index.html');
 assert.match(admin,/afrinethub-round\.webp/);
 assert.doesNotMatch(admin,/assets\/images\/logo\.png/);
 assert.match(gadgets,/service-gadgets\.jpg/);
 assert.match(housing,/service-housing\.jpg/);
 assert.match(gadgets,/No products in this category yet/);
 assert.match(housing,/No listings in this category yet/);
});


test('dedicated Afrinet Hub database client uses only a public publishable key',()=>{
 const db=read('public/assets/js/database.js');
 const storage=read('public/assets/js/storageService.js');
 for(const file of [db,storage]){
  assert.match(file,/https:\/\/soqjthnzyntkhthcnucj\.supabase\.co/);
  assert.match(file,/sb_publishable_/);
  assert.doesNotMatch(file,/uuuoqexhuwwiwpvqgypy|enqhdnietkphwgafnmhf/);
  assert.doesNotMatch(file,/service_role|sb_secret_/);
 }
 const admin=read('public/admin/js/dashboard.js');
 assert.match(admin,/kind: 'public-media'/);
 assert.equal((admin.match(/kind: 'public-media'/g)||[]).length,4);
 assert.match(storage,/PRIVATE_BUCKET_NAME = 'afrinethub-private'/);
 assert.match(storage,/MEDIA_BUCKET_NAME = 'afrinethub-media'/);
 assert.match(storage,/return window.afriBackend.uploadFile\(file,kind\)/);
 assert.match(storage,/if \(kind !== 'public-media'\)/);
 assert.doesNotMatch(storage,/\$\{Date\.now\(\)\}_\$\{file\.name\}/);
});


test('secure customer API requires Turnstile and rate limits before accepting private uploads',()=>{
 const edge=read('supabase/functions/afrinethub-api/index.ts');
 const db=read('public/assets/js/database.js');
 const storage=read('public/assets/js/storageService.js');
 const checkout=read('public/checkout/index.html');
 assert.match(edge,/siteverify/);
 assert.match(edge,/afrinethub_throttle/);
 assert.match(edge,/afrinethub_check_session/);
 assert.match(edge,/afrinethub-private/);
 assert.match(edge,/magicOK/);
 assert.match(edge,/await signedUrl/);
 assert.match(edge,/paymentStatus:'Receipt submitted — awaiting manual verification'/);
 assert.match(db,/humanChallenge\(\)/);
 assert.match(db,/ensureGuestSession/);
 assert.match(db,/apiCall\('order'/);
 assert.match(db,/apiCall\('request'/);
 assert.match(storage,/window.afriBackend.uploadFile/);
 assert.match(checkout,/window.afriBackend.receipt/);
 assert.doesNotMatch(checkout,/supabaseClient\s*\.from\('orders'\)/);
 assert.doesNotMatch(checkout,/\.update\(\{\s*status:\s*'Paid'/);
});
test('administrator verifies transfers and uses signed private-file links',()=>{
 const auth=read('public/admin/js/auth.js');
 const admin=read('public/admin/js/dashboard.js');
 assert.match(auth,/claim_afrinethub_admin/);
 assert.match(auth,/timilehintallest@gmail.com/);
 assert.match(admin,/window.verifyPayment/);
 assert.match(admin,/adminFileUrl/);
 assert.match(admin,/view-private-file/);
 assert.match(admin,/Verify transfer/);
 assert.match(admin,/if \(!\['Paid','Printed','Ready'\]\.includes\(currentStatus\)\)/);
 assert.match(read('api/health.js'),/backendReady/);
});
