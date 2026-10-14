import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import BottomNav from '../layout/BottomNav';
import { COMPONENTS, ICONS } from './modules';
import { useAuth } from '../../hooks/useAuth';
import ModuleLoader from '../common/ModuleLoader';
import GlobalSearch from '../search/GlobalSearch';
import { useData } from '../../hooks/useData';
import { SearchResultItem, AppModuleConfig, Permission } from '../../types';
import Welcome from './Welcome';
import { X, ChevronDown, ChevronUp, Menu, Maximize, Minimize } from 'lucide-react';

interface TabItem {
    moduleId: string;
    displayName: string;
    componentKey: string;
    iconName: string;
    initialSelectedItemId?: string | null;
}

const Dashboard: React.FC = () => {
    // Tab Management State
    const [openTabs, setOpenTabs] = useState<TabItem[]>(() => {
        const saved = sessionStorage.getItem('openTabs');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        return sessionStorage.getItem('lastActiveModuleId') || '';
    });

    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    
    // Collapsible Layout State
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);

    const { user, hasPermission } = useAuth();
    const { appModules = [] } = user || {};
    const { isSearchOpen, clearSearch, settings } = useData();

    // Browser Fullscreen Sync
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFocusMode(isFs);
            if (isFs) {
                setIsHeaderVisible(false);
                setIsNavVisible(false);
            } else {
                setIsHeaderVisible(true);
                setIsNavVisible(true);
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFocusMode = useCallback(async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                setIsFocusMode(true);
                setIsHeaderVisible(false);
                setIsNavVisible(false);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    }, []);

    // Persist tabs
    useEffect(() => {
        sessionStorage.setItem('openTabs', JSON.stringify(openTabs));
    }, [openTabs]);

    useEffect(() => {
        if (activeTabId) {
            sessionStorage.setItem('lastActiveModuleId', activeTabId);
        }
    }, [activeTabId]);

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
        };
        window.addEventListener('resize', checkScreenSize);
        checkScreenSize();
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const accessibleModules = useMemo(() => {
        // Module permission expansion so presence of ANY assigned permission allows sidebar visibility
        const MODULE_PERMISSIONS_EXPANSION: Record<string, string[]> = {
            'mod_farm_despatch': [
                'farm_despatch_view', 'farm_entry_add', 'farm_entry_edit', 'farm_entry_delete', 
                'farm_entry_print', 'farm_telegram_send', 'farm_admin_manage', 'farm_ai_rate_fetch',
                'perm_farm_despatch_view', 'perm_farm_entry_add', 'perm_farm_entry_edit', 'perm_farm_entry_delete', 
                'perm_farm_entry_print', 'perm_farm_telegram_send', 'perm_farm_admin_manage', 'perm_farm_ai_rate_fetch'
            ],
            'farming-despatch': [
                'farm_despatch_view', 'farm_entry_add', 'farm_entry_edit', 'farm_entry_delete', 
                'farm_entry_print', 'farm_telegram_send', 'farm_admin_manage', 'farm_ai_rate_fetch',
                'perm_farm_despatch_view', 'perm_farm_entry_add', 'perm_farm_entry_edit', 'perm_farm_entry_delete', 
                'perm_farm_entry_print', 'perm_farm_telegram_send', 'perm_farm_admin_manage', 'perm_farm_ai_rate_fetch'
            ],
            'mod_farm_masters': ['farm_admin_manage', 'perm_farm_admin_manage'],
            'farming-masters': ['farm_admin_manage', 'perm_farm_admin_manage'],
            'mod_farm_report': ['farm_report_view', 'perm_farm_report_view', 'farm_admin_manage', 'perm_farm_admin_manage'],
            'farming-report': ['farm_report_view', 'perm_farm_report_view', 'farm_admin_manage', 'perm_farm_admin_manage'],
            'mod_users': ['users_view', 'users_add', 'users_edit', 'users_delete', 'notification_send_users'],
            'users': ['users_view', 'users_add', 'users_edit', 'users_delete', 'notification_send_users'],
            'mod_people': ['people_view', 'people_add', 'people_edit', 'people_delete'],
            'people': ['people_view', 'people_add', 'people_edit', 'people_delete'],
            'mod_perm_matrix': ['permissions_view', 'permissions_edit'],
            'permission-matrix': ['permissions_view', 'permissions_edit'],
            'mod_settings': ['settings_view', 'settings_edit'],
            'settings': ['settings_view', 'settings_edit'],
            'mod_notification_templates': ['notification_templates_view', 'notification_templates_edit', 'notification_templates_send_manual'],
            'notification-templates': ['notification_templates_view', 'notification_templates_edit', 'notification_templates_send_manual'],
            'mod_smr': ['smr_view', 'smr_edit'],
            'data-dictionary': ['smr_view', 'smr_edit'],
            'mod_smr_editor': ['smr_edit', 'smr_view'],
            'smr-editor': ['smr_edit', 'smr_view'],
            'mod_masters': ['masters_edit'],
            'masters-management': ['masters_edit'],
            'mod_aiac_collection_box': ['aiac_view', 'aiac_edit'],
            'audit-collection-box': ['aiac_view', 'aiac_edit'],
            'mod_vouching_stats': ['vouching_stats_view', 'vouching_stats_edit'],
            'vouching-stats': ['vouching_stats_view', 'vouching_stats_edit'],
            'mod_account_submissions': ['account_submissions_view', 'account_submissions_edit'],
            'account-submissions': ['account_submissions_view', 'account_submissions_edit'],
            'mod_audit_status': ['audit_status_edit'],
            'audit-status': ['audit_status_edit'],
            'mod_audit_workbench': ['audit_workbench_view', 'audit_workbench_sync', 'audit_workbench_export'],
            'audit-workbench': ['audit_workbench_view', 'audit_workbench_sync', 'audit_workbench_export'],
            'mod_bulk_messaging': ['bulk_messaging_view'],
            'bulk-messaging': ['bulk_messaging_view'],
            'mod_telegram_data': ['telegram_data_view', 'telegram_data_edit'],
            'telegram-data': ['telegram_data_view', 'telegram_data_edit']
        };

        let modulesList = [...appModules];

        // Ensure Farming & Agriculture category exists in list
        const hasFarmingCategory = modulesList.some(m => m.moduleId === 'cat_farming');
        if (!hasFarmingCategory) {
            modulesList.push({
                moduleId: 'cat_farming',
                displayName: 'Farming & Agriculture',
                parentModuleId: null,
                moduleType: 'CATEGORY',
                iconName: 'Sprout',
                componentKey: '',
                permission: null,
                isVisible: true,
                sortOrder: 110
            });
        }

        // Ensure Produce Despatch module exists
        const hasFarmDespatch = modulesList.some(m => m.moduleId === 'mod_farm_despatch' || m.componentKey === 'farming-despatch');
        if (!hasFarmDespatch) {
            modulesList.push({
                moduleId: 'mod_farm_despatch',
                displayName: 'Produce Despatch (Dadi Gulzar Upvan)',
                parentModuleId: 'cat_farming',
                moduleType: 'MODULE',
                iconName: 'Sprout',
                componentKey: 'farming-despatch',
                permission: 'farm_despatch_view,farm_entry_add,farm_entry_edit,farm_entry_delete,farm_entry_print,farm_telegram_send,farm_admin_manage,farm_ai_rate_fetch',
                isVisible: true,
                sortOrder: 10
            });
        }

        // Ensure Farm Masters module exists for direct master management (Point 2)
        const hasFarmMasters = modulesList.some(m => m.moduleId === 'mod_farm_masters' || m.componentKey === 'farming-masters');
        if (!hasFarmMasters) {
            modulesList.push({
                moduleId: 'mod_farm_masters',
                displayName: 'Farm Masters & Rates',
                parentModuleId: 'cat_farming',
                moduleType: 'MODULE',
                iconName: 'Shield',
                componentKey: 'farming-masters',
                permission: 'farm_admin_manage',
                isVisible: true,
                sortOrder: 15
            });
        }

        // Ensure Farm Reports module exists
        const hasFarmReport = modulesList.some(m => m.moduleId === 'mod_farm_report' || m.componentKey === 'farming-report');
        if (!hasFarmReport) {
            modulesList.push({
                moduleId: 'mod_farm_report',
                displayName: 'Farm Reports & Analytics',
                parentModuleId: 'cat_farming',
                moduleType: 'MODULE',
                iconName: 'BarChart3',
                componentKey: 'farming-report',
                permission: 'farm_report_view',
                isVisible: true,
                sortOrder: 20
            });
        }

        // Normalize and configure existing farm modules
        modulesList = modulesList.map(mod => {
            if (mod.moduleId === 'cat_farming') {
                return {
                    ...mod,
                    parentModuleId: null,
                    isVisible: true
                };
            }
            if (mod.moduleId === 'mod_farm_despatch' || mod.componentKey === 'farming-despatch') {
                return {
                    ...mod,
                    parentModuleId: 'cat_farming',
                    displayName: 'Produce Despatch (Dadi Gulzar Upvan)',
                    permission: 'farm_despatch_view,farm_entry_add,farm_entry_edit,farm_entry_delete,farm_entry_print,farm_telegram_send,farm_admin_manage,farm_ai_rate_fetch',
                    isVisible: true
                };
            }
            if (mod.moduleId === 'mod_farm_masters' || mod.componentKey === 'farming-masters') {
                return {
                    ...mod,
                    parentModuleId: 'cat_farming',
                    displayName: 'Farm Masters & Rates',
                    permission: 'farm_admin_manage',
                    isVisible: true
                };
            }
            if (mod.moduleId === 'mod_farm_report' || mod.componentKey === 'farming-report') {
                return {
                    ...mod,
                    parentModuleId: 'cat_farming',
                    displayName: 'Farm Reports & Analytics',
                    permission: 'farm_report_view',
                    isVisible: true
                };
            }
            return mod;
        });

        // Universal permission check for all modules (Pure PBAC - No role overrides)
        return modulesList.filter(module => {
            // Category headers are included in list; Sidebar will only render categories having accessible children
            if (module.moduleType === 'CATEGORY') return true;

            const expansionPerms = MODULE_PERMISSIONS_EXPANSION[module.moduleId] || MODULE_PERMISSIONS_EXPANSION[module.componentKey || ''];
            if (expansionPerms && expansionPerms.length > 0) {
                if (expansionPerms.some(p => hasPermission(p as Permission))) return true;
            }

            if (!module.permission) return true;

            const requiredPerms = module.permission.split(/[,|]/).map(p => p.trim()).filter(Boolean);
            return requiredPerms.some(p => hasPermission(p as Permission));
        });
    }, [appModules, hasPermission]);
    
    // Set default tab if none open - Fallback to first accessible module so simulated permissions always open seamlessly
    useEffect(() => {
        if (accessibleModules.length > 0 && openTabs.length === 0) {
            const dashboardModule = accessibleModules.find(m => m.componentKey === 'dashboard');
            const targetModule = dashboardModule || accessibleModules.find(m => m.moduleType !== 'CATEGORY' && m.componentKey);
            if (targetModule) {
                const newTab: TabItem = {
                    moduleId: targetModule.moduleId,
                    displayName: targetModule.displayName,
                    componentKey: targetModule.componentKey,
                    iconName: targetModule.iconName
                };
                setOpenTabs([newTab]);
                setActiveTabId(targetModule.moduleId);
            }
        }
    }, [accessibleModules, openTabs.length]);

    // Point 9a: Auto-collapse application header and bottom navigation on mobile when viewing Farming module
    useEffect(() => {
        if (isMobile) {
            const active = accessibleModules.find(m => m.moduleId === activeTabId);
            if (active?.componentKey === 'farming-despatch' || active?.componentKey === 'farm-despatch') {
                setIsHeaderVisible(false);
                setIsNavVisible(false);
            }
        }
    }, [isMobile, activeTabId, accessibleModules]);
    
    const handleModuleSelect = useCallback((moduleId: string, selectedItemId: string | null = null) => {
        const existingTab = openTabs.find(t => t.moduleId === moduleId);
        
        if (existingTab) {
            if (selectedItemId) {
                setOpenTabs(prev => prev.map(t => t.moduleId === moduleId ? { ...t, initialSelectedItemId: selectedItemId } : t));
            }
            setActiveTabId(moduleId);
        } else {
            let moduleConfig = accessibleModules.find(m => m.moduleId === moduleId);
            
            if (moduleId.startsWith('custom_rpt_')) {
                 const baseViewerModule = accessibleModules.find(m => m.moduleId === 'mod_custom_viewer');
                 if (baseViewerModule) {
                     moduleConfig = baseViewerModule;
                 }
            }

            if (moduleConfig) {
                const newTab: TabItem = {
                    moduleId: moduleConfig.moduleId,
                    displayName: moduleConfig.displayName,
                    componentKey: moduleConfig.componentKey,
                    iconName: moduleConfig.iconName,
                    initialSelectedItemId: selectedItemId
                };
                setOpenTabs(prev => [...prev, newTab]);
                setActiveTabId(moduleConfig.moduleId);
            }
        }
    }, [openTabs, accessibleModules]);

    const closeTab = useCallback((e: React.MouseEvent | null, moduleId: string) => {
        if (e) e.stopPropagation();
        const tabToCloseIndex = openTabs.findIndex(t => t.moduleId === moduleId);
        const newTabs = openTabs.filter(t => t.moduleId !== moduleId);
        
        setOpenTabs(newTabs);
        
        if (activeTabId === moduleId) {
            if (newTabs.length > 0) {
                const nextActiveIndex = Math.max(0, tabToCloseIndex - 1);
                setActiveTabId(newTabs[nextActiveIndex].moduleId);
            } else {
                setActiveTabId('');
            }
        }
    }, [openTabs, activeTabId]);

    // Handle "Esc" Key Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (document.getElementById('my-modal')) return;
                if (document.querySelector('[role="dialog"]')) return;
                const portalRoot = document.getElementById('portal-root');
                if (portalRoot && portalRoot.children.length > 0) return;
                if (document.querySelector('[aria-expanded="true"]')) return;

                const activeEl = document.activeElement;
                if (activeEl && (
                    activeEl.tagName === 'INPUT' || 
                    activeEl.tagName === 'TEXTAREA' || 
                    activeEl.tagName === 'SELECT' || 
                    activeEl.getAttribute('contenteditable') === 'true'
                )) {
                    (activeEl as HTMLElement).blur();
                    return;
                }

                if (activeTabId && openTabs.length > 0) {
                    closeTab(null, activeTabId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [activeTabId, openTabs, closeTab]);

    const handleSearchResultClick = (item: SearchResultItem) => {
        clearSearch();
        const targetModule = appModules.find(m => m.componentKey === item.module);
        if (targetModule) {
            handleModuleSelect(targetModule.moduleId, item.id);
        }
    };

    const activeModule = accessibleModules.find(m => m.moduleId === activeTabId);
    const placeholderKeys = ['placeholder', 'flats', 'rooms', 'beds', 'allotments', 'allotment-history', 'reservations'];

    return (
        <div className="flex h-screen bg-transparent">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                isMobile={isMobile}
                activeModuleId={activeTabId}
                onModuleSelect={handleModuleSelect}
                accessibleModules={accessibleModules}
            />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header Container */}
                <div className={`flex-shrink-0 transition-all duration-500 ease-in-out relative z-20 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full -mb-[73px] opacity-0 pointer-events-none'}`}>
                    <Header 
                        isMobile={isMobile}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        moduleName={activeModule?.displayName || 'Care Portal'}
                        onProfileClick={() => {
                            const profileMod = accessibleModules.find(m => m.componentKey === 'my-profile');
                            if (profileMod) handleModuleSelect(profileMod.moduleId);
                        }}
                        onFocusToggle={toggleFocusMode}
                        isFocusMode={isFocusMode}
                    />
                </div>
                
                {/* Refined Shorter and Wider Pull Tab (Side-by-Side Chevrons) */}
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                     <button
                        onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                        className={`pointer-events-auto bg-[var(--card-background)]/60 backdrop-blur-sm border-b-2 border-x-2 border-[var(--border)] text-[var(--foreground-muted)] rounded-b-3xl px-6 py-0.0 h-3 shadow-sm hover:text-[var(--primary-color)] hover:bg-[var(--card-background)]/90 hover:shadow-md hover:ring-1 hover:ring-[var(--primary-color)]/20 transition-all duration-300 transform group ${isHeaderVisible ? 'translate-y-[65px]' : 'translate-y-0 opacity-30 hover:opacity-100'}`}
                        title={isHeaderVisible ? "Collapse Header" : "Show Header"}
                    >
                        <div className="flex flex-row items-center gap-3 justify-center">
                            <ChevronDown size={10} strokeWidth={8} className={`transition-transform duration-300 ${isHeaderVisible ? 'rotate-180' : 'rotate-0'}`} />
                            <ChevronDown size={10} strokeWidth={8} className={`transition-transform duration-300 ${isHeaderVisible ? 'rotate-180' : 'rotate-0'}`} />
                            <ChevronDown size={10} strokeWidth={8} className={`transition-transform duration-300 ${isHeaderVisible ? 'rotate-180' : 'rotate-0'}`} />
                        </div>
                    </button>
                </div>

                {/* Floating Hamburger (Header Hidden) */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className={`fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-[var(--card-background)]/60 backdrop-blur-md border border-[var(--border)] shadow-md text-[var(--foreground)] hover:text-[var(--primary-color)] hover:bg-[var(--card-background)] transition-all duration-300 ${!isHeaderVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
                    title="Toggle Sidebar"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={22} strokeWidth={2.5} />
                </button>

                {/* Desktop Tab Bar */}
                {!isMobile && openTabs.length > 0 && (
                    <div className={`flex items-center px-4 pt-2 border-b border-[var(--border)] overflow-x-auto scrollbar-hide gap-1 transition-all duration-300 ${isHeaderVisible ? 'bg-[var(--header-background)]' : 'bg-[var(--card-background)] pt-2'}`}>
                        {openTabs.map(tab => (
                            <button
                                key={tab.moduleId}
                                onClick={() => setActiveTabId(tab.moduleId)}
                                className={`flex items-center group relative min-w-[120px] max-w-[200px] px-3 py-2 rounded-t-lg transition-all text-sm font-medium ${
                                    activeTabId === tab.moduleId 
                                    ? 'bg-[var(--main-background)] text-[var(--primary-color)] border-t border-x border-[var(--border)] -mb-[1px] z-10' 
                                    : 'text-[var(--foreground-muted)] hover:bg-[var(--tab-hover-background)]'
                                }`}
                                title={tab.displayName}
                            >
                                {ICONS[tab.iconName] && React.cloneElement(ICONS[tab.iconName] as React.ReactElement<any>, { size: 14, className: "mr-2 flex-shrink-0" })}
                                <span className="truncate flex-grow text-left mr-2">{tab.displayName}</span>
                                <div 
                                    onClick={(e) => closeTab(e, tab.moduleId)}
                                    className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Close Tab (Esc)"
                                >
                                    <X size={12} />
                                </div>
                                {activeTabId === tab.moduleId && (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--primary-color)] rounded-t-lg"></div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <main className={`flex-1 min-h-0 relative overflow-hidden bg-[var(--main-background)] ${isMobile ? (isNavVisible ? 'pb-20' : 'pb-8') : ''} transition-all duration-300`}>
                    <Suspense fallback={<ModuleLoader />}>
                        {openTabs.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-10"><Welcome /></div>
                        ) : (
                            openTabs.map(tab => {
                                const moduleConfig = accessibleModules.find(m => m.moduleId === tab.moduleId);
                                if (!moduleConfig) return null;
                                
                                const ActiveComponent = COMPONENTS[tab.componentKey] || COMPONENTS['placeholder'];
                                const isActive = activeTabId === tab.moduleId;
                                
                                if (!ActiveComponent) {
                                    console.warn(`Component not found for key: ${tab.componentKey}`);
                                    return null;
                                }

                                return (
                                    <div 
                                        key={tab.moduleId} 
                                        className={`absolute inset-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 transition-all duration-300 ${isActive ? 'block' : 'hidden'}`}
                                    >
                                        <ActiveComponent 
                                            {...((tab.componentKey === 'dashboard' || tab.componentKey === 'reports') && { onModuleSelect: handleModuleSelect })}
                                            {...(placeholderKeys.includes(tab.componentKey) && { 
                                                moduleConfig: moduleConfig,
                                                icon: ICONS[moduleConfig.iconName] || <div />
                                            })}
                                            {...(tab.componentKey === 'users' && { 
                                                initialSelectedUserId: tab.initialSelectedItemId 
                                            })}
                                            {...(tab.componentKey === 'people' && { 
                                                initialSelectedPersonId: tab.initialSelectedItemId 
                                            })}
                                            {...(tab.componentKey === 'custom-report-viewer' && {
                                                reportId: tab.initialSelectedItemId
                                            })}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </Suspense>
                </main>
                
                {settings.find(s => s.settingName === 'footerText')?.settingValue && (
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${isMobile && !isNavVisible ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                        <footer className="text-center p-4 text-xs text-[var(--foreground-muted)] border-t border-[var(--border)] bg-[var(--footer-background)]">
                            {settings.find(s => s.settingName === 'footerText')?.settingValue}
                        </footer>
                    </div>
                )}
            </div>
            
            {/* Mobile Bottom Nav */}
            {isMobile && (
                 <>
                    <div className={`fixed left-0 right-0 z-[70] flex justify-center transition-all duration-300 ${isNavVisible ? 'bottom-[58px]' : 'bottom-0'}`}>
                         <button
                            onClick={() => setIsNavVisible(!isNavVisible)}
                            className="bg-[var(--card-background)]/60 backdrop-blur-sm border-t-2 border-x-2 border-[var(--border)] text-[var(--foreground-muted)] rounded-t-3xl px-6 py-0 h-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] hover:text-[var(--primary-color)] hover:bg-[var(--card-background)]/90 transition-all group"
                         >
                            <div className="flex flex-row items-center gap-3 justify-center">
                                <ChevronUp size={10} strokeWidth={8} className={`transition-transform duration-300 ${isNavVisible ? 'rotate-180' : 'rotate-0'}`} />
                                <ChevronUp size={10} strokeWidth={8} className={`transition-transform duration-300 ${isNavVisible ? 'rotate-180' : 'rotate-0'}`} />
                                <ChevronUp size={10} strokeWidth={8} className={`transition-transform duration-300 ${isNavVisible ? 'rotate-180' : 'rotate-0'}`} />
                            </div>
                         </button>
                    </div>
                    <div className={`fixed bottom-0 left-0 right-0 z-60 transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                        <BottomNav activeModuleId={activeTabId} onModuleSelect={handleModuleSelect} accessibleModules={accessibleModules} />
                    </div>
                 </>
            )}

            {isSearchOpen && <GlobalSearch onResultClick={handleSearchResultClick} />}
        </div>
    );
};

export default Dashboard;