export function useGlobalToast() {
  const toast = useToast();

  function success(title: string, description?: string) {
    toast.add({ title, description, color: "success" });
  }

  function error(title: string, description?: string) {
    toast.add({ title, description, color: "error" });
  }

  function info(title: string, description?: string) {
    toast.add({ title, description, color: "primary" });
  }

  return { ...toast, success, error, info };
}
