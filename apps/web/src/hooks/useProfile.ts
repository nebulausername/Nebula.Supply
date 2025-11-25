import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type UserProfile = {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string | null;
};

async function fetchMe(): Promise<UserProfile> {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) {
    // Fallback demo data when API not yet implemented
    return {
      name: 'Nebula User',
      email: 'user@nebulasupply.com',
      bio: 'Leidenschaftlicher Sneaker-Sammler und Drop-Jäger 🔥',
      avatar: null
    };
  }
  const json = await res.json();
  return json.data ?? json;
}

async function patchMe(update: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch('/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(update)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  const json = await res.json();
  return json.data ?? json;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (update: Partial<UserProfile>) => patchMe(update),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: ['me'] });
      const previous = queryClient.getQueryData<UserProfile>(['me']);
      if (previous) {
        queryClient.setQueryData<UserProfile>(['me'], { ...previous, ...update });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['me'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}




