import { useId, useMemo } from 'react'

import { motionEnabled } from '../lib/motion'

// Flame silhouette: Bootstrap Icons `fire` (MIT License, © The Bootstrap Authors,
// https://github.com/twbs/icons/blob/main/icons/fire.svg). A filled teardrop
// flame whose tip curls right, with a small inner negative-space tongue at the
// bottom center -- the closest MIT-licensed match to the menubar's SF Symbol
// `flame.fill`. Path embedded verbatim; only the fill is swapped for the brand
// gradient.
const FLAME_PATH =
  'M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15'

/**
 * Brand flame mark, mirroring the menubar's `BurnFlame`. The vertical gradient
 * reproduces that view's Ember-preset stops (glow -> light -> base -> deep, from
 * base to tip). Shared between the launch splash (large) and the sidebar (small).
 * `live` gives the whole mark an all-but-imperceptible idle flicker in the
 * sidebar; its phase is randomized once per mount so a row of flames never
 * metronomes. All motion is gated by motionEnabled().
 */
export function FlameMark({ size = 20, live = false }: { size?: number; live?: boolean }) {
  const uid = useId()
  const grad = `fm-grad-${uid}`
  // Random negative delay so the loop starts mid-cycle at a different point each
  // mount. Computed once; only takes effect when the flicker class is present.
  const flickerStyle = useMemo(() => ({ animationDelay: `-${(Math.random() * 4 + 1).toFixed(2)}s` }), [])
  const flicker = live && motionEnabled()

  return (
    <svg className="flamemark" width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f0a070" />
          <stop offset=".33" stopColor="#e8774a" />
          <stop offset=".67" stopColor="#c9521d" />
          <stop offset="1" stopColor="#8b3e13" />
        </linearGradient>
      </defs>
      <path
        className={flicker ? 'fm-flicker' : undefined}
        style={flicker ? flickerStyle : undefined}
        fill={`url(#${grad})`}
        d={FLAME_PATH}
      />
    </svg>
  )
}
