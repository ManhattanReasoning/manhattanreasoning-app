// Where to send someone after sign-in. Routing is hash-based, so a location
// inside the app is always "/#/<route>".

const DEFAULT = "/#/";

/** The API rejects a longer `return_to`. */
const MAX_LENGTH = 512;

/**
 * Turn an in-app route ("/builds/123?x=1") into the `return_to` value the API
 * accepts: a same-origin path that starts with a single "/". Anything that
 * could point off-site falls back to the overview.
 */
export function toReturnTo(route: string | null | undefined): string {
  if (!route || !isSafeRoute(route)) return DEFAULT;
  const value = `/#${route}`;
  return value.length <= MAX_LENGTH ? value : DEFAULT;
}

/** A route is safe if it is an absolute in-app path and nothing else. */
export function isSafeRoute(route: string): boolean {
  if (!route.startsWith("/")) return false;
  if (route.startsWith("//")) return false;
  if (route.includes("\\")) return false;
  // Control characters and whitespace have no business in a route.
  return !/[\u0000- ]/.test(route);
}

/** Read and remove `?login_error=` from the page URL (it sits before the #). */
export function takeLoginError(
  location: Pick<Location, "search" | "pathname" | "hash">,
  replace: (url: string) => void,
): string | null {
  const params = new URLSearchParams(location.search);
  const code = params.get("login_error");
  if (code === null) return null;
  params.delete("login_error");
  const rest = params.toString();
  replace(`${location.pathname}${rest ? `?${rest}` : ""}${location.hash}`);
  return code;
}
