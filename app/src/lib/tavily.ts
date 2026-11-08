import { apiRequest } from '@/lib/api';

export async function fetchTavilySearch(query: string, signal?: AbortSignal): Promise<string> {
  const data = await apiRequest<{ result: string }>('/api/search/tavily', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }, signal);

  return data.result;
}
