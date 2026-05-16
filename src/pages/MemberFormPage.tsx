import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ipc, IpcError } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useFormState, FormState } from "@/hooks/use-form-state";
import { createMemberSchema } from "@shared/schemas/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SaveErrorAlert } from "@/components/ui/save-error-alert";
import { PageHeader } from "@/components/ui/page-header";
import { IpcErrorCode } from "@shared/types/ipc";
import log from "@/lib/logger";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isTeamLeader: false,
  isActive: true,
};

type FormFields = typeof EMPTY;

function MemberFormInner({ memberId }: { memberId?: number }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = memberId !== undefined;

  const { data: existing } = useSuspenseQuery({
    queryKey: queryKeys.members.detail(memberId ?? 0),
    queryFn: () => (memberId ? ipc.getMember(memberId) : null),
    enabled: isEdit,
  });

  const {
    form, setForm, updatedAt, setUpdatedAt, setOriginalForm,
    formState, setFormState, saveError, setSaveError,
    validate, getError, markTouched, getConflictError, handleConflict,
  } = useFormState<FormFields>(createMemberSchema, EMPTY);

  useEffect(() => {
    if (existing) {
      const f: FormFields = {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email ?? "",
        phone: existing.phone ?? "",
        isTeamLeader: existing.isTeamLeader,
        isActive: existing.isActive,
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
      if (isEdit && memberId !== undefined) {
        await ipc.updateMember(memberId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || null,
          phone: form.phone || null,
          isTeamLeader: form.isTeamLeader,
          isActive: form.isActive,
          updatedAt: updatedAt!,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.members.root });
        navigate(`/members/${memberId}`);
      } else {
        const created = await ipc.createMember({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || null,
          phone: form.phone || null,
          isTeamLeader: form.isTeamLeader,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.members.root });
        navigate(`/members/${created.id}`);
      }
    } catch (err) {
      log.error("Member save failed:", err);
      if (err instanceof IpcError && err.code === IpcErrorCode.Conflict && memberId) {
        await handleConflict(async () => {
          const fresh = await ipc.getMember(memberId);
          return {
            form: {
              firstName: fresh.firstName,
              lastName: fresh.lastName,
              email: fresh.email ?? "",
              phone: fresh.phone ?? "",
              isTeamLeader: fresh.isTeamLeader,
              isActive: fresh.isActive,
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
          <Link to={isEdit ? `/members/${memberId}` : "/members"} className="text-sm text-muted-foreground hover:underline">
            ← {isEdit ? "Back" : "Members"}
          </Link>
          <h2 className="text-2xl font-bold mt-1">{isEdit ? "Edit Member" : "New Member"}</h2>
        </div>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" error={getError("firstName")} conflictError={getConflictError("firstName")}>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              onBlur={() => markTouched("firstName")}
              aria-invalid={!!getError("firstName")}
            />
          </Field>
          <Field label="Last name" error={getError("lastName")} conflictError={getConflictError("lastName")}>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              onBlur={() => markTouched("lastName")}
              aria-invalid={!!getError("lastName")}
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </Field>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isTeamLeader}
              onChange={(e) => setForm((p) => ({ ...p, isTeamLeader: e.target.checked }))}
            />
            Team Leader
          </label>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          )}
        </div>
        <SaveErrorAlert message={saveError} />
        <div className="flex gap-3">
          <Button type="submit" disabled={formState === FormState.Saving}>
            {formState === FormState.Saving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/members/${memberId}` : "/members")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  return <MemberFormInner memberId={id ? Number(id) : undefined} />;
}
