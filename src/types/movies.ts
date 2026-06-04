export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  year: number;
  duration: string;
  poster_url: string | null;
  created_at: string;
}

export type SwipeType = 'like' | 'dislike' | 'super_like';

export interface MovieSwipe {
  id: string;
  user_id: string;
  couple_id: string;
  movie_id: string;
  swipe_type: SwipeType;
  created_at: string;
}
