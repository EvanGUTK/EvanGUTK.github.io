/**
 * admin.js — Admin Panel Controller
 *
 * Handles:
 *  - Login with SHA-256 credential comparison
 *  - Session management (localStorage with TTL)
 *  - Tab switching (Blog / Projects)
 *  - Blog post submission (writes to data/blog.json via GitHub API)
 *  - Project submission (writes to data/projects.json via GitHub API)
 *  - Image/PDF upload (base64 encodes and commits to assets/uploads/)
 *  - Logout
 */

import { ADMIN_CONFIG } from './admin-config.js';

// ── SHA-256 Helper ─────────────────────────────────────────
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Session ────────────────────────────────────────────────
function getSession() {
    try {
        const raw = localStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (Date.now() - s.ts > ADMIN_CONFIG.SESSION_TTL_MS) {
            localStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
            return null;
        }
        return s;
    } catch { return null; }
}

function setSession() {
    localStorage.setItem(ADMIN_CONFIG.SESSION_KEY, JSON.stringify({ ts: Date.now(), auth: true }));
}

function clearSession() {
    localStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
}

// ── GitHub API ─────────────────────────────────────────────
// Token is entered by the admin at login — never stored in code.
let _ghToken = null;
const REPO_OWNER = 'EvanGUTK';
const REPO_NAME  = 'EvanGUTK.github.io';
const BRANCH     = 'main';

async function ghGet(path) {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, {
        headers: { Authorization: `token ${_ghToken}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
    return res.json();
}

async function ghPut(path, content, sha, message) {
    const body = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: BRANCH,
    };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `token ${_ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub PUT ${path}: ${res.status}`);
    }
    return res.json();
}

async function ghPutBinary(path, base64Content, sha, message) {
    const body = { message, content: base64Content, branch: BRANCH };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `token ${_ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub PUT binary ${path}: ${res.status}`);
    }
    return res.json();
}

async function readJson(path) {
    const data = await ghGet(path);
    const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    return { json: JSON.parse(text), sha: data.sha };
}

async function writeJson(path, obj, sha, message) {
    return ghPut(path, JSON.stringify(obj, null, 2), sha, message);
}

// Upload a File object to assets/uploads/, returns the public URL path
async function uploadFile(file) {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploadPath = `assets/uploads/${safeName}`;
    const base64 = await fileToBase64(file);
    // Check if file already exists (to get sha)
    let existingSha = null;
    try {
        const existing = await ghGet(uploadPath);
        existingSha = existing.sha;
    } catch {}
    await ghPutBinary(uploadPath, base64, existingSha, `upload: ${safeName}`);
    return uploadPath;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result is "data:...;base64,XXXX" — we only want the base64 part
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ── DOM Helpers ────────────────────────────────────────────
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
function setStatus(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'success' ? 'var(--color-accent-2, #4ade80)'
                   : type === 'error'   ? '#f87171'
                   : 'var(--color-text-secondary)';
}

// ── Init ───────────────────────────────────────────────────
(function init() {
    const session = getSession();
    if (session?.auth) {
        showPanel();
    } else {
        showLogin();
    }

    // Login form
    document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
        clearSession();
        _ghToken = null;
        showLogin();
    });

    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`)?.classList.add('active');
        });
    });

    // Blog form
    document.getElementById('admin-blog-form')?.addEventListener('submit', handleBlogSubmit);

    // Project form
    document.getElementById('admin-project-form')?.addEventListener('submit', handleProjectSubmit);

    // Image preview for blog
    document.getElementById('blog-image-input')?.addEventListener('change', previewBlogImage);
})();

