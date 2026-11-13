import { useState } from 'react';
import { Link } from 'react-router-dom';
import './GemstonesPage.css';

type AssetImageProps = {
  candidates: string[];
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
};

/** Tries alternate common extensions because Windows may hide asset extensions. */
function AssetImage({ candidates, alt, className, loading = 'lazy' }: AssetImageProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || candidateIndex >= candidates.length) {
    return <div className={`${className ?? ''} gemstone-image-fallback`} aria-label={alt} role="img" />;
  }

  return (
    <img
      className={className}
      src={candidates[candidateIndex]}
      alt={alt}
      loading={loading}
      onError={() => {
        if (candidateIndex < candidates.length - 1) setCandidateIndex((index) => index + 1);
        else setFailed(true);
      }}
    />
  );
}

const ASSET_ROOT = '/assets/03-gemstone-categories';

const collections = [
  {
    name: 'Ruby',
    slug: 'ruby',
    image: [
      `${ASSET_ROOT}/gemstone-ruby.webp`,
      `${ASSET_ROOT}/gemstone-ruby.png`,
      `${ASSET_ROOT}/gemstone-ruby.jpg`,
      `${ASSET_ROOT}/gemstone-category-1.webp`,
      `${ASSET_ROOT}/gemstone-category-1.png`,
    ],
    descriptor: 'PASSION  |  RARITY  |  TIMELESS BEAUTY',
    description:
      'Renowned for their vivid colour and exceptional rarity, our rubies are carefully selected from trusted sources, offering unmatched beauty and long-term value.',
  },
  {
    name: 'Blue Sapphire',
    slug: 'blue-sapphire',
    image: [
      `${ASSET_ROOT}/gemstone-blue-sapphire.webp`,
      `${ASSET_ROOT}/gemstone-blue-sapphire.png`,
      `${ASSET_ROOT}/gemstone-blue-sapphire.jpg`,
      `${ASSET_ROOT}/gemstone-category-2.webp`,
      `${ASSET_ROOT}/gemstone-category-2.png`,
    ],
    descriptor: 'ELEGANCE  |  PURITY  |  ENDURING VALUE',
    description:
      'Fine blue sapphires from Ceylon and other renowned origins, known for their rich colour, clarity and brilliance. A symbol of wisdom, nobility and timeless appeal.',
  },
  {
    name: 'Emerald',
    slug: 'emerald',
    image: [
      `${ASSET_ROOT}/gemstone-emerald.webp`,
      `${ASSET_ROOT}/gemstone-emerald.png`,
      `${ASSET_ROOT}/gemstone-emerald.jpg`,
      `${ASSET_ROOT}/gemstone-category-3.webp`,
      `${ASSET_ROOT}/gemstone-category-3.png`,
    ],
    descriptor: 'NATURAL BEAUTY  |  RARITY  |  DISTINCTIVE CHARM',
    description:
      'Exceptional emeralds with vivid green hues, carefully sourced and selected for their natural beauty, character and investment potential.',
  },
  {
    name: 'Rare Gemstones',
    slug: 'rare-gemstones',
    image: [
      `${ASSET_ROOT}/gemstone-rare.webp`,
      `${ASSET_ROOT}/gemstone-rare.png`,
      `${ASSET_ROOT}/gemstone-rare.jpg`,
      `${ASSET_ROOT}/gemstone-category-4.webp`,
      `${ASSET_ROOT}/gemstone-category-4.png`,
    ],
    descriptor: "EXCLUSIVITY  |  UNIQUENESS  |  COLLECTOR'S CHOICE",
    description:
      'A curated selection of rare and extraordinary gemstones, including unique varieties and uncommon colours, for collectors and connoisseurs worldwide.',
  },
];

const features = [
  {
    title: 'Carefully Selected',
    description: 'Handpicked for exceptional quality and beauty.',
    icon: [
      `${ASSET_ROOT}/heritage-icon-generational-integrity.png`,
      `${ASSET_ROOT}/icons/heritage-icon-generational-integrity.png`,
    ],
  },
  {
    title: 'Trusted Sources',
    description: 'Direct relationships from renowned gemstone origins.',
    icon: [
      `${ASSET_ROOT}/heritage-icon-global-network.png`,
      `${ASSET_ROOT}/icons/heritage-icon-global-network.png`,
    ],
  },
  {
    title: 'Natural & Authentic',
    description: 'Genuine gemstones with expert verification.',
    icon: [
      `${ASSET_ROOT}/heritage-icon-guaranteed-authenticity.png`,
      `${ASSET_ROOT}/icons/heritage-icon-guaranteed-authenticity.png`,
    ],
  },
  {
    title: 'Investment Value',
    description: 'Timeless treasures for generations to come.',
    icon: [
      `${ASSET_ROOT}/icon-investment-value-chart.png`,
      `${ASSET_ROOT}/Antique Gold Bar Chart Emblem.png`,
      `${ASSET_ROOT}/icons/icon-investment-value-chart.png`,
    ],
  },
];

