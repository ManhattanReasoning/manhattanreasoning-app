import { useCallback, useEffect, useRef, useState } from "react";

export interface Resource<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  /** Fetch again, keeping the current data on screen meanwhile. */
  reload: () => Promise<void>;
}

export interface ResourceOptions<T> {
  /**
   * Milliseconds between automatic refreshes, given the data loaded so far; 0 or
   * undefined means do not refresh. Refreshing only happens while the page is visible:
   * a hidden tab makes no requests, and refreshes once as soon as it is shown again.
   */
  refreshMs?: (data: T | undefined) => number;
}

/** Load something from the API when the component mounts or `key` changes. */
export function useResource<T>(
  load: () => Promise<T>,
  key: string = "",
  opts: ResourceOptions<T> = {},
): Resource<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const next = await loadRef.current();
      if (mine !== generation.current) return;
      setData(next);
      setError(undefined);
    } catch (err) {
      if (mine !== generation.current) return;
      setError(err);
    } finally {
      if (mine === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setData(undefined);
    setError(undefined);
    setLoading(true);
    void reload();
    return () => {
      generation.current++;
    };
  }, [key, reload]);

  const ms = opts.refreshMs?.(data) ?? 0;
  useEffect(() => {
    if (!ms) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const timer = window.setInterval(refreshIfVisible, ms);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [ms, reload]);

  return { data, error, loading, reload };
}

/** Refresh rate for a list of builds: quickly while something is in flight, slowly otherwise. */
export const listRefreshMs = (d: { active_builds_count: number } | undefined): number =>
  d ? (d.active_builds_count > 0 ? 5000 : 30000) : 0;
