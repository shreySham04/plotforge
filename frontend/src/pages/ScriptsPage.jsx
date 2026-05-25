import { useMemo } from "react";
import DashboardPage from "./DashboardPage";

export default function ScriptsPage() {
  const filters = useMemo(
    () => ({
      onlyType: "SCRIPT",
      heading: "Script Projects",
      description: "Light up the scene and block the moments. Write the beats, the dialogue, and the cinematic magic.",
      showPublicLists: true
    }),
    []
  );
  return <DashboardPage mode={filters} />;
}
