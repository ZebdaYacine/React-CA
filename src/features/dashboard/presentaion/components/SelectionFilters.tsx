"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../../../core/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../core/components/ui/button";

type SelectionFiltersProps = {
  availableYears: number[];
  communes: string[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedCommune: string;
  setSelectedCommune: (commune: string) => void;
  isFullWilaya: boolean;
  setIsFullWilaya: (value: boolean) => void;
  fullWilayaValue?: string;
  isLoading?: boolean;
  onOpenUploadModal?: () => void;
};

export default function SelectionFilters({
  availableYears,
  communes,
  selectedYear,
  setSelectedYear,
  selectedCommune,
  setSelectedCommune,
  isFullWilaya,
  setIsFullWilaya,
  fullWilayaValue = "__full-wilaya__",
  isLoading = false,
  onOpenUploadModal,
}: SelectionFiltersProps) {
  const [communeSearch, setCommuneSearch] = useState("");
  const [isCommuneSelectOpen, setIsCommuneSelectOpen] = useState(false);

  const filteredCommunes = useMemo(() => {
    const query = communeSearch.trim().toLowerCase();
    if (!query) return communes;
    return communes.filter((c) => c.toLowerCase().includes(query));
  }, [communes, communeSearch]);

  useEffect(() => {
    if (!isCommuneSelectOpen) setCommuneSearch("");
  }, [isCommuneSelectOpen]);

  return (
    <div className="flex justify-center w-full mt-8">
      <div className="flex flex-col gap-4 w-full max-w-4xl items-center text-center">
        {/* Section Title */}
        <div>
          <h2 className="text-3xl font-semibold ">Filtres interactifs</h2>
          <p className="text-base text-slate-500">
            Ajustez l&apos;année et le périmètre pour recalculer les KPI.
          </p>
          {isLoading && (
            <p className="text-sm text-slate-400">Chargement des options...</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="yearSelect"
              className="font-semibold text-base text-slate-700"
            >
              Année :
            </label>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger id="yearSelect" className="w-32 ">
                <SelectValue placeholder="Choisir l'année" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Années</SelectLabel>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Commune Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="communeSelect"
              className="font-semibold text-base text-slate-700"
            >
              Commune :
            </label>
            <Select
              open={isCommuneSelectOpen}
              onOpenChange={setIsCommuneSelectOpen}
              value={isFullWilaya ? fullWilayaValue : selectedCommune}
              onValueChange={(value) => {
                if (value === fullWilayaValue) {
                  setIsFullWilaya(true);
                  return;
                }
                setIsFullWilaya(false);
                setSelectedCommune(value);
              }}
            >
              <SelectTrigger id="communeSelect" className="w-60 ">
                <SelectValue placeholder="Choisir une commune" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <div className="px-2 pb-2">
                  <input
                    type="text"
                    value={communeSearch}
                    onChange={(event) => setCommuneSearch(event.target.value)}
                    placeholder="Rechercher une commune..."
                    onKeyDown={(event) => event.stopPropagation()}
                    className="w-full rounded-md border border-input bg-transparent px-2 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <SelectGroup>
                  <SelectLabel>Mode</SelectLabel>
                  <SelectItem value={fullWilayaValue}>
                    🔁 Full Wilaya (toutes les communes)
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Communes</SelectLabel>
                  {filteredCommunes.length ? (
                    filteredCommunes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-base text-muted-foreground">
                      Aucune commune trouvée
                    </div>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            {onOpenUploadModal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={onOpenUploadModal}
              >
                Importer des listes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
