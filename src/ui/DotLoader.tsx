/** Full-page fallback used by React.lazy Suspense and loading states. */
export function DotLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="relative w-24 h-24">
        <div className="splash-ring absolute inset-0" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/images/logo.png" alt="" className="w-10 h-10 object-contain" />
        </div>
      </div>
    </div>
  );
}
