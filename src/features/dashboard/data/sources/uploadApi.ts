import { getPersistedAuthToken } from "../../../auth/domain/services/tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type UploadPayload = {
  retraitesFile?: File | null;
  tpFile?: File | null;
  communesFile?: File | null;
};

export async function uploadDashboardFiles({
  retraitesFile,
  tpFile,
  communesFile,
}: UploadPayload) {
  const formData = new FormData();
  const hasFiles =
    !!retraitesFile || !!tpFile || !!communesFile;

  if (retraitesFile) {
    formData.append("retraitesFile", retraitesFile);
  }
  if (tpFile) {
    formData.append("tpFile", tpFile);
  }
  if (communesFile) {
    formData.append("communesFile", communesFile);
  }

  if (!hasFiles) {
    throw new Error("Veuillez sélectionner au moins un fichier à envoyer.");
  }

  const token = getPersistedAuthToken();

  const response = await fetch(`${API_BASE_URL}/upload/dashboard-data`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as { error?: string; message?: string };

  if (!response.ok) {
    const message =
      payload?.error ??
      payload?.message ??
      "Échec de l'importation des fichiers.";
    throw new Error(message);
  }

  return payload;
}
