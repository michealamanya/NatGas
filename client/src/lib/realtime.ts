import { useEffect, useRef } from 'react';

/** Refreshes the current screen whenever the API broadcasts a data change. */
export function useRealtimeRefresh(refresh: () => void): void {
  const current = useRef(refresh);
  current.current = refresh;

  useEffect(() => {
    const source = new EventSource('/api/events');
    source.addEventListener('update', () => current.current());
    return () => source.close();
  }, []);
}
