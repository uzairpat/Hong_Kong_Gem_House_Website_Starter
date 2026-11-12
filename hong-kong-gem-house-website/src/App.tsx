import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import WhatsAppButton from './components/WhatsAppButton';
import SinglePageHomePage from './pages/SinglePageHomePage';
import GemstoneCollectionRoute from './pages/GemstoneCollectionRoute';
import StoneDetailPage from './pages/StoneDetailPage';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/AuthPages';
import CustomerAccountPage from './pages/CustomerAccountPage';
import { AdminLoginPage, AdminPortal } from './admin/AdminPortal';

const authPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

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
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = authPaths.includes(location.pathname) || isAdminPage;

  return (
    <div className="site-shell">
      {!isAdminPage && !isAuthPage && <SiteHeader />}
      <HashScrollManager />

      <Routes>
        <Route path="/" element={<SinglePageHomePage />} />

        {/* Legacy public section URLs now scroll to the matching homepage section. */}
        <Route path="/our-heritage" element={<Navigate to="/#our-heritage" replace />} />
        <Route path="/our-gemstones" element={<Navigate to="/#our-gemstones" replace />} />
        <Route path="/quality-trust" element={<Navigate to="/#quality-trust" replace />} />
        <Route path="/global-presence" element={<Navigate to="/#global-presence" replace />} />
        <Route path="/contact" element={<ContactSectionRedirect />} />

        {/* Gemstone collections and individual stone details remain separate pages. */}
        <Route path="/collections/:category" element={<GemstoneCollectionRoute />} />
        <Route path="/stones/:stoneId" element={<StoneDetailPage />} />

        {/* Owner administration is a separate protected workspace. */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/forgot-password" element={<AdminLoginPage />} />
        <Route path="/admin/reset-password" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<AdminPortal />} />

        {/* Customer authentication. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Customer account areas. */}
        <Route path="/account" element={<Navigate to="/account/profile" replace />} />
        <Route path="/account/:section" element={<CustomerAccountPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAuthPage && !isAdminPage && <WhatsAppButton />}
    </div>
  );
}
