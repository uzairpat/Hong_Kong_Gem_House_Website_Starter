import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './RubyCollectionPage.css';

type Stone = {
  id: string;
  carat: number;
  shape: string;
  origin: string;
  colour: string;
  clarity: string;
  imageNumber: string;
};

type FilterKey = 'origin' | 'shape' | 'carat' | 'colour' | 'clarity' | 'price';
type AppliedFilters = {
  origins: string[];
  shapes: string[];
  colours: string[];
  clarities: string[];
  minCarat: string;
  maxCarat: string;
};

const EMPTY_FILTERS: AppliedFilters = {
  origins: [],
  shapes: [],
  colours: [],
  clarities: [],
  minCarat: '',
  maxCarat: '',
};

// These are the eight ruby records currently represented by the supplied product images.
// When the remaining inventory records are ready, add them here; pagination expands automatically.
const rubyStones: Stone[] = [
  { id: 'RBY-001', carat: 5.12, shape: 'Oval', origin: 'Myanmar (Burma)', colour: 'Pigeon Blood Red', clarity: 'VVS', imageNumber: '001' },
  { id: 'RBY-002', carat: 3.08, shape: 'Cushion', origin: 'Sri Lanka (Ceylon)', colour: 'Vivid Red', clarity: 'VS', imageNumber: '002' },
  { id: 'RBY-003', carat: 2.36, shape: 'Round', origin: 'Mozambique', colour: 'Rich Red', clarity: 'VS', imageNumber: '003' },
  { id: 'RBY-004', carat: 4.21, shape: 'Pear', origin: 'Myanmar (Burma)', colour: 'Vivid Red', clarity: 'VVS', imageNumber: '004' },
  { id: 'RBY-005', carat: 1.85, shape: 'Oval', origin: 'Thailand', colour: 'Red', clarity: 'VS', imageNumber: '005' },
  { id: 'RBY-006', carat: 6.03, shape: 'Emerald Cut', origin: 'Mozambique', colour: 'Deep Red', clarity: 'VVS', imageNumber: '006' },
  { id: 'RBY-007', carat: 3.47, shape: 'Oval', origin: 'Sri Lanka (Ceylon)', colour: 'Vivid Red', clarity: 'VS', imageNumber: '007' },
  { id: 'RBY-008', carat: 2.91, shape: 'Cushion', origin: 'Madagascar', colour: 'Red', clarity: 'VVS', imageNumber: '008' },
];

const originOptions = ['Myanmar (Burma)', 'Sri Lanka (Ceylon)', 'Mozambique', 'Madagascar', 'Thailand', 'Other'];
const shapeOptions = ['Oval', 'Cushion', 'Round', 'Pear', 'Emerald Cut', 'Other'];
const colourOptions = ['Pigeon Blood Red', 'Vivid Red', 'Rich Red', 'Deep Red', 'Red'];
const clarityOptions = ['VVS', 'VS', 'SI'];

const originCounts: Record<string, number> = {
  'Myanmar (Burma)': 12,
  'Sri Lanka (Ceylon)': 8,
  Mozambique: 6,
  Madagascar: 4,
  Thailand: 3,
  Other: 2,
};
const shapeCounts: Record<string, number> = {
  Oval: 14,
  Cushion: 7,
  Round: 6,
  Pear: 4,
  'Emerald Cut': 3,
  Other: 3,
};

const heroCandidates = [
  // The clean, text-free hero delivered for the approved Page 4 composition.
  '/assets/ruby-collection-hero-bg-hd.png',
  '/assets/04-ruby-collection/hero/ruby-collection-hero-background.png',
  '/assets/04-ruby-collection/hero/ruby-collection-hero-background.jpg',
  '/assets/04-ruby-collection/ruby-collection-hero-background.png',
  '/assets/04-ruby-collection/ruby-collection-banner.jpg',
  '/assets/04-ruby-collection/ruby-collection-banner.webp',
  '/assets/ruby-collection-hero-background.png',
];

