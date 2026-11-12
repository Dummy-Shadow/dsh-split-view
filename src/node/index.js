/**
 * Host half of dsh-split-view.
 *
 * The split view is a browser-only feature; this row exists so the bundle can
 * enter the profile roster and the `dsh.client` declaration can load the
 * browser half. Keep it inert.
 */

export const name = 'dsh-split-view'

export function apply() {
  // no host services
}
