import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import SinglePageHomePage from './pages/SinglePageHomePage';
import RubyCollectionPage from './pages/RubyCollectionPage';
import StoneDetailPage from './pages/StoneDetailPage';

function HashScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== '/' || !hash) return;

    const sectionId = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

function ContactSectionRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={{ pathname: '/', search: location.search, hash: '#contact' }}
      replace
    />
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <HashScrollManager />
      <Routes>
        <Route path="/" element={<SinglePageHomePage />} />

        {/* Old section URLs now lead to their matching position on the home page. */}
        <Route path="/our-heritage" element={<Navigate to="/#our-heritage" replace />} />
        <Route path="/our-gemstones" element={<Navigate to="/#our-gemstones" replace />} />
        <Route path="/quality-trust" element={<Navigate to="/#quality-trust" replace />} />
        <Route path="/global-presence" element={<Navigate to="/#global-presence" replace />} />
        <Route path="/contact" element={<ContactSectionRedirect />} />

        {/* Collection and individual gemstone pages remain separate destinations. */}
        <Route path="/collections/:category" element={<RubyCollectionPage />} />
        <Route path="/stones/:stoneId" element={<StoneDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
