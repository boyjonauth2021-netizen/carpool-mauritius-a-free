/**
 * Demo-only fingerprint so the browser store is not a list of plaintext
 * passwords. This is not a production password hash: there is no per-user
 * salt and it is fast to recompute. The demo passwords are shown in the UI.
 */
export function demoPasswordHash(password: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const value = `carpool-mauritius-a|${password}`;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x85ebca6b);
  }
  return `demo-${(h1 >>> 0).toString(16)}-${(h2 >>> 0).toString(16)}`;
}
