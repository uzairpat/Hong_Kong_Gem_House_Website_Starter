import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './ContactPage.css';

type ContactField = 'name' | 'company' | 'email' | 'phone' | 'type' | 'message';

const asset = '/assets/08-contact';

const enquiryCategories = [
  {
    label: 'Gemstone Enquiries',
    image: `${asset}/icons/contact-icon-gemstone-enquiries.png`,
    alt: 'Gold gemstone icon',
  },
  {
    label: 'Trade Partnerships',
    image: `${asset}/icons/contact-icon-trade-partnerships.png`,
    alt: 'Gold handshake icon',
  },
  {
    label: 'Wholesale Opportunities',
    image: `${asset}/icons/contact-icon-wholesale-opportunities.png`,
    alt: 'Gold group of people icon',
  },
  {
    label: 'General Information',
    image: `${asset}/icons/contact-icon-general-information.png`,
    alt: 'Gold envelope icon',
  },
];

const locations = [
  {
    name: 'Hong Kong',
    role: 'Head Office',
    image: `${asset}/locations/contact-location-hong-kong.png`,
    imageAlt: 'Hong Kong skyline at sunset over Victoria Harbour',
    address: 'Hong Kong SAR, China',
    phone: '+852 1234 5678',
    email: 'info@hkgemhouse.com',
    descriptor: 'Global Trade & Distribution',
    descriptorIcon: 'globe',
  },
  {
    name: 'Bangkok',
    role: 'Branch',
    image: `${asset}/locations/contact-location-bangkok.png`,
    imageAlt: 'Wat Arun temple and the Chao Phraya River at sunset in Bangkok',
    address: 'Bangkok, Thailand',
    phone: '+66 123 456 789',
    email: 'bangkok@hkgemhouse.com',
    descriptor: 'Cutting, Polishing & Trading Network',
    descriptorIcon: 'briefcase',
  },
  {
    name: 'Sri Lanka',
    role: 'Gemstone Origin',
    image: `${asset}/locations/contact-location-sri-lanka.png`,
    imageAlt: 'Sigiriya rock rising above the green Sri Lankan landscape',
    address: 'Ratnapura / Colombo, Sri Lanka',
    phone: '+94 11 234 5678',
    email: 'srilanka@hkgemhouse.com',
    descriptor: 'Gemstone Origin & Direct Sourcing',
    descriptorIcon: 'leaf',
  },
] as const;

const quickLinks = [
  ['Home', '/'],
  ['Our Heritage', '/our-heritage'],
  ['Our Gemstones', '/our-gemstones'],
  ['Quality & Trust', '/quality-trust'],
  ['Global Presence', '/global-presence'],
  ['Contact', '/contact'],
] as const;

function DetailIcon({ name }: { name: 'location-pin' | 'building' | 'phone' | 'email' | 'globe' | 'briefcase' | 'leaf' }) {
  return (
    <img
      className="contact-detail-icon"
      src={`${asset}/icons/contact-detail-${name}.png`}
      alt=""
      aria-hidden="true"
    />
  );
}

const specializationGems = [
  {
    label: 'Ruby',
    slug: 'ruby',
    image: '/assets/homepage-elements/gemstones/ruby-transparent.png',
    alt: 'Red ruby gemstone',
  },
  {
    label: 'Blue Sapphire',
    slug: 'blue-sapphire',
    image: '/assets/homepage-elements/gemstones/blue-sapphire-transparent.png',
    alt: 'Blue sapphire gemstone',
  },
  {
    label: 'Emerald',
    slug: 'emerald',
    image: '/assets/homepage-elements/gemstones/emerald-transparent.png',
    alt: 'Green emerald gemstone',
  },
  {
    label: 'Rare Gems',
    slug: 'rare-gemstones',
    image: '/assets/homepage-elements/gemstones/rare-star-gem-transparent.png',
    alt: 'Rare star-shaped gemstone',
  },
];

