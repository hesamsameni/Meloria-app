import type { createApiService } from "./api";

export type SubscriptionTier = "free" | "pro" | "ultimate" | string;

export type UserProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  subscription: SubscriptionTier;
  preferred_model: string;
  display_name: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const createProfileService = (
  api: ReturnType<typeof createApiService>,
) => {
  const getProfile = async (): Promise<UserProfile> => {
    return api.call<UserProfile>("/profile", { method: "GET" });
  };

  const updateProfile = async (payload: {
    display_name?: string | null;
    username?: string | null;
    preferred_model?: string;
  }): Promise<UserProfile> => {
    return api.call<UserProfile>("/profile", {
      method: "PATCH",
      body: payload,
    });
  };

  const uploadAvatar = async (file: File): Promise<UserProfile> => {
    const form = new FormData();
    form.append("file", file);

    return api.call<UserProfile>("/profile/avatar", {
      method: "POST",
      body: form,
      headers: {},
    });
  };

  return { getProfile, updateProfile, uploadAvatar };
};
