# Professional Portfolio Website

A portfolio built as a macOS-style desktop environment — draggable windows, a
magnifying dock, a live menu bar, and an animated wallpaper.

**Live site:** https://alistair77.github.io/professional-portfolio-website/

## Features

- Window manager with drag, resize, minimize, zoom, focus stacking and cascade
- Dock with cursor magnification, running-state indicators and tooltips
- Working menu bar dropdowns and a live clock
- Animated wallpaper — drifting light blooms, travelling highlights along the
  arcs, and parallax dust, all on compositor-friendly properties
- Deep links via `?app=projects`
- Responsive: windows become full-bleed sheets and sidebars become tab strips
  on small screens
- Respects `prefers-reduced-motion`; keyboard accessible, Escape closes the
  front window

## Stack

Vanilla HTML, CSS and JavaScript (ES modules). No dependencies, no build step.

## Running locally

Any static file server works. ES modules need HTTP rather than `file://`:

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321

## Structure

```
index.html        markup + window content templates
css/tokens.css    design tokens (colour, type, motion, geometry)
css/desktop.css   wallpaper, menu bar, dock, desktop icons
css/window.css    window chrome and content styles
js/wm.js          window manager
js/desktop.js     shell: clock, dock, menus, navigation
```

Window content lives in the `<template>` blocks at the bottom of `index.html`.

## Author

Alistair Rodrigues — [GitHub](https://github.com/Alistair77) · [LinkedIn](https://linkedin.com/in/alistair77) · alistairar7@gmail.com
