---
name: Тест-тренажёр
description: A focused, access-gated exam drill tool for Russian-language medical education.
colors:
  teal: "#14a89a"
  teal-btn: "#0b7a6e"
  teal-btn-hover: "#09665c"
  teal-light: "#0e8a7d"
  bg-dark: "#1a2332"
  surface-dark: "#232f42"
  button-dark: "#2d3d54"
  button-hover-dark: "#374d68"
  ink-dark: "#e8edf2"
  muted-dark: "#9aa8bb"
  border-dark: "#34445c"
  bg-light: "#f7f9fb"
  surface-light: "#ffffff"
  button-light: "#eef1f5"
  button-hover-light: "#e2e7ed"
  ink-light: "#1a2332"
  muted-light: "#5a6b80"
  border-light: "#dde3ea"
  success: "#2e8b57"
  success-bg: "rgba(46,139,87,0.14)"
  success-border: "rgba(46,139,87,0.4)"
  error: "#c0392b"
  error-bg: "rgba(192,57,43,0.14)"
  error-border: "rgba(192,57,43,0.4)"
typography:
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  question:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  result:
    fontFamily: "system-ui, sans-serif"
    fontSize: "17.6px"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "20px"
components:
  button:
    backgroundColor: "{colors.button-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary:
    backgroundColor: "{colors.teal-btn}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  pill:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.muted-dark}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  panel:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.lg}"
    padding: "16px"
    shadow: "0 2px 16px rgba(0,0,0,0.4)"
---

# Design System: Тест-тренажёр

## 1. Overview

**Creative North Star: "The Clinical Notebook"**

This interface has the quiet authority of a well-kept medical record. Nothing decorates; everything informs. Every element earns its place by serving the drill loop — read, answer, check, advance — and anything that doesn't serve that loop is absent. The system is designed for marathon study sessions under artificial light: dark by default, calm under pressure, precise without being cold.

Density is deliberately moderate. Panels breathe enough to separate concerns (topic selection, range controls, the question itself, navigation) without padding out with whitespace that makes the tool feel lightweight.

This system explicitly rejects gamification (no streaks, mascots, confetti, celebratory animations), generic SaaS dashboard aesthetics (no hero metrics, cream backgrounds, card grids), and the cold institutional grey of hospital EMR software.

**Key Characteristics:**
- Dark-first: the dark theme is primary, not a preference toggle
- Single-accent: Teal appears only on active states, primary actions, and correct-answer display
- Layered depth: tonal steps (bg → surface → button) + a subtle box-shadow on panels against the navy bg
- Functional feedback: correct/wrong states use green/red with explicit text labels, never color alone
- System-native typography: no web font load, no branding overhead

## 2. Colors

A navy/teal palette. Body is a deep navy (`#1a2332`), not a neutral dark grey — the blue undertone distinguishes it from generic dark-mode apps. The single chromatic accent is teal (`#14a89a`), warm-cool in character, medical without being clinical.

### Primary
- **Teal** (`#14a89a` dark / `#0e8a7d` light): The one accent color. Used on interactive focus rings, the brand accent (`МедТест`), primary buttons, the access pill border, and the `#correctBox` answer display. Its rarity is intentional — when it appears, it means something. Never used decoratively.
- **Teal Button** (`#0b7a6e` dark / `#0c6a60` light): Filled primary buttons (auth, start session). Darker than the raw teal to ensure contrast against white text.

### Dark Theme Neutrals
- **Ink** (`#e8edf2`): Primary body text. Contrast vs bg `#1a2332` ≈ 13:1.
- **Muted** (`#9aa8bb`): Secondary text — labels, hints, pill counts. Contrast vs bg ≈ 6:1.
- **Bg** (`#1a2332`): Body background. Deep navy. The base layer.
- **Surface** (`#232f42`): Panel and card backgrounds. One tonal step above bg.
- **Button** (`#2d3d54`): Default button background. Two tonal steps above bg.
- **Button Hover** (`#374d68`): Button hover. One step lighter than button.
- **Border** (`#34445c`): All borders — panels, inputs, selects, pills.

