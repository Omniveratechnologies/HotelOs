# @hotelos/styles

The single source of truth for HotelOS design tokens and theme styles, built
with the **Tailwind CSS v4 CSS-first** approach. Every frontend app
(receptionist, sub-admin, super-admin, and future ones) will consume their
custom colors and semantic tokens from this package so the whole platform
stays visually consistent.

- Package name: `@hotelos/styles`
- Location: `packages/styles`
- Depends on: `tailwindcss` `^4` (peer) — consumed through each app's CSS,
  no build step of its own.

Only tokens that are **not** Tailwind defaults and that carry real meaning are
defined here. Everything Tailwind already provides (status colors, radius,
shadow, animation, z-index, the default font stack, spacing, …) is left to the
framework and not duplicated.

Initial token values are extracted from the **receptionist** app color system
and act as the canonical HotelOS look until a theme is introduced.

---

## Folder structure

```
packages/styles/
│
├── package.json              Workspace metadata + CSS `exports` map
├── README.md
└── src/
    ├── index.css             Full theme entry (bootstrap + tokens + base + utilities)
    ├── tokens.css            All custom @theme {} design tokens (the source of truth)
    └── base/
        ├── base.css          @layer base — body, borders, selection, focus, cursor
        └── utilities.css     @utility — gradients, card surfaces, scrollbars, print
```

---

## Exports

`package.json` exposes these CSS import paths (CSS-only; there is no JS entry):

| Import path                          | Contents                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| `@hotelos/styles`                    | Full theme entry (bootstrap + tokens + base + utilities) |
| `@hotelos/styles/index.css`          | Same as above (explicit path)                            |
| `@hotelos/styles/tokens.css`         | Design tokens only                                       |
| `@hotelos/styles/base/base.css`      | Global `@layer base` defaults                            |
| `@hotelos/styles/base/utilities.css` | Custom `@utility` definitions                            |

---

## Token naming conventions

### Color scales

Every color family is registered as `--color-<family>-<step>` with a full
**50 → 950** scale (steps `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`):

| Family       | Role                                | Seed (from receptionist)                       |
| ------------ | ----------------------------------- | ---------------------------------------------- |
| `brand`      | Primary brand, dark surfaces/nav    | navy `700 #1e3a5f · 800 #162847 · 900 #0f1f3d` |
| `primary`    | Accent / highlight / focus          | gold `400 #c9a84c · 500 #b8922e · 600 #9a7820` |
| `background` | App canvas                          | cream `50 #faf8f4 · 100 #f4f0e8`               |
| `surface`    | Cards, dialogs, elevated containers | white `50 #ffffff`                             |

> Only these custom scales are defined. Status colors (success / warning /
> danger / info) and the neutral family intentionally use Tailwind's built-in
> `green` / `amber` / `red` / `blue` / `gray` defaults — they are not
> duplicated here.

These produce utilities like `bg-brand-900`, `text-primary-400`, `bg-surface-50`,
etc. When refining a family, always evolve the whole scale so every utility
(`bg-brand-700`, `bg-primary-300`, …) is available.

### Semantic tokens

`tokens.css` also registers semantic aliases that describe **role, not
color**, so an app can stay theme-agnostic:

```
--color-background       --color-foreground
--color-card / --color-card-foreground
--color-popover / --color-popover-foreground
--color-border  --color-input  --color-ring
--color-primary / --color-primary-foreground
--color-muted / --color-muted-foreground
--color-accent / --color-accent-foreground
```

These begin with `--color-`, so Tailwind utilities resolve directly:
`bg-background`, `text-foreground`, `border-border`, `ring-ring`, `bg-card`,
`text-muted-foreground`, …

Current default resolutions:

| Token                        | Resolves to                          |
| ---------------------------- | ------------------------------------ |
| `--color-background`         | `--color-background-50` (`#faf8f4`)  |
| `--color-foreground`         | `--color-brand-900` (`#0f1f3d`)      |
| `--color-card`               | `--color-surface-50` (`#ffffff`)     |
| `--color-card-foreground`    | `--color-brand-900` (`#0f1f3d`)      |
| `--color-popover`            | `--color-surface-50` (`#ffffff`)     |
| `--color-popover-foreground` | `--color-brand-900` (`#0f1f3d`)      |
| `--color-border`             | `--color-surface-200` (`#ecebe5`)    |
| `--color-input`              | `--color-surface-200` (`#ecebe5`)    |
| `--color-ring`               | `--color-primary-400` (`#c9a84c`)    |
| `--color-primary`            | `--color-primary-500` (`#b8922e`)    |
| `--color-primary-foreground` | `--color-brand-900` (`#0f1f3d`)      |
| `--color-muted`              | `--color-background-100` (`#f4f0e8`) |
| `--color-muted-foreground`   | `--color-brand-700` (`#1e3a5f`)      |
| `--color-accent`             | `--color-background-100` (`#f4f0e8`) |
| `--color-accent-foreground`  | `--color-brand-900` (`#0f1f3d`)      |

