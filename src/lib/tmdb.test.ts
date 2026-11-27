/// <reference types="bun" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  clearTmdbGenreCache,
  fetchTrending,
  isTmdbConfigured,
  TMDB_IMAGE_BASE,
  TmdbConfigError,
} from './tmdb';

const savedEnv = {
  readToken: process.env.EXPO_PUBLIC_TMDB_READ_TOKEN,
  apiKey: process.env.EXPO_PUBLIC_TMDB_API_KEY,
  language: process.env.EXPO_PUBLIC_TMDB_LANGUAGE,
};

function restoreEnv() {
  if (savedEnv.readToken === undefined) delete process.env.EXPO_PUBLIC_TMDB_READ_TOKEN;
  else process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = savedEnv.readToken;

  if (savedEnv.apiKey === undefined) delete process.env.EXPO_PUBLIC_TMDB_API_KEY;
  else process.env.EXPO_PUBLIC_TMDB_API_KEY = savedEnv.apiKey;

  if (savedEnv.language === undefined) delete process.env.EXPO_PUBLIC_TMDB_LANGUAGE;
  else process.env.EXPO_PUBLIC_TMDB_LANGUAGE = savedEnv.language;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_TMDB_READ_TOKEN;
  delete process.env.EXPO_PUBLIC_TMDB_API_KEY;
  delete process.env.EXPO_PUBLIC_TMDB_LANGUAGE;
  clearTmdbGenreCache();
});

afterEach(() => {
  restoreEnv();
  clearTmdbGenreCache();
});

describe('TMDB configuration & authentication', () => {
  test('throws TmdbConfigError when neither credential is configured', async () => {
    expect(isTmdbConfigured()).toBe(false);
    let called = false;
    const fakeFetch = (async () => {
      called = true;
      return jsonResponse({});
    }) as unknown as typeof fetch;

    await expect(fetchTrending('movie', 1, { fetchImpl: fakeFetch })).rejects.toBeInstanceOf(
      TmdbConfigError,
    );
    expect(called).toBe(false);
  });

  test('uses Bearer token header when EXPO_PUBLIC_TMDB_READ_TOKEN is set (preferred over API key)', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'test-bearer-token';
    process.env.EXPO_PUBLIC_TMDB_API_KEY = 'unused-v3-key';
    expect(isTmdbConfigured()).toBe(true);

    const calls: Array<{ url: URL; headers: Record<string, string> }> = [];
    const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
      if (url.pathname.includes('/genre/')) {
        return jsonResponse({ genres: [{ id: 28, name: 'Action' }] });
      }
      return jsonResponse({ page: 1, total_pages: 5, results: [] });
    }) as unknown as typeof fetch;

    await fetchTrending('movie', 1, { fetchImpl: fakeFetch });

    expect(calls.length).toBe(2);
    for (const call of calls) {
      expect(call.headers.Authorization).toBe('Bearer test-bearer-token');
      expect(call.url.searchParams.has('api_key')).toBe(false);
    }
    const trendingCall = calls.find((c) => c.url.pathname === '/3/trending/movie/week');
    expect(trendingCall).toBeDefined();
    expect(trendingCall?.url.searchParams.get('language')).toBe('en-US');
    expect(trendingCall?.url.searchParams.get('page')).toBe('1');
  });

  test('falls back to api_key query param when only EXPO_PUBLIC_TMDB_API_KEY is set', async () => {
    process.env.EXPO_PUBLIC_TMDB_API_KEY = 'v3-api-key-123';
    expect(isTmdbConfigured()).toBe(true);

    const calls: Array<{ url: URL; headers: Record<string, string> }> = [];
    const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
      if (url.pathname.includes('/genre/')) {
        return jsonResponse({ genres: [] });
      }
      return jsonResponse({ page: 2, total_pages: 10, results: [] });
    }) as unknown as typeof fetch;

    await fetchTrending('tv', 2, { fetchImpl: fakeFetch, language: 'fr-FR' });

    expect(calls.length).toBe(2);
    for (const call of calls) {
      expect(call.headers.Authorization).toBeUndefined();
      expect(call.url.searchParams.get('api_key')).toBe('v3-api-key-123');
      expect(call.url.searchParams.get('language')).toBe('fr-FR');
    }
    const trendingCall = calls.find((c) => c.url.pathname === '/3/trending/tv/week');
    expect(trendingCall?.url.searchParams.get('page')).toBe('2');
  });
});

