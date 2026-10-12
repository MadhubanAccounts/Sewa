/**
 * Environment Favicon Management Utility
 * 
 * Automatically detects the hosting environment based on window.location.hostname
 * and assigns the corresponding favicon image:
 * 
 * 1. AI Studio Dev / Preview / Localhost: /favicon-aistudio.svg (Violet with DEV badge)
 * 2. GitHub Pages (*.github.io):            /favicon-github.svg (Dark Charcoal with GH badge)
 * 3. Cloudflare Pages (*.pages.dev):       /favicon-cloudflare.svg (Cloudflare Orange with CF badge)
 * 4. Production / Custom Domains:          /favicon.svg (Golden & Blue Compliance Shield)
 */

export type AppEnvironment = 'aistudio' | 'github' | 'cloudflare' | 'production';

export interface EnvironmentFaviconInfo {
    id: AppEnvironment;
    name: string;
    domainPattern: string;
    iconPath: string;
    badgeColor: string;
    description: string;
}

export const ENVIRONMENTS: Record<AppEnvironment, EnvironmentFaviconInfo> = {
    aistudio: {
        id: 'aistudio',
        name: 'AI Studio / Localhost',
        domainPattern: '*.run.app, localhost, 127.0.0.1',
        iconPath: './favicon-aistudio.svg',
        badgeColor: '#8B5CF6',
        description: 'Development & AI Studio sandbox environment'
    },
    github: {
        id: 'github',
        name: 'GitHub Pages',
        domainPattern: '*.github.io',
        iconPath: './favicon-github.svg',
        badgeColor: '#24292F',
        description: 'GitHub Pages public or staging deployment'
    },
    cloudflare: {
        id: 'cloudflare',
        name: 'Cloudflare Pages',
        domainPattern: '*.pages.dev, *.cloudflare.com',
        iconPath: './favicon-cloudflare.svg',
        badgeColor: '#F38020',
        description: 'Cloudflare Pages global edge deployment'
    },
    production: {
        id: 'production',
        name: 'Production / Custom',
        domainPattern: 'Custom domain (e.g. audit.bkivv.org)',
        iconPath: './favicon.svg',
        badgeColor: '#2563EB',
        description: 'Clean official compliance brand shield'
    }
};

/**
 * Detects the current hosting environment from the hostname
 */
export const detectCurrentEnvironment = (hostname = window.location.hostname): AppEnvironment => {
    const host = (hostname || '').toLowerCase();
    
    if (host.includes('.run.app') || host.includes('localhost') || host === '127.0.0.1') {
        return 'aistudio';
    }
    
    if (host.includes('github.io')) {
        return 'github';
    }
    
    if (host.includes('pages.dev') || host.includes('cloudflare')) {
        return 'cloudflare';
    }
    
    return 'production';
};

/**
 * Dynamically updates the browser tab favicon to the specified icon path
 */
export const setTabFavicon = (iconPath: string) => {
    try {
        // Find existing icon link or create one
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        
        link.type = iconPath.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        link.href = iconPath;
        
        // Also update apple-touch-icon if present
        const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
        if (appleLink) {
            appleLink.href = iconPath;
        }
    } catch (e) {
        console.warn('Failed to update tab favicon:', e);
    }
};

/**
 * Automatically applies the favicon matching the current environment
 */
export const applyEnvironmentFavicon = (): AppEnvironment => {
    const env = detectCurrentEnvironment();
    const info = ENVIRONMENTS[env];
    setTabFavicon(info.iconPath);
    return env;
};
