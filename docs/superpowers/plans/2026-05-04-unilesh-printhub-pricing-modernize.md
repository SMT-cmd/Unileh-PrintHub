# Unilesh PrintHub Pricing + Modern UI Implementation Plan
 
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
 
**Goal:** Update printing prices (B/W bundle ₦80/₦150, Color ₦100/page), modernize visuals site-wide (Minimal + Premium), and fix broken paths/assets so pages load cleanly.
 
**Architecture:** Keep the project as static HTML/CSS/JS. Centralize pricing in a small `assets/js/pricing.js` utility exposed on `window` so `order/` can reuse it. Add a new `assets/css/modern.css` that overrides/extends existing `assets/css/style.css` without rewriting the whole stylesheet.
 
**Tech Stack:** Static HTML, vanilla JS, Firebase (via CDN modules), Supabase SDK (via CDN), CSS.
 
---
 
## File Map (What Changes Where)
 
**Create**
- `assets/js/pricing.js` — pricing functions for B/W bundle + color flat pricing (exposed on `window`)
- `assets/css/modern.css` — Minimal+Premium visual polish overrides (cards, forms, buttons, layout, typography)
- `assets/css/checkout.css` — missing file referenced by `checkout/index.html` (checkout-specific layout + uses shared tokens)
- `docs/superpowers/plans/2026-05-04-unilesh-printhub-pricing-modernize.md` — this plan
 
**Modify**
- `order/index.html` — update UI labels and calculation logic to use `pricing.js`
- `index.html` — include modern CSS
- `about/index.html` — include modern CSS
- `admin/index.html` — include modern CSS (admin login page)
- `admin/dashboard/index.html` — include modern CSS (admin dashboard page)
- `checkout/index.html` — keep `checkout.css` link (now exists) and include modern CSS
- `news/index.html` — include modern CSS
- `partners/index.html` — include modern CSS
- `portal/index.html` — include modern CSS
- `privacy/index.html` — include modern CSS
- `refund/index.html` — include modern CSS
- `terms/index.html` — include modern CSS
 
---
 
### Task 1: Add Pricing Utility (B/W Bundle + Color Flat)
 
**Files:**
- Create: `assets/js/pricing.js`
 
- [ ] **Step 1: Create `pricing.js`**
 
```js
(function () {
  function calcBwBundle(totalPagesPrinted) {
    const n = Math.max(0, Math.floor(Number(totalPagesPrinted) || 0));
    const pairs = Math.floor(n / 2);
    const remainder = n % 2;
    return {
      total: pairs * 150 + remainder * 80,
      pairs,
      remainder
    };
  }
 
  function calcColor(totalPagesPrinted) {
    const n = Math.max(0, Math.floor(Number(totalPagesPrinted) || 0));
    return { total: n * 100, pages: n };
  }
 
  function calculatePrintTotal({ printType, pagesInFile, copies }) {
    const pages = Math.max(1, Math.floor(Number(pagesInFile) || 1));
    const cps = Math.max(1, Math.floor(Number(copies) || 1));
    const totalPagesPrinted = pages * cps;
 
    if (String(printType).toLowerCase() === "color") {
      const result = calcColor(totalPagesPrinted);
      return {
        total: result.total,
        totalPagesPrinted,
        breakdownLabel: `₦100 × ${totalPagesPrinted} pages`
      };
    }
 
    const result = calcBwBundle(totalPagesPrinted);
    const bundleLabel = result.pairs > 0
      ? `(${result.pairs} × ₦150 bundle${result.pairs === 1 ? "" : "s"}${result.remainder ? ` + ₦80` : ""})`
      : `₦80`;
 
    return {
      total: result.total,
      totalPagesPrinted,
      breakdownLabel: `${bundleLabel} for ${totalPagesPrinted} page${totalPagesPrinted === 1 ? "" : "s"}`
    };
  }
 
  window.printPricing = {
    calculatePrintTotal
  };
})();
```
 
- [ ] **Step 2: Quick verification via Node**
 
