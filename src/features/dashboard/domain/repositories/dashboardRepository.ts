import type { Dashboard } from "../entities/dashboard";

/**
 * Abstract contract for JokeRepository — defines what operations
 * are possible on the Joke entity, without knowing how they’re implemented.
 */

export type T = { dashboard: Dashboard } | { error: Error };

export interface DashboardRepository {
  getRandomDashboard(): Promise<T>;
}
