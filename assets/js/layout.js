(function () {
    // ===== EDIT THESE TO CHANGE BRANDING / MENU SITE-WIDE =====
    const BRAND_NAME = 'AfriNet Hub';
    const POWERED_BY = '';   // e.g. 'powered by Something', or leave empty for none
    const TAGLINE = 'Serving the <strong>University of Ilesha (Unilesa)</strong> community.'; // empty string to remove
    const NAV = [
        { label: 'Printing', path: 'printing/', also: ['order', 'checkout'] },
        { label: 'Gadgets', path: 'gadgets/' },
        { label: 'Housing', path: 'housing/' },
        { label: 'Project &amp; Seminar', path: 'project/' },
        { label: 'Portal Services', path: 'portal/' },
        { label: 'About Us', path: 'about/' }
    ];
    const MORE = [
        { label: 'Latest News', path: 'news/' },
        { label: 'Partners', path: 'partners/' }
    ];
    const LEGAL = [
        { label: 'Privacy Policy', path: 'privacy/' },
        { label: 'Terms of Service', path: 'terms/' },
        { label: 'Refund Policy', path: 'refund/' },
        { label: 'About', path: 'about/' }
    ];
    // ==========================================================

    const script = document.currentScript;
    if (!script) return;

    // Works from any folder depth, and under a GitHub Pages sub-path
    const base = script.src.replace(/assets\/js\/layout\.js.*$/, '');
    const basePath = new URL(base).pathname;
    const rel = location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : '';
    const section = rel.split('/')[0].replace(/\.html$/, '');

    const isActive = (item) => {
        const key = item.path.replace('/', '');
        return section === key || (item.also && item.also.includes(section));
    };
    const link = (item) =>
        `<a href="${base}${item.path}"${isActive(item) ? ' class="active"' : ''}>${item.label}</a>`;

    const headerEl = document.querySelector('body > header');
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="container">
                <div class="logo">
                    <a href="${base}" class="brand-link">
                        <img src="${base}assets/images/logo.png" alt="${BRAND_NAME} Logo">
                        <span class="brand-block">
                            <span class="brand-name">${BRAND_NAME}</span>
                            ${POWERED_BY ? `<span class="powered-by">${POWERED_BY}</span>` : ''}
                        </span>
                    </a>
                </div>
                <nav>
                    <ul>${NAV.map((n) => `<li>${link(n)}</li>`).join('')}</ul>
                </nav>
                <button id="theme-toggle">Toggle Theme</button>
            </div>`;
    }

    const footerEl = document.querySelector('body > footer');
    if (footerEl) {
        footerEl.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-section">
                        <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All Rights Reserved.</p>
                        ${TAGLINE ? `<p>${TAGLINE}</p>` : ''}
                    </div>
                    <div class="footer-section university-links">
                        <h4>More</h4>
                        ${MORE.map(link).join('')}
                        <a href="https://unilesa.edu.ng" target="_blank" rel="noopener noreferrer">Official Unilesa Site</a>
                    </div>
                    <div class="footer-section legal-links">
                        <h4>Legal</h4>
                        ${LEGAL.map(link).join('')}
                    </div>
                </div>
            </div>`;
    }
})();