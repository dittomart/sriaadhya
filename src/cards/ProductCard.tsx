import { Link } from 'react-router-dom';
import { Flame, Plus } from 'lucide-react';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import { defaultCustomizations, computeUnitPrice, getDisplayPrice, lineIdOf, singleGroups } from '@/utils/productPricing';
import type { Product } from '@/types';

/** The catalog card. Its price comes from getDisplayPrice — every item on this
    store is variant-priced, so the item row's own price is 0 and reading it
    directly would render a wall of ₹0. */
export function ProductCard({ product: p }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const push = useToast();

  const { price, oldPrice, discountPercent } = getDisplayPrice(p);
  const variants = singleGroups(p);
  /* More than one option to choose between means the choice is the customer's —
     the card sends them to the PDP instead of picking for them. */
  const needsChoice = variants.some((g) => g.options.length > 1);
  /* A handful of rows carry no price on the item OR its addons — the merchant
     hasn't set one yet. Selling those at ₹0 would be the store's loss, so the
     card shows them without a way to buy. */
  const unpriced = price <= 0;

  const onAdd = () => {
    const chosen = defaultCustomizations(p);
    add({
      lineId: lineIdOf(p.id, chosen),
      productId: p.id,
      name: p.name,
      img: p.img,
      foodType: p.foodType,
      basePrice: p.price,
      unitPrice: computeUnitPrice(p, chosen),
      qty: 1,
      customizations: chosen,
    });
    push('Added to cart', 'ok', 'shopping-bag');
  };

  return (
    <div className="pcard card-glow flex flex-col relative no-tap">
      <div className="pcard-media">
        {p.bestseller && (
          <span className="absolute top-2 left-2 bg-[var(--green-700)] text-white text-micro font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Flame className="w-3 h-3" />
            Bestseller
          </span>
        )}
        {discountPercent != null && discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-[var(--coral)] text-white text-micro font-extrabold px-1.5 py-0.5 rounded-md z-10 shadow">
            {discountPercent}% OFF
          </span>
        )}
        <Link to={`/product/${p.id}`} className="pcard-img aspect-square">
          <SmartImage src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        </Link>
        {unpriced ? null : needsChoice ? (
          <Link to={`/product/${p.id}`} className="pcard-add" title="Choose an option" aria-label={`Choose an option for ${p.name}`}>
            <Plus className="w-5 h-5" />
          </Link>
        ) : (
          <button onClick={onAdd} className="pcard-add" title="Add to cart" aria-label={`Add ${p.name} to cart`}>
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="px-3.5 pt-5 pb-3.5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <FoodMark type={p.foodType} />
          <span className="text-micro text-[var(--ink-soft)] font-semibold uppercase tracking-wide truncate">
            {p.categoryName}
          </span>
        </div>
        {/* The card's main target. `min-h-[34px]` sized it to exactly two lines
            of 13px and no more — a 34px tap area on the one thing that opens the
            product. Padded to clear 44 without changing where the text sits. */}
        <Link
          to={`/product/${p.id}`}
          className="font-bold text-sm2 leading-tight clamp-2 min-h-[44px] py-0.5 hover:text-[var(--green-700)] transition-colors"
        >
          {p.name}
        </Link>
        <div className="flex items-end gap-1.5 mt-auto pt-2.5">
          {unpriced ? (
            <span className="text-xs2 font-bold text-[var(--ink-soft)] leading-none">Price on request</span>
          ) : (
            <>
              <span className="font-extrabold text-[17px] text-[var(--ink)] leading-none tabular-nums">
                {rupee(price)}
              </span>
              {oldPrice != null && (
                <span className="text-micro text-[var(--ink-soft)] line-through tabular-nums">{rupee(oldPrice)}</span>
              )}
            </>
          )}
          {/* The pack size. A grocery shopper cannot compare ₹120 against ₹300
              without it, and it was the smallest thing on the card. */}
          {variants[0]?.options[0] && (
            <span className="text-xs2 font-semibold text-[var(--ink-soft)] ml-auto shrink-0">
              {variants[0].options[0].name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
