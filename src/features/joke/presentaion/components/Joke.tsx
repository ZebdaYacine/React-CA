"use client";

import { use } from "react";
import type { Joke } from "../../domain/entities/joke";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../core/components/ui/card";

type JokeResult = { joke: Joke } | { error: Error };

export function JokeView({
  jokePromise,
}: {
  jokePromise: Promise<JokeResult>;
}) {
  const result = use(jokePromise);

  if ("error" in result) {
    return (
      <div className="text-red-500 mt-6">Error: {result.error.message}</div>
    );
  }

  const { joke } = result;

  return (
    <Card className="w-full max-w-sm  bg-green">
      <CardHeader>
        <CardTitle>{joke.setup}</CardTitle>
        {joke.punchline}
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
