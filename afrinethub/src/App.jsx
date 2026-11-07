import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, ArrowDown, ChevronLeft, ChevronRight, Menu, X,
  Printer, Smartphone, Wifi, House, GraduationCap, ShieldCheck, Headphones,
  FileText, Laptop, BookOpen, Phone, CheckCircle2, Clock3, ShoppingBag,
  CreditCard, MapPin, MessageCircle, Search, Zap, Layers3, ExternalLink, CirclePause, CirclePlay
} from 'lucide-react';

const services = [
  { id:'printing', label:'Printing & Photocopying', short:'Print, copy and prepare your documents with less stress.', href:'/printing/', icon:Printer, type:'blue', action:'Print a document', tag:'PRINTING' },
  { id:'gadgets', label:'Gadgets & Electronics', short:'Explore phones, laptops, tablets, watches and more.', href:'/gadgets/', icon:Laptop, type:'powder', action:'Browse gadgets', tag:'TECH' },
  { id:'data', label:'Data & Airtime', short:'Get connected with mobile data and airtime.', href:'https://afrinethub.com', icon:Wifi, type:'orange', action:'Buy data or airtime', tag:'CONNECTIVITY', external:true },
  { id:'housing', label:'Housing & Accommodation', short:'Explore rooms, apartments and short-lets near campus.', href:'/housing/', icon:House, type:'cream', action:'Find accommodation', tag:'HOUSING' },
  { id:'project', label:'Projects & Seminars', short:'Get guidance, editing and research support for academic work.', href:'/project/', icon:GraduationCap, type:'lavender', action:'Request support', tag:'ACADEMICS' }
];
const slides = [
 { eyebrow:'ONE HUB. MORE POSSIBILITIES.', kicker:'Welcome to AfriNet Hub', heading:['Life gets easier', 'when everything', 'is in one place.'], emphasis:2, description:'Print your documents, find the right tech, top up data, explore housing and get academic support—all from one trusted place.', cta:'Explore our services', href:'#services', tone:'all', figure:'everything' },
 { eyebrow:'PRINTING & PHOTOCOPYING', kicker:'Less waiting. More doing.', heading:['Your deadline', 'is close. We', 'make it easier.'], emphasis:2, description:'Upload your assignments and project files, choose how you want them printed, and get a clear price before you order.', cta:'Start a print order',href:'/order/',tone:'print',figure:'printing' },
 { eyebrow:'GADGETS & ELECTRONICS', kicker:'Upgrade your everyday', heading:['Find the tech', 'that keeps you', 'moving.'], emphasis:1, description:'Discover phones, laptops, tablets, watches and other gadgets for work, study and everyday life.', cta:'Shop gadgets',href:'/gadgets/',tone:'tech',figure:'gadgets' },
 { eyebrow:'DATA & AIRTIME', kicker:'Always within reach', heading:['Stay online.', 'Stay close.', 'Stay connected.'], emphasis:2, description:'Top up your data and airtime quickly through the AfriNet Hub recharge service.',cta:'Buy data & airtime',href:'https://afrinethub.com',tone:'data',figure:'data',external:true },
 { eyebrow:'HOUSING & ACCOMMODATION', kicker:'A place that fits your life',heading:['Find a place', 'to settle in', 'and feel at home.'],emphasis:2,description:'Explore student-friendly rooms, apartments and short-lets around the campus area.',cta:'Explore accommodation',href:'/housing/',tone:'home',figure:'housing' },
 { eyebrow:'PROJECTS & SEMINARS', kicker:'A little help goes a long way',heading:['Big project?', 'You don’t have to', 'figure it out alone.'],emphasis:2,description:'Get support with research planning, analysis, editing and seminar preparation.',cta:'Request project support',href:'/project/',tone:'study',figure:'project' }
];

function Brand({inverted=false}) {
  return <a className={'brand'+(inverted?' brand-inverted':'')} href="/" aria-label="AfriNet Hub home">
    <img className="brand-logo" src="/assets/images/afrinethub-round.webp" alt="" width="58" height="58" />
    <span className="brand-title"><strong>AFRI<span>NET</span></strong><small>HUB</small></span>
  </a>;
}

function AppLink({ href, children, className='', external, ...props }) {
  const out=external || href.startsWith('http');
  return <a href={href} className={className} {...(out ? {target:'_blank', rel:'noopener noreferrer'} : {})} {...props}>{children}</a>;
}

