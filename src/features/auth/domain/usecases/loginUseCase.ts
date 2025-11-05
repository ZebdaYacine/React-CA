import type { AuthCredentials, AuthResult } from "../entities/auth";
import type { AuthRepository } from "../repositories/authRepository";

export class LoginUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(credentials: AuthCredentials): Promise<AuthResult> {
    return this.authRepository.login(credentials);
  }
}