### Light Theme Neutrals
- **Bg** (`#f7f9fb`), **Surface** (`#ffffff`), **Button** (`#eef1f5`), **Button Hover** (`#e2e7ed`)
- **Ink** (`#1a2332`), **Muted** (`#5a6b80`), **Border** (`#dde3ea`)
- Same roles, same tonal logic. Accent shifts to `#0e8a7d` (darker teal for AA contrast on white).

### Feedback
- **Success** (`#2e8b57` / `rgba(46,139,87,0.14)` bg): Correct-answer result box and profile access active state.
- **Error** (`#c0392b` / `rgba(192,57,43,0.14)` bg): Wrong-answer result box and all form validation errors. Consistent semantic across surfaces.

**The One Accent Rule.** Teal is the only chromatic color in the neutral surface. It appears in ≤3 contexts per screen: the brand title, the primary action, and the answer/access reveal. Never add a second accent.

**The Feedback Integrity Rule.** Correct and wrong states must always include a visible text label ("Верно" / "Неверно") alongside the color signal.

## 3. Typography

**Body Font:** `system-ui, sans-serif` — the platform's native sans (SF Pro on Apple, Segoe UI on Windows, Roboto on Android). Zero font loading, no FOUT risk.

### Hierarchy

- **Question** (600 weight, 16px, line-height 1.4): The question body. `white-space: pre-line` preserves intentional line breaks. Highest visual weight on the card.
- **Body** (400 weight, 16px, line-height 1.5): Option labels, hints, panel copy. Max 65ch per line in reading contexts.
- **Label** (400 weight, 0.88–0.92em): Form labels, small hints. Color: `--muted`.
- **Result** (700 weight, 1.05em): The Верно/Неверно result line. Maximum weight; draws the eye after answer reveal.
- **Hero stat** (700 weight, 3.4em): Session-complete % result. One screen only.
- **Pill** (400, 0.82–0.85em): Step counter and error count. Muted, informational only.

**The Weight-as-Hierarchy Rule.** Four weights in use: 400 (body/label), 500 (button), 600 (question/primary button), 700 (result/hero). Never add a fifth weight.

## 4. Elevation

Depth is expressed through two mechanisms: the tonal ramp (bg → surface → button) and a subtle box-shadow on panels.

**Box shadow on panels**: `0 2px 16px rgba(0,0,0,0.4)` dark / `0 2px 12px rgba(0,0,0,0.08)` light. Against the navy background, the shadow adds essential lift — without it, panels flatten into the bg. This is intentional and differs from the original "flat-by-default" intent, which was written for a dark-grey palette where tonal steps alone were sufficient.

**Shadow scope**: `.panel` only. Buttons, inputs, pills — no shadow. The shadow is for container boundaries, not interactive elements.

## 5. Components

The component philosophy is **solid and reliable**: buttons feel weighty and certain, panels are well-bounded containers, inputs are visually continuous with their surroundings.

### Buttons

- **Default:** `#2d3d54` bg, `#e8edf2` text, 10px radius, `padding: 8px 14px`. Font-weight 500.
- **Hover:** Steps to `#374d68`. No transform, no shadow. Background shift only.
- **Disabled:** `opacity: 0.45`. Visible but non-interactive.
- **Primary (`btn-primary`):** `#0b7a6e` bg, `#ffffff` text, 600 weight, 10px radius. Hover: `#09665c`.
- **Outline (`btn-outline`):** Transparent bg, `--border-color` border. Hover: `--accent` border + text color.
- **Icon-only (`btn-icon`):** Transparent bg, `--muted` icon color. Hover: `--button-bg` bg + `--text-color` icon.
- **Ghost/Link (`btn-link`):** No bg, `--muted` text, underline. Low-stakes escape actions only.
- **Auth (`auth-btn`):** Full-width, `#0b7a6e` bg, flex-centered. Used for primary auth and activation actions.
- **Danger (`btn-danger`):** `--error` bg, `#ffffff` text. Admin revoke actions only.

### Panels

