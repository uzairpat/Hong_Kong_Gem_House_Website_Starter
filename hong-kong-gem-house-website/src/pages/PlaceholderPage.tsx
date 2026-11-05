import { Link, useLocation } from 'react-router-dom';

const pages: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/our-heritage': {
    eyebrow: 'Our Heritage',
    title: 'A Heritage Built on Trust.',
    description: 'This page is ready for the approved heritage layout and family story.',
  },
  '/our-gemstones': {
    eyebrow: 'Our Gemstones',
    title: 'Exceptional Natural Gemstones.',
    description: 'The ruby, blue sapphire, emerald and rare gemstone categories will be built here next.',
  },
  '/quality-trust': {
    eyebrow: 'Quality & Trust',
    title: 'Quality You Can Trust.',
    description: 'This page will present the company’s selection standards, expertise and verified certification information.',
  },
  '/global-presence': {
    eyebrow: 'Global Presence',
    title: 'Our Global Connections.',
    description: 'This page will introduce the Hong Kong head office, Bangkok branch and Sri Lankan gemstone origins.',
  },
  '/contact': {
    eyebrow: 'Contact',
    title: 'Let’s Talk Gemstones.',
    description: 'This page will include the enquiry form and the company’s confirmed contact information.',
  },
};

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const page = pages[pathname] ?? {
    eyebrow: 'Page not found',
    title: 'This page is not available.',
    description: 'Please return to the homepage.',
  };

  return (
    <main className="placeholder-page">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.title}</h1>
      <p>{page.description}</p>
      <Link to="/" className="button button--gold">Back to Home <span aria-hidden="true">→</span></Link>
      <p className="placeholder-page__note">Design implementation in progress — the homepage and shared header are the first build milestone.</p>
    </main>
  );
}
