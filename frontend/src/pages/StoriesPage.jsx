import { useMemo } from "react";
import DashboardPage from "./DashboardPage";

export default function StoriesPage() {
  const filters = useMemo(() => ({ onlyType: "STORY", heading: "Story Projects" }), []);
  return <DashboardPage mode={filters} />;
}
