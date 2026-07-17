import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Package, ShoppingCart, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Tab {
  to: string;
  Icon: LucideIcon;
  label: string;
  match: string[];
}

/** Port of app.js `renderBottomNav()`. */
export function BottomNav() {
  const { pathname } = useLocation();
  const loggedIn = !!useAuthStore((s) => s.user)?.loggedIn;

  const tabs: Tab[] = [
    { to: '/home', Icon: Home, label: 'Home', match: ['/home'] },
    { to: '/category', Icon: LayoutGrid, label: 'Categories', match: ['/category', '/product'] },
    { to: '/cart', Icon: ShoppingCart, label: 'Cart', match: ['/cart', '/coupon'] },
    { to: '/my-orders', Icon: Package, label: 'Orders', match: ['/my-orders', '/tracking'] },
    { to: loggedIn ? '/profile' : '/login', Icon: User, label: 'Profile', match: ['/profile', '/login'] },
  ];

  return (
    <nav className="bnav lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--line)] flex px-1">
      {tabs.map(({ to, Icon, label, match }) => (
        <Link key={label} to={to} className={match.some((m) => pathname.startsWith(m)) ? 'active' : ''}>
          <span className="nav-ico">
            <Icon className="w-5 h-5" />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
