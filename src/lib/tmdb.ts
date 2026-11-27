import type { SwipeItem } from './types';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const DEFAULT_LANGUAGE = 'en-US';
const FALLBACK_OVERVIEW = 'Trending on TMDB this week.';
const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 2000;

export type TmdbKind = 'movie' | 'tv';

export class TmdbConfigError extends Error {
  constructor(
    message = 'TMDB is not configured. Set EXPO_PUBLIC_TMDB_READ_TOKEN (or EXPO_PUBLIC_TMDB_API_KEY) in your .env file.',
  ) {
    super(message);
    this.name = 'TmdbConfigError';
  }
}

type TmdbAuth =
  | { type: 'bearer'; token: string }
  | { type: 'apiKey'; key: string };

type TmdbRawItem = {
  id?: unknown;
  title?: unknown;
  original_title?: unknown;
  name?: unknown;
  original_name?: unknown;
  overview?: unknown;
  genre_ids?: unknown;
  release_date?: unknown;
  first_air_date?: unknown;
  vote_average?: unknown;
  poster_path?: unknown;
  backdrop_path?: unknown;
};

type TmdbTrendingResponse = {
  page?: unknown;
  total_pages?: unknown;
  results?: unknown;
};

type TmdbGenreListResponse = {
  genres?: unknown;
};

const FALLBACK_MOVIE_GENRES: Readonly<Record<number, string>> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const FALLBACK_TV_GENRES: Readonly<Record<number, string>> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

const genreCache = new Map<string, Record<number, string>>();

export function clearTmdbGenreCache(): void {
  genreCache.clear();
}

function getAuth(): TmdbAuth | null {
  const readToken = process.env.EXPO_PUBLIC_TMDB_READ_TOKEN?.trim();
  if (readToken) return { type: 'bearer', token: readToken };
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY?.trim();
  if (apiKey) return { type: 'apiKey', key: apiKey };
  return null;
}

export function isTmdbConfigured(): boolean {
  return getAuth() !== null;
}

function resolveLanguage(override?: string): string {
  const chosen = override?.trim() || process.env.EXPO_PUBLIC_TMDB_LANGUAGE?.trim();
  return chosen || DEFAULT_LANGUAGE;
}

