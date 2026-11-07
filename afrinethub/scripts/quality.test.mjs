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
 assert.match(read('src/App.jsx'),/afrinethub-round\.webp/);
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
