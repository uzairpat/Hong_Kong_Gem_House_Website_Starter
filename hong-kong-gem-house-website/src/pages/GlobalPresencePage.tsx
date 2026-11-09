import './GlobalPresencePage.css';

const ASSET_ROOT = '/assets/07-global-presence';
const ICON_ROOT = `${ASSET_ROOT}/icons`;

type DetailIconName =
  | 'location'
  | 'office'
  | 'phone'
  | 'email'
  | 'globe'
  | 'briefcase'
  | 'mountain'
  | 'leaf';

type LocationDetail = {
  icon: DetailIconName;
  text: string;
  href?: string;
};

type Location = {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  emblem: string;
  emblemAlt: string;
  description: string;
  details: LocationDetail[];
};

const detailIconFiles: Record<DetailIconName, string> = {
  location: 'global-detail-location.png',
  office: 'global-detail-office.png',
  phone: 'global-detail-phone.png',
  email: 'global-detail-email.png',
  globe: 'global-detail-globe.png',
  briefcase: 'global-detail-briefcase.png',
  mountain: 'global-icon-mountain-origin.png',
  leaf: 'global-detail-leaf.png',
};

const locations: Location[] = [
  {
    name: 'Hong Kong',
    role: 'Head Office',
    image: `${ASSET_ROOT}/global-hong-kong.webp`,
    imageAlt: 'Hong Kong skyline across Victoria Harbour at sunset',
    emblem: `${ICON_ROOT}/global-icon-hong-kong.png`,
    emblemAlt: 'Antique-gold Hong Kong skyline inside a circular outline',
    description:
      'Our head office in Hong Kong connects us to the global jewellery and gemstone markets, enabling trusted partnerships across Asia and beyond.',
    details: [
      {
        icon: 'location',
        text: 'Sample Address Line, Hong Kong SAR, China',
      },
      { icon: 'office', text: 'Head Office' },
      { icon: 'phone', text: '+852 1234 5678', href: 'tel:+85212345678' },
      { icon: 'email', text: 'info@hkgemhouse.com', href: 'mailto:info@hkgemhouse.com' },
      { icon: 'globe', text: 'Global Trade & Distribution' },
    ],
  },
  {
    name: 'Bangkok',
    role: 'Branch',
    image: `${ASSET_ROOT}/global-bangkok.webp`,
    imageAlt: 'Bangkok temples and skyline in warm evening light',
    emblem: `${ICON_ROOT}/Gold%20Thai%20Temple%20Spire%20Icon.png`,
    emblemAlt: 'Gold Thai temple inside a circular outline',
    description:
      'Our Bangkok branch leverages Thailand’s world-class gem cutting, polishing and lapidary expertise, placing us at the heart of the regional gemstone trade.',
    details: [
      { icon: 'location', text: 'Sample Address Line, Bangkok, Thailand' },
      { icon: 'office', text: 'Branch Office' },
      { icon: 'phone', text: '+66 123 456 789', href: 'tel:+66123456789' },
      { icon: 'email', text: 'bangkok@hkgemhouse.com', href: 'mailto:bangkok@hkgemhouse.com' },
      { icon: 'briefcase', text: 'Cutting, Polishing & Trading Network' },
    ],
  },
  {
    name: 'Sri Lanka',
    role: 'Origin',
    image: `${ASSET_ROOT}/global-sri-lanka.webp`,
    imageAlt: 'Sigiriya rock rising above the green Sri Lankan landscape at sunrise',
    emblem: `${ICON_ROOT}/Gold%20Diamond%20in%20Circle%20Icon.png`,
    emblemAlt: 'Gold diamond inside a circular outline',
    description:
      'Our direct connections to Sri Lanka’s historic gemstone regions, including Ratnapura and Colombo, give us access to some of the world’s finest natural sapphires and rare coloured gemstones.',
    details: [
      { icon: 'location', text: 'Sample Address Line, Ratnapura & Colombo, Sri Lanka' },
      { icon: 'mountain', text: 'Gemstone Origin' },
      { icon: 'phone', text: '+94 11 234 5678', href: 'tel:+94112345678' },
      { icon: 'email', text: 'srilanka@hkgemhouse.com', href: 'mailto:srilanka@hkgemhouse.com' },
      { icon: 'leaf', text: 'Gemstone Origin & Direct Sourcing' },
    ],
  },
];

