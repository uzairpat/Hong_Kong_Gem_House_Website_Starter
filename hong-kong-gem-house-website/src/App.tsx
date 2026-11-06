
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';

import SiteHeader from './components/SiteHeader';
import WhatsAppButton from './components/WhatsAppButton';

import HomePage from './pages/HomePage';
import HeritagePage from './pages/HeritagePage';
import GemstonesPage from './pages/GemstonesPage';
import RubyCollectionPage from './pages/RubyCollectionPage';
import StoneDetailPage from './pages/StoneDetailPage';
import QualityTrustPage from './pages/QualityTrustPage';
import GlobalPresencePage from './pages/GlobalPresencePage';
import ContactPage from './pages/ContactPage';

import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/AuthPages';

const authPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export default function App() {
  const location = useLocation();
  const isAuthPage = authPaths.includes(location.pathname);

  return (
    <div className="site-shell">
      {!isAuthPage && <SiteHeader />}

      <Routes>
        {/* Existing public website */}
        <Route path="/" element={<HomePage />} />
        <Route path="/our-heritage" element={<HeritagePage />} />
        <Route path="/our-gemstones" element={<GemstonesPage />} />
        <Route path="/collections/:category" element={<RubyCollectionPage />} />
        <Route path="/stones/:stoneId" element={<StoneDetailPage />} />
        <Route path="/quality-trust" element={<QualityTrustPage />} />
        <Route path="/global-presence" element={<GlobalPresencePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Customer authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAuthPage && <WhatsAppButton />}
    </div>
  );
}
