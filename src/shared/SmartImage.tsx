import { useState } from 'react';
import { IMG_FALLBACK } from '@/utils/placeholders';

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Replaces app.js's global capture-phase `error` listener. Any seed/API image
 * that 404s falls back to the branded SVG placeholder exactly once.
 */
export function SmartImage({ src, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      {...rest}
      src={failed ? IMG_FALLBACK : src}
      onError={(e) => {
        if (!failed) setFailed(true);
        onError?.(e);
      }}
    />
  );
}
