"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import TPEcheance, { type TPSeriesPoint } from "../components/TPEcheance";
import TpUserRadarChart from "../components/TpUserRadarChart";
import TpSummaryCards from "../components/TpSummery";
import SelectionFilters from "../components/SelectionFilters";
import UploadDataModal from "../components/UploadDataModal";
import InsuredUsersTable, {
  type InsuredUser,
} from "../components/InsuredUsersTable";
import {
  fetchDashboardData,
  fetchFilterOptions,
} from "../../data/sources/dashboardApi";
import { Button } from "../../../../core/components/ui/button";
import { LogOutIcon } from "lucide-react";
import {
  clearPersistedAuthUser,
  getPersistedAuthUser,
} from "../../../auth/domain/services/tokenStorage";
import { toast, Toaster } from "sonner";

const FULL_WILAYA_VALUE = "__full-wilaya__";
const WILAYA_NAME = "Laghouat" as const;

type FilterOptions = {
  years: number[];
  communes: string[];
  tpTypes: string[];
};

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  years: [2023, 2024, 2025],
  communes: [
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
  tpTypes: ["Mensuel", "Trimestriel", "Exceptionnel"],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCommune, setSelectedCommune] = useState<string>("Aflou");
  const [isFullWilaya, setIsFullWilaya] = useState<boolean>(true);
  const [summary, setSummary] = useState<{
    totalGenere: number;
    totalSolde: number;
  }>({
    totalGenere: 0,
    totalSolde: 0,
  });
  const [tpByMonth, setTpByMonth] = useState<TPSeriesPoint[]>([]);
  const [insuredUsers, setInsuredUsers] = useState<InsuredUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(
    DEFAULT_FILTER_OPTIONS
  );
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [canManageUploads, setCanManageUploads] = useState(false);

  useEffect(() => {
    let canceled = false;
    const loadFilterOptions = async () => {
      setIsLoadingFilters(true);
      setFilterError(null);
      try {
        const options = await fetchFilterOptions();
        if (canceled) return;
        const normalized: FilterOptions = {
          years: options.years?.length
            ? options.years
            : DEFAULT_FILTER_OPTIONS.years,
          communes: options.communes?.length
            ? options.communes
            : DEFAULT_FILTER_OPTIONS.communes,
          tpTypes: options.tpTypes?.length
            ? options.tpTypes
            : DEFAULT_FILTER_OPTIONS.tpTypes,
        };
        setFilterOptions(normalized);
        setSelectedYear((prev) => {
          if (!normalized.years.length) return prev;
          return normalized.years.includes(prev)
            ? prev
            : normalized.years[normalized.years.length - 1];
        });
        setSelectedCommune((prev) => {
          if (!normalized.communes.length) return prev;
          return normalized.communes.includes(prev)
            ? prev
            : normalized.communes[0];
        });
      } catch (error) {
        if (canceled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger les filtres.";
        setFilterError(message);
      } finally {
        if (!canceled) {
          setIsLoadingFilters(false);
        }
      }
    };

    loadFilterOptions();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const user = getPersistedAuthUser();
    setCanManageUploads(user?.username === "admin");
  }, []);

  useEffect(() => {
    let canceled = false;
    const loadDashboard = async () => {
      setIsLoadingData(true);
      setDataError(null);
      try {
        const data = await fetchDashboardData({
          year: selectedYear,
          wilaya: WILAYA_NAME,
          commune: isFullWilaya ? null : selectedCommune,
        });

        if (canceled) return;

        setSummary({
          totalGenere: data.tpSummary.totalGenere,
          totalSolde: data.tpSummary.totalSolde,
        });

        setTpByMonth(
          data.tpByMonth.map((item) => ({
            month: item.month,
            tpGenere: item.tpGenere,
            tpSolde: item.tpSolde,
          }))
        );

        setInsuredUsers(
          data.insuredUsers.map((user) => ({
            nom: user.nom,
            prenom: user.prenom,
            nomPere: user.nomPere ?? "—",
            nomMere: user.nomMere ?? "—",
            tpSolde: user.tpSolde ?? 0,
            tpGenere: user.tpGenere ?? 0,
            nPension: user.nPension ?? "—",
            dateNaissance: user.dateNaissance ?? "—",
            dateDeces: user.dateDeces ?? "",
            typeTP: user.typeTP ?? "N/A",
            commune:
              user.commune ?? (isFullWilaya ? undefined : selectedCommune),
          }))
        );
      } catch (error) {
        if (canceled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger les données du tableau de bord.";
        setDataError(message);
        setSummary({ totalGenere: 0, totalSolde: 0 });
        setTpByMonth([]);
        setInsuredUsers([]);
      } finally {
        if (!canceled) setIsLoadingData(false);
      }
    };

    loadDashboard();

    return () => {
      canceled = true;
    };
  }, [selectedYear, selectedCommune, isFullWilaya]);

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

    filterOptions.years.forEach((year) => {
      dataByYear[year] = {};
      filterOptions.communes.forEach((commune) => {
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
  }, [filterOptions]);

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
      {canManageUploads && (
        <UploadDataModal
          isOpen={isUploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
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
          availableYears={[...filterOptions.years]}
          communes={filterOptions.communes}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedCommune={selectedCommune}
          setSelectedCommune={setSelectedCommune}
          isFullWilaya={isFullWilaya}
          setIsFullWilaya={setIsFullWilaya}
          fullWilayaValue={FULL_WILAYA_VALUE}
          isLoading={isLoadingFilters}
          onOpenUploadModal={
            canManageUploads ? () => setUploadModalOpen(true) : undefined
          }
        />
        {filterError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
            {filterError}
          </div>
        )}
        {dataError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {dataError}
          </div>
        )}
        <TpSummaryCards
          totalGenere={summary.totalGenere}
          totalSolde={summary.totalSolde}
        />
        <div className="rounded-2xl border  p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b  pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] ">Analyses TP</p>
              <h3 className="text-2xl font-semibold ">
                Performance &amp; Comportement
              </h3>
            </div>
            <span className="text-base font-medium ">{selectionLabel}</span>
          </div>

          <div className="flex flex-col  lg:flex-row">
            <div className="flex-3 ">
              <TPEcheance data={tpByMonth} isLoading={isLoadingData} />
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
          users={insuredUsers}
          title={
            isFullWilaya
              ? `Assurés — ${WILAYA_NAME}`
              : `Assurés — ${selectedCommune}`
          }
          tpTypes={filterOptions.tpTypes}
        />
      </div>
    </main>
  );
}
