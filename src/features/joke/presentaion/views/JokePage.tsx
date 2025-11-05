"use client";

import { Suspense } from "react";
import { useJokeViewModel } from "../viewmodels/jokeViewModel";
import { Button } from "../../../../core/components/ui/button";
import { JokeView } from "../components/Joke";

export default function JokePage() {
  const { resource, isLoading, loadJoke } = useJokeViewModel();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md p-4 text-center">
        <Button onClick={loadJoke} disabled={isLoading}>
          {isLoading ? "Loading..." : "Get a Random Joke"}
        </Button>

        <Suspense fallback={<div>... loading joke</div>}>
          {resource ? <JokeView jokePromise={resource} /> : null}
        </Suspense>
      </div>
    </main>
  );
}
