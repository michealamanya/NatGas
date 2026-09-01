import {
  ArrowRight, CheckCircle2, Clock, Flame, HardHat,
  Mail, MapPin, Phone, Search, ShieldCheck, Wrench,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Service as ManagedService } from '../api/client';

/* ─── About ─────────────────────────────────────────────────────────────── */
export function About() {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">ABOUT NATGAS UGANDA</div>
          <h1>Uganda's trusted LPG service company.</h1>
          <p>
            Strategic partnerships, expert engineers and an unwavering commitment
            to safety, delivering reliable LPG solutions across Uganda.
          </p>
        </div>
      </div>

      <section className="section about-who-section">
        <div className="wrap">
          <div className="about-grid">
            <div>
              <span className="chip-sm">WHO WE ARE</span>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(28px,3.5vw,42px)', letterSpacing:'-1px', marginBottom:18 }}>
                Building Uganda's LPG infrastructure.
              </h2>
              <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.78, marginBottom:14 }}>
                Natgas Uganda Limited provides Liquefied Petroleum Gas (LPG) shop drawings,
                designs and installations, metered gas (reticulated system), equipment,
                maintenance and repairs, accessory supplies, and consultancy services.
              </p>
              <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.78 }}>
                Recognizing the development and industry trends in Uganda, there is an
                increased need for safe and cost-effective technical energy solutions.
                Natgas Uganda delivers certified expertise from initial consultation
                through to long-term maintenance.
              </p>
              <div className="about-stats">
                <div className="astat"><b>12+</b><span>Service categories</span></div>
                <div className="astat"><b>100%</b><span>Certified professionals</span></div>
                <div className="astat"><b>NDT</b><span>Testing capability</span></div>
              </div>
            </div>

            <div>
              <div className="vbox">
                <span className="chip">OUR VISION</span>
                <p>To be the leading indigenous service company in Oil and Gas Industry.</p>
              </div>
              <div className="vbox">
                <span className="chip">OUR MISSION</span>
                <p>
                  To provide safe, reliable and cost-effective LPG energy solutions to
                  homes, businesses and industries across Uganda through expert technical
                  services and responsible distribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="chip-sm">WHAT WE OFFER</span>
              <h2>Leading providers of LPG solutions.</h2>
            </div>
          </div>
          <div className="svc-grid">
            {[
              { icon: Flame,       t: 'Official LPG Distributor',           d: 'Reliable last-mile logistics and distribution partnership for Oil Marketing Companies.' },
              { icon: Search,      t: 'Technical Consultancy',              d: 'Expert strategic advice and solutions for the oil and gas sector.' },
              { icon: ShieldCheck, t: 'Equipment & Accessory Supply',       d: 'Certified, high-quality LPG cylinders, regulators and accessories.' },
              { icon: Wrench,      t: 'Maintenance & Repair',               d: 'Proactive and emergency services to ensure system safety and longevity.' },
              { icon: Search,      t: 'NDT & Destructive Testing',          d: 'Advanced testing to ensure material and weld integrity.' },
              { icon: HardHat,     t: 'LPG System Design & Inspection',     d: 'Full turnkey service from engineered design to certified installation.' },
            ].map(({ icon: Icon, t, d }) => (
              <div className="svc-card" key={t}>
                <div className="svc-icon"><Icon size={22} /></div>
                <h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="partners-section" aria-labelledby="partners-title">
        <div className="wrap">
          <div className="partners-heading">
            <span className="chip-sm">TRUSTED NETWORK</span>
            <h2 id="partners-title">Working with industry leaders.</h2>
            <p>Our solutions are supported by trusted product, engineering and hospitality partners.</p>
          </div>
          <div className="partners-grid" aria-label="Selected partners">
            {['TotalEnergies', 'STABEX International', 'Shell', 'Serena Hotels', 'Royal Van Zanten'].map(partner => (
              <div className="partner-mark" key={partner}>{partner}</div>
            ))}
          </div>
        </div>
      </section>

      <div className="cta-band">
        <div className="cta-wrap">
          <div>
            <h2>Ready to work with Uganda's LPG specialists?</h2>
            <p>Contact us for a consultation or quote today.</p>
          </div>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/contact">Get in touch <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Services ───────────────────────────────────────────────────────────── */
export function Services() {
  const [managedServices, setManagedServices] = useState<ManagedService[]>([]);
  useEffect(() => {
    api<ManagedService[]>('/services').then(result => setManagedServices(result.data ?? [])).catch(() => undefined);
  }, []);
  const SERVICES = [
    { icon: Flame,       title: 'Authorized LPG Products Distribution',        desc: 'The number one authorized distributor of all LPG products — reliable, certified, nationwide.' },
    { icon: ShieldCheck, title: 'Accessories & Equipment Supply',               desc: 'Flanges, fittings, brass adaptors, regulators and all LPG accessories from certified sources.' },
    { icon: HardHat,     title: 'LPG Systems Design',                          desc: 'Smart, safe and scalable LPG solutions with expert shop drawings and system design services.' },
    { icon: HardHat,     title: 'LPG Tank Installation',                       desc: 'End-to-end LPG tank installation from site assessment to final safety commissioning.' },
    { icon: Wrench,      title: 'Industrial Gas Pipe Installation',             desc: 'Expert craftsmanship with industry-leading standards for your gas pipelines.' },
    { icon: Wrench,      title: 'LPG Systems Installation',                    desc: 'Seamless and secure LPG systems installed with verified expertise.' },
    { icon: Flame,       title: 'Industrial Burner Installation',               desc: 'High-performance industrial burners for optimal energy efficiency, safety and compliance.' },
    { icon: HardHat,     title: 'School LPG Systems Solutions',                desc: 'Certified LPG systems for school labs and kitchens — safe, efficient, compliant.' },
    { icon: Search,      title: 'Maintenance & NDT Testing',                   desc: 'Test, maintain and validate gas systems with our NDT testing and maintenance team.' },
    { icon: ShieldCheck, title: 'LPG Industrial Systems Inspection',           desc: 'Safety, efficiency and compliance inspections by certified LPG inspectors.' },
    { icon: Wrench,      title: 'LPG Tank Maintenance',                        desc: 'Routine checks and preventive care to keep your LPG tanks safe and compliant.' },
    { icon: Search,      title: 'Expert LPG Technical Consultancy',            desc: 'Tailored solutions with certified professionals for safe, efficient LPG systems.' },
  ];

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">OUR SERVICES</div>
          <h1>LPG Technical Services</h1>
          <p>From distribution and design to installation, maintenance and NDT, certified end-to-end LPG solutions.</p>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          {managedServices.length > 0 && <div className="svc-grid managed-services">
            {managedServices.map(service => (
              <article className="svc-card" key={service.id}>
                {service.imageUrl && <img className="svc-card-image" src={service.imageUrl} alt={service.name} />}
                <div className="svc-card-copy"><h3>{service.name}</h3><p>{service.shortDesc ?? service.description}</p></div>
              </article>
            ))}
          </div>}
          <div className="svc-grid">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div className="svc-card" key={title}>
                <div className="svc-icon"><Icon size={22} /></div>
                <h3>{title}</h3><p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cta-band">
        <div className="cta-wrap">
          <div>
            <h2>Every service backed by certified professionals.</h2>
            <p>We operate to international LPG safety standards across Uganda.</p>
          </div>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/contact">Request a quote</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Contact ────────────────────────────────────────────────────────────── */
export function Contact() {
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('/contact', { method: 'POST', body: JSON.stringify(data) });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">CONTACT US</div>
          <h1>Get in touch with NATGAS.</h1>
          <p>Our team is ready to help with your LPG distribution, installation or maintenance needs.</p>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="chip-sm">REACH US DIRECTLY</span>
              <h2>How can we help you?</h2>
              <p>
                Whether you need LPG distribution, an installation quote, maintenance
                scheduling or expert consultancy, we're here for you.
              </p>

              {[
                { icon: Phone, label: 'Primary phone',   value: '+256 740 938 040' },
                { icon: Phone, label: 'Secondary phone', value: '+256 781 011 751' },
                { icon: Mail,  label: 'Email address',   value: 'info@natgasuganda.com' },
                { icon: MapPin,label: 'Our address',     value: 'Kawuku, Entebbe Road, P.O. Box 700332' },
                { icon: Clock, label: 'Business hours',  value: 'Monday – Friday, 8:00 AM – 5:00 PM' },
              ].map(({ icon: Icon, label, value }) => (
                <div className="cdet" key={label}>
                  <div className="cdet-icon"><Icon size={16} /></div>
                  <div className="cdet-text">
                    <span>{label}</span><b>{value}</b>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="contact-card">
                {sent ? (
                  <div className="form-ok">
                    <CheckCircle2 size={32} style={{ color: 'var(--green-3)', marginBottom: 12 }} />
                    <h4>Message sent successfully!</h4>
                    <p>Our team will be in touch shortly. Thank you for contacting Natgas Uganda.</p>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--green)' }}>
                      Send us a message
                    </h3>
                    <div className="fg-row2">
                      <div className="fg"><label>Full name *</label><input required name="name" /></div>
                      <div className="fg"><label>Email address *</label><input required type="email" name="email" /></div>
                    </div>
                    <div className="fg-row2">
                      <div className="fg"><label>Phone number</label><input type="tel" name="phone" /></div>
                      <div className="fg">
                        <label>Subject *</label>
                        <input required name="subject" placeholder="e.g. LPG installation quote" />
                      </div>
                    </div>
                    <div className="fg">
                      <label>Message *</label>
                      <textarea required name="message" rows={5} placeholder="Tell us about your LPG requirements…" />
                    </div>
                    {error && <div className="form-err">{error}</div>}
                    <button className="btn btn-dark btn-full" type="submit">
                      Send message <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const items = [
    { q: 'What LPG services does Natgas Uganda offer?', a: 'Natgas Uganda offers authorized LPG distribution, system design, tank and pipe installation, industrial burner installation, school LPG solutions, maintenance and NDT testing, system inspections, and expert technical consultancy.' },
    { q: 'Is Natgas Uganda an authorized LPG distributor?', a: 'Yes. Natgas Uganda is an authorized distributor of LPG products for major oil companies in Uganda, operating under the relevant licenses and compliance requirements.' },
    { q: 'Do you handle residential LPG installations?', a: 'Yes. We install LPG systems for homes, apartments, hotels, schools and commercial facilities of all sizes, with full safety compliance documentation.' },
    { q: 'What is NDT testing and why does it matter?', a: 'Non-Destructive Testing (NDT) verifies the integrity of welds, pipes and materials without damaging the system. It is essential for ensuring your LPG installation is safe and meets regulatory standards.' },
    { q: 'Do you service schools and institutions?', a: 'Yes. We specialize in LPG systems for school laboratories and kitchens, providing compliant, safe and cost-effective solutions with minimal disruption.' },
    { q: 'How do I request a quote?', a: 'Contact us via the form on this website, call +256 740 938 040 / +256 781 011 751, or email info@natgasuganda.com. Our team will respond promptly.' },
    { q: 'Where is Natgas Uganda located?', a: 'Our office is at Kawuku, Entebbe Road, P.O. Box 700332, Uganda. We serve clients across all regions of the country.' },
    { q: 'Do you offer emergency maintenance services?', a: 'Yes. Our maintenance team responds to urgent LPG system issues. Contact our office immediately and we will dispatch a qualified engineer.' },
  ];

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">FAQS</div>
          <h1>Frequently Asked Questions</h1>
          <p>Answers to common questions about our LPG services, installations and operations.</p>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="faq-list">
            {items.map((item, i) => (
              <div className="faq-item" key={i}>
                <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                  {item.q}
                  <span style={{ fontSize: 20, color: 'var(--gold-text)', flexShrink: 0, lineHeight: 1 }}>
                    {open === i ? '−' : '+'}
                  </span>
                </button>
                {open === i && <p className="faq-a">{item.a}</p>}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 14, fontSize: 14 }}>
              Can't find what you're looking for?
            </p>
            <Link className="btn btn-dark" to="/contact">
              Contact our team <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Privacy ────────────────────────────────────────────────────────────── */
export function Privacy() {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">LEGAL</div>
          <h1>Privacy Policy</h1>
          <p>How Natgas Uganda Limited collects, uses and protects your information.</p>
        </div>
      </div>
      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="legal-wrap">
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly — such as name, email address and phone number — when you submit a contact form or request a quote.</p>
            <h2>How We Use Your Information</h2>
            <p>Your information is used solely to respond to your enquiries, process service requests and send relevant updates. We do not sell or rent your data to third parties.</p>
            <h2>Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal data from unauthorised access, disclosure or misuse.</p>
            <h2>Cookies</h2>
            <p>Our website uses minimal, essential cookies to maintain session state. We do not use tracking or advertising cookies.</p>
            <h2>Contact</h2>
            <p>For privacy enquiries, contact <a href="mailto:info@natgasuganda.com" style={{ color: 'var(--green-3)', fontWeight: 700 }}>info@natgasuganda.com</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Terms ──────────────────────────────────────────────────────────────── */
export function Terms() {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">LEGAL</div>
          <h1>Terms &amp; Conditions</h1>
          <p>Terms governing the use of the Natgas Uganda Limited website and services.</p>
        </div>
      </div>
      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="legal-wrap">
            <h2>Use of Website</h2>
            <p>This website is provided by Natgas Uganda Limited for informational purposes. All content is proprietary and may not be reproduced without written permission.</p>
            <h2>Service Agreements</h2>
            <p>All LPG installation, maintenance and consultancy services are governed by individual service agreements. Contact our team for full terms.</p>
            <h2>Limitation of Liability</h2>
            <p>Natgas Uganda Limited makes no warranties regarding the completeness or accuracy of information on this site. We are not liable for damages arising from its use.</p>
            <h2>Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of Uganda.</p>
            <h2>Contact</h2>
            <p>For enquiries, contact <a href="mailto:info@natgasuganda.com" style={{ color: 'var(--green-3)', fontWeight: 700 }}>info@natgasuganda.com</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
