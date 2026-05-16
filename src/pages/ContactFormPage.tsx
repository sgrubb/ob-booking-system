import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ipc, IpcError } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useFormState, FormState } from "@/hooks/use-form-state";
import { createContactSchema } from "@shared/schemas/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { SaveErrorAlert } from "@/components/ui/save-error-alert";
import { PageHeader } from "@/components/ui/page-header";
import { IpcErrorCode } from "@shared/types/ipc";
import log from "@/lib/logger";

const EMPTY = {
  name: "",
  tel: "",
  mobile: "",
  email: "",
  address: "",
};

type FormFields = typeof EMPTY;

function ContactFormInner({ contactId }: { contactId?: number }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = contactId !== undefined;

  const { data: existing } = useSuspenseQuery({
    queryKey: queryKeys.contacts.detail(contactId ?? 0),
    queryFn: () => (contactId ? ipc.getContact(contactId) : null),
    enabled: isEdit,
  });

  const {
    form, setForm, updatedAt, setUpdatedAt, setOriginalForm,
    formState, setFormState, saveError, setSaveError,
    validate, getError, markTouched, getConflictError, handleConflict,
  } = useFormState<FormFields>(createContactSchema, EMPTY);

  useEffect(() => {
    if (existing) {
      const f: FormFields = {
        name: existing.name,
        tel: existing.tel ?? "",
        mobile: existing.mobile ?? "",
        email: existing.email ?? "",
        address: existing.address ?? "",
      };
      setForm(f);
      setOriginalForm(f);
      setUpdatedAt(new Date(existing.updatedAt));
    }
  }, [existing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setFormState(FormState.Saving);
    setSaveError(null);
    try {
      const payload = {
        name: form.name,
        tel: form.tel || null,
        mobile: form.mobile || null,
        email: form.email || null,
        address: form.address || null,
      };
      if (isEdit && contactId !== undefined) {
        await ipc.updateContact(contactId, { ...payload, updatedAt: updatedAt! });
        await queryClient.invalidateQueries({ queryKey: queryKeys.contacts.root });
        navigate(`/contacts/${contactId}`);
      } else {
        const created = await ipc.createContact(payload);
        await queryClient.invalidateQueries({ queryKey: queryKeys.contacts.root });
        navigate(`/contacts/${created.id}`);
      }
    } catch (err) {
      log.error("Contact save failed:", err);
      if (err instanceof IpcError && err.code === IpcErrorCode.Conflict && contactId) {
        await handleConflict(async () => {
          const fresh = await ipc.getContact(contactId);
          return {
            form: {
              name: fresh.name,
              tel: fresh.tel ?? "",
              mobile: fresh.mobile ?? "",
              email: fresh.email ?? "",
              address: fresh.address ?? "",
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

  return (
    <div className="flex h-full flex-col gap-6 max-w-lg">
      <PageHeader>
        <div>
          <Link to={isEdit ? `/contacts/${contactId}` : "/contacts"} className="text-sm text-muted-foreground hover:underline">
            ← {isEdit ? "Back" : "Contacts"}
          </Link>
          <h2 className="text-2xl font-bold mt-1">{isEdit ? "Edit Contact" : "New Contact"}</h2>
        </div>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" error={getError("name")} conflictError={getConflictError("name")}>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            onBlur={() => markTouched("name")}
            aria-invalid={!!getError("name")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tel">
            <Input
              value={form.tel}
              onChange={(e) => setForm((p) => ({ ...p, tel: e.target.value }))}
            />
          </Field>
          <Field label="Mobile">
            <Input
              value={form.mobile}
              onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Email" error={getError("email")}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            onBlur={() => markTouched("email")}
            aria-invalid={!!getError("email")}
          />
        </Field>
        <Field label="Address">
          <Textarea
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            rows={3}
          />
        </Field>
        <SaveErrorAlert message={saveError} />
        <div className="flex gap-3">
          <Button type="submit" disabled={formState === FormState.Saving}>
            {formState === FormState.Saving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/contacts/${contactId}` : "/contacts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ContactFormPage() {
  const { id } = useParams<{ id: string }>();
  return <ContactFormInner contactId={id ? Number(id) : undefined} />;
}
