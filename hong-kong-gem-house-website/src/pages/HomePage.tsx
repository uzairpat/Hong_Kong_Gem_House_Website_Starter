import { Link } from 'react-router-dom';

const assetRoot = '/assets/homepage-elements';

const specialtyGems = [
  { name: 'Ruby', slug: 'ruby', src: `${assetRoot}/gemstones/ruby-transparent.png` },
  { name: 'Blue sapphire', slug: 'blue-sapphire', src: `${assetRoot}/gemstones/blue-sapphire-transparent.png` },
  { name: 'Emerald', slug: 'emerald', src: `${assetRoot}/gemstones/emerald-transparent.png` },
  { name: 'Rare gemstone', slug: 'rare-gemstones', src: `${assetRoot}/gemstones/rare-star-gem-transparent.png` },
];

const pillars = [
  {
    icon: `${assetRoot}/icons/icon-diamond-trust.png`,
    title: <>Generations<br />of Trust</>,
    text: 'Built on a century of family lineage and unwavering integrity in the gemstone trade.',
    alt: 'Diamond icon',
  },
  {
    icon: `${assetRoot}/icons/icon-globe-expertise.png`,
    title: <>Exceptional<br />Expertise</>,
    text: 'Unmatched gemological skill in selection, cutting and curation of fine gemstones.',
    alt: 'Globe icon',
  },
  {
    icon: `${assetRoot}/icons/icon-handshake-global-presence.png`,
    title: <>Global<br />Presence</>,
    text: 'Direct connections across Sri Lanka, India, Bangkok and Hong Kong.',
    alt: 'Handshake icon',
  },
  {
    icon: `${assetRoot}/icons/icon-certificate-authenticity.png`,
    title: <>Certified<br />Authenticity</>,
    text: 'Natural gemstones supported by international gemological standards (GIA, GRSS, Lotus, AIGS).',
    alt: 'Certificate icon',
  },
];

export default function HomePage({ embedded = false }: { embedded?: boolean }) {
  const PageRoot = embedded ? 'div' : 'main';
  return (
    <PageRoot className="home-page">
      <section className="home-hero home-hero--composite" aria-labelledby="home-title">
        <div className="home-hero__content">
          <p className="eyebrow eyebrow--line">Hong Kong Gem House Limited</p>
          <h1 id="home-title"><span>A Legacy in</span><br />Fine Gemstones.</h1>
          <p className="home-hero__description">
            Bridging generations of trust, exceptional gemological expertise and a global trading heritage from Sri Lanka, India and Bangkok to Hong Kong.
          </p>
          <div className="home-hero__gem-row" aria-label="Our gemstone specialities">
            {specialtyGems.map((gem) => (
              <Link
                key={gem.name}
                className="home-hero__gem-link"
                to={`/collections/${gem.slug}`}
                aria-label={`Explore the ${gem.name} collection`}
                title={`Explore ${gem.name}`}
              >
                <img src={gem.src} alt={gem.name} />
              </Link>
            ))}
          </div>
          <p className="home-hero__specialty">Specializing in: Ruby, Blue Sapphire, Emerald &amp; Rare Gems</p>
          <div className="hero-actions">
            {embedded ? (
              <a className="button button--gold" href="#contact">Enquire About Gemstones <span aria-hidden="true">→</span></a>
            ) : (
              <Link className="button button--gold" to="/contact">Enquire About Gemstones <span aria-hidden="true">→</span></Link>
            )}
            {embedded ? (
              <a className="button button--outline" href="#our-heritage">Our Heritage <span aria-hidden="true">→</span></a>
            ) : (
              <Link className="button button--outline" to="/our-heritage">Our Heritage <span aria-hidden="true">→</span></Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-pillars" aria-label="Our strengths">
        {pillars.map((item) => (
          <article className="home-pillar" key={item.alt}>
            <div className="home-pillar__icon-frame">
              <img className="home-pillar__icon" src={item.icon} alt="" loading="lazy" />
            </div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </PageRoot>
  );
}
