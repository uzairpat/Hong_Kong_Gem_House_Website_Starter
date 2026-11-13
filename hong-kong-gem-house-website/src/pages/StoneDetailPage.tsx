import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

type PublicGemstone = {
  id: string;
  reference_code: string;
  name: string;
  public_title?: string | null;
  category: string;
  weight_carat: number | string | null;
  shape: string | null;
  origin: string | null;
  origin_region?: string | null;
  colour: string | null;
  clarity: string | null;
  treatment: string | null;
  cut?: string | null;
  dimensions_mm?: string | null;
  certification_lab: string | null;
  certification_number: string | null;
  description: string | null;
  public_description?: string | null;
  availability_status: string;
  public_price_mode: string;
  public_price: string | null;
  image_path: string | null;
};

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StoneDetailPage() {
  const { stoneId = '' } = useParams();
  const [stone, setStone] = useState<PublicGemstone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setImageFailed(false);
    fetch(API_BASE_URL + '/api/gemstones/' + encodeURIComponent(stoneId), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { data?: PublicGemstone; error?: string };
        if (!response.ok || !result.data) throw new Error(result.error || 'This gemstone could not be found.');
        setStone(result.data);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : 'Unable to load gemstone details.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [stoneId]);

  if (loading) return <main className="stone-detail-page"><p role="status">Loading gemstone details…</p></main>;
  if (error || !stone) return <main className="stone-detail-page"><div className="gem-category-state gem-category-state--error" role="alert">{error || 'Gemstone not found.'}</div><Link to="/#our-gemstones">Return to gemstone collections</Link></main>;

  const title = stone.public_title || stone.name;
  const categorySlug = stone.category === 'sapphire' ? 'blue-sapphire' : stone.category === 'rare' ? 'rare-gemstones' : stone.category;
  const specs: Array<[string, string | number | null | undefined]> = [
    ['Weight', stone.weight_carat == null ? null : Number(stone.weight_carat).toFixed(2) + ' ct'],
    ['Shape', stone.shape],
    ['Cut', stone.cut],
    ['Dimensions', stone.dimensions_mm],
    ['Colour', stone.colour],
    ['Clarity', stone.clarity],
    ['Origin', stone.origin],
    ['Origin region', stone.origin_region],
    ['Treatment', stone.treatment],
    ['Certification laboratory', stone.certification_lab],
    ['Certificate number', stone.certification_number],
  ];

  return (
    <main className="stone-detail-page">
      <div className="breadcrumbs page-pad stone-detail-breadcrumbs">
        <Link to="/">Home</Link><span>›</span><Link to="/#our-gemstones">Our Gemstones</Link><span>›</span>
        <Link to={'/collections/' + categorySlug}>{label(stone.category)} Collection</Link><span>›</span><span>{stone.reference_code}</span>
      </div>
      <section className="product-main page-pad" aria-label="Gemstone details">
        <div className="product-gallery">
          <div className="product-gallery__main">
            {stone.image_path && !imageFailed ? <img src={stone.image_path} alt={title} onError={() => setImageFailed(true)} /> : <div className="rbc-image-fallback">Gemstone image unavailable</div>}
          </div>
          <p className="product-gallery__note">Gemstone imagery is supplied by Hong Kong Gem House. Contact our team for additional views.</p>
        </div>
        <div className="product-specs">
          <p className="eyebrow eyebrow--line">{label(stone.category)}</p>
          <h1>{title}<span>{stone.reference_code}</span></h1>
          <p className="product-specs__intro">{stone.public_description || stone.description || 'A carefully selected gemstone from the Hong Kong Gem House collection. Contact our team for further details.'}</p>
          <dl className="spec-table">{specs.filter(([,value]) => value !== null && value !== undefined && value !== '').map(([name,value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
        </div>
        <aside className="product-action-card" aria-label="Enquiry and availability">
          <div className="availability"><span>Availability</span><strong><i aria-hidden="true" />{label(stone.availability_status)}</strong></div>
          {stone.public_price && <p className="product-specs__price">{stone.public_price}</p>}
          <Link className="button button--gold product-action-card__enquire" to={{ pathname: '/', search: '?enquiry=' + encodeURIComponent(stone.reference_code), hash: '#contact' }}>Enquire About This Gemstone <span>→</span></Link>
          <p>Our team can provide further information, certification details and current availability on request.</p>
        </aside>
      </section>
    </main>
  );
}
