import { useState, useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { runSync } from '@/lib/sync/engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNetwork(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: null,
    connectionType: null,
  });

  // Track whether we were previously offline so we can detect restoration.
  const wasOfflineRef = useRef<boolean>(false);
  // Prevent triggering sync on the very first render.
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Handle a single NetInfo state snapshot and update local state.
    function handleNetInfoState(state: NetInfoState): void {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? null;
      const type = state.type ?? null;

      setNetworkState({
        isConnected: connected,
        isInternetReachable: reachable,
        connectionType: type,
      });

      if (initializedRef.current) {
        // Connection restored: was offline, now online and internet reachable.
        const nowOnline = connected && reachable !== false;
        if (wasOfflineRef.current && nowOnline) {
          console.info('[useNetwork] Connection restored — triggering sync');
          runSync().catch((err: unknown) => {
            console.warn('[useNetwork] Auto-sync on reconnect failed:', err);
          });
        }
        wasOfflineRef.current = !nowOnline;
      } else {
        // First snapshot — record initial connectivity without triggering sync.
        initializedRef.current = true;
        wasOfflineRef.current = !(connected && reachable !== false);
      }
    }

    // Fetch the current state immediately so the hook doesn't start as unknown.
    NetInfo.fetch().then(handleNetInfoState).catch(() => {
      // If fetching fails, assume offline.
      initializedRef.current = true;
      wasOfflineRef.current = true;
    });

    // Subscribe to subsequent changes.
    const unsubscribe = NetInfo.addEventListener(handleNetInfoState);

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}
