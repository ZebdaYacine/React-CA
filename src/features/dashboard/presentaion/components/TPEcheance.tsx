"use client";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LegendPayload,
} from "recharts";
import type { DataKey } from "recharts/types/util/types";

export type TPSeriesPoint = {
  month: string;
  tpGenere: number;
  tpSolde: number;
};

type TPEcheanceProps = {
  data: TPSeriesPoint[];
  isLoading?: boolean;
};

export function TPEcheance({ data, isLoading = false }: TPEcheanceProps) {
  const [hoveringDataKey, setHoveringDataKey] = useState<DataKey<unknown>>();

  const processedData = useMemo(() => {
    return data.map((point, index) => ({
      echeance: `${String(index + 1).padStart(2, "0")} - ${point.month}`,
      tpSolde: point.tpSolde,
      tpGenere: point.tpGenere,
    }));
  }, [data]);

  const handleMouseEnter = (payload: LegendPayload) =>
    setHoveringDataKey(payload.dataKey);
  const handleMouseLeave = () => setHoveringDataKey(undefined);

  const tpGenereOpacity = hoveringDataKey === "tpSolde" ? 0.4 : 1;
  const tpSoldeOpacity = hoveringDataKey === "tpGenere" ? 0.4 : 1;

  if (!processedData.length) {
    return (
      <div className="flex items-center justify-center h-full py-12 text-slate-500">
        {isLoading
          ? "Chargement des courbes..."
          : "Aucune donnée disponible pour cette sélection."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <ResponsiveContainer width="100%" aspect={1.618} className="max-w-5xl">
        <LineChart
          data={processedData}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="echeance" />
          <YAxis />
          <Tooltip />
          <Legend
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          <Line
            type="monotone"
            dataKey="tpGenere"
            name="TP Généré"
            stroke="#dc2626"
            strokeOpacity={tpGenereOpacity}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="tpSolde"
            name="TP Soldé"
            stroke="#16a34a"
            strokeOpacity={tpSoldeOpacity}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TPEcheance;
