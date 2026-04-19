import type { createApiService } from "./api";

export type TasteProfileData = {
  summary: string;
  movies: {
    favourite_genres: string[];
    favourite_directors: string[];
    favourite_eras: string[];
    patterns: string;
    reflection_themes?: string;
  } | null;
  music: {
    favourite_genres: string[];
    favourite_artists: string[];
    patterns: string;
    reflection_themes?: string;
  } | null;
  books: {
    favourite_genres: string[];
    favourite_authors: string[];
    patterns: string;
    reflection_themes?: string;
  } | null;
  shows: {
    favourite_genres: string[];
    patterns: string;
    reflection_themes?: string;
  } | null;
  aspiration_vs_reality?: string;
  personality_traits?: string[];
  cross_category_insights: string[];
  capture_behaviour: {
    most_active_source: string;
    peak_capture_time: string;
    total_items: number;
    completion_rate: number;
  };
};

export type TasteProfile = {
  id: string;
  user_id: string;
  summary: string | null;
  profile: TasteProfileData | null;
  item_count: number;
  generated_at: string;
  updated_at: string;
};

export const createTasteProfileService = (
  api: ReturnType<typeof createApiService>,
) => {
  const getTasteProfile = async (): Promise<TasteProfile> => {
    return api.call<TasteProfile>("/taste-profile", { method: "GET" });
  };

  const generateTasteProfile = async (): Promise<{
    ok: boolean;
    profile: TasteProfileData;
  }> => {
    return api.call("/taste-profile/generate", { method: "POST" });
  };

  return { getTasteProfile, generateTasteProfile };
};
