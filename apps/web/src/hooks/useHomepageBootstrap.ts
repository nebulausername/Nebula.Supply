import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { useShopStore } from "../store/shop";
import { startMockFeed, stopMockFeed, useDropsStore } from "../store/drops";
import { trackError } from "../utils/analytics";

const selectShopBootstrap = (state: ReturnType<typeof useShopStore.getState>) => ({
  fetchAll: state.fetchAll,
  hasProducts: state.products.length > 0,
  isLoading: state.isLoading
});

const selectDropsReady = (state: ReturnType<typeof useDropsStore.getState>) => ({
  hasDrops: state.drops.length > 0
});

type BootstrapStatus = "idle" | "loading" | "success" | "error";

export interface HomepageBootstrapState {
  loading: boolean;
  error: string | null;
  ready: boolean;
  retry: () => void;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message || "Unbekannter Fehler";
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
};

export const useHomepageBootstrap = (): HomepageBootstrapState => {
  const { fetchAll, hasProducts, isLoading } = useShopStore(selectShopBootstrap, shallow);
  const { hasDrops } = useDropsStore(selectDropsReady, shallow);

  const initialReady = hasProducts;
  const [status, setStatus] = useState<BootstrapStatus>(initialReady ? "success" : "idle");
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const performBootstrap = useCallback(async (force = false) => {
    if (inFlightRef.current && !force) {
      return inFlightRef.current;
    }

    const run = async () => {
      setStatus("loading");
      setError(null);
      try {
        await fetchAll();
        setStatus("success");
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        setStatus("error");
        trackError("homepage_bootstrap_failed", err, { message });
      }
    };

    const promise = run().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = promise;
    return promise;
  }, [fetchAll]);

  const retry = useCallback(() => {
    void performBootstrap(true);
  }, [performBootstrap]);

  useEffect(() => {
    if (status === "idle" && !hasProducts) {
      void performBootstrap();
    }
  }, [hasProducts, performBootstrap, status]);

  useEffect(() => {
    if ((status === "loading" || status === "idle") && hasProducts) {
      setStatus("success");
    }
  }, [hasProducts, status]);

  useEffect(() => {
    if (status === "success" && hasDrops) {
      startMockFeed();
      return () => {
        stopMockFeed();
      };
    }
    return undefined;
  }, [status, hasDrops]);

  const ready = status === "success";
  const loading = status === "loading" || (status === "idle" && (isLoading || (!hasProducts && !error)));

  return useMemo(() => ({
    loading,
    error,
    ready,
    retry
  }), [error, loading, ready, retry]);
};
