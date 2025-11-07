import type { Dashboard } from "../../domain/entities/dashboard";
import type { DashboardRepository } from "../../domain/repositories/dashboardRepository";
import { fetchDashboardFromApi } from "../sources/dashboardApi";


/**
 * Concrete repository that fulfills the domain’s contract
 * using an external REST API.
 */
export type T = { dashboard: Dashboard } | { error: Error };

export class DashboardRepositoryImpl implements DashboardRepository {
  getRandomDashboard(): Promise<T> {
    return fetchDashboardFromApi();
  }
}
