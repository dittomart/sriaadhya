import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ClipboardCheck,
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BRAND } from '@/api/_seed';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import type { OrderStatus } from '@/types';

const STEPS: { k: OrderStatus; Icon: LucideIcon; sub: string }[] = [
  { k: 'Placed', Icon: CheckCircle2, sub: 'Order received' },
  { k: 'Accepted', Icon: ClipboardCheck, sub: 'Store confirmed your order' },
  { k: 'Packed', Icon: PackageCheck, sub: 'Items packed & quality-checked' },
  { k: 'Out for Delivery', Icon: Bike, sub: 'On the way to you' },
  { k: 'Delivered', Icon: Home, sub: 'Enjoy your fresh order!' },
];

/* Ports tracking.html. The demo advances a step every 5s.
   TODO[part-2]: drive `cur` from the order's real statusId instead. */
export function TrackingPage() {
  const navigate = useNavigate();
  const push = useToast();
  const activeOrder = useAppStore((s) => s.activeOrder);
  const orders = useAppStore((s) => s.orders);
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus);
  const replaceCart = useCartStore((s) => s.replace);

  const order = activeOrder ?? orders[0] ?? null;
  const [cur, setCur] = useState(0);
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!order || cur >= STEPS.length - 1) return;
    const t = setTimeout(() => setCur((c) => c + 1), 5000);
    return () => clearTimeout(t);
  }, [order, cur]);

  // Stamp each step as it completes.
  useEffect(() => {
    if (!order) return;
    setTimes((prev) => {
      if (prev.length > cur) return prev;
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return [...prev, now];
    });
  }, [cur, order]);

  const delivered = cur >= STEPS.length - 1;

  useEffect(() => {
    if (order && delivered) updateOrderStatus(order.id, 'Delivered');
  }, [order, delivered, updateOrderStatus]);

  const eta = useMemo(() => Math.max(2, 30 - cur * 7), [cur]);

  if (!order) {
    return (
      <main className="pt-16 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
          <div className="card p-10 text-center rise">
            <div className="text-6xl mb-3 float">📦</div>
            <p className="font-extrabold text-lg">No active order</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Place an order to track it live here.</p>
            <Link to="/home" className="btn btn-primary mt-4 px-6 py-3 inline-flex">
              Start shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const reorder = () => {
    replaceCart(
      order.items.map((i) => ({
        key: i.id,
        id: i.id,
        name: i.name,
        price: i.price,
        img: i.img,
        foodType: i.foodType,
        qty: i.qty,
        unit: i.unit,
      })),
    );
    push('Items added to cart', 'ok', 'rotate-ccw');
    setTimeout(() => navigate('/cart'), 600);
  };

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
        {/* ===== HERO ===== */}
        <div className="hero-wave text-white p-6 relative rise">
          <div className="absolute text-6xl opacity-15 leaf-sway" style={{ right: '-4px', bottom: '-10px' }}>
            🌿
          </div>
          <div className="relative flex items-center gap-5">
            <div className="eta-ring flex-none">
              <span className="display text-3xl font-extrabold leading-none">{eta}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/85 mt-0.5">min</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/20 border border-white/25 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" /> <span>{STEPS[cur].k}</span>
              </span>
              <h1 className="display text-2xl font-extrabold mt-2">Your order is on the way</h1>
              <p className="text-sm text-white/85 mt-1 truncate">
                Order {order.id} • {order.items.length} items
              </p>
            </div>
          </div>
        </div>

        {/* ===== LIVE MAP ===== */}
        <div className="card map-card overflow-hidden my-4 relative rise d1">
          <div className="map-grid" />
          <div className="route-base" />
          <div className="route-dash" />
          <div className="scooter">🛵</div>
          {/* store */}
          <div className="absolute left-[4%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="pin-pulse w-9 h-9 rounded-full bg-white flex items-center justify-center shadow">
              <Store className="w-4 h-4 text-[var(--green-700)]" />
            </div>
            <span className="text-[10px] font-bold bg-white/80 px-1.5 rounded">Store</span>
          </div>
          {/* you */}
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="pin-pulse w-9 h-9 rounded-full bg-[var(--green-700)] flex items-center justify-center shadow">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/80 px-1.5 rounded">You</span>
          </div>
          <div className="absolute bottom-3 left-3 text-[11px] font-bold bg-white/85 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Navigation className="w-3 h-3 text-[var(--green-700)]" /> Avinashi → You
          </div>
        </div>

        {/* ===== TIMELINE ===== */}
        <div className="card p-5 relative rise d2">
          <h3 className="display text-base font-extrabold mb-4 flex items-center gap-2">
            <Route className="w-4 h-4 text-[var(--green-700)]" /> Order progress
          </h3>
          <div className="relative pl-1">
            <div className="tl-line" />
            <div className="tl-fill" style={{ height: `${(cur / (STEPS.length - 1)) * 100}%` }} />
            <div className="space-y-5 relative">
              {STEPS.map((s, i) => (
                <div key={s.k} className="flex items-center gap-4">
                  <div className={`tl-node ${i < cur || delivered ? 'done' : i === cur ? 'active' : ''}`}>
                    <s.Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{s.k}</div>
                    <div className="text-[12px] text-[var(--ink-soft)]">{s.sub}</div>
                    {times[i] && <div className="text-[11px] text-[var(--green-700)] font-bold">{times[i]}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== DELIVERY PARTNER ===== */}
        {cur >= 3 && (
          <div className="card partner-card p-4 mt-4 flex items-center gap-3 rise">
            <div className="relative flex-none">
              <img
                src="https://i.pravatar.cc/80?img=12"
                alt="Delivery partner"
                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--leaf-100)]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--green-600)] border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold">Murugan K.</div>
              <div className="text-[12px] text-[var(--ink-soft)] flex items-center gap-1">
                <Star className="w-3 h-3 fill-[var(--mustard)] text-[var(--mustard)]" /> 4.9 • Your delivery partner
              </div>
            </div>
            <a
              href={`tel:${BRAND.phone.replace(/\s/g, '')}`}
              className="ic-btn w-11 h-11 rounded-full bg-[var(--green-700)] flex items-center justify-center shadow"
            >
              <Phone className="w-5 h-5 text-white" />
            </a>
            <a
              href={`https://wa.me/${BRAND.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="ic-btn w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center shadow"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </a>
          </div>
        )}

        {/* ===== REORDER (after delivered) ===== */}
        {delivered && (
          <div className="card p-6 mt-4 text-center bg-[var(--leaf-100)] border-[var(--green-500)]/40 rise">
            <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center mx-auto">
              <PartyPopper className="w-7 h-7 text-[var(--green-700)]" />
            </div>
            <p className="font-extrabold text-lg mt-3">Delivered! Enjoyed it? 🎉</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Reorder your favourites in a single tap.</p>
            <button onClick={reorder} className="btn btn-primary mt-4 px-6 py-3 shine-wrap">
              <RotateCcw className="w-4 h-4" /> Reorder in 1 tap
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
