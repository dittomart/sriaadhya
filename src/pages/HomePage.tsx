import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Flame,
  Mic,
  PhoneCall,
  Quote,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { BRAND, categories, products, testimonials } from '@/api/_seed';
import { BrandBanner } from '@/sections/home/BrandBanner';
import { BrandStrip } from '@/sections/home/BrandStrip';
import { CategoryTile } from '@/cards/CategoryTile';
import { ProductCard } from '@/cards/ProductCard';
import { Stars } from '@/shared/Stars';
import { useAppStore } from '@/store/appStore';
import { useReveal } from '@/hooks/useReveal';

/* Ports home.html. */
export function HomePage() {
  const navigate = useNavigate();
  const orders = useAppStore((s) => s.orders);
  const [q, setQ] = useState('');

  // TODO[part-2]: replace stub data with real bestsellers endpoint
  const best = useMemo(() => products.filter((p) => p.bestseller || p.trending).slice(0, 10), []);

  /* Buy again — distinct products drawn from past orders. */
  const buyAgain = useMemo(() => {
    const seen = new Set<string>();
    const items = [];
    for (const it of orders.flatMap((o) => o.items)) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      const p = products.find((x) => x.id === it.id);
      if (p) items.push(p);
    }
    return items.slice(0, 8);
  }, [orders]);

  useReveal();

  const submitSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && q.trim()) navigate('/category?q=' + encodeURIComponent(q.trim()));
  };

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      {/* offer ticker */}
      <div className="aurora text-white text-xs font-bold py-2 ticker">
        <div className="ticker-track">
          <span className="px-6">⚡ 30-min delivery across Avinashi</span>
          <span className="px-6">🌱 100% Quality Assured</span>
          <span className="px-6">🎉 Use BLOSSOM for 15% off above ₹500</span>
          <span className="px-6">🚚 Delivery charge as per KM</span>
          <span className="px-6">⚡ 30-min delivery across Avinashi</span>
          <span className="px-6">🌱 100% Quality Assured</span>
          <span className="px-6">🎉 Use BLOSSOM for 15% off above ₹500</span>
          <span className="px-6">🚚 Delivery charge as per KM</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* mobile search */}
        <div className="md:hidden flex items-center bg-white border border-[var(--line)] rounded-2xl px-3 h-12 mt-4 shadow-sm">
          <Search className="w-4 h-4 text-[var(--green-700)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={submitSearch}
            placeholder="Search mushroom, paneer, samosa…"
            className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
          />
          <Mic className="w-4 h-4 text-[var(--ink-soft)]" />
        </div>

        <BrandBanner />

        {/* WHY US feature strip */}
        <section className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow">
              <Timer className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">30-min</div>
              <div className="text-[11px] text-[var(--ink-soft)]">lightning delivery</div>
            </div>
          </div>
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div
              className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow"
              style={{ animationDelay: '.3s' }}
            >
              <ShieldCheck className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">Secure</div>
              <div className="text-[11px] text-[var(--ink-soft)]">UPI / card payments</div>
            </div>
          </div>
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div
              className="w-11 h-11 rounded-xl bg-[#FFF6DC] flex items-center justify-center float-slow"
              style={{ animationDelay: '.6s' }}
            >
              <Star className="w-5 h-5 text-[var(--mustard)] fill-[var(--mustard)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">4.8 rating</div>
              <div className="text-[11px] text-[var(--ink-soft)]">1,240+ reviews</div>
            </div>
          </div>
          <a href="tel:+917092229777" className="card card-grad p-3.5 flex items-center gap-3 io">
            <div
              className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow"
              style={{ animationDelay: '.9s' }}
            >
              <PhoneCall className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">Call us</div>
              <div className="text-[11px] text-[var(--ink-soft)]">70922 29777</div>
            </div>
          </a>
        </section>

        {/* BUY AGAIN */}
        {buyAgain.length > 0 && (
          <section className="mt-9">
            <div className="flex items-center justify-between mb-4">
              <h2 className="display text-xl lg:text-2xl font-extrabold head-accent flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[var(--green-700)]" /> Buy Again
              </h2>
              <Link to="/my-orders" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1">
                View orders <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scroll pb-2 -mx-1 px-1">
              {buyAgain.map((p) => (
                <div key={p.id} className="w-40 flex-none">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        <section className="mt-9">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-xl lg:text-2xl font-extrabold head-accent">Shop by Category</h2>
            <Link to="/category" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((c) => (
              <CategoryTile key={c.id} category={c} />
            ))}
          </div>
        </section>

        {/* TWIN PROMO */}
        <section className="mt-9 grid md:grid-cols-2 gap-4">
          <Link
            to="/category?cat=samosas"
            className="io card-tilt shine-wrap rounded-3xl overflow-hidden relative p-6 lg:p-8 text-white block"
            style={{ background: 'linear-gradient(125deg,#0B4D2C,#15803D)' }}
          >
            <div className="absolute right-2 -bottom-3 text-[90px] opacity-15 leaf-sway">🥟</div>
            <span className="demo-badge text-[10px] font-extrabold px-2 py-0.5 rounded-full">FRESH DEAL</span>
            <h3 className="display text-xl lg:text-2xl font-extrabold mt-2 relative">Frozen snacks party pack</h3>
            <p className="text-white/85 text-sm mt-1 relative max-w-xs">
              Samosa, rolls, lollipop &amp; more — ready in minutes.
            </p>
            <span className="inline-flex items-center gap-1 font-extrabold text-sm mt-4 relative">
              Explore snacks <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            to="/category?cat=mock-meat"
            className="io card-tilt shine-wrap rounded-3xl overflow-hidden relative p-6 lg:p-8 text-white block"
            style={{ background: 'linear-gradient(125deg,#0B6E3B,#0EA5A4)' }}
          >
            <div className="absolute right-2 -bottom-3 text-[90px] opacity-15 float-slow">🌱</div>
            <span className="bg-white/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full">NEW</span>
            <h3 className="display text-xl lg:text-2xl font-extrabold mt-2 relative">Plant-based mock meat</h3>
            <p className="text-white/85 text-sm mt-1 relative max-w-xs">100% veg protein with real taste &amp; texture.</p>
            <span className="inline-flex items-center gap-1 font-extrabold text-sm mt-4 relative">
              Try mock meat <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>

        {/* BESTSELLERS */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-xl lg:text-2xl font-extrabold head-accent flex items-center gap-2">
              <Flame className="w-5 h-5 text-[var(--coral)]" /> Bestsellers
            </h2>
            <Link to="/category" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {best.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mt-11">
          <h2 className="display text-xl lg:text-2xl font-extrabold head-accent">Loved by Tirupur families</h2>
          <p className="text-sm text-[var(--ink-soft)] mb-4 mt-3 flex items-center gap-1">
            ⭐ <span>{`${BRAND.rating} average • ${BRAND.reviewCount.toLocaleString('en-IN')}+ reviews`}</span>
          </p>
          <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 -mx-1 px-1 snap-x">
            {testimonials.map((t) => (
              <div key={t.name} className="card card-grad p-5 w-72 flex-none snap-start io">
                <Quote className="w-7 h-7 text-[var(--leaf-400)]" />
                <p className="text-sm leading-relaxed mt-2">“{t.text}”</p>
                <div className="flex gap-0.5 mt-3">
                  <Stars n={t.stars} />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--line)]">
                  <div className="w-9 h-9 rounded-full brand-grad flex items-center justify-center text-white font-extrabold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-none">{t.name}</div>
                    <div className="text-[11px] text-[var(--ink-soft)]">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <BrandStrip />
      </div>
    </main>
  );
}
