import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = Number(id);

  const { data: member } = useSuspenseQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: () => ipc.getMember(memberId),
  });

  return (
    <div className="flex h-full flex-col gap-6 max-w-lg">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <Link to="/members" className="text-sm text-muted-foreground hover:underline">
              ← Members
            </Link>
            <h2 className="text-2xl font-bold mt-1">
              {member.firstName} {member.lastName}
            </h2>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/members/${memberId}/edit`}>
              <Pencil size={14} />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <dl className="space-y-3">
        {[
          { label: "Role", value: member.isTeamLeader ? "Team Leader" : "Helper" },
          { label: "Status", value: member.isActive ? "Active" : "Inactive" },
          { label: "Email", value: member.email ?? "—" },
          { label: "Phone", value: member.phone ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4">
            <dt className="w-32 text-sm text-muted-foreground shrink-0">{label}</dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
