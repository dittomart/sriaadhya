/** Port of animations.js `skeletonCards(n)`. */
export function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-6 w-full mt-2" />
          </div>
        </div>
      ))}
    </>
  );
}
