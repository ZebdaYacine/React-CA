"use client";

import { createBrowserRouter } from "react-router-dom";
import { startProgress, doneProgress } from "./lib/utils";

const router = createBrowserRouter([
  {
    path: "/",
    async lazy() {
      startProgress();
      try {
        const { default: JokePage } = await import(
          "./features/joke/presentaion/views/JokePage"
        );
        return { Component: JokePage };
      } finally {
        doneProgress();
      }
    },
  },
  {
    path: "/joke",
    async lazy() {
      startProgress();
      try {
        const { default: JokePage } = await import(
          "./features/joke/presentaion/views/JokePage"
        );
        return { Component: JokePage };
      } finally {
        doneProgress();
      }
    },
  },
  {
    path: "/auth",
    async lazy() {
      startProgress();
      try {
        const { default: LoginPage } = await import(
          "./features/auth/presentaion/views/LoginPage"
        );
        return { Component: LoginPage };
      } finally {
        doneProgress();
      }
    },
  },
  {
    path: "/auth/login",
    async lazy() {
      startProgress();
      try {
        const { default: LoginPage } = await import(
          "./features/auth/presentaion/views/LoginPage"
        );
        return { Component: LoginPage };
      } finally {
        doneProgress();
      }
    },
  },
  {
    path: "*",
    async lazy() {
      startProgress();
      try {
        const { default: NotFoundPage } = await import("./pages/NotFound");
        return { Component: NotFoundPage };
      } finally {
        doneProgress();
      }
    },
  },
]);

export default router;
