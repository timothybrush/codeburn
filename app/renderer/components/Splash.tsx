import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { FlameMark } from './FlameMark'
import { motionClass, motionEnabled, reducedMotion } from '../lib/motion'
import { version } from '../../package.json'
import loaderVideo from '../assets/splash-loader.webm'

const MIN_ON_SCREEN_MS = 600
const CROSSFADE_MS = 250

type Phase = 'lit' | 'out' | 'done'

/**
 * Full-window branded startup loader -- the same scanning moment as the menubar
 * app's ignite-while-loading flame. Mounts once with the app and stays up while
 * the FIRST overview fetch has neither data nor error. On first data it holds a
 * floor of MIN_ON_SCREEN_MS (so a warm cache does not flash-blink) then
 * crossfades out. A first-fetch error dismisses it instantly, so the user is
 * never trapped behind branding; reduced motion swaps instantly with no fade.
 * A `done` latch means later loading states -- polls, filter changes -- never
 * bring it back.
 */
export function Splash({ hasData, hasError }: { hasData: boolean; hasError: boolean }) {
  const [phase, setPhase] = useState<Phase>('lit')
  const shownAt = useRef(Date.now())
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    if (!hasData && !hasError) return

    // First resolution of the first fetch. An error or a reduced-motion
    // preference swaps instantly; otherwise honor the on-screen floor first.
    if (hasError || reducedMotion()) {
      done.current = true
      setPhase('done')
      return
    }
    const wait = Math.max(0, MIN_ON_SCREEN_MS - (Date.now() - shownAt.current))
    const timer = setTimeout(() => setPhase('out'), wait)
    return () => clearTimeout(timer)
  }, [hasData, hasError])

  useEffect(() => {
    if (phase !== 'out') return
    const timer = setTimeout(() => {
      done.current = true
      setPhase('done')
    }, CROSSFADE_MS)
    return () => clearTimeout(timer)
  }, [phase])

  if (phase === 'done' || typeof document === 'undefined') return null

  const base = phase === 'out' ? 'splash splash-out' : 'splash'
  return createPortal(
    <div className={motionClass(base, 'splash-lit')} aria-hidden="true">
      {motionEnabled() ? (
        // The animated burn as VP9-with-alpha, floating directly on the splash
        // gradient while the first scan runs. Static mark under reduced motion.
        <video className="splash-video" src={loaderVideo} width={232} height={232} autoPlay muted loop playsInline />
      ) : (
        <div className="splash-mark">
          <FlameMark size={76} />
        </div>
      )}
      <div className="splash-word">CodeBurn</div>
      <div className="splash-version">v{version}</div>
    </div>,
    document.body,
  )
}
