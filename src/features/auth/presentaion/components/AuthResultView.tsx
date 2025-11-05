"use client";

import { use } from "react";
import type { AuthResult } from "../../domain/entities/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../core/components/ui/card";

export function AuthResultView({
  authPromise,
}: {
  authPromise: Promise<AuthResult>;
}) {
  const result = use(authPromise);

  if ("error" in result) {
    return (
      <Card className="w-full max-w-sm border-destructive/40 bg-destructive/5 text-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Authentication failed
          </CardTitle>
        </CardHeader>
        <CardContent>{result.error.message}</CardContent>
      </Card>
    );
  }

  const { user } = result;

  return (
    <Card className="w-full max-w-sm border-emerald-400/40 bg-emerald-500/5 text-emerald-900">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Welcome back, {user.username}!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-emerald-700">
        Session token: <span className="font-mono">{user.token}</span>
      </CardContent>
    </Card>
  );
}