async function tmdbGet<T>(
  path: string,
  params: Record<string, string>,
  auth: TmdbAuth,
  fetchImpl: typeof fetch,
): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth.type === 'bearer') {
    headers.Authorization = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set('api_key', auth.key);
  }

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), { method: 'GET', headers });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to reach TMDB: ${detail}`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'TMDB authentication failed (401). Check your EXPO_PUBLIC_TMDB_READ_TOKEN or EXPO_PUBLIC_TMDB_API_KEY.',
      );
    }
    if (response.status === 429) {
      throw new Error('TMDB rate limit exceeded (429). Please wait a moment and try again.');
    }
    let detail = '';
    try {
      const body = (await response.json()) as { status_message?: unknown };
      if (typeof body?.status_message === 'string' && body.status_message.trim()) {
        detail = `: ${body.status_message.trim()}`;
      }
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(`TMDB request failed (${response.status})${detail}`);
  }

  return (await response.json()) as T;
}

function fallbackGenresFor(kind: TmdbKind): Record<number, string> {
  return { ...(kind === 'movie' ? FALLBACK_MOVIE_GENRES : FALLBACK_TV_GENRES) };
}

async function getGenreMap(
  kind: TmdbKind,
  language: string,
  auth: TmdbAuth,
  fetchImpl: typeof fetch,
): Promise<Record<number, string>> {
  const cacheKey = `${kind}:${language}`;
  const cached = genreCache.get(cacheKey);
  if (cached) return cached;

  const fallback = fallbackGenresFor(kind);
  try {
    const data = await tmdbGet<TmdbGenreListResponse>(
      `/genre/${kind}/list`,
      { language },
      auth,
      fetchImpl,
    );
    const merged: Record<number, string> = { ...fallback };
    if (Array.isArray(data?.genres)) {
      for (const entry of data.genres) {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as { id?: unknown }).id === 'number' &&
          typeof (entry as { name?: unknown }).name === 'string' &&
          (entry as { name: string }).name.trim()
        ) {
          merged[(entry as { id: number }).id] = (entry as { name: string }).name.trim();
        }
      }
    }
    genreCache.set(cacheKey, merged);
    return merged;
  } catch {
    return fallback;
  }
}

function normalizeImagePath(path: unknown): string | null {
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function extractYear(dateValue: unknown): string | null {
  if (typeof dateValue !== 'string') return null;
  const match = /^(\d{4})/.exec(dateValue.trim());
  return match ? match[1] : null;
}

function mapRawItem(
  raw: TmdbRawItem,
  kind: TmdbKind,
  genres: Record<number, string>,
): SwipeItem | null {
  if (typeof raw.id !== 'number' || !Number.isInteger(raw.id) || raw.id <= 0) {
    return null;
  }

  const rawTitle =
    kind === 'movie'
      ? (typeof raw.title === 'string' && raw.title.trim()) ||
        (typeof raw.original_title === 'string' && raw.original_title.trim()) ||
        ''
      : (typeof raw.name === 'string' && raw.name.trim()) ||
        (typeof raw.original_name === 'string' && raw.original_name.trim()) ||
        '';

  if (!rawTitle) return null;

  const title = rawTitle.slice(0, MAX_TITLE_LENGTH);

  const rawOverview = typeof raw.overview === 'string' ? raw.overview.trim() : '';
  const description = (rawOverview || FALLBACK_OVERVIEW).slice(0, MAX_DESCRIPTION_LENGTH);

  const tags: string[] = [];
  if (Array.isArray(raw.genre_ids)) {
    for (const gid of raw.genre_ids) {
      if (tags.length >= 2) break;
      if (typeof gid === 'number') {
        const name = genres[gid];
        if (name && !tags.includes(name)) {
          tags.push(name);
        }
      }
    }
  }

  const year = extractYear(kind === 'movie' ? raw.release_date : raw.first_air_date);
  if (year) tags.push(year);

  if (
    typeof raw.vote_average === 'number' &&
    Number.isFinite(raw.vote_average) &&
    raw.vote_average > 0
  ) {
    tags.push(`★ ${raw.vote_average.toFixed(1)}`);
  }

  const poster = normalizeImagePath(raw.poster_path);
  const backdrop = normalizeImagePath(raw.backdrop_path);
  const image_url = poster
    ? `${TMDB_IMAGE_BASE}/w500${poster}`
    : backdrop
      ? `${TMDB_IMAGE_BASE}/w780${backdrop}`
      : null;

  const external_id = `tmdb:${kind}:${raw.id}`;

  return {
    id: external_id,
    external_id,
    kind,
    title,
    description,
    tags,
    icon: kind === 'movie' ? 'film-outline' : 'tv-outline',
    image_url,
    sort_order: 0,
  };
}

export async function fetchTrending(
  kind: TmdbKind,
  page = 1,
  options?: { fetchImpl?: typeof fetch; language?: string },
): Promise<{ items: SwipeItem[]; page: number; totalPages: number }> {
  const auth = getAuth();
  if (!auth) throw new TmdbConfigError();

  const fetchImpl = options?.fetchImpl ?? fetch;
  const language = resolveLanguage(options?.language);
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const [trending, genres] = await Promise.all([
    tmdbGet<TmdbTrendingResponse>(
      `/trending/${kind}/week`,
      { language, page: String(requestedPage) },
      auth,
      fetchImpl,
    ),
    getGenreMap(kind, language, auth, fetchImpl),
  ]);

  const rawResults = Array.isArray(trending?.results) ? (trending.results as TmdbRawItem[]) : [];
  const items: SwipeItem[] = [];
  for (const raw of rawResults) {
    if (!raw || typeof raw !== 'object') continue;
    const mapped = mapRawItem(raw, kind, genres);
    if (mapped) items.push(mapped);
  }

  const resolvedPage =
    typeof trending?.page === 'number' && trending.page >= 1 ? trending.page : requestedPage;
  const totalPages =
    typeof trending?.total_pages === 'number' && trending.total_pages >= 0
      ? trending.total_pages
      : resolvedPage;

  return { items, page: resolvedPage, totalPages };
}
