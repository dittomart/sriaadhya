import { Link, useNavigate } from 'react-router-dom';
import { Bell, MapPinOff, MessageCircle, Navigation, Store } from 'lucide-react';
import { BRAND } from '@/api/_seed';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';

/* Ports not-serviceable.html. */
export function NotServiceablePage() {
  const navigate = useNavigate();
  const push = useToast();
  const location = useLocationStore((s) => s.location);

  const msg = location?.distance_from_store_km
    ? `Your location is ${location.distance_from_store_km} km from our Avinashi store — beyond our ${BRAND.radiusKm} km zone. We're growing fast! You can keep browsing, or try an address closer to Avinashi/Tirupur.`
    : "Your location is outside our 10 km delivery zone from Avinashi. We're growing fast — try a different address nearby.";

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

        <div className="card p-4 mt-6 text-left">
          <div className="flex items-center gap-2 text-sm font-bold mb-1">
            <Bell className="w-4 h-4 text-[var(--mustard)]" /> Notify me when you arrive
          </div>
          <div className="flex gap-2 mt-2">
            <input className="field" placeholder="WhatsApp number" />
            <button onClick={() => push("We'll notify you soon!", 'ok', 'bell')} className="btn btn-primary px-4">
              Notify
            </button>
          </div>
        </div>

        <button onClick={() => navigate('/location')} className="btn btn-primary w-full mt-5 py-3">
          <Navigation className="w-4 h-4" /> Change Location
        </button>
        <Link to="/home" className="btn btn-ghost w-full mt-3 py-3">
          <Store className="w-4 h-4" /> Keep browsing
        </Link>
        <a
          href={`https://wa.me/${BRAND.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost w-full mt-3 py-3"
        >
          <MessageCircle className="w-4 h-4" /> Chat with us on WhatsApp
        </a>
      </div>
    </div>
  );
}
