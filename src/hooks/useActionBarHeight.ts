import { useLayoutEffect, useRef } from 'react';

/**
 * Measures a sticky `.action-bar` and publishes its height as `--action-bar-h`
 * so `.page-bar` can reserve exactly that much, and the WhatsApp FAB can sit
 * above it.
 *
 * The height cannot be a constant. The cart's bar grows a line when the order
 * is below the minimum, and a paragraph when the address is out of range —
 * both fire precisely when the customer is blocked and most needs to read what
 * is underneath. A hardcoded guess covers the short case and buries the tall
 * one, which is how it behaved before this existed.
 *
 * Returns a ref to attach to the bar element.
 */
export function useActionBarHeight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    /* Tag the tree so .has-action-bar rules (the FAB's offset) can find it —
       a page without a bar must not reserve room for one. */
    root.classList.add('has-action-bar');

    const publish = () => {
      root.style.setProperty('--action-bar-h', `${Math.ceil(el.offsetHeight)}px`);
    };
    publish();

    /* Catches the conditional rows appearing/disappearing and text reflowing at
       a new width alike — both change the height, neither fires a resize event. */
    const ro = new ResizeObserver(publish);
    ro.observe(el);

    return () => {
      ro.disconnect();
      root.classList.remove('has-action-bar');
      root.style.removeProperty('--action-bar-h');
    };
  }, []);

  return ref;
}
