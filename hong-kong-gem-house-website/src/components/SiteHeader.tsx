import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';

const navItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'Our Heritage', to: '/our-heritage' },
  { label: 'Our Gemstones', to: '/our-gemstones' },
  { label: 'Quality & Trust', to: '/quality-trust' },
  { label: 'Global Presence', to: '/global-presence' },
  { label: 'Contact', to: '/contact' },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isGemstoneArea = location.pathname.startsWith('/collections') || location.pathname.startsWith('/stones');
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand" aria-label="Hong Kong Gem House Limited homepage" onClick={closeMenu}>
          <BrandMark className="brand__mark" />
          <span className="brand__copy">
            <span className="brand__name">Hong Kong Gem House Limited</span>
            <span className="brand__est">Est. 1959</span>
          </span>
        </Link>
        <span className="header-divider" aria-hidden="true" />
        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        ><span /><span /><span /></button>
        <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => {
            const forceGemActive = item.to === '/our-gemstones' && isGemstoneArea;
            return <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false}
              className={({ isActive }) => `main-nav__link${(isActive || forceGemActive) ? ' is-active' : ''}`}
              onClick={closeMenu}>{item.label}</NavLink>;
          })}
        </nav>
        <Link className="button button--gold header-enquire" to="/contact" onClick={closeMenu}>Enquire Now <span aria-hidden="true">→</span></Link>
      </div>
    </header>
  );
}
