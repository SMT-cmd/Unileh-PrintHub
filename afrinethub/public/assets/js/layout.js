(function () {
    // ===== EDIT THESE TO CHANGE BRANDING / MENU SITE-WIDE =====
    const BRAND_NAME = 'AfriNet Hub';
    const POWERED_BY = '';   // e.g. 'powered by Something', or leave empty for none
    const TAGLINE = 'Serving the <strong>University of Ilesa (UNILESA)</strong> community.'; // empty string to remove
    const DATA_URL = 'https://afrinethub.com'; // external data-selling site
    const NAV = [
        { label:'Home', path:'' },
        { label:'Our services', path:'#services' },
        { label:'Gadgets', path:'gadgets/' },
        { label:'Housing', path:'housing/' },
        { label:'Projects', path:'project/' },
        { label:'About us', path:'about/' },
        { label:'Updates', path:'news/' }
    ];
    const FOOTER_SERVICES = [
        { label:'Printing', path:'printing/' },
        { label:'Gadgets', path:'gadgets/' },
        { label:'Data & airtime', url:DATA_URL },
        { label:'Housing', path:'housing/' },
        { label:'Projects & seminars', path:'project/' }
    ];
    const FOOTER_MORE = [
        { label:'Portal assistance', path:'portal/' },
        { label:'News & updates', path:'news/' },
        { label:'Partners', path:'partners/' },
        { label:'About us', path:'about/' }
    ];
    const LEGAL = [
        { label:'Privacy policy', path:'privacy/' },
        { label:'Terms of service', path:'terms/' },
        { label:'Refund policy', path:'refund/' }
    ];
    // ==========================================================

    const script = document.currentScript;
    if (!script) return;

    // Works from any folder depth, and under a GitHub Pages sub-path
    const base = script.src.replace(/assets\/js\/layout\.js.*$/, '');
    const basePath = new URL(base).pathname;
    const rel = location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : '';
    const section = rel.split('/')[0].replace(/\.html$/, '');
    document.body.dataset.legacyPage = section || 'home';

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
        const topline = document.createElement('div');
        topline.className='legacy-topline';
        topline.innerHTML='<div class="container"><span>Serving the University of Ilesa community</span><a href="https://wa.me/2348083964600" target="_blank" rel="noopener noreferrer">Chat with our team &#8599;</a></div>';
        headerEl.parentNode.insertBefore(topline,headerEl);
        headerEl.innerHTML = `
            <div class="container">
                <div class="logo">
                    <a href="${base}" class="brand-link" aria-label="AfriNet Hub home">
                        <img src="${base}assets/images/afrinethub-round.webp" alt="" width="46" height="46">
                        <span class="brand-block"><strong class="brand-name">AFRI<span>NET</span></strong><small class="brand-sub">HUB</small></span>
                    </a>
                </div>
                <nav id="legacy-main-nav" aria-label="Main navigation">
                    <ul>${NAV.map(n=>`<li>${link(n)}</li>`).join('')}<li class="legacy-mobile-order"><a href="${base}order/">Print a document &#8599;</a></li></ul>
                </nav>
                <div class="legacy-header-actions">
                    <a href="${base}order/" class="legacy-header-order">Print a document <span aria-hidden="true">&#8599;</span></a>
                    <button id="theme-toggle" type="button" aria-label="Change color theme" title="Change theme">Theme</button>
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
                        <a href="${base}" class="legacy-footer-brand" aria-label="AfriNet Hub home">
                            <img src="${base}assets/images/afrinethub-round.webp" alt="" width="45" height="45" loading="lazy">
                            <strong>AfriNet <span>Hub</span></strong>
                        </a>
                        <p>Everyday services, brought together. Serving the University of Ilesa community and beyond.</p>
                        <a href="https://wa.me/2348083964600" target="_blank" rel="noopener noreferrer">Chat on WhatsApp &#8599;</a>
                    </div>
                    <div class="footer-section">
                        <h4>Explore</h4>
                        ${FOOTER_SERVICES.map(link).join('')}
                    </div>
                    <div class="footer-section">
                        <h4>More &amp; information</h4>
                        ${FOOTER_MORE.map(link).join('')}
                        ${LEGAL.map(link).join('')}
                        <a href="https://unilesa.edu.ng" target="_blank" rel="noopener noreferrer">University of Ilesa &#8599;</a>
                    </div>
                </div>
                <p class="legacy-footer-bottom">&copy; ${new Date().getFullYear()} AfriNet Hub. All rights reserved.</p>
            </div>`;
    }
})();
