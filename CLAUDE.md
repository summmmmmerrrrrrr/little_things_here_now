# Project Development Guide

This file contains the permanent rules for building this website.

**Read this file first before making any changes to the project.**

The user is a complete beginner with no programming background. Explain
things simply, keep code beginner-friendly, and do not introduce
frameworks, build tools, npm, or external libraries. This project uses
only plain HTML, CSS, and vanilla JavaScript.

The site is being built **one scene at a time**. Do not redesign an
existing interaction, add new content, or start a new scene unless the
user explicitly asks for it.

---

## Responsive Design

This website must be fully responsive from the start. It should work
naturally on:

- Desktop (large monitors)
- Laptop
- iPad Landscape
- iPad Portrait
- Phone Landscape
- Phone Portrait

The goal is to preserve the same **experience** across devices, not force
an identical layout on every screen size.

Principles to follow:

1. Never position important elements using fixed pixel values when
   responsive units are more appropriate.
2. Prefer viewport units, percentages, `clamp()`, `min()`, `max()`,
   Flexbox, CSS Grid, and CSS transforms whenever appropriate.
3. Important animations should adapt automatically to different screen
   sizes.
4. The pigeon's flight path should always scale correctly with the
   viewport.
5. The feather should always land inside the visible viewport.
6. Important text should always maintain comfortable margins.
7. No horizontal scrolling.
8. No important content should ever leave the visible screen.
9. Avoid unnecessary media queries. Only use them when there is no
   better solution.
10. Keep all responsive calculations simple and beginner-friendly.
11. Whenever possible, calculate positions relative to the viewport
    instead of hard-coded coordinates.

---

## Editable Variables

All values a designer may want to adjust later must be placed together
under a clearly labelled section at the top of `script.js`:

```
// ======================================
// EDITABLE VARIABLES
// ======================================
```

Do not hard-code adjustable numbers throughout the rest of the code.
Things such as:

- object sizes
- positions
- timings
- animation speed
- delays
- opacity values
- sound volumes
- offsets
- landing positions

should always be editable from this section, not buried in the logic
further down the file.

---

## Testing

After finishing each scene or major interaction, verify it works
correctly at these viewport sizes:

| Device          | Size       |
|-----------------|------------|
| Desktop         | 1920 x 1080 |
| Laptop          | 1440 x 900  |
| iPad Portrait   | 820 x 1180  |
| iPhone          | 390 x 844   |

If something looks incorrect at one of these sizes, fix it before
considering the scene complete.

---

## General Principle

Whenever choosing between:

- matching the exact pixel layout, or
- preserving the intended experience

**always prioritize preserving the experience.**

Think like a senior front-end developer working closely with a
designer. Build the project scene by scene, and do not redesign
interactions unless explicitly asked to.
