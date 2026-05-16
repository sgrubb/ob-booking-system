import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useSeason } from "@/context/SeasonContext";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

export default function ArchivePage() {
  const { selectedSeasonId } = useSeason();

  const params = {
    ...(selectedSeasonId ? { seasonId: selectedSeasonId } : {}),
    filters: { cancelled: true },
  };

  const { data: bookings } = useSuspenseQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => ipc.listBookings(params),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader>
        <h2 className="text-2xl font-bold">Cancelled Bookings</h2>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No cancelled bookings.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Ref</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Event</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Reason</th>
                <th className="pb-2 font-medium text-muted-foreground">Cancelled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/50 opacity-70">
                  <td className="py-2 pr-4">
                    <Link to={`/bookings/${booking.id}`} className="font-mono font-medium hover:underline">
                      {booking.bookingRef}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(new Date(booking.date))}</td>
                  <td className="py-2 pr-4">{booking.eventName}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {booking.cancelReason === "DOUBLE_ENTRY"
                      ? "Double Entry"
                      : booking.cancelReason === "EVENT_CANCELLED"
                        ? "Event Cancelled"
                        : "—"}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {booking.cancelledAt ? formatDate(new Date(booking.cancelledAt)) : "—"}
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
