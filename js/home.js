/**
 * home.js — Home Page Controller
 *
 * Handles:
 *  - Avatar click spin animation
 *  - Timeline scroll-reveal via IntersectionObserver
 */

(function initHome() {
    // ── Avatar Spin ────────────────────────────────────────
    const avatar = document.getElementById('hero-avatar');
    if (avatar) {
        avatar.addEventListener('click', () => {
            avatar.classList.remove('spin');
            void avatar.offsetWidth; // force reflow to restart animation
            avatar.classList.add('spin');
            avatar.addEventListener('animationend', () => {
                avatar.classList.remove('spin');
            }, { once: true });
        });
    }

    // ── Timeline Scroll Reveal ─────────────────────────────
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger the animation
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, entry.target.dataset.delay || 0);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

    timelineItems.forEach((item, i) => {
        item.dataset.delay = i * 120;
        observer.observe(item);
    });
})();
