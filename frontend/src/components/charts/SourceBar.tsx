import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SOURCE_LABELS: Record<string, string> = {
  SAP_FUEL: "SAP Fuel",
  UTILITY_ELECTRICITY: "Utility",
  TRAVEL: "Travel",
};

const SOURCE_COLORS: Record<string, string> = {
  SAP_FUEL: "#8b5cf6", // violet-500
  UTILITY_ELECTRICITY: "#06b6d4", // cyan-500
  TRAVEL: "#f97316", // orange-500
};

interface SourceBarProps {
  data: Record<string, number>;
}

const SourceBar: React.FC<SourceBarProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: SOURCE_LABELS[key] || key,
    records: value,
    fill: SOURCE_COLORS[key] || "#6b7280",
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Records by Source
          </CardTitle>
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
        <CardTitle className="text-sm font-semibold">
          Records by Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString()} records`,
                "Count",
              ]}
            />
            <Bar dataKey="records" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SourceBar;
