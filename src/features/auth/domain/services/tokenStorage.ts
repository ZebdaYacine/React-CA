import type { AuthUser } from "../entities/auth";

const AUTH_STORAGE_KEY = "laghouat.auth-user";

const isBrowser = () => typeof window !== "undefined";

export function persistAuthUser(user: AuthUser) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures (Safari private mode, etc.)
  }
}

export function clearPersistedAuthUser() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore failures
  }
}

export function getPersistedAuthUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getPersistedAuthToken(): string | null {
  const user = getPersistedAuthUser();
  return user?.token ?? null;
}