Run:
```bash
node - <<'NODE'
global.window = {};
require('/workspace/Unileh-PrintHub/assets/js/pricing.js');
const calc = window.printPricing.calculatePrintTotal;
const bw = (pages, copies) => calc({ printType: 'B&W', pagesInFile: pages, copies }).total;
const color = (pages, copies) => calc({ printType: 'Color', pagesInFile: pages, copies }).total;
 
if (bw(1,1) !== 80) throw new Error('B/W 1 page should be 80');
if (bw(2,1) !== 150) throw new Error('B/W 2 pages should be 150');
if (bw(3,1) !== 230) throw new Error('B/W 3 pages should be 230');
if (bw(2,2) !== 300) throw new Error('B/W 4 pages should be 300');
if (color(1,1) !== 100) throw new Error('Color 1 page should be 100');
if (color(3,2) !== 600) throw new Error('Color 6 pages should be 600');
console.log('ok');
NODE
```
 
Expected output:
```text
ok
```
 
---
 
### Task 2: Update Order Page Pricing UI + Calculation
 
**Files:**
- Modify: `order/index.html`
 
- [ ] **Step 1: Update the dropdown labels (UI text)**
 
Replace:
```html
<option value="B&W">Black & White (₦20/page)</option>
<option value="Color">Color (₦50/page)</option>
```
 
With:
```html
<option value="B&W">Black & White (₦80 for 1 page, ₦150 for 2 pages)</option>
<option value="Color">Color (₦100/page)</option>
```
 
- [ ] **Step 2: Load `pricing.js` on the order page**
 
Add this script tag before the inline `<script type="module">` block:
```html
<script src="../assets/js/pricing.js?v=pricing_v1"></script>
```
 
- [ ] **Step 3: Remove old per-page constants and switch to `window.printPricing`**
 
Inside the inline module script in `order/index.html`, delete:
```js
const BW_PRICE = 20;
const COLOR_PRICE = 50;
```
 
Then replace the `calculatePrice` function with:
```js
const calculatePrice = () => {
  if (!uploadedFileData) return 0;
  const printType = document.getElementById('print-type').value;
  const copies = parseInt(document.getElementById('copies').value) || 1;
  const pagesInFile = uploadedFileData.pages || 1;
 
  const result = window.printPricing.calculatePrintTotal({
    printType,
    pagesInFile,
    copies
  });
 
  document.getElementById('total-price').innerHTML = `
    ₦${result.total.toFixed(2)}
    <div style="font-size: 0.4em; color: var(--text-color); font-weight: normal; margin-top: 4px;">
      ${result.breakdownLabel} • (${pagesInFile} pages × ${copies} copies = ${result.totalPagesPrinted} pages)
    </div>
  `;
 
  return result.total;
};
```
 
- [ ] **Step 4: Verify in-browser price updates**
 
Run a local server:
```bash
cd /workspace/Unileh-PrintHub && python -m http.server 4173
```
 
Then open:
- `http://localhost:4173/order/`
 
Manual checks:
- Upload an image (1 page) + B/W + 1 copy → Total shows **₦80**
- Upload an image (1 page) + B/W + 2 copies → Total shows **₦150**
- Upload a PDF with 2 pages + B/W + 2 copies → Total pages printed = 4 → Total shows **₦300**
- Switch to Color for any case → Total shows **₦100 × total pages printed**
 
---
 
### Task 3: Fix Broken/Missing Asset: `checkout.css`
 
**Files:**
- Create: `assets/css/checkout.css`
 
- [ ] **Step 1: Create `assets/css/checkout.css`**
 
