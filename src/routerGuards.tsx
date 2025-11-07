"use client";

import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { getPersistedAuthToken } from "./features/auth/domain/services/tokenStorage";

function getToken() {
  return getPersistedAuthToken();
}

export function withAuthGuard<P extends object>(Component: ComponentType<P>) {
  function GuardedComponent(props: P) {
    const token = getToken();
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return <Component {...props} />;
  }

  GuardedComponent.displayName = `WithAuthGuard(${
    Component.displayName || Component.name || "Component"
  })`;

  return GuardedComponent;
}

export function withPublicGuard<P extends object>(Component: ComponentType<P>) {
  function GuardedComponent(props: P) {
    const token = getToken();
    if (token) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Component {...props} />;
  }

  GuardedComponent.displayName = `WithPublicGuard(${
    Component.displayName || Component.name || "Component"
  })`;

  return GuardedComponent;
}
