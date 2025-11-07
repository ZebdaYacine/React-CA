import { getPersistedAuthToken } from "../../../auth/domain/services/tokenStorage";
import type { Dashboard } from "../../domain/entities/dashboard";
export type DashboardResult = { dashboard: Dashboard } | { error: Error };

const Dashboard_API_URL = "https://official-joke-api.appspot.com/random_joke";

export async function fetchDashboardFromApi(): Promise<DashboardResult> {
  try {
    const token = getPersistedAuthToken();
    const response = await fetch(Dashboard_API_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      return { error: new Error(`Failed to fetch joke: ${response.status}`) };
    }

    const dashboard = (await response.json()) as Dashboard;
    return { dashboard };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}
