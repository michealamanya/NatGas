import {
  ArrowRight, Award, CheckCircle2, ChevronRight,
  CreditCard, Globe, HardHat, MapPin, MessageCircle, Package,
  Search, ShieldCheck, Truck, Wrench,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { api, Job, Location, NewsArticle, Product, ProductCategory } from '../api/client';
import { addToCart } from '../lib/cart';
import { useRealtimeRefresh } from '../lib/realtime';

const COLORS = ['cyl-bg-0','cyl-bg-1','cyl-bg-2','cyl-bg-3','cyl-bg-4'];
const priceLabel = (price?: string | number, currency = 'UGX') => price === undefined || price === null ? 'Price on confirmation' : new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price));

export default function Home() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [news,       setNews]        = useState<NewsArticle[]>([]);
  const [jobs,       setJobs]        = useState<Job[]>([]);
  const [networkPoints, setNetworkPoints] = useState<Location[]>([]);
  const [activeTab,  setActiveTab]   = useState('');
  const [experience, setExperience] = useState<Record<string, string>>({});

  useEffect(() => {
    api<NewsArticle[]>('/news?limit=3').then(r => setNews(r.data ?? [])).catch(() => undefined);
    api<Job[]>('/jobs?limit=3').then(r => setJobs(r.data ?? [])).catch(() => undefined);
    api<Location[]>('/locations').then(r => setNetworkPoints(r.data ?? [])).catch(() => undefined);
    api<Record<string, unknown>>('/settings/public').then(r => {
      setExperience(Object.fromEntries(Object.entries(r.data ?? {}).map(([key, value]) => [key, String(value ?? '')])));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams({ limit: '10' });
    if (activeTab) q.set('category', activeTab);
    else q.set('featured', 'true');
    api<Product[]>(`/products?${q}`).then(r => setProducts(r.data ?? [])).catch(() => undefined);
  }, [activeTab]);
  useRealtimeRefresh(() => {
    api<NewsArticle[]>('/news?limit=3').then(r => setNews(r.data ?? [])).catch(() => undefined);
    api<Job[]>('/jobs?limit=3').then(r => setJobs(r.data ?? [])).catch(() => undefined);
    api<Location[]>('/locations').then(r => setNetworkPoints(r.data ?? [])).catch(() => undefined);
    api<Record<string, unknown>>('/settings/public').then(r => setExperience(Object.fromEntries(Object.entries(r.data ?? {}).map(([key, value]) => [key, String(value ?? '')])))).catch(() => undefined);
    const q = new URLSearchParams({ limit: '10' }); if (activeTab) q.set('category', activeTab); else q.set('featured', 'true'); api<Product[]>(`/products?${q}`).then(r => setProducts(r.data ?? [])).catch(() => undefined);
  });

  const FALLBACK = ['3kg','6kg','12.5kg','38kg','Flanges'];
  const heroMedia = experience.home_hero_media_url;
  const heroIsVideo = experience.home_hero_media_type === 'video';
  const heroStyle = !heroIsVideo && heroMedia ? { '--hero-media': `url("${heroMedia}")`, '--hero-overlay': `${Number(experience.home_hero_overlay || 70) / 100}` } as CSSProperties : undefined;
  useEffect(() => { if (experience.site_font) document.documentElement.style.setProperty('--site-font', `'${experience.site_font}', system-ui, sans-serif`); }, [experience.site_font]);

  return (
    <>
      {/* ── Hero banner ── */}
      {experience.home_announcement_enabled === 'true' && experience.home_announcement_text && <Link className="home-announcement" to={experience.home_announcement_link || '/products'}><b>{experience.home_announcement_label || 'New'}</b><span>{experience.home_announcement_text}</span><ArrowRight size={14}/></Link>}
      <div className={`hero-banner${heroIsVideo && heroMedia ? ' hero-video' : ''}`} style={heroStyle}>
        {heroIsVideo && heroMedia && <video className="hero-video-media" src={heroMedia} autoPlay muted loop playsInline />}
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">
              <ShieldCheck size={11} style={{ verticalAlign:'middle', marginRight:4 }} />
              Gas Engineering &amp; LPG Infrastructure · Uganda
            </div>
            <h1 className="hero-h1">
              {experience.homepage_hero_title || 'Engineering safe LPG'}<br /><em>systems that perform.</em>
            </h1>
            <p className="hero-sub">
              {experience.homepage_hero_subtitle || 'From shop drawings and reticulated gas systems to installation, inspection, maintenance and NDT—NATGAS engineers dependable LPG infrastructure for Uganda.'}
            </p>
            <div className="hero-btns">
              <Link className="btn btn-primary" to="/contact">
                Request an engineering quote <ArrowRight size={14} />
              </Link>
              <Link className="btn btn-wht" to="/services">Explore engineering services</Link>
            </div>
          </div>

          <div className="hero-stats">
            {[
              { icon: HardHat,     title: 'Gas Engineering',        sub: 'Design, drawings & installation' },
              { icon: Award,       title: 'Safety & Compliance',    sub: 'Inspection, testing & standards' },
              { icon: Wrench,      title: 'Lifecycle Support',      sub: 'Maintenance & technical consultancy' },
              { icon: Globe,       title: 'Distribution Network',   sub: 'Refills and reliable LPG supply' },
            ].map(({ icon: Icon, title, sub }) => (
              <div className="hero-stat-card" key={title}>
                <div className="hero-stat-icon"><Icon size={18} /></div>
                <div className="hero-stat-text"><b>{title}</b><span>{sub}</span></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Trust strip ── */}
      <div className="promo-strip">
        <div className="promo-strip-inner">
          {[
            { icon: HardHat,      title: 'LPG System Design',      sub: 'Shop drawings and site engineering' },
            { icon: Wrench,       title: 'Installation & Testing', sub: 'Commissioning and NDT support' },
            { icon: ShieldCheck,  title: 'Safety Inspection',      sub: 'Compliance-led system reviews' },
            { icon: Award,        title: 'Technical Consultancy',  sub: 'Practical LPG expertise' },
            { icon: Truck,        title: 'Authorized Distribution',sub: 'Refills, equipment and logistics' },
          ].map(({ icon: Icon, title, sub }) => (
            <div className="promo-item" key={title}>
              <div className="promo-icon"><Icon size={18} /></div>
              <div><b>{title}</b><span>{sub}</span></div>
            </div>
          ))}
        </div>
      </div>

      <section className="section engineering-focus-section"><div className="wrap"><div className="section-head engineering-heading"><div><span className="chip-sm">GAS ENGINEERING</span><h2>Engineering LPG systems from concept to safe operation.</h2><p>We combine design capability, field execution and long-term technical support for homes, institutions, hospitality and industry.</p></div><Link className="btn btn-dark" to="/services">Our engineering services <ArrowRight size={14}/></Link></div><div className="engineering-grid">{[{icon:HardHat,title:'Design & shop drawings',text:'Smart, scalable LPG designs, reticulated systems and site assessments.'},{icon:Wrench,title:'Installation & commissioning',text:'Tanks, pipelines, burners and complete LPG systems installed by verified engineers.'},{icon:Search,title:'Inspection, NDT & maintenance',text:'Testing, compliance checks, repairs and preventive care across the system lifecycle.'}].map(({icon:Icon,title,text})=><article key={title}><Icon size={25}/><h3>{title}</h3><p>{text}</p><Link to="/services">Learn more <ArrowRight size={13}/></Link></article>)}</div></div></section>

      {/* ── Product category tabs + grid ── */}
      {false && <>
      <div className="cat-tabs-bar">
        <div className="cat-tabs">
          <button className={`cat-tab${activeTab === '' ? ' active' : ''}`} onClick={() => setActiveTab('')}>
            Featured
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`cat-tab${activeTab === c.slug ? ' active' : ''}`}
              onClick={() => setActiveTab(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <section className="section" style={{ background:'#fff', paddingTop: 32, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="section-head">
            <h2>
              {activeTab
                ? categories.find(c => c.slug === activeTab)?.name ?? 'Products'
                : 'Featured Products'
              }
            </h2>
            <Link className="link-all" to="/products">View all <ChevronRight size={14} /></Link>
          </div>

          <div className="product-grid">
            {products.length > 0
              ? products.map((p, i) => <ProductCard key={p.id} p={p} idx={i} />)
              : FALLBACK.map((s, i) => (
                  <div className="pcard" key={s}>
                    <div className={`pcard-img ${COLORS[i % 5]}`}>
                      <div className="cyl-placeholder">
                        <span className="cyl-ph-brand">NATGAS</span>
                        <span className="cyl-ph-size">{s}</span>
                      </div>
                    </div>
                    <div className="pcard-body">
                      <span className="pcard-cat">NATGAS EQUIPMENT</span>
                      <h3 className="pcard-name">{s} {s.includes('kg') ? 'LPG Cylinder' : ''}</h3>
                      <p className="pcard-desc">Certified product from Natgas Uganda.</p>
                      <div className="pcard-footer">
                        <span className="pcard-avail avail-yes">In stock</span>
                        <Link to="/products" className="pcard-link">Details <ArrowRight size={12} /></Link>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>

          <div style={{ textAlign:'center', marginTop: 32 }}>
            <Link className="btn btn-dark" to="/products">
              View full product catalogue <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      </>}

      <section className="section distribution-section"><div className="wrap distribution-grid"><div className="distribution-map-card"><span className="chip-sm">DISTRIBUTION FOOTPRINT</span><h2>Engineering-led, backed by dependable LPG supply.</h2><p>Our distribution network supports engineering clients and households with refill access, equipment and responsive delivery coordination.</p><div className="uganda-footprint" aria-label="Uganda distribution footprint illustration"><span className="footprint-line line-one"/><span className="footprint-line line-two"/><span className="footprint-pin pin-central"><MapPin size={18}/><b>Central</b></span><span className="footprint-pin pin-east"><MapPin size={18}/><b>Eastern</b></span><span className="footprint-pin pin-west"><MapPin size={18}/><b>Western</b></span><span className="footprint-pin pin-north"><MapPin size={18}/><b>Northern</b></span></div><Link className="btn btn-primary" to="/locations">Find a refill point or contact <ArrowRight size={14}/></Link></div><div className="distribution-points"><div><span className="chip-sm">NETWORK CONTACTS</span><h2>Nearby support when you need it.</h2></div>{networkPoints.slice(0,3).map(point=><article key={point.id}><MapPin size={18}/><div><h3>{point.name}</h3><p>{point.address}, {point.district}</p>{point.phone && <a href={`tel:${point.phone}`}>{point.phone}</a>}</div><a className="distribution-directions" href={point.latitude && point.longitude ? `https://www.google.com/maps?q=${point.latitude},${point.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.name}, ${point.address}, Uganda`)}`} target="_blank" rel="noreferrer">Directions</a></article>)}{!networkPoints.length && <article><MapPin size={18}/><div><h3>Kawuku, Entebbe Road</h3><p>Contact NATGAS for nearby refill support and distribution enquiries.</p><a href="tel:+256740938040">+256 740 938 040</a></div></article>}<Link className="link-all" to="/locations">View network contacts <ChevronRight size={14}/></Link></div></div></section>

      {/* ── Services ── */}
      {false && <><section id="why-choose" className="section home-value-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">WHY CHOOSE NATGAS</span><h2>Energy delivered with safety and care.</h2></div></div><div className="home-value-grid">{[{icon:ShieldCheck,title:'Safety first',text:'Certified cylinders, safe handling guidance and trained support.'},{icon:Truck,title:'Reliable supply',text:'Dependable LPG availability and convenient delivery coordination.'},{icon:CheckCircle2,title:'Genuine cylinders',text:'Quality-checked NATGAS products and trusted accessories.'},{icon:MessageCircle,title:'Customer support',text:'Helpful assistance for homes, dealers and commercial customers.'}].map(({icon:Icon,title,text}) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section id="how-to-order" className="section home-order-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">HOW TO ORDER</span><h2>Gas delivered in four clear steps.</h2></div><Link className="btn btn-dark" to="/products">Order Gas <ArrowRight size={14}/></Link></div><div className="order-steps">{[{icon:Package,title:'Select product',text:'Choose your cylinder or refill size.'},{icon:MapPin,title:'Share location',text:'Tell us your district and delivery point.'},{icon:CreditCard,title:'Confirm payment',text:'Confirm the agreed payment method.'},{icon:Truck,title:'Receive delivery',text:'Get your LPG supply safely and conveniently.'}].map(({icon:Icon,title,text},index) => <article key={title}><span>{index + 1}</span><Icon size={23}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section></>}

      {/* ── Latest news ── */}
      <section className="section home-review-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">CUSTOMER FEEDBACK</span><h2>Trusted by homes and businesses.</h2></div></div><div className="review-grid"><blockquote>“The delivery coordination was clear, and the safety guidance was genuinely useful.”<footer>Household customer, Kampala</footer></blockquote><blockquote>“NATGAS helped us plan a more reliable LPG supply for our kitchen operations.”<footer>Commercial customer, Entebbe</footer></blockquote><blockquote>“Professional, responsive and careful about every installation detail.”<footer>Business customer, Central Region</footer></blockquote></div>{/* Placeholder testimonials — replace with approved customer quotes via the CMS */}</div></section>

      <section className="business-cta"><div className="wrap"><div><span className="chip-sm">PARTNER WITH NATGAS</span><h2>Grow your business with dependable LPG supply.</h2><p>Become an authorised dealer or request a commercial and bulk-LPG quotation.</p></div><div className="cta-btns"><Link className="btn btn-primary" to="/contact">Become a dealer</Link><Link className="btn btn-wht" to="/contact">Request a business quote</Link></div></div></section>

      {news.length > 0 && (
        <section className="section" style={{ background:'#fff' }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="chip-sm">NEWS &amp; BLOG</span>
                <h2>Latest updates.</h2>
              </div>
              <Link className="link-all" to="/news">All articles <ChevronRight size={14} /></Link>
            </div>
            <div className="news-grid">
              {news.map(a => <NewsCard key={a.id} a={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Careers / opportunities ── */}
      {jobs.length > 0 && (
        <section className="section" style={{ background:'var(--cream)' }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="chip-sm">OPPORTUNITIES</span>
                <h2>Join the NATGAS team.</h2>
                <p style={{ color:'var(--muted)', fontSize:14, marginTop:8 }}>
                  We're growing, help us deliver safe, reliable energy across Uganda.
                </p>
              </div>
              <Link className="link-all" to="/careers">All vacancies <ChevronRight size={14} /></Link>
            </div>
            <div className="job-list">
              {jobs.map(j => <JobCard key={j.id} j={j} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <div className="cta-band">
        <div className="cta-wrap">
          <div>
            <h2>Looking for LPG installation &amp; maintenance services in Uganda?</h2>
            <p>Contact us today for a free consultation and quote from our certified team.</p>
          </div>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/contact">Contact us today</Link>
            <Link className="btn btn-wht"     to="/services">Our services</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Reusable cards ─ */
export function ProductCard({ p, idx }: { p: Product; idx: number }) {
  const [added, setAdded] = useState(false);
  return (
    <article className="pcard">
      <Link to={`/products/${p.slug}`} className={`pcard-img ${p.imageUrl ? '' : COLORS[idx % 5]}`}>
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.name} loading="lazy" />
          : <div className="cyl-placeholder">
              <span className="cyl-ph-brand">NATGAS</span>
              <span className="cyl-ph-size">{p.cylinderSize ?? 'EQUIPMENT'}</span>
            </div>
        }
        {!p.isAvailable && <div className="pcard-badge-out">Out of stock</div>}
        {p.isFeatured && p.isAvailable && <span className="pcard-badge-feat">Featured</span>}
      </Link>
      <div className="pcard-body">
        <div className="pcard-topline">
          <span className="pcard-cat">{p.category?.name ?? 'NATGAS EQUIPMENT'}</span>
          {p.cylinderSize && <span className="pcard-size">{p.cylinderSize}</span>}
        </div>
        <Link to={`/products/${p.slug}`} className="pcard-name">{p.name}</Link>
        <strong className="pcard-price">{priceLabel(p.price, p.currency)}</strong>
        <div className="pcard-footer">
          <span className={`pcard-avail ${p.isAvailable ? 'avail-yes' : 'avail-no'}`}>
            {p.isAvailable ? 'In stock' : 'Unavailable'}
          </span>
          <button className="pcard-order" disabled={!p.isAvailable} onClick={() => { addToCart(p); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}>{added ? 'Added to cart' : 'Add to cart'} <ArrowRight size={12} /></button>
        </div>
      </div>
    </article>
  );
}

export function NewsCard({ a }: { a: NewsArticle }) {
  return (
    <Link to={`/news/${a.slug}`} className="ncard" style={{ textDecoration:'none' }}>
      {a.featuredImage && (
        <div className="ncard-img"><img src={a.featuredImage} alt={a.title} loading="lazy" /></div>
      )}
      <div className="ncard-body">
        <span className="ncard-date">
          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-UG',{day:'2-digit',month:'short',year:'numeric'}) : ''}
        </span>
        <h3>{a.title}</h3>
        {a.summary && <p>{a.summary}</p>}
        <span className="ncard-more">Read more <ArrowRight size={11} /></span>
      </div>
    </Link>
  );
}

export function JobCard({ j }: { j: Job }) {
  const T: Record<string,string> = { FULL_TIME:'Full-time', PART_TIME:'Part-time', CONTRACT:'Contract', INTERNSHIP:'Internship', CONSULTANT:'Consultant' };
  return (
    <Link to={`/careers/${j.slug}`} className="jcard" style={{ textDecoration:'none' }}>
      <div className="jcard-info">
        <h4>{j.title}</h4>
        <div className="jcard-meta">
          {j.department && <span>{j.department}</span>}
          {j.location   && <span><MapPin size={11} />{j.location}</span>}
        </div>
      </div>
      <div className="jcard-right">
        <span className="jtype">{T[j.employmentType] ?? j.employmentType}</span>
        {j.deadline && <span className="jdeadline">Closes {new Date(j.deadline).toLocaleDateString('en-UG',{month:'short',day:'numeric',year:'numeric'})}</span>}
        <span style={{ fontSize:12, fontWeight:700, color:'var(--green-3)', display:'flex', alignItems:'center', gap:3 }}>Apply <ArrowRight size={11} /></span>
      </div>
    </Link>
  );
}
