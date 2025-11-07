import type { AuthCredentials, AuthResult } from "../../domain/entities/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const AUTH_ENDPOINT = `${API_BASE_URL}/auth/login`;

type AuthSuccessPayload = {
  username: string;
  token: string;
};

type AuthErrorPayload = {
  error?: string;
};

const isAuthSuccessPayload = (
  payload: unknown
): payload is AuthSuccessPayload => {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("username" in payload) ||
    !("token" in payload)
  ) {
    return false;
  }
  const parsed = payload as Record<string, unknown>;
  return (
    typeof parsed.username === "string" && typeof parsed.token === "string"
  );
};

export async function authenticate(
  credentials: AuthCredentials
): Promise<AuthResult> {
  try {
    const response = await fetch(AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const payload = (await response.json().catch(() => null)) as
      | AuthSuccessPayload
      | AuthErrorPayload
      | null;

    if (!response.ok || !payload || "error" in payload) {
      const message =
        (payload as AuthErrorPayload | null)?.error ??
        `Échec de l'authentification (${response.status})`;
      return { error: new Error(message) };
    }

    if (!isAuthSuccessPayload(payload)) {
      return { error: new Error("Réponse du serveur invalide") };
    }

    return {
      user: {
        username: payload.username,
        token: payload.token,
      },
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Impossible de contacter le serveur d'authentification"),
    };
  }
}
