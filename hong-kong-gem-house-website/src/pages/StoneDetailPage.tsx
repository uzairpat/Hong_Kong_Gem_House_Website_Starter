import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const assetRoot = '/assets/05-ruby-detail';

const gallery = [
  {
    src: `${assetRoot}/ruby-detail-main.png`,
    alt: 'Natural ruby, main view',
    label: 'Main view',
  },
  {
    src: `${assetRoot}/gallery/ruby-detail-angle-1.png`,
    alt: 'Natural ruby, angled view one',
    label: 'Angled view one',
  },
  {
    src: `${assetRoot}/gallery/ruby-detail-angle-2.png`,
    alt: 'Natural ruby, angled view two',
    label: 'Angled view two',
  },
  {
    src: `${assetRoot}/gallery/ruby-detail-angle-3.png`,
    alt: 'Natural ruby, side profile',
    label: 'Side profile',
  },
];

const detailIcons = {
  expert: `${assetRoot}/icons/ruby-detail-expert-guidance.png`,
  origin: `${assetRoot}/icons/ruby-detail-origin-information.png`,
  certification: `${assetRoot}/icons/ruby-detail-certification-details.png`,
  generations: `${assetRoot}/icons/heritage-icon-generational-integrity.png`,
  globalNetwork: `${assetRoot}/icons/heritage-icon-global-network.png`,
  global: `${assetRoot}/icons/ruby-detail-global-presence.png`,
  authenticity: `${assetRoot}/icons/ruby-detail-authenticity-documentation.png`,
};

const tabs = {
  Description:
    'This 2.15 carat natural ruby showcases a vibrant red hue and excellent brilliance. Sourced from trusted origins, it is a fine example of the quality and beauty that define our collection. Each gemstone is carefully selected and evaluated to ensure authenticity and long-term value.',
  Certification:
    'Certification information can be provided upon request. Available documentation depends on the individual stone and its current records.',
  Origin:
    'Origin information is shown according to the available documentation for the individual stone. Please contact our team for further details.',
  'Care & Handling':
    'Store gemstones separately, avoid harsh chemicals and clean with gentle methods appropriate to the stone. Ask our team for stone-specific care guidance.',
};

type TabName = keyof typeof tabs;

function HeartIcon({ saved }: { saved: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20.8 8.7c0 4.2-8.8 10.1-8.8 10.1S3.2 12.9 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.5 15.5 4.2 4.2M10.8 7.8v6M7.8 10.8h6" />
    </svg>
  );
}

