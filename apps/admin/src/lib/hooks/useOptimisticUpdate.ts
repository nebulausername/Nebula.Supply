import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface OptimisticUpdateOptions<TData, TVariables> {
  queryKey: unknown[];
  updateFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TData | void> | TData | void;
  onError?: (error: Error, variables: TVariables, context: TData | void) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  rollbackOnError?: boolean;
}

export interface OptimisticUpdateResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Optimistic update hook for React Query
 * Provides optimistic UI updates with automatic rollback on error
 */
export function useOptimisticUpdate<TData, TVariables>(
  options: OptimisticUpdateOptions<TData, TVariables>
): OptimisticUpdateResult<TData, TVariables> {
  const {
    queryKey,
    updateFn,
    onMutate,
    onError,
    onSuccess,
    onSettled,
    rollbackOnError = true,
  } = options;

  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<TData | void>(undefined);
  const variablesRef = useRef<TVariables | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsPending(true);
      setError(null);
      variablesRef.current = variables;

      let previousData: TData | void = undefined;
      let context: TData | void = undefined;

      try {
        // Get current data for rollback
        previousDataRef.current = queryClient.getQueryData<TData>(queryKey);

        // Optimistic update - onMutate
        if (onMutate) {
          context = await onMutate(variables);
          if (context !== undefined) {
            queryClient.setQueryData(queryKey, context);
          }
        }

        // Perform actual update
        const data = await updateFn(variables);

        // Update cache with real data
        queryClient.setQueryData(queryKey, data);

        // Call success handler
        onSuccess?.(data, variables);

        setIsPending(false);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Rollback on error
        if (rollbackOnError && previousDataRef.current !== undefined) {
          queryClient.setQueryData(queryKey, previousDataRef.current);
        }

        // Call error handler
        onError?.(error, variables, context);

        setIsPending(false);
        throw error;
      } finally {
        onSettled?.(
          queryClient.getQueryData<TData>(queryKey),
          error,
          variables
        );
      }
    },
    [
      queryKey,
      updateFn,
      onMutate,
      onError,
      onSuccess,
      onSettled,
      rollbackOnError,
      queryClient,
    ]
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      return mutate(variables);
    },
    [mutate]
  );

  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
    previousDataRef.current = undefined;
    variablesRef.current = null;
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending,
    error,
    reset,
  };
}

/**
 * Batch optimistic updates hook
 * Allows multiple updates to be batched together
 */
export function useBatchOptimisticUpdate<TData, TVariables>(
  options: OptimisticUpdateOptions<TData[], TVariables[]>
) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<TData[] | undefined>(undefined);

  const mutateBatch = useCallback(
    async (variablesArray: TVariables[]): Promise<TData[]> => {
      setIsPending(true);
      setError(null);

      try {
        // Get current data for rollback
        previousDataRef.current = queryClient.getQueryData<TData[]>(options.queryKey);

        // Optimistic update
        if (options.onMutate) {
          const context = await options.onMutate(variablesArray);
          if (context !== undefined) {
            queryClient.setQueryData(options.queryKey, context);
          }
        }

        // Perform actual updates
        const results = await Promise.all(
          variablesArray.map((vars) => options.updateFn(vars))
        );

        // Update cache with real data
        queryClient.setQueryData(options.queryKey, results);

        // Call success handler
        options.onSuccess?.(results, variablesArray);

        setIsPending(false);
        return results;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Rollback on error
        if (options.rollbackOnError && previousDataRef.current !== undefined) {
          queryClient.setQueryData(options.queryKey, previousDataRef.current);
        }

        // Call error handler
        options.onError?.(error, variablesArray, undefined);

        setIsPending(false);
        throw error;
      } finally {
        options.onSettled?.(
          queryClient.getQueryData<TData[]>(options.queryKey),
          error,
          variablesArray
        );
      }
    },
    [options, queryClient]
  );

  return {
    mutateBatch,
    isPending,
    error,
  };
}

