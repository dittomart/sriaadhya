import { Check, Heart, Leaf, ShieldCheck, Smile } from 'lucide-react';

/* BRAND STRIP — tone of voice · taglines · usage in action */
export function BrandStrip() {
  return (
    <section className="mt-8 lg:mt-11 io">
      <div className="text-center mb-5">
        <h2 className="display text-xl lg:text-2xl font-extrabold">The SRI AADHYA promise</h2>
        <p className="text-sm text-[var(--ink-soft)] mt-1.5">Friendly, trustworthy &amp; caring — fresh to your doorstep.</p>
      </div>
      <div className="brand-strip grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/15">
        {/* TONE OF VOICE */}
        <div className="bs-col">
          <h4 className="bs-head">TONE OF VOICE</h4>
          <div className="bs-tone">
            <div className="bs-tone-item text-micro">
              <span className="bs-ic">
                <Smile className="w-5 h-5" />
              </span>
              Friendly
            </div>
            <div className="bs-tone-item text-micro">
              <span className="bs-ic">
                <ShieldCheck className="w-5 h-5" />
              </span>
              Trustworthy
            </div>
            <div className="bs-tone-item text-micro">
              <span className="bs-ic">
                <Leaf className="w-5 h-5" />
              </span>
              Caring
            </div>
            <div className="bs-tone-item text-micro">
              <span className="bs-ic">
                <Heart className="w-5 h-5" />
              </span>
              Positive
            </div>
          </div>
        </div>

        {/* TAGLINE OPTIONS */}
        <div className="bs-col">
          <h4 className="bs-head">TAGLINE OPTIONS</h4>
          <ul className="bs-tags">
            <li>
              <span className="bs-check">
                <Check />
              </span>
              Freshness Frozen, Goodness Preserved.
            </li>
            <li>
              <span className="bs-check">
                <Check />
              </span>
              From Nature to Freezer, Quality You Deserve.
            </li>
            <li>
              <span className="bs-check">
                <Check />
              </span>
              Healthy Food, Happy Life.
            </li>
          </ul>
        </div>

        {/* USAGE IN ACTION */}
        <div className="bs-col">
          <h4 className="bs-head">USAGE IN ACTION</h4>
          <div className="bs-van-wrap">
            {/* A drawing, not content. Its side-panel lettering is sized to the
                illustration rather than the type floor, so it must not reach a
                screen reader as text — the tagline it repeats is set legibly
                elsewhere on this page. */}
            <div className="van" aria-hidden="true">
              <div className="cargo">
                <img src="/images/logo.png" alt="SRI AADHYA" />
                <span className="vt">
                  FRESHNESS FROZEN,
                  <br />
                  GOODNESS PRESERVED
                </span>
              </div>
              <div className="cab">
                <span className="win" />
                <span className="lamp" />
              </div>
              <span className="wheel w1" />
              <span className="wheel w2" />
            </div>
            <span className="bs-road" />
          </div>
        </div>
      </div>
    </section>
  );
}
