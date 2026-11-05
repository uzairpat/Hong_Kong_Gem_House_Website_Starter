import { Route, Routes, Navigate } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import HomePage from './pages/HomePage';
import HeritagePage from './pages/HeritagePage';
import GemstonesPage from './pages/GemstonesPage';
import RubyCollectionPage from './pages/RubyCollectionPage';
import StoneDetailPage from './pages/StoneDetailPage';
import QualityTrustPage from './pages/QualityTrustPage';
import GlobalPresencePage from './pages/GlobalPresencePage';
import ContactPage from './pages/ContactPage';

export default function App() {
  return <div className="site-shell">
    <SiteHeader />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/our-heritage" element={<HeritagePage />} />
      <Route path="/our-gemstones" element={<GemstonesPage />} />
      <Route path="/collections/:category" element={<RubyCollectionPage />} />
      <Route path="/stones/:stoneId" element={<StoneDetailPage />} />
      <Route path="/quality-trust" element={<QualityTrustPage />} />
      <Route path="/global-presence" element={<GlobalPresencePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>;
}
