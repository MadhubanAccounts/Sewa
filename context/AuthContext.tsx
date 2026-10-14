
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, Permission } from '../types';
import * as api from '../services/apiService';
import { toast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface AuthContextType {
    user: Session | null;
    loading: boolean;
    login: (mobileNumber: string, otp: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithSession: (session: Session) => void;
    logout: (sessionId?: string, reason?: 'logout' | 'inactivity' | 'expired') => void;
    hasPermission: (permission: Permission) => boolean;
    requestOtp: (mobileNumber: string) => Promise<{ success: boolean; message?: string }>;
    refreshSessionData: () => Promise<void>;
    isRefreshing: boolean;
    // New function to allow partial updates to the session
    updateSession: (updatedData: Partial<Session>) => void;
    // V3.1 Permission Simulation
    isSimulating: boolean;
    simulatedPermissions: Permission[] | null;
    simulatePermissions: (permissions: Permission[]) => void;
    resetPermissions: () => void;
    lastActivityRef?: React.MutableRefObject<number>;
    timeoutMinutes?: number;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [simulatedPermissions, setSimulatedPermissions] = useState<Permission[] | null>(null);

    // Session Inactivity Timeout State
    const [timeoutMinutes, setTimeoutMinutes] = useState(() => {
        return parseInt(localStorage.getItem('inactivityTimeout') || '15', 10);
    });
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const [warningCountdown, setWarningCountdown] = useState(60);
    const lastActivityRef = React.useRef(Date.now());
    const showInactivityWarningRef = React.useRef(false);

    useEffect(() => {
        showInactivityWarningRef.current = showInactivityWarning;
    }, [showInactivityWarning]);

    useEffect(() => {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
            try {
                const session: Session = JSON.parse(storedSession);
                
                // Inspect expiration timestamp immediately on restore
                let isExpired = false;
                if (session.expirationTimestamp) {
                    const expiryTime = new Date(session.expirationTimestamp).getTime();
                    const now = Date.now();
                    if (now > expiryTime - 5000) {
                        isExpired = true;
                    }
                }

                if (isExpired) {
                    console.warn("[Auth] Restored session from localStorage is already expired. Clearing.");
                    localStorage.removeItem('session');
                } else {
                    setUser(session);
                }
            } catch (error) {
                console.error("Failed to parse session from localStorage", error);
                localStorage.removeItem('session');
            }
        }
        setLoading(false);
    }, []);

    // --- POST-REFRESH TOAST NOTIFICATIONS ---
    useEffect(() => {
        const expiredToast = sessionStorage.getItem('session_expired_toast');
        if (expiredToast) {
            toast('Your session has expired. Please log in again.', 'error');
            sessionStorage.removeItem('session_expired_toast');
        }

        const logoutToast = sessionStorage.getItem('session_logout_toast');
        if (logoutToast) {
            toast('You have been logged out successfully.', 'success');
            sessionStorage.removeItem('session_logout_toast');
        }

        const inactivityToast = sessionStorage.getItem('session_inactivity_toast');
        if (inactivityToast) {
            toast('You have been logged out due to inactivity to improve security.', 'error');
            sessionStorage.removeItem('session_inactivity_toast');
        }
    }, []);

    const logout = useCallback(async (sessionId?: string, reason: 'logout' | 'inactivity' | 'expired' = 'logout') => {
        const sid = sessionId || user?.sessionId;
        try {
            if (sid) {
                await api.logout(sid);
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setUser(null);
            localStorage.removeItem('session');
            setSimulatedPermissions(null);

            if (reason === 'inactivity') {
                sessionStorage.setItem('session_inactivity_toast', 'true');
            } else if (reason === 'expired') {
                sessionStorage.setItem('session_expired_toast', 'true');
            } else {
                sessionStorage.setItem('session_logout_toast', 'true');
            }

            window.location.reload();
        }
    }, [user]);

    // --- SESSION EXPIRY INTERCEPTOR ---
    useEffect(() => {
        const handleSessionExpired = () => {
            if (user) {
                logout(undefined, 'expired');
            }
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [user, logout]);

    // --- PROACTIVE EXPIRY CHECK ---
    useEffect(() => {
        const checkExpiry = () => {
            if (user && user.expirationTimestamp) {
                const expiryTime = new Date(user.expirationTimestamp).getTime();
                const now = new Date().getTime();
                
                // Add a small buffer (e.g., 5 seconds) to be safe
                if (now > expiryTime - 5000) {
                     window.dispatchEvent(new Event('session-expired'));
                }
            }
        };

        // Check when window gains focus (e.g. returning to tab or unlocking phone)
        window.addEventListener('focus', checkExpiry);
        
        // Also check immediately if user changes (e.g. on mount/login)
        checkExpiry();

        return () => window.removeEventListener('focus', checkExpiry);
    }, [user]);

    // --- DYNAMIC INACTIVITY TIMEOUT UPDATE ---
    useEffect(() => {
        const handleTimeoutChanged = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setTimeoutMinutes(parseFloat(customEvent.detail));
            }
        };
        window.addEventListener('inactivity-timeout-changed', handleTimeoutChanged);
        return () => window.removeEventListener('inactivity-timeout-changed', handleTimeoutChanged);
    }, []);

    // Sync inactivity timeout from backend viewPreferences if available
    useEffect(() => {
        if (user?.viewPreferences) {
            try {
                const prefs = JSON.parse(user.viewPreferences);
                if (prefs.security && prefs.security.inactivityTimeout) {
                    const minutes = parseFloat(prefs.security.inactivityTimeout);
                    if (!isNaN(minutes)) {
                        setTimeoutMinutes(minutes);
                        localStorage.setItem('inactivityTimeout', String(minutes));
                    }
                }
            } catch (e) {
                console.error("[Auth] Failed to parse viewPreferences for inactivity timeout", e);
            }
        }
    }, [user?.viewPreferences]);

    // --- SESSION INACTIVITY AUTO-LOGOUT ---
    useEffect(() => {
        if (!user) {
            setShowInactivityWarning(false);
            return;
        }

        const INACTIVITY_LIMIT_MS = timeoutMinutes * 60 * 1000;
        const WARNING_LIMIT_MS = INACTIVITY_LIMIT_MS <= 60000 
            ? INACTIVITY_LIMIT_MS / 2 
            : INACTIVITY_LIMIT_MS - 60 * 1000; // 1 minute warning before logout

        const handleActivity = () => {
            if (showInactivityWarningRef.current) {
                // If warning is already showing, ignore general passive activity events (like mousemove, keypress)
                // so they don't auto-dismiss the modal. The user must explicitly click "Stay Logged In" on the modal.
                return;
            }
            lastActivityRef.current = Date.now();
            setShowInactivityWarning(false);
        };

        const handleVisibilityOrFocus = () => {
            const elapsed = Date.now() - lastActivityRef.current;
            if (elapsed >= INACTIVITY_LIMIT_MS) {
                setShowInactivityWarning(false);
                logout(undefined, 'inactivity');
            } else if (elapsed >= WARNING_LIMIT_MS) {
                setShowInactivityWarning(true);
                const remainingSeconds = Math.max(0, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
                setWarningCountdown(remainingSeconds);
            }
        };

        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        window.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);

        const checkInterval = setInterval(() => {
            const elapsed = Date.now() - lastActivityRef.current;
            
            if (elapsed >= INACTIVITY_LIMIT_MS) {
                clearInterval(checkInterval);
                setShowInactivityWarning(false);
                logout(undefined, 'inactivity');
            } else if (elapsed >= WARNING_LIMIT_MS) {
                setShowInactivityWarning(true);
                const remainingSeconds = Math.max(0, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
                setWarningCountdown(remainingSeconds);
            } else {
                setShowInactivityWarning(false);
            }
        }, 1000);

        lastActivityRef.current = Date.now();

        return () => {
            clearInterval(checkInterval);
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('focus', handleVisibilityOrFocus);
        };
    }, [user, timeoutMinutes, logout]);


    const requestOtp = useCallback(async (mobileNumber: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const resp = await api.requestOtp(mobileNumber);
            return resp;
        } catch (error) {
            console.error(error);
            // Re-throw the error so the UI can display the specific message from backend
            throw error;
        }
    }, []);

    const login = useCallback(async (mobileNumber: string, otp: string) => {
        try {
            const session = await api.verifyOtp(mobileNumber, otp);
            setUser(session);
            localStorage.setItem('session', JSON.stringify(session));
            window.location.reload();
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    }, []);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        try {
            const session = await api.verifyGoogleLogin(idToken);
            setUser(session);
            localStorage.setItem('session', JSON.stringify(session));
            window.location.reload();
        } catch (error) {
            console.error("Google login failed:", error);
            throw error;
        }
    }, []);

    const loginWithSession = useCallback((session: Session) => {
        setUser(session);
        localStorage.setItem('session', JSON.stringify(session));
        window.location.reload();
    }, []);



    const refreshSessionData = useCallback(async () => {
        if (!user) return;
        setIsRefreshing(true);
        try {
            const { appModules, permissions } = await api.getAppConfiguration(user.sessionId);
            const updatedUser = { ...user, appModules, permissions };
            setUser(updatedUser);
            localStorage.setItem('session', JSON.stringify(updatedUser));
            toast('Session data refreshed!', 'success');
        } catch (error) {
            console.error("Failed to refresh session data:", error);
            toast('Failed to refresh configuration.', 'error');
        } finally {
            setIsRefreshing(false);
        }
    }, [user]);

    const updateSession = useCallback((updatedData: Partial<Session>) => {
        if (!user) return;
        const newSession = { ...user, ...updatedData };
        setUser(newSession);
        localStorage.setItem('session', JSON.stringify(newSession));
    }, [user]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!permission) return false;
        const norm = (p: string) => String(p || '').trim().toLowerCase().replace(/^perm_/, '');
        const target = norm(permission);

        const activePerms = simulatedPermissions !== null
            ? simulatedPermissions
            : (Array.isArray(user?.permissions) ? user.permissions : []);

        return activePerms.some(p => {
            if (!p) return false;
            return norm(p) === target;
        });
    }, [user, simulatedPermissions]);

    const simulatePermissions = useCallback((permissions: Permission[]) => {
        setSimulatedPermissions(permissions);
        toast('Permission simulation started.', 'info');
    }, []);

    const resetPermissions = useCallback(() => {
        setSimulatedPermissions(null);
        toast('Permission simulation ended.', 'success');
    }, []);

    const value = React.useMemo(() => ({ 
        user, 
        loading, 
        login, 
        loginWithGoogle,
        loginWithSession,
        logout, 
        hasPermission, 
        requestOtp, 
        refreshSessionData, 
        isRefreshing,
        updateSession,
        isSimulating: simulatedPermissions !== null,
        simulatedPermissions,
        simulatePermissions,
        resetPermissions,
        lastActivityRef,
        timeoutMinutes,
    }), [user, loading, login, loginWithGoogle, loginWithSession, logout, hasPermission, requestOtp, refreshSessionData, isRefreshing, simulatedPermissions, timeoutMinutes]);

    const handleKeepWorking = () => {
        lastActivityRef.current = Date.now();
        setShowInactivityWarning(false);
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {showInactivityWarning && (
                <ConfirmModal
                    isOpen={showInactivityWarning}
                    onClose={logout}
                    onConfirm={handleKeepWorking}
                    title="Inactivity Warning"
                    message={`You have been inactive. For your security, you will be automatically logged out in ${warningCountdown} seconds.`}
                    confirmText="Stay Logged In"
                    cancelText="Log Out"
                />
            )}
        </AuthContext.Provider>
    );
};
