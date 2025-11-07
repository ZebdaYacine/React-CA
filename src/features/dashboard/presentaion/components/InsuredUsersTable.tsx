"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../core/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../core/components/ui/select";
import { exportToExcel } from "../viewmodels/exportToExcel";
import { Button } from "../../../../core/components/ui/button";

export type InsuredUser = {
  nom: string;
  prenom: string;
  nomPere: string;
  nomMere: string;
  tpSolde: number;
  tpGenere: number;
  nPension: string;
  dateNaissance: string;
  dateDeces?: string;
  typeTP: string;
  commune?: string;
};

type InsuredUsersTableProps = {
  users: InsuredUser[];
  title?: string;
};

export default function InsuredUsersTable({
  users,
  title = "Liste des assurés",
}: InsuredUsersTableProps) {
  const PAGE_SIZE = 50;
  const types = ["Tous", "Mensuel", "Trimestriel", "Exceptionnel"];
  const [selectedType, setSelectedType] = useState<string>("Tous");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(
    () =>
      selectedType === "Tous"
        ? users
        : users.filter((u) => u.typeTP === selectedType),
    [selectedType, users]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, users]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [filteredUsers.length, PAGE_SIZE]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(
    pageStartIndex + PAGE_SIZE,
    filteredUsers.length
  );
  const paginatedUsers = filteredUsers.slice(pageStartIndex, pageEndIndex);
  const showingFrom = filteredUsers.length ? pageStartIndex + 1 : 0;
  const showingTo = filteredUsers.length ? pageEndIndex : 0;

  const handleExport = () => {
    exportToExcel(filteredUsers, "Assures_Laghouat");
  };

  return (
    <div className="rounded-2xl border  p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b  pb-3 mb-4 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide ">
            Données des assurés
          </p>
          <h3 className="text-lg font-semibold ">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="tpTypeFilter"
            className="text-xs text-slate-500 whitespace-nowrap"
          >
            Type de TP :
          </label>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value)}
          >
            <SelectTrigger className="w-48 ">
              <SelectValue placeholder="Choisir le type de TP" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-md text-slate-500">
            {filteredUsers.length} assurés filtrés
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="text-slate-500">
            Liste des assurés et leurs informations de TP
          </TableCaption>
          <TableHeader>
            <TableRow className="">
              <TableHead>N° Pension</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Date de Naissance</TableHead>
              <TableHead>Nom du Père</TableHead>
              <TableHead>Nom de la Mère</TableHead>
              <TableHead>Commune</TableHead>
              <TableHead>Type de TP</TableHead>
              <TableHead className="text-right">TP Généré (DA)</TableHead>
              <TableHead className="text-right">TP Soldé (DA)</TableHead>
              <TableHead>Date de Décès</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers.length ? (
              paginatedUsers.map((user, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <TableCell>{user.nPension}</TableCell>
                  <TableCell>{user.nom}</TableCell>
                  <TableCell>{user.prenom}</TableCell>
                  <TableCell>{user.dateNaissance}</TableCell>
                  <TableCell>{user.nomPere}</TableCell>
                  <TableCell>{user.nomMere}</TableCell>
                  <TableCell>{user.commune ?? "—"}</TableCell>
                  <TableCell>{user.typeTP}</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {user.tpGenere.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {user.tpSolde.toLocaleString()}
                  </TableCell>
                  <TableCell>{user.dateDeces ? user.dateDeces : "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-slate-500 py-6"
                >
                  Aucun assuré trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {filteredUsers.length
              ? `Affichage ${showingFrom}-${showingTo} sur ${filteredUsers.length} assurés`
              : "Aucun assuré à afficher"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              ◀ Précédent
            </Button>
            <span className="text-sm font-medium text-slate-600">
              Page {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safePage === totalPages}
            >
              Suivant ▶
            </Button>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="sm:ml-auto"
          >
            📥 Exporter vers Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