### Typography

The only custom font token is `--font-display` (Georgia), matching the
receptionist app's display headings. The body stack uses Tailwind's default.

Everything else — radius (`--radius-*`), shadows (`--shadow-*`), animations
(`--animate-*`), z-index (`--z-*`), and spacing (`--spacing-*`) — stays on
Tailwind's built-in defaults and is intentionally not redefined here.

---

## How apps consume it

Install it as a `workspace:*` dependency:

```bash
pnpm add @hotelos/styles -F <app>
```

### New app (self-bootstrapping)

Import the full entry **once** in the app's global CSS. It bootstraps
Tailwind v4 itself:

```css
@import "@hotelos/styles";
```

No `tailwind.config.js` or `@theme` copy-paste needed — families, semantic
tokens, base layer, and utilities all come from the package.

### Existing Tailwind v4 app (gradual adoption)

Keep the app's own import and add the package entry after it (Tailwind v4
dedupes repeated `@import "tailwindcss"`):

```css
@import "tailwindcss";
@import "@hotelos/styles";
```

#### Granular imports

Prefer smaller, incremental migrations by importing only the layers you need:

```css
@import "tailwindcss";
@import "@hotelos/styles/tokens.css"; /* design tokens only    */
@import "@hotelos/styles/base/base.css"; /* global defaults       */
@import "@hotelos/styles/base/utilities.css"; /* custom utilities      */
```

> This is a **CSS-only** package — there is no JS entry point and no runtime
> token object. All consumption happens through CSS `@import`, so it is fully
> framework-agnostic (React, Next.js, Vite, …). Next.js apps import it from
> their global stylesheet; Vite apps from their main CSS entry. No plugins,
> loaders, or JS configuration required.

---

## How to add a new theme

A future theme (e.g. an `admin` or `dark` look) is a new `tokens.css`
variant that **overrides semantic tokens** while reusing the shared scales.
The app imports the base package plus the theme override:

```css
@import "@hotelos/styles";
@import "./theme-admin.css";
```

Where the override looks like:

```css
@theme {
  --color-background: var(--color-surface-950);
  --color-foreground: var(--color-surface-50);
  --color-card: var(--color-surface-900);
  --color-card-foreground: var(--color-surface-50);
  --color-border: var(--color-surface-800);
  /* …keep using shared brand/primary/surface families */
}
```

Because components reference semantic tokens (`bg-background`,
`text-card-foreground`, `border-border`), swapping themes never requires
component changes.

---

## How to add a new color family

1. Pick a family name (`<family>`).
2. In `src/tokens.css`, add the full `--color-<family>-50 … 950` scale,
   seeded from the intended reference values (see the table above).
3. If the family is a role (not just a raw color), add matching semantic
   `--color-*` tokens so the usual utilities resolve (e.g. `bg-card`,
   `border-border`).
4. Update this README's family table.

Every app importing `@hotelos/styles` gets the new family automatically —
no per-app config change.

---

## Available utilities

Defined in `src/base/utilities.css`:

| Utility               | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `scrollbar-thin`      | Slim branded scrollbar with gold thumb                        |
| `bg-brand-gradient`   | Right navy gradient (`brand-900 → brand-700`)                 |
| `text-brand-gradient` | Navy → gold gradient text                                     |
| `card-surface`        | Card look: card bg, default border, `2xl` radius, `xs` shadow |
| `surface-elevated`    | Same as `card-surface` but `lg` shadow (hover/raise)          |
| `surface-muted`       | Muted panel background (`--color-muted`)                      |
| `border-default`      | Applies the default `--color-border`                          |
| `no-scrollbar`        | Hides scrollbars (Firefox + WebKit)                           |
| `no-print`            | Hides the element when printing                               |
