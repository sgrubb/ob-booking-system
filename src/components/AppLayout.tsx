import { useState, useEffect, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Settings } from "lucide-react";
import { SeasonProvider } from "@/context/SeasonContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Spinner } from "@/components/ui/spinner";
import { ipc } from "@/lib/ipc";

const NAV_ITEMS = [
  { to: "/bookings", label: "Bookings" },
  { to: "/calendar", label: "Calendar" },
  { to: "/members", label: "Members" },
  { to: "/contacts", label: "Contacts" },
  { to: "/statistics", label: "Statistics" },
  { to: "/archive", label: "Archive" },
] as const;

function AppLayout() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    ipc.getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="flex w-52 flex-col border-r bg-muted/40">
        <div className="p-4">
          <h1 className="text-base font-bold leading-tight">RFP OB Bookings</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-2 pb-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`
            }
          >
            <Settings size={13} />
            Settings
          </NavLink>
        </div>
        {version && (
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">v{version}</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-hidden flex flex-col p-6">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex justify-center py-8"><Spinner /></div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function AppLayoutWithProviders() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
      <SeasonProvider>
        <AppLayout />
      </SeasonProvider>
    </Suspense>
  );
}
