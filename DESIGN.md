# VERIS Super Admin Console — Design System & Color Blueprint

This document serves as the single source of truth for the visual language and color standards across the VERIS Super Admin Console. All future UI developments must adhere to these guidelines to ensure consistency.

## 1. Primary Colors & Core Gradients

The platform utilizes a distinct, bold gradient as its primary brand identity. This replaces flat primary colors with a dynamic transition.

*   **Anchor (Dark):** `#030677` (Deep Navy/Royal Blue)
*   **Pair (Light):** `#2563eb` (Vibrant Blue - Tailwind `blue-600`)

### Usage:
*   **Page Titles:** All major page headers (`<h1>`) must use this gradient as a text fill.
    *   *Implementation:* `bg-gradient-to-r from-[#030677] to-[#2563eb] bg-clip-text text-transparent`
*   **Primary Actions (e.g., Main Buttons):** Should integrate this gradient, replacing flat blue colors where high emphasis is required.

## 2. Action Colors (The "White Blend" Rule)

To indicate specific actions (Success, Danger, Warning), we use standard semantic hues but apply a **gradient fade to a white-tinted pastel**. This maintains the "integrated with white" aesthetic without causing legibility issues against white backgrounds.

### Danger / Destructive (Red)
Used for deletions, archives, and irreversible actions.
*   **Gradient:** Red fading into a white-tinted red.
*   *Implementation:* `bg-gradient-to-r from-red-600 to-red-300`

### Success (Green)
Used for approvals, activations, and positive confirmations.
*   **Gradient:** Green fading into a white-tinted green.
*   *Implementation:* `bg-gradient-to-r from-green-600 to-green-300`

### Warning (Yellow/Amber)
Used for cautions, pending states, and items requiring attention.
*   **Gradient:** Amber fading into a white-tinted amber.
*   *Implementation:* `bg-gradient-to-r from-amber-500 to-amber-200`

## 3. Typography Rules

*   **Page Headers:** Must always be uppercase, use `font-extrabold` (weight 800+), and apply the primary text gradient.
*   **Descriptions:** Page descriptions or subtitle text should use a lighter blue gradient to complement the primary title gradient while remaining highly legible.
    *   *Implementation:* `bg-gradient-to-r from-[#2563eb] to-[#93c5fd] bg-clip-text text-transparent`
*   **Secondary Text:** Use the established neutral Slate palette (`text-slate-500` to `text-slate-900`) for standard body text and tabular data.

---
*Note: These colors are integrated directly into the Tailwind configuration via `globals.css` and standard utility classes.*
