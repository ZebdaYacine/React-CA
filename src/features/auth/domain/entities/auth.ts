export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  token: string;
}

export type AuthResult = { user: AuthUser } | { error: Error };
