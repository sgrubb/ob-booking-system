import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ipc } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { useSeason } from "@/context/SeasonContext";
import { formatCurrency, sortableName } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function StatisticsPage() {
  const { selectedSeasonId } = useSeason();

  const { data: stats } = useSuspenseQuery({
    queryKey: queryKeys.stats.season(selectedSeasonId ?? 0),
    queryFn: () => {
      if (!selectedSeasonId) {
        return Promise.resolve(null);
      }
      return ipc.getSeasonStats(selectedSeasonId);
    },
  });

  if (!selectedSeasonId || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a season to view statistics.</p>
      </div>
    );
  }

  const chartData = stats.bookingsPerMonth.map((m) => ({
    month: MONTH_NAMES[m.month] ?? String(m.month),
    count: m.count,
  }));

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <PageHeader>
        <h2 className="text-2xl font-bold">Statistics</h2>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Bookings", value: stats.totalBookings },
          { label: "Cancelled", value: stats.cancelledBookings },
          { label: "Total Revenue", value: formatCurrency(stats.totalRevenue) },
          { label: "Generator Fees", value: formatCurrency(stats.totalGeneratorFees) },
          { label: "Collected", value: formatCurrency(stats.totalCollected) },
          { label: "Outstanding", value: formatCurrency(stats.outstandingBalance) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Bookings per Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.memberStats.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium">Member Activity</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-2 font-medium text-muted-foreground text-center">As Leader</th>
                <th className="px-4 py-2 font-medium text-muted-foreground text-center">As Helper</th>
                <th className="px-4 py-2 font-medium text-muted-foreground text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.memberStats.map((m) => (
                <tr key={m.memberId} className="hover:bg-muted/50">
                  <td className="px-4 py-2">{sortableName(m.firstName, m.lastName)}</td>
                  <td className="px-4 py-2 text-center">{m.asLeader}</td>
                  <td className="px-4 py-2 text-center">{m.asHelper}</td>
                  <td className="px-4 py-2 text-center font-medium">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
