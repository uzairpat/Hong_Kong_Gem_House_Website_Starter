import { useLocation } from 'react-router-dom';
import './WhatsAppButton.css';

const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';
const whatsappNumber = rawNumber.replace(/\D/g, '');

async function recordWhatsAppClick(pagePath: string): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  try {
    const csrfResponse = await fetch(apiBase + '/api/auth/csrf', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const csrfResult = await csrfResponse.json().catch(() => ({})) as { csrfToken?: string };
    if (!csrfResponse.ok || !csrfResult.csrfToken) return;

    await fetch(apiBase + '/api/events', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': csrfResult.csrfToken,
      },
      body: JSON.stringify({
        eventName: 'whatsapp_clicked',
        pagePath,
        source: 'floating_button',
        consentState: 'unknown',
      }),
    });
  } catch {
    // Analytics must never block the WhatsApp handoff.
  }
}

function getEnquiryMessage(pathname: string, search: string, hash: string): string {
  const query = new URLSearchParams(search);
  const enquiryReference = query.get('enquiry');

  if (enquiryReference) {
    return `Hello Hong Kong Gem House, I am interested in gemstone reference ${enquiryReference}. Could you please share more details and current availability?`;
  }

  const stoneMatch = pathname.match(/^\/stones\/([^/]+)/i);
  if (stoneMatch) {
    const reference = decodeURIComponent(stoneMatch[1]).toUpperCase();
    return `Hello Hong Kong Gem House, I am interested in gemstone reference ${reference}. Could you please share more details and current availability?`;
  }

  const collectionMatch = pathname.match(/^\/collections\/([^/]+)/i);
  if (collectionMatch) {
    const category = collectionMatch[1].replace(/-/g, ' ');
    return `Hello Hong Kong Gem House, I would like to enquire about your ${category} collection. Could you please share more details?`;
  }

  if (pathname === '/' && hash === '#our-gemstones') {
    return 'Hello Hong Kong Gem House, I would like to know more about your gemstone collections.';
  }

  return 'Hello Hong Kong Gem House, I would like to know more about your gemstones and services.';
}

export default function WhatsAppButton() {
  const location = useLocation();

  if (!/^\d{8,15}$/.test(whatsappNumber)) return null;

  const message = getEnquiryMessage(location.pathname, location.search, location.hash);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      className="whatsapp-float"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Hong Kong Gem House on WhatsApp"
      title="Chat with us on WhatsApp"
      onClick={() => {
        void recordWhatsAppClick(location.pathname + location.hash);
      }}
    >
      <svg viewBox="0 0 32 32" width="27" height="27" fill="currentColor" aria-hidden="true">
        <path d="M16 2.7A13.2 13.2 0 0 0 4.7 22.8l-1.8 6.5 6.7-1.8A13.3 13.3 0 1 0 16 2.7Zm0 24.1c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-4 .9 1.1-3.9-.3-.4A10.8 10.8 0 1 1 16 26.8Z" />
        <path d="M21.9 18.1c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.3-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.9-1.8-2.2-.2-.3 0-.5.2-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.3-.6-.6-.5-.8-.5h-.7c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.2 3.2c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4Z" />
      </svg>
      <span>Chat with us</span>
    </a>
  );
}