export default function StoneDetailPage() {
  const { stoneId = 'rby-001' } = useParams();
  const formattedId = stoneId.toUpperCase().replace('RUBY-', 'RBY-');
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [activeTab, setActiveTab] = useState<TabName>('Description');
  const [saved, setSaved] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const serviceItems = [
    {
      title: 'Expert Guidance',
      text: 'Get in touch with our gemstone specialists for professional advice.',
      icon: detailIcons.expert,
      alt: 'Diamond symbol',
    },
    {
      title: 'Origin Information',
      text: 'Learn more about the source and background of this gemstone.',
      icon: detailIcons.origin,
      alt: 'Globe symbol',
    },
    {
      title: 'Certification Details',
      text: 'Certification can be arranged upon request.',
      icon: detailIcons.certification,
      alt: 'Document and certification symbol',
    },
  ];

  const trustItems = [
    {
      title: 'Generations of Trust',
      text: 'Built on a century of family lineage in the gemstone trade.',
      icon: detailIcons.generations,
      alt: 'Diamond emblem',
    },
    {
      title: 'Exceptional Expertise',
      text: 'Unmatched gemological skill in selection and curation.',
      icon: detailIcons.globalNetwork,
      alt: 'Globe emblem',
    },
    {
      title: 'Global Presence',
      text: 'Direct connections across Sri Lanka, India, Bangkok and Hong Kong.',
      icon: detailIcons.global,
      alt: 'Handshake emblem',
    },
    {
      title: 'Authenticity & Documentation',
      text: 'Gemological documentation subject to availability.',
      icon: detailIcons.authenticity,
      alt: 'Certification document emblem',
    },
  ];

  return (
    <main className="stone-detail-page">
      <div className="breadcrumbs page-pad stone-detail-breadcrumbs">
        <Link to="/">Home</Link>
        <span>›</span>
        <Link to="/our-gemstones">Our Gemstones</Link>
        <span>›</span>
        <Link to="/collections/ruby">Ruby Collection</Link>
        <span>›</span>
        <span>{formattedId}</span>
      </div>

      <section className="product-main page-pad" aria-label="Ruby details">
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={selectedImage.src} alt={selectedImage.alt} />
            <button
              type="button"
              className="zoom-button"
              aria-label="Open larger gemstone image"
              onClick={() => setZoomOpen(true)}
            >
              <ZoomIcon />
            </button>
          </div>
          <div className="product-thumbs" aria-label="More ruby views">
            {gallery.slice(1).map((image) => (
              <button
                key={image.src}
                type="button"
                className={selectedImage.src === image.src ? 'is-selected' : ''}
                onClick={() => setSelectedImage(image)}
                aria-label={`Show ${image.label.toLowerCase()}`}
                aria-pressed={selectedImage.src === image.src}
              >
                <img src={image.src} alt="" />
              </button>
            ))}
          </div>
          <p className="product-gallery__note">
            Images shown are for reference. Please enquire for current stone details.
          </p>
        </div>

        <div className="product-specs">
          <p className="eyebrow eyebrow--line">Ruby</p>
          <h1>
            Natural Ruby
            <span>{formattedId}</span>
          </h1>
          <p className="product-specs__intro">
            A fine natural ruby with vibrant red colour, carefully sourced from trusted
            origins. Selected for its exceptional beauty, clarity and long-term value.
          </p>

          <dl className="spec-table">
            {[
              ['Weight (Carat)', '2.15 ct'],
              ['Shape', 'Oval'],
              ['Colour', 'Red'],
              ['Clarity', 'Natural'],
              ['Origin', 'Myanmar'],
              ['Treatment', 'To be confirmed'],
              ['Certification', 'Details on request'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="product-action-card" aria-label="Enquiry and gemstone information">
          <div className="availability">
            <span>Availability</span>
            <strong>
              <i aria-hidden="true" />
              Inquire for current availability
            </strong>
          </div>
          <Link
            className="button button--gold product-action-card__enquire"
            to={`/contact?enquiry=${encodeURIComponent(formattedId)}`}
          >
            Enquire About This Gemstone <span>→</span>
          </Link>
          <button
            className={`button button--outline shortlist${saved ? ' is-saved' : ''}`}
            type="button"
            onClick={() => setSaved((current) => !current)}
            aria-pressed={saved}
          >
            {saved ? 'Added to Shortlist' : 'Add to Shortlist'}
            <HeartIcon saved={saved} />
          </button>

          <div className="product-action-card__services">
            {serviceItems.map((item) => (
              <article className="product-service" key={item.title}>
                <img src={item.icon} alt={item.alt} />
                <div>
                  <b>{item.title}</b>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="product-description page-pad" aria-label="Additional gemstone information">
        <div className="product-tabs" role="tablist" aria-label="Gemstone information tabs">
          {(Object.keys(tabs) as TabName[]).map((tab) => (
            <button
              id={`stone-tab-${tab.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="stone-tab-panel"
              tabIndex={activeTab === tab ? 0 : -1}
              className={activeTab === tab ? 'is-active' : ''}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          className="product-description__content"
          id="stone-tab-panel"
          role="tabpanel"
          aria-labelledby={`stone-tab-${activeTab.toLowerCase().replace(/[^a-z]+/g, '-')}`}
        >
          <div>
            <h2>{activeTab}</h2>
            <p>{tabs[activeTab]}</p>
          </div>
          <aside>
            <h3>Key Details</h3>
            <ul>
              <li>Natural coloured gemstone</li>
              <li>Rich red colour</li>
              <li>Carefully selected from trusted origins</li>
              <li>Ideal for fine jewellery and collectors</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="detail-trust-strip" aria-label="Hong Kong Gem House assurances">
        {trustItems.map((item) => (
          <article key={item.title}>
            <img src={item.icon} alt={item.alt} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      {zoomOpen && (
        <div
          className="stone-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Larger ruby image"
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setZoomOpen(false);
          }}
        >
          <button
            type="button"
            className="stone-lightbox__close"
            onClick={() => setZoomOpen(false)}
            aria-label="Close larger image"
            autoFocus
          >
            ×
          </button>
          <img src={selectedImage.src} alt={selectedImage.alt} />
        </div>
      )}
    </main>
  );
}