function productImageCandidates(imageNumber: string): string[] {
  // Prefer the dark, wide ruby-card photographs used in the approved collection mock-up.
  // Older neutral-background ruby-001.jpg files are deliberately kept only as last fallbacks.
  const cardNumber = String(Number(imageNumber));
  const cardBase = `/assets/ruby-card-${cardNumber}`;
  const nestedCardBase = `/assets/04-ruby-collection/ruby-card-${cardNumber}`;
  const legacyBase = `/assets/04-ruby-collection/ruby-${imageNumber}`;
  return [
    `${cardBase}.jpg`, `${cardBase}.webp`, `${cardBase}.png`,
    `${nestedCardBase}.jpg`, `${nestedCardBase}.webp`, `${nestedCardBase}.png`,
    `${legacyBase}.jpg`, `${legacyBase}.webp`, `${legacyBase}.png`, `${legacyBase}.jpeg`,
  ];
}

function useFallbackImage(sources: string[]) {
  const [index, setIndex] = useState(0);
  const source = sources[index];
  const onError = () => setIndex((current) => current + 1);
  return { source, onError };
}

function SafeImage({
  sources,
  alt,
  className,
  eager = false,
}: {
  sources: string[];
  alt: string;
  className: string;
  eager?: boolean;
}) {
  const { source, onError } = useFallbackImage(sources);
  if (!source) {
    return <div className={`${className} rbc-image-fallback`} role="img" aria-label={alt}>Hong Kong Gem House</div>;
  }
  return <img className={className} src={source} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={onError} />;
}

function HeartIcon({ saved }: { saved: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20.4 8.7c0 4.2-8.4 10.1-8.4 10.1S3.6 12.9 3.6 8.7a4.3 4.3 0 0 1 8.4-1.1 4.3 4.3 0 0 1 8.4 1.1Z"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="6" height="6" />
      <rect x="12" y="2" width="6" height="6" />
      <rect x="2" y="12" width="6" height="6" />
      <rect x="12" y="12" width="6" height="6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 4h2M8 4h9M3 10h2M8 10h9M3 16h2M8 16h9" />
    </svg>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="rbc-check-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
      {typeof count === 'number' && <small>({count})</small>}
    </label>
  );
}

function FilterGroup({
  title,
  filterKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  filterKey: FilterKey;
  expanded: boolean;
  onToggle: (key: FilterKey) => void;
  children?: ReactNode;
}) {
  return (
    <section className="rbc-filter-group">
      <button className="rbc-filter-group__toggle" type="button" onClick={() => onToggle(filterKey)} aria-expanded={expanded}>
        <span>{title}</span>
        <b aria-hidden="true">{expanded ? '−' : '+'}</b>
      </button>
      {expanded && <div className="rbc-filter-group__content">{children}</div>}
    </section>
  );
}

function AssuranceIcon({
  sources,
  alt,
}: {
  sources: string[];
  alt: string;
}) {
  const { source, onError } = useFallbackImage(sources);
  if (!source) return <span className="rbc-assurance-fallback" aria-hidden="true">◇</span>;
  return <img className="rbc-assurance__icon" src={source} alt={alt} loading="lazy" onError={onError} />;
}

