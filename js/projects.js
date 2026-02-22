/**
 * projects.js — Projects Section Controller
 *
 * Fetches project data from data/projects.json and renders
 * project cards into the #projects-grid container.
 * Handles image lightbox and detail modal interactions.
 */

(async function initProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    // ── Fetch Data ─────────────────────────────────────────
    let projects = [];
    try {
        const res = await fetch('data/projects.json');
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
    const detailClose   = document.getElementById('detail-modal-close');

    function openDetail(project) {
        if (!detailModal || !detailContent) return;
        const mediaHtml = project.media.map(item =>
            item.type === 'image'
                ? `<img src="${item.src}" alt="${project.title}" loading="lazy">`
                : `<video src="${item.src}" controls></video>`
        ).join('');

        const tagsHtml = (project.tags || []).map(tag =>
            `<span style="
                font-family:var(--font-mono);
                font-size:var(--text-xs);
                padding:2px 10px;
                border-radius:var(--radius-full);
                background:var(--color-accent-dim);
                color:var(--color-accent);
                border:1px solid var(--color-border-accent);
            ">${tag}</span>`
        ).join('');

        detailContent.innerHTML = `
            <button class="modal-close" id="detail-modal-close" aria-label="Close project details">&times;</button>
            <div class="modal-detail-media">${mediaHtml}</div>
            <div class="modal-detail-info">
                <h3>${project.title}</h3>
                <p>${project.moreInfo}</p>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${tagsHtml}</div>
                <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top:1rem;align-self:flex-start;">
                    Open Repository
                </a>
            </div>
        `;

        detailContent.querySelector('#detail-modal-close')?.addEventListener('click', closeDetail);
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
