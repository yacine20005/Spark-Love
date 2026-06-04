import { supabase } from '../lib/supabase';
import { Movie, MovieSwipe, SwipeType } from '../types/movies';

export class MovieService {
  /**
   * Fetches all movies from the database.
   */
  static async getMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Inserts or updates a swipe for a movie.
   */
  static async swipeMovie(
    userId: string,
    coupleId: string,
    movieId: string,
    swipeType: SwipeType
  ): Promise<void> {
    const { error } = await supabase
      .from('movie_swipes')
      .upsert(
        {
          user_id: userId,
          couple_id: coupleId,
          movie_id: movieId,
          swipe_type: swipeType,
        },
        { onConflict: 'user_id,movie_id' }
      );

    if (error) {
      console.error('Error swiping movie:', error);
      throw error;
    }
  }

  /**
   * Fetches all swipes for a couple.
   */
  static async getSwipesForCouple(coupleId: string): Promise<MovieSwipe[]> {
    const { data, error } = await supabase
      .from('movie_swipes')
      .select('*')
      .eq('couple_id', coupleId);

    if (error) {
      console.error('Error fetching swipes for couple:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Computes which movie IDs have been swiped 'like' or 'super_like' by both users.
   */
  static async getMatches(coupleId: string): Promise<string[]> {
    const swipes = await this.getSwipesForCouple(coupleId);
    
    // Filter to likes & super likes
    const positiveSwipes = swipes.filter(
      s => s.swipe_type === 'like' || s.swipe_type === 'super_like'
    );

    // Group by movie_id and collect user_ids
    const movieUserMap: Record<string, Set<string>> = {};
    positiveSwipes.forEach(swipe => {
      if (!movieUserMap[swipe.movie_id]) {
        movieUserMap[swipe.movie_id] = new Set<string>();
      }
      movieUserMap[swipe.movie_id].add(swipe.user_id);
    });

    // A movie matches if at least 2 distinct users have liked it in this couple
    const matches: string[] = [];
    Object.entries(movieUserMap).forEach(([movieId, users]) => {
      if (users.size >= 2) {
        matches.push(movieId);
      }
    });

    return matches;
  }
}
