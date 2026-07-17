/* The realistic SVG leaf from index.html / login.html.
   index.html uses a simple 130×150 blade; login.html uses a richer 150×198
   blade with a turbulence-displaced organic edge. Both are ported as-is —
   the `variant` picks which <symbol> the page draws. */

export function LeafDefsSplash() {
  return (
    <svg className="leaf-defs" aria-hidden="true">
      <defs>
        <linearGradient id="lfBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C4EA8A" />
          <stop offset=".45" stopColor="#4CAF50" />
          <stop offset="1" stopColor="#1E6B34" />
        </linearGradient>
        <radialGradient id="lfDew" cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".45" stopColor="#eaffea" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <symbol id="liveLeaf" viewBox="0 0 130 150">
          <path d="M65 150 C64 134 64 128 64 122" stroke="#2f7a3d" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path
            d="M65 122 C18 100 8 54 65 6 C122 54 112 100 65 122 Z"
            fill="url(#lfBody)"
            stroke="#2f8f43"
            strokeWidth="1"
            strokeOpacity=".4"
          />
          <path d="M60 16 C40 34 30 62 42 94 C32 62 41 35 60 16 Z" fill="#ffffff" opacity=".16" />
          <g stroke="#1c5e2e" strokeWidth="1.6" strokeOpacity=".5" fill="none" strokeLinecap="round">
            <path d="M65 118 C64 80 66 40 65 12" />
            <path d="M64 96 C46 93 33 87 23 75" />
            <path d="M65 96 C84 93 97 87 107 75" />
            <path d="M64 73 C49 71 39 65 29 53" />
            <path d="M65 73 C81 71 91 65 101 53" />
            <path d="M64 51 C53 49 46 43 39 35" />
            <path d="M65 51 C77 49 84 43 91 35" />
          </g>
          <circle cx="46" cy="58" r="6.5" fill="url(#lfDew)">
            <animate attributeName="opacity" values=".55;1;.55" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="82" r="4.5" fill="url(#lfDew)">
            <animate attributeName="opacity" values="1;.5;1" dur="3.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="57" cy="36" r="3.6" fill="url(#lfDew)">
            <animate attributeName="opacity" values=".6;1;.6" dur="2.8s" repeatCount="indefinite" />
          </circle>
        </symbol>
      </defs>
    </svg>
  );
}

export function LiveLeavesSplash() {
  return (
    <>
      <span className="live-leaf lf-tl">
        <svg viewBox="0 0 130 150" aria-hidden="true">
          <use href="#liveLeaf" />
        </svg>
      </span>
      <span className="live-leaf lf-br">
        <svg viewBox="0 0 130 150" aria-hidden="true">
          <use href="#liveLeaf" />
        </svg>
      </span>
    </>
  );
}

export function LeafDefsLogin() {
  return (
    <svg className="leaf-defs" aria-hidden="true">
      <defs>
        <linearGradient id="lfBodyLg" x1=".15" y1=".05" x2=".85" y2="1">
          <stop offset="0" stopColor="#7FBE45" />
          <stop offset=".24" stopColor="#4E9A38" />
          <stop offset=".54" stopColor="#2E7D32" />
          <stop offset=".8" stopColor="#1B5E20" />
          <stop offset="1" stopColor="#0D3A14" />
        </linearGradient>
        <radialGradient id="lfCore" cx=".5" cy=".4" r=".62">
          <stop offset="0" stopColor="#9CCB5A" stopOpacity=".55" />
          <stop offset=".6" stopColor="#4E9A38" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lfSheen" x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".5" />
          <stop offset=".4" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lfDewLg" cx=".34" cy=".28" r=".8">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".98" />
          <stop offset=".4" stopColor="#eafff0" stopOpacity=".5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* organic edge: turbulence displaces the smooth outline so it looks natural/serrated */}
        <filter id="lfRough" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.07" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <symbol id="liveLeafLg" viewBox="0 0 150 198">
          {/* stem */}
          <path d="M74 196 C73 182 74 172 74 162" stroke="#2c6a34" strokeWidth="4.2" fill="none" strokeLinecap="round" />
          {/* blade + veins get the organic edge */}
          <g filter="url(#lfRough)">
            <path
              d="M73 162 C36 142 18 104 24 66 C30 34 54 14 80 12 C104 34 130 64 122 102 C117 132 96 152 73 162 Z"
              fill="url(#lfBodyLg)"
            />
            <path
              d="M73 162 C36 142 18 104 24 66 C30 34 54 14 80 12 C104 34 130 64 122 102 C117 132 96 152 73 162 Z"
              fill="url(#lfCore)"
            />
            <path
              d="M73 162 C36 142 18 104 24 66 C30 34 54 14 80 12 C104 34 130 64 122 102 C117 132 96 152 73 162 Z"
              fill="url(#lfSheen)"
            />
            {/* midrib */}
            <path
              d="M74 158 C68 118 76 62 80 16"
              stroke="#B6DE82"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              strokeOpacity=".6"
            />
            {/* many parallel lateral veins (pinnate) */}
            <g stroke="#A6D470" strokeWidth="1.5" strokeOpacity=".5" fill="none" strokeLinecap="round">
              <path d="M73 146 C57 143 43 134 31 121" />
              <path d="M73 146 C90 143 105 134 118 121" />
              <path d="M73 130 C58 127 46 119 35 106" />
              <path d="M73 130 C89 127 102 119 113 106" />
              <path d="M74 114 C60 111 50 103 41 91" />
              <path d="M74 114 C88 111 99 103 108 91" />
              <path d="M75 98 C63 95 55 87 48 76" />
              <path d="M75 98 C87 95 96 87 103 76" />
              <path d="M76 82 C66 79 60 72 55 63" />
              <path d="M76 82 C86 79 93 72 99 63" />
              <path d="M77 66 C69 64 64 58 60 51" />
              <path d="M77 66 C85 64 90 58 95 51" />
              <path d="M78 50 C72 48 68 44 65 38" />
              <path d="M78 50 C84 48 88 44 91 38" />
            </g>
          </g>
          {/* crisp water droplets on top */}
          <g>
            <animate attributeName="opacity" values=".7;1;.7" dur="3.2s" repeatCount="indefinite" />
            <ellipse cx="50.5" cy="89" rx="8" ry="8.6" fill="#0d3a14" opacity=".16" />
            <ellipse cx="49" cy="87" rx="8" ry="8.6" fill="url(#lfDewLg)" />
            <circle cx="46" cy="83.5" r="2.3" fill="#fff" opacity=".95" />
          </g>
          <g>
            <animate attributeName="opacity" values="1;.62;1" dur="3.8s" repeatCount="indefinite" />
            <ellipse cx="98" cy="106" rx="5.6" ry="6" fill="#0d3a14" opacity=".16" />
            <ellipse cx="96.6" cy="104" rx="5.6" ry="6" fill="url(#lfDewLg)" />
            <circle cx="94.4" cy="101.5" r="1.7" fill="#fff" opacity=".95" />
          </g>
          <g>
            <animate attributeName="opacity" values=".6;1;.6" dur="2.7s" repeatCount="indefinite" />
            <ellipse cx="70" cy="58" rx="4.3" ry="4.6" fill="url(#lfDewLg)" />
            <circle cx="68.4" cy="56.2" r="1.3" fill="#fff" opacity=".95" />
          </g>
          <g>
            <animate attributeName="opacity" values=".8;.5;.8" dur="3.4s" repeatCount="indefinite" />
            <ellipse cx="40" cy="120" rx="3.3" ry="3.6" fill="url(#lfDewLg)" />
            <circle cx="38.8" cy="118.6" r="1" fill="#fff" opacity=".9" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export function LiveLeavesLogin() {
  return (
    <>
      <span className="live-leaf lf-tl">
        <svg viewBox="0 0 150 198" aria-hidden="true">
          <use href="#liveLeafLg" />
        </svg>
      </span>
      <span className="live-leaf lf-br">
        <svg viewBox="0 0 150 198" aria-hidden="true">
          <use href="#liveLeafLg" />
        </svg>
      </span>
    </>
  );
}
