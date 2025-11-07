# React Clean Architecture

<p align='center'>
  <a href='https://react.dev' target='_blank'><img src='https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB' alt='React'></a>
  <a href='https://www.typescriptlang.org/' target='_blank'><img src='https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white' alt='TypeScript'></a>
  <a href='https://vite.dev' target='_blank'><img src='https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white' alt='Vite'></a>
  <a href='https://tailwindcss.com/' target='_blank'><img src='https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white' alt='Tailwind CSS'></a>
  <a href='https://reactrouter.com/' target='_blank'><img src='https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white' alt='React Router'></a>
  <a href='https://radix-ui.com/' target='_blank'><img src='https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white' alt='Radix UI'></a>
  <a href='https://swr.vercel.app/' target='_blank'><img src='https://img.shields.io/badge/SWR-000000?style=for-the-badge&logo=vercel&logoColor=white' alt='SWR'></a>
</p>

> Clean architecture playground showcasing domain-driven features, async data flows, and theme-aware UI powered by modern React tooling.

## Overview
This project is a learning sandbox that demonstrates how to structure a React application using clean architecture principles. It combines domain-driven modules with a composable UI system and modern build tooling to keep features isolated, testable, and easy to extend.

## Highlights
- Feature-based folders that encapsulate domain, data, and presentation layers.
- Dark/light theme support via a global `ThemeProvider` and CSS custom properties.
- Type-safe API interactions and state handling with SWR and custom hooks.
- Reusable UI primitives built on top of Radix UI, Tailwind CSS, and class-variance-authority.
- Modern developer experience with Vite, TypeScript, ESLint, and fast-refresh React 19.

## Tech Stack
| Category | Tools |
| --- | --- |
| Core | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, custom tokens, Radix UI primitives |
| State & Data | SWR, custom hooks, feature view models |
| Tooling | ESLint, TypeScript ESLint, rolldown Vite, NProgress |

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   The app is served on http://localhost:5173 by default.
3. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Available Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot module replacement. |
| `npm run build` | Type-check the project and produce an optimized production build. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the entire codebase. |

## Project Structure
```text
src/
|-- core/                # App-wide hooks, UI primitives, and utilities
|   |-- components/ui/    # Reusable design system components
|   `-- hooks/            # Shared hooks (e.g., ThemeProvider)
|-- features/
|   |-- auth/             # Authentication domain (data, domain, presentation)
|   `-- joke/             # Joke domain with async fetching and suspense
|-- pages/               # Route-level wrappers (if needed)
|-- lib/                 # Cross-cutting helpers (e.g., className utils)
|-- App.tsx              # App shell with global providers
`-- router.tsx           # Route definitions using React Router
```

## Architectural Notes
- **Clean layers:** Each feature keeps its domain entities, repositories, use cases, and presentation logic together, reducing cross-module coupling.
- **UI theming:** Theme tokens are defined in `src/index.css` and toggled through the `ThemeProvider`, ensuring components read from CSS variables instead of hard-coded colors.
- **Async UX:** Suspense boundaries and loading states deliver responsive feedback for API calls.

## Development Tips
- Prefer adding logic inside feature view models or domain use-cases rather than components to keep presentation simple.
- When styling new components, rely on the design tokens (`bg-background`, `text-foreground`, etc.) so that dark mode stays consistent.
- Run `npm run lint` before committing to catch potential issues early.

## Useful Resources
- [React Docs](https://react.dev/)
- [Clean Architecture in Frontend](https://www.freecodecamp.org/news/software-architecture-patterns/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [SWR Documentation](https://swr.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/)
