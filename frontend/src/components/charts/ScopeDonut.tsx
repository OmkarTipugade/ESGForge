import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCOPE_COLORS: Record<string, string> = {
  SCOPE_1: "#10b981", // emerald-500
  SCOPE_2: "#3b82f6", // blue-500
  SCOPE_3: "#f59e0b", // amber-500
};

const SCOPE_LABELS: Record<string, string> = {
  SCOPE_1: "Scope 1 — Direct",
  SCOPE_2: "Scope 2 — Energy",
  SCOPE_3: "Scope 3 — Indirect",
};

interface ScopeDonutProps {
  data: Record<string, number>;
}

const ScopeDonut: React.FC<ScopeDonutProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: SCOPE_LABELS[key] || key,
    value,
    fill: SCOPE_COLORS[key] || "#6b7280",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Scope Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Scope Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString()} records`,
                "",
              ]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ScopeDonut;
