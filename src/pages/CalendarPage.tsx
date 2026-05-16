import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useSeason } from "@/context/SeasonContext";
import { formatDate } from "@/lib/utils";
import { RagBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

export default function CalendarPage() {
  const { selectedSeasonId } = useSeason();
  const navigate = useNavigate();

  const params = {
    ...(selectedSeasonId ? { seasonId: selectedSeasonId } : {}),
    filters: { cancelled: false },
  };

  const { data: bookings } = useSuspenseQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => ipc.listBookings(params),
  });

  const byMonth = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const date = new Date(b.date);
    const key = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!byMonth.has(key)) {
      byMonth.set(key, []);
    }
    byMonth.get(key)!.push(b);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader>
        <h2 className="text-2xl font-bold">Calendar</h2>
      </PageHeader>

      <div className="flex-1 overflow-auto space-y-6">
        {byMonth.size === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No bookings this season.</p>
        ) : (
          Array.from(byMonth.entries()).map(([month, monthBookings]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{month}</h3>
              <div className="space-y-1">
                {monthBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    className="w-full text-left rounded-md border bg-card px-4 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-20">
                        {new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="font-medium text-sm flex-1">{b.eventName}</span>
                      {b.venue && (
                        <span className="text-xs text-muted-foreground">{b.venue}</span>
                      )}
                      <RagBadge status={b.ragStatus} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
