import { useCallback, useEffect, useRef, useState } from "react";

export interface Resource<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  /** Fetch again, keeping the current data on screen meanwhile. */
  reload: () => Promise<void>;
}

/** Load something from the API when the component mounts or `key` changes. */
export function useResource<T>(load: () => Promise<T>, key: string = ""): Resource<T> {
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

  return { data, error, loading, reload };
}