export default function RubyCollectionPage() {
  const { category = 'ruby' } = useParams();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState<FilterKey[]>(['origin', 'shape']);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem('hkg-ruby-shortlist');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      return [];
    }
  });
  const [shortlistMessage, setShortlistMessage] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem('hkg-ruby-shortlist', JSON.stringify(savedIds));
    } catch {
      // Shortlist remains functional for the current session when storage is unavailable.
    }
  }, [savedIds]);

  const toggleDraftValue = (key: 'origins' | 'shapes' | 'colours' | 'clarities', value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const toggleFilterGroup = (key: FilterKey) => {
    setExpandedFilters((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  };

  const filteredStones = useMemo(() => {
    let result = rubyStones.filter((stone) => {
      const originMatch = appliedFilters.origins.length === 0
        || appliedFilters.origins.includes(stone.origin)
        || (appliedFilters.origins.includes('Other') && !originOptions.slice(0, 5).includes(stone.origin));
      const shapeMatch = appliedFilters.shapes.length === 0
        || appliedFilters.shapes.includes(stone.shape)
        || (appliedFilters.shapes.includes('Other') && !shapeOptions.slice(0, 5).includes(stone.shape));
      const colourMatch = appliedFilters.colours.length === 0 || appliedFilters.colours.includes(stone.colour);
      const clarityMatch = appliedFilters.clarities.length === 0 || appliedFilters.clarities.includes(stone.clarity);
      const minMatch = appliedFilters.minCarat === '' || stone.carat >= Number(appliedFilters.minCarat);
      const maxMatch = appliedFilters.maxCarat === '' || stone.carat <= Number(appliedFilters.maxCarat);
      return originMatch && shapeMatch && colourMatch && clarityMatch && minMatch && maxMatch;
    });

    if (sortBy === 'carat-asc') result = [...result].sort((a, b) => a.carat - b.carat);
    if (sortBy === 'carat-desc') result = [...result].sort((a, b) => b.carat - a.carat);
    if (sortBy === 'origin') result = [...result].sort((a, b) => a.origin.localeCompare(b.origin));
    if (sortBy === 'shape') result = [...result].sort((a, b) => a.shape.localeCompare(b.shape));
    return result;
  }, [appliedFilters, sortBy]);

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const applyFilters = () => setAppliedFilters(draftFilters);

  const toggleSaved = (stoneId: string) => {
    const wasSaved = savedIds.includes(stoneId);
    setSavedIds((current) => wasSaved
      ? current.filter((item) => item !== stoneId)
      : [...current, stoneId]);
    setShortlistMessage(wasSaved ? `${stoneId} removed from shortlist` : `${stoneId} added to shortlist`);
  };

  const originSelection = (value: string) => toggleDraftValue('origins', value);
  const shapeSelection = (value: string) => toggleDraftValue('shapes', value);
  const colourSelection = (value: string) => toggleDraftValue('colours', value);
  const claritySelection = (value: string) => toggleDraftValue('clarities', value);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredStones.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);
  const safePage = Math.min(currentPage, pageCount);
  const visibleStones = filteredStones.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, sortBy, viewMode]);

  const categorySlug = (category || 'ruby').toLowerCase();
  useEffect(() => {
    // This component contains the verified Ruby inventory only. Do not label Ruby records
    // as another gemstone category when a generic /collections/:category route is used.
    if (categorySlug !== 'ruby') navigate('/collections/ruby', { replace: true });
  }, [categorySlug, navigate]);
  const selectedCategory = 'ruby';

  return (
    <main className="ruby-collection-page">
      <section className="rbc-hero" aria-label="Ruby Collection">
        <SafeImage
          sources={heroCandidates}
          alt="Ruby gemstones arranged on a dark jeweller's surface with tweezers"
          className="rbc-hero__image"
          eager
        />
        <div className="rbc-hero__content">
          <nav className="rbc-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">›</span>
            <Link to="/our-gemstones">Our Gemstones</Link><span aria-hidden="true">›</span>
            <span aria-current="page">Ruby Collection</span>
          </nav>
          <h1>Ruby Collection</h1>
          <p className="rbc-hero__tagline">Passion <span>|</span> Rarity <span>|</span> Timeless Beauty</p>
          <p className="rbc-hero__description">
            Renowned for their vivid colour and exceptional rarity, our rubies are carefully selected from trusted sources, offering unmatched beauty and long-term value.
          </p>
        </div>
      </section>

      <section className={`rbc-catalogue${filtersVisible ? '' : ' rbc-catalogue--wide'}`}>
        <aside className={`rbc-sidebar${filtersVisible ? '' : ' rbc-sidebar--collapsed'}`} aria-label="Refine collection filters">
          <div className="rbc-sidebar__heading">
            <h2>Refine Collection</h2>
            <button type="button" onClick={() => setFiltersVisible((visible) => !visible)} aria-expanded={filtersVisible}>
              {filtersVisible ? 'Hide' : 'Show'}
            </button>
          </div>

          {filtersVisible && <div className="rbc-filters">
            <section className="rbc-filter-group rbc-filter-group--type">
              <label htmlFor="rbc-gemstone-type">Gemstone Type</label>
              <select
                id="rbc-gemstone-type"
                value={selectedCategory}
                onChange={(event) => navigate(`/collections/${event.target.value}`)}
              >
                <option value="ruby">Ruby</option>
                <option value="blue-sapphire">Blue Sapphire</option>
                <option value="emerald">Emerald</option>
                <option value="rare-gemstones">Rare Gemstones</option>
              </select>
            </section>

            <FilterGroup title="Origin" filterKey="origin" expanded={expandedFilters.includes('origin')} onToggle={toggleFilterGroup}>
              {originOptions.map((item) => (
                <FilterCheckbox key={item} label={item} count={originCounts[item]} checked={draftFilters.origins.includes(item)} onChange={() => originSelection(item)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Shape" filterKey="shape" expanded={expandedFilters.includes('shape')} onToggle={toggleFilterGroup}>
              {shapeOptions.map((item) => (
                <FilterCheckbox key={item} label={item} count={shapeCounts[item]} checked={draftFilters.shapes.includes(item)} onChange={() => shapeSelection(item)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Carat Weight" filterKey="carat" expanded={expandedFilters.includes('carat')} onToggle={toggleFilterGroup}>
              <div className="rbc-range-row">
                <input type="number" min="0" step="0.01" placeholder="Min" value={draftFilters.minCarat} onChange={(event) => setDraftFilters((current) => ({ ...current, minCarat: event.target.value }))} aria-label="Minimum carat weight" />
                <span>–</span>
                <input type="number" min="0" step="0.01" placeholder="Max" value={draftFilters.maxCarat} onChange={(event) => setDraftFilters((current) => ({ ...current, maxCarat: event.target.value }))} aria-label="Maximum carat weight" />
              </div>
            </FilterGroup>

            <FilterGroup title="Colour" filterKey="colour" expanded={expandedFilters.includes('colour')} onToggle={toggleFilterGroup}>
              {colourOptions.map((item) => (
                <FilterCheckbox key={item} label={item} checked={draftFilters.colours.includes(item)} onChange={() => colourSelection(item)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Clarity" filterKey="clarity" expanded={expandedFilters.includes('clarity')} onToggle={toggleFilterGroup}>
              {clarityOptions.map((item) => (
                <FilterCheckbox key={item} label={item} checked={draftFilters.clarities.includes(item)} onChange={() => claritySelection(item)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Price Range" filterKey="price" expanded={expandedFilters.includes('price')} onToggle={toggleFilterGroup}>
              <p className="rbc-price-note">Prices are provided upon enquiry. Contact our team for current quotations.</p>
            </FilterGroup>

            <button className="rbc-apply-button" type="button" onClick={applyFilters}>Apply Filters</button>
            <button className="rbc-clear-button" type="button" onClick={clearFilters}>Clear Filters</button>
          </div>}
        </aside>

        <div className="rbc-results">
          <div className="rbc-toolbar">
            <strong>{filteredStones.length} Exceptional Rubies</strong>
            <div className="rbc-toolbar__controls">
              <label className="rbc-sort-control">Sort by
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="carat-asc">Carat: Low to High</option>
                  <option value="carat-desc">Carat: High to Low</option>
                  <option value="origin">Origin</option>
                  <option value="shape">Shape</option>
                </select>
              </label>
              <div className="rbc-view-toggle" role="group" aria-label="Product display mode">
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} title="Grid view"><GridIcon /></button>
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode === 'list'} title="List view"><ListIcon /></button>
              </div>
            </div>
          </div>

          <p className="rbc-live-message" aria-live="polite">{shortlistMessage}</p>

          {visibleStones.length > 0 ? (
            <div className={`rbc-stone-grid${viewMode === 'list' ? ' rbc-stone-grid--list' : ''}`}>
              {visibleStones.map((stone) => {
                const detailPath = `/stones/${stone.id.toLowerCase()}`;
                const isSaved = savedIds.includes(stone.id);
                return (
                  <article className="rbc-stone-card" key={stone.id}>
                    <div className="rbc-stone-card__visual">
                      <Link to={detailPath} className="rbc-stone-card__image-link" aria-label={`View ${stone.id} natural ruby details`}>
                        <SafeImage sources={productImageCandidates(stone.imageNumber)} alt={`Natural ruby ${stone.id}`} className="rbc-stone-card__image" />
                      </Link>
                      <button
                        className={`rbc-heart${isSaved ? ' is-saved' : ''}`}
                        type="button"
                        aria-label={`${isSaved ? 'Remove' : 'Add'} ${stone.id} ${isSaved ? 'from' : 'to'} shortlist`}
                        aria-pressed={isSaved}
                        onClick={() => toggleSaved(stone.id)}
                        title={isSaved ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        <HeartIcon saved={isSaved} />
                      </button>
                    </div>
                    <div className="rbc-stone-card__body">
                      <div className="rbc-stone-card__title"><span>Natural Ruby</span><strong>{stone.carat.toFixed(2)} ct</strong></div>
                      <dl>
                        <div><dt>Origin</dt><dd>{stone.origin}</dd></div>
                        <div><dt>Shape</dt><dd>{stone.shape}</dd></div>
                        <div><dt>Colour</dt><dd>{stone.colour}</dd></div>
                        <div><dt>Clarity</dt><dd>{stone.clarity}</dd></div>
                      </dl>
                      <Link className="rbc-detail-button" to={detailPath}>View Details <span aria-hidden="true">→</span></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rbc-empty-state">
              <p>No rubies match the selected filters.</p>
              <button type="button" onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="rbc-pagination" aria-label="Collection pagination">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1} aria-label="Previous page">‹</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" className={safePage === page ? 'is-current' : ''} aria-current={safePage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={safePage === pageCount} aria-label="Next page">›</button>
            </nav>
          )}
        </div>
      </section>

      <section className="rbc-assurances" aria-label="Ruby collection assurances">
        <article>
          <AssuranceIcon alt="Natural and authentic gemstone" sources={[
            '/assets/04-ruby-collection/icons/heritage-icon-generational-integrity.png',
            '/assets/03-gemstone-categories/icons/heritage-icon-generational-integrity.png',
            '/assets/02-heritage/icons/heritage-icon-generational-integrity.png',
          ]} />
          <div><h2>Natural &amp; Authentic</h2><p>Carefully selected, 100% natural gemstones.</p></div>
        </article>
        <article>
          <AssuranceIcon alt="Certified quality award emblem" sources={[
            '/assets/04-ruby-collection/icons/icon-certified-quality.png',
            '/assets/04-ruby-collection/icons/heritage-icon-certified-quality.png',
          ]} />
          <div><h2>Certified Quality</h2><p>Supported by international gemological certification.</p></div>
        </article>
        <article>
          <AssuranceIcon alt="Global sourcing globe" sources={[
            '/assets/04-ruby-collection/icons/heritage-icon-global-network.png',
            '/assets/03-gemstone-categories/icons/heritage-icon-global-network.png',
            '/assets/02-heritage/icons/heritage-icon-global-network.png',
          ]} />
          <div><h2>Global Sourcing</h2><p>Direct access to trusted sources across Asia.</p></div>
        </article>
        <article>
          <AssuranceIcon alt="Investment value chart" sources={[
            '/assets/04-ruby-collection/icons/Antique Gold Bar Chart Emblem.png',
            '/assets/04-ruby-collection/icons/icon-investment-value-chart.png',
            '/assets/03-gemstone-categories/icons/Antique Gold Bar Chart Emblem.png',
          ]} />
          <div><h2>Investment Value</h2><p>Rare and high-quality gemstones for long-term value.</p></div>
        </article>
        <Link className="rbc-enquire-button" to="/contact">Enquire About Rubies <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
