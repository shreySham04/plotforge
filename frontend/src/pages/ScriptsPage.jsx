import { useMemo } from "react";
import DashboardPage from "./DashboardPage";

export default function ScriptsPage() {
  const filters = useMemo(() => ({ onlyType: "SCRIPT", heading: "Script Projects" }), []);
  return <DashboardPage mode={filters} />;
}
