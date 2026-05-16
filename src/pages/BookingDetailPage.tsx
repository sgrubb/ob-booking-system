import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Pencil, Copy, FileText, Receipt, XCircle } from "lucide-react";
import { ipc, IpcError } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, formatCurrency } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, OB_UNIT_LABELS, CANCEL_REASON_LABELS } from "@/lib/labels";
import { RagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CancelReason } from "@shared/types/enums";
import log from "@/lib/logger";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CancelReason.EVENT_CANCELLED);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const { data: booking } = useSuspenseQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => ipc.getBooking(bookingId),
  });

  async function handleClone() {
    try {
      const cloned = await ipc.cloneBooking(bookingId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.root });
      navigate(`/bookings/${cloned.id}/edit`);
    } catch (err) {
      log.error("Clone failed:", err);
    }
  }

  async function handleExportBookingForm() {
    try {
      await ipc.exportBookingForm(bookingId);
    } catch (err) {
      log.error("Export booking form failed:", err);
    }
  }

  async function handleExportInvoice() {
    try {
      await ipc.exportInvoice(bookingId);
    } catch (err) {
      log.error("Export invoice failed:", err);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await ipc.cancelBooking(bookingId, {
        cancelReason: cancelReason as "DOUBLE_ENTRY" | "EVENT_CANCELLED",
        cancelNote: cancelNote || null,
        updatedAt: new Date(booking.updatedAt),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.root });
      setShowCancelDialog(false);
    } catch (err) {
      log.error("Cancel failed:", err);
    } finally {
      setCancelling(false);
    }
  }

  const isCancelled = !!booking.cancelledAt;

  return (
    <div className="flex h-full flex-col gap-6 max-w-2xl overflow-auto">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <Link to="/bookings" className="text-sm text-muted-foreground hover:underline">
              ← Bookings
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold font-mono">{booking.bookingRef}</h2>
              <RagBadge status={booking.ragStatus} />
              {isCancelled && (
                <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  Cancelled
                </span>
              )}
            </div>
          </div>
          {!isCancelled && (
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/bookings/${bookingId}/edit`}>
                  <Pencil size={14} />
                  Edit
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={handleClone} title="Repeat booking">
                <Copy size={14} />
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportBookingForm} title="Booking form PDF">
                <FileText size={14} />
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportInvoice} title="Invoice PDF">
                <Receipt size={14} />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setShowCancelDialog(true)}>
                <XCircle size={14} />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-6">
        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Event</h3>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Event name", value: booking.eventName },
              { label: "Date", value: formatDate(new Date(booking.date)) },
              { label: "Setup time", value: booking.setupTime },
              { label: "Event start", value: booking.eventTimeStart },
              { label: "Event end", value: booking.eventTimeEnd },
              { label: "Venue", value: booking.venue ?? "—" },
              { label: "Location", value: booking.location ?? "—" },
              { label: "OB Unit", value: OB_UNIT_LABELS[booking.obUnit] ?? booking.obUnit },
              { label: "Season", value: booking.season.name },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Team</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 text-muted-foreground shrink-0">Team Leader</dt>
              <dd>
                {booking.teamLeader
                  ? (
                    <Link to={`/members/${booking.teamLeader.id}`} className="hover:underline">
                      {booking.teamLeader.firstName} {booking.teamLeader.lastName}
                    </Link>
                  )
                  : <span className="text-muted-foreground">TBC</span>}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 text-muted-foreground shrink-0">Helpers</dt>
              <dd>
                {booking.helpers.length === 0
                  ? <span className="text-muted-foreground">None assigned</span>
                  : booking.helpers.map((h) => (
                    <div key={h.id}>
                      <Link to={`/members/${h.memberId}`} className="hover:underline">
                        {h.member.firstName} {h.member.lastName}
                      </Link>
                    </div>
                  ))}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 text-muted-foreground shrink-0">Required size</dt>
              <dd>{booking.requiredTeamSize}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 text-muted-foreground shrink-0">Generator</dt>
              <dd>{booking.generatorRequired ? "Required" : "Not required"}</dd>
            </div>
            {booking.doubleBooking && (
              <div className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">Note</dt>
                <dd className="text-yellow-700">Double booking</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Fees</h3>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Event fee", value: formatCurrency(booking.fee) },
              ...(booking.generatorRequired ? [{ label: "Generator fee", value: formatCurrency(booking.generatorFee) }] : []),
              { label: "Total", value: formatCurrency(booking.total) },
              { label: "Deposit", value: formatCurrency(booking.deposit) },
              { label: "Balance", value: formatCurrency(booking.balance) },
              ...(booking.bookingStatus ? [{ label: "Payment status", value: BOOKING_STATUS_LABELS[booking.bookingStatus] ?? booking.bookingStatus }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">{label}</dt>
                <dd className="font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {booking.contact && (
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 text-muted-foreground shrink-0">Name</dt>
                <dd>
                  <Link to={`/contacts/${booking.contact.id}`} className="hover:underline">
                    {booking.contact.name}
                  </Link>
                </dd>
              </div>
              {booking.contact.tel && <div className="flex gap-3"><dt className="w-24 text-muted-foreground shrink-0">Tel</dt><dd>{booking.contact.tel}</dd></div>}
              {booking.contact.mobile && <div className="flex gap-3"><dt className="w-24 text-muted-foreground shrink-0">Mobile</dt><dd>{booking.contact.mobile}</dd></div>}
              {booking.contact.email && <div className="flex gap-3"><dt className="w-24 text-muted-foreground shrink-0">Email</dt><dd>{booking.contact.email}</dd></div>}
            </dl>
          </section>
        )}

        {booking.comments && (
          <section className="col-span-2 space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Comments</h3>
            <p className="text-sm whitespace-pre-line">{booking.comments}</p>
          </section>
        )}

        {isCancelled && (
          <section className="col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <h3 className="font-semibold text-sm text-destructive">Cancellation</h3>
            <p className="text-sm">
              <span className="text-muted-foreground">Reason: </span>
              {booking.cancelReason ? CANCEL_REASON_LABELS[booking.cancelReason] : "—"}
            </p>
            {booking.cancelNote && (
              <p className="text-sm">
                <span className="text-muted-foreground">Note: </span>
                {booking.cancelNote}
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Cancelled: </span>
              {booking.cancelledAt ? formatDate(new Date(booking.cancelledAt)) : "—"}
            </p>
          </section>
        )}
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg border shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold">Cancel Booking</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CancelReason.EVENT_CANCELLED}>Event Cancelled</SelectItem>
                  <SelectItem value={CancelReason.DOUBLE_ENTRY}>Double Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <input
                type="text"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                className="border-input flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                placeholder="Additional notes…"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="flex-1">
                {cancelling ? "Cancelling…" : "Confirm Cancel"}
              </Button>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
