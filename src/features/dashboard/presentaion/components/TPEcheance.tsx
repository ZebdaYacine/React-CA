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

export type NestedData = {
  [echeance: string]: {
    [wilaya: string]: {
      [commune: string]: {
        tpSolde: number;
        tpGenere: number;
      };
    };
  };
};

type TPEcheanceProps = {
  data: NestedData;
  wilaya: string;
  selectedYear: number;
  selectedCommune: string;
  isFullWilaya: boolean;
};

export function TPEcheance({
  data,
  wilaya,
  selectedYear,
  selectedCommune,
  isFullWilaya,
}: TPEcheanceProps) {
  const [hoveringDataKey, setHoveringDataKey] = useState<DataKey<unknown>>();

  const processedData = useMemo(() => {
    const results: { echeance: string; tpSolde: number; tpGenere: number }[] =
      [];

    for (const echeance in data) {
      if (!echeance.startsWith(`${selectedYear}-`)) continue;
      const wilayaData = data[echeance][wilaya];
      if (!wilayaData) continue;

      let totalSolde = 0;
      let totalGenere = 0;

      for (const commune in wilayaData) {
        if (!isFullWilaya && commune !== selectedCommune) continue;
        totalSolde += wilayaData[commune].tpSolde;
        totalGenere += wilayaData[commune].tpGenere;
      }

      results.push({ echeance, tpSolde: totalSolde, tpGenere: totalGenere });
    }

    return results.sort((a, b) => a.echeance.localeCompare(b.echeance));
  }, [data, wilaya, selectedCommune, isFullWilaya, selectedYear]);

  const handleMouseEnter = (payload: LegendPayload) =>
    setHoveringDataKey(payload.dataKey);
  const handleMouseLeave = () => setHoveringDataKey(undefined);

  const tpGenereOpacity = hoveringDataKey === "tpSolde" ? 0.4 : 1;
  const tpSoldeOpacity = hoveringDataKey === "tpGenere" ? 0.4 : 1;

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
