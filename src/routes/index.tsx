import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CalendarCheck,
  GraduationCap,
  ShieldCheck,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Leave — College Leave Management System" },
      {
        name: "description",
        content:
          "Apply for and approve student leave online. Role-based portal for students, sub-admins and administrators with notifications and leave tracking.",
      },
      { property: "og:title", content: "Campus Leave — College Leave Management System" },
      {
        property: "og:description",
        content:
          "A secure leave management portal for hostellers and day scholars with sub-admin approvals and instant notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Apply in seconds",
    body: "Pick your dates and the system counts the days, generates a tracking ID and files the request.",
  },
  {
    icon: ClipboardCheck,
    title: "Sub-Admin approvals",
    body: "Only sub-admins can approve or reject, with the student's full leave history on screen.",
  },
  {
    icon: BellRing,
    title: "Instant notifications",
    body: "Sub-admins are alerted on every new request; students hear back the moment it is reviewed.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Server-enforced rules mean a student can only ever see their own profile and applications.",
  },
];

function Landing() {
  const { session, role, loading } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="hero-gradient text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg accent-gradient text-accent-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-base font-semibold">Campus Leave</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && session ? (
              <Button asChild variant="secondary" size="sm">
                <Link to={homeForRole(role)}>My dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:items-center lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Users className="size-3.5" /> For hostellers &amp; day scholars
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
              College Leave Management, done properly.
            </h1>
            <p className="mt-4 max-w-lg text-sm/relaxed text-primary-foreground/80 sm:text-base/relaxed">
              One portal for students to apply, sub-admins to review and administrators to oversee
              every leave record across departments and classes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Student registration</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/staff-register">Staff registration</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card space-y-4 bg-card/95 p-6 text-foreground">
            <p className="font-display text-sm font-semibold">Leave request flow</p>
            {[
              "Student submits a leave request",
              "Status is set to Pending",
              "Sub-Admin is notified instantly",
              "Sub-Admin reviews history and decides",
              "Student is notified of the outcome",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="font-display text-2xl font-semibold">Built for the whole campus</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Campus Leave · College Leave Management System</p>
          <Link to="/setup" className="hover:text-foreground">
            First-time administrator setup
          </Link>
        </div>
      </footer>
    </div>
  );
}
