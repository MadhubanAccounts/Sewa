import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { 
    ENVIRONMENTS, 
    detectCurrentEnvironment, 
    setTabFavicon, 
    applyEnvironmentFavicon, 
    AppEnvironment, 
    EnvironmentFaviconInfo 
} from '../../utils/favicon';
import { Globe, CheckCircle2, ExternalLink, RefreshCw, Eye, Sparkles, Code, ShieldCheck, Laptop } from 'lucide-react';

interface EnvironmentFaviconManagerProps {
    className?: string;
}

export const EnvironmentFaviconManager: React.FC<EnvironmentFaviconManagerProps> = ({ className = '' }) => {
    const [currentEnv, setCurrentEnv] = useState<AppEnvironment>('production');
    const [activeTabIcon, setActiveTabIcon] = useState<string>('');
    const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
    const [hostname, setHostname] = useState<string>('');

    useEffect(() => {
        const detected = detectCurrentEnvironment();
        setCurrentEnv(detected);
        setHostname(window.location.hostname || 'localhost');

        const currentLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        if (currentLink && currentLink.href) {
            setActiveTabIcon(currentLink.getAttribute('href') || currentLink.href);
        } else {
            setActiveTabIcon(ENVIRONMENTS[detected].iconPath);
        }
    }, []);

    const handleApplyFavicon = (envKey: AppEnvironment) => {
        const envInfo = ENVIRONMENTS[envKey];
        setTabFavicon(envInfo.iconPath);
        setActiveTabIcon(envInfo.iconPath);
        toast(`Browser tab icon updated to ${envInfo.name} (${envInfo.iconPath})`, 'success');
    };

    const handleResetToAuto = () => {
        const env = applyEnvironmentFavicon();
        setCurrentEnv(env);
        setActiveTabIcon(ENVIRONMENTS[env].iconPath);
        toast(`Reset tab icon to automatic detection for ${ENVIRONMENTS[env].name}`, 'info');
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--card-background)] shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                            <Globe className="w-5 h-5" />
                        </span>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">
                            Multi-Domain Environment Favicons
                        </h2>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] max-w-xl">
                        Unique, high-contrast logo images are automatically assigned to each hosting domain to help you instantly distinguish browser tabs between AI Studio preview, GitHub Pages, Cloudflare Pages, and Production.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background-muted)] flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[var(--foreground-muted)]">Detected Host:</span>
                        <strong className="text-[var(--foreground)] font-mono">{hostname}</strong>
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetToAuto}
                        className="text-xs h-8"
                        title="Re-apply the automatic favicon for this host"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Reset Auto
                    </Button>
                </div>
            </div>

            {/* 4 Environment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(ENVIRONMENTS) as AppEnvironment[]).map((envKey) => {
                    const info: EnvironmentFaviconInfo = ENVIRONMENTS[envKey];
                    const isDetected = currentEnv === envKey;
                    const isTabActive = activeTabIcon.includes(info.iconPath.replace('./', ''));

                    return (
                        <div 
                            key={envKey} 
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative bg-[var(--card-background)] ${
                                isDetected 
                                    ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/20 shadow-md' 
                                    : 'border-[var(--border)] hover:border-[var(--border-hover,var(--primary-color))]'
                            }`}
                        >
                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-1 mb-3">
                                <span 
                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                                    style={{ backgroundColor: info.badgeColor }}
                                >
                                    {info.id}
                                </span>

                                {isDetected && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active Domain
                                    </span>
                                )}
                            </div>

                            {/* Centered Logo Preview */}
                            <div className="py-4 flex flex-col items-center justify-center">
                                <div className="p-3 rounded-2xl bg-[var(--background-muted)] border border-[var(--border)] shadow-inner mb-3">
                                    <img 
                                        src={info.iconPath} 
                                        alt={`${info.name} favicon`} 
                                        className="w-14 h-14 object-contain transition-transform hover:scale-110 duration-200"
                                    />
                                </div>
                                <h3 className="font-bold text-sm text-[var(--foreground)] text-center">
                                    {info.name}
                                </h3>
                                <p className="text-[11px] text-[var(--foreground-muted)] text-center mt-0.5 line-clamp-2">
                                    {info.description}
                                </p>
                            </div>

                            {/* Domain Pattern Info */}
                            <div className="my-3 p-2 rounded-lg bg-[var(--background-muted)]/60 border border-[var(--border)] space-y-1 text-left">
                                <div className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                    Domain Pattern:
                                </div>
                                <div className="text-xs font-mono text-[var(--foreground)] break-all font-medium">
                                    {info.domainPattern}
                                </div>
                                <div className="text-[10px] font-mono text-[var(--foreground-muted)] truncate">
                                    File: {info.iconPath}
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                variant={isTabActive ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleApplyFavicon(envKey)}
                                className="w-full text-xs h-8 mt-1"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                {isTabActive ? 'Active in Tab' : 'Test in Tab'}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Simulated Browser Tab Bar Preview */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card-background)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-[var(--primary-color)]" />
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                            Simulated Browser Tab Bar Comparison
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--foreground-muted)]">Toolbar Appearance:</span>
                        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--background-muted)]">
                            <button
                                onClick={() => setPreviewTheme('dark')}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    previewTheme === 'dark'
                                        ? 'bg-[#18181B] text-white shadow-xs'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                Dark Chrome
                            </button>
                            <button
                                onClick={() => setPreviewTheme('light')}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    previewTheme === 'light'
                                        ? 'bg-white text-zinc-900 shadow-xs'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                Light Chrome
                            </button>
                        </div>
                    </div>
                </div>

                {/* Browser Chrome Window Mockup */}
                <div className={`rounded-xl border overflow-hidden shadow-sm ${
                    previewTheme === 'dark' 
                        ? 'bg-[#1E1E24] border-zinc-700/60 text-zinc-100' 
                        : 'bg-[#E5E7EB] border-zinc-300 text-zinc-800'
                }`}>
                    {/* Window Controls & Tab Bar */}
                    <div className={`flex items-center gap-2 px-3 pt-2.5 pb-0 border-b ${
                        previewTheme === 'dark' ? 'bg-[#121217] border-zinc-800' : 'bg-[#D1D5DB] border-zinc-300'
                    }`}>
                        <div className="flex items-center gap-1.5 mr-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto flex-1">
                            {(Object.keys(ENVIRONMENTS) as AppEnvironment[]).map((envKey) => {
                                const info = ENVIRONMENTS[envKey];
                                const isDetected = currentEnv === envKey;

                                return (
                                    <button
                                        key={envKey}
                                        onClick={() => handleApplyFavicon(envKey)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all max-w-[190px] border-t border-l border-r shrink-0 cursor-pointer ${
                                            isDetected
                                                ? (previewTheme === 'dark' 
                                                    ? 'bg-[#1E1E24] border-zinc-700 text-white font-semibold shadow-xs' 
                                                    : 'bg-white border-zinc-300 text-zinc-900 font-semibold shadow-xs')
                                                : (previewTheme === 'dark'
                                                    ? 'bg-[#181820]/60 border-transparent text-zinc-400 hover:bg-[#1E1E24]/80 hover:text-zinc-200'
                                                    : 'bg-zinc-200/60 border-transparent text-zinc-600 hover:bg-white/70 hover:text-zinc-800')
                                        }`}
                                        title={`Click to set tab favicon to ${info.name}`}
                                    >
                                        <img src={info.iconPath} alt="" className="w-4 h-4 shrink-0 rounded-xs" />
                                        <span className="truncate">Audit Portal ({info.id.toUpperCase()})</span>
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: info.badgeColor }}></span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fake URL Address Bar */}
                    <div className={`p-2.5 flex items-center gap-2 text-xs ${
                        previewTheme === 'dark' ? 'bg-[#1E1E24]' : 'bg-white'
                    }`}>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md flex-1 text-xs font-mono ${
                            previewTheme === 'dark' ? 'bg-[#121217] text-zinc-300 border border-zinc-800' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                            <span className="text-emerald-500 font-bold">🔒</span>
                            <span className="text-zinc-500">https://</span>
                            <span className="font-semibold text-[var(--primary-color)]">{hostname}</span>
                            <span className="text-zinc-400">/portal/</span>
                            <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ 
                                backgroundColor: `${ENVIRONMENTS[currentEnv].badgeColor}20`,
                                color: ENVIRONMENTS[currentEnv].badgeColor
                            }}>
                                {currentEnv}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zero-Flicker Architecture Details */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-muted)]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                    <Code className="w-4 h-4 text-[var(--primary-color)]" />
                    How Zero-Flicker Environment Detection Works
                </div>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    A synchronous script placed inside the HTML <code className="px-1.5 py-0.5 rounded bg-[var(--card-background)] border border-[var(--border)] font-mono">&lt;head&gt;</code> executes before React, CSS, or any scripts download. It immediately parses <code className="px-1.5 py-0.5 rounded bg-[var(--card-background)] border border-[var(--border)] font-mono">window.location.hostname</code> and selects the matching SVG. This ensures your browser tab shows the correct environment icon on the very first paint with zero flashing or delay.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px]">
                    <div className="p-2 rounded bg-[var(--card-background)] border border-[var(--border)]">
                        <strong className="text-[var(--foreground)] block">AI Studio / Dev</strong>
                        <span className="text-[var(--foreground-muted)]"><code>*.run.app</code> or <code>localhost</code></span>
                    </div>
                    <div className="p-2 rounded bg-[var(--card-background)] border border-[var(--border)]">
                        <strong className="text-[var(--foreground)] block">GitHub Pages</strong>
                        <span className="text-[var(--foreground-muted)]"><code>*.github.io</code></span>
                    </div>
                    <div className="p-2 rounded bg-[var(--card-background)] border border-[var(--border)]">
                        <strong className="text-[var(--foreground)] block">Cloudflare Workers</strong>
                        <span className="text-[var(--foreground-muted)]"><code>*.workers.dev</code> / <code>*.pages.dev</code></span>
                    </div>
                    <div className="p-2 rounded bg-[var(--card-background)] border border-[var(--border)]">
                        <strong className="text-[var(--foreground)] block">Production</strong>
                        <span className="text-[var(--foreground-muted)]">Custom domains (e.g. <code>audit.bkivv.org</code>)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentFaviconManager;
