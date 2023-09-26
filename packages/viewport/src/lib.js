export function state(app) {
  window.dispatchEvent(new CustomEvent('app:state', { detail: app }));
}
