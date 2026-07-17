import { MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

/** The floating chat button. Hidden entirely when neither the brand nor the
    store published a number — a dead wa.me link is worse than no button. */
export function WhatsApp() {
  const brand = useAppStore((s) => s.brand);
  const store = useAppStore((s) => s.storeLocation);

  const raw = brand?.whatsapp || store?.whatsapp || store?.phone || '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${brand?.name ?? 'SRIAADHYA'}, I have a question about my order`,
  )}`;

  return (
    <a className="wa-fab no-tap" target="_blank" rel="noreferrer" href={href} title="Chat on WhatsApp">
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}