```css
:root {
  --uph-surface: #ffffff;
  --uph-surface-2: rgba(255, 255, 255, 0.82);
  --uph-border: rgba(10, 31, 68, 0.12);
  --uph-shadow: 0 14px 40px rgba(10, 31, 68, 0.12);
}
 
.payment-card {
  margin-top: 18px;
}
 
#checkout-summary .loading {
  opacity: 0.8;
}
 
.summary-details hr {
  border: none;
  height: 1px;
  background: var(--uph-border);
  margin: 16px 0;
}
 
.bank-info {
  background: var(--uph-surface-2);
  border: 1px solid var(--uph-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(10, 31, 68, 0.08);
}
 
.highlight {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 107, 53, 0.12);
  border: 1px solid rgba(255, 107, 53, 0.24);
}
 
.instruction {
  opacity: 0.85;
  margin-top: 10px;
}
 
.confirm-payment {
  margin-top: 18px;
}
 
.cta-button-whatsapp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  background: #25d366;
  color: #0b1b12;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
 
.cta-button-whatsapp:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
 
.cta-button-whatsapp:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(37, 211, 102, 0.25);
}
```
 
- [ ] **Step 2: Verify the missing CSS 404 is gone**
 
Run:
```bash
python - <<'PY'
import pathlib
p = pathlib.Path('/workspace/Unileh-PrintHub/assets/css/checkout.css')
print('exists' if p.exists() else 'missing')
PY
```
 
Expected output:
```text
exists
```
 
---
 
### Task 4: Add Modern CSS Overrides (Minimal + Premium)
 
**Files:**
- Create: `assets/css/modern.css`
- Modify: `index.html`, `order/index.html`, `checkout/index.html`, `portal/index.html`, `news/index.html`, `partners/index.html`, `about/index.html`, `privacy/index.html`, `terms/index.html`, `refund/index.html`, `admin/index.html`, `admin/dashboard/index.html`
 
- [ ] **Step 1: Create `assets/css/modern.css`**
 
```css
:root {
  --uph-radius-sm: 12px;
  --uph-radius-md: 16px;
  --uph-radius-lg: 22px;
  --uph-border: rgba(10, 31, 68, 0.12);
  --uph-shadow-sm: 0 6px 18px rgba(10, 31, 68, 0.10);
  --uph-shadow: 0 14px 40px rgba(10, 31, 68, 0.12);
  --uph-shadow-lg: 0 24px 70px rgba(10, 31, 68, 0.16);
  --uph-surface: #ffffff;
  --uph-surface-2: rgba(255, 255, 255, 0.86);
  --uph-muted: rgba(10, 31, 68, 0.62);
}
 
body {
  letter-spacing: -0.01em;
}
 
.container {
  max-width: 1120px;
}
 
header {
  backdrop-filter: saturate(140%) blur(10px);
}
 
header .container {
  gap: 16px;
}
 
nav ul {
  gap: 16px;
}
 
nav ul li a {
  padding: 10px 10px;
  border-radius: 999px;
}
 
nav ul li a:hover {
  background: rgba(255, 255, 255, 0.10);
}
 
[data-theme="light"] nav ul li a:hover {
  background: rgba(10, 31, 68, 0.06);
}
 
#theme-toggle {
  border-radius: 999px;
  padding: 10px 14px;
  box-shadow: 0 10px 24px rgba(255, 107, 53, 0.18);
}
 
.cta-button, .cta-button-secondary {
  border-radius: 999px;
  letter-spacing: 0.6px;
  box-shadow: 0 10px 24px rgba(10, 31, 68, 0.14);
}
 
.cta-button:hover, .cta-button-secondary:hover {
  transform: translateY(-1px);
}
 
.hero {
  padding: 92px 0;
}
 
.hero h1 {
  font-size: clamp(2.25rem, 4vw, 3.25rem);
  letter-spacing: -0.03em;
}
 
.hero p {
  font-size: clamp(1.05rem, 2vw, 1.35rem);
}
 
.card {
  background: var(--uph-surface-2);
  color: var(--text-color);
  border: 1px solid var(--uph-border);
  border-radius: var(--uph-radius-lg);
  box-shadow: var(--uph-shadow);
  padding: 28px;
}
 
.portal-services-cta .card,
.gadgets-cta .card {
  background: linear-gradient(135deg, var(--primary) 0%, #13335f 60%, rgba(255,107,53,0.20) 120%);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: var(--uph-shadow-lg);
  color: #ffffff;
}
 
.form-card {
  background: var(--uph-surface-2);
  border: 1px solid var(--uph-border);
  border-radius: var(--uph-radius-lg);
  box-shadow: var(--uph-shadow);
}
 
.form-group input,
.form-group select,
.form-group textarea {
  border-radius: var(--uph-radius-md);
  border: 1px solid var(--uph-border);
  background: rgba(255, 255, 255, 0.92);
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
 
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: rgba(255, 107, 53, 0.55);
  box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.14);
}
 
.price-display,
.price-calculator {
  border-radius: var(--uph-radius-md);
  border: 1px solid var(--uph-border);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 10px 28px rgba(10, 31, 68, 0.08);
}
 
.step, .service-item, .news-item.card, .partner-card.card {
  border-radius: var(--uph-radius-lg);
  box-shadow: var(--uph-shadow-sm);
  border: 1px solid var(--uph-border);
}
 
.footer-grid a {
  border-radius: 10px;
}
 
@media (max-width: 860px) {
  header .container {
    flex-wrap: wrap;
  }
 
  nav ul {
    flex-wrap: wrap;
    justify-content: center;
  }
 
  .card {
    padding: 22px;
  }
 
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```
 
