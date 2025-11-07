"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

type CommuneStats = {
  [year: number]: {
    [commune: string]: {
      totalUsers: number;
      usersWithTP: number;
      usersWithoutTP: number;
      payingTPUsers: number;
      ctxTPUsers: number;
    };
  };
};

type TpUserRadarChartProps = {
  data: CommuneStats;
  selectedYear: number;
  selectedCommune: string;
  isFullWilaya: boolean;
};

export default function TpUserRadarChart({
  data,
  selectedYear,
  selectedCommune,
  isFullWilaya,
}: TpUserRadarChartProps) {
  const chartData = useMemo(() => {
    const yearData = data[selectedYear];
    if (!yearData) return [];

    let totalUsers = 0;
    let usersWithTP = 0;
    let usersWithoutTP = 0;
    let payingTPUsers = 0;
    let ctxTPUsers = 0;

    if (isFullWilaya) {
      for (const commune in yearData) {
        totalUsers += yearData[commune].totalUsers;
        usersWithTP += yearData[commune].usersWithTP;
        usersWithoutTP += yearData[commune].usersWithoutTP;
        payingTPUsers += yearData[commune].payingTPUsers;
        ctxTPUsers += yearData[commune].ctxTPUsers;
      }
    } else {
      const communeStats = yearData[selectedCommune];
      if (communeStats) {
        totalUsers = communeStats.totalUsers;
        usersWithTP = communeStats.usersWithTP;
        usersWithoutTP = communeStats.usersWithoutTP;
        payingTPUsers = communeStats.payingTPUsers;
        ctxTPUsers = communeStats.ctxTPUsers;
      }
    }

    return [
      { label: "Total", value: totalUsers },
      { label: "Avec TP", value: usersWithTP },
      { label: "Sans TP", value: usersWithoutTP },
      { label: "Payant TP", value: payingTPUsers },
      { label: "TP CTX", value: ctxTPUsers },
    ];
  }, [data, selectedYear, selectedCommune, isFullWilaya]);

  return (
    <div className="flex flex-col items-center w-full">
      <ResponsiveContainer width="100%" aspect={1}>
        <RadarChart data={chartData} outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="label" />
          <PolarRadiusAxis domain={[0, 10000]} />
          <Radar
            name="Users"
            dataKey="value"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
