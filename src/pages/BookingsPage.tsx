import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useSeason } from "@/context/SeasonContext";
import { formatDate, formatCurrency } from "@/lib/utils";
import { RAG_STATUS_LABELS, BOOKING_STATUS_LABELS } from "@/lib/labels";
import { RagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function BookingsPage() {
  const { selectedSeasonId } = useSeason();
  const [showCancelled, setShowCancelled] = useState(false);

  const params = {
    ...(selectedSeasonId ? { seasonId: selectedSeasonId } : {}),
    filters: { cancelled: showCancelled ? undefined : false },
  };

  const { data: bookings } = useSuspenseQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => ipc.listBookings(params),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bookings</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="rounded"
              />
              Show cancelled
            </label>
            <Button asChild size="sm">
              <Link to="/bookings/new">
                <Plus size={14} />
                New Booking
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No bookings found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Ref</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Event</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Venue</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Leader</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">RAG</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className={`hover:bg-muted/50 ${booking.cancelledAt ? "opacity-50" : ""}`}
                >
                  <td className="py-2 pr-4">
                    <Link to={`/bookings/${booking.id}`} className="font-mono font-medium hover:underline">
                      {booking.bookingRef}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(new Date(booking.date))}</td>
                  <td className="py-2 pr-4">{booking.eventName}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{booking.venue ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {booking.teamLeader
                      ? `${booking.teamLeader.firstName} ${booking.teamLeader.lastName}`
                      : <span className="text-muted-foreground">TBC</span>}
                  </td>
                  <td className="py-2 pr-4">
                    <RagBadge status={booking.ragStatus} />
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {booking.cancelledAt
                      ? "Cancelled"
                      : booking.bookingStatus
                        ? BOOKING_STATUS_LABELS[booking.bookingStatus] ?? booking.bookingStatus
                        : "—"}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(booking.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
