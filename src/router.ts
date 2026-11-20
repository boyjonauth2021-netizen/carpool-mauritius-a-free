export type AppLocation = {
  path: string;
  params: URLSearchParams;
};

export function parseHash(hash: string): AppLocation {
  const raw = hash.replace(/^#/, "") || "/";
  const queryAt = raw.indexOf("?");
  const pathPart = queryAt === -1 ? raw : raw.slice(0, queryAt);
  const query = queryAt === -1 ? "" : raw.slice(queryAt + 1);
  let path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return { path, params: new URLSearchParams(query) };
}

export function navigate(to: string): void {
  const next = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`;
  if (window.location.hash === next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = next;
}
