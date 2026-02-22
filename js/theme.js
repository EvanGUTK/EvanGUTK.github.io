/**
 * theme.js — Theme Controller
 *
 * Manages dark/light mode and accent color selection.
 * Persists preferences to localStorage and applies them
 * via CSS custom properties and data attributes on <html>.
 */

export class ThemeController {
    constructor() {
        this.root        = document.documentElement;
        this.currentMode = 'dark';
    }

    // ── Public API ─────────────────────────────────────────

    init() {
        const saved = localStorage.getItem('theme-mode') || 'dark';
        this.setMode(saved);

        const savedAccent = localStorage.getItem('accent-color');
        if (savedAccent) this.setAccent(savedAccent);
    }

    setMode(mode) {
        this.currentMode = mode;
        this.root.setAttribute('data-theme', mode);
        localStorage.setItem('theme-mode', mode);
    }

    setAccent(color) {
        this.root.style.setProperty('--color-accent', color);
        // Derive dim and glow variants from the hex color
        const { r, g, b } = this._hexToRgb(color) || { r: 255, g: 130, b: 0 };
        this.root.style.setProperty('--color-accent-dim',  `rgba(${r},${g},${b},0.15)`);
        this.root.style.setProperty('--color-accent-glow', `rgba(${r},${g},${b},0.4)`);
        this.root.style.setProperty('--color-border-accent', `rgba(${r},${g},${b},0.4)`);
        localStorage.setItem('accent-color', color);
    }

    // ── Private ────────────────────────────────────────────

    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }
}
