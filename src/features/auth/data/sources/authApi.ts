import type {
  AuthCredentials,
  AuthResult,
} from "../../domain/entities/auth";

const DUMMY_USERS = [
  { username: "admin", password: "password123", token: "admin-token" },
  { username: "coder", password: "secret", token: "coder-token" },
  { username: "guest", password: "guest", token: "guest-token" },
];

function simulateNetworkDelay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function authenticate(
  credentials: AuthCredentials
): Promise<AuthResult> {
  try {
    await simulateNetworkDelay(300);

    const match = DUMMY_USERS.find(
      (user) =>
        user.username === credentials.username &&
        user.password === credentials.password
    );

    if (!match) {
      return { error: new Error("Invalid username or password") };
    }

    return { user: { username: match.username, token: match.token } };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unable to authenticate"),
    };
  }
}
