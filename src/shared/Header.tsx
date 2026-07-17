import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Search, ShoppingCart, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, selectCartCount } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';

type NavKey = 'home' | 'cat' | 'cart' | 'orders' | 'profile' | '';

/** `showCheckoutMode` drops the search box — the checkout pages have nothing to
    search and the room is better spent on the address. */
export function Header({ active = '', showCheckoutMode = false }: { active?: NavKey; showCheckoutMode?: boolean }) {
  const navigate = useNavigate();
  const brand = useAppStore((s) => s.brand);
  const user = useAuthStore((s) => s.user);
  const count = useCartStore(selectCartCount);
  const bump = useCartStore((s) => s.bump);
  const location = useLocationStore((s) => s.location);
  const [q, setQ] = useState('');
  const cartRef = useRef<HTMLAnchorElement>(null);

  // Restart the pop animation on every add.
  useEffect(() => {
    const el = cartRef.current;
    if (!el || bump === 0) return;
    el.classList.remove('anim-pop');
    void el.offsetWidth;
    el.classList.add('anim-pop');
  }, [bump]);

  const area = location?.area || 'Avinashi';

  const submitSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && q.trim()) navigate('/category?q=' + encodeURIComponent(q.trim()));
  };

  return (
    <header className="site-header glass" style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
        <div className="flex items-center gap-1.5 lg:gap-3 h-16">
          <Link
            to="/home"
            className="flex items-center flex-none no-tap h-11 py-1.5"
            title={brand?.name ?? 'SRI AADHYA'}
          >
            <img
              src={brand?.logo || '/images/logo.png'}
              alt={brand?.name ?? 'SRI AADHYA FROZENS'}
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* The address, not the logo, is what a grocery customer checks first —
              wrong area means every price and ETA on the page is a lie. It used
              to collapse to a bare 16px pin on any phone under 420px, label and
              area name simply `display:none`. It now always renders its text and
              takes the room it needs. */}
          <Link
            to="/location"
            className="flex items-center gap-1 text-left no-tap min-w-0 flex-1 md:flex-none md:max-w-[180px] h-11 px-1 rounded-xl active:bg-[var(--cream-2)] transition-colors"
            aria-label={`Delivering to ${area}. Change location`}
          >
            <MapPin className="w-4 h-4 text-[var(--green-700)] shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-micro text-[var(--ink-soft)] leading-none">Deliver to</span>
              <span className="font-bold text-[var(--ink)] text-sm2 leading-tight flex items-center gap-0.5">
                <span className="truncate">{area}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </span>
            </span>
          </Link>

          {!showCheckoutMode && (
            <div className="flex-1 hidden md:flex items-center bg-white border border-[var(--line)] rounded-xl px-3 h-10 mx-2 min-w-0">
              <Search className="w-4 h-4 text-[var(--ink-soft)] shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={submitSearch}
                placeholder="Search mushrooms, paneer, samosa…"
                className="flex-1 h-full bg-transparent outline-none text-md2 px-2 min-w-0"
              />
            </div>
          )}

          <nav className="topnav hidden lg:flex items-center gap-5 text-sm font-semibold text-[var(--ink-soft)] ml-2">
            <Link to="/home" className={active === 'home' ? 'text-[var(--green-700)]' : ''}>
              Home
            </Link>
            <Link to="/category" className={active === 'cat' ? 'text-[var(--green-700)]' : ''}>
              Categories
            </Link>
            <Link to="/my-orders" className={active === 'orders' ? 'text-[var(--green-700)]' : ''}>
              Track Order
            </Link>
          </nav>

          {/* Below md the search box above is gone, so this is the only way to
              search — previously there was none at all on a phone, in an app
              whose whole job is finding an item. */}
          {!showCheckoutMode && (
            <Link
              to="/category"
              className="md:hidden icon-btn bg-[var(--cream-2)] ml-auto"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 text-[var(--green-800)]" />
            </Link>
          )}

          <Link
            to={user ? '/profile' : '/login'}
            className={`icon-btn bg-[var(--cream-2)] ${showCheckoutMode ? 'ml-auto' : 'md:ml-auto'}`}
            aria-label={user ? 'Your profile' : 'Log in'}
          >
            <User className="w-5 h-5 text-[var(--green-800)]" />
          </Link>
          <Link
            ref={cartRef}
            to="/cart"
            className="relative icon-btn bg-[var(--green-700)]"
            aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart, empty'}
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {count > 0 && (
              /* Was -top-1.5 -right-1.5 on a 40px box: the badge hung outside the
                 button and clipped against the header edge. Tucked inside now. */
              <span className="absolute top-0.5 right-0.5 bg-[var(--mustard)] text-[#3a2e00] text-micro font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center tabular-nums">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
