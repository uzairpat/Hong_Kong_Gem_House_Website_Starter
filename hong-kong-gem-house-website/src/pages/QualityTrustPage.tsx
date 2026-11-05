import { Link } from 'react-router-dom';
import './QualityTrustPage.css';

const QUALITY_ASSETS = '/assets/06-quality-trust';

const trustFeatures = [
  {
    title: 'Careful Selection',
    text: 'Each gemstone is handpicked for its colour, clarity, cut and overall beauty by experienced gemologists.',
    icon: `${QUALITY_ASSETS}/icons/pillars/quality-pillar-careful-selection.png`,
    alt: 'Gold diamond icon',
  },
  {
    title: 'Ethical Sourcing',
    text: 'We work with trusted partners and prioritize responsible sourcing practices.',
    icon: `${QUALITY_ASSETS}/icons/pillars/quality-pillar-ethical-sourcing.png`,
    alt: 'Gold leaf icon',
  },
  {
    title: 'Expert Gemology',
    text: 'Decades of experience in identifying and selecting fine gemstones with exceptional characteristics.',
    icon: `${QUALITY_ASSETS}/icons/pillars/quality-pillar-expert-gemology.png`,
    alt: 'Gold award medal icon',
  },
  {
    title: 'Long-Term Relationships',
    text: 'Built on trust, transparency and consistent quality with partners around the world.',
    icon: `${QUALITY_ASSETS}/icons/pillars/quality-pillar-long-term-relationships.png`,
    alt: 'Gold handshake icon',
  },
];

const certificationLogos = [
  {
    name: 'GIA',
    description: 'Gemological Institute of America',
    image: `${QUALITY_ASSETS}/certifications/gia-logo.png`,
  },
  {
    name: 'GRSS',
    description: 'GemResearch Swisslab',
    image: `${QUALITY_ASSETS}/certifications/grss-logo.png`,
  },
  {
    name: 'LOTUS',
    description: 'Lotus Gemology',
    image: `${QUALITY_ASSETS}/certifications/lotus-logo.png`,
  },
  {
    name: 'AIGS',
    description: 'Asian Institute of Gemological Sciences',
    image: `${QUALITY_ASSETS}/certifications/aigs-logo.png`,
  },
];

const approachPoints = [
  {
    text: 'Natural Gemstones',
    icon: `${QUALITY_ASSETS}/icons/footer/heritage-icon-generational-integrity.png`,
    alt: 'Gold diamond icon',
  },
  {
    text: 'Authenticated & Documented',
    icon: `${QUALITY_ASSETS}/icons/footer/heritage-icon-guaranteed-authenticity.png`,
    alt: 'Gold shield icon',
  },
  {
    text: 'Global Sourcing Network',
    icon: `${QUALITY_ASSETS}/icons/footer/heritage-icon-global-network.png`,
    alt: 'Gold globe icon',
  },
  {
    text: 'Trusted by Collectors & Trade Partners',
    icon: `${QUALITY_ASSETS}/icons/footer/quality-trust-icon-trusted-partners.png`,
    alt: 'Gold group icon',
  },
];

export default function QualityTrustPage() {
  return (
    <main className="quality-page">
      <section className="quality-hero">
        <img
          className="quality-hero__background"
          src={`${QUALITY_ASSETS}/backgrounds/quality-trust-hero-background.png`}
          alt=""
          aria-hidden="true"
        />
        <div className="quality-hero__copy">
          <p className="eyebrow eyebrow--line">Quality &amp; Trust</p>
          <h1>
            <span>Expertise</span>
            <br />
            You Can Trust.
          </h1>
          <p>
            Our commitment to quality, authenticity and ethical practices defines every gemstone we source and trade. Backed by generations of experience, we ensure that each stone meets high standards of beauty, integrity and value.
          </p>
        </div>
        <div className="quality-hero__side-note">
          Precision<br />
          Knowledge<br />
          Experience
          <small>In every stone</small>
        </div>
      </section>

      <div className="quality-middle">
        <section className="quality-features page-pad" aria-label="Our quality commitments">
          {trustFeatures.map((item) => (
            <article key={item.title}>
              <img className="quality-feature__icon" src={item.icon} alt={item.alt} />
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="certification-band page-pad" aria-label="Gemological certifications">
          <div className="certification-band__intro">
            <p className="eyebrow">Certified Authenticity</p>
            <p>
              Our gemstones can be supported by recognised international gemological standards, subject to availability and documentation.
            </p>
          </div>
          <div className="certification-logos">
            {certificationLogos.map((logo) => (
              <span className={`cert-logo cert-logo--${logo.name.toLowerCase()}`} key={logo.name}>
                <img src={logo.image} alt={`${logo.name} — ${logo.description}`} />
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="quality-approach">
        <img
          className="quality-approach__background"
          src={`${QUALITY_ASSETS}/backgrounds/quality-trust-footer-background.png`}
          alt=""
          aria-hidden="true"
        />
        <div className="quality-approach__copy">
          <p className="eyebrow eyebrow--line">Our Approach</p>
          <h2>
            Traditional Values.<br />
            Modern Standards.
          </h2>
          <p>
            We combine time-honoured knowledge with modern gemological techniques to bring natural gemstones that inspire confidence today and for generations.
          </p>
        </div>
        <div className="quality-approach__list">
          {approachPoints.map((point) => (
            <span key={point.text}>
              <img src={point.icon} alt={point.alt} />
              {point.text}
            </span>
          ))}
        </div>
      </section>

      <div className="quality-cta">
        <span>Have questions about a gemstone?</span>
        <Link to="/contact" className="button button--gold">
          Speak With Our Team <span>→</span>
        </Link>
      </div>
    </main>
  );
}
