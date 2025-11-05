"use client";

import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import { JokeRepositoryImpl } from "../../data/repositories/jokeRepositoryImpl";
import type { Joke } from "../../domain/entities/joke";
import { JokeUseCase } from "../../domain/usecases/jokeUseCase";

type JokeResult = { joke: Joke } | { error: Error };

export function useJokeViewModel() {
  const [resource, setResource] = useState<Promise<JokeResult> | null>(null);

  const repository = useMemo(() => new JokeRepositoryImpl(), []);
  const jokeUseCase = useMemo(() => new JokeUseCase(repository), [repository]);

  const { trigger, isMutating } = useSWRMutation<JokeResult, Error, string>(
    "joke/random",
    async () => {
      const result = await jokeUseCase.execute();
      return result;
    }
  );

  const loadJoke = () => {
    const resultPromise = trigger().catch(
      (error): JokeResult => ({
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
