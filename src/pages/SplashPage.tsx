import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Leaf, ShieldCheck, Snowflake, Sprout } from 'lucide-react';
import { LeafDefsSplash, LiveLeavesSplash } from '@/shared/LiveLeaf';

/* Ports index.html. The Get Started CTA links to /location, exactly as the
   HTML does (href="location.html") — there is no auto-redirect timer. */
export function SplashPage() {
  return (
    <div className="splash-page">
      {/* ============ LEFT · BRAND ============ */}
      <section className="relative flex flex-col items-center justify-center text-center px-7 py-10 lg:px-16">
        <LeafDefsSplash />
        <LiveLeavesSplash />

        {/* faint ambient accents */}
        <Leaf className="leaf l3 leaf-float" style={{ animationDelay: '1.4s' }} />
        <Leaf className="leaf l4 leaf-float" style={{ animationDelay: '2s' }} />

        {/* brand wordmark */}
        <div className="logo-lockup" style={{ animation: 'bounceIn .9s ease' }}>
          <div className="logo-mark">
            <Sprout />
            <Snowflake className="snow" />
          </div>
          <div className="logo-sri">SRI</div>
          <div className="logo-name">AADHYA</div>
          <div className="logo-rule">
            <span />
            FROZENS
            <span />
          </div>
        </div>

        {/* tagline */}
        <div className="tagline mt-7" style={{ animation: 'fadeUp .7s .25s both' }}>
          <Snowflake className="w-3.5 h-3.5" /> Freshness Frozen, Goodness Preserved
        </div>

        {/* feature badges */}
        <div className="feats mt-9" style={{ animation: 'fadeUp .7s .4s both' }}>
          <div className="feat">
            <span className="feat-ico">
              <Leaf />
            </span>
            <span className="feat-lbl">
              100%
              <br />
              Natural
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <Snowflake />
            </span>
            <span className="feat-lbl">
              Frozen
              <br />
              Fresh
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <ShieldCheck />
            </span>
            <span className="feat-lbl">
              Premium
              <br />
              Quality
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <HeartHandshake />
            </span>
            <span className="feat-lbl">
              Made for
              <br />
              Families
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link to="/location" className="cta mt-10" style={{ animation: 'fadeUp .7s .55s both' }}>
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-[12px] text-[var(--ink-soft)] mt-4" style={{ animation: 'fadeIn 1s .7s both' }}>
          100% Natural • Hygienically Packed • Avinashi, Tirupur
        </p>
      </section>
    </div>
  );
}
