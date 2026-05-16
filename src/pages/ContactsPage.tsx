import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export default function ContactsPage() {
  const [search, setSearch] = useState("");

  const params = { search: search || undefined };
  const { data: contacts } = useSuspenseQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => ipc.listContacts(params),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Contacts</h2>
          <Button asChild size="sm">
            <Link to="/contacts/new">
              <Plus size={14} />
              New Contact
            </Link>
          </Button>
        </div>
        <Input
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No contacts found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Name</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Tel</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Mobile</th>
                <th className="pb-2 font-medium text-muted-foreground">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-muted/50">
                  <td className="py-2 pr-4">
                    <Link to={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{contact.tel ?? "—"}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{contact.mobile ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{contact.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
