export const usePageHeader = () => {
  const title = useState<string>("page-header-title", () => "");
  const description = useState<string>("page-header-description", () => "");

  const setPageHeader = (nextTitle: string, nextDescription = "") => {
    title.value = nextTitle;
    description.value = nextDescription;
  };

  return {
    title,
    description,
    setPageHeader,
  };
};
