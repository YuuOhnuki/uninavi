# Uvinavi Next.js Starter

Production-ready Next.js 16 template pairing React 19, Tailwind CSS v4, and Shadcn UI components. Use this repository as a baseline for dashboards or SaaS products with opinionated linting, formatting, and type-safety defaults.

## ✨ Features

- **Modern stack** – Next.js App Router, server components, and React 19 streaming support.
- **UI primitives** – Shadcn UI components backed by Radix primitives and Lucide icons.
- **DX guardrails** – ESLint (Core Web Vitals), Prettier + Tailwind plugin, and TypeScript strict mode.
- **Responsive layout** – Ready-made marketing page sections showcasing how to compose components.
- **Consistent tooling** – Single-command scripts for linting, formatting, and type checking.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- Package manager of your choice (examples use `bun`)

### Installation

```bash
git clone https://github.com/YuuOhnuki/nextjs-startar
cd nextjs-startar
bun install
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the starter interface.

## 📦 Available Scripts

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `bun dev`              | Run the Next.js development server.                     |
| `bun run build`        | Create an optimized production build.                   |
| `bun run start`        | Serve the production build locally.                     |
| `bun run lint`         | Lint all files with ESLint (fails on warnings).         |
| `bun run lint:fix`     | Automatically fix lint issues where possible.           |
| `bun run format`       | Format the codebase with Prettier and Tailwind sorting. |
| `bun run format:check` | Verify formatting without writing changes.              |
| `bun run typecheck`    | Run TypeScript checks in `--noEmit` mode.               |

## 🧱 Project Structure

```
src/
├─ app/
│  ├─ layout.tsx         # Global layout, fonts, and navigation
│  └─ page.tsx           # Marketing-style landing sections
├─ components/
│  ├─ index.ts           # Barrel exports for layout/sections/UI
│  ├─ layout/            # Layout-level components (site header)
│  ├─ sections/          # Hero, features, stack, tooling sections
│  └─ ui/                # Shadcn UI primitives
├─ hooks/                # Custom React hooks (e.g., responsive helpers)
├─ lib/                  # Utilities and shared helpers
└─ styles/               # Tailwind & global styles (see `app/globals.css`)
```

> Tailwind v4 configuration lives inside `app/globals.css` alongside theme tokens and variants.

## 🛠 Tooling & Configuration

- **ESLint** – Configured via `eslint.config.mjs` with strict Core Web Vitals and TypeScript rules.
- **Prettier** – `.prettierrc.json` aligns formatting style (semicolons, single quotes, Tailwind sorting).
- **Prettier ignore** – `.prettierignore` excludes build artifacts and dependencies.
- **TypeScript** – `tsconfig.json` declares `@/*` path aliases and strict compiler settings.
- **Tailwind CSS** – PostCSS plugin pipeline using `@tailwindcss/postcss` and `tw-animate-css` utilities.

## 🧩 UI Overview

- `components/layout/site-header.tsx` – Sticky header with navigation anchors and GitHub CTA.
- `components/sections/*` – Modular sections reused in `app/page.tsx` to showcase template content.
- `components/ui/*` – Auto-generated Shadcn UI primitives ready for composition across the app.

## ✅ Recommended Next Steps

1. Replace placeholder copy (org name, GitHub URL) with your branding.
2. Configure CI (GitHub Actions, Vercel, etc.) to run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
3. Extend `components/sections` with your product-specific content or convert sections into dynamic data-driven components.

## 📄 License

This template is MIT licensed. Feel free to fork and adapt for commercial or open-source projects.
