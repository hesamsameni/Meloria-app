// Base API caller — all requests to your Node.js backend go through here.
// Automatically attaches the Supabase session token.

export const createApiService = (
  apiUrl: string,
  getToken: () => Promise<string | null>,
) => {
  let _cachedToken: string | null = null;
  let _tokenExpiry = 0;
  let _tokenPromise: Promise<string | null> | null = null;

  const getValidToken = (): Promise<string | null> => {
    const now = Date.now();
    if (_cachedToken && now < _tokenExpiry)
      return Promise.resolve(_cachedToken);
    if (!_tokenPromise) {
      _tokenPromise = getToken().then((t) => {
        _cachedToken = t;
        _tokenExpiry = Date.now() + 50_000;
        _tokenPromise = null;
        return t;
      });
    }
    return _tokenPromise;
  };

  const call = async <T>(
    path: string,
    options: Record<string, any> = {},
  ): Promise<T> => {
    const token = await getValidToken();

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

  // For SSE / streaming responses — returns the raw Response so the caller can
  // read the body as a ReadableStream. Uses native fetch (not $fetch).
  const fetchStream = async (
    path: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    const token = await getValidToken();
    return fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  };

  return { call, fetchStream };
};
