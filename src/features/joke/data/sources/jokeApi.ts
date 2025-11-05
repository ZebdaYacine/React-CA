import type { Joke } from "../../domain/entities/joke";

export type JokeResult = { joke: Joke } | { error: Error };

const JOKE_API_URL = "https://official-joke-api.appspot.com/random_joke";

export async function fetchJokeFromApi(): Promise<JokeResult> {
  try {
    const response = await fetch(JOKE_API_URL);

    if (!response.ok) {
      return { error: new Error(`Failed to fetch joke: ${response.status}`) };
    }

    const joke = (await response.json()) as Joke;
    return { joke };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}
