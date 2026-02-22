/**
 * contact.js — Contact Form Controller
 *
 * Handles async form submission via Formspree, provides
 * user feedback (loading, success, error states), and
 * performs client-side validation.
 */

(function initContact() {
    const form       = document.getElementById('contact-form');
    const submitBtn  = document.getElementById('form-submit-btn');
    const statusEl   = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Client-side validation
        const name    = form.querySelector('#contact-name')?.value.trim();
        const email   = form.querySelector('#contact-email')?.value.trim();
        const message = form.querySelector('#contact-message')?.value.trim();

        if (!name || !email || !message) {
            setStatus('Please fill in all fields.', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('Please enter a valid email address.', 'error');
            return;
        }

        // Submit
        setLoading(true);
        setStatus('', '');

        try {
            const res = await fetch(form.action, {
                method:  'POST',
                headers: { 'Accept': 'application/json' },
                body:    new FormData(form),
            });

            if (res.ok) {
                setStatus('Message sent! I will get back to you soon.', 'success');
                form.reset();
            } else {
                const data = await res.json().catch(() => ({}));
                const msg  = data?.errors?.[0]?.message || 'Something went wrong. Please try again.';
                setStatus(msg, 'error');
            }
        } catch {
            setStatus('Network error. Please check your connection and try again.', 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        if (!submitBtn) return;
        submitBtn.disabled    = loading;
        submitBtn.textContent = loading ? 'Sending…' : 'Send Message';
        submitBtn.style.opacity = loading ? '0.7' : '1';
    }

    function setStatus(message, type) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.style.color = type === 'success'
            ? 'var(--color-accent-2)'
            : type === 'error'
            ? '#f87171'
            : 'var(--color-text-secondary)';
    }
})();
