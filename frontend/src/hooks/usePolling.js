import { useState, useEffect, useCallback } from 'react';

/**
 * Generic polling hook – fetches data at a fixed interval.
 */
export function usePolling(fetchFn, intervalMs = 10000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result.data ?? result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    execute();
    const id = setInterval(execute, intervalMs);
    return () => clearInterval(id);
  }, [execute, intervalMs]);

  return { data, loading, error, refetch: execute };
}