function Header() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{const esc=e=>{if(e.key==='Escape') setOpen(false)};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[]);
  return <>
    <div className="topline"><div className="shell topline-content"><span><MapPin size={13}/> Serving the University of Ilesa community</span><AppLink href="https://wa.me/2348083964600" external><MessageCircle size={14}/> Chat with our team <ArrowUpRight size={12}/></AppLink></div></div>
    <header className="header" id="top">
      <div className="shell header-row">
        <Brand/>
        <nav className={'nav '+(open?'nav-open':'')} aria-label="Main navigation">
          <a href="/" onClick={()=>setOpen(false)}>Home</a>
          <a href="/#services" onClick={()=>setOpen(false)}>Our services</a>
          <a href="/gadgets/" onClick={()=>setOpen(false)}>Gadgets</a>
          <a href="/housing/" onClick={()=>setOpen(false)}>Housing</a>
          <a href="/project/" onClick={()=>setOpen(false)}>Projects</a>
          <a href="/about/" onClick={()=>setOpen(false)}>About us</a>
          <a href="/news/" onClick={()=>setOpen(false)}>Updates</a>
        </nav>
        <div className="header-right">
          <AppLink href="/order/" className="header-order">Print a document <ArrowUpRight size={17}/></AppLink>
          <button type="button" className="menu-toggle" onClick={()=>setOpen(v=>!v)} aria-controls="mobile-nav" aria-expanded={open} aria-label={open?'Close menu':'Open menu'}>{open?<X size={24}/>:<Menu size={24}/>}</button>
        </div>
      </div>
    </header>
  </>;
}

function HeroVisual({kind}) {
  const heroPhoto = kind === 'everything' ? '/assets/images/hero-multiservice.jpg' :
                    kind === 'printing' ? '/assets/images/hero-printing.jpg' : null;
  return <div className={'hero-art hero-art-'+kind} aria-hidden="true">
    {heroPhoto && <div className="hero-photo-frame">
      <img className="hero-photo" src={heroPhoto} alt="" loading={kind==='everything'?'eager':'lazy'} decoding="async" fetchPriority={kind==='everything'?'high':'auto'} />
    </div>}
     <div className="art-glow art-glow-a"/><div className="art-glow art-glow-b"/><div className="art-orbit"/>
     {kind==='everything' && <div className="art-platform art-all">
       <div className="art-item art-house"><House size={92}/><span className="art-house-roof"/></div>
       <div className="art-item art-printer"><Printer size={130}/><div className="print-paper"/></div>
       <div className="art-item art-laptop"><Laptop size={126}/></div>
       <div className="art-item art-phone"><Smartphone size={83}/></div>
       <div className="art-item art-wifi"><Wifi size={78}/></div>
       <div className="art-item art-books"><BookOpen size={90}/></div>
     </div>}
     {kind==='printing' && <div className="art-platform single-art printing-objects"><Printer size={240} strokeWidth={1.15}/><div className="art-sheets"><span/><span/><span/></div><FileText className="art-minor art-minor-a" size={66}/></div>}
     {kind==='gadgets' && <div className="art-platform single-art gadget-objects"><Laptop size={245} strokeWidth={1.1}/><Smartphone className="gadget-phone" size={112} strokeWidth={1.15}/><Headphones className="gadget-headphones" size={95} strokeWidth={1.3}/></div>}
     {kind==='data' && <div className="art-platform single-art data-objects"><Smartphone size={242} strokeWidth={1.05}/><Wifi className="data-wifi" size={145} strokeWidth={1.25}/><div className="signal-card">4G / 5G<span>CONNECTED</span></div></div>}
     {kind==='housing' && <div className="art-platform single-art housing-objects"><House size={260} strokeWidth={1.1}/><div className="key-card"><MapPin size={25}/> Find your next place</div></div>}
     {kind==='project' && <div className="art-platform single-art project-objects"><GraduationCap size={225} strokeWidth={1.1}/><BookOpen size={135} strokeWidth={1.2}/><FileText size={75} strokeWidth={1.2}/></div>}
     <div className="art-bottom"><span>AFRINET HUB / SERVICES</span><span>MADE FOR EVERYDAY LIFE</span></div>
   </div>;
}

