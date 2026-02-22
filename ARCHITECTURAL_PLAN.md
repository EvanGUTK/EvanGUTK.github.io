# L6 Architectural Plan: Portfolio Rewrite

**Author**: Manus AI
**Date**: 2026-02-21

## 1. Executive Summary

The current state of the `EvanGUTK.github.io` repository is a single, monolithic `index.html` file containing over 780 lines of code. This file improperly mixes HTML structure, CSS styling (via 40+ inline `<style>` blocks), and JavaScript logic (via multiple inline `<script>` blocks). This architecture suffers from critical maintainability, scalability, and performance issues, including broken HTML tags and non-standard practices. 

This document outlines a complete, production-grade rewrite of the portfolio. The new architecture will be modular, scalable, and performant, adhering to modern web development best practices while remaining compatible with the static hosting environment of GitHub Pages. The core principle is **separation of concerns**, where structure (HTML), presentation (CSS), and behavior (JS) are cleanly decoupled.

## 2. Core Architectural Pillars

| Pillar | Description |
| :--- | :--- |
| **Modularity** | The UI will be broken down into reusable components (e.g., Header, Footer, Project Card). Content for each page section will be split into its own HTML file. |
| **Data-Driven Content** | Dynamic content, such as the list of projects and blog posts, will be externalized into JSON files (`projects.json`, `blog.json`). The application will fetch this data at runtime, making content updates trivial (no code changes required). |
| **Component-Based Loading** | A lightweight, client-side routing and component loading system will be implemented in vanilla JavaScript. This will dynamically fetch and inject HTML partials into the main page shell, simulating a Single-Page Application (SPA) experience without the overhead of a large framework. |
| **Design System (Tokens)** | A centralized CSS design system will be established using CSS Custom Properties (variables). This will govern colors, typography, spacing, and visual effects like the chosen "glassmorphism" theme, ensuring visual consistency and easy theme management (e.g., dark/light modes). |

## 3. New File & Directory Structure

A clean, logical file hierarchy is the foundation of a maintainable project. The following structure will be implemented:

```
/home/ubuntu/EvanGUTK.github.io/
└── ARCHITECTURAL_PLAN.md
└── index.html
└── css/
│   └── main.css
│   └── theme.css
└── js/
│   └── app.js
│   └── router.js
│   └── theme.js
└── components/
│   └── header.html
│   └── footer.html
│   └── home.html
│   └── resume.html
│   └── projects.html
│   └── blog.html
│   └── contact.html
└── assets/
│   └── images/
│   └── icons/
└── data/
    └── projects.json
    └── blog.json
```

## 4. Implementation Details

*   **`index.html` (The Shell)**: This will be the only top-level HTML file. It will be minimal, containing the `<head>` section (with links to the CSS and JS files), and an empty `<div id="app"></div>` and placeholder elements for the header and footer. 

*   **`js/app.js`**: The main application entry point. It will orchestrate the initialization of the router and theme controller.

*   **`js/router.js`**: A hash-based router (`/#/home`, `/#/projects`). It will listen for URL hash changes, determine which component to render, fetch the corresponding HTML from the `/components/` directory using the `fetch` API, and inject it into the `#app` div.

*   **`components/*.html`**: These files will contain the pure HTML for each section of the site. They will be loaded on demand by the router.

*   **`data/*.json`**: These files will store the project and blog data as a structured JSON array. The `projects.html` and `blog.html` components will have associated JavaScript that fetches this data and dynamically generates the necessary HTML to display it.

*   **`css/theme.css`**: This file will define all CSS variables for the design system. This includes color palettes for both light and dark modes, font families, font sizes, and the properties for the glassmorphism effect (e.g., `backdrop-filter`, `background-color`).

*   **`css/main.css`**: This will contain the core, non-theme-related styles for layout, components, and utilities, importing the `theme.css` file to make use of the design tokens.

This architecture transforms the project from a single, unmanageable file into a scalable, professional-grade static web application. It simplifies content updates, streamlines the development process, and dramatically improves performance and maintainability.
