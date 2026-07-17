import { Link, useNavigate } from 'react-router-dom';
import { MapPinOff, MessageCircle, Navigation, Store } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useLocationStore } from '@/store/locationStore';

export function NotServiceablePage() {
  const navigate = useNavigate();
  const brand = useAppStore((s) => s.brand);
  const store = useAppStore((s) => s.storeLocation);
  const location = useLocationStore((s) => s.location);

  const radius = store?.deliveryRadius ?? 0;
  const city = store?.city ?? 'Avinashi';
  const whatsapp = (brand?.whatsapp || store?.whatsapp || store?.phone || '').replace(/\D/g, '');

  const msg = location?.distanceKm
    ? `Your location is ${location.distanceKm} km from our ${city} store — beyond our ${radius} km zone. We're growing fast! You can keep browsing, or try an address closer to ${city}.`
    : `Your location is outside our ${radius || 10} km delivery zone from ${city}. We're growing fast — try a different address nearby.`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream)]">
      <div className="max-w-md w-full text-center" style={{ animation: 'fadeUp .5s ease' }}>
        <div className="w-24 h-24 rounded-full bg-[var(--leaf-100)] flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full pulse-ring" />
          <MapPinOff className="w-11 h-11 text-[var(--green-700)]" />
        </div>
        <h1 className="display text-2xl font-extrabold">
          We're not in your area
          <br />
          just yet 🌱
        </h1>
        <p className="text-[var(--ink-soft)] text-sm mt-3">{msg}</p>

        <button onClick={() => navigate('/location')} className="btn btn-primary w-full mt-6 py-3">
          <Navigation className="w-4 h-4" /> Change Location
        </button>
        <Link to="/home" className="btn btn-ghost w-full mt-3 py-3">
          <Store className="w-4 h-4" /> Keep browsing
        </Link>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost w-full mt-3 py-3"
          >
            <MessageCircle className="w-4 h-4" /> Chat with us on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
