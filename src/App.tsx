import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppInit } from '@/AppInit';
import { BlankLayout } from '@/layouts/BlankLayout';
import { CheckoutLayout } from '@/layouts/CheckoutLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { ErrorBoundary } from '@/shared/ErrorBoundary';
import { DotLoader } from '@/ui/DotLoader';
import { migrateLegacyStorage } from '@/utils/storageKeys';

// Runs at import time, before any persisted store hydrates.
migrateLegacyStorage();

const SplashPage = lazy(() => import('@/pages/SplashPage').then((m) => ({ default: m.SplashPage })));
const LocationPage = lazy(() => import('@/pages/LocationPage').then((m) => ({ default: m.LocationPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CouponPage = lazy(() => import('@/pages/CouponPage').then((m) => ({ default: m.CouponPage })));
const AddressPage = lazy(() => import('@/pages/AddressPage').then((m) => ({ default: m.AddressPage })));
const PaymentPage = lazy(() => import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })));
const PaymentProcessingPage = lazy(() =>
  import('@/pages/PaymentProcessingPage').then((m) => ({ default: m.PaymentProcessingPage })),
);
const PaymentFailedPage = lazy(() =>
  import('@/pages/PaymentFailedPage').then((m) => ({ default: m.PaymentFailedPage })),
);
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const TrackingPage = lazy(() => import('@/pages/TrackingPage').then((m) => ({ default: m.TrackingPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PolicyPage = lazy(() => import('@/pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const NotServiceablePage = lazy(() =>
  import('@/pages/NotServiceablePage').then((m) => ({ default: m.NotServiceablePage })),
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppInit>
          <Suspense fallback={<DotLoader />}>
            <Routes>
              {/* Blank — no app chrome */}
              <Route element={<BlankLayout />}>
                <Route path="/" element={<SplashPage />} />
                <Route path="/location" element={<LocationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/payment-processing" element={<PaymentProcessingPage />} />
                <Route path="/payment-failed" element={<PaymentFailedPage />} />
                {/* alias kept so a stale /payment-failure link still resolves */}
                <Route path="/payment-failure" element={<PaymentFailedPage />} />
                <Route path="/not-serviceable" element={<NotServiceablePage />} />
              </Route>

              {/* Root — header + bottom nav + WhatsApp */}
              <Route element={<RootLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/coupon" element={<CouponPage />} />
                <Route path="/my-orders" element={<OrdersPage />} />
                <Route path="/tracking/:uniqueOrderId" element={<TrackingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/terms-conditions" element={<PolicyPage />} />
                <Route path="/privacy-policy" element={<PolicyPage />} />
                {/* the canonical "view this order" */}
                <Route path="/view-order/:uniqueOrderId" element={<OrderSuccessPage />} />
              </Route>

              {/* Checkout — header in checkout mode, no search */}
              <Route element={<CheckoutLayout />}>
                <Route path="/address" element={<AddressPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                {/* PayU's success URL is hardcoded on the backend — never move it */}
                <Route path="/running-order/:uniqueOrderId" element={<OrderSuccessPage />} />
                <Route path="/order-success/:uniqueOrderId" element={<OrderSuccessPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppInit>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
