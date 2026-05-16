import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ipc, IpcError } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useSeason } from "@/context/SeasonContext";
import { useFormState, FormState } from "@/hooks/use-form-state";
import { createBookingSchema } from "@shared/schemas/bookings";
import { RagStatus, BookingStatus, ObUnit } from "@shared/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { SaveErrorAlert } from "@/components/ui/save-error-alert";
import { PageHeader } from "@/components/ui/page-header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IpcErrorCode } from "@shared/types/ipc";
import { sortableName } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, OB_UNIT_LABELS } from "@/lib/labels";
import log from "@/lib/logger";

const EMPTY = {
  bookingRef: "",
  seasonId: 0,
  date: "",
  setupTime: "",
  eventTimeStart: "",
  eventTimeEnd: "",
  eventName: "",
  venue: "",
  location: "",
  ragStatus: RagStatus.RED as string,
  bookingStatus: "" as string,
  obUnit: ObUnit.OB_WAGON as string,
  doubleBooking: false,
  generatorRequired: false,
  requiredTeamSize: 3,
  teamLeaderId: "" as string,
  helperIds: [] as string[],
  contactId: "" as string,
  fee: 0,
  generatorFee: 0,
  total: 0,
  deposit: 0,
  balance: 0,
  invoiceAddress: "",
  comments: "",
};

type FormFields = typeof EMPTY;

