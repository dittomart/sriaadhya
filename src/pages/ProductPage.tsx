import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, Flame, Layers, Snowflake, TrendingUp, Truck, Leaf } from 'lucide-react';
import { categories, products } from '@/api/_seed';
import { ProductCard } from '@/cards/ProductCard';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { Stars } from '@/shared/Stars';
import { useCartStore } from '@/store/cartStore';
import { deliveringArea } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { discountPct, rupee } from '@/utils/fmt';

/* Ports product.html. */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const add = useCartStore((s) => s.add);
  const push = useToast();

  // TODO[part-2]: replace stub data with real GET /items/:id call
  const p = useMemo(() => products.find((x) => x.id === id) || products[0], [id]);
  const cat = categories.find((c) => c.id === p.catId);

  const [qty, setQty] = useState(1);
  const [variantIdx, setVariantIdx] = useState(0);
  const [mainImg, setMainImg] = useState(0);

  const variant = p.variants ? p.variants[variantIdx].label : null;
  const unitPrice = p.variants ? p.variants[variantIdx].price : p.price;
  const off = discountPct(unitPrice, p.mrp);
  const gallery = [p.img, cat ? cat.img : p.img, p.img.replace('w=500&h=500', 'w=520&h=520')];

  // FBT — other items from same or related category
  const fbt = useMemo(
    () => products.filter((x) => x.id !== p.id && (x.catId === p.catId || x.bestseller)).slice(0, 5),
    [p.id, p.catId],
  );

  const addCurrent = (buyNow: boolean) => {
    add(p, qty, { variant, price: unitPrice });
    push('Added to cart', 'ok', 'shopping-bag');
    if (buyNow) setTimeout(() => navigate('/cart'), 400);
  };

  return (
    <>
      <main className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
          {/* breadcrumb */}
          <div className="text-xs text-[var(--ink-soft)] flex items-center gap-1 mb-3">
            <Link to="/home" className="hover:text-[var(--green-700)]">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/category?cat=${p.catId}`} className="hover:text-[var(--green-700)]">
              {cat ? cat.name : 'Category'}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--ink)] font-semibold">{p.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* gallery */}
            <div className="lg:w-1/2">
              <div className="card overflow-hidden aspect-square relative">
                <span className="absolute top-3 left-3 z-10">
                  <FoodMark type={p.foodType} />
                </span>
                {p.bestseller && (
                  <span className="absolute top-3 right-3 z-10 bg-[var(--green-700)] text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Bestseller
                  </span>
                )}
                <SmartImage src={gallery[mainImg]} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 mt-3">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`thumb ${i === mainImg ? 'ring-2' : ''} ring-[var(--green-600)] w-16 h-16 rounded-xl overflow-hidden card`}
                  >
                    <SmartImage src={g} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* info */}
            <div className="lg:w-1/2">
              {p.orderedTimes > 100 && (
                <div className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--green-700)] bg-[var(--leaf-100)] px-2.5 py-1 rounded-full mb-2">
                  <Flame className="w-3.5 h-3.5" />
                  Ordered {p.orderedTimes}× this week
                </div>
              )}
              <h1 className="display text-2xl lg:text-3xl font-extrabold leading-tight flex items-start gap-2">
                <FoodMark type={p.foodType} /> <span>{p.name}</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  <Stars n={p.rating} />
                </div>
                <span className="text-sm font-bold">{p.rating.toFixed(1)}</span>
                <span className="text-sm text-[var(--ink-soft)]">• {p.reviews} ratings</span>
                {p.trending && (
                  <span className="text-[11px] font-bold text-[var(--mustard)] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trending
                  </span>
                )}
              </div>

              <div className="flex items-end gap-3 mt-4">
                <span className="display text-3xl font-extrabold">{rupee(unitPrice)}</span>
                {p.mrp > unitPrice && (
                  <>
                    <span className="text-[var(--ink-soft)] line-through">{rupee(p.mrp)}</span>
                    <span className="bg-[var(--coral)] text-white text-xs font-extrabold px-2 py-1 rounded-md">
                      {off}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">Inclusive of all taxes • per {variant || p.unit}</p>

              {p.variants && (
                <div className="mt-5">
                  <div className="text-sm font-bold mb-2">Pack size</div>
                  <div className="flex gap-2">
                    {p.variants.map((v, i) => (
                      <button
                        key={v.label}
                        onClick={() => setVariantIdx(i)}
                        className={`chip ${i === variantIdx ? 'active' : ''}`}
                      >
                        {v.label} • {rupee(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-6">
                <div className="text-sm font-bold">Quantity</div>
                <div className="stepper">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[11px] text-[var(--ink-soft)]">Subtotal</div>
                  <div className="font-extrabold">{rupee(unitPrice * qty)}</div>
                </div>
              </div>

              <div className="hidden lg:flex gap-3 mt-6">
                <button onClick={() => addCurrent(false)} className="btn btn-ghost flex-1 py-3.5 text-base">
                  Add to Cart
                </button>
                <button onClick={() => addCurrent(true)} className="btn btn-primary flex-1 py-3.5 text-base">
                  Buy Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* delivery */}
              <div className="card p-4 mt-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-[var(--green-700)]" />
                <div className="text-sm">
                  <b>Delivery in 30 minutes</b>
                  <div className="text-[var(--ink-soft)] text-[12px]">
                    to {deliveringArea()} • delivery charge as per km
                  </div>
                </div>
              </div>

              {/* trust icons */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="card p-3">
                  <Leaf className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Quality assured</div>
                </div>
                <div className="card p-3">
                  <Snowflake className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Cold-chain</div>
                </div>
                <div className="card p-3">
                  <BadgeCheck className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Hygienic pack</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-extrabold mb-1">About this product</h3>
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </div>

          {/* frequently bought together */}
          <section className="mt-10">
            <h2 className="display text-xl font-extrabold mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--green-700)]" /> Frequently bought together
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {fbt.map((x) => (
                <ProductCard key={x.id} product={x} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* mobile sticky add bar */}
      <div className="action-bar glass border-t border-[var(--line)] px-4 py-3 lg:hidden flex items-center gap-3">
        <div>
          <div className="text-[11px] text-[var(--ink-soft)]">Total</div>
          <div className="font-extrabold text-lg">{rupee(unitPrice * qty)}</div>
        </div>
        <button onClick={() => addCurrent(false)} className="btn btn-ghost flex-1 py-3">
          Add to Cart
        </button>
        <button onClick={() => addCurrent(true)} className="btn btn-primary flex-1 py-3">
          Buy Now
        </button>
      </div>
    </>
  );
}