- [ ] **Step 2: Include `modern.css` across pages**
 
Add this `<link>` after the existing `style.css` link in each file:
 
**Root page** (`index.html`):
```html
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/modern.css">
```
 
**Sub-pages** (all folders like `order/`, `checkout/`, etc.):
```html
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="../assets/css/modern.css">
```
 
Files to update:
- `about/index.html`
- `admin/index.html`
- `admin/dashboard/index.html`
- `checkout/index.html`
- `news/index.html`
- `order/index.html`
- `partners/index.html`
- `portal/index.html`
- `privacy/index.html`
- `refund/index.html`
- `terms/index.html`
 
- [ ] **Step 3: Visual verification**
 
Run:
```bash
cd /workspace/Unileh-PrintHub && python -m http.server 4173
```
 
Check:
- `http://localhost:4173/` (hero + CTA cards)
- `http://localhost:4173/order/` (form inputs + pricing card)
- `http://localhost:4173/checkout/?orderId=fake` shows “No Order ID found” state without layout breaking
 
---
 
### Task 5: Path/Asset Audit + Fixes
 
**Files:**
- Modify: any HTML/CSS/JS files that reference missing local assets
 
- [ ] **Step 1: Run a simple local asset reference scan**
 
Run:
```bash
python - <<'PY'
import os, re, pathlib
root = pathlib.Path('/workspace/Unileh-PrintHub')
html_files = list(root.rglob('*.html'))
missing = []
 
attr_re = re.compile(r'(?:src|href)=["\\\']([^"\\\']+)["\\\']', re.I)
 
def is_external(u: str) -> bool:
  return u.startswith('http://') or u.startswith('https://') or u.startswith('mailto:') or u.startswith('tel:') or u.startswith('wa.me') or u.startswith('#')
 
for f in html_files:
  txt = f.read_text(errors='ignore')
  for u in attr_re.findall(txt):
    if is_external(u):
      continue
    if u.startswith('/'):
      p = root / u.lstrip('/')
    else:
      p = (f.parent / u).resolve()
    if p.suffix in ('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico', '.json') or '/assets/' in str(p):
      if not p.exists():
        missing.append((str(f.relative_to(root)), u, str(p)))
 
print('missing_count', len(missing))
for item in missing[:40]:
  print(item[0], '->', item[1])
PY
```
 
Expected:
- `missing_count` should be **0** after `checkout.css` + `modern.css` + `pricing.js` are added and paths are correct.
 
- [ ] **Step 2: Fix any remaining missing references**
 
If the scan prints any missing paths:
- Create the missing file if it’s intentional (like `checkout.css` was)
- Or correct the HTML path to point at the existing file
 
---
 
## Execution Handoff
 
Plan complete and saved to `docs/superpowers/plans/2026-05-04-unilesh-printhub-pricing-modernize.md`. Two execution options:
 
1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task and review between tasks  
2. **Inline Execution** — I implement task-by-task in this session with checkpoints  
 
Which approach?
