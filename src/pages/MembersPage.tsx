import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { sortableName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function MembersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);

  const params = { includeInactive };
  const { data: members } = useSuspenseQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => ipc.listMembers(params),
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Members</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
            <Button asChild size="sm">
              <Link to="/members/new">
                <Plus size={14} />
                New Member
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No members found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Name</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Role</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Email</th>
                <th className="pb-2 font-medium text-muted-foreground">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className={`hover:bg-muted/50 ${!member.isActive ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-4">
                    <Link to={`/members/${member.id}`} className="font-medium hover:underline">
                      {sortableName(member.firstName, member.lastName)}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {member.isTeamLeader
                      ? <span className="text-xs font-semibold text-primary">Team Leader</span>
                      : <span className="text-xs text-muted-foreground">Helper</span>}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{member.email ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{member.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
