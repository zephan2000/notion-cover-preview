import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SearchRequestBody {
  query: string;
  history?: { query: string; returned_urls: string[] }[];
  brand_context?: { business_type: string; brand_vibe: string[]; brand_references?: string[]; brand_avoids?: string[]; brand_description?: string };
  existing_urls?: string[];
  count?: number;
}

interface StockImage {
  url: string;
  tags: string[];
  source: string;
  width: number;
  height: number;
}

async function searchPexels(query: string, perPage: number, apiKey: string): Promise<StockImage[]> {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    { headers: { Authorization: apiKey } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []).map((p: Record<string, unknown>) => ({
    url: (p.src as Record<string, string>).large2x,
    tags: [],
    source: 'pexels',
    width: (p.width as number) ?? 1200,
    height: (p.height as number) ?? 800,
  }));
}

async function searchUnsplash(query: string, perPage: number, accessKey: string): Promise<StockImage[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${accessKey}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((p: Record<string, unknown>) => ({
    url: `${(p.urls as Record<string, string>).raw}&w=1920&q=80`,
    tags: [],
    source: 'unsplash',
    width: (p.width as number) ?? 1920,
    height: (p.height as number) ?? 1080,
  }));
}

async function searchPixabay(query: string, perPage: number, apiKey: string): Promise<StockImage[]> {
  const res = await fetch(
    `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${perPage}&orientation=horizontal&image_type=photo&min_width=1200`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.hits ?? []).map((p: Record<string, unknown>) => ({
    url: p.largeImageURL as string,
    tags: [],
    source: 'pixabay',
    width: (p.imageWidth as number) ?? 1200,
    height: (p.imageHeight as number) ?? 800,
  }));
}

async function generateSearchQueries(
  userQuery: string,
  history: { query: string; returned_urls: string[] }[],
  brandContext: { business_type: string; brand_vibe: string[]; brand_references?: string[]; brand_avoids?: string[]; brand_description?: string } | undefined,
  openrouterKey: string,
): Promise<string[]> {
  const systemPrompt = `You generate search queries for stock image APIs (Unsplash, Pexels, Pixabay).
Return ONLY a JSON array of 3-5 short keyword queries (2-4 words each) optimized for stock photo search.
No explanations, no markdown — just the JSON array.

${brandContext ? `Brand context — ${brandContext.brand_description ? `"${brandContext.brand_description}"` : `business: ${brandContext.business_type}, vibe: ${brandContext.brand_vibe.join(', ')}`}.${!brandContext.brand_description && brandContext.brand_references?.length ? ` Inspired by: ${brandContext.brand_references.join(', ')}.` : ''}${brandContext.brand_avoids?.length ? ` AVOID these aesthetics: ${brandContext.brand_avoids.join(', ')}.` : ''} Use this as background flavor but prioritize the user's explicit request.` : ''}`;

  const historyContext = history.length > 0
    ? `\nPrevious searches: ${history.map(h => `"${h.query}" (returned ${h.returned_urls.length} images)`).join(', ')}. Generate DIFFERENT queries this time.`
    : '';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User request: "${userQuery}"${historyContext}\n\nReturn JSON array of search queries:` },
      ],
    }),
  });

  if (!res.ok) {
    // Fallback: just use the user query directly
    return [userQuery];
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
  } catch {
    // Try extracting JSON array from text
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      try {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr) && arr.length > 0) return arr.map(String);
      } catch { /* fall through */ }
    }
  }
  return [userQuery];
}

async function assignTags(
  images: StockImage[],
  userQuery: string,
  openrouterKey: string,
): Promise<StockImage[]> {
  if (images.length === 0) return [];

  const imageList = images.map((img, i) => `${i}: ${img.url} (source: ${img.source})`).join('\n');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: `Assign 1-3 tags to each image based on its URL and the search context.
Available tags: brand, workspace, creative, nature, planning, abstract, warm, urban, tech, minimal, lifestyle, organic, bold, muted, colorful, dark, light.
Return ONLY a JSON array of tag arrays, one per image. Example: [["warm","lifestyle"],["minimal","workspace"]]` },
        { role: 'user', content: `Search was for: "${userQuery}"\n\nImages:\n${imageList}\n\nReturn JSON array of tag arrays:` },
      ],
    }),
  });

  if (!res.ok) {
    // Fallback: assign generic tags based on query words
    const queryWords = userQuery.toLowerCase().split(/\s+/);
    const validTags = ['brand', 'workspace', 'creative', 'nature', 'planning', 'abstract', 'warm', 'urban', 'tech', 'minimal', 'lifestyle', 'organic', 'bold', 'muted', 'colorful', 'dark', 'light'];
    const matched = queryWords.filter(w => validTags.includes(w));
    const fallbackTags = matched.length > 0 ? matched.slice(0, 2) : ['creative'];
    return images.map(img => ({ ...img, tags: fallbackTags }));
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const tagArrays: string[][] = JSON.parse(match[0]);
      return images.map((img, i) => ({
        ...img,
        tags: Array.isArray(tagArrays[i]) ? tagArrays[i] : ['creative'],
      }));
    }
  } catch { /* fall through */ }

  return images.map(img => ({ ...img, tags: ['creative'] }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterKey) {
    return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' });
  }
  if (!pexelsKey && !unsplashKey && !pixabayKey) {
    return res.status(500).json({ error: 'No image API keys configured' });
  }

  try {
    const body = req.body as SearchRequestBody;
    const { query, history = [], brand_context, existing_urls = [], count = 12 } = body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing query' });
    }

    // Step 1: Generate optimized search queries
    const searchQueries = await generateSearchQueries(query, history, brand_context, openrouterKey);

    // Step 2: Search all available APIs in parallel
    const perQueryCount = Math.ceil((count + 5) / searchQueries.length); // overfetch to account for deduplication
    const perSourceCount = Math.ceil(perQueryCount / 3);

    const allResults: StockImage[] = [];

    const searchPromises = searchQueries.flatMap(q => {
      const promises: Promise<StockImage[]>[] = [];
      if (pexelsKey) promises.push(searchPexels(q, perSourceCount, pexelsKey));
      if (unsplashKey) promises.push(searchUnsplash(q, perSourceCount, unsplashKey));
      if (pixabayKey) promises.push(searchPixabay(q, perSourceCount, pixabayKey));
      return promises;
    });

    const results = await Promise.allSettled(searchPromises);
    for (const r of results) {
      if (r.status === 'fulfilled') allResults.push(...r.value);
    }

    // Step 3: Deduplicate against existing URLs and within results
    const existingSet = new Set(existing_urls);
    const seenUrls = new Set<string>();
    const unique: StockImage[] = [];

    for (const img of allResults) {
      if (!existingSet.has(img.url) && !seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        unique.push(img);
      }
    }

    // Step 4: Trim to requested count
    const trimmed = unique.slice(0, count);

    // Step 5: Assign tags via Claude
    const tagged = await assignTags(trimmed, query, openrouterKey);

    return res.status(200).json({
      images: tagged.map(img => ({
        url: img.url,
        tags: img.tags,
        source: img.source,
        width: img.width,
        height: img.height,
      })),
      search_queries_used: searchQueries,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Search failed', detail: message });
  }
}
