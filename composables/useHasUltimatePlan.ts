import { computed } from "vue";
import { useProfile } from "~/composables/useProfile";

export function useHasUltimatePlan() {
  const { profile } = useProfile();
  return computed(() => profile.value?.subscription === "ultimate");
}
