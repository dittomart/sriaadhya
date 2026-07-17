import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Heart,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  RotateCcw,
  Star,
  Wallet,
} from 'lucide-react';
import { BRAND } from '@/api/_seed';
import { StoreHoursModal } from '@/shared/StoreHoursModal';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import type { Order } from '@/types';

/* Ports profile.html. */
export function ProfilePage() {
  const navigate = useNavigate();
  const push = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const orders = useAppStore((s) => s.orders);
  const favs = useAppStore((s) => s.favOrders);
  const foodFilter = useAppStore((s) => s.foodFilter);
  const setFoodFilter = useAppStore((s) => s.setFoodFilter);
  const replaceCart = useCartStore((s) => s.replace);
  const [hoursOpen, setHoursOpen] = useState(false);

  const loggedIn = !!user?.loggedIn;
  const vegOnly = foodFilter === 'veg';

  const toggleVeg = () => {
    const next = !vegOnly;
    setFoodFilter(next ? 'veg' : 'all');
    push(next ? 'Showing Veg only 🟢' : 'Showing all items', 'ok', 'leaf');
  };

  const reorderFav = (o: Order) => {
    replaceCart(
      o.items.map((it) => ({
        key: it.id,
        id: it.id,
        name: it.name,
        price: it.price,
        img: it.img,
        foodType: it.foodType,
        qty: it.qty,
        unit: it.unit,
      })),
    );
    push('Cart filled', 'ok', 'rotate-ccw');
    setTimeout(() => navigate('/cart'), 600);
  };

  const authAction = () => {
    if (loggedIn) {
      logout();
      push('Logged out', '', 'log-out');
      setTimeout(() => navigate('/login?next=/profile'), 600);
    } else {
      navigate('/login?next=/profile');
    }
  };

  return (
    <>
      <main className="pt-16 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
          {/* ===== HERO ===== */}
          <div className="hero-wave text-white p-6 relative rise">
            <div className="absolute text-7xl opacity-15 leaf-sway" style={{ right: '-6px', top: '-10px' }}>
              🌿
            </div>
            <div className="absolute text-5xl opacity-10 float-slow" style={{ right: '34%', bottom: '-8px' }}>
              🍃
            </div>
            <div className="relative flex items-center gap-4">
              <div className="pf-avatar w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-extrabold display border border-white/30">
                {(user?.name || 'G')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold display truncate">{user?.name || 'Guest User'}</div>
                <div className="text-sm text-white/85 truncate">{user?.phone || 'Not logged in'}</div>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold bg-white/20 border border-white/25 px-2.5 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" /> SRIAADHYA Member
                </span>
              </div>
            </div>
          </div>

          {/* ===== STATS (overlap) ===== */}
          <div className="grid grid-cols-3 gap-3 -mt-6 relative z-10">
            <div className="card stat-card p-3.5 text-center rise d1">
              <Wallet className="ic w-6 h-6 text-[var(--green-700)] mx-auto" />
              <div className="font-extrabold text-lg mt-1">₹250</div>
              <div className="text-[11px] text-[var(--ink-soft)]">Wallet</div>
            </div>
            <div className="card stat-card p-3.5 text-center rise d2">
              <Package className="ic w-6 h-6 text-[var(--green-700)] mx-auto" />
              <div className="font-extrabold text-lg mt-1">{orders.length}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">Orders</div>
            </div>
            <div className="card stat-card p-3.5 text-center rise d3">
              <Heart className="ic w-6 h-6 text-[var(--coral)] mx-auto" />
              <div className="font-extrabold text-lg mt-1">{favs.length}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">Saved</div>
            </div>
          </div>

          {/* veg preference */}
          <div className="card p-4 mt-5 flex items-center gap-3 rise d1">
            <div className="w-10 h-10 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
              <Leaf className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">Show Veg only by default</div>
              <div className="text-[11px] text-[var(--ink-soft)]">Auto-filters category pages</div>
            </div>
            <button
              onClick={toggleVeg}
              className={`w-12 h-7 rounded-full relative transition flex-none ${
                vegOnly ? 'bg-[var(--green-600)]' : 'bg-[var(--line)]'
              }`}
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: vegOnly ? '1.5rem' : '0.25rem' }}
              />
            </button>
          </div>

          {/* favorite orders */}
          <h3 className="display text-lg font-extrabold mt-6 mb-2 flex items-center gap-2 head-accent">
            <Star className="w-5 h-5 text-[var(--mustard)]" /> Favorite Orders
          </h3>
          <div className="space-y-3">
            {favs.length === 0 ? (
              <div className="card p-5 text-center text-sm text-[var(--ink-soft)]">
                No favorite orders yet. Save one from order confirmation for instant reorder.
              </div>
            ) : (
              favs.map((o, i) => (
                <div key={o.id + i} className="card p-4 flex items-center gap-3 rise">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((it) => (
                      <img
                        key={it.id}
                        src={it.img}
                        alt={it.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white"
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {o.items.length} items • {rupee(o.bill.total)}
                    </div>
                    <div className="text-[11px] text-[var(--ink-soft)]">
                      {o.items
                        .map((it) => it.name.split('(')[0])
                        .slice(0, 2)
                        .join(', ')}
                      …
                    </div>
                  </div>
                  <button onClick={() => reorderFav(o)} className="btn btn-primary px-3 py-2 text-sm">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* menu */}
          <div className="card mt-5 overflow-hidden divide-y divide-[var(--line)] rise d2">
            <Link to="/my-orders" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Package className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">My Orders</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <Link to="/address" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <MapPin className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Saved Addresses</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <Link to="/location" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Navigation className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Change Location</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <button onClick={() => setHoursOpen(true)} className="menu-row w-full flex items-center gap-3 p-4 text-left">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Clock className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Store Hours</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </button>
            <a
              href={`https://wa.me/${BRAND.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="menu-row flex items-center gap-3 p-4"
            >
              <span className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center flex-none">
                <MessageCircle className="w-5 h-5 text-[#16A34A]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Help &amp; Support</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </a>
          </div>

          <button onClick={authAction} className="btn btn-ghost w-full mt-5 py-3.5">
            {loggedIn ? (
              <>
                <LogOut className="w-4 h-4" /> Logout
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Login / Sign up
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[var(--ink-soft)] mt-4">
            SRI AADHYA FROZENS • Freshness Frozen, Goodness Preserved
          </p>
        </div>
      </main>
      {hoursOpen && <StoreHoursModal onClose={() => setHoursOpen(false)} />}
    </>
  );
}
