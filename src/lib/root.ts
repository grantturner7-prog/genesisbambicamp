/**
 * Relative path from the current page to the site root ("./" on the home page,
 * "../" on /facilities/). Keeps every link and asset working under any base path.
 */
export const ROOT: string = typeof document !== 'undefined' ? (document.documentElement.dataset.root ?? './') : './'
export const HOME_URL = ROOT
export const FACILITIES_URL = `${ROOT}facilities/`
