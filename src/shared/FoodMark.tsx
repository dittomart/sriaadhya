import type { FoodType } from '@/types';

/** Port of app.js `foodMark()` — the veg / non-veg / other square. */
export function FoodMark({ type, className = '' }: { type: FoodType; className?: string }) {
  const cls = type === 'veg' ? 'fm-veg' : type === 'non-veg' ? 'fm-non' : 'fm-other';
  return (
    <span className={`foodmark ${cls} ${className}`} title={type}>
      <i />
    </span>
  );
}
