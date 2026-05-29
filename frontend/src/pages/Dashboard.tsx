import React from "react";
import {
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { useSources } from "@/hooks/useSources";
import KpiCard from "@/components/dashboard/KpiCard";
import StatusBreakdown from "@/components/dashboard/StatusBreakdown";
import ScopeDonut from "@/components/charts/ScopeDonut";
import SourceBar from "@/components/charts/SourceBar";
import UploadHistory from "@/components/upload/UploadHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: sourcesData } = useSources();

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const pending = summary.by_status["PENDING"] || 0;
  const flagged = summary.by_status["FLAGGED"] || 0;
  const approved = summary.by_status["APPROVED"] || 0;
  const rejected = summary.by_status["REJECTED"] || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Records"
          value={summary.total_records}
          icon={BarChart3}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-300"
        />
        <KpiCard
          title="Total CO₂e"
          value={`${(summary.total_co2e_kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} t`}
          subtitle="Tonnes CO₂ equivalent"
          icon={Flame}
          iconBg="bg-orange-50 dark:bg-orange-950"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <KpiCard
          title="Pending Review"
          value={pending + flagged}
          subtitle={flagged > 0 ? `${flagged} flagged` : undefined}
          icon={Clock}
          iconBg="bg-sky-50 dark:bg-sky-950"
          iconColor="text-sky-600 dark:text-sky-400"
        />
        <KpiCard
          title="Approved"
          value={approved}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Rejected"
          value={rejected}
          icon={AlertTriangle}
          iconBg="bg-rose-50 dark:bg-rose-950"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ScopeDonut data={summary.by_scope} />
        <SourceBar data={summary.by_source_type} />
        <StatusBreakdown data={summary.by_status} />
      </div>

      {/* Recent uploads */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadHistory
            sources={sourcesData?.results || []}
            isLoading={!sourcesData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
