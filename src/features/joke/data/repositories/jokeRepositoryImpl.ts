import type { Joke } from "../../domain/entities/joke";
import type { JokeRepository } from "../../domain/repositories/jokeRepository";
import { fetchJokeFromApi } from "../sources/jokeApi";

type T = { joke: Joke } | { error: Error };

/**
 * Concrete repository that fulfills the domain’s contract
 * using an external REST API.
 */
export class JokeRepositoryImpl implements JokeRepository {
  async getRandomJoke(): Promise<T> {
    return fetchJokeFromApi();
  }
}
