import { createApiService } from "~/services/api";

export const useApiService = () => {
  const config = useRuntimeConfig();
  const { getToken } = useAuth();
  return createApiService(config.public.apiUrl, getToken);
};
