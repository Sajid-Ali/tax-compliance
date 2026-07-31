## Wrapping and setup

No provider or root wrapper is required — none of these components read from React context. Just import and use them directly.

Fonts and color tokens are both loaded globally via `styles.css` (already wired into every design): Geist Sans (body/UI text) and Geist Mono (numeric/code contexts) as `--font-geist-sans` / `--font-geist-mono`, and a full light/dark color token set (see below). You do not need to add `<link>` tags or `@font-face` rules yourself.

## Styling idiom: Tailwind utility classes over CSS custom-property tokens

This kit is styled with Tailwind v4 utility classes, where the color/radius/shadow utilities resolve to CSS custom properties (light/dark aware) rather than fixed Tailwind defaults. Always reach for these semantic utilities instead of raw hex values or arbitrary Tailwind palette classes (`bg-blue-600`, `text-gray-500`, etc.) — the semantic ones automatically adapt between light and dark mode.

**Color utilities** (`bg-*`, `text-*`, `border-*`):

| Token                                              | Use for                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `background` / `surface` / `surface-secondary`     | Page background, card/panel surface, secondary/nested surface                      |
| `border` / `border-subtle`                         | Default border, lighter separator (e.g. inside a card footer)                      |
| `foreground` / `muted-foreground`                  | Primary text, secondary/caption text                                               |
| `primary` / `primary-hover` / `primary-foreground` | Brand accent (buttons, links, active states), its hover shade, and text-on-primary |
| `pill-bg` / `pill-fg`                              | The soft pill/badge background used for section-label chips (see `PillHeader`)     |
| `success` / `success-bg` / `success-border`        | Positive status (e.g. "Filed")                                                     |
| `warning` / `warning-bg` / `warning-border`        | Caution status (e.g. "Draft ready", "Due soon")                                    |
| `danger` / `danger-bg` / `danger-border`           | Destructive action or overdue/error status                                         |
| `info` / `info-bg` / `info-border`                 | Neutral informational status (e.g. "In review")                                    |

**Radius**: `rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-xl` (maps to `--radius-sm` … `--radius-xl`). Buttons and pills use fully-rounded (`rounded-full`); cards typically use `rounded-xl`.

**Elevation**: `shadow-elevation-sm` / `shadow-elevation-md` for the two standard shadow depths (cards, raised buttons) — not Tailwind's default `shadow-md` etc.

**Typography**: default sans body copy is small (`text-sm`), headings use `text-xl`/`font-semibold`/`tracking-tight`. Captions and hints use `text-xs text-muted-foreground`.

## Where the truth lives

- `styles.css` — the token definitions (`:root` custom properties, light + `prefers-color-scheme: dark` overrides) and the `@theme inline` block that maps them to Tailwind utility names. Read this before styling anything new.
- Per-component `.prompt.md` files — usage notes and the resolved prop contract for that component.

## Example composition

```tsx
<Card className="max-w-sm">
  <CardHeader>
    <CardTitle>SECP Form A — Annual Return</CardTitle>
    <CardDescription>Due 30 Oct 2026 for Acme Textiles (Pvt) Ltd.</CardDescription>
  </CardHeader>
  <CardContent>
    <StatusBadge status="in_review" />
  </CardContent>
  <CardFooter>
    <Button size="sm" variant="primary">
      Approve
    </Button>
    <Button size="sm" variant="outline">
      View draft
    </Button>
  </CardFooter>
</Card>
```

For a page-level layout, pair `PageHeader` (title + description + a right-aligned action button) with `PillHeader` as a section label above grouped content (e.g. "To-do list", "Summary"), and `Timeline`/`TimelineItem` for step-by-step filing progress.
