import { setUrl } from './root'

/**
 * Getting to a section of the landing page. Every tab in the header names a section; these
 * helpers make the tab land on it from either page, and on hosts (such as the private
 * preview) where a "#hash" in a link is not always honoured.
 */

const KEY = 'gya.goto'
const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Scroll to the element with this id. Returns false when it is not on this page. */
export function goTo(id: string, smooth = true): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  // "instant" on purpose: "auto" would follow the page's own smooth scrolling
  el.scrollIntoView({ behavior: smooth && !calm() ? 'smooth' : 'instant', block: 'start' })
  return true
}

/** Before following a link to the other page: remember which section it is meant to open. */
export function remember(id: string) {
  try {
    sessionStorage.setItem(KEY, id)
  } catch {
    /* the #hash in the link still carries it */
  }
}

function recall(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return v
  } catch {
    return null
  }
}

/** Where this page load was asked to land: read once, when the page starts. */
export const arrivalTarget: string | null = typeof window === 'undefined' ? null : (recall() ?? (window.location.hash.slice(1) || null))

/**
 * Land on a section right after the page has rendered, and stay on it while photos and
 * fonts settle the layout. Stops correcting as soon as the visitor scrolls by hand.
 */
export function settleOn(id: string): () => void {
  const jump = () => goTo(id, false)
  jump()
  const timers = [150, 500, 1200, 2500].map((ms) => window.setTimeout(jump, ms))
  window.addEventListener('load', jump, { once: true })
  const stop = () => {
    timers.forEach((t) => window.clearTimeout(t))
    window.removeEventListener('load', jump)
    for (const ev of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.removeEventListener(ev, stop)
  }
  for (const ev of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.addEventListener(ev, stop, { passive: true })
  return stop
}

/**
 * Make every "#section" link on the page scroll to its section by script. A link whose
 * target is not on the page (for example "#register", which opens the form) is left alone.
 */
export function installSectionLinks(): () => void {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null
    const id = a?.getAttribute('href')?.slice(1)
    if (!id || id === 'main' || !document.getElementById(id)) return
    e.preventDefault()
    setUrl(`#${id}`)
    // two frames, so that a menu closed by the same click has left the layout first
    requestAnimationFrame(() => requestAnimationFrame(() => goTo(id)))
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
