import { Link } from 'react-router-dom';
import { Flame, Plus, Star, TrendingUp } from 'lucide-react';
import { categories } from '@/api/_seed';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { discountPct, rupee } from '@/utils/fmt';
import type { Product } from '@/types';

/** Port of animations.js `productCard()`. */
export function ProductCard({ product: p }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const push = useToast();
  const cat = categories.find((c) => c.id === p.catId);
  const off = discountPct(p.price, p.mrp);

  const onAdd = () => {
    add(p);
    push('Added to cart', 'ok', 'shopping-bag');
  };

  return (
    <div className="pcard card-glow flex flex-col relative no-tap">
      <div className="pcard-media">
        {p.bestseller ? (
          <span className="absolute top-2 left-2 bg-[var(--green-700)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Flame className="w-3 h-3" />
            Bestseller
          </span>
        ) : p.trending ? (
          <span className="absolute top-2 left-2 bg-[var(--mustard)] text-[#3a2e00] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <TrendingUp className="w-3 h-3" />
            Trending
          </span>
        ) : null}
        {off > 0 && (
          <span className="absolute top-2 right-2 bg-[var(--coral)] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md z-10 shadow">
            {off}% OFF
          </span>
        )}
        <Link to={`/product/${p.id}`} className="pcard-img aspect-square">
          <SmartImage src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
          {!p.inStock && (
            <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-extrabold text-[var(--ink-soft)] z-10">
              Out of stock
            </span>
          )}
        </Link>
        {p.inStock && (
          <button onClick={onAdd} className="pcard-add" title="Add to cart" aria-label={`Add ${p.name} to cart`}>
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="px-3.5 pt-5 pb-3.5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <FoodMark type={p.foodType} />
          <span className="text-[10px] text-[var(--ink-soft)] font-semibold uppercase tracking-wide truncate">
            {cat ? cat.name : ''}
          </span>
        </div>
        <Link
          to={`/product/${p.id}`}
          className="font-bold text-[13px] leading-tight clamp-2 min-h-[34px] hover:text-[var(--green-700)] transition-colors"
        >
          {p.name}
        </Link>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="inline-flex items-center gap-0.5 bg-[var(--leaf-100)] text-[var(--green-800)] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            <Star className="w-2.5 h-2.5 fill-[var(--green-700)] text-[var(--green-700)]" />
            {p.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)]">({p.reviews})</span>
        </div>
        {p.orderedTimes > 100 && (
          <div className="text-[10px] text-[var(--green-700)] font-bold flex items-center gap-1 mt-1">
            <Flame className="w-3 h-3" />
            Ordered {p.orderedTimes}× this week
          </div>
        )}
        <div className="flex items-end gap-1.5 mt-auto pt-2.5">
          <span className="font-extrabold text-[17px] text-[var(--ink)] leading-none">{rupee(p.price)}</span>
          {p.mrp > p.price && <span className="text-[11px] text-[var(--ink-soft)] line-through">{rupee(p.mrp)}</span>}
          <span className="text-[10px] text-[var(--ink-soft)] ml-auto">{p.unit}</span>
        </div>
      </div>
    </div>
  );
}
