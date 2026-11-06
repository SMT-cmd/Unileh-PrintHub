import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase.js';

const routes = [
  { label: 'Print a document', href: '/order/' },
  { label: 'Portal assistance', href: '/portal/' },
  { label: 'Campus updates', href: '/news/' },
  { label: 'Partners', href: '/partners/' }
];

const services = [
  { number: '01', title: 'Documents & assignments', detail: 'Clean, legible pages for coursework, lecture notes and every submission that matters.', tag: 'EVERYDAY PRINTING', className: 'service-blue' },
  { number: '02', title: 'Projects & presentations', detail: 'From longer projects to presentation materials, finish with work you are proud to hand over.', tag: 'ACADEMIC PRINTING', className: 'service-white' },
  { number: '03', title: 'Photos & colour prints', detail: 'Bring images, illustrations and colourful coursework to life in sharper detail.', tag: 'COLOUR PRINTING', className: 'service-orange' }
];

const stages = [
  { number: '01', title: 'Upload your files', description: 'Add your PDF, Word document or image. Up to three documents can be included in one order.' },
  { number: '02', title: 'Choose your print', description: 'Select black & white or colour, copies and any instructions. See your estimate before checkout.' },
  { number: '03', title: 'Pay and collect', description: 'Follow the payment instructions and send confirmation. We will update you when your work is ready.' }
];

const now = () => new Date().toISOString();
function safeHref(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function usePublicContent() {
  const [announcements, setAnnouncements] = useState([]);
  const [adverts, setAdverts] = useState([]);
  useEffect(() => {
    if (!db) return;
    const unsubscribers = [
      onSnapshot(query(collection(db, 'announcements'), orderBy('expiryDate', 'asc')), snapshot => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => !item.expiryDate || item.expiryDate >= now()));
      }, () => setAnnouncements([])),
      onSnapshot(collection(db, 'adverts'), snapshot => {
        setAdverts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => !item.endDate || item.endDate >= now()));
      }, () => setAdverts([]))
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);
  return { announcements, adverts };
}

function Brand() {
  return <a href="/" className="brand" aria-label="Unilesh Print Hub home">
    <span className="brand-symbol" aria-hidden="true"><span>U</span><i /></span>
    <span className="brand-text"><strong>UNILESH<span>PRINT HUB</span></strong><small>POWERED BY AFRINET HUB</small></span>
  </a>;
}

function Header({ announcements }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => window.localStorage.getItem('unilesh-theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    window.localStorage.setItem('unilesh-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <>
    <div className="utility-bar">
      <span>MADE FOR THE UNIVERSITY OF ILESA COMMUNITY</span>
      <a href="https://wa.me/2348083964600" target="_blank" rel="noreferrer">Need help? Talk to us <span aria-hidden="true">↗</span></a>
    </div>
    {announcements.length > 0 && <aside className="announcement" aria-label="Announcements">
      <strong>LATEST UPDATE</strong>
      <span>{announcements[0].message}</span>
      {safeHref(announcements[0].link) && <a href={safeHref(announcements[0].link)}>Read more ↗</a>}
    </aside>}
    <header className="site-header">
      <div className="wide-container header-inner">
        <Brand />
        <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Primary navigation">
          <a href="/order/">Print now</a><a href="/portal/">Student services</a><a href="/news/">Campus news</a><a href="/partners/">Partners</a><a href="/about/">About</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-button" onClick={() => setDark(v => !v)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? '☀' : '◐'}</button>
          <a className="nav-cta" href="/order/">Start an order <span>↗</span></a>
          <button className="icon-button menu-button" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? '✕' : '☰'}</button>
        </div>
      </div>
    </header>
  </>;
}

function Hero() {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="wide-container hero-layout">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> PRINTING, WITHOUT THE PRESSURE</div>
        <h1 id="hero-heading">Print sharp.<br /><em>Move fast.</em><br />Meet every deadline.</h1>
        <p>Assignments, projects, colour prints and student support—all in one convenient place, built around your campus day.</p>
        <div className="hero-buttons"><a className="button button-orange" href="/order/">Start my print order <span>↗</span></a><a className="hero-secondary" href="#how-it-works">See how it works <span>↓</span></a></div>
        <div className="hero-proof"><span className="checkmark">✓</span> Secure file submission <i /> <span className="checkmark">✓</span> Clear price estimates <i /> <span className="checkmark">✓</span> Student-first service</div>
      </div>
      <div className="hero-art" aria-label="Editorial illustration of a student print order">
        <div className="hero-grid" aria-hidden="true" />
        <div className="art-caption">YOUR WORK. BEAUTIFULLY PRINTED.</div>
        <div className="art-orbit orbit-one" aria-hidden="true" /><div className="art-orbit orbit-two" aria-hidden="true" />
        <div className="paper-stack" aria-hidden="true">
          <div className="page page-back" /><div className="page page-mid" />
          <div className="page page-front">
            <div className="page-bar" /><div className="page-line long" /><div className="page-line" />
            <div className="page-photo"><div className="page-photo-dot" /></div>
            <div className="page-line long" /><div className="page-line short" />
          </div>
        </div>
        <div className="floating-label floating-top"><span>✓</span><div><strong>READY TO PRINT</strong><small>Your file is in good hands</small></div></div>
        <div className="floating-label floating-bottom"><span className="orange-dot" /><div><strong>FROM SCREEN TO PAPER</strong><small>Just a few simple steps</small></div></div>
        <div className="hero-art-footer"><span>01 / 03</span><span>UNILESH PRINT HUB — 2026</span></div>
      </div>
    </div>
  </section>;
}

