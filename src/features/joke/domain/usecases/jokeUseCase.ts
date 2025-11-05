import type { Joke } from "../entities/joke";
import type { JokeRepository } from "../repositories/jokeRepository";

/**
 * Use Case: Fetch a random joke.
 * This is where business logic resides, separate from UI or data.
 */

type T = { joke: Joke } | { error: Error };

export class JokeUseCase {
  private readonly jokeRepository: JokeRepository;

  constructor(jokeRepository: JokeRepository) {
    this.jokeRepository = jokeRepository;
  }

  async execute(): Promise<T> {
    return this.jokeRepository.getRandomJoke();
  }
}
