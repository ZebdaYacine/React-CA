import type {
  AuthCredentials,
  AuthResult,
} from "../../domain/entities/auth";
import type { AuthRepository } from "../../domain/repositories/authRepository";
import { authenticate } from "../sources/authApi";

export class AuthRepositoryImpl implements AuthRepository {
  async login(credentials: AuthCredentials): Promise<AuthResult> {
    return authenticate(credentials);
  }
}