describe('TMDB payload mapping & pagination', () => {
  test('maps movie trending results with genres, year, rating, poster/backdrop/null images, and fallback overview', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';

    const fakeFetch = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === '/3/genre/movie/list') {
        return jsonResponse({
          genres: [
            { id: 878, name: 'Sci-Fi' },
            { id: 12, name: 'Adventure' },
            { id: 18, name: 'Drama' },
          ],
        });
      }
      return jsonResponse({
        page: 2,
        total_pages: 42,
        results: [
          {
            id: 693134,
            title: 'Dune: Part Two',
            original_title: 'Dune: Part Two',
            overview: '  Follow the mythic journey of Paul Atreides.  ',
            genre_ids: [878, 12, 18],
            release_date: '2024-02-27',
            vote_average: 8.16,
            poster_path: '/poster.jpg',
            backdrop_path: '/backdrop.jpg',
          },
          {
            id: 101,
            title: '',
            original_title: 'Fallback Title',
            overview: '   ',
            genre_ids: [999999, 18],
            release_date: '1999-05-01',
            vote_average: 0,
            poster_path: null,
            backdrop_path: '/only-backdrop.jpg',
          },
          {
            id: 102,
            title: 'No Art Movie',
            overview: 'Minimal metadata.',
            genre_ids: [],
            release_date: '',
            vote_average: 7.0,
            poster_path: null,
            backdrop_path: null,
          },
          {
            id: 103,
            title: '   ',
            original_title: '',
            overview: 'Should be skipped because title is empty.',
          },
        ],
      });
    }) as unknown as typeof fetch;

    const result = await fetchTrending('movie', 2, { fetchImpl: fakeFetch });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(42);
    expect(result.items).toHaveLength(3);

    expect(result.items[0]).toEqual({
      id: 'tmdb:movie:693134',
      external_id: 'tmdb:movie:693134',
      kind: 'movie',
      title: 'Dune: Part Two',
      description: 'Follow the mythic journey of Paul Atreides.',
      tags: ['Sci-Fi', 'Adventure', '2024', '★ 8.2'],
      icon: 'film-outline',
      image_url: `${TMDB_IMAGE_BASE}/w500/poster.jpg`,
      sort_order: 0,
    });

    expect(result.items[1]).toEqual({
      id: 'tmdb:movie:101',
      external_id: 'tmdb:movie:101',
      kind: 'movie',
      title: 'Fallback Title',
      description: 'Trending on TMDB this week.',
      tags: ['Drama', '1999'],
      icon: 'film-outline',
      image_url: `${TMDB_IMAGE_BASE}/w780/only-backdrop.jpg`,
      sort_order: 0,
    });

    expect(result.items[2]).toEqual({
      id: 'tmdb:movie:102',
      external_id: 'tmdb:movie:102',
      kind: 'movie',
      title: 'No Art Movie',
      description: 'Minimal metadata.',
      tags: ['★ 7.0'],
      icon: 'film-outline',
      image_url: null,
      sort_order: 0,
    });
  });

  test('maps TV trending results and falls back to static genre map when genre fetch fails', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';

    const fakeFetch = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === '/3/genre/tv/list') {
        return jsonResponse({ status_message: 'Service down' }, 503);
      }
      return jsonResponse({
        page: 1,
        total_pages: 8,
        results: [
          {
            id: 95396,
            name: 'Severance',
            original_name: 'Severance',
            overview: 'Work-life balance taken to the extreme.',
            genre_ids: [18, 9648, 10765],
            first_air_date: '2022-02-18',
            vote_average: 8.41,
            poster_path: '/severance.jpg',
            backdrop_path: '/sev-bg.jpg',
          },
          {
            id: 202,
            name: '',
            original_name: 'Shogun',
            overview: '',
            genre_ids: [10759],
            first_air_date: '2024-02-27',
            vote_average: 8.6,
            poster_path: null,
            backdrop_path: null,
          },
        ],
      });
    }) as unknown as typeof fetch;

    const result = await fetchTrending('tv', 1, { fetchImpl: fakeFetch });

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(8);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: 'tmdb:tv:95396',
      external_id: 'tmdb:tv:95396',
      kind: 'tv',
      title: 'Severance',
      description: 'Work-life balance taken to the extreme.',
      tags: ['Drama', 'Mystery', '2022', '★ 8.4'],
      icon: 'tv-outline',
      image_url: `${TMDB_IMAGE_BASE}/w500/severance.jpg`,
      sort_order: 0,
    });
    expect(result.items[1].title).toBe('Shogun');
    expect(result.items[1].tags).toEqual(['Action & Adventure', '2024', '★ 8.6']);
    expect(result.items[1].description).toBe('Trending on TMDB this week.');
    expect(result.items[1].image_url).toBeNull();
  });

  test('caches genre list in memory across calls', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';
    let genreCalls = 0;

    const fakeFetch = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === '/3/genre/movie/list') {
        genreCalls += 1;
        return jsonResponse({ genres: [{ id: 35, name: 'Comedy' }] });
      }
      return jsonResponse({ page: 1, total_pages: 3, results: [] });
    }) as unknown as typeof fetch;

    await fetchTrending('movie', 1, { fetchImpl: fakeFetch });
    await fetchTrending('movie', 2, { fetchImpl: fakeFetch });

    expect(genreCalls).toBe(1);
  });
});

describe('TMDB error handling', () => {
  test('throws descriptive error on 401 unauthorized', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'bad-token';
    const fakeFetch = (async () =>
      jsonResponse({ status_message: 'Invalid API key' }, 401)) as unknown as typeof fetch;

    await expect(fetchTrending('movie', 1, { fetchImpl: fakeFetch })).rejects.toThrow(/401/);
  });

  test('throws descriptive error on 429 rate limit', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';
    const fakeFetch = (async () => jsonResponse({}, 429)) as unknown as typeof fetch;

    await expect(fetchTrending('tv', 1, { fetchImpl: fakeFetch })).rejects.toThrow(/429/);
  });

  test('throws descriptive error on 500 server error', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';
    const fakeFetch = (async () =>
      jsonResponse({ status_message: 'Internal error' }, 500)) as unknown as typeof fetch;

    await expect(fetchTrending('movie', 1, { fetchImpl: fakeFetch })).rejects.toThrow(
      /500.*Internal error/,
    );
  });

  test('throws descriptive error on network failure', async () => {
    process.env.EXPO_PUBLIC_TMDB_READ_TOKEN = 'token';
    const fakeFetch = (async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;

    await expect(fetchTrending('movie', 1, { fetchImpl: fakeFetch })).rejects.toThrow(
      /Unable to reach TMDB.*ECONNRESET/,
    );
  });
});