function SocialMark({ kind }: { kind: 'linkedin' | 'instagram' | 'youtube' }) {
  if (kind === 'linkedin') {
    return (
      <img
        className="contact-footer__linkedin-mark"
        src={`${asset}/icons/contact-social-linkedin.png`}
        alt=""
        aria-hidden="true"
      />
    );
  }
  if (kind === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.6"/><path d="M17.4 6.8h.1" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg>;
}

export default function ContactPage({ embedded = false }: { embedded?: boolean }) {
  const PageRoot = embedded ? 'div' : 'main';
  const [params] = useSearchParams();
  const enquiryRef = params.get('enquiry') || '';
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    type: '',
    message: enquiryRef ? `I would like to enquire about ${enquiryRef}.` : '',
  });

  const update = (field: ContactField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <PageRoot className="contact-page">
      <section className="contact-hero" aria-label="Contact Hong Kong Gem House">
        <div className="contact-hero__intro">
          <p className="eyebrow eyebrow--line">Contact &amp; Enquiries</p>
          <h1>
            <span>Let’s Build</span>
            <strong>Lasting Partnerships.</strong>
          </h1>
          <p className="contact-hero__copy">
            We welcome enquiries from collectors, jewellers, trade partners and gemstone professionals around the world. Get in touch with us to learn more about our gemstones, services and global trading opportunities.
          </p>
          <div className="contact-categories" aria-label="Types of enquiry">
            {enquiryCategories.map((category) => (
              <div className="contact-category" key={category.label}>
                <img src={category.image} alt={category.alt} />
                <span>{category.label}</span>
              </div>
            ))}
          </div>
        </div>

        <form className="contact-form-card" onSubmit={submit}>
          <h2>Send Us a Message</h2>
          <p>Fill in the form and our team will get back to you shortly.</p>

          {sent ? (
            <div className="contact-form-success" role="status" aria-live="polite">
              <span className="contact-form-success__check" aria-hidden="true">✓</span>
              <h3>Thank you for your enquiry.</h3>
              <p>Your details have been validated. The form still needs to be connected to the company email or CRM to deliver enquiries.</p>
              <button type="button" className="contact-form-card__reset" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <label className="contact-sr-only" htmlFor="contact-name">Your Name *</label>
              <input
                id="contact-name"
                name="name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                required
                autoComplete="name"
                placeholder="Your Name *"
              />

              <label className="contact-sr-only" htmlFor="contact-company">Company Name</label>
              <input
                id="contact-company"
                name="company"
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                autoComplete="organization"
                placeholder="Company Name"
              />

              <div className="contact-form-card__row">
                <div>
                  <label className="contact-sr-only" htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Email Address *"
                  />
                </div>
                <div>
                  <label className="contact-sr-only" htmlFor="contact-phone">Phone Number</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    autoComplete="tel"
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <label className="contact-sr-only" htmlFor="contact-type">Enquiry Type *</label>
              <select
                id="contact-type"
                name="type"
                value={form.type}
                onChange={(event) => update('type', event.target.value)}
                required
              >
                <option value="" disabled>Enquiry Type *</option>
                <option value="Gemstone Enquiry">Gemstone Enquiry</option>
                <option value="Trade Partnership">Trade Partnership</option>
                <option value="Wholesale Opportunity">Wholesale Opportunity</option>
                <option value="General Information">General Information</option>
              </select>

              <label className="contact-sr-only" htmlFor="contact-message">Your Message *</label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                required
                rows={3}
                placeholder="Your Message *"
              />

              <button type="submit" className="contact-form-card__submit">
                Send Enquiry <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </form>

        <aside className="contact-hero__caption">
          <p>Exceptional<br />Gemstones.<br />Meaningful<br />Connections.</p>
        </aside>
      </section>

      <section className="contact-offices" aria-label="Our global offices">
        {locations.map((location) => (
          <article className="contact-office" key={location.name}>
            <img className="contact-office__photo" src={location.image} alt={location.imageAlt} />
            <div className="contact-office__details">
              <h2>
                <DetailIcon name="location-pin" />
                <span>{location.name}<small>{location.role}</small></span>
              </h2>
              <p>
                <DetailIcon name="building" />
                <span>{location.address}</span>
              </p>
              <p>
                <DetailIcon name="phone" />
                <a href={`tel:${location.phone.replace(/[^+\d]/g, '')}`}>{location.phone}</a>
              </p>
              <p>
                <DetailIcon name="email" />
                <a href={`mailto:${location.email}`}>{location.email}</a>
              </p>
              <p>
                <DetailIcon name={location.descriptorIcon} />
                <span>{location.descriptor}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <footer className="contact-footer">
        <div className="contact-footer__brand">
          {embedded ? (
            <a href="#home" className="contact-footer__brandline" aria-label="Hong Kong Gem House home">
              <img src="/assets/01-homepage/hkg-logo-emblem.png" alt="Hong Kong Gem House emblem" />
              <span>
                <strong>Hong Kong Gem House Limited</strong>
                <small>Est. 1959</small>
              </span>
            </a>
          ) : (
            <Link to="/" className="contact-footer__brandline" aria-label="Hong Kong Gem House home">
              <img src="/assets/01-homepage/hkg-logo-emblem.png" alt="Hong Kong Gem House emblem" />
              <span>
                <strong>Hong Kong Gem House Limited</strong>
                <small>Est. 1959</small>
              </span>
            </Link>
          )}
          <p>Carrying the Wavoo &amp; Vilak legacy of gemstone excellence from source to city.</p>
          <span className="contact-footer__accent" aria-hidden="true" />
        </div>

        <nav className="contact-footer__links" aria-label="Footer quick links">
          <h2>Quick Links</h2>
          {quickLinks.map(([label, to]) => embedded
            ? <a key={to} href={({
                "/": "#home",
                "/our-heritage": "#our-heritage",
                "/our-gemstones": "#our-gemstones",
                "/quality-trust": "#quality-trust",
                "/global-presence": "#global-presence",
                "/contact": "#contact",
              } as Record<string, string>)[to]}>{label}</a>
            : <Link key={to} to={to}>{label}</Link>)}
        </nav>

        <div className="contact-footer__specialization">
          <h2>Our Specialization</h2>
          <div className="contact-footer__gems">
            {specializationGems.map((gem) => (
              <Link
                className="contact-footer-gem"
                key={gem.label}
                to={`/collections/${gem.slug}`}
                aria-label={`Explore the ${gem.label} collection`}
                title={`Explore ${gem.label}`}
              >
                <img src={gem.image} alt="" aria-hidden="true" />
                <span>{gem.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="contact-footer__social">
          <h2>Follow Us</h2>
          <div className="contact-footer__social-links">
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialMark kind="linkedin" /></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><SocialMark kind="instagram" /></a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><SocialMark kind="youtube" /></a>
          </div>
          <div className="contact-footer__legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/terms-of-use">Terms of Use</Link>
          </div>
        </div>

        <div className="contact-footer__bottom">
          © 2026 Hong Kong Gem House Limited. All rights reserved.
        </div>
      </footer>
    </PageRoot>
  );
}
