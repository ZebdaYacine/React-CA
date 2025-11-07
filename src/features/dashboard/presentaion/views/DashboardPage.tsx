"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import TPEcheance, { type NestedData } from "../components/TPEcheance";
import TpUserRadarChart from "../components/TpUserRadarChart";
import TpSummaryCards from "../components/TpSummery";
import SelectionFilters from "../components/SelectionFilters";
import InsuredUsersTable, {
  type InsuredUser,
} from "../components/InsuredUsersTable";
import { Button } from "../../../../core/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { clearPersistedAuthUser } from "../../../auth/domain/services/tokenStorage";
import { toast, Toaster } from "sonner";

const AVAILABLE_YEARS = [2023, 2024, 2025] as const;
const FULL_WILAYA_VALUE = "__full-wilaya__";
const WILAYA_NAME = "Laghouat" as const;

const MOCK_INSURED_USERS: InsuredUser[] = [
  {
    nPension: "P123456",
    nom: "Benali",
    prenom: "Karim",
    dateNaissance: "1965-07-20",
    nomPere: "Ahmed",
    nomMere: "Fatma",
    typeTP: "Mensuel",
    tpSolde: 3800,
    tpGenere: 5000,
    dateDeces: "",
    commune: "Laghouat",
  },
  {
    nPension: "P987654",
    nom: "Saidi",
    prenom: "Nadia",
    dateNaissance: "1972-11-03",
    nomPere: "Abdelkader",
    nomMere: "Leila",
    typeTP: "Exceptionnel",
    tpSolde: 2500,
    tpGenere: 4200,
    dateDeces: "2023-09-01",
    commune: "Aflou",
  },
  {
    nPension: "P654321",
    nom: "Khellaf",
    prenom: "Yasmine",
    dateNaissance: "1980-03-12",
    nomPere: "Mourad",
    nomMere: "Kenza",
    typeTP: "Trimestriel",
    tpSolde: 4100,
    tpGenere: 5200,
    commune: "Oued Morra",
  },
  {
    nPension: "P456789",
    nom: "Zerari",
    prenom: "Riad",
    dateNaissance: "1978-08-02",
    nomPere: "Sofiane",
    nomMere: "Warda",
    typeTP: "Mensuel",
    tpSolde: 1500,
    tpGenere: 3000,
    commune: "Hassi R'mel",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCommune, setSelectedCommune] = useState<string>("Aflou");
  const [isFullWilaya, setIsFullWilaya] = useState<boolean>(true);

  const communes = useMemo(
    () => [
      "Aflou",
      "Ain Madhi",
      "Brida",
      "El Ghicha",
      "Gueltat Sidi Saad",
      "Hassi R'mel",
      "Ksar El Hirane",
      "Laghouat",
      "Oued Morra",
      "Sidi Makhlouf",
      "El Haouaita",
      "Kheneg",
      "Tadjmout",
      "Tadjerouna",
      "Hadj Mechri",
      "Taouiala",
      "Ain Sidi Ali",
      "El Beidha",
      "Hassi Delaa",
      "Benacer Benchohra",
      "Oued M'zi",
      "El Assafia",
    ],
    []
  );

  const filteredInsuredUsers = useMemo(() => {
    if (isFullWilaya) return MOCK_INSURED_USERS;
    return MOCK_INSURED_USERS.filter(
      (user) => user.commune === selectedCommune
    );
  }, [isFullWilaya, selectedCommune]);

  // ---- Generate TP data (for TPEcheance chart) ----
  const tpData = useMemo<NestedData>(() => {
    const fullData: NestedData = {};

    AVAILABLE_YEARS.forEach((year) => {
      for (let i = 1; i <= 12; i++) {
        const month = String(i).padStart(2, "0");
        const monthKey = `${year}-${month}`;
        const wilayaData: Record<
          string,
          { tpSolde: number; tpGenere: number }
        > = {};

        communes.forEach((commune) => {
          wilayaData[commune] = {
            tpSolde: Math.floor(2000 + Math.random() * 4000),
            tpGenere: Math.floor(4000 + Math.random() * 5000),
          };
        });

        fullData[monthKey] = { [WILAYA_NAME]: wilayaData };
      }
    });

    return fullData;
  }, [communes]);

  // ---- Compute summary totals ----
  const summary = useMemo(() => {
    let totalGenere = 0;
    let totalSolde = 0;

    for (const echeance in tpData) {
      if (!echeance.startsWith(`${selectedYear}-`)) continue;
      const monthlySnapshot = tpData[echeance];
      if (!monthlySnapshot) continue;
      const wilayaData = monthlySnapshot[WILAYA_NAME];
      if (!wilayaData) continue;

      for (const commune in wilayaData) {
        if (!isFullWilaya && commune !== selectedCommune) continue;
        totalGenere += wilayaData[commune].tpGenere;
        totalSolde += wilayaData[commune].tpSolde;
      }
    }

    return { totalGenere, totalSolde };
  }, [tpData, selectedYear, selectedCommune, isFullWilaya]);

  // ---- Generate TP user data (for Radar Chart) ----
  const tpUserData = useMemo(() => {
    const dataByYear: Record<
      number,
      Record<
        string,
        {
          totalUsers: number;
          usersWithTP: number;
          usersWithoutTP: number;
          payingTPUsers: number;
          ctxTPUsers: number;
        }
      >
    > = {};

    AVAILABLE_YEARS.forEach((year) => {
      dataByYear[year] = {};
      communes.forEach((commune) => {
        const totalUsers = Math.floor(800 + Math.random() * 1200);
        const usersWithTP = Math.floor(
          totalUsers * (0.5 + Math.random() * 0.3)
        );
        const usersWithoutTP = totalUsers - usersWithTP;
        const payingTPUsers = Math.floor(
          usersWithTP * (0.1 + Math.random() * 0.2)
        );
        const ctxTPUsers = Math.floor(
          usersWithTP * (0.05 + Math.random() * 0.1)
        );

        dataByYear[year][commune] = {
          totalUsers,
          usersWithTP,
          usersWithoutTP,
          payingTPUsers,
          ctxTPUsers,
        };
      });
    });

    return dataByYear;
  }, [communes]);

  const selectionLabel = isFullWilaya
    ? `Full Wilaya • ${WILAYA_NAME}`
    : `Commune • ${selectedCommune}`;

  const handleLogout = () => {
    toast.promise<{ name: string }>(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: "Event" }), 2000)
        ),
      {
        loading: "Loading...",
        success: (data) => `${data.name} Sauvegarder le fichier de log`,
        error: "Error",
      }
    );
    clearPersistedAuthUser();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen w-full ">
      <Toaster />
      <Button
        variant="outline"
        size="lg"
        onClick={handleLogout}
        className="fixed top-4 right-4 flex items-center  gap-2 shadow-md"
      >
        <LogOutIcon className="h-4 w-4" />
        Logout
      </Button>
      <div className="w-full max-w-7xl mx-auto px-4 py-12 flex flex-col gap-10">
        <SelectionFilters
          availableYears={[...AVAILABLE_YEARS]}
          communes={communes}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedCommune={selectedCommune}
          setSelectedCommune={setSelectedCommune}
          isFullWilaya={isFullWilaya}
          setIsFullWilaya={setIsFullWilaya}
          fullWilayaValue={FULL_WILAYA_VALUE}
        />
        <TpSummaryCards
          totalGenere={summary.totalGenere}
          totalSolde={summary.totalSolde}
        />
        <div className="rounded-2xl border  p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b  pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
                Analyses TP
              </p>
              <h3 className="text-2xl font-semibold text-slate-900">
                Performance &amp; Comportement
              </h3>
            </div>
            <span className="text-base font-medium text-slate-500">
              {selectionLabel}
            </span>
          </div>

          <div className="flex flex-col  lg:flex-row">
            <div className="flex-3 ">
              <TPEcheance
                data={tpData}
                wilaya={WILAYA_NAME}
                selectedYear={selectedYear}
                selectedCommune={selectedCommune}
                isFullWilaya={isFullWilaya}
              />
            </div>
            <div className="flex-2 ">
              <TpUserRadarChart
                data={tpUserData}
                selectedYear={selectedYear}
                selectedCommune={selectedCommune}
                isFullWilaya={isFullWilaya}
              />
            </div>
          </div>
        </div>
        <InsuredUsersTable
          users={filteredInsuredUsers}
          title={
            isFullWilaya
              ? `Assurés — ${WILAYA_NAME}`
              : `Assurés — ${selectedCommune}`
          }
        />
      </div>
    </main>
  );
}
