import {
  Facebook, Linkedin, Mail, MapPin, Phone, Twitter, Youtube,
  ChevronDown, Shield, Package, Briefcase, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import NatGasLogo from './Logo';

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <MapPin size={12} /> Kawuku, Entebbe Road, Uganda
          </span>
          <div className="topbar-socials">
            <a href="#" aria-label="Facebook"><Facebook size={12} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={12} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={12} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={12} /></a>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="main-nav" role="navigation" aria-label="Main navigation">
        <Link to="/" onClick={close} style={{ textDecoration: 'none' }}>
          <NatGasLogo height={44} theme="dark" />
        </Link>

        <button
          className="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <span className={`hbar hbar-1${open ? ' open' : ''}`} />
          <span className={`hbar hbar-2${open ? ' open' : ''}`} />
          <span className={`hbar hbar-3${open ? ' open' : ''}`} />
        </button>

        <div className={`nav-links${open ? ' open' : ''}`} onClick={close}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About Us</NavLink>

          {/* Products dropdown */}
          <div className="nav-dropdown">
            <NavLink to="/products" style={{ textDecoration:'none' }}>
              <Package size={13} /> Products <ChevronDown size={12} />
            </NavLink>
            <div className="dropdown-menu">
              <Link to="/products">All Products</Link>
              <div className="dropdown-divider" />
              <Link to="/products?category=lpg-cylinders">LPG Cylinders</Link>
              <Link to="/products?category=fittings">Fittings &amp; Flanges</Link>
              <Link to="/products?category=accessories">Accessories</Link>
              <Link to="/products?category=industrial">Industrial Equipment</Link>
              <div className="dropdown-divider" />
              <Link to="/products?featured=true">Featured products</Link>
            </div>
          </div>

          <NavLink to="/services"><Shield size={13} /> Services</NavLink>

          {/* Opportunities dropdown */}
          <div className="nav-dropdown">
            <button onClick={() => {}}>
              <Briefcase size={13} /> Opportunities <ChevronDown size={12} />
            </button>
            <div className="dropdown-menu">
              <Link to="/careers">Open Positions</Link>
              <Link to="/careers">Internships</Link>
              <Link to="/contact">Become a Distributor</Link>
              <Link to="/contact">Partner with Us</Link>
            </div>
          </div>

          {/* News & Blog */}
          <div className="nav-dropdown">
            <button onClick={() => {}}>
              <BookOpen size={13} /> News &amp; Blog <ChevronDown size={12} />
            </button>
            <div className="dropdown-menu">
              <Link to="/news">All Articles</Link>
              <Link to="/news">Industry Updates</Link>
              <Link to="/news">Company News</Link>
            </div>
          </div>

          <NavLink to="/contact" className="nav-enquire">Get a Quote</NavLink>
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
            <div className="footer-socials">
              <a href="#" aria-label="Facebook"><Facebook size={14} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={14} /></a>
              <a href="#" aria-label="YouTube"><Youtube size={14} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={14} /></a>
            </div>
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
            <p style={{ color:'#3a7670', fontSize:11 }}>Mon – Fri &nbsp; 8:00 AM – 5:00 PM</p>
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
