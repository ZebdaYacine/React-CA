"use client";

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-600">
        The page you’re looking for doesn’t exist. Try heading back to the joke generator.
      </p>
      <Link className="text-blue-600 underline underline-offset-4" to="/">
        Go to homepage
      </Link>
    </main>
  );
}
