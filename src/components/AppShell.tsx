import {
  UserCheck, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookMarked,
  CalendarPlus,
  ClipboardList,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<AppRole, NavItem[]> = {
  STUDENT: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/apply", label: "Apply Leave", icon: CalendarPlus },
    { to: "/student/leaves", label: "My Leave History", icon: FileClock },
    { to: "/student/profile", label: "My Profile", icon: UserCog },
  ],
  SUB_ADMIN: [
    { to: "/subadmin", label: "Dashboard", icon: BarChart3 },
    { to: "/subadmin/requests", label: "Leave Requests", icon: ClipboardList },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard", icon: BarChart3 },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/subadmins", label: "Sub-Admins", icon: ShieldCheck },
    { to: "/admin/requests", label: "Access Requests", icon: UserCheck },
    { to: "/admin/leaves", label: "Leave Applications", icon: ClipboardList },
    { to: "/admin/departments", label: "Departments", icon: BookMarked },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "Administrator",
  SUB_ADMIN: "Sub-Admin",
  STUDENT: "Student",
};

function NavLinks({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV[role].map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
      <span className="grid size-9 place-items-center rounded-lg accent-gradient text-accent-foreground">
        <GraduationCap className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">
          Campus Leave
        </p>
        <p className="text-xs text-sidebar-foreground/70">Management Portal</p>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    refetchInterval: 20_000,
    queryFn: async () => {
      const res = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (res.error) throw res.error;
      return res.data;
    },
  });
  const items = data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  async function markRead(id?: string) {
    const q = supabase.from("notifications").update({ is_read: true });
    await (id ? q.eq("id", id) : q.eq("is_read", false));
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,90vw)] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => void markRead()}
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => void markRead(n.id)}
              className={`block w-full border-b border-border/60 px-3 py-3 text-left last:border-0 hover:bg-muted/60 ${
                n.is_read ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  role,
  title,
  description,
  children,
}: {
  role: AppRole;
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-sidebar lg:block">
        <div className="sticky top-0">
          <Brand />
          <NavLinks role={role} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavLinks role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:bg-muted">
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground uppercase">
                  {initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-32 truncate text-xs font-semibold">
                    {profile?.full_name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {ROLE_LABEL[role]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "STUDENT" && (
                <DropdownMenuItem onClick={() => void navigate({ to: "/student/profile" })}>
                  <UserCog className="mr-2 size-4" /> My Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => void handleSignOut()}>
                <LogOut className="mr-2 size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
