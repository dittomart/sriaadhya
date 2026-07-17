import { MessageCircle } from 'lucide-react';
import { BRAND } from '@/api/_seed';

/** Port of app.js `renderWhatsApp()`. */
export function WhatsApp() {
  const href = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
    'Hi SRIAADHYA, I have a question about my order',
  )}`;
  return (
    <a className="wa-fab no-tap" target="_blank" rel="noreferrer" href={href} title="Chat on WhatsApp">
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}
