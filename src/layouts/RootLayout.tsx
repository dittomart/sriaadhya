import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/shared/Header';
import { BottomNav } from '@/shared/BottomNav';
import { WhatsApp } from '@/shared/WhatsApp';

/** Maps a pathname to the nav key app.js passed to mountChrome(). */
function activeKey(pathname: string) {
  if (pathname.startsWith('/home')) return 'home' as const;
  if (pathname.startsWith('/category')) return 'cat' as const;
  if (pathname.startsWith('/cart') || pathname.startsWith('/coupon')) return 'cart' as const;
  if (pathname.startsWith('/my-orders') || pathname.startsWith('/tracking')) return 'orders' as const;
  if (pathname.startsWith('/profile')) return 'profile' as const;
  return '' as const;
}

/* Footer is intentionally absent: app.js `renderFooter()` returns "" —
   "Footer removed per request — no content rendered at the bottom of any page." */
export function RootLayout() {
  const { pathname } = useLocation();
  return (
    <div className="pb-24 lg:pb-0 min-h-screen">
      <Header active={activeKey(pathname)} />
      <Outlet />
      <WhatsApp />
      <BottomNav />
    </div>
  );
}
