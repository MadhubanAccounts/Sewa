/**
 * WebAuthn / Passkey Client Utilities
 * Handles ArrayBuffer <-> Base64URL encoding and browser credential requests
 */

// Base64URL to ArrayBuffer
export function base64urlToBuffer(base64url: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
}

// ArrayBuffer to Base64URL
export function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Checks if the current document context is permitted to use WebAuthn / Passkeys.
 * Under modern browser security specifications, WebAuthn is blocked in cross-origin /
 * child iframes unless delegated via Permissions-Policy ('publickey-credentials-get'/'publickey-credentials-create').
 */
export function isWebAuthnPermitted(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    if (window.isSecureContext === false) return false;

    const doc = document as any;

    // Check Permissions-Policy API (W3C standard)
    if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
        try {
            if (!doc.permissionsPolicy.allowsFeature('publickey-credentials-get')) {
                return false;
            }
        } catch {
            // Feature string may not be recognized in older browser engines
        }
    }

    // Check legacy Feature-Policy API
    if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
        try {
            if (!doc.featurePolicy.allowsFeature('publickey-credentials-get')) {
                return false;
            }
        } catch {}
    }

    // Check if running inside an iframe (such as an embedded preview frame)
    let isEmbedded = false;
    try {
        isEmbedded = window.self !== window.top;
    } catch {
        // Cross-origin access restriction means it's definitely embedded
        isEmbedded = true;
    }

    if (isEmbedded) {
        // If embedded in an iframe, verify explicit Permissions-Policy permission.
        // In the absence of positive confirmation, browsers block publickey-credentials-get/create.
        if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
            try {
                return !!doc.permissionsPolicy.allowsFeature('publickey-credentials-get');
            } catch {
                return false;
            }
        }
        if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
            try {
                return !!doc.featurePolicy.allowsFeature('publickey-credentials-get');
            } catch {
                return false;
            }
        }
        // In child frame without positive policy confirmation
        return false;
    }

    return true;
}

/**
 * Checks if running inside an iframe
 */
export function isEmbeddedFrame(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
}

/**
 * Checks if the current browser, device, and document context support WebAuthn and platform biometrics
 */
export async function isBiometricsAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    
    // First, verify whether the document permissions allow WebAuthn in this frame
    if (!isWebAuthnPermitted()) {
        return false;
    }

    try {
        if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return !!available;
        }
        return false;
    } catch (e) {
        console.warn('[WebAuthn] Capability check failed:', e);
        return false;
    }
}

/**
 * Local device recognition storage for 1-tap quick login (Domain-Aware)
 */
const PASSKEY_LOCAL_STORAGE_KEY = 'bk_passkey_enrolled_user';

export interface LocalPasskeyUser {
    userId: string;
    name: string;
    mobileNumber: string;
    enrolledAt: string;
    domain?: string;
}

export function getCurrentDomain(): string {
    if (typeof window === 'undefined') return '';
    return window.location.hostname.toLowerCase();
}

export function getDomainFriendlyName(domain?: string): string {
    if (!domain || !domain.trim()) return 'All Domains / Legacy';
    const d = domain.toLowerCase().trim();
    if (d.includes('github.io')) return 'GitHub Pages';
    if (d.includes('workers.dev')) return 'Cloudflare Workers';
    if (d.includes('pages.dev') || d.includes('cloudflare')) return 'Cloudflare Pages';
    if (d.includes('run.app') || d.includes('ais-')) return 'Google AI Studio';
    if (d === 'localhost' || d === '127.0.0.1') return 'Localhost Dev';
    return d;
}

/**
 * Retrieves the enrolled passkey user for the specified domain (defaults to current domain).
 * If requireDomainMatch is true, verifies that the enrolled domain matches current domain.
 */
export function getLocalPasskeyUser(targetDomain?: string, requireDomainMatch: boolean = false): LocalPasskeyUser | null {
    try {
        const stored = localStorage.getItem(PASSKEY_LOCAL_STORAGE_KEY);
        if (!stored) return null;
        const user = JSON.parse(stored) as LocalPasskeyUser;
        const currentDomain = (targetDomain || getCurrentDomain()).toLowerCase();

        if (requireDomainMatch && user.domain) {
            if (user.domain.toLowerCase() !== currentDomain) {
                return null;
            }
        }
        return user;
    } catch {
        return null;
    }
}

export function setLocalPasskeyUser(data: LocalPasskeyUser): void {
    try {
        const currentDomain = getCurrentDomain();
        const enrichedData: LocalPasskeyUser = {
            ...data,
            domain: data.domain || currentDomain
        };
        localStorage.setItem(PASSKEY_LOCAL_STORAGE_KEY, JSON.stringify(enrichedData));
    } catch (e) {
        console.warn('[WebAuthn] Failed to store local passkey user hint:', e);
    }
}

export function clearLocalPasskeyUser(): void {
    try {
        localStorage.removeItem(PASSKEY_LOCAL_STORAGE_KEY);
    } catch {}
}

