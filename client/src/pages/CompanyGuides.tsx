import { ArrowRight, CheckCircle2, CreditCard, MapPin, Package, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WhyChoose() {
  const reasons = [
    { icon: ShieldCheck, title: 'Safety first', text: 'Certified equipment, careful installation practices and practical safety guidance for every project.' },
    { icon: Truck, title: 'Reliable supply', text: 'Dependable LPG availability, refill coordination and responsive delivery support across Uganda.' },
    { icon: CheckCircle2, title: 'Genuine equipment', text: 'Quality-checked products and trusted accessories sourced for safe, dependable operation.' },
    { icon: ShieldCheck, title: 'Engineering expertise', text: 'Design, installation, inspection, NDT and maintenance delivered by an experienced technical team.' },
  ];
  return <><div className="page-hero"><div className="page-hero-wrap"><div className="chip">WHY NATGAS</div><h1>Engineering confidence into every LPG solution.</h1><p>From the first drawing to long-term operation, NATGAS combines technical expertise, safety and dependable support.</p></div></div><section className="section"><div className="wrap"><div className="guide-grid">{reasons.map(({ icon: Icon, title, text }) => <article className="guide-card" key={title}><Icon size={25}/><h2>{title}</h2><p>{text}</p></article>)}</div></div></section><div className="cta-band"><div className="cta-wrap"><div><h2>Ready to plan your LPG system?</h2><p>Talk to the NATGAS engineering team about your next project.</p></div><Link className="btn btn-primary" to="/contact">Request a consultation <ArrowRight size={14}/></Link></div></div></>;
}

export function HowToOrder() {
  const steps = [
    { icon: Package, title: 'Select a product', text: 'Browse cylinders, valves, fittings, equipment and accessories in the catalogue.' },
    { icon: MapPin, title: 'Share your location', text: 'Tell us your district and delivery point so we can plan fulfilment.' },
    { icon: CreditCard, title: 'Confirm the order', text: 'Sign in, review the order details and confirm the agreed payment method.' },
    { icon: Truck, title: 'Receive your delivery', text: 'Our team coordinates safe delivery, collection or technical follow-up.' },
  ];
  return <><div className="page-hero"><div className="page-hero-wrap"><div className="chip">HOW TO ORDER</div><h1>From a product enquiry to dependable delivery.</h1><p>A clear, supported ordering journey for household, commercial and engineering requirements.</p></div></div><section className="section"><div className="wrap"><div className="guide-steps">{steps.map(({ icon: Icon, title, text }, index) => <article className="guide-step" key={title}><span>{index + 1}</span><Icon size={24}/><h2>{title}</h2><p>{text}</p></article>)}</div><div className="guide-note"><ShieldCheck size={22}/><div><h2>Need a technical recommendation?</h2><p>For systems, installations or bulk requirements, contact our engineering team before ordering.</p></div><Link className="btn btn-dark" to="/contact">Request a quote <ArrowRight size={14}/></Link></div></div></section></>;
}
