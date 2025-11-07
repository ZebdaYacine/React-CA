import type { Dashboard } from "../entities/dashboard";
import type { DashboardRepository } from "../repositories/dashboardRepository";

/**
 * Use Case: Fetch a random joke.
 * This is where business logic resides, separate from UI or data.
 */

export type T = { dashboard: Dashboard } | { error: Error };

export class DashboardUseCase {
  private readonly DashboardRepository: DashboardRepository;

  constructor(jokeRepository: DashboardRepository) {
    this.DashboardRepository = jokeRepository;
  }

  async execute(): Promise<T> {
    return this.DashboardRepository.getRandomDashboard();
  }
}
