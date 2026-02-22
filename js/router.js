/**
 * router.js — Hash-Based Client-Side Router
 *
 * Listens for URL hash changes and dynamically fetches
 * the corresponding HTML partial, injecting it into the
 * #app container with a smooth page transition.
 *
 * Routes are defined as { routeName: 'path/to/component.html' }.
 * Default route: 'home'.
 */

export class Router {
    /**
     * @param {string} containerSelector - CSS selector for the app container.
     * @param {Object} routes            - Map of route names to component paths.
     */
    constructor(containerSelector, routes) {
        this.container = document.querySelector(containerSelector);
        this.routes    = routes;
        this.current   = null;
        this._cache    = new Map();
    }

    // ── Public API ─────────────────────────────────────────

    init() {
        // Handle initial load
        window.addEventListener('hashchange', () => this._handleRoute());
        this._handleRoute();
    }

    navigate(route) {
        if (route === this.current) return;
        window.location.hash = `#${route}`;
    }

    // ── Private ────────────────────────────────────────────

    _getRoute() {
        const hash = window.location.hash.replace('#', '').trim();
        return this.routes[hash] ? hash : 'home';
    }

    async _handleRoute() {
        const route = this._getRoute();
        if (route === this.current) return;
        this.current = route;

        const html = await this._fetchComponent(this.routes[route]);
        if (!this.container) return;

        // Inject and animate
        this.container.innerHTML = html;
        this.container.classList.remove('page-enter');
        void this.container.offsetWidth; // force reflow
        this.container.classList.add('page-enter');

        // Update active nav links
        this._updateNavLinks(route);

        // Re-run any inline module scripts in the injected HTML
        this._executeScripts(this.container);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Fire route-changed event for component-level JS
        document.dispatchEvent(new CustomEvent('route:changed', { detail: { route } }));
    }

    async _fetchComponent(path) {
        if (this._cache.has(path)) return this._cache.get(path);
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const html = await res.text();
            this._cache.set(path, html);
            return html;
        } catch (err) {
            console.error('[router] Failed to load component:', path, err);
            return `<div class="section-wrapper" style="text-align:center;padding:4rem 1rem;">
                        <p class="section-eyebrow">404</p>
                        <h2 class="section-title">Page Not Found</h2>
                        <p class="section-subtitle">Could not load the requested section.</p>
                    </div>`;
        }
    }

    /**
     * Re-executes <script type="module"> tags injected via innerHTML,
     * since browsers do not run scripts inserted via innerHTML by default.
     */
    _executeScripts(container) {
        container.querySelectorAll('script[type="module"]').forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.type = 'module';
            if (oldScript.src) {
                // Bust cache to force re-execution on revisit
                newScript.src = `${oldScript.src}?t=${Date.now()}`;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });
    }

    _updateNavLinks(activeRoute) {
        document.querySelectorAll('[data-route]').forEach(link => {
            const isActive = link.dataset.route === activeRoute;
            link.classList.toggle('active', isActive);
            if (link.hasAttribute('aria-current')) {
                link.setAttribute('aria-current', isActive ? 'page' : 'false');
            }
        });
    }
}
