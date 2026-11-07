(function () {
    // ===== EDIT THESE TO CHANGE BRANDING / MENU SITE-WIDE =====
    const BRAND_NAME = 'AfriNet Hub';
    const POWERED_BY = '';   // e.g. 'powered by Something', or leave empty for none
    const TAGLINE = 'Serving the <strong>University of Ilesa (UNILESA)</strong> community.'; // empty string to remove
    const DATA_URL = 'https://afrinethub.com'; // external data-selling site
    const NAV = [
        { label: 'Printing', path: 'printing/', also: ['order', 'checkout'] },
        { label: 'Gadgets', path: 'gadgets/' },
        { label: 'Housing', path: 'housing/' },
        { label: 'Project &amp; Seminar', path: 'project/' },
        { label: 'Data', url: DATA_URL },
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
        if (!item.path) return false;
        const key = item.path.replace('/', '');
        return section === key || (item.also && item.also.includes(section));
    };
    const link = (item) => {
        // External items (like Data) open the other site in a new tab
        if (item.url) {
            return `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label} <span aria-hidden="true">&#8599;</span></a>`;
        }
        return `<a href="${base}${item.path}"${isActive(item) ? ' class="active"' : ''}>${item.label}</a>`;
    };

    const headerEl = document.querySelector('body > header');
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="container">
                <div class="logo">
                    <a href="${base}" class="brand-link">
                        <img src="${base}assets/images/afrinethub-round.webp" alt="${BRAND_NAME} Logo">
                        <span class="brand-block">
                            <span class="brand-name">${BRAND_NAME}</span>
                            ${POWERED_BY ? `<span class="powered-by">${POWERED_BY}</span>` : ''}
                        </span>
                    </a>
                </div>
                <nav id="legacy-main-nav" aria-label="Main navigation">
                    <ul>${NAV.map((n) => `<li>${link(n)}</li>`).join('')}</ul>
                </nav>
                <div class="legacy-header-actions">
                    <button id="theme-toggle" type="button" aria-label="Change color theme">Theme</button>
                    <button id="legacy-menu-button" class="legacy-menu-button" type="button" aria-label="Open menu" aria-controls="legacy-main-nav" aria-expanded="false">
                        <span class="legacy-menu-lines" aria-hidden="true"><i></i><i></i><i></i></span>
                    </button>
                </div>
            </div>`;
    }

    const menuButton = headerEl?.querySelector('#legacy-menu-button');
    const menuNav = headerEl?.querySelector('#legacy-main-nav');
    const setMenuOpen = (open) => {
        if (!menuButton || !menuNav) return;
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuNav.classList.toggle('is-open', open);
        document.body.classList.toggle('legacy-menu-open', open);
    };
    menuButton?.addEventListener('click', () => {
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    menuNav?.addEventListener('click', (event) => {
        if (event.target.closest('a')) setMenuOpen(false);
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenuOpen(false);
    });
    document.addEventListener('pointerdown', (event) => {
        if (headerEl && !headerEl.contains(event.target)) setMenuOpen(false);
    });
    const desktopBreakpoint = window.matchMedia('(min-width: 981px)');
    desktopBreakpoint.addEventListener?.('change', (event) => {
        if (event.matches) setMenuOpen(false);
    });

    const pageMain = document.querySelector('body > main');
    if (pageMain && !pageMain.id) pageMain.id = 'legacy-page-main';
    if (pageMain && !document.querySelector('.legacy-skip-link')) {
        const skip = document.createElement('a');
        skip.href = '#legacy-page-main';
        skip.className = 'legacy-skip-link';
        skip.textContent = 'Skip to content';
        document.body.insertBefore(skip, document.body.firstChild);
    }

    const footerEl = document.querySelector('body > footer');
    if (footerEl) {
        footerEl.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-section">
                        <div class="legacy-footer-brand">
                            <img src="${base}assets/images/afrinethub-round.webp" alt="" width="52" height="52" loading="lazy">
                            <strong>AfriNet <span>Hub</span></strong>
                        </div>
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