function BookingFormInner({ bookingId }: { bookingId?: number }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedSeasonId, activeSeason } = useSeason();
  const isEdit = bookingId !== undefined;

  const { data: existing } = useSuspenseQuery({
    queryKey: queryKeys.bookings.detail(bookingId ?? 0),
    queryFn: () => (bookingId ? ipc.getBooking(bookingId) : null),
    enabled: isEdit,
  });

  const { data: members } = useSuspenseQuery({
    queryKey: queryKeys.members.list({}),
    queryFn: () => ipc.listMembers({}),
  });

  const { data: contacts } = useSuspenseQuery({
    queryKey: queryKeys.contacts.list({}),
    queryFn: () => ipc.listContacts({}),
  });

  const { data: seasons } = useSuspenseQuery({
    queryKey: queryKeys.seasons.list(),
    queryFn: () => ipc.listSeasons(),
  });

  const {
    form, setForm, updatedAt, setUpdatedAt, setOriginalForm,
    formState, setFormState, saveError, setSaveError,
    validate, getError, markTouched, getConflictError, handleConflict,
  } = useFormState<FormFields>(createBookingSchema, EMPTY);

  const [isLoadingRef, setIsLoadingRef] = useState(false);

  useEffect(() => {
    if (existing) {
      const f: FormFields = {
        bookingRef: existing.bookingRef,
        seasonId: existing.seasonId,
        date: new Date(existing.date).toISOString().split("T")[0] ?? "",
        setupTime: existing.setupTime,
        eventTimeStart: existing.eventTimeStart,
        eventTimeEnd: existing.eventTimeEnd,
        eventName: existing.eventName,
        venue: existing.venue ?? "",
        location: existing.location ?? "",
        ragStatus: existing.ragStatus,
        bookingStatus: existing.bookingStatus ?? "",
        obUnit: existing.obUnit,
        doubleBooking: existing.doubleBooking,
        generatorRequired: existing.generatorRequired,
        requiredTeamSize: existing.requiredTeamSize,
        teamLeaderId: existing.teamLeaderId ? String(existing.teamLeaderId) : "",
        helperIds: existing.helpers.map((h) => String(h.memberId)),
        contactId: existing.contactId ? String(existing.contactId) : "",
        fee: existing.fee,
        generatorFee: existing.generatorFee,
        total: existing.total,
        deposit: existing.deposit,
        balance: existing.balance,
        invoiceAddress: existing.invoiceAddress ?? "",
        comments: existing.comments ?? "",
      };
      setForm(f);
      setOriginalForm(f);
      setUpdatedAt(new Date(existing.updatedAt));
    } else if (!isEdit && (selectedSeasonId || activeSeason)) {
      const seasonId = selectedSeasonId ?? activeSeason?.id ?? 0;
      setForm((p) => ({ ...p, seasonId }));
    }
  }, [existing, selectedSeasonId, activeSeason]);

  async function handleDateChange(dateStr: string) {
    setForm((p) => ({ ...p, date: dateStr }));
    if (!isEdit && dateStr && form.seasonId) {
      setIsLoadingRef(true);
      try {
        const ref = await ipc.getNextBookingRef(form.seasonId, dateStr);
        setForm((p) => ({ ...p, bookingRef: ref }));
      } catch {
        // non-critical
      } finally {
        setIsLoadingRef(false);
      }
    }
  }

  function recalcTotal() {
    setForm((p) => {
      const total = p.fee + (p.generatorRequired ? p.generatorFee : 0);
      return { ...p, total, balance: total - p.deposit };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setFormState(FormState.Saving);
    setSaveError(null);

    const payload = {
      date: new Date(form.date),
      setupTime: form.setupTime,
      eventTimeStart: form.eventTimeStart,
      eventTimeEnd: form.eventTimeEnd,
      eventName: form.eventName,
      venue: form.venue || null,
      location: form.location || null,
      ragStatus: form.ragStatus as "GREEN" | "RED",
      bookingStatus: form.bookingStatus as typeof BookingStatus[keyof typeof BookingStatus] | null || null,
      obUnit: form.obUnit as "OB_WAGON" | "SECOND_UNIT",
      doubleBooking: form.doubleBooking,
      generatorRequired: form.generatorRequired,
      requiredTeamSize: form.requiredTeamSize,
      teamLeaderId: form.teamLeaderId ? Number(form.teamLeaderId) : null,
      helperIds: form.helperIds.map(Number),
      contactId: form.contactId ? Number(form.contactId) : null,
      fee: form.fee,
      generatorFee: form.generatorFee,
      total: form.total,
      deposit: form.deposit,
      balance: form.balance,
      invoiceAddress: form.invoiceAddress || null,
      comments: form.comments || null,
    };

    try {
      if (isEdit && bookingId !== undefined) {
        await ipc.updateBooking(bookingId, { ...payload, updatedAt: updatedAt! });
        await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.root });
        navigate(`/bookings/${bookingId}`);
      } else {
        const created = await ipc.createBooking({
          bookingRef: form.bookingRef,
          seasonId: form.seasonId,
          ...payload,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.root });
        navigate(`/bookings/${created.id}`);
      }
    } catch (err) {
      log.error("Booking save failed:", err);
      if (err instanceof IpcError && err.code === IpcErrorCode.Conflict && bookingId) {
        await handleConflict(async () => {
          const fresh = await ipc.getBooking(bookingId);
          return {
            form: {
              bookingRef: fresh.bookingRef,
              seasonId: fresh.seasonId,
              date: new Date(fresh.date).toISOString().split("T")[0] ?? "",
              setupTime: fresh.setupTime,
              eventTimeStart: fresh.eventTimeStart,
              eventTimeEnd: fresh.eventTimeEnd,
              eventName: fresh.eventName,
              venue: fresh.venue ?? "",
              location: fresh.location ?? "",
              ragStatus: fresh.ragStatus,
              bookingStatus: fresh.bookingStatus ?? "",
              obUnit: fresh.obUnit,
              doubleBooking: fresh.doubleBooking,
              generatorRequired: fresh.generatorRequired,
              requiredTeamSize: fresh.requiredTeamSize,
              teamLeaderId: fresh.teamLeaderId ? String(fresh.teamLeaderId) : "",
              helperIds: fresh.helpers.map((h) => String(h.memberId)),
              contactId: fresh.contactId ? String(fresh.contactId) : "",
              fee: fresh.fee,
              generatorFee: fresh.generatorFee,
              total: fresh.total,
              deposit: fresh.deposit,
              balance: fresh.balance,
              invoiceAddress: fresh.invoiceAddress ?? "",
              comments: fresh.comments ?? "",
            },
            updated_at: new Date(fresh.updatedAt),
          };
        });
      } else {
        setSaveError(err instanceof IpcError ? err.message : "Failed to save.");
      }
      setFormState(FormState.Error);
      return;
    }
    setFormState(FormState.Idle);
  }

  const teamLeaderOptions = members
    .filter((m) => m.isTeamLeader)
    .map((m) => ({ value: String(m.id), label: sortableName(m.firstName, m.lastName) }));

  const helperOptions = members
    .filter((m) => !m.isTeamLeader)
    .map((m) => ({ value: String(m.id), label: sortableName(m.firstName, m.lastName) }));

  const contactOptions = [
    { value: "", label: "None" },
    ...contacts.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const seasonOptions = seasons.map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <div className="flex h-full flex-col gap-6 max-w-2xl overflow-auto">
      <PageHeader>
        <div>
          <Link
            to={isEdit ? `/bookings/${bookingId}` : "/bookings"}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {isEdit ? "Back" : "Bookings"}
          </Link>
          <h2 className="text-2xl font-bold mt-1">{isEdit ? "Edit Booking" : "New Booking"}</h2>
        </div>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Event Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <Field label="Season">
                <Select
                  value={String(form.seasonId)}
                  onValueChange={(v) => setForm((p) => ({ ...p, seasonId: Number(v) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select season…" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field
              label={`Booking Ref${isLoadingRef ? " (generating…)" : ""}`}
              error={getError("bookingRef")}
            >
              <Input
                value={form.bookingRef}
                onChange={(e) => setForm((p) => ({ ...p, bookingRef: e.target.value }))}
                onBlur={() => markTouched("bookingRef")}
                placeholder="#YYMM-NN"
              />
            </Field>
            <Field label="Event Name" error={getError("eventName")} className="col-span-2">
              <Input
                value={form.eventName}
                onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))}
                onBlur={() => markTouched("eventName")}
                aria-invalid={!!getError("eventName")}
              />
            </Field>
            <Field label="Date" error={getError("date")}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={() => markTouched("date")}
                aria-invalid={!!getError("date")}
              />
            </Field>
            <Field label="Setup Time" error={getError("setupTime")}>
              <Input
                type="time"
                value={form.setupTime}
                onChange={(e) => setForm((p) => ({ ...p, setupTime: e.target.value }))}
                onBlur={() => markTouched("setupTime")}
                aria-invalid={!!getError("setupTime")}
              />
            </Field>
            <Field label="Event Start" error={getError("eventTimeStart")}>
              <Input
                type="time"
                value={form.eventTimeStart}
                onChange={(e) => setForm((p) => ({ ...p, eventTimeStart: e.target.value }))}
                onBlur={() => markTouched("eventTimeStart")}
                aria-invalid={!!getError("eventTimeStart")}
              />
            </Field>
            <Field label="Event End" error={getError("eventTimeEnd")}>
              <Input
                type="time"
                value={form.eventTimeEnd}
                onChange={(e) => setForm((p) => ({ ...p, eventTimeEnd: e.target.value }))}
                onBlur={() => markTouched("eventTimeEnd")}
                aria-invalid={!!getError("eventTimeEnd")}
              />
            </Field>
            <Field label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </Field>
            <Field label="OB Unit">
              <Select value={form.obUnit} onValueChange={(v) => setForm((p) => ({ ...p, obUnit: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OB_UNIT_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.doubleBooking}
                onChange={(e) => setForm((p) => ({ ...p, doubleBooking: e.target.checked }))}
              />
              Double booking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.generatorRequired}
                onChange={(e) => {
                  setForm((p) => ({ ...p, generatorRequired: e.target.checked }));
                  setTimeout(recalcTotal, 0);
                }}
              />
              Generator required
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Team</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Team Leader">
              <SearchableSelect
                options={[{ value: "", label: "None" }, ...teamLeaderOptions]}
                value={form.teamLeaderId}
                onValueChange={(v) => setForm((p) => ({ ...p, teamLeaderId: v }))}
                placeholder="Select leader…"
              />
            </Field>
            <Field label="Required Team Size">
              <Input
                type="number"
                min="1"
                value={form.requiredTeamSize}
                onChange={(e) => setForm((p) => ({ ...p, requiredTeamSize: Number(e.target.value) }))}
                className="max-w-24"
              />
            </Field>
            <Field label="Helpers" className="col-span-2">
              <SearchableMultiSelect
                options={helperOptions}
                value={form.helperIds}
                onChange={(v) => setForm((p) => ({ ...p, helperIds: v }))}
                placeholder="Select helpers…"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Fees</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Event Fee (£)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(e) => {
                  setForm((p) => ({ ...p, fee: parseFloat(e.target.value) || 0 }));
                  setTimeout(recalcTotal, 0);
                }}
              />
            </Field>
            {form.generatorRequired && (
              <Field label="Generator Fee (£)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.generatorFee}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, generatorFee: parseFloat(e.target.value) || 0 }));
                    setTimeout(recalcTotal, 0);
                  }}
                />
              </Field>
            )}
            <Field label="Total (£)">
              <Input type="number" value={form.total} readOnly className="bg-muted/50" />
            </Field>
            <Field label="Deposit (£)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.deposit}
                onChange={(e) => {
                  const deposit = parseFloat(e.target.value) || 0;
                  setForm((p) => ({ ...p, deposit, balance: p.total - deposit }));
                }}
              />
            </Field>
            <Field label="Balance (£)">
              <Input type="number" value={form.balance} readOnly className="bg-muted/50" />
            </Field>
            <Field label="Payment Status">
              <Select
                value={form.bookingStatus}
                onValueChange={(v) => setForm((p) => ({ ...p, bookingStatus: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact & Notes</h3>
          <Field label="Contact">
            <SearchableSelect
              options={contactOptions}
              value={form.contactId}
              onValueChange={(v) => setForm((p) => ({ ...p, contactId: v }))}
              placeholder="Select contact…"
            />
          </Field>
          <Field label="Invoice Address">
            <Textarea
              value={form.invoiceAddress}
              onChange={(e) => setForm((p) => ({ ...p, invoiceAddress: e.target.value }))}
              rows={3}
              placeholder="Override invoice address…"
            />
          </Field>
          <Field label="Comments">
            <Textarea
              value={form.comments}
              onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))}
              rows={3}
            />
          </Field>
        </section>

        <SaveErrorAlert message={saveError} />
        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={formState === FormState.Saving}>
            {formState === FormState.Saving ? "Saving…" : "Save Booking"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/bookings/${bookingId}` : "/bookings")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  return <BookingFormInner bookingId={id ? Number(id) : undefined} />;
}