// ── Login ──────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const usernameEl = document.getElementById('admin-username');
    const passwordEl = document.getElementById('admin-password');
    const tokenEl    = document.getElementById('admin-gh-token');
    const btn        = document.getElementById('admin-login-btn');

    btn.disabled = true;
    btn.textContent = 'Authenticating…';
    setStatus('login-status', '', '');

    try {
        const [uHash, pHash] = await Promise.all([
            sha256(usernameEl.value.trim()),
            sha256(passwordEl.value.trim()),
        ]);

        if (uHash !== ADMIN_CONFIG.USERNAME_HASH || pHash !== ADMIN_CONFIG.PASSWORD_HASH) {
            setStatus('login-status', 'Invalid credentials.', 'error');
            return;
        }

        // Validate GitHub token
        const token = tokenEl.value.trim();
        if (!token) {
            setStatus('login-status', 'GitHub Personal Access Token is required.', 'error');
            return;
        }

        // Quick token validation
        const testRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: { Authorization: `token ${token}` }
        });
        if (!testRes.ok) {
            setStatus('login-status', 'GitHub token invalid or lacks repo access.', 'error');
            return;
        }

        _ghToken = token;
        setSession();
        showPanel();
    } catch (err) {
        setStatus('login-status', `Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

// ── Blog Submit ────────────────────────────────────────────
async function handleBlogSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('blog-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Publishing…';
    setStatus('blog-status', '', '');

    try {
        const title    = document.getElementById('blog-title').value.trim();
        const tag      = document.getElementById('blog-tag').value.trim();
        const excerpt  = document.getElementById('blog-excerpt').value.trim();
        const body     = document.getElementById('blog-body').value.trim();
        const readTime = document.getElementById('blog-readtime').value.trim();
        const imageFile = document.getElementById('blog-image-input').files[0];

        if (!title || !tag || !excerpt || !body) {
            setStatus('blog-status', 'Title, tag, excerpt, and body are required.', 'error');
            return;
        }

        let imagePath = 'assets/images/hero-bg.jpg';
        if (imageFile) {
            setStatus('blog-status', 'Uploading image…', '');
            imagePath = await uploadFile(imageFile);
        }

        const { json: posts, sha } = await readJson('data/blog.json');

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        posts.unshift({
            title,
            tag,
            excerpt,
            body,
            date: dateStr,
            readTime: readTime || '5 min read',
            image: imagePath,
        });

        await writeJson('data/blog.json', posts, sha, `blog: add "${title}"`);
        setStatus('blog-status', `"${title}" published successfully!`, 'success');
        document.getElementById('admin-blog-form').reset();
        document.getElementById('blog-image-preview').src = '';
        document.getElementById('blog-image-preview').style.display = 'none';
    } catch (err) {
        setStatus('blog-status', `Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publish Post';
    }
}

// ── Project Submit ─────────────────────────────────────────
async function handleProjectSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('project-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Adding…';
    setStatus('project-status', '', '');

    try {
        const title    = document.getElementById('project-title').value.trim();
        const desc     = document.getElementById('project-desc').value.trim();
        const moreInfo = document.getElementById('project-moreinfo').value.trim();
        const link     = document.getElementById('project-link').value.trim();
        const date     = document.getElementById('project-date').value.trim();
        const tags     = document.getElementById('project-tags').value.trim()
                            .split(',').map(t => t.trim()).filter(Boolean);
        const imageFile = document.getElementById('project-image-input').files[0];

        if (!title || !desc || !link) {
            setStatus('project-status', 'Title, description, and GitHub link are required.', 'error');
            return;
        }

        let imagePath = 'assets/images/hero-bg.jpg';
        if (imageFile) {
            setStatus('project-status', 'Uploading image…', '');
            imagePath = await uploadFile(imageFile);
        }

        const { json: projects, sha } = await readJson('data/projects.json');

        projects.unshift({
            title,
            description: desc,
            moreInfo: moreInfo || desc,
            link,
            date: date || 'Present',
            image: imagePath,
            tags,
            media: [{ type: 'image', src: imagePath }],
        });

        await writeJson('data/projects.json', projects, sha, `project: add "${title}"`);
        setStatus('project-status', `"${title}" added successfully!`, 'success');
        document.getElementById('admin-project-form').reset();
    } catch (err) {
        setStatus('project-status', `Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Project';
    }
}

// ── Image Preview ──────────────────────────────────────────
function previewBlogImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('blog-image-preview');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
}

// ── View Switching ─────────────────────────────────────────
function showLogin() {
    hide('admin-panel');
    show('admin-login');
}

function showPanel() {
    hide('admin-login');
    show('admin-panel');
}
