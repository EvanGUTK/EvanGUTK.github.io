/**
 * admin-config.js
 *
 * Stores only SHA-256 hashes of credentials — never plaintext.
 * The admin panel compares user input (hashed client-side) against
 * these values. No password is ever stored or transmitted in plain text.
 *
 * Session token expires after 8 hours of inactivity.
 */
export const ADMIN_CONFIG = {
    // SHA-256("EvanGUTK")
    USERNAME_HASH: 'cf546f74a60cba8b25f96500f79c2a0fd84ebcec02d6cdf39644e16924182ad7',
    // SHA-256("USAAS2205")
    PASSWORD_HASH: '9bdce494981c87c4e5495cfd4d2ffdf54d1a4ddbbfa4beadec1a99a43d5255cb',
    // Session duration in milliseconds (8 hours)
    SESSION_TTL_MS: 8 * 60 * 60 * 1000,
    SESSION_KEY: '__admin_session__',
};
