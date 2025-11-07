"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../../core/components/ui/button";
import { uploadDashboardFiles } from "../../data/sources/uploadApi";
import { toast } from "sonner";

type UploadDataModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UploadDataModal({
  isOpen,
  onClose,
}: UploadDataModalProps) {
  const [retraitesFile, setRetraitesFile] = useState<File | null>(null);
  const [tpFile, setTpFile] = useState<File | null>(null);
  const [communesFile, setCommunesFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRetraitesFile(null);
      setTpFile(null);
      setCommunesFile(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);
    try {
      await uploadDashboardFiles({ retraitesFile, tpFile, communesFile });
      toast.success("Import terminé avec succès.");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import impossible.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const fileInputs = [
    {
      id: "retraitesFile",
      label: "Liste des retraités (.xls / .xlsx)",
      setter: setRetraitesFile,
    },
    { id: "tpFile", label: "Liste des TP (.xls / .xlsx)", setter: setTpFile },
    {
      id: "communesFile",
      label: "Liste des communes (.xls / .xlsx)",
      setter: setCommunesFile,
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Importer des données</h3>
            <p className="text-sm text-slate-500">
              Chargez vos fichiers Excel pour actualiser les listes.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            Fermer
          </Button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {fileInputs.map(({ id, label, setter }) => (
            <div key={id} className="flex flex-col gap-2">
              <label
                htmlFor={id}
                className="text-sm font-semibold text-slate-700"
              >
                {label}
              </label>
              <input
                id={id}
                type="file"
                accept=".xls,.xlsx"
                onChange={(event) => setter(event.target.files?.[0] ?? null)}
                className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
              />
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Import en cours..." : "Envoyer les fichiers"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
