import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contactId = Number(id);

  const { data: contact } = useSuspenseQuery({
    queryKey: queryKeys.contacts.detail(contactId),
    queryFn: () => ipc.getContact(contactId),
  });

  return (
    <div className="flex h-full flex-col gap-6 max-w-lg">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <Link to="/contacts" className="text-sm text-muted-foreground hover:underline">
              ← Contacts
            </Link>
            <h2 className="text-2xl font-bold mt-1">{contact.name}</h2>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/contacts/${contactId}/edit`}>
              <Pencil size={14} />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <dl className="space-y-3">
        {[
          { label: "Tel", value: contact.tel ?? "—" },
          { label: "Mobile", value: contact.mobile ?? "—" },
          { label: "Email", value: contact.email ?? "—" },
          { label: "Address", value: contact.address ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4">
            <dt className="w-24 text-sm text-muted-foreground shrink-0">{label}</dt>
            <dd className="text-sm whitespace-pre-line">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
