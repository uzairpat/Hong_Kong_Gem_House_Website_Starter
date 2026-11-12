import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './GemstoneCategoryCollectionPage.css';

type CategorySlug = 'ruby' | 'blue-sapphire' | 'emerald' | 'rare-gemstones';

type GemstoneRecord = {
  id: string;
  reference_code: string;
  name: string;
  category: string;
  weight_carat: number | string | null;
  shape: string | null;
  origin: string | null;
  colour: string | null;
  clarity: string | null;
  treatment: string | null;
  cut?: string | null;
  dimensions_mm?: string | null;
  origin_region?: string | null;
  certification_lab: string | null;
  certification_number: string | null;
  description: string | null;
  public_title?: string | null;
  public_description?: string | null;
  public_price?: string | null;
  availability_status?: string;
  is_sample: boolean;
  image_path: string | null;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
).replace(/\/$/, '');

const categoryDetails: Record<CategorySlug, {
  apiCategory: string;
  name: string;
  eyebrow: string;
  description: string;
  tagline: string;
  image: string;
}> = {
  ruby: {
    apiCategory: 'ruby',
    name: 'Ruby Collection',
    eyebrow: 'PASSION | RARITY | TIMELESS BEAUTY',
    tagline: 'Exceptional Natural Rubies',
    description: 'Discover our ruby selection, with each gemstone individually recorded and presented from the Hong Kong Gem House inventory.',
    image: '/assets/ruby-collection-hero-bg-hd.png',
  },
  'blue-sapphire': {
    apiCategory: 'sapphire',
    name: 'Blue Sapphire Collection',
    eyebrow: 'ELEGANCE | PURITY | ENDURING VALUE',
    tagline: 'Exceptional Blue Sapphires',
    description: 'Discover our blue sapphire selection, featuring gemstones chosen for their colour, clarity and brilliance.',
    image: '/assets/03-gemstone-categories/gemstone-blue-sapphire.jpg',
  },
  emerald: {
    apiCategory: 'emerald',
    name: 'Emerald Collection',
    eyebrow: 'NATURAL BEAUTY | RARITY | DISTINCTIVE CHARM',
    tagline: 'Exceptional Emeralds',
    description: 'Explore emeralds selected for their vivid green hues, natural character and distinctive beauty.',
    image: '/assets/03-gemstone-categories/gemstone-emerald.jpg',
  },
  'rare-gemstones': {
    apiCategory: 'rare',
    name: 'Rare Gemstones Collection',
    eyebrow: "EXCLUSIVITY | UNIQUENESS | COLLECTOR'S CHOICE",
    tagline: 'Rare and Extraordinary Gemstones',
    description: 'Explore a curated selection of unusual gemstone varieties and uncommon colours for collectors and connoisseurs.',
    image: '/assets/03-gemstone-categories/gemstone-rare.jpg',
  },
};

export default function GemstoneCategoryCollectionPage({ slug }: { slug: CategorySlug }) {
  const category = categoryDetails[slug];
  const [items, setItems] = useState<GemstoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadCollection() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/gemstones?category=${encodeURIComponent(category.apiCategory)}`,
          { signal: controller.signal, headers: { Accept: 'application/json' } },
        );

        const result = await response.json().catch(() => ({})) as {
          data?: GemstoneRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load this gemstone collection.');
        }

        setItems(Array.isArray(result.data) ? result.data : []);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this gemstone collection.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCollection();
    return () => controller.abort();
  }, [category.apiCategory]);

  const isDevelopmentSample = items.length > 0 && items.every((item) => item.is_sample);

  return (
    <main className="gem-category-page">
      <div className="gem-category-breadcrumbs">
        <Link to="/">Home</Link><span aria-hidden="true">›</span>
        <Link to="/#our-gemstones">Our Gemstones</Link><span aria-hidden="true">›</span>
        <span aria-current="page">{category.name}</span>
      </div>

      <section className="gem-category-hero">
        <div className="gem-category-hero__copy">
          <p className="gem-category-eyebrow">{category.eyebrow}</p>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <img src={category.image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
      </section>

      <section className="gem-category-content">
        <div className="gem-category-content__heading">
          <div>
            <p className="gem-category-eyebrow">HONG KONG GEM HOUSE</p>
            <h2>{category.tagline}</h2>
          </div>
          {!loading && !error && <span>{items.length} {items.length === 1 ? 'stone' : 'stones'}</span>}
        </div>

        {isDevelopmentSample && (
          <p className="gem-category-sample-note">
            Development preview: these are sample catalogue records, not verified company inventory.
          </p>
        )}

        {loading ? (
          <p className="gem-category-state" role="status">Loading this collection...</p>
        ) : error ? (
          <div className="gem-category-state gem-category-state--error" role="alert">{error}</div>
        ) : items.length === 0 ? (
          <div className="gem-category-empty">
            <h3>New gemstones are being prepared.</h3>
            <p>Our team can help with current availability and sourcing enquiries for this collection.</p>
            <Link className="gem-category-enquire" to={{ pathname: '/', hash: '#contact' }}>
              Enquire with our team <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <div className="gem-category-grid">
            {items.map((stone) => (
              <article className="gem-category-stone" key={stone.id}>
                <div className="gem-category-stone__image-wrap">
                  <img
                    src={stone.image_path || category.image}
                    alt={stone.name}
                    loading="lazy"
                    onError={(event) => {
                      if (event.currentTarget.src !== new URL(category.image, window.location.origin).href) {
                        event.currentTarget.src = category.image;
                      }
                    }}
                  />
                </div>
                <div className="gem-category-stone__body">
                  <p className="gem-category-stone__reference">{stone.reference_code}</p>
                  <h3>{stone.public_title || stone.name}</h3>
                  {stone.public_description && <p className="gem-category-stone__description">{stone.public_description}</p>}
                  <dl>
                    {stone.weight_carat !== null && <div><dt>Weight</dt><dd>{Number(stone.weight_carat).toFixed(2)} ct</dd></div>}
                    {stone.shape && <div><dt>Shape</dt><dd>{stone.shape}</dd></div>}
                    {stone.origin && <div><dt>Origin</dt><dd>{stone.origin}</dd></div>}
                    {stone.origin_region && <div><dt>Region</dt><dd>{stone.origin_region}</dd></div>}
                    {stone.dimensions_mm && <div><dt>Dimensions</dt><dd>{stone.dimensions_mm}</dd></div>}
                    {stone.colour && <div><dt>Colour</dt><dd>{stone.colour}</dd></div>}
                    {stone.clarity && <div><dt>Clarity</dt><dd>{stone.clarity}</dd></div>}
                    {stone.treatment && <div><dt>Treatment</dt><dd>{stone.treatment}</dd></div>}
                    {stone.cut && <div><dt>Cut</dt><dd>{stone.cut}</dd></div>}
                  </dl>
                  {stone.public_price && <p className="gem-category-stone__price">{stone.public_price}</p>}
                  <Link className="gem-category-stone__enquire" to={"/stones/" + encodeURIComponent(stone.reference_code)}>
                    View gemstone details <span aria-hidden="true">→</span>
                  </Link>
                  <Link
                    className="gem-category-stone__enquire"
                    to={{ pathname: '/', search: `?enquiry=${encodeURIComponent(stone.reference_code)}`, hash: '#contact' }}
                  >
                    Enquire about this stone <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
