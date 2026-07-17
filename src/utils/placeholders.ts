/* Branded broken-image fallback — verbatim port of app.js IMG_FALLBACK.
   Catalog photos load from the Unsplash CDN; if any URL is dead/blocked we
   swap in a clean branded placeholder instead of a broken-image icon. */

export const IMG_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCFCE7"/><stop offset="1" stop-color="#EEF4E7"/></linearGradient></defs>' +
      '<rect width="500" height="500" fill="url(#g)"/>' +
      '<g transform="translate(250 210)" fill="#15803D">' +
      '<path d="M0 64 C-48 64 -88 22 -88 -26 C-32 -26 8 6 0 64 Z"/>' +
      '<path d="M0 64 C48 64 88 22 88 -26 C32 -26 -8 6 0 64 Z" opacity="0.65"/>' +
      '<rect x="-3" y="40" width="6" height="40" rx="3"/></g>' +
      '<text x="250" y="350" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#15803D" text-anchor="middle" letter-spacing="2">SRIAADHYA</text>' +
      '<text x="250" y="384" font-family="Arial,Helvetica,sans-serif" font-size="17" fill="#3C5446" text-anchor="middle">Image coming soon</text>' +
      '</svg>',
  );
