import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RoleGate allow="ADMIN">
      <Outlet />
    </RoleGate>
  ),
});