function AdPlacement({ adverts, placement }) {
  const matched = adverts.filter(ad => ad.placement === placement || ad.placement === 'Both');
  if (!matched.length) return null;
  return <section className="wide-container sponsor-strip" aria-label="Sponsored announcements">
    <div className="sponsor-heading">FROM OUR CAMPUS PARTNERS <span>SPONSORED</span></div>
    <div className="sponsor-items">{matched.slice(0, 3).map(ad => <article key={ad.id} className="sponsor-item">
      {ad.imageUrl && <img src={ad.imageUrl} alt="" loading="lazy" />}
      <div><strong>{ad.title}</strong><p>{ad.description}</p>{safeHref(ad.linkUrl) && <a href={safeHref(ad.linkUrl)} target="_blank" rel="noreferrer">Explore offer ↗</a>}</div>
    </article>)}</div>
  </section>;
}

function Services() {
  return <section id="services" className="services-section section-pad">
    <div className="wide-container">
      <div className="section-heading"><div><span className="kicker">WHAT WE DO</span><h2>The right print<br /><em>for every moment.</em></h2></div><p>No unnecessary complications. Just the print and digital support you need, designed for students.</p></div>
      <div className="service-grid">{services.map(s => <article key={s.number} className={'service-card ' + s.className}>
        <div className="service-card-top"><span>{s.tag}</span><span>↗</span></div>
        <div className="service-graphic" aria-hidden="true"><div className="graphic-sheet sheet-1" /><div className="graphic-sheet sheet-2" /><div className="graphic-sheet sheet-3" /></div>
        <div className="service-card-body"><span className="service-index">{s.number} / SERVICE</span><h3>{s.title}</h3><p>{s.detail}</p></div>
      </article>)}</div>
    </div>
  </section>;
}

function Process() {
  return <section id="how-it-works" className="process-section section-pad"><div className="wide-container process-layout">
    <div className="process-intro"><span className="kicker">STRAIGHTFORWARD, FROM THE START</span><h2>Three steps.<br /><em>One less worry.</em></h2><p>There is no complicated process to learn. Get your files in, see your estimate, and complete your order.</p><a className="text-link" href="/order/">Let's get it printed ↗</a></div>
    <div className="process-steps">{stages.map((stage, i) => <article className="process-step" key={stage.number}><span>{stage.number}</span><div><h3>{stage.title}</h3><p>{stage.description}</p></div><span className="step-arrow">{i < stages.length - 1 ? '↓' : '✓'}</span></article>)}</div>
  </div></section>;
}

function CampusSupport() {
  return <section className="support-section section-pad"><div className="wide-container support-layout">
    <div className="support-visual" aria-hidden="true"><div className="support-ring" /><div className="support-window"><div className="window-top"><i/><i/><i/></div><div className="support-window-label">CAMPUS HELP DESK</div><div className="support-window-line"/><div className="support-window-line short"/><div className="support-window-action">REQUEST RECEIVED <span>✓</span></div></div><div className="support-sticker">DIGITAL<br/>ASSISTANCE <span>↗</span></div></div>
    <div className="support-copy"><span className="kicker">MORE THAN PRINTING</span><h2>Campus tasks,<br /><em>made easier.</em></h2><p>Exam cards, library passes and common student portal challenges can take time away from everything else. Our assistance service is here to help you navigate them.</p><div className="support-points"><span>Portal assistance</span><span>Student requests</span><span>Human support</span></div><a className="button button-navy" href="/portal/">Explore student services <span>↗</span></a><small>Never share your university portal password. We can guide you through official recovery and access steps.</small></div>
  </div></section>;
}

function ContactPanel() {
  return <section id="contact" className="contact-panel"><div className="wide-container contact-layout">
    <div><span className="kicker">DON'T LEAVE IT UNTIL THE LAST MINUTE</span><h2>Your next great print<br /><em>starts right here.</em></h2><p>From coursework to project submissions, let us help make the final step feel effortless.</p></div>
    <div className="contact-actions"><a className="button button-orange" href="/order/">Upload & get started ↗</a><a className="contact-whatsapp" href="https://wa.me/2348083964600" target="_blank" rel="noreferrer">Chat with our team ↗</a></div>
  </div></section>;
}

