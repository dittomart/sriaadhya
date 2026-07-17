import { Outlet } from 'react-router-dom';
import { Header } from '@/shared/Header';
import { BottomNav } from '@/shared/BottomNav';
import { WhatsApp } from '@/shared/WhatsApp';

/* address.html / payment.html mount the header + bottom nav + WhatsApp FAB,
   but no footer. */
export function CheckoutLayout() {
  return (
    <div className="pb-24 lg:pb-0 min-h-screen">
      <Header showCheckoutMode />
      <Outlet />
      <WhatsApp />
      <BottomNav />
    </div>
  );
}
