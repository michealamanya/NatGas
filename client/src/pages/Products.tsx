import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, Product, ProductCategory } from '../api/client';
import { ProductCard } from './Home';
import { addToCart } from '../lib/cart';

const COLORS = ['cyl-bg-0','cyl-bg-1','cyl-bg-2','cyl-bg-3','cyl-bg-4'];
const LIMIT  = 15;
const priceLabel = (price?: string | number, currency = 'UGX') => price === undefined || price === null ? 'Price on confirmation' : new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price));

/* ── Products listing ── */
export default function Products() {
  const location = useLocation();
  const qp = new URLSearchParams(location.search);
  const initCat  = qp.get('category') ?? '';
  const initFeat = qp.get('featured') === 'true';

  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState(initCat);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<ProductCategory[]>('/products/categories').then(r => setCategories(r.data ?? [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search)   q.set('search', search);
    if (activeCat)q.set('category', activeCat);
    if (initFeat && !search && !activeCat) q.set('featured', 'true');
    api<Product[]>(`/products?${q}`)
      .then(r => { setProducts(r.data ?? []); setTotal(r.meta?.total ?? 0); setTotalPages(r.meta?.totalPages ?? 1); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, activeCat, page]);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">NATGAS PRODUCTS</div>
          <h1>LPG Equipment &amp; Accessories</h1>
          <p>Certified cylinders, fittings, flanges, regulators and accessories from Uganda's authorized LPG distributor.</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="cat-tabs-bar">
        <div className="cat-tabs wrap">
          <button className={`cat-tab${activeCat === '' ? ' active' : ''}`} onClick={() => { setActiveCat(''); setPage(1); }}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`cat-tab${activeCat === c.slug ? ' active' : ''}`} onClick={() => { setActiveCat(c.slug); setPage(1); }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-wrap">
          <div className="search-field">
            <Search size={14} />
            <input ref={inputRef} type="text" placeholder="Search products…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} aria-label="Search products" />
            {search && <button style={{ background:'none', border:0, color:'var(--muted)', display:'flex', padding:0 }} onClick={() => { setSearch(''); setPage(1); inputRef.current?.focus(); }}><X size={13} /></button>}
          </div>
          <div className="filter-pills">
            <button className={`fpill${activeCat === '' ? ' active' : ''}`} onClick={() => { setActiveCat(''); setPage(1); }}>All products</button>
            {categories.slice(0,5).map(c => (
              <button key={c.id} className={`fpill${activeCat === c.slug ? ' active' : ''}`} onClick={() => { setActiveCat(c.slug); setPage(1); }}>{c.name}</button>
            ))}
          </div>
          <span className="result-ct">{loading ? '' : `${total} product${total !== 1 ? 's' : ''}`}</span>
        </div>
      </div>

      <section className="section" style={{ background:'#fff', paddingTop:32 }}>
        <div className="wrap">
          {loading ? (
            <div className="loading-state"><Loader2 size={26} className="spin" /><span>Loading products…</span></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setActiveCat(''); }}>Clear filters</button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((p, i) => <ProductCard key={p.id} p={p} idx={i} />)}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="ppage-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ArrowLeft size={13} /> Prev
                  </button>
                  <span style={{ fontSize:13, color:'var(--muted)' }}>Page {page} of {totalPages}</span>
                  <button className="ppage-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="cta-band">
        <div className="cta-wrap">
          <div>
            <h2>Need something specific?</h2>
            <p>We source certified LPG equipment for every project scale.</p>
          </div>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/contact">Talk to our team <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Single product detail ── */
export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState('');

  useEffect(() => {
    if (!slug) return;
    api<Product>(`/products/${slug}`)
      .then(r => { setProduct(r.data); setMainImg(r.data.imageUrl ?? ''); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading-state" style={{ minHeight:'60vh' }}><Loader2 size={28} className="spin" /></div>;
  if (!product) return (
    <div className="empty-state" style={{ minHeight:'60vh' }}>
      <h3>Product not found</h3>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/products')}>← Back to products</button>
    </div>
  );

  const specs    = product.specifications as Record<string,string> | null;
  const features = Array.isArray(product.features) ? product.features as string[] : [];
  const images   = Array.isArray(product.images) ? product.images as string[] : [];
  const allImgs  = [product.imageUrl, ...images].filter(Boolean) as string[];
  const colorIdx = 0;

  return (
    <>
      <div className="page-hero" style={{ paddingTop:40, paddingBottom:36 }}>
        <div className="page-hero-wrap">
          <Link to="/products" className="page-hero-back"><ArrowLeft size={13} /> All products</Link>
          <div className="chip">{product.category?.name ?? 'LPG PRODUCT'}</div>
          <h1>{product.name}</h1>
        </div>
      </div>

      <section className="section" style={{ background:'#fff', paddingTop:40 }}>
        <div className="wrap">
          <div className="pd-wrap">
            {/* Gallery */}
            <div className="pd-gallery">
              <div className="pd-main-img">
                {mainImg
                  ? <img src={mainImg} alt={product.name} />
                  : <div className={`pcard-img ${COLORS[colorIdx]}`} style={{ width:'100%', height:'100%' }}>
                      <div className="cyl-placeholder">
                        <span className="cyl-ph-brand">NATGAS</span>
                        <span className="cyl-ph-size" style={{ fontSize:56 }}>{product.cylinderSize ?? 'LPG'}</span>
                      </div>
                    </div>
                }
              </div>
              {allImgs.length > 1 && (
                <div className="pd-thumbs">
                  {allImgs.map((img, i) => (
                    <div key={i} className={`pd-thumb${mainImg === img ? ' active' : ''}`} onClick={() => setMainImg(img)}>
                      <img src={img} alt={`${product.name} ${i+1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pd-info">
              <span className="pd-cat-tag">{product.category?.name ?? 'LPG PRODUCT'}</span>
              <h1 className="pd-title">{product.name}</h1>
              <div className="pd-price">{priceLabel(product.price, product.currency)}</div>

              <div className="pd-avail">
                <span style={{ width:8, height:8, borderRadius:'50%', background: product.isAvailable ? '#08705a' : '#9b5b00', display:'inline-block' }} />
                <span style={{ fontSize:13, fontWeight:600, color: product.isAvailable ? '#08705a' : '#9b5b00' }}>
                  {product.isAvailable ? 'In stock' : 'Out of stock'}
                </span>
                {product.isFeatured && (
                  <span className="pcard-badge-feat" style={{ position:'static', marginLeft:8 }}>Featured</span>
                )}
              </div>

              <div className="pd-divider" />

              {(product.description ?? product.shortDescription) && (
                <p className="pd-desc">{product.description ?? product.shortDescription}</p>
              )}

              {features.length > 0 && (
                <div>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'var(--green)' }}>Features</h3>
                  <ul className="pd-features-list">
                    {features.map(f => <li key={f}><CheckCircle2 size={13} />{f}</li>)}
                  </ul>
                </div>
              )}

              {specs && Object.keys(specs).length > 0 && (
                <div>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'var(--green)' }}>Specifications</h3>
                  <table className="pd-specs">
                    <tbody>{Object.entries(specs).map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {product.safetyInfo && (
                <div className="pd-safety">
                  <p><strong>⚠ Safety:</strong> {product.safetyInfo}</p>
                </div>
              )}

              <div className="pd-actions">
                <button className="btn btn-primary" disabled={!product.isAvailable} onClick={() => { addToCart(product); navigate('/order'); }}>
                  {product.isAvailable ? <>Add to order <ArrowRight size={14} /></> : 'Currently unavailable'}
                </button>
                <Link className="btn btn-outline btn-sm" to="/products">← Back to products</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
