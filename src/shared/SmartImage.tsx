import { useState } from 'react';
import { IMG_FALLBACK } from '@/utils/placeholders';

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Replaces app.js's global capture-phase `error` listener. Any seed/API image
 * that 404s falls back to the branded SVG placeholder exactly once.
 */
export function SmartImage({ src, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  /* An absent src is not an error the browser reports — `src=""` and a missing
     attribute both fire no `error` event, so the fallback below never armed and
     the tag rendered as bare alt text, breaking the layout around it. A product
     the merchant hasn't photographed yet hits this, not just a broken URL. */
  const usable = typeof src === 'string' && src.trim().length > 0;
  return (
    <img
      {...rest}
      src={failed || !usable ? IMG_FALLBACK : src}
      onError={(e) => {
        if (!failed) setFailed(true);
        onError?.(e);
      }}
    />
  );
}
