import { Link } from 'react-router-dom';
import { SmartImage } from '@/shared/SmartImage';
import type { Category } from '@/types';

/** Port of animations.js `categoryTile()`. */
export function CategoryTile({ category: c }: { category: Category }) {
  return (
    <Link to={`/category?cat=${c.id}`} className="io group flex flex-col no-tap">
      <div className="catile w-full aspect-square" style={{ background: `${c.tone}10` }}>
        <SmartImage src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg,transparent 55%,${c.tone}33)` }}
        />
        <span className="catile-emoji float-slow">{c.emoji}</span>
      </div>
      <span className="catile-name">{c.name}</span>
    </Link>
  );
}