- **Shape:** 14px radius (`{rounded.lg}`). Box-shadow for lift against the navy bg.
- **Background:** `--panel-color`. One tonal step above body bg.
- **Border:** `1px solid --border-color`. Defines containment.
- **Padding:** 16px.
- **Nesting rule:** Panels do not nest. Inputs and textareas inside panels use `--bg-color` as background (one tonal step DOWN from the panel), creating a subtle inset effect.

### Pills

- **Shape:** `border-radius: 999px`. Status-only, never interactive.
- **Style:** `--panel-color` bg, `--muted` text, `1px solid --border-color`.
- **Access pill:** Uses `--accent` border and text color. Circular on mobile (36×36px, text hidden).

### Inputs and Textarea

- **Style:** `1px solid --border-color`, `--bg-color` bg (inset into panel), 8px radius.
- **Focus:** `border-color: --accent`. Focus-visible: `outline: 2px solid --accent, offset: 2px`.
- **Textarea:** `min-height: 110px`, resizable vertically. For free-text Q&A answer input only.
- **Number inputs:** Narrow, `width: auto`. Mobile: `width: 64px`.

### Tabs (Auth)

- **Container:** Shared border, `overflow: hidden`, 8px radius. Zero gap between buttons.
- **Inactive:** `--panel-color` bg, `--muted` text.
- **Active:** `--accent-btn` bg, `#ffffff` text.

### Feedback Boxes

- **Result box (`#resultBox`):** 700 weight, 1.05em. Green on `rgba(46,139,87,0.14)` (correct) or red on `rgba(192,57,43,0.14)` (wrong). Border matches text color.
- **Answer box (`#correctBox`):** `--accent-text` (teal) on `--panel-color` bg. `white-space: pre-line`. Shows the canonical correct answer regardless of whether the student was right or wrong — teal signals "this is the reference answer."

### Session Complete

- **Layout:** Centered, inside the question panel. Shown when the last question is marked.
- **Hero stat:** `3.4em` bold %, centered. Green (`--success`) if zero errors.
- **Supporting stats:** `1.5em` row — X/Y правильно · N ошибок · time elapsed. All below the hero.
- **CTA priority:** "Повторить ошибки" = `btn-primary` (when errors > 0), shown first. "Начать заново" = `btn-outline`. If zero errors: only "Начать заново" = `btn-primary`, centered.

## 6. Keyboard Shortcuts

The core drill loop has keyboard bindings (shown in a dismissible hint on first use):

| Key | Action | Condition |
|-----|---------|-----------|
| `Space` / `Enter` | Show / hide answer | Answer not shown |
| `1` / `←` | Mark correct, advance | Answer visible |
| `2` / `→` | Mark wrong, advance | Answer visible |
| `←` / `→` | Navigate prev / next | Answer hidden |

Hint is shown once, persisted to `localStorage` (`kbHintSeen`). Dismissed on first shortcut use or via × button.

## 7. Do's and Don'ts

### Do:
- **Do** keep Teal to three contexts maximum per screen: brand title, primary action, answer/access display.
- **Do** use `opacity: 0.45` for disabled states — always visible, never disappeared.
- **Do** include a text label ("Верно" / "Неверно") alongside every color-coded feedback state.
- **Do** use `min-height: 44px` on all interactive elements at mobile breakpoints (≤480px).
- **Do** use `--bg-color` as the background for inputs inside panels (inset effect).
- **Do** preserve `white-space: pre-line` on question text and the answer box.

### Don't:
- **Don't** add a second accent color. The design is built around a single chromatic signal.
- **Don't** add gamification elements: streaks, XP, mascots, confetti, progress bars as rewards.
- **Don't** use a cream, sand, or warm-tinted background. The light theme uses `#f7f9fb` (cool blue-tinted), not warm-neutral.
- **Don't** use gradient text or background-clip decorations.
- **Don't** design "hero stat" metric dashboards. The session-complete screen is the only exception, and it follows strict anti-gamification rules (no color for "good" unless perfect score).
- **Don't** add box-shadows to buttons, inputs, or pills — only `.panel` elements carry the shadow.
- **Don't** use side-stripe borders (`border-left` > 1px) as colored accents.
- **Don't** use color alone to distinguish correct from wrong — always pair with a text label.
