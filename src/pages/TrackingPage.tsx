import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Home,
  MessageCircle,
  Navigation,
  PackageCheck,
  PartyPopper,
  Phone,
  RotateCcw,
  Route,
  Star,
  Store,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STATUS_LABEL, useGetOrder, useTrackOrder } from '@/api/queries/useOrders';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { lineIdOf } from '@/utils/productPricing';
import { DotLoader } from '@/ui/DotLoader';
import type { OrderStatus } from '@/types';

/** The journey a delivery order actually takes. `statusOf` maps every backend
    id onto one of these; anything off this path (cancelled, payment failed) is
    rendered as its own state rather than a step. */
const STEPS: { k: OrderStatus; Icon: LucideIcon; sub: string }[] = [
  { k: 'placed', Icon: CheckCircle2, sub: 'Order received' },
  { k: 'confirmed', Icon: ClipboardCheck, sub: 'Store confirmed your order' },
  { k: 'preparing', Icon: PackageCheck, sub: 'Items packed & quality-checked' },
  { k: 'out-for-delivery', Icon: Bike, sub: 'On the way to you' },
  { k: 'delivered', Icon: Home, sub: 'Enjoy your fresh order!' },
];

export function TrackingPage() {
  const { uniqueOrderId } = useParams<{ uniqueOrderId: string }>();
  const navigate = useNavigate();
  const push = useToast();
  const user = useAuthStore((s) => s.user);
  const store = useAppStore((s) => s.storeLocation);
  const replaceCart = useCartStore((s) => s.replace);

  const { order, isLoading } = useGetOrder(uniqueOrderId);
  const { data: live } = useTrackOrder(uniqueOrderId);

  if (!user) {
    return (
      <main className="page">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4 text-center py-16">
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">Log in to track your order</h1>
          <Link
            to={`/login?next=${encodeURIComponent(`/tracking/${uniqueOrderId ?? ''}`)}`}
            className="btn btn-primary mt-5 px-6 inline-flex"
          >
            Login / Sign up
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) return <DotLoader />;

  if (!order) {
    return (
      <main className="page">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
          <div className="card p-10 text-center rise">
            <div className="text-6xl mb-3 float">📦</div>
            <p className="font-extrabold text-lg">No order to track</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Place an order to follow it live here.</p>
            <Link to="/home" className="btn btn-primary mt-4 px-6 inline-flex">
              Start shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // the poll is fresher than the list it was rendered from
  const status = live?.status ?? order.status;
  const rider = live?.rider ?? null;
  const trackingUrl = live?.trackingUrl ?? null;

  const stepIndex = STEPS.findIndex((s) => s.k === status);
  const delivered = status === 'delivered';
  const dead = status === 'cancelled' || status === 'payment-failed';
  // an off-path status (cancelled, awaiting payment) has no step to sit on
  const current = stepIndex >= 0 ? stepIndex : delivered ? STEPS.length - 1 : 0;

  const reorder = () => {
    replaceCart(
      order.items.map((i) => ({
        lineId: lineIdOf(i.id, i.customizations),
        productId: i.id,
        name: i.name,
        img: i.img,
        foodType: 'other' as const,
        basePrice: i.basePrice,
        unitPrice: i.unitPrice,
        qty: i.qty,
        customizations: i.customizations,
      })),
    );
    push('Items added to cart', 'ok', 'rotate-ccw');
    setTimeout(() => navigate('/cart'), 600);
  };

  return (
    <main className="page">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
        {/* ===== HERO ===== */}
        <div className="hero-wave text-white p-6 relative rise">
          <div className="absolute text-6xl opacity-15 leaf-sway" style={{ right: '-4px', bottom: '-10px' }}>
            🌿
          </div>
          <div className="relative flex items-center gap-5">
            <div className="eta-ring flex-none">
              {dead ? (
                <XCircle className="w-8 h-8" />
              ) : delivered ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <>
                  <span className="display text-3xl font-extrabold leading-none tabular-nums">{order.etaMin}</span>
                  <span className="text-micro font-bold uppercase tracking-widest text-white/85 mt-0.5">min</span>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-micro font-bold bg-white/20 border border-white/25 px-2.5 py-1 rounded-full">
                {!delivered && !dead && <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />}
                <span>{STATUS_LABEL[status]}</span>
              </span>
              <h1 className="display text-2xl font-extrabold mt-2">
                {dead
                  ? 'This order was not completed'
                  : delivered
                    ? 'Delivered — enjoy!'
                    : 'Your order is on the way'}
              </h1>
              <p className="text-sm text-white/85 mt-1 truncate">
                Order {order.id} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>

        {/* ===== LIVE MAP ===== */}
        {!dead && (
          <div className="card map-card overflow-hidden my-4 relative rise d1">
            <div className="map-grid" />
            <div className="route-base" />
            <div className="route-dash" />
            <div className="scooter">🛵</div>
            <div className="absolute left-[4%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <div className="pin-pulse w-9 h-9 rounded-full bg-white flex items-center justify-center shadow">
                <Store className="w-4 h-4 text-[var(--green-700)]" />
              </div>
              <span className="text-micro font-bold bg-white/80 px-1.5 rounded">Store</span>
            </div>
            <div className="absolute right-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <div className="pin-pulse w-9 h-9 rounded-full bg-[var(--green-700)] flex items-center justify-center shadow">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-micro font-bold bg-white/80 px-1.5 rounded">You</span>
            </div>
            <div className="absolute bottom-3 left-3 text-micro font-bold bg-white/85 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <Navigation className="w-3 h-3 text-[var(--green-700)]" /> {store?.city ?? 'Avinashi'} → You
            </div>
            {/* The courier's own live map, when the store uses one. Reads as a
                small badge but is a real link out to the tracker, so it takes
                the 44px floor — growing upward from its pinned bottom edge,
                which the map has room for. */}
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 min-h-[var(--tap)] text-micro font-bold bg-[var(--green-700)] text-white px-4 rounded-full inline-flex items-center gap-1 shadow"
              >
                Live map <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* ===== TIMELINE ===== */}
        {!dead && (
          <div className="card p-5 relative rise d2">
            <h3 className="display text-base font-extrabold mb-4 flex items-center gap-2">
              <Route className="w-4 h-4 text-[var(--green-700)]" /> Order progress
            </h3>
            <div className="relative pl-1">
              <div className="tl-line" />
              <div className="tl-fill" style={{ height: `${(current / (STEPS.length - 1)) * 100}%` }} />
              <div className="space-y-5 relative">
                {STEPS.map((s, i) => (
                  <div key={s.k} className="flex items-center gap-4">
                    <div className={`tl-node ${i < current || delivered ? 'done' : i === current ? 'active' : ''}`}>
                      <s.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{STATUS_LABEL[s.k]}</div>
                      <div className="text-xs2 text-[var(--ink-soft)]">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== DELIVERY PARTNER ===== */}
        {rider && (
          <div className="card partner-card p-4 mt-4 flex items-center gap-3 rise">
            {rider.photo ? (
              <img
                src={rider.photo}
                alt={rider.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--leaf-100)] flex-none"
              />
            ) : (
              <div className="w-12 h-12 rounded-full brand-grad flex items-center justify-center text-white font-extrabold flex-none">
                {rider.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-extrabold truncate">{rider.name}</div>
              <div className="text-xs2 text-[var(--ink-soft)] flex items-center gap-1">
                {rider.rating > 0 && (
                  <>
                    <Star className="w-3 h-3 fill-[var(--mustard)] text-[var(--mustard)] flex-none" />{' '}
                    <span className="tabular-nums">{rider.rating.toFixed(1)}</span> •{' '}
                  </>
                )}
                Your delivery partner
              </div>
            </div>
            {rider.phone && (
              <>
                <a
                  href={`tel:${rider.phone}`}
                  className="ic-btn w-11 h-11 rounded-full bg-[var(--green-700)] flex items-center justify-center shadow flex-none"
                >
                  <Phone className="w-5 h-5 text-white" />
                </a>
                <a
                  href={`https://wa.me/${rider.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ic-btn w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center shadow flex-none"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </a>
              </>
            )}
          </div>
        )}

        {(delivered || dead) && (
          <div
            className={`card p-6 mt-4 text-center rise ${
              dead ? 'bg-red-50 border-[var(--coral)]/30' : 'bg-[var(--leaf-100)] border-[var(--green-500)]/40'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center mx-auto">
              {dead ? (
                <XCircle className="w-7 h-7 text-[var(--coral)]" />
              ) : (
                <PartyPopper className="w-7 h-7 text-[var(--green-700)]" />
              )}
            </div>
            <p className="font-extrabold text-lg mt-3">{dead ? STATUS_LABEL[status] : 'Delivered! Enjoyed it? 🎉'}</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {dead ? 'Order it again whenever you like.' : 'Reorder your favourites in a single tap.'}
            </p>
            <button onClick={reorder} className="btn btn-primary mt-4 px-6 shine-wrap">
              <RotateCcw className="w-4 h-4" /> Reorder in 1 tap
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
