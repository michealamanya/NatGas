import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, NewsArticle } from '../api/client';

/* ─── News listing ──────────────────────────────────────────────────────── */
export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api<NewsArticle[]>('/news?limit=50')
      .then(r => setArticles(r.data ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...rest] = articles;

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">NEWS &amp; BLOG</div>
          <h1>News &amp; Updates</h1>
          <p>Industry insights, project highlights and LPG sector news from Natgas Uganda Limited.</p>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          {loading ? (
            <div className="loading-state"><Loader2 size={26} className="spin" /><span>Loading articles…</span></div>
          ) : articles.length === 0 ? (
            <div className="empty-state"><h3>No articles yet</h3><p>Check back soon.</p></div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link to={`/news/${featured.slug}`} className="feat-article" style={{ textDecoration: 'none', display: 'grid' }}>
                  {featured.featuredImage && (
                    <div className="feat-article-img">
                      <img src={featured.featuredImage} alt={featured.title} loading="lazy" />
                    </div>
                  )}
                  <div className="feat-article-body">
                    {featured.category && (
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--gold-text)' }}>
                        {featured.category.name}
                      </span>
                    )}
                    <h2>{featured.title}</h2>
                    {featured.summary && <p>{featured.summary}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                      {featured.author && <span>By {featured.author.firstName} {featured.author.lastName}</span>}
                      {featured.publishedAt && (
                        <span>{new Date(featured.publishedAt).toLocaleDateString('en-UG',{year:'numeric',month:'long',day:'numeric'})}</span>
                      )}
                    </div>
                    <span className="ncard-more" style={{ marginTop: 14 }}>Read article <ArrowRight size={13} /></span>
                  </div>
                </Link>
              )}

              {/* Rest */}
              {rest.length > 0 && (
                <div className="news-grid" style={{ marginTop: featured ? 32 : 0 }}>
                  {rest.map(a => (
                    <Link key={a.id} to={`/news/${a.slug}`} className="ncard" style={{ textDecoration: 'none' }}>
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
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ─── Single article ────────────────────────────────────────────────────── */
export function NewsArticlePage() {
  const { slug }  = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api<NewsArticle>(`/news/${slug}`)
      .then(r => setArticle(r.data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading-state" style={{ minHeight: '60vh' }}><Loader2 size={28} className="spin" /></div>;
  if (!article) return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <h3>Article not found</h3>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/news')}>← Back to news</button>
    </div>
  );

  return (
    <>
      <div className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="page-hero-wrap">
          <Link to="/news" className="page-hero-back"><ArrowLeft size={13} /> News &amp; Updates</Link>
          {article.category && <div className="chip">{article.category.name}</div>}
          <h1>{article.title}</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {article.author && (
              <span style={{ color: '#7ab8b0', fontSize: 13 }}>
                By {article.author.firstName} {article.author.lastName}
              </span>
            )}
            {article.publishedAt && (
              <span style={{ color: '#5a9690', fontSize: 13 }}>
                {new Date(article.publishedAt).toLocaleDateString('en-UG',{year:'numeric',month:'long',day:'numeric'})}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          {article.featuredImage && (
            <img src={article.featuredImage} alt={article.title}
              style={{ width: '100%', maxHeight: 440, objectFit: 'cover', borderRadius: 6, marginBottom: 40 }} />
          )}

          <div style={{ maxWidth: 800 }}>
            {article.content.split('\n').filter(Boolean).map((para, i) => (
              para.startsWith('**') && para.endsWith('**')
                ? <h2 key={i} style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize: 24, margin: '28px 0 12px', letterSpacing: '-.3px' }}>
                    {para.replace(/\*\*/g, '')}
                  </h2>
                : <p key={i} style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.82, marginBottom: 14 }}>
                    {para}
                  </p>
            ))}
          </div>

          <div style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
            <Link to="/news" className="ncard-more">
              <ArrowLeft size={13} /> Back to all articles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