function Carousel() {
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(false), touch=useRef(null);
  useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(mq.matches);update();mq.addEventListener?.('change',update);return()=>mq.removeEventListener?.('change',update)},[]);
  useEffect(()=>{if(paused||reduced)return;const id=setInterval(()=>setActive(a=>(a+1)%slides.length),7500);return()=>clearInterval(id)},[paused,reduced]);
  const setSlide=(idx)=>setActive((idx+slides.length)%slides.length);
  const slide=slides[active];
  return <section className={'hero hero-'+slide.tone} aria-label="Featured services" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false)}} onTouchStart={e=>{touch.current=e.touches[0]?.clientX}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>70)setSlide(active+(dx<0?1:-1));touch.current=null}}>
     <div className="shell hero-grid">
       <div className="hero-content" key={'copy-'+active}>
         <div className="eyebrow"><span/> {slide.eyebrow}</div>
         <p className="hero-kicker">{slide.kicker}</p>
         <h1>{slide.heading.map((part,i)=><span className={i===slide.emphasis?'orange-text':''} key={part}>{part}</span>)}</h1>
         <p className="hero-description">{slide.description}</p>
         <div className="hero-cta">
          <AppLink href={slide.href} external={slide.external} className="btn btn-orange">{slide.cta} <ArrowUpRight size={19}/></AppLink>
          <AppLink href="https://wa.me/2348083964600" external className="hero-quiet"><MessageCircle size={18}/> Ask a question</AppLink>
         </div>
       </div>
       <HeroVisual key={'art-'+active} kind={slide.figure}/>
     </div>
     <div className="shell hero-footer"><div className="hero-controls">
       <button onClick={()=>{setPaused(true);setSlide(active-1)}} aria-label="Previous slide"><ChevronLeft size={20}/></button>
       <div className="hero-dots" role="group" aria-label="Choose featured service">{slides.map((s,i)=><button key={s.tone} className={active===i?'dot active':'dot'} onClick={()=>{setPaused(true);setSlide(i)}} aria-label={'Show '+s.eyebrow.toLowerCase()} aria-current={active===i?'true':undefined}/>)}</div>
       <button onClick={()=>{setPaused(true);setSlide(active+1)}} aria-label="Next slide"><ChevronRight size={20}/></button>
       <button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Resume carousel':'Pause carousel'} className="pause-btn">{paused?<CirclePlay size={18}/>:<CirclePause size={18}/>}</button>
     </div><p>0{active+1} <span>/</span> 0{slides.length}</p></div>
   </section>;
}

