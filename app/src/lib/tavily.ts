const TAVILY_API_KEY = (import.meta.env.VITE_TAVILY_API_KEY as string) || '';
if (!TAVILY_API_KEY) {
  console.warn('VITE_TAVILY_API_KEY is not set. Tavily search requests will likely fail.');
}

interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  results?: TavilySearchResult[];
}

export async function fetchTavilySearch(query: string, signal?: AbortSignal): Promise<string> {
  if (!TAVILY_API_KEY) {
    throw new Error('Tavily API key is missing. Set VITE_TAVILY_API_KEY in your environment.');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'advanced',
      max_results: 6,
      include_answer: true,
      include_raw_content: true,
      topic: 'general',
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tavily search failed with status ${response.status}: ${body}`);
  }

  const data = (await response.json()) as TavilySearchResponse;
  const answer = data.answer ? data.answer.trim() : '';
  const results = Array.isArray(data.results) ? data.results.slice(0, 6) : [];

  const formattedResults = results
    .map((result, index) => {
      const title = result.title?.trim() || result.url || `Source ${index + 1}`;
      const url = result.url ? `URL: ${result.url}` : '';
      const content = (result.content || result.raw_content || '').trim();
      return [`Source ${index + 1}: ${title}`, url, content ? `Snippet: ${content}` : '']
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const parts = [];
  if (answer) {
    parts.push(`Tavily summary:\n${answer}`);
  }
  if (formattedResults) {
    parts.push(`Web search results:\n${formattedResults}`);
  }

  return parts.join('\n\n');
}
