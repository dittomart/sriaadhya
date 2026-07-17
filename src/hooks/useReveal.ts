import { useEffect } from 'react';

/**
 * Port of app.js `initReveal()`. Adds `.in` to every `.io` element as it
 * scrolls into view.
 *
 * A MutationObserver picks up `.io` nodes that mount after the first pass —
 * lazily-rendered sections, filtered grids, async lists — because a plain
 * effect only ever sees the nodes present on its own run, and anything
 * appearing later would stay stuck at the class's `opacity: 0`.
 */
export function useReveal(): void {
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    const observeAll = () => {
      document.querySelectorAll('.io').forEach((el) => {
        if (seen.has(el) || el.classList.contains('in')) return;
        seen.add(el);
        io.observe(el);
      });
    };

    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
