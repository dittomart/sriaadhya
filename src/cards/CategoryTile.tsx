import { Link } from 'react-router-dom';
import { SmartImage } from '@/shared/SmartImage';
import type { Category } from '@/types';

/** The category tile. The backend ships no accent colour or emoji per category,
    so the tile is the photo and its name — the brand's own green does the rest. */
export function CategoryTile({ category: c }: { category: Category }) {
  return (
    <Link to={`/category?cat=${c.id}`} className="io group flex flex-col no-tap">
      <div className="catile w-full aspect-square">
        <SmartImage src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg,transparent 55%,rgba(30,107,52,.28))' }}
        />
      </div>
      <span className="catile-name">{c.name}</span>
    </Link>
  );
}
