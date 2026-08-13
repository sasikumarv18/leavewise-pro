import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/student")({
  component: () => (
    <RoleGate allow="STUDENT">
      <Outlet />
    </RoleGate>
  ),
});
