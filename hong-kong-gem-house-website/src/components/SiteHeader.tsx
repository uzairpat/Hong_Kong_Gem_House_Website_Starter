import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from './BrandMark';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

const navItems = [
  { label: 'Home', id: 'home' },
  { label: 'Our Heritage', id: 'our-heritage' },
  { label: 'Our Gemstones', id: 'our-gemstones' },
  { label: 'Quality & Trust', id: 'quality-trust' },
  { label: 'Global Presence', id: 'global-presence' },
  { label: 'Contact', id: 'contact' },
] as const;

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useCustomerAuth();
  const isGemstoneArea =
    location.pathname.startsWith('/collections') || location.pathname.startsWith('/stones');

  const closeMenu = () => setMenuOpen(false);
  const closeAccountMenu = () => {
    setAccountMenuOpen(false);
    setLogoutError('');
  };

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        closeAccountMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAccountMenu();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection(isGemstoneArea ? 'our-gemstones' : 'home');
      return;
    }

    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);

    if (!('IntersectionObserver' in window) || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (activeEntries[0]) setActiveSection(activeEntries[0].target.id);
      },
      { rootMargin: '-24% 0px -66% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname, isGemstoneArea]);

  const goToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    closeMenu();
    closeAccountMenu();

    const hash = `#${sectionId}`;
    if (location.pathname !== '/' || location.hash !== hash) {
      navigate({ pathname: '/', hash });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      closeAccountMenu();
      closeMenu();
      navigate('/');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  const initials = user?.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a
          href="/#home"
          className="brand"
          aria-label="Hong Kong Gem House Limited homepage"
          onClick={(event) => goToSection(event, 'home')}
        >
          <BrandMark className="brand__mark" />
          <span className="brand__copy">
            <span className="brand__name">Hong Kong Gem House Limited</span>
            <span className="brand__est">Est. 1959</span>
          </span>
        </a>

        <span className="header-divider" aria-hidden="true" />

        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === '/'
              ? activeSection === item.id
              : item.id === 'our-gemstones' && isGemstoneArea;

            return (
              <a
                key={item.id}
                href={`/#${item.id}`}
                className={`main-nav__link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => goToSection(event, item.id)}
              >
                {item.label}
              </a>
            );
          })}

          {user ? (
            <div className="header-account" ref={accountMenuRef}>
              <button
                type="button"
                className="header-account__trigger"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-controls="customer-account-menu"
                onClick={() => {
                  setLogoutError('');
                  setAccountMenuOpen((open) => !open);
                }}
              >
                <span className="header-account__avatar" aria-hidden="true">{initials}</span>
                <span className="header-account__trigger-name">
                  {user.fullName.split(/\s+/)[0] || 'My Account'}
                </span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>

              {accountMenuOpen && (
                <div className="header-account__menu" id="customer-account-menu" role="menu">
                  <div className="header-account__identity">
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/account/profile" role="menuitem" onClick={() => { closeAccountMenu(); closeMenu(); }}>
                    My Profile
                  </Link>
                  <Link to="/account/enquiries" role="menuitem" onClick={() => { closeAccountMenu(); closeMenu(); }}>
                    My Enquiries
                  </Link>
                  <Link to="/account/settings" role="menuitem" onClick={() => { closeAccountMenu(); closeMenu(); }}>
                    Account Settings
                  </Link>
                  {logoutError && <p className="header-account__error" role="alert">{logoutError}</p>}
                  <button type="button" role="menuitem" onClick={handleLogout}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="header-auth-actions">
              <Link to="/login" className="header-auth-actions__login" onClick={closeMenu}>Sign In</Link>
              <Link to="/register" className="header-auth-actions__register" onClick={closeMenu}>Create Account</Link>
            </div>
          )}
        </nav>

        <a
          className="button button--gold header-enquire"
          href="/#contact"
          onClick={(event) => goToSection(event, 'contact')}
        >
          Enquire Now <span aria-hidden="true">→</span>
        </a>
      </div>
    </header>
  );
}