export default function GemstonesPage({ embedded = false }: { embedded?: boolean }) {
  const PageRoot = embedded ? 'div' : 'main';
  const heroCandidates = [
    `${ASSET_ROOT}/a_wide_high_resolution_horizontal_luxury_backgro.png`,
    `${ASSET_ROOT}/a_wide_high_resolution_horizontal_luxury_background.png`,
    `${ASSET_ROOT}/gemstones-hero-background.png`,
    `${ASSET_ROOT}/gemstone-hero-background.png`,
  ];

  const cardBackgroundCandidates = [
    `${ASSET_ROOT}/gemstone-cards-background.png`,
    `${ASSET_ROOT}/gemstone-cards-background.webp`,
    `${ASSET_ROOT}/gemstone-cards-background.jpg`,
  ];

  const commitmentBackgroundCandidates = [
    `${ASSET_ROOT}/commitment-bg-only.png`,
    `${ASSET_ROOT}/commitment-banner-background.png`,
    `${ASSET_ROOT}/commitment-bg-only.webp`,
  ];

  return (
    <PageRoot className="gemstones-page">
      <section className="gemstones-hero" aria-labelledby="gemstones-title">
        <AssetImage
          candidates={heroCandidates}
          alt="Ruby, blue sapphire and emerald gemstones on a dark natural stone surface"
          className="gemstones-hero__background"
          loading="eager"
        />
        <div className="gemstones-hero__content">
          <div className="gemstones-eyebrow"><span>Our Gemstones</span><i /></div>
          <h1 id="gemstones-title">
            <span>Exceptional</span>
            <strong>Natural Gemstones</strong>
          </h1>
          <p>
            We specialize in the world’s most sought-after coloured gemstones,
            sourced from trusted origins and selected for their exceptional
            beauty, rarity and investment value.
          </p>
        </div>
      </section>

      <section className="gemstone-collections" aria-label="Gemstone collections">
        <AssetImage
          candidates={cardBackgroundCandidates}
          alt=""
          className="gemstone-collections__background"
          loading="lazy"
        />
        <div className="gemstone-collections__grid">
          {collections.map((collection) => (
            <Link
              className="gemstone-collection"
              key={collection.slug}
              to={`/collections/${collection.slug}`}
              aria-label={`View the ${collection.name} collection`}
            >
              <AssetImage
                candidates={collection.image}
                alt={`${collection.name} gemstone collection`}
                className="gemstone-collection__image"
                loading="lazy"
              />
              <div className="gemstone-collection__body">
                <div className="gemstone-collection__title-row">
                  <h2>{collection.name}</h2>
                  <span aria-hidden="true" />
                </div>
                <p className="gemstone-collection__descriptor">{collection.descriptor}</p>
                <p className="gemstone-collection__description">{collection.description}</p>
                <span className="gemstone-collection__link" aria-hidden="true">
                  <span>View Collection</span><span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gemstones-commitment" aria-labelledby="gemstones-commitment-title">
        <AssetImage
          candidates={commitmentBackgroundCandidates}
          alt=""
          className="gemstones-commitment__background"
          loading="lazy"
        />
        <div className="gemstones-commitment__content">
          <div className="gemstones-eyebrow gemstones-eyebrow--light"><span>Our Commitment</span><i /></div>
          <h2 id="gemstones-commitment-title">Finest Gemstones<br />For A Brighter Tomorrow</h2>
          <div className="gemstones-commitment__features">
            {features.map((feature) => (
              <article className="gemstones-feature" key={feature.title}>
                <AssetImage
                  candidates={feature.icon}
                  alt=""
                  className="gemstones-feature__icon"
                  loading="lazy"
                />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
        <blockquote className="gemstones-commitment__quote">
          “Coloured gemstones that inspire, today and for generations.”
          <span aria-hidden="true" />
        </blockquote>
      </section>
    </PageRoot>
  );
}
