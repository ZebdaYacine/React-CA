"use client";

import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthViewModel } from "../viewmodels/authViewModel";
import { AuthResultView } from "../components/AuthResultView";
import { Button } from "../../../../core/components/ui/button";

export default function LoginPage() {
  const { isLoading, login, resource } = useAuthViewModel();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login({ username, password });
  };

  const isDisabled = isLoading || !username || !password;

  useEffect(() => {
    if (!resource) {
      return;
    }

    let cancelled = false;

    resource.then((result) => {
      if (cancelled || "error" in result) {
        return;
      }

      navigate("/dashboard", { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [resource, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">
            Use one of the demo accounts to explore the authentication flow.
          </p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-left text-sm font-medium text-gray-700">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              autoComplete="username"
              className="h-10 rounded-md border border-gray-300 px-3 text-sm shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="admin"
            />
          </label>

          <label className="flex flex-col gap-1 text-left text-sm font-medium text-gray-700">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-10 rounded-md border border-gray-300 px-3 text-sm shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="password123"
            />
          </label>

          <Button type="submit" disabled={isDisabled}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <section className="text-xs text-gray-500">
          <p className="font-semibold">Demo credentials</p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>admin / password123</li>
            <li>coder / secret</li>
            <li>guest / guest</li>
          </ul>
        </section>

        <Suspense
          fallback={
            <div className="text-sm text-gray-500">Checking credentials...</div>
          }
        >
          {resource ? <AuthResultView authPromise={resource} /> : null}
        </Suspense>
      </div>
    </main>
  );
}