const reachFeatures = [
  {
    image: `${ICON_ROOT}/heritage-icon-generational-integrity.png`,
    alt: 'Gold diamond inside a circle',
    text: 'Premium Gemstone Sources',
  },
  {
    image: `${ICON_ROOT}/heritage-icon-global-network.png`,
    alt: 'Gold globe inside a circle',
    text: 'Strong Asian Market Presence',
  },
  {
    image: `${ICON_ROOT}/ruby-detail-global-presence.png`,
    alt: 'Gold handshake inside a circle',
    text: 'Trusted Global Partnerships',
  },
  {
    image: `${ICON_ROOT}/Golden%20Ascending%20Bar%20Chart%20Icon.png`,
    alt: 'Gold ascending bar chart inside a circle',
    text: 'Growing International Reach',
  },
];

function DetailIcon({ name }: { name: DetailIconName }) {
  return (
    <img
      className={`global-detail-icon global-detail-icon--${name}`}
      src={`${ICON_ROOT}/${detailIconFiles[name]}`}
      alt=""
      aria-hidden="true"
      loading="eager"
    />
  );
}

export default function GlobalPresencePage({ embedded = false }: { embedded?: boolean }) {
  const PageRoot = embedded ? 'div' : 'main';
  return (
    <PageRoot className="global-page">
      <section
        className="global-hero"
        aria-label="Global presence connecting Hong Kong, Bangkok and Sri Lanka"
      >
        <div className="global-hero__copy">
          <p className="global-hero__eyebrow">Global Presence</p>
          <h1>
            <span className="global-hero__title-gold">A World of</span>
            <span className="global-hero__title-dark">Trusted Connections.</span>
          </h1>
          <p className="global-hero__description">
            With deep roots in Sri Lanka, a strong presence in Bangkok, and our
            head office in Hong Kong, we bring together generations of expertise
            and a global network to serve collectors, jewellers and trade
            partners worldwide.
          </p>
        </div>

        <aside className="global-hero__side-note" aria-label="From source to global markets">
          <span className="global-hero__side-title">From<br />Source<br />to Global<br />Markets</span>
          <span className="global-hero__side-rule" />
          <span className="global-hero__side-caption">
            Natural<br />Gemstones.<br />Timeless<br />Relationships.
          </span>
        </aside>
      </section>

      <section className="global-locations" aria-label="Our global locations">
        {locations.map((location) => (
          <article className="global-location" key={location.name}>
            <img
              className="global-location__photo"
              src={location.image}
              alt={location.imageAlt}
              loading="eager"
            />

            <div className="global-location__body">
              <div className="global-location__main">
                <div className="global-location__heading">
                  <img
                    className="global-location__emblem"
                    src={location.emblem}
                    alt={location.emblemAlt}
                    loading="eager"
                  />
                  <div className="global-location__title-wrap">
                    <h2>{location.name}</h2>
                    <span>{location.role}</span>
                  </div>
                </div>
                <p>{location.description}</p>
              </div>

              <ul className="global-location__details" aria-label={`${location.name} contact and business details`}>
                {location.details.map((detail) => (
                  <li key={`${location.name}-${detail.icon}-${detail.text}`}>
                    <DetailIcon name={detail.icon} />
                    {detail.href ? (
                      <a href={detail.href}>{detail.text}</a>
                    ) : (
                      <span>{detail.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="global-reach" aria-label="Our reach and global opportunities">
        <div className="global-reach__copy">
          <p className="global-reach__eyebrow">Our Reach</p>
          <h2>Local Heritage.<br />Global Opportunities.</h2>
          <p>
            Combining a rich regional legacy with an international outlook, we
            continue to build enduring relationships across the global gemstone
            industry.
          </p>
        </div>

        <ul className="global-reach__features">
          {reachFeatures.map((feature) => (
            <li key={feature.text}>
              <img src={feature.image} alt={feature.alt} loading="eager" />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageRoot>
  );
}
