"use client";

import { createBrowserRouter } from "react-router-dom";
import { startProgress, doneProgress } from "./lib/utils";
import { withAuthGuard, withPublicGuard } from "./routerGuards";

async function loadDashboard() {
  startProgress();
  try {
    const { default: DashboardPage } = await import(
      "./features/dashboard/presentaion/views/DashboardPage"
    );
    return { Component: withAuthGuard(DashboardPage) };
  } finally {
    doneProgress();
  }
}

async function loadLogin() {
  startProgress();
  try {
    const { default: LoginPage } = await import(
      "./features/auth/presentaion/views/LoginPage"
    );
    return { Component: withPublicGuard(LoginPage) };
  } finally {
    doneProgress();
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    lazy: loadDashboard,
  },
  {
    path: "/dashboard",
    lazy: loadDashboard,
  },
  {
    path: "/login",
    lazy: loadLogin,
  },
  {
    path: "/auth",
    lazy: loadLogin,
  },
  {
    path: "/auth/login",
    lazy: loadLogin,
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
