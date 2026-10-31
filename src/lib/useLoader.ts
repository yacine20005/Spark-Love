import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { errorMessage } from './feedback';

/**
 * Loads data whenever the screen gains focus. `loading` is only true before the
 * first result so revisits refresh silently instead of flashing a spinner.
 */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await run());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return { data, setData, error, loading: data === null && error === null, refreshing, refresh, reload };
}
