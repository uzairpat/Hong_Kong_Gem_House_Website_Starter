import './OurHeritagePage.css';

type HeritageTimelineItem = {
  period: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  imagePosition?: string;
};

const timeline: HeritageTimelineItem[] = [
  {
    period: '1920s',
    title: 'Kayalpattinam & South India',
    description:
      'Built on centuries of maritime trade, local community goodwill, and high-purity precious metals and stones.',
    image: '/assets/02-heritage/timeline/timeline-kayalpattinam.webp',
    alt: 'Illustrative sepia coastal harbour scene representing Kayalpattinam and South India',
    imagePosition: 'center 54%',
  },
  {
    period: 'Sri Lanka',
    title: 'Sri Lanka (Ceylon)',
    description:
      'Direct ties to historical mine-to-market sapphire pathways, ensuring rare, unheated colour gemstones.',
    image: '/assets/02-heritage/timeline/timeline-sri-lanka.webp',
    alt: 'Illustrative Sri Lankan temple and lake surrounded by tropical greenery',
    imagePosition: 'center 51%',
  },
  {
    period: 'Bangkok',
    title: 'Bangkok',
    description: "Leveraging Thailand's world-class gem cutting, polishing, and lapidary art.",
    image: '/assets/02-heritage/timeline/timeline-bangkok.webp',
    alt: 'Illustrative Bangkok temple skyline at sunset',
    imagePosition: 'center 52%',
  },
  {
    period: '1959 onwards',
    title: 'Hong Kong',
    description:
      'Bringing generations of cumulative goodwill into a global hub for luxury jewellery and fine gem trading.',
    image: '/assets/02-heritage/timeline/timeline-hong-kong.webp',
    alt: 'Illustrative Hong Kong Victoria Harbour skyline at sunset',
    imagePosition: 'center 53%',
  },
];

const values = [
  {
    title: ['Generational', 'Integrity'],
    description: 'Over 100 years of family lineage in gemstone trading.',
    icon: '/assets/02-heritage/icons/heritage-icon-generational-integrity.png',
    alt: 'Gold diamond inside a circular outline',
  },
  {
    title: ['Global', 'Network'],
    description: 'Direct connections across Sri Lanka, South India, Bangkok and Hong Kong.',
    icon: '/assets/02-heritage/icons/heritage-icon-global-network.png',
    alt: 'Gold globe inside a circular outline',
  },
  {
    title: ['Guaranteed', 'Authenticity'],
    description: 'Natural gemstones supported by international gemological standards.',
    icon: '/assets/02-heritage/icons/heritage-icon-guaranteed-authenticity.png',
    alt: 'Gold shield and check inside a circular outline',
  },
];

function HeritageValues() {
  return (
    <div className="heritage-final-values">
      {values.map((value) => (
        <article className="heritage-final-value" key={value.title.join(" ")}>
          <img className="heritage-final-value__icon" src={value.icon} alt={value.alt} />
          <div className="heritage-final-value__copy">
            <h2>
              {value.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p>{value.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function DesktopTimeline() {
  return (
    <div className="heritage-final-timeline-desktop">
      <div className="heritage-final-timeline__photos">
        {timeline.map((item) => (
          <img
            key={item.title}
            src={item.image}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: item.imagePosition }}
          />
        ))}
      </div>

      <div className="heritage-final-timeline__axis" aria-label="Heritage timeline dates and locations">
        {timeline.map((item) => (
          <div className="heritage-final-timeline__period" key={item.title}>
            <span aria-hidden="true" />
            <p>{item.period}</p>
          </div>
        ))}
      </div>

      <div className="heritage-final-timeline__details">
        {timeline.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function CompactTimeline() {
  return (
    <div className="heritage-final-timeline-compact">
      {timeline.map((item) => (
        <article className="heritage-final-timeline-card" key={item.title}>
          <img
            src={item.image}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: item.imagePosition }}
          />
          <p className="heritage-final-timeline-card__period">{item.period}</p>
          <h3>{item.title}</h3>
          <p className="heritage-final-timeline-card__description">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function OurHeritagePage() {
  return (
    <main className="heritage-final">
      <section className="heritage-final-hero" aria-labelledby="heritage-final-title">
        <div className="heritage-final-hero__copy">
          <p className="heritage-final-eyebrow">
            <span>OUR HERITAGE</span>
            <i aria-hidden="true" />
          </p>

          <h1 id="heritage-final-title">
            <span>THE WAVOO &amp; VILAK</span>
            <strong>LEGACY</strong>
          </h1>

          <p className="heritage-final-hero__lead">
            FOR GENERATIONS, THE NAMES WAVOO AND VILAK HAVE BEEN SYNONYMOUS WITH
            INTEGRITY, CRAFTSMANSHIP, AND PRECIOUSNESS IN THE GEM &amp; JEWELLERY WORLD.
          </p>

          <p className="heritage-final-hero__body">
            At Hong Kong Gem House Limited, our foundation rests upon generations of trust,
            deep gemological expertise, and an unbroken legacy spanning Kayalpattinam,
            Sri Lanka, Chennai, Bangkok, and global trading capitals. We honour traditional
            ethics while curating the world’s finest coloured gemstones for discerning
            collectors and trade partners.
          </p>
        </div>

        {/* The image contains the five map labels already. Do not add HTML labels over it. */}
        <div className="heritage-final-hero__mobile-image" aria-hidden="true">
          <img
            src="/assets/02-heritage/hero/heritage-hero-background-final.png"
            alt=""
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      <section className="heritage-final-journey" aria-labelledby="heritage-final-journey-title">
        <div className="heritage-final-journey__intro">
          <h2 id="heritage-final-journey-title">OUR ROOTS<br />ACROSS<br />THE GLOBE</h2>
          <span aria-hidden="true" />
          <p>A journey of trust, expertise and global connections.</p>
        </div>

        <div className="heritage-final-journey__timeline">
          <DesktopTimeline />
          <CompactTimeline />
        </div>
      </section>

      <section className="heritage-final-legacy" aria-label="Our family legacy and values">
        <div className="heritage-final-legacy__content">
          <blockquote>
            <span>“Carrying the Wavoo &amp; Vilak legacy</span>
            <span>of gemstone excellence from source to city.”</span>
          </blockquote>
          <HeritageValues />
        </div>

        <div className="heritage-final-legacy__mobile-image" aria-hidden="true">
          <img
            src="/assets/02-heritage/lower-banner/heritage-quote-banner-background-only.png"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </main>
  );
}
