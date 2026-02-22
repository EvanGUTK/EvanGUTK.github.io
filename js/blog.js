/**
 * blog.js — Blog Section Controller
 *
 * Fetches blog post metadata from data/blog.json and renders
 * blog cards into the #blog-grid container.
 */

(async function initBlog() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    // ── Fetch Data ─────────────────────────────────────────
    let posts = [];
    try {
        const res = await fetch('data/blog.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        posts = await res.json();
    } catch (err) {
        console.error('[blog] Failed to load data:', err);
        grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem;">
            Could not load posts. Please try again later.
        </p>`;
        return;
    }

    // ── Render Cards ───────────────────────────────────────
    grid.innerHTML = posts.map(post => `
        <article class="blog-card" role="listitem">
            <span class="blog-card-tag">${post.tag}</span>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <div class="blog-card-meta">
                <span>${post.date}</span>
                <span>${post.readTime}</span>
            </div>
        </article>
    `).join('');
})();
