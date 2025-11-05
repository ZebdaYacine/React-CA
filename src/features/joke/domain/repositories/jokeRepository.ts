import type { Joke } from "../entities/joke";

/**
 * Abstract contract for JokeRepository — defines what operations
 * are possible on the Joke entity, without knowing how they’re implemented.
 */

type T = { joke: Joke } | { error: Error };

export interface JokeRepository {
  getRandomJoke(): Promise<T>;
}