function InquiryForm({ kind }) {
  const [state, setState] = useState('idle');
  const [values, setValues] = useState({ name: '', phone: '', message: '' });
  const isAdvert = kind === 'advert';
  async function submit(event) {
    event.preventDefault();
    if (!db) { setState('unavailable'); return; }
    if (!values.name.trim() || !values.message.trim()) return;
    try {
      setState('sending');
      const payload = isAdvert
        ? { businessName: values.name.trim(), contactPhone: values.phone.trim(), description: values.message.trim(), duration: '7', placement: 'Both', timestamp: now() }
        : { name: values.name.trim(), phone: values.phone.trim(), message: values.message.trim(), category: 'Feedback', timestamp: now(), status: 'Pending' };
      await addDoc(collection(db, isAdvert ? 'advertRequests' : 'feedbackSuggestions'), payload);
      setState('success'); setValues({ name: '', phone: '', message: '' });
    } catch { setState('error'); }
  }
  return <form onSubmit={submit} className="inquiry-form">
    <label> {isAdvert ? 'Business name' : 'Your name'} <input required maxLength={100} value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))} placeholder={isAdvert ? 'Your business' : 'How should we address you?'} /></label>
    <label> Phone / WhatsApp <input type="tel" maxLength={25} value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} placeholder="Optional" /></label>
    <label> {isAdvert ? 'Tell us about your business' : 'Your message'} <textarea required maxLength={1500} rows={3} value={values.message} onChange={e => setValues(v => ({ ...v, message: e.target.value }))} placeholder="Write a few details..." /></label>
    <button className="button button-navy" disabled={state === 'sending'} type="submit">{state === 'sending' ? 'Sending…' : 'Send request ↗'}</button>
    {state === 'success' && <p role="status" className="form-notice">Thank you. Your message has been submitted.</p>}
    {state === 'error' && <p role="alert" className="form-notice form-error">We couldn't submit this request. Please try again.</p>}
    {state === 'unavailable' && <p role="alert" className="form-notice form-error">Online requests are not yet connected in this preview. You can contact us through WhatsApp.</p>}
  </form>;
}

function Opportunities() {
  const [active, setActive] = useState(null);
  return <section className="opportunity-section section-pad"><div className="wide-container">
    <div className="section-heading"><div><span className="kicker">A PART OF THE CAMPUS COMMUNITY</span><h2>More ways<br /><em>to connect.</em></h2></div><p>Get discovered, share what matters, or make an introduction. There is room for everyone.</p></div>
    <div className="opportunity-grid">
      <div className="opportunity-card"><span className="opportunity-icon">↗</span><h3>Grow your business on campus.</h3><p>Reach students with announcements and advertising opportunities.</p><button onClick={() => setActive(active === 'advert' ? null : 'advert')} aria-expanded={active === 'advert'}>Advertise with us <span>↗</span></button>{active === 'advert' && <InquiryForm kind="advert" />}</div>
      <div className="opportunity-card"><span className="opportunity-icon">✳</span><h3>Have an idea? We're listening.</h3><p>Tell us what you would like to see improved or added to Unilesh Print Hub.</p><button onClick={() => setActive(active === 'feedback' ? null : 'feedback')} aria-expanded={active === 'feedback'}>Share feedback <span>↗</span></button>{active === 'feedback' && <InquiryForm kind="feedback" />}</div>
      <a className="opportunity-card partner-card" href="/partners/"><span className="opportunity-icon">◎</span><h3>Meet our campus partners.</h3><p>Discover other businesses and services supporting the student community.</p><span className="partner-link">Explore partners ↗</span></a>
    </div>
  </div></section>;
}

function Footer() {
  return <footer className="footer">
    <div className="wide-container">
      <div className="footer-head"><Brand /><p>For the work you put in.<br />For the moments that matter.<br /><strong>Printed with care.</strong></p></div>
      <div className="footer-bottom">
        <div><small>© {new Date().getFullYear()} Unilesh Print Hub · Powered by AfriNet Hub</small><span>Serving the University of Ilesa community.</span></div>
        <div className="footer-links"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/refund/">Refunds</a><a href="https://unilesa.edu.ng" target="_blank" rel="noreferrer">University ↗</a><a href="/admin/">Staff</a></div>
      </div>
    </div>
  </footer>;
}

export default function App() {
  const { announcements, adverts } = usePublicContent();
  return <><Header announcements={announcements} /><main><Hero /><AdPlacement adverts={adverts} placement="Top" /><Services /><Process /><CampusSupport /><Opportunities /><AdPlacement adverts={adverts} placement="Bottom" /><ContactPanel /></main><Footer /></>;
}
