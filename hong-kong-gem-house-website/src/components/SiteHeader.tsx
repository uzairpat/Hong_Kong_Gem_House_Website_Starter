import { useEffect, useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandMark from './BrandMark';

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
  const location = useLocation();
  const navigate = useNavigate();
  const isGemstoneArea =
    location.pathname.startsWith('/collections') || location.pathname.startsWith('/stones');

  const closeMenu = () => setMenuOpen(false);

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
