import { Outlet } from 'react-router-dom';

/** index.html, location.html, login.html, not-serviceable.html and the
    payment-processing screen render with no app chrome at all. */
export function BlankLayout() {
  return <Outlet />;
}
