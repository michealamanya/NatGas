import {
  Facebook, Linkedin, Mail, MapPin, Phone, X, Youtube,
  ChevronDown, Shield, Package, Briefcase, BookOpen, Image, ShoppingCart, UserCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import NatGasLogo from './Logo';
import { api } from '../api/client';
import { getCart } from '../lib/cart';

// ── Dropdown that works on mouse, keyboard and touch ─────────────────────────
function NavDropdown({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
      >
        <Icon size={13} /> {label} <ChevronDown size={12} />
      </button>
      <div
        className="dropdown-menu"
        style={open ? { opacity: 1, pointerEvents: 'auto', transform: 'translateY(0)' } : undefined}
        onClick={() => setOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [social, setSocial] = useState<Record<string, string>>({});
  const [cartCount, setCartCount] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const refreshCart = () => setCartCount(getCart().reduce((total, item) => total + item.quantity, 0));
    refreshCart();
    window.addEventListener('natgas-cart-change', refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => { window.removeEventListener('natgas-cart-change', refreshCart); window.removeEventListener('storage', refreshCart); };
  }, []);

  useEffect(() => {
    api<Record<string, unknown>>('/settings/public')
      .then((r) => {
        const values = Object.fromEntries(
          Object.entries(r.data ?? {}).map(([k, v]) => [k, String(v ?? '')]),
        );
        if (values.site_font) document.documentElement.style.setProperty('--site-font', `'${values.site_font}', system-ui, sans-serif`);
        setSocial(values);
      })
      .catch(() => undefined);
  }, []);

  const socialLinks = [
    { key: 'social_facebook', icon: Facebook, label: 'Facebook' },
    { key: 'social_twitter',  icon: X,        label: 'X'        },
    { key: 'social_youtube',  icon: Youtube,  label: 'YouTube'  },
    { key: 'social_linkedin', icon: Linkedin, label: 'LinkedIn' },
  ].filter((item) => social[item.key] && social[item.key] !== '#');

  return (
    <>
      {/* ── Utility bar ── */}
      <div className="topbar">
        <div className="topbar-l">
          <a href="tel:+256740938040"><Phone size={12} /> +256 740 938 040</a>
          <a href="tel:+256781011751"><Phone size={12} /> +256 781 011 751</a>
          <a href="mailto:info@natgasuganda.com"><Mail size={12} /> info@natgasuganda.com</a>
        </div>
        <div className="topbar-r">
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={12} /> Kawuku, Entebbe Road, Uganda
          </span>
          {socialLinks.length > 0 && (
            <div className="topbar-socials">
              {socialLinks.map(({ key, icon: SocialIcon, label }) => (
                <a key={key} href={social[key]} target="_blank" rel="noreferrer" aria-label={label}>
                  <SocialIcon size={12} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="main-nav" role="navigation" aria-label="Main navigation">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <NatGasLogo height={44} theme="dark" />
        </Link>

        <button
          className="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className={`hbar hbar-1${mobileOpen ? ' open' : ''}`} />
          <span className={`hbar hbar-2${mobileOpen ? ' open' : ''}`} />
          <span className={`hbar hbar-3${mobileOpen ? ' open' : ''}`} />
        </button>

        <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About Us</NavLink>

          <NavLink to="/products"><Package size={13} /> Products</NavLink>

          <NavLink to="/services"><Shield size={13} /> Services</NavLink>

          <NavLink to="/media"><Image size={13} /> Media</NavLink>

          {/* Our Clients – trusted customers showcase */}
          <NavLink to="/locations">Our Clients</NavLink>

          <NavDropdown label="Opportunities" icon={Briefcase}>
            <Link to="/careers">Open Positions</Link>
            <Link to="/contact">Become a Distributor</Link>
            <Link to="/contact">Partner with Us</Link>
          </NavDropdown>

          <NavDropdown label="News & Blog" icon={BookOpen}>
            <Link to="/news">All Articles</Link>
            <Link to="/news">Company News</Link>
          </NavDropdown>

          <NavLink to="/products" className="nav-enquire">Order Gas</NavLink>
          {cartCount > 0 && <><NavLink to="/account" className="nav-shop-action" aria-label="My account"><UserCircle size={18} /><span>Account</span></NavLink><NavLink to="/order" className="nav-shop-action nav-cart" aria-label={`Order cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}><ShoppingCart size={18} /><span>Cart</span><b>{cartCount}</b></NavLink></>}
        </div>
      </nav>

      {/* ── Page content ── */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* ── Compact footer strip ── */}
      <footer className="site-footer" aria-label="Site footer">
        <div className="footer-strip">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <NatGasLogo height={28} theme="light" />
          </Link>

          <span className="footer-strip-copy">
            &copy; {new Date().getFullYear()} Natgas Uganda Limited. All rights reserved.
          </span>

          <div className="footer-strip-quick" aria-label="Footer navigation">
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/products">Shop</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/why-choose">Why NATGAS</Link>
            <Link to="/how-to-order">How to order</Link>
            {cartCount > 0 && <>
              <span className="footer-strip-divider" />
              <Link to="/account">My account</Link>
              <Link to="/account">My orders</Link>
              <Link to="/order">Cart ({cartCount})</Link>
            </>}
          </div>

          <div className="footer-strip-links">
            {socialLinks.map(({ key, icon: SocialIcon, label }) => (
              <a key={key} href={social[key]} target="_blank" rel="noreferrer" aria-label={label}>
                <SocialIcon size={13} />
              </a>
            ))}
            {socialLinks.length > 0 && <span className="footer-strip-divider" />}
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
