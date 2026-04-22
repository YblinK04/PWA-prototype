import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';

interface LadderStep {
  level: number;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'completed';
}

async function fetchLadder(track: 'single' | 'relationship'): Promise<LadderStep[]> {
  const res = await fetch('/api/ladder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track }),
  });
  if (!res.ok) throw new Error('Failed to fetch ladder');
  return res.json();
}

export function useLadder() {
  const { track } = useAuthStore(); // трек хранится в сторе

  return useQuery({
    queryKey: ['ladder', track],
    queryFn: () => fetchLadder(track!),
    enabled: !!track, // запрос только когда трек известен
    staleTime: 5 * 60 * 1000, // считаем данные свежими 5 минут
    refetchOnWindowFocus: true, // при возврате в приложение обновляем
  });
}