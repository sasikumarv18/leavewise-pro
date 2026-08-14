import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/subadmin")({
  component: () => (
    <RoleGate allow="SUB_ADMIN">
      <Outlet />
    </RoleGate>
  ),
});
