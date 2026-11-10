import { Link, Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

const accountSections = [
  { id: 'profile', label: 'My Profile' },
  { id: 'enquiries', label: 'My Enquiries' },
  { id: 'settings', label: 'Account Settings' },
] as const;

export default function CustomerAccountPage() {
  const location = useLocation();
  const { user, loading } = useCustomerAuth();
  const section = location.pathname.split('/').filter(Boolean).at(-1) || 'profile';

  if (loading) {
    return <main className="account-page"><p className="account-page__loading">Loading your account...</p></main>;
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!accountSections.some((item) => item.id === section)) {
    return <Navigate to="/account/profile" replace />;
  }

  const title = accountSections.find((item) => item.id === section)?.label ?? 'My Account';

  return (
    <main className="account-page">
      <div className="account-page__inner">
        <p className="account-page__eyebrow">HONG KONG GEM HOUSE · CUSTOMER AREA</p>
        <h1>{title}</h1>
        <p className="account-page__intro">Welcome back, {user.fullName}. Manage your customer account here.</p>

        <nav className="account-page__tabs" aria-label="Customer account navigation">
          {accountSections.map((item) => (
            <Link
              key={item.id}
              to={`/account/${item.id}`}
              className={section === item.id ? 'is-active' : ''}
              aria-current={section === item.id ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {section === 'profile' && (
          <section className="account-panel">
            <h2>Profile Information</h2>
            <dl className="account-profile">
              <div><dt>Full Name</dt><dd>{user.fullName}</dd></div>
              <div><dt>Email Address</dt><dd>{user.email}</dd></div>
              <div><dt>Account Type</dt><dd>Customer</dd></div>
            </dl>
          </section>
        )}

        {section === 'enquiries' && (
          <section className="account-panel">
            <h2>Your Enquiries</h2>
            <p>Enquiry history is not connected to customer accounts yet. You can still contact our team through the website enquiry section or WhatsApp.</p>
            <Link className="button button--gold" to="/#contact">Make an Enquiry <span aria-hidden="true">→</span></Link>
          </section>
        )}

        {section === 'settings' && (
          <section className="account-panel">
            <h2>Account Security</h2>
            <p>To change a forgotten password, request a secure password reset using your registered email address.</p>
            <Link className="button button--outline" to="/forgot-password">Reset Password <span aria-hidden="true">→</span></Link>
          </section>
        )}
      </div>
    </main>
  );
}
