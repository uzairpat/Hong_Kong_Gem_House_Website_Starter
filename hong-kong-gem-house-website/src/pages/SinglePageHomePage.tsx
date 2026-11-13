import HomePage from './HomePage';
import OurHeritagePage from './OurHeritagePage';
import GemstonesPage from './GemstonesPage';
import QualityTrustPage from './QualityTrustPage';
import GlobalPresencePage from './GlobalPresencePage';
import ContactPage from './ContactPage';

export default function SinglePageHomePage() {
  return (
    <main className="single-page-home">
      <section id="home" className="single-page-section" aria-label="Home">
        <HomePage embedded />
      </section>

      <section id="our-heritage" className="single-page-section" aria-label="Our Heritage">
        <OurHeritagePage embedded />
      </section>

      <section id="our-gemstones" className="single-page-section" aria-label="Our Gemstones">
        <GemstonesPage embedded />
      </section>

      <section id="quality-trust" className="single-page-section" aria-label="Quality and Trust">
        <QualityTrustPage embedded />
      </section>

      <section id="global-presence" className="single-page-section" aria-label="Global Presence">
        <GlobalPresencePage embedded />
      </section>

      <section id="contact" className="single-page-section" aria-label="Contact">
        <ContactPage embedded />
      </section>
    </main>
  );
}
