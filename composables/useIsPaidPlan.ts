import { computed } from "vue";
import { useProfile } from "~/composables/useProfile";

export function useIsPaidPlan() {
  const { profile } = useProfile();
  return computed(() => (profile.value?.subscription || "free") !== "free");
}
