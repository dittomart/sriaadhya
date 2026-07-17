/** Port of animations.js `skeletonCards(n)`.

    This has to be a ruler held against ProductCard, not a generic grey box: it
    occupies the grid cell for one paint and the real card replaces it. Anything
    it gets wrong lands as a jump. It was `.card` with a bare aspect-square and
    three arbitrary bars, while the real card is `.pcard` with a 10px media
    inset, a name link that is now `min-h-[44px]`, and px-3.5 pt-5 pb-3.5 body
    padding — roughly 40px shorter than the thing it stood in for. Mirror the
    real card's box model; keep the bars as the only invented part. */
export function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="pcard flex flex-col">
          {/* matches .pcard-media's 10px inset + .pcard-img's 16px radius */}
          <div className="pcard-media">
            <div className="skeleton aspect-square rounded-2xl" />
          </div>
          <div className="px-3.5 pt-5 pb-3.5 flex flex-col flex-1">
            {/* foodmark + category row */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="skeleton w-4 h-4 rounded" />
              <div className="skeleton h-2.5 w-1/2" />
            </div>
            {/* the name link's real height — the two-line clamp floor */}
            <div className="min-h-[44px] py-0.5 space-y-1.5">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
            {/* price row, bottom-aligned exactly as the card's mt-auto pt-2.5 */}
            <div className="mt-auto pt-2.5 flex items-end gap-1.5">
              <div className="skeleton h-4 w-14" />
              <div className="skeleton h-3 w-10 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
