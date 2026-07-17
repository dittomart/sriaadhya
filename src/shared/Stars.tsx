import { Star } from 'lucide-react';

/** Port of app.js `star()` — 5 stars, filled up to Math.round(n). */
export function Stars({ n, className = 'w-3 h-3' }: { n: number; className?: string }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${
            i <= Math.round(n) ? 'fill-[var(--mustard)] text-[var(--mustard)]' : 'text-gray-300'
          }`}
        />
      ))}
    </>
  );
}
