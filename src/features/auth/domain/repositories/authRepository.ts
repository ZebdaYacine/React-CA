import type {
  AuthCredentials,
  AuthResult,
} from "../entities/auth";

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthResult>;
}
