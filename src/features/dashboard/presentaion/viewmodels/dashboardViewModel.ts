"use client";

import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import type { Dashboard } from "../../domain/entities/dashboard";
import { DashboardUseCase } from "../../domain/usecases/dashboardUseCase";
import { DashboardRepositoryImpl } from "../../data/repositories/dashboardRepositoryImpl";

type DashboardResult = { dashboard: Dashboard } | { error: Error };

export function useJokeViewModel() {
  const [resource, setResource] = useState<Promise<DashboardResult> | null>(
    null
  );

  const repository = useMemo(() => new DashboardRepositoryImpl(), []);
  const dashboardUseCase = useMemo(
    () => new DashboardUseCase(repository),
    [repository]
  );

  const { trigger, isMutating } = useSWRMutation<
    DashboardResult,
    Error,
    string
  >("joke/random", async () => {
    const result = await dashboardUseCase.execute();
    return result;
  });

  const loadJoke = () => {
    const resultPromise = trigger().catch(
      (error): DashboardResult => ({
        error: error instanceof Error ? error : new Error("Unknown error"),
      })
    );

    setResource(resultPromise);
  };

  return {
    isLoading: isMutating,
    loadJoke,
    resource,
  };
}
