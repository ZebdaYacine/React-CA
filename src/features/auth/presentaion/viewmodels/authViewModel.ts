"use client";

import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import type { AuthCredentials, AuthResult } from "../../domain/entities/auth";
import { AuthRepositoryImpl } from "../../data/repositories/authRepositoryImpl";
import { LoginUseCase } from "../../domain/usecases/loginUseCase";
import {
  clearPersistedAuthUser,
  persistAuthUser,
} from "../../domain/services/tokenStorage";

export function useAuthViewModel() {
  const [resource, setResource] = useState<Promise<AuthResult> | null>(null);

  const repository = useMemo(() => new AuthRepositoryImpl(), []);
  const loginUseCase = useMemo(
    () => new LoginUseCase(repository),
    [repository]
  );

  const { trigger, isMutating } = useSWRMutation<
    AuthResult,
    Error,
    string,
    AuthCredentials
  >("auth/login", async (_key, { arg }) => {
    const result = await loginUseCase.execute(arg);
    return result;
  });

  const login = (credentials: AuthCredentials) => {
    const resultPromise = trigger(credentials)
      .then((result) => {
        if ("user" in result) {
          persistAuthUser(result.user);
        } else {
          clearPersistedAuthUser();
        }
        return result;
      })
      .catch(
        (error): AuthResult => ({
          error: error instanceof Error ? error : new Error("Unknown error"),
        })
      );

    setResource(resultPromise);
  };

  return {
    isLoading: isMutating,
    login,
    resource,
  };
}
