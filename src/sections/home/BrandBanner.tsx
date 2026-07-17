import { useState } from 'react';
import { Heart, Leaf, ShieldCheck, Snowflake } from 'lucide-react';

/* ANIMATED BRAND BANNER — CSS recreation that always renders; the real
   artwork at /images/home-banner.png overlays it once (if) it loads. */
export function BrandBanner() {
  const [artworkLoaded, setArtworkLoaded] = useState(false);
  const [artworkMissing, setArtworkMissing] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="home-banner mt-4">
      <div className="brand-banner">
        {/* LEFT: brand + badges */}
        <div className="bb-left">
          <span className="bb-leaf-l">
            <Leaf />
          </span>
          <div className="bb-brand">
            <img src="/images/logo-full.png" alt="SRI AADHYA — Bloom Like a Blossom" className="bb-logo" />
          </div>
          <div className="bb-badges">
            <div className="bb-badge">
              <span className="ic">
                <Leaf />
              </span>
              <span className="lbl">
                100%
                <br />
                Natural
              </span>
            </div>
            <div className="bb-badge">
              <span className="ic">
                <Snowflake />
              </span>
              <span className="lbl">
                Frozen
                <br />
                Fresh
              </span>
            </div>
            <div className="bb-badge">
              <span className="ic" data-tone="dark">
                <ShieldCheck />
              </span>
              <span className="lbl">
                Premium
                <br />
                Quality
              </span>
            </div>
            <div className="bb-badge">
              <span className="ic">
                <Heart />
              </span>
              <span className="lbl">
                Made for
                <br />
                Families
              </span>
            </div>
          </div>
        </div>

        {/* MIDDLE: fresh vegetables photo */}
        <div className="bb-photo">
          {!photoFailed && (
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=620&h=600&fit=crop"
              alt="Fresh vegetables"
              onError={() => setPhotoFailed(true)}
            />
          )}
          <Snowflake className="bb-fx f1" />
          <Leaf className="bb-fx f2" />
          <Snowflake className="bb-fx f3" />
        </div>

        {/* RIGHT: mission */}
        <div className="bb-right">
          <Leaf className="ml" />
          <div className="bb-mh">OUR MISSION</div>
          <span className="bb-mh-line" />
          <p className="bb-mtxt">
            To deliver 100% natural, hygienic and delicious frozen foods that make every meal easy, healthy and
            memorable.
          </p>
          <div className="bb-script">
            Fresh Today,
            <br />
            Healthy Tomorrow.
          </div>
        </div>

        {/* real artwork overlay: appears automatically if /images/home-banner.png exists */}
        {!artworkMissing && (
          <img
            className={`bb-real ${artworkLoaded ? 'show' : ''}`}
            src="/images/home-banner.png"
            alt="SRI AADHYA FROZENS"
            onLoad={() => setArtworkLoaded(true)}
            onError={() => setArtworkMissing(true)}
          />
        )}
        <span className="bb-shine" />
      </div>
    </section>
  );
}
