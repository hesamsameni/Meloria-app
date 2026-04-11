import type { createApiService } from "./api";

export const createBillingService = (
  api: ReturnType<typeof createApiService>,
) => {
  const checkout = async (plan: string): Promise<{ url: string }> => {
    return api.call<{ url: string }>("/billing/checkout", {
      method: "POST",
      body: { plan },
    });
  };

  const portal = async (): Promise<{ url: string }> => {
    return api.call<{ url: string }>("/billing/portal", { method: "POST" });
  };

  return { checkout, portal };
};
