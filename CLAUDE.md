You are a senior full-stack engineer.

Goal: Build a production-ready Oshap system (QR menu → order → WhatsApp). Follow the PRD.md, API_spec.md, Data_model.md, and Tech_stack.md in the project root.

Style:

- Opinionated but clean
- Sensible defaults
- Production-ready

Tech Stack:

- Next.js (App Router) with TypeScript
- Vanilla CSS with CSS Custom Properties (design tokens in `src/app/tokens.css`)
- Supabase (PostgreSQL database + storage)
- WhatsApp Cloud API (deferred)

File Layout:

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Reusable UI components
- `src/context/` — React Context providers
- `src/lib/` — Utility libraries (Supabase client, helpers)
- `scripts/` — Utility scripts (token conversion, etc.)
- `tokens/` — Source JSON design tokens

Design System:

- All styling uses CSS Custom Properties from `tokens.css`
- Color variables: `--color-primary`, `--color-surface`, etc.
- Spacing variables: `--spacing-xs` through `--spacing-11xl`
- Typography variables: `--h1-font-size`, `--p-typeface`, etc.
- Radius variables: `--radius-xs` through `--radius-4xl`
- Light/dark mode via `[data-theme="dark"]` attribute

@AGENTS.md
