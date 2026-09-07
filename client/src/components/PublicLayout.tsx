import {
  Facebook, Linkedin, Mail, MapPin, Phone, X, Youtube,
  ChevronDown, Shield, Package, Briefcase, BookOpen, Image,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import NatGasLogo from './Logo';
import { api } from '../api/client';

// ── Dropdown menu component ────────────────────────────────────────────────
// Manages its own open/close state and closes on outside click, Escape key,
// and route change, giving keyboard and touch users full access.
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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
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
      {/* CSS :hover also opens on desktop; JS state handles keyboard/touch */}
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
  const { pathname } = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    api<Record<string, unknown>>('/settings/public')
      .then((result) =>
        setSocial(
          Object.fromEntries(
            Object.entries(result.data ?? {}).map(([key, value]) => [key, String(value ?? '')]),
          ),
        ),
      )
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

          {/* Products dropdown */}
          <NavDropdown label="Products" icon={Package}>
            <Link to="/products">All Products</Link>
            <div className="dropdown-divider" />
            <Link to="/products?category=lpg-cylinders">LPG Cylinders</Link>
            <Link to="/products?category=commercial">Commercial</Link>
            <Link to="/products?category=industrial">Industrial</Link>
            <div className="dropdown-divider" />
            <Link to="/products?featured=true">Featured products</Link>
          </NavDropdown>

          <NavLink to="/services"><Shield size={13} /> Services</NavLink>

          <NavLink to="/media"><Image size={13} /> Media</NavLink>

          {/* Opportunities dropdown */}
          <NavDropdown label="Opportunities" icon={Briefcase}>
            <Link to="/careers">Open Positions</Link>
            <Link to="/contact">Become a Distributor</Link>
            <Link to="/contact">Partner with Us</Link>
          </NavDropdown>

          {/* News & Blog dropdown */}
          <NavDropdown label="News & Blog" icon={BookOpen}>
            <Link to="/news">All Articles</Link>
            <Link to="/news">Company News</Link>
          </NavDropdown>

          <NavLink to="/products" className="nav-enquire">Order Gas</NavLink>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer" aria-label="Site footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <NatGasLogo height={40} theme="light" />
            </Link>
            <p>
              Uganda's authorized LPG distributor and technical services provider.
              Certified installations, maintenance, NDT testing and consultancy.
            </p>
            {socialLinks.length > 0 && (
              <div className="footer-socials">
                {socialLinks.map(({ key, icon: SocialIcon, label }) => (
                  <a key={key} href={social[key]} target="_blank" rel="noreferrer" aria-label={label}>
                    <SocialIcon size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="footer-col">
            <h4>Services</h4>
            <Link to="/services">LPG Distribution</Link>
            <Link to="/services">System Design</Link>
            <Link to="/services">Tank Installation</Link>
            <Link to="/services">NDT Testing</Link>
            <Link to="/services">Technical Consultancy</Link>
            <Link to="/services">LPG Inspections</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/products">Products</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/news">News &amp; Blog</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <p><Phone size={12} /> +256 740 938 040</p>
            <p><Phone size={12} /> +256 781 011 751</p>
            <p><Mail size={12} /> info@natgasuganda.com</p>
            <p><MapPin size={12} /> Kawuku, Entebbe Road</p>
            <p style={{ color: '#3a7670', fontSize: 11 }}>Mon – Fri &nbsp; 8:00 AM – 5:00 PM</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Natgas Uganda Limited. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