function ServiceCard({service,index}) {
 const Icon=service.icon;
 return <AppLink href={service.href} external={service.external} className={'service-tile tile-'+service.type}>
   <div className="service-upper"><span className="service-number">0{index+1} / {service.tag}</span><span className="tile-arrow"><ArrowUpRight size={21}/></span></div>
   <div className="service-icon"><Icon size={52} strokeWidth={1.35}/><span className="service-icon-halo"/></div>
   <div className="service-body"><h3>{service.label}</h3><p>{service.short}</p><span className="tile-link">{service.action} <ArrowRight size={15}/></span></div>
 </AppLink>;
}
function Services() {
 return <section className="services section" id="services"><div className="shell">
  <div className="section-head"><div><p className="label">FIND WHAT YOU NEED</p><h2>More than one service.<br/><em>One easy place.</em></h2></div><p>Study, work, life and everything in between. Choose a service and we'll help you get started.</p></div>
  <div className="service-layout">{services.map((s,i)=><ServiceCard key={s.id} service={s} index={i}/>)}</div>
 </div></section>;
}
function Trust() {
 const benefits=[{icon:Layers3,title:'Everything together',text:'Printing, tech, housing and student support in one place.'},{icon:Clock3,title:'Less back and forth',text:'Clear next steps so you can spend more time on what matters.'},{icon:MessageCircle,title:'A real team to talk to',text:'Questions about an order or a service? Reach us directly.'}];
 return <section className="trust section"><div className="shell">
   <div className="trust-title"><p className="label">WHY AFRINET HUB?</p><h2>We make the everyday<br/><em>feel a little easier.</em></h2></div>
   <div className="trust-list">{benefits.map(b=><article key={b.title}><span><b.icon size={29}/></span><h3>{b.title}</h3><p>{b.text}</p></article>)}</div>
 </div></section>;
}
function Process() {
 const steps=[{no:'01',title:'Choose what you need',text:'Start with printing, gadgets, data, housing or project support.'},{no:'02',title:'Tell us the details',text:'Upload a file, browse a listing or send your request—it depends on the service.'},{no:'03',title:'Take the next step',text:'See print pricing, contact the seller or landlord, or speak with our team.'}];
 return <section className="process section" id="how-it-works"><div className="shell process-grid">
   <div className="process-copy"><p className="label">HOW IT WORKS</p><h2>Getting things done<br/><em>shouldn't be hard.</em></h2><p>We've kept each service simple. No endless forms or confusing steps.</p><AppLink href="/printing/" className="text-cta">See our printing service <ArrowUpRight size={18}/></AppLink></div>
   <div className="process-steps">{steps.map(s=><article key={s.no}><span className="step-no">{s.no}</span><div><h3>{s.title}</h3><p>{s.text}</p></div><CheckCircle2 size={24}/></article>)}</div>
 </div></section>;
}
function Featured() {
 return <section className="spotlight section"><div className="shell">
   <div className="spotlight-panel school-watermark">
     <div><p className="label">MADE FOR CAMPUS LIFE</p><h2>Your assignments.<br/>Your next laptop.<br/><em>Your next place.</em></h2><p>Whatever is next on your list, there is a place to start right here.</p>
       <div className="spotlight-links"><AppLink href="/order/" className="btn btn-orange">Print now <ArrowUpRight size={18}/></AppLink><AppLink href="/housing/" className="btn btn-outline">Find housing <ArrowRight size={18}/></AppLink></div>
     </div>
     <div className="campus-figure" aria-hidden="true"><div className="campus-card"><House size={115}/></div><div className="campus-card second"><BookOpen size={102}/></div><div className="campus-ring"/></div>
   </div>
 </div></section>;
}
function More() {
 return <section className="more section"><div className="shell">
  <div className="section-head"><div><p className="label">MORE WAYS WE CAN HELP</p><h2>Good things happen<br/><em>when we connect.</em></h2></div><p>Find student support, campus updates and businesses working with AfriNet Hub.</p></div>
  <div className="more-grid">
    <AppLink href="/portal/" className="more-card"><ShieldCheck size={35}/><h3>Student portal help</h3><p>Need help finding the right way through a portal issue? Let's guide you.</p><span>Get support <ArrowUpRight size={18}/></span></AppLink>
    <AppLink href="/news/" className="more-card"><Zap size={35}/><h3>News & updates</h3><p>Stay informed about what is happening on the platform and around campus.</p><span>See updates <ArrowUpRight size={18}/></span></AppLink>
    <AppLink href="/partners/" className="more-card"><ShoppingBag size={35}/><h3>Our partners</h3><p>Meet the businesses and people helping us serve the community.</p><span>Meet our partners <ArrowUpRight size={18}/></span></AppLink>
  </div>
 </div></section>;
}
function Closing() {
 return <section className="closing"><div className="shell closing-grid"><div><p className="label">ONE PLACE. REAL POSSIBILITIES.</p><h2>You've got things to do.<br/><em>Let's make them easier.</em></h2><p>Start with what matters to you today. We're right here when you need us.</p></div><AppLink href="#services" className="btn btn-orange">Find a service <ArrowUpRight size={21}/></AppLink></div></section>;
}
function Footer() {
 return <footer className="footer"><div className="shell">
  <div className="footer-main"><div className="footer-brand"><Brand inverted/><p>Your everyday services, brought together. Serving the University of Ilesa community and beyond.</p><AppLink href="https://wa.me/2348083964600" external className="footer-whatsapp"><MessageCircle size={18}/> Chat on WhatsApp <ArrowUpRight size={16}/></AppLink></div>
    <div className="footer-menu"><h3>Explore</h3><a href="/printing/">Printing</a><a href="/gadgets/">Gadgets</a><a href="https://afrinethub.com" target="_blank" rel="noopener noreferrer">Data & airtime</a><a href="/housing/">Housing</a><a href="/project/">Projects & seminars</a></div>
    <div className="footer-menu"><h3>More</h3><a href="/portal/">Portal assistance</a><a href="/news/">News & updates</a><a href="/partners/">Partners</a><a href="/about/">About us</a><a href="https://unilesa.edu.ng" target="_blank" rel="noopener noreferrer">University of Ilesa <ArrowUpRight size={14}/></a></div>
    <div className="footer-menu"><h3>Information</h3><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms of service</a><a href="/refund/">Refund policy</a><a href="/admin/">Staff sign-in</a></div>
  </div>
  <div className="footer-bottom"><p>© {new Date().getFullYear()} AfriNet Hub. All rights reserved.</p><span>Made to keep your day moving.</span></div>
 </div></footer>;
}
export default function App(){return <><Header/><main><Carousel/><Services/><Trust/><Process/><Featured/><More/><Closing/></main><Footer/></>;}
