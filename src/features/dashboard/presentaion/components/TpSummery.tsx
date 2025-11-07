"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../core/components/ui/card";

type TpSummaryCardsProps = {
  totalGenere: number;
  totalSolde: number;
};

export default function TpSummaryCards({
  totalGenere,
  totalSolde,
}: TpSummaryCardsProps) {
  const soldeRate = totalGenere > 0 ? (totalSolde / totalGenere) * 100 : 0;

  // Color scale for performance
  const rateColor =
    soldeRate > 90
      ? "text-green-600"
      : soldeRate > 70
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Card className="border  shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-red-400">
            TP Généré
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-red-600">
            {totalGenere.toLocaleString()} DA
          </p>
          <p className="text-sm text-red-500/70 mt-2">Volume global</p>
        </CardContent>
      </Card>

      <Card className="border  shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-green-500">
            TP Soldé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">
            {totalSolde.toLocaleString()} DA
          </p>
          <p className="text-sm text-green-500/70 mt-2">Montant encaissé</p>
        </CardContent>
      </Card>

      <Card className="border  shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
            Taux de Solde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${rateColor}`}>
            {soldeRate.toFixed(1)}%
          </p>
          <p className="text-sm text-blue-500/70 mt-2">Efficacité globale</p>
        </CardContent>
      </Card>
    </div>
  );
}
