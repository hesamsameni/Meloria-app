// Base API caller — all requests to your Node.js backend go through here.
// Automatically attaches the Supabase session token.

export const createApiService = (
  apiUrl: string,
  getToken: () => Promise<string | null>,
) => {
  const call = async <T>(
    path: string,
    options: Record<string, any> = {},
  ): Promise<T> => {
    const token = await getToken();

    const isFormData =
      typeof FormData !== "undefined" && options?.body instanceof FormData;

    const mergedHeaders = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    return $fetch<T>(`${apiUrl}${path}`, {
      ...options,
      headers: {
        ...mergedHeaders,
      },
    });
  };

  return { call };
};
