import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A list the admin API pages with cursors: loads the first page when `key` changes, and
 * `more()` appends the next one. The cursor is opaque; it is only handed back as received.
 */
type Page = { items: unknown[]; next_cursor: string | null };

export function usePaged<P extends Page>(fetchPage: (cursor: string | null) => Promise<P>, key: string) {
  const [items, setItems] = useState<P["items"]>([]);
  const [first, setFirst] = useState<P | undefined>(undefined);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const page = await fetchRef.current(null);
      if (mine !== generation.current) return;
      setFirst(page);
      setItems(page.items as P["items"]);
      setCursor(page.next_cursor);
      setError(undefined);
    } catch (err) {
      if (mine === generation.current) setError(err);
    } finally {
      if (mine === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setFirst(undefined);
    setCursor(null);
    setError(undefined);
    setLoading(true);
    void reload();
    return () => {
      generation.current++;
    };
  }, [key, reload]);

  const more = useCallback(async () => {
    if (!cursor) return;
    const mine = generation.current;
    setLoadingMore(true);
    try {
      const page = await fetchRef.current(cursor);
      if (mine !== generation.current) return;
      setItems((prev) => [...prev, ...page.items] as P["items"]);
      setCursor(page.next_cursor);
    } catch (err) {
      if (mine === generation.current) setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor]);

  return { items, first, error, loading, loadingMore, hasMore: cursor !== null, more, reload };
}
