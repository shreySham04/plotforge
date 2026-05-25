import { useMemo } from "react";
import DashboardPage from "./DashboardPage";

export default function StoriesPage() {
  const filters = useMemo(
    () => ({
      onlyType: "STORY",
      heading: "Story Projects",
      description: "Dream big, draft boldly. Build your world one chapter at a time and give readers a reason to stay up late.",
      showPublicLists: true
    }),
    []
  );
  return <DashboardPage mode={filters} />;
}
