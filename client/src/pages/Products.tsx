import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Grid3X3, List, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, Product, ProductCategory } from '../api/client';
import { ProductCard } from './Home';
import { addToCart } from '../lib/cart';
import { useRealtimeRefresh } from '../lib/realtime';
import { getCategoryPresentation } from '../lib/product-category';

const COLORS = ['cyl-bg-0','cyl-bg-1','cyl-bg-2','cyl-bg-3','cyl-bg-4'];
const LIMIT  = 15;
const priceLabel = (price?: string | number, currency = 'UGX') => price === undefined || price === null ? 'Price on confirmation' : new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price));

/* ── Products listing ── */
export default function Products() {
  const location = useLocation();
  const qp = new URLSearchParams(location.search);
  const initCat  = qp.get('category') ?? '';
  const initFeat = qp.get('featured') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(initCat);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedPrices, setAppliedPrices] = useState({ min: '', max: '' });
  const [sort, setSort] = useState('default');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);

  const fetchCategories = () => api<ProductCategory[]>('/products/categories').then(r => setCategories(r.data ?? [])).catch(() => undefined);
  const fetchProducts = (withLoading = true) => {
    if (withLoading) setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.trim()) q.set('search', search.trim());
    if (activeCat) q.set('category', activeCat);
    if (appliedPrices.min) q.set('minPrice', appliedPrices.min);
    if (appliedPrices.max) q.set('maxPrice', appliedPrices.max);
    if (sort !== 'default') q.set('sort', sort);
    if (initFeat && !search && !activeCat) q.set('featured', 'true');
    return api<Product[]>(`/products?${q}`).then(r => {
      setProducts(r.data ?? []); setTotal(r.meta?.total ?? 0); setTotalPages(r.meta?.totalPages ?? 1);
    }).catch(() => { setProducts([]); setTotal(0); }).finally(() => { if (withLoading) setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [search, activeCat, appliedPrices, sort, page]);
  useRealtimeRefresh(() => { fetchProducts(false); fetchCategories(); });

  const chooseCategory = (slug = '') => { setActiveCat(slug); setPage(1); };
  const resetFilters = () => { setSearch(''); setActiveCat(''); setMinPrice(''); setMaxPrice(''); setAppliedPrices({ min: '', max: '' }); setSort('default'); setPage(1); };
  const activeCategoryName = categories.find(c => c.slug === activeCat)?.name;
  const activeCategory = categories.find(c => c.slug === activeCat);
  const categoryPresentation = getCategoryPresentation(activeCategory);
  const scrollCategoryRail = (direction: -1 | 1) => categoryRailRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });

  return (
    <>
      <header className="shop-heading">
        <div className="wrap">
          <div className="shop-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Shop</span></div>
          <div className="shop-heading-row"><div><div className="chip">{activeCategory ? activeCategory.name.toUpperCase() : 'NATGAS SHOP'}</div><h1>{activeCategory ? categoryPresentation.title : 'Engineering equipment, LPG & accessories'}</h1></div><p>{activeCategory ? categoryPresentation.description : 'Browse certified products for homes, businesses and industrial LPG projects.'}</p></div>
        </div>
      </header>
      <nav className="shop-category-rail" aria-label="Shop categories">
        <div className="shop-category-rail-shell">
          <button className="shop-rail-arrow" aria-label="Previous product categories" onClick={() => scrollCategoryRail(-1)}><ChevronLeft size={21} /></button>
          <div className="shop-category-rail-inner" ref={categoryRailRef}>
            <button className={`shop-rail-item${!activeCat ? ' active' : ''}`} onClick={() => chooseCategory()}>All</button>
            {categories.map(category => <button key={category.id} className={`shop-rail-item${activeCat === category.slug ? ' active' : ''}`} onClick={() => chooseCategory(category.slug)}>{category.name}</button>)}
          </div>
          <button className="shop-rail-arrow" aria-label="Next product categories" onClick={() => scrollCategoryRail(1)}><ChevronRight size={21} /></button>
        </div>
      </nav>
      <section className="shop-section">
        <div className="wrap shop-layout">
          <aside className="shop-sidebar" aria-label="Product filters">
            <div className="shop-side-title"><h2>Product categories</h2><Search size={20} /></div><div className="shop-side-rule" />
            <button className={`shop-category${!activeCat ? ' active' : ''}`} onClick={() => chooseCategory()}><span>All products</span><b>{categories.reduce((sum, category) => sum + (category._count?.products ?? 0), 0) || total}</b></button>
            {categories.map(category => <button key={category.id} className={`shop-category${activeCat === category.slug ? ' active' : ''}`} onClick={() => chooseCategory(category.slug)}><span>{category.name}</span><b>{category._count?.products ?? 0}</b></button>)}
            <div className="shop-price-filter"><h3><SlidersHorizontal size={15} /> Price range (UGX)</h3><div className="shop-price-inputs"><input type="number" min="0" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} /><span>–</span><input type="number" min="0" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></div><button className="shop-apply-price" onClick={() => { setAppliedPrices({ min: minPrice, max: maxPrice }); setPage(1); }}>Apply range</button></div>
          </aside>
          <div className="shop-content">
          <div className="shop-search-row"><div className="shop-search"><Search size={18} /><input ref={inputRef} type="search" placeholder="Search equipment, valves, fittings, pipes and accessories" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />{search && <button aria-label="Clear search" onClick={() => { setSearch(''); setPage(1); inputRef.current?.focus(); }}><X size={16} /></button>}</div>{(search || activeCat || appliedPrices.min || appliedPrices.max) && <button className="shop-clear" onClick={resetFilters}>Clear filters</button>}</div>
            <div className="shop-toolbar"><div><span className="shop-active-label">{activeCategoryName ?? 'All products'}</span><p>{loading ? 'Loading catalogue…' : `Showing ${products.length ? (page - 1) * LIMIT + 1 : 0}–${Math.min(page * LIMIT, total)} of ${total} products`}</p></div><div className="shop-toolbar-controls"><div className="shop-view-toggle"><button aria-label="Grid view" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid3X3 size={19} /></button><button aria-label="List view" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={20} /></button></div><label className="shop-sort"><span>Sort</span><select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="default">Featured first</option><option value="newest">Newest arrivals</option><option value="name">Name A–Z</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div></div>
            {loading ? <div className="loading-state"><Loader2 size={26} className="spin" /><span>Loading products…</span></div> : products.length === 0 ? <div className="empty-state"><h3>No products found</h3><p>Try another product name, category or price range.</p><button className="btn btn-outline btn-sm" onClick={resetFilters}>Clear filters</button></div> : <><div className={`product-grid shop-results ${view === 'list' ? 'shop-list-view' : ''}`}>{products.map((p, i) => <ProductCard key={p.id} p={p} idx={i} />)}</div>{totalPages > 1 && <div className="pagination"><button className="ppage-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={13} /> Previous</button><span>Page {page} of {totalPages}</span><button className="ppage-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next <ArrowRight size={13} /></button></div>}</>}
          </div>
        </div>
      </section>
      <div className="cta-band"><div className="cta-wrap"><div><h2>Need technical advice before you order?</h2><p>Our engineering team can specify the right equipment for your project.</p></div><Link className="btn btn-primary" to="/contact">Request a quote <ArrowRight size={14} /></Link></div></div>
    </>
  );

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">NATGAS PRODUCTS</div>
          <h1>Gas engineering equipment &amp; accessories</h1>
          <p>Certified valves, fittings, piping, regulators, safety equipment, LPG systems and cylinders for every project scale.</p>
        </div>
      </div>

      {/* Filter bar — search + category pills + result count */}
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
  const [added, setAdded] = useState(false);

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
          <div className="chip">{product.category?.name ?? 'NATGAS EQUIPMENT'}</div>
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
                        <span className="cyl-ph-size" style={{ fontSize:42 }}>{product.cylinderSize ?? 'EQUIPMENT'}</span>
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
              <span className="pd-cat-tag">{product.category?.name ?? 'NATGAS EQUIPMENT'}</span>
              <h1 className="pd-title">{product.name}</h1>
              <div className="pd-price">{priceLabel(product.price, product.currency)}</div>

              <div className="pd-avail">
                <span style={{ width:8, height:8, borderRadius:'50%', background: product.isAvailable ? 'var(--green-3)' : '#9b5b00', display:'inline-block' }} />
                <span style={{ fontSize:13, fontWeight:600, color: product.isAvailable ? 'var(--green-3)' : '#9b5b00' }}>
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
                <button className="btn btn-primary" disabled={!product.isAvailable} onClick={() => { addToCart(product); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}>
                  {product.isAvailable ? <>{added ? 'Added to cart' : 'Add to cart'} <ArrowRight size={14} /></> : 'Currently unavailable'}
                </button>
                <Link className="btn btn-outline btn-sm" to="/order">View cart</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
