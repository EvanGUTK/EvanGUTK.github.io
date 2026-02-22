/**
 * app.js — Application Entry Point
 *
 * Bootstraps the portfolio SPA. Orchestrates the router,
 * theme controller, header/footer injection, and global
 * UI interactions (clock, settings panel, mobile nav).
 *
 * Architecture: ES Modules, no build step required.
 */

import { Router } from './router.js';
import { ThemeController } from './theme.js';

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inject static shell components
    await loadComponent('#header-container', 'components/header.html');
    await loadComponent('#footer-container', 'components/footer.html');

    // 2. Set footer year
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 3. Initialize theme controller (reads localStorage)
    const theme = new ThemeController();
    theme.init();

    // 4. Initialize router (handles page rendering)
    const router = new Router('#app', {
        home:     'components/home.html',
        resume:   'components/resume.html',
        projects: 'components/projects.html',
        blog:     'components/blog.html',
        contact:  'components/contact.html',
    });
    router.init();

    // 5. Wire up header controls (after header HTML is in the DOM)
    initClock();
    initSettingsPanel(theme);
    initMobileNav(router);

    // 6. Delegate nav link clicks to the router
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-route]');
        if (!link) return;
        e.preventDefault();
        const route = link.dataset.route;
        router.navigate(route);
    });
});

// ── Component Loader ───────────────────────────────────────
/**
 * Fetches an HTML partial and injects it into a container.
 * @param {string} selector - CSS selector for the target element.
 * @param {string} url      - Path to the HTML partial.
 */
async function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        el.innerHTML = await res.text();
    } catch (err) {
        console.error('[app] Component load error:', err);
    }
}

// ── Live Clock ─────────────────────────────────────────────
function initClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;

    let is24h = localStorage.getItem('clock-format') === '24h';

    function tick() {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        let suffix = '';
        if (!is24h) {
            suffix = h >= 12 ? ' PM' : ' AM';
            h = h % 12 || 12;
        }
        clockEl.textContent = `${h.toString().padStart(2, '0')}:${m}:${s}${suffix}`;
    }

    tick();
    setInterval(tick, 1000);

    // Click clock to toggle format
    clockEl.addEventListener('click', () => {
        is24h = !is24h;
        localStorage.setItem('clock-format', is24h ? '24h' : '12h');
        tick();
    });

    // Wire the settings panel button too
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-clock-format') {
            is24h = !is24h;
            localStorage.setItem('clock-format', is24h ? '24h' : '12h');
            tick();
        }
    });
}

// ── Settings Panel ─────────────────────────────────────────
function initSettingsPanel(theme) {
    const toggle = document.getElementById('settings-toggle');
    const panel  = document.getElementById('settings-panel');
    if (!toggle || !panel) return;

    // Open / close
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        panel.setAttribute('aria-hidden', !isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== toggle) {
            panel.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
        }
    });

    // Theme buttons
    document.getElementById('btn-dark')?.addEventListener('click', () => {
        theme.setMode('dark');
        updateThemeButtons('dark');
    });
    document.getElementById('btn-light')?.addEventListener('click', () => {
        theme.setMode('light');
        updateThemeButtons('light');
    });

    function updateThemeButtons(mode) {
        document.getElementById('btn-dark')?.setAttribute('aria-pressed', mode === 'dark');
        document.getElementById('btn-light')?.setAttribute('aria-pressed', mode === 'light');
    }

    // Sync initial state
    updateThemeButtons(theme.currentMode);

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            theme.setAccent(color);
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
    });

    // Restore saved accent
    const savedAccent = localStorage.getItem('accent-color');
    if (savedAccent) {
        theme.setAccent(savedAccent);
        document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === savedAccent);
        });
    }
}

// ── Mobile Navigation ──────────────────────────────────────
function initMobileNav(router) {
    const hamburger = document.getElementById('hamburger-btn');
    const drawer    = document.getElementById('nav-drawer');
    if (!hamburger || !drawer) return;

    hamburger.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        drawer.setAttribute('aria-hidden', !isOpen);
    });

    // Close drawer on backdrop click
    drawer.addEventListener('click', (e) => {
        if (e.target === drawer) closeDrawer();
    });

    // Close drawer on link click
    drawer.querySelectorAll('.nav-drawer-link').forEach(link => {
        link.addEventListener('click', () => closeDrawer());
    });

    function closeDrawer() {
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
    }
}
