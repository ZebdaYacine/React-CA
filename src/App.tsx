"use client";

import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ThemeProvider, useTheme } from "./core/hooks/ThemeContext";

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "var(--btn-bg)",
        color: "var(--btn-text)",
      }}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeToggleButton />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
