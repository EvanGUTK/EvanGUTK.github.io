/**
 * blog.js — Blog Section Controller
 *
 * Fetches blog post metadata from data/blog.json and renders
 * blog cards into the #blog-grid container.
 * Shows a full-post modal when a card is clicked.
 * Shows an "Add Post" button if the user has an active admin session.
 */

import { ADMIN_CONFIG } from './admin-config.js';

(async function initBlog() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    // ── Fetch Data ─────────────────────────────────────────
    let posts = [];
    try {
        const res = await fetch(`data/blog.json?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        posts = await res.json();
    } catch (err) {
        console.error('[blog] Failed to load data:', err);
        grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem;">
            Could not load posts. Please try again later.
        </p>`;
        return;
    }

    // ── Admin Session Check ────────────────────────────────
    function isAdminLoggedIn() {
        try {
            const raw = localStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            if (!raw) return false;
            const s = JSON.parse(raw);
            return s?.auth && (Date.now() - s.ts < ADMIN_CONFIG.SESSION_TTL_MS);
        } catch { return false; }
    }

    // ── Render Cards ───────────────────────────────────────
    if (posts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
                <p class="section-eyebrow">Coming Soon</p>
                <h3 class="section-title" style="font-size:var(--text-2xl);">No posts yet</h3>
                <p class="section-subtitle">Check back soon for technical deep-dives and project write-ups.</p>
                ${isAdminLoggedIn() ? `<a href="#admin" data-route="admin" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex;">
                    + Write First Post
                </a>` : ''}
            </div>
        `;
        return;
    }

    grid.innerHTML = posts.map((post, i) => `
        <article
            class="blog-card"
            role="listitem"
            data-index="${i}"
            tabindex="0"
            aria-label="Read post: ${post.title}"
            style="cursor:pointer;"
        >
            ${post.image ? `<div class="blog-card-image-wrap"><img src="${post.image}" alt="${post.title}" loading="lazy"></div>` : ''}
            <span class="blog-card-tag">${post.tag}</span>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <div class="blog-card-meta">
                <span>${post.date}</span>
                <span>${post.readTime}</span>
            </div>
        </article>
    `).join('');

    // Admin "Add Post" button — only shown when admin session is active
    if (isAdminLoggedIn()) {
        const addBtn = document.createElement('a');
        addBtn.href = '#admin';
        addBtn.setAttribute('data-route', 'admin');
        addBtn.className = 'btn btn-primary blog-add-btn';
        addBtn.setAttribute('aria-label', 'Add new blog post');
        addBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
            Add Post
        `;
        grid.parentElement.querySelector('.section-header')?.appendChild(addBtn);
    }

    // ── Blog Post Modal ────────────────────────────────────
    const modal   = document.getElementById('blog-detail-modal');
    const content = document.getElementById('blog-detail-content');
    const closeBtn = document.getElementById('blog-detail-close');

    function openPost(post) {
        if (!modal || !content) return;
        content.innerHTML = `
            ${post.image ? `<img src="${post.image}" alt="${post.title}" class="blog-modal-hero">` : ''}
            <div class="blog-modal-meta">
                <span class="blog-card-tag">${post.tag}</span>
                <span class="text-muted text-mono" style="font-size:var(--text-xs);">${post.date} &bull; ${post.readTime}</span>
            </div>
            <h2 class="blog-modal-title">${post.title}</h2>
            <div class="blog-modal-body">${formatBody(post.body || post.excerpt)}</div>
        `;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closePost() {
        modal?.classList.remove('open');
        modal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    closeBtn?.addEventListener('click', closePost);
    modal?.addEventListener('click', e => { if (e.target === modal) closePost(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePost(); });

    // Card click / keyboard
    grid.addEventListener('click', e => {
        const card = e.target.closest('.blog-card');
        if (!card) return;
        const idx = parseInt(card.dataset.index, 10);
        if (!isNaN(idx)) openPost(posts[idx]);
    });
    grid.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('.blog-card');
            if (!card) return;
            e.preventDefault();
            const idx = parseInt(card.dataset.index, 10);
            if (!isNaN(idx)) openPost(posts[idx]);
        }
    });

    // ── Body Formatter ─────────────────────────────────────
    // Converts newlines to paragraphs for plain-text bodies
    function formatBody(text) {
        if (!text) return '';
        // If it already contains HTML tags, pass through
        if (/<[a-z][\s\S]*>/i.test(text)) return text;
        return text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
})();
