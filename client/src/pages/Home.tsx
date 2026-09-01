import {
  ArrowRight, Award, CheckCircle2, ChevronRight,
  CreditCard, Globe, HardHat, MapPin, MessageCircle, Package, Phone,
  Search, ShieldCheck, Truck, Wrench,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Job, Location, NewsArticle, Product, ProductCategory } from '../api/client';
import { addToCart } from '../lib/cart';

const COLORS = ['cyl-bg-0','cyl-bg-1','cyl-bg-2','cyl-bg-3','cyl-bg-4'];
const priceLabel = (price?: string | number, currency = 'UGX') => price === undefined || price === null ? 'Price on confirmation' : new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price));

export default function Home() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [news,       setNews]        = useState<NewsArticle[]>([]);
  const [jobs,       setJobs]        = useState<Job[]>([]);
  const [locations,  setLocations]   = useState<Location[]>([]);
  const [district,   setDistrict]    = useState('');
  const [activeTab,  setActiveTab]   = useState('');
  const [experience, setExperience] = useState<Record<string, string>>({});

  useEffect(() => {
    api<ProductCategory[]>('/products/categories').then(r => setCategories(r.data ?? [])).catch(() => undefined);
    api<NewsArticle[]>('/news?limit=3').then(r => setNews(r.data ?? [])).catch(() => undefined);
    api<Job[]>('/jobs?limit=3').then(r => setJobs(r.data ?? [])).catch(() => undefined);
    api<Location[]>('/locations').then(r => setLocations(r.data ?? [])).catch(() => undefined);
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
              Authorized LPG Distributor &amp; Technical Services · Uganda
            </div>
            <h1 className="hero-h1">
              {experience.homepage_hero_title || 'Safe LPG systems for'}<br /><em>homes, business and industry.</em>
            </h1>
            <p className="hero-sub">
              {experience.homepage_hero_subtitle || 'Certified LPG distribution, system design, installation, maintenance and NDT testing for homes, businesses and industries across Uganda.'}
            </p>
            <div className="hero-btns">
              <Link className="btn btn-primary" to="/products">
                Order now <ArrowRight size={14} />
              </Link>
              <Link className="btn btn-wht" to="/locations">Find a dealer</Link>
            </div>
          </div>

          <div className="hero-stats">
            {[
              { icon: ShieldCheck, title: 'Certified & Authorized', sub: 'Official distributor for oil companies' },
              { icon: Award,       title: 'UNBS Compliant',         sub: 'Meets national safety standards' },
              { icon: Globe,       title: 'Nationwide',             sub: 'All regions of Uganda' },
              { icon: HardHat,     title: 'Expert Engineers',       sub: 'Licensed LPG professionals' },
            ].map(({ icon: Icon, title, sub }) => (
              <div className="hero-stat-card" key={title}>
                <div className="hero-stat-icon"><Icon size={18} /></div>
                <div className="hero-stat-text"><b>{title}</b><span>{sub}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-bar" style={{ display:'flex', alignItems:'center', gap:16, padding:'10px max(3vw,20px)', background:'rgba(0,0,0,.25)', fontSize:12, color:'#7ab8b0' }}>
          <Phone size={12} /> +256 740 938 040 &nbsp;&nbsp;|&nbsp;&nbsp;
          <Phone size={12} /> +256 781 011 751 &nbsp;&nbsp;|&nbsp;&nbsp;
          <MapPin size={12} /> Kawuku, Entebbe Road, Uganda
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className="promo-strip">
        <div className="promo-strip-inner">
          {[
            { icon: Truck,        title: 'Nationwide Delivery',    sub: 'We serve all regions of Uganda' },
            { icon: ShieldCheck,  title: 'Certified Products',     sub: 'UNBS approved equipment' },
            { icon: CheckCircle2, title: 'Authorized Distributor', sub: 'Official oil company partner' },
            { icon: HardHat,      title: 'Expert Installation',    sub: 'Licensed technical engineers' },
            { icon: Wrench,       title: '24/7 Maintenance',       sub: 'Emergency support available' },
          ].map(({ icon: Icon, title, sub }) => (
            <div className="promo-item" key={title}>
              <div className="promo-icon"><Icon size={18} /></div>
              <div><b>{title}</b><span>{sub}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product category tabs + grid ── */}
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
                      <span className="pcard-cat">LPG PRODUCT</span>
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

      {/* ── Services ── */}
      <section className="section home-value-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">WHY CHOOSE NATGAS</span><h2>Energy delivered with safety and care.</h2></div></div><div className="home-value-grid">{[{icon:ShieldCheck,title:'Safety first',text:'Certified cylinders, safe handling guidance and trained support.'},{icon:Truck,title:'Reliable supply',text:'Dependable LPG availability and convenient delivery coordination.'},{icon:CheckCircle2,title:'Genuine cylinders',text:'Quality-checked NATGAS products and trusted accessories.'},{icon:MessageCircle,title:'Customer support',text:'Helpful assistance for homes, dealers and commercial customers.'}].map(({icon:Icon,title,text}) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="section home-order-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">HOW TO ORDER</span><h2>Gas delivered in four clear steps.</h2></div><Link className="btn btn-dark" to="/products">Order Gas <ArrowRight size={14}/></Link></div><div className="order-steps">{[{icon:Package,title:'Select product',text:'Choose your cylinder or refill size.'},{icon:MapPin,title:'Share location',text:'Tell us your district and delivery point.'},{icon:CreditCard,title:'Confirm payment',text:'Confirm the agreed payment method.'},{icon:Truck,title:'Receive delivery',text:'Get your LPG supply safely and conveniently.'}].map(({icon:Icon,title,text},index) => <article key={title}><span>{index + 1}</span><Icon size={23}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="section dealer-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">DEALER & OUTLET LOCATOR</span><h2>Find LPG near you.</h2></div></div><div className="locator-search"><Search size={18}/><input value={district} onChange={event => setDistrict(event.target.value)} placeholder="Search by district or outlet name" aria-label="Search dealer outlets"/></div><div className="dealer-grid">{locations.filter(location => `${location.name} ${location.district} ${location.region}`.toLowerCase().includes(district.toLowerCase())).slice(0,3).map(location => <article key={location.id}><MapPin size={20}/><h3>{location.name}</h3><p>{location.address}, {location.district}</p><a href={`tel:${location.phone ?? ''}`}>{location.phone ?? 'Contact outlet'}</a></article>)}{!locations.length && <p>Outlet information will appear here as it is added in the CMS.</p>}</div></div></section>

      <section className="section" style={{ background:'var(--cream)', paddingTop:48, paddingBottom:48 }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="chip-sm">OUR SERVICES</span>
              <h2>Full-cycle LPG technical services.</h2>
            </div>
            <Link className="link-all" to="/services">All services <ChevronRight size={14} /></Link>
          </div>
          <div className="svc-grid">
            {[
              { icon: ShieldCheck, t: 'Authorized LPG Distribution',      d: 'Official distributor for major oil companies with reliable last-mile logistics.' },
              { icon: HardHat,     t: 'LPG Systems Design & Installation', d: 'Shop drawings, system design and end-to-end LPG tank and pipe installation.' },
              { icon: Wrench,      t: 'Maintenance & NDT Testing',         d: 'Preventive maintenance, emergency repairs and non-destructive testing.' },
              { icon: CheckCircle2,t: 'LPG Inspections',                   d: 'Certified safety and compliance inspections for industrial LPG systems.' },
              { icon: Award,       t: 'Equipment & Accessories',           d: 'Flanges, fittings, regulators, brass adaptors and all LPG accessories.' },
              { icon: Globe,       t: 'Technical Consultancy',             d: 'Expert LPG feasibility studies, risk assessments and regulatory guidance.' },
            ].map(({ icon: Icon, t, d }) => (
              <div className="svc-card" key={t}>
                <div className="svc-icon"><Icon size={22} /></div>
                <h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest news ── */}
      <section className="section home-review-section"><div className="wrap"><div className="section-head"><div><span className="chip-sm">CUSTOMER FEEDBACK</span><h2>Trusted by homes and businesses.</h2></div></div><div className="review-grid"><blockquote>“The delivery coordination was clear, and the safety guidance was genuinely useful.”<footer>Household customer, Kampala</footer></blockquote><blockquote>“NATGAS helped us plan a more reliable LPG supply for our kitchen operations.”<footer>Commercial customer, Entebbe</footer></blockquote><blockquote>“Professional, responsive and careful about every installation detail.”<footer>Business customer, Central Region</footer></blockquote></div><p className="review-note">Testimonials are displayed only after customer confirmation; these representative placeholders can be replaced with approved reviews in the CMS.</p></div></section>

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
  const navigate = useNavigate();
  return (
    <article className="pcard">
      <Link to={`/products/${p.slug}`} className={`pcard-img ${p.imageUrl ? '' : COLORS[idx % 5]}`}>
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.name} loading="lazy" />
          : <div className="cyl-placeholder">
              <span className="cyl-ph-brand">NATGAS</span>
              <span className="cyl-ph-size">{p.cylinderSize ?? 'LPG'}</span>
            </div>
        }
        {!p.isAvailable && <div className="pcard-badge-out">Out of stock</div>}
        {p.isFeatured && p.isAvailable && <span className="pcard-badge-feat">Featured</span>}
      </Link>
      <div className="pcard-body">
        <div className="pcard-topline">
          <span className="pcard-cat">{p.category?.name ?? 'LPG PRODUCT'}</span>
          {p.cylinderSize && <span className="pcard-size">{p.cylinderSize}</span>}
        </div>
        <Link to={`/products/${p.slug}`} className="pcard-name">{p.name}</Link>
        <strong className="pcard-price">{priceLabel(p.price, p.currency)}</strong>
        <div className="pcard-footer">
          <span className={`pcard-avail ${p.isAvailable ? 'avail-yes' : 'avail-no'}`}>
            {p.isAvailable ? 'In stock' : 'Unavailable'}
          </span>
          <button className="pcard-order" disabled={!p.isAvailable} onClick={() => { addToCart(p); navigate('/order'); }}>Add to order <ArrowRight size={12} /></button>
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
