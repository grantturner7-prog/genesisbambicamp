/**
 * Relative path from the current page to the site root ("./" on the home page,
 * "../" on /facilities/). Keeps every link and asset working under any base path.
 */
export const ROOT: string = typeof document !== 'undefined' ? (document.documentElement.dataset.root ?? './') : './'

/**
 * Some static hosts (and the private preview) do not resolve a folder URL to its
 * index.html. Building with VITE_EXPLICIT_INDEX=1 links to the files by name instead.
 */
const EXPLICIT_INDEX = import.meta.env.VITE_EXPLICIT_INDEX === '1'
export const HOME_URL = EXPLICIT_INDEX ? `${ROOT}index.html` : ROOT
export const FACILITIES_URL = EXPLICIT_INDEX ? `${ROOT}facilities/index.html` : `${ROOT}facilities/`

/** history.replaceState that never throws (sandboxed frames may refuse it). */
export function setUrl(url: string) {
  try {
    window.history.replaceState(null, '', url)
  } catch {
    /* the page still works; only the address bar is not updated */
  }
}
