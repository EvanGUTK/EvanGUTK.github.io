/**
 * projects.js — Projects Section Controller
 *
 * Fetches project data from data/projects.json and renders
 * project cards into the #projects-grid container.
 * Handles image lightbox and detail modal interactions.
 * Shows an "Add Project" button if admin session is active.
 */

import { ADMIN_CONFIG } from './admin-config.js';

(async function initProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    // ── Admin Session Check ────────────────────────────────
    function isAdminLoggedIn() {
        try {
            const raw = localStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            if (!raw) return false;
            const s = JSON.parse(raw);
            return s?.auth && (Date.now() - s.ts < ADMIN_CONFIG.SESSION_TTL_MS);
        } catch { return false; }
    }

    // ── Fetch Data ─────────────────────────────────────────
    let projects = [];
    try {
        const res = await fetch(`data/projects.json?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        projects = await res.json();
    } catch (err) {
        console.error('[projects] Failed to load data:', err);
        grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem;">
            Could not load projects. Please try again later.
        </p>`;
        return;
    }

    // ── Render Cards ───────────────────────────────────────
    grid.innerHTML = projects.map((p, i) => `
        <article
            class="project-card"
            role="listitem"
            data-index="${i}"
            style="transition-delay:${i * 80}ms"
        >
            <div class="project-card-image-wrap" data-action="lightbox" data-src="${p.image}" data-alt="${p.title}">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
                <div class="project-card-image-overlay">
                    <span>View Image</span>
                </div>
            </div>
            <div class="project-card-body">
                <h3 class="project-card-title">${p.title}</h3>
                <p class="project-card-desc">${p.description}</p>
                <p class="project-card-date text-mono">${p.date}</p>
                ${p.tags && p.tags.length ? `
                <div class="project-card-tags">
                    ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
                </div>` : ''}
                <div class="project-card-actions">
                    <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                        View on GitHub
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>
                    </a>
                    <button class="btn btn-secondary" data-action="detail" data-index="${i}">
                        Details
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    // Admin "Add Project" button — only shown when admin session is active
    if (isAdminLoggedIn()) {
        const addBtn = document.createElement('a');
        addBtn.href = '#admin';
        addBtn.setAttribute('data-route', 'admin');
        addBtn.className = 'btn btn-primary blog-add-btn';
        addBtn.setAttribute('aria-label', 'Add new project');
        addBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
            Add Project
        `;
        grid.parentElement.querySelector('.section-header')?.appendChild(addBtn);
    }

    // ── Intersection Observer for Scroll Animations ────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    grid.querySelectorAll('.project-card').forEach(card => observer.observe(card));

    // ── Image Lightbox ─────────────────────────────────────
    const imageModal   = document.getElementById('image-modal');
    const modalImage   = document.getElementById('modal-image');
    const imageClose   = document.getElementById('image-modal-close');

    function openLightbox(src, alt) {
        if (!imageModal || !modalImage) return;
        modalImage.src = src;
        modalImage.alt = alt;
        imageModal.classList.add('open');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!imageModal) return;
        imageModal.classList.remove('open');
        imageModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    imageClose?.addEventListener('click', closeLightbox);
    imageModal?.addEventListener('click', (e) => {
        if (e.target === imageModal) closeLightbox();
    });

    // ── Detail Modal ───────────────────────────────────────
    const detailModal   = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-modal-content');

    function openDetail(project) {
        if (!detailModal || !detailContent) return;
        const mediaHtml = (project.media || []).map(item =>
            item.type === 'image'
                ? `<img src="${item.src}" alt="${project.title}" loading="lazy">`
                : `<video src="${item.src}" controls></video>`
        ).join('');

        const tagsHtml = (project.tags || []).map(tag =>
            `<span class="project-tag">${tag}</span>`
        ).join('');

        detailContent.innerHTML = `
            <button class="modal-close" id="detail-modal-close-inner" aria-label="Close project details">&times;</button>
            <div class="modal-detail-media">${mediaHtml || `<img src="${project.image}" alt="${project.title}">`}</div>
            <div class="modal-detail-info">
                <h3>${project.title}</h3>
                <p>${project.moreInfo || project.description}</p>
                ${tagsHtml ? `<div class="project-card-tags" style="margin-top:8px;">${tagsHtml}</div>` : ''}
                <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top:1.25rem;align-self:flex-start;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right:6px;" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                    Open on GitHub
                </a>
            </div>
        `;

        detailContent.querySelector('#detail-modal-close-inner')?.addEventListener('click', closeDetail);
        detailModal.classList.add('open');
        detailModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeDetail() {
        if (!detailModal) return;
        detailModal.classList.remove('open');
        detailModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    detailModal?.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetail();
    });

    // ── Event Delegation for Card Actions ──────────────────
    grid.addEventListener('click', (e) => {
        const lightboxEl = e.target.closest('[data-action="lightbox"]');
        if (lightboxEl) {
            openLightbox(lightboxEl.dataset.src, lightboxEl.dataset.alt);
            return;
        }
        const detailBtn = e.target.closest('[data-action="detail"]');
        if (detailBtn) {
            const idx = parseInt(detailBtn.dataset.index, 10);
            openDetail(projects[idx]);
        }
    });

    // ── Keyboard Escape to Close Modals ───────────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeDetail();
        }
    });
})();
