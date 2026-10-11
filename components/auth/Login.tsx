
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from '../ui/Toast';
import { Shield, Clock, ExternalLink, AlertCircle, MessageSquare, Smartphone, CheckCircle2, Send, Fingerprint, Lock, UserCheck, Sparkles, QrCode, ArrowRight } from 'lucide-react';
import { SplitInput } from '../ui/SplitInput';
import * as api from '../../services/apiService';
import { ICONS } from '../dashboard/modules';
import { applyTheme } from '../../utils/theme';
import { WorkstationSkeleton } from '../common/WorkstationSkeleton';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { base64urlToBuffer, bufferToBase64url, isBiometricsAvailable, isWebAuthnPermitted, getLocalPasskeyUser, clearLocalPasskeyUser, LocalPasskeyUser } from '../../utils/webauthn';

// Global variable to persist GSI initialization status across react component re-mounts
let gsiInitialized = false;

const Login: React.FC = () => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [isTelegramLoading, setIsTelegramLoading] = useState(false);
    const [isBiometricLoading, setIsBiometricLoading] = useState(false);
    const [isHardwareSupported, setIsHardwareSupported] = useState(false);
    const [localPasskeyUser, setLocalPasskeyUser] = useState<LocalPasskeyUser | null>(null);
    const [isBrandingLoading, setIsBrandingLoading] = useState(true);
    const { requestOtp, login, loginWithGoogle, loginWithSession } = useAuth();
    const [logoError, setLogoError] = useState(false);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [showGsiTroubleshoot, setShowGsiTroubleshoot] = useState(false);
    const [isIframe, setIsIframe] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'otp' | 'google'>('otp');
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const verificationInitiatedRef = useRef(false);

    // Telegram Login States
    const [telegramToken, setTelegramToken] = useState('');
    const [tgBotUsername, setTgBotUsername] = useState('');
    const [telegramStatus, setTelegramStatus] = useState<'IDLE' | 'PENDING' | 'VERIFIED' | 'EXPIRED'>('IDLE');
    const [telegramExpiry, setTelegramExpiry] = useState<number | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(300);

    // Telegram Mini App states
    const [miniAppToken, setMiniAppToken] = useState<string | null>(null);
    const [miniAppVerifying, setMiniAppVerifying] = useState(false);
    const [miniAppVerifiedStatus, setMiniAppVerifiedStatus] = useState<'PENDING' | 'SUCCESS' | 'ERROR'>('PENDING');
    const [miniAppErrorMessage, setMiniAppErrorMessage] = useState('');
    const [tgUserInfo, setTgUserInfo] = useState<{ id: string; username?: string; firstName?: string; lastName?: string; photoUrl?: string } | null>(null);

    // Mini App Simulator States
    const [simStep, setSimStep] = useState<'notification' | 'chat' | 'miniapp' | 'success'>('notification');
    const [miniappProgress, setMiniappProgress] = useState<number>(0);

    const generateMockModules = (): any[] => {
        return [
            { moduleId: 'm1', displayName: 'Dashboard', parentModuleId: null, moduleType: 'MODULE', iconName: 'LayoutDashboard', componentKey: 'dashboard', permission: null, isActive: true, sortOrder: 1 },
            { moduleId: 'm2', displayName: 'People Registry', parentModuleId: null, moduleType: 'MODULE', iconName: 'Users', componentKey: 'people', permission: null, isActive: true, sortOrder: 2 },
            { moduleId: 'm3', displayName: 'AI Audit Portal', parentModuleId: null, moduleType: 'MODULE', iconName: 'BrainCircuit', componentKey: 'audit-collection-box', permission: null, isActive: true, sortOrder: 3 },
            { moduleId: 'm4', displayName: 'Vouching Stats', parentModuleId: null, moduleType: 'MODULE', iconName: 'BarChart3', componentKey: 'vouching-stats', permission: null, isActive: true, sortOrder: 4 },
            { moduleId: 'm5', displayName: 'Bulk Messaging', parentModuleId: null, moduleType: 'MODULE', iconName: 'Send', componentKey: 'bulk-messaging', permission: null, isActive: true, sortOrder: 5 },
            { moduleId: 'm6', displayName: 'Telegram Attendance', parentModuleId: null, moduleType: 'MODULE', iconName: 'CalendarCheck', componentKey: 'telegram-attendance-prototype', permission: null, isActive: true, sortOrder: 6 },
            { moduleId: 'm7', displayName: 'SMR Editor', parentModuleId: null, moduleType: 'MODULE', iconName: 'FileEdit', componentKey: 'smr-editor', permission: null, isActive: true, sortOrder: 7 },
            { moduleId: 'm8', displayName: 'Masters Management', parentModuleId: null, moduleType: 'MODULE', iconName: 'Layers', componentKey: 'masters-management', permission: null, isActive: true, sortOrder: 8 },
            { moduleId: 'm9', displayName: 'Notification Templates', parentModuleId: null, moduleType: 'MODULE', iconName: 'Bell', componentKey: 'notification-templates', permission: null, isActive: true, sortOrder: 9 },
            { moduleId: 'm10', displayName: 'User Management', parentModuleId: null, moduleType: 'MODULE', iconName: 'UserCircle', componentKey: 'users', permission: null, isActive: true, sortOrder: 10 },
            { moduleId: 'm11', displayName: 'Permission Matrix', parentModuleId: null, moduleType: 'MODULE', iconName: 'ShieldCheck', componentKey: 'permission-matrix', permission: null, isActive: true, sortOrder: 11 },
            { moduleId: 'm12', displayName: 'System Settings', parentModuleId: null, moduleType: 'MODULE', iconName: 'Settings', componentKey: 'settings', permission: null, isActive: true, sortOrder: 12 },
            { moduleId: 'm13', displayName: 'My Profile', parentModuleId: null, moduleType: 'MODULE', iconName: 'User', componentKey: 'my-profile', permission: null, isActive: true, sortOrder: 13 }
        ];
    };

    const triggerMiniappFlow = () => {
        setSimStep('miniapp');
        setMiniappProgress(0);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            setMiniappProgress(progress);
            if (progress === 3) {
                clearInterval(interval);
                setTimeout(() => {
                    setSimStep('success');
                    
                    // Complete verification and log user in with a rich master admin session
                    setTimeout(() => {
                        const mockSession: any = {
                            sessionId: "mock-session-id-" + Math.random().toString(36).substring(2, 11),
                            userId: "U999",
                            name: "Volunteer User",
                            roleLabel: "Master Admin",
                            telegramId: "123456789",
                            primaryMobile: mobileNumber,
                            permissions: ["SUPER_ADMIN", "EDIT_ALL", "VIEW_ALL", "BULK_SEND", "AUDIT_RECORDS"],
                            appModules: generateMockModules(),
                            expirationTimestamp: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
                        };
                        loginWithSession(mockSession);
                        toast('Logged in successfully via Telegram Mini App!', 'success');
                    }, 1200);
                }, 800);
            }
        }, 1000);
    };

    useEffect(() => {
        try {
            setIsIframe(window.self !== window.top);
        } catch (e) {
            setIsIframe(true);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('tgLoginToken');
        if (token) {
            setMiniAppToken(token);
            
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds total
            
            const checkTelegram = () => {
                const tg = (window as any).Telegram?.WebApp;
                if (tg) {
                    try {
                        tg.ready();
                        tg.expand();
                        const user = tg.initDataUnsafe?.user;
                        if (user && user.id) {
                            const userInfo = {
                                id: String(user.id),
                                username: user.username,
                                firstName: user.first_name,
                                lastName: user.last_name,
                                photoUrl: user.photo_url
                            };
                            setTgUserInfo(userInfo);
                            
                            // AUTO-VERIFY if running inside real Telegram!
                            autoVerifyMiniApp(token, String(user.id));
                            return true;
                        }
                    } catch (e) {
                        console.error("Failed to parse Telegram WebApp data:", e);
                    }
                }
                return false;
            };

            // Try immediately first
            if (!checkTelegram()) {
                // Otherwise poll periodically
                const interval = setInterval(() => {
                    attempts++;
                    if (checkTelegram() || attempts >= maxAttempts) {
                        clearInterval(interval);
                    }
                }, 100);

                return () => clearInterval(interval);
            }
        }
    }, []);

    const autoVerifyMiniApp = async (token: string, telegramId: string) => {
        if (verificationInitiatedRef.current) return;
        verificationInitiatedRef.current = true;
        setMiniAppVerifying(true);
        try {
            const res = await api.verifyTelegramLoginMiniApp(token, telegramId);
            if (res.success) {
                setMiniAppVerifiedStatus('SUCCESS');
                toast('✓ Authentication successful!', 'success');
                const tg = (window as any).Telegram?.WebApp;
                if (tg) {
                    setTimeout(() => {
                        tg.close();
                    }, 2500);
                }
            } else {
                setMiniAppVerifiedStatus('ERROR');
                setMiniAppErrorMessage('Verification rejected by backend.');
                verificationInitiatedRef.current = false;
            }
        } catch (err: any) {
            setMiniAppVerifiedStatus('ERROR');
            setMiniAppErrorMessage(err?.message || 'Verification failed.');
            toast(err?.message || 'Verification failed.', 'error');
            verificationInitiatedRef.current = false;
        } finally {
            setMiniAppVerifying(false);
        }
    };

    const handleManualMiniAppVerify = async (manualId: string) => {
        if (!manualId.trim()) {
            toast('Please enter a valid Telegram ID.', 'error');
            return;
        }
        setMiniAppVerifying(true);
        try {
            if (!miniAppToken) return;
            const res = await api.verifyTelegramLoginMiniApp(miniAppToken, manualId.trim());
            if (res.success) {
                setMiniAppVerifiedStatus('SUCCESS');
                toast('✓ Session verified successfully!', 'success');
            } else {
                setMiniAppVerifiedStatus('ERROR');
                setMiniAppErrorMessage('Verification rejected by backend.');
            }
        } catch (err: any) {
            setMiniAppVerifiedStatus('ERROR');
            setMiniAppErrorMessage(err?.message || 'Verification failed.');
            toast(err?.message || 'Verification failed.', 'error');
        } finally {
            setMiniAppVerifying(false);
        }
    };

    useEffect(() => {
        if (miniAppToken || loginMethod !== 'google') return;

        const existingScript = document.getElementById('google-jssdk');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'google-jssdk';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onerror = () => {
                console.error("Google Sign-In Script failed to load. It might be blocked by browser extensions or network.");
            };
            document.head.appendChild(script);
        }

        // Periodically check if Google Identity Services is fully loaded
        const interval = setInterval(() => {
            if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
                setIsGoogleLoaded(true);
                clearInterval(interval);
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [loginMethod]);

    const handleGoogleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        try {
            await loginWithGoogle(response.credential);
            toast('Logged in successfully with Google!', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Google authentication failed.';
            toast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Telegram polling effect
    useEffect(() => {
        if (telegramStatus !== 'PENDING' || !telegramToken) return;

        // If prototype token, do not poll the backend!
        // In prototype mode, the user interacts with the Mini App simulator directly.
        if (telegramToken.startsWith('proto_tok_')) {
            return;
        }

        let isMounted = true;
        let isFinished = false;
        let pollInterval: NodeJS.Timeout;
        let consecutiveFailures = 0;

        const pollStatus = async () => {
            if (isFinished || !isMounted) return;
            try {
                const res = await api.checkTelegramLogin(telegramToken);
                if (!isMounted || isFinished) return;
                consecutiveFailures = 0; // Reset counter on successful response

                if (res.status === 'VERIFIED' && res.session) {
                    isFinished = true;
                    clearInterval(pollInterval);
                    setTelegramStatus('VERIFIED');
                    loginWithSession(res.session);
                    toast('Logged in successfully via Telegram!', 'success');
                } else if (res.status === 'MISMATCH') {
                    isFinished = true;
                    clearInterval(pollInterval);
                    setTelegramStatus('IDLE');
                    setTelegramToken('');
                    toast(`Telegram ID Mismatch! Sheet expects Telegram ID: "${res.expectedTelegramId || 'N/A'}", but you clicked from account ID: "${res.attemptedTelegramId || 'N/A'}". Please update your profile in Google Sheets or use the matching Telegram account.`, 'error');
                } else if (res.status === 'EXPIRED') {
                    isFinished = true;
                    clearInterval(pollInterval);
                    setTelegramStatus('EXPIRED');
                    toast('Telegram login session expired. Please try again.', 'error');
                }
            } catch (err: any) {
                consecutiveFailures++;
                if (consecutiveFailures >= 3) {
                    isFinished = true;
                    clearInterval(pollInterval);
                    console.warn("Stopping Telegram login polling after repeated server connection errors.");
                    toast('Could not connect to Telegram verification service. Please try again or use OTP.', 'info');
                }
            }
        };

        pollInterval = setInterval(pollStatus, 2500);
        pollStatus();

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [telegramStatus, telegramToken, loginWithSession]);

    // Telegram countdown timer
    useEffect(() => {
        if (telegramStatus !== 'PENDING' || !telegramExpiry) return;

        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.round((telegramExpiry - Date.now()) / 1000));
            setSecondsLeft(timeLeft);

            if (timeLeft === 0) {
                setTelegramStatus('EXPIRED');
                toast('Telegram login link has expired. Please try again.', 'error');
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [telegramStatus, telegramExpiry]);

    const handleStartTelegramLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!mobileNumber || mobileNumber.length !== 10) {
            toast('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        setIsTelegramLoading(true);
        setIsLoading(true);
        try {
            const res = await api.initiateTelegramLogin(mobileNumber, window.location.origin);
            setTelegramToken(res.token);
            setTgBotUsername(res.botUsername);
            setTelegramExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes validity
            setSecondsLeft(300);
            setTelegramStatus('PENDING');
            setSimStep('notification'); // Reset simulator state
            toast('Verification link generated! Open Telegram.', 'success');
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Telegram login.';
            toast(errorMessage, 'error');
        } finally {
            setIsTelegramLoading(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (miniAppToken || step !== 1 || isIframe || loginMethod !== 'google') return;

        let isMounted = true;
        let timer: any;

        const renderGoogleButton = () => {
            if (!isMounted) return;
            const google = (window as any).google;
            if (google && google.accounts && google.accounts.id && googleBtnRef.current) {
                try {
                    // Clear the container first to prevent duplicate rendering or iframe conflicts
                    googleBtnRef.current.innerHTML = '';

                    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '1058252274474-mockclientid.apps.googleusercontent.com').trim();
                    
                    // Initialize once per page lifetime
                    if (!gsiInitialized && !(window as any).gsi_initialized) {
                        google.accounts.id.initialize({
                            client_id: clientId,
                            callback: handleGoogleCredentialResponse,
                            ux_mode: 'popup',
                            cancel_on_tap_outside: true
                        });
                        gsiInitialized = true;
                        (window as any).gsi_initialized = true;
                    }

                    // Render button inside the container
                    google.accounts.id.renderButton(
                        googleBtnRef.current,
                        { 
                            theme: 'outline', 
                            size: 'large', 
                            width: 340,
                            text: 'signin_with',
                            shape: 'rectangular'
                        }
                    );
                    
                    // Successfully rendered, hide troubleshoot warning immediately
                    setShowGsiTroubleshoot(false);
                } catch (err) {
                    console.error("Failed to render Google Sign-In Button:", err);
                    setShowGsiTroubleshoot(true);
                }
            } else {
                // If Google is not fully ready, schedule retry
                timer = setTimeout(renderGoogleButton, 100);
            }
        };

        if (isGoogleLoaded || ((window as any).google && (window as any).google.accounts)) {
            // A small delay ensures container is fully active in DOM
            timer = setTimeout(renderGoogleButton, 100);
        }

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [step, isGoogleLoaded, isIframe, loginMethod]);

    useEffect(() => {
        if (miniAppToken || step !== 1 || loginMethod !== 'google') {
            setShowGsiTroubleshoot(false);
            return;
        }
        if (isIframe) {
            setShowGsiTroubleshoot(true);
            return;
        }
        
        // Show troubleshooting panel only if no button element has rendered within 3.5 seconds
        const timer = setTimeout(() => {
            const hasRenderedButton = googleBtnRef.current && googleBtnRef.current.children.length > 0;
            if (!hasRenderedButton) {
                setShowGsiTroubleshoot(true);
            }
        }, 3500);

        return () => clearTimeout(timer);
    }, [step, isGoogleLoaded, isIframe, loginMethod]);
    
    // Auto-proceed tracking refs
    const lastSubmittedMobile = React.useRef('');
    const lastSubmittedOtp = React.useRef('');
    
    // Rate Limiting State
    const [cooldown, setCooldown] = useState(0);

    // State for dynamic branding and configuration
    const [branding, setBranding] = useState<{
        name: string;
        tagline: string;
        icon: React.ReactElement<any>;
        iconUrl: string;
        clientCooldown: number; // For successful requests
        lockoutMinutes: number; // For "Too many requests" error
    }>({
        name: 'Audit Portal',
        tagline: '',
        icon: <Shield />,
        iconUrl: './logo192.png',
        clientCooldown: 60, // Default fallback
        lockoutMinutes: 10 // Default fallback
    });

    useEffect(() => {
        const fetchBranding = async () => {
            setIsBrandingLoading(true);
            try {
                const data = await api.getPublicBranding();
                // @ts-ignore - Types might not be updated immediately
                const clientCooldownVal = parseInt(data.securityClientCooldownSeconds || '60', 10);
                // @ts-ignore
                const lockoutMinutesVal = parseInt(data.securityLockoutMinutes || '10', 10);
                
                const iconComponent = ICONS[data.appIcon] || <Shield />;
                setBranding({
                    name: data.appName,
                    tagline: data.appTagline,
                    icon: iconComponent,
                    iconUrl: data.appIconUrl || './logo192.png',
                    clientCooldown: isNaN(clientCooldownVal) ? 60 : clientCooldownVal,
                    lockoutMinutes: isNaN(lockoutMinutesVal) ? 10 : lockoutMinutesVal
                });

                const primaryColor = data.primaryColor || '#3b82f6';
                applyTheme(primaryColor);
                localStorage.setItem('primaryColor', primaryColor);

            } catch (error: any) {
                const errMsg = error?.message || String(error);
                console.error("Failed to fetch public branding:", errMsg.length > 200 ? errMsg.substring(0, 200) + '...' : errMsg);
                setBranding({
                    name: 'Audit Portal',
                    tagline: 'Audit & Compliance Management System',
                    icon: <Shield />,
                    iconUrl: './logo192.png',
                    clientCooldown: 60,
                    lockoutMinutes: 10
                });
                applyTheme('#3b82f6');
            } finally {
                setIsBrandingLoading(false);
            }
        };
        fetchBranding();
        
        // Check for existing cooldown on mount
        checkCooldown();
    }, []);

    // Timer Logic - Updated to use absolute time to handle browser throttling/background tabs
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (cooldown > 0) {
            timer = setInterval(() => {
                const storedEndTime = localStorage.getItem('otpCooldownUntil');
                if (storedEndTime) {
                    const end = parseInt(storedEndTime, 10);
                    const now = Date.now();
                    const remaining = Math.ceil((end - now) / 1000);

                    if (remaining <= 0) {
                        setCooldown(0);
                        localStorage.removeItem('otpCooldownUntil');
                    } else {
                        setCooldown(remaining);
                    }
                } else {
                    // Fallback if storage is cleared manually
                    setCooldown(0);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const checkCooldown = () => {
        const storedEndTime = localStorage.getItem('otpCooldownUntil');
        if (storedEndTime) {
            const remaining = Math.ceil((parseInt(storedEndTime) - Date.now()) / 1000);
            if (remaining > 0) {
                setCooldown(remaining);
            } else {
                localStorage.removeItem('otpCooldownUntil');
            }
        }
    };

    const startCooldown = (seconds: number) => {
        if (seconds <= 0) {
            localStorage.removeItem('otpCooldownUntil');
            setCooldown(0);
            return;
        }
        const endTime = Date.now() + (seconds * 1000);
        localStorage.setItem('otpCooldownUntil', endTime.toString());
        setCooldown(seconds);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    const handleRequestOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Prevent double submission if already loading or this number was just processed automatically (without explicit user click/form submit)
        if (isLoading || (mobileNumber.length === 10 && mobileNumber === lastSubmittedMobile.current && step === 1 && !e)) {
            return;
        }

        if (mobileNumber.length !== 10) {
            if (e) toast('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        // Set ref immediately to block near-simultaneous calls (like Enter key + Auto-proceed)
        lastSubmittedMobile.current = mobileNumber;
        setIsOtpLoading(true);
        setIsLoading(true);
        try {
            const resp = await requestOtp(mobileNumber);
            if (resp && resp.success) {
                setStep(2);
                toast(resp.message || 'Verification code sent successfully.', 'success');
                // Use the configurable cooldown from backend settings
                startCooldown(branding.clientCooldown); 
            } else {
                toast('Failed to send verification code. Please check your mobile number.', 'error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast(errorMessage, 'error');
            
            // Critical: If server says "Too many requests", lock the UI for the configured lockout duration
            if (errorMessage.includes("Too many OTP requests")) {
                 startCooldown(branding.lockoutMinutes * 60); 
            }
        } finally {
            setIsOtpLoading(false);
            setIsLoading(false);
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Prevent double submission
        if (isLoading || (otp.length === 6 && otp === lastSubmittedOtp.current && step === 2)) {
            return;
        }

        if (otp.length !== 6) {
            if (e) toast('Please enter the 6-digit OTP.', 'error');
            return;
        }

        lastSubmittedOtp.current = otp;
        setIsOtpLoading(true);
        setIsLoading(true);
        try {
            await login(mobileNumber, otp);
            toast('Login successful!', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast(errorMessage, 'error');
            
            if (errorMessage.includes('Maximum attempts reached') || errorMessage.includes('expired')) {
                setTimeout(() => {
                    handleReturnToStep1();
                }, 2500);
            }
        } finally {
            setIsOtpLoading(false);
            setIsLoading(false);
        }
    };

    // Auto-proceed Logic
    useEffect(() => {
        // Reset ref if length changes to something else to allow re-entry of the same number later
        if (mobileNumber.length !== 10) {
            lastSubmittedMobile.current = '';
        }
    }, [mobileNumber]);

    useEffect(() => {
        if (step === 2 && otp.length === 6 && !isLoading && otp !== lastSubmittedOtp.current) {
            handleLogin();
        }
        // Reset ref if length changes
        if (otp.length !== 6) {
            lastSubmittedOtp.current = '';
        }
    }, [otp, step, isLoading]);

    const handleReturnToStep1 = () => {
        setStep(1);
        // Do not clear mobile number so they can easily retry
        setOtp('');
    };

    // =========================================================================
    // WEBAUTHN / BIOMETRIC PASSKEY LOGIN HANDLER
    // =========================================================================
    useEffect(() => {
        isBiometricsAvailable().then(supported => {
            setIsHardwareSupported(supported);
        });
        const enrolled = getLocalPasskeyUser();
        if (enrolled) {
            setLocalPasskeyUser(enrolled);
            const cleanEnrolled = String(enrolled.mobileNumber || '').replace(/[^0-9]/g, '').slice(-10);
            if (cleanEnrolled.length === 10 && !mobileNumber) {
                setMobileNumber(cleanEnrolled);
            }
        }
    }, []);

    const handleBiometricLogin = async (overrideMobile?: string) => {
        const rawTarget = overrideMobile || (mobileNumber.length === 10 ? mobileNumber : '') || localPasskeyUser?.mobileNumber || '';
        const targetMobile = String(rawTarget || '').replace(/[^0-9]/g, '').slice(-10);

        if (isLoading || isOtpLoading || isTelegramLoading || isBiometricLoading) return;

        if (!isWebAuthnPermitted()) {
            toast('Biometrics are restricted in embedded preview frames by browser security policy. Please open the app directly in a full browser tab.', 'info');
            return;
        }

        setIsBiometricLoading(true);
        setIsLoading(true);
        try {
            // 1. Request authentication challenge from backend
            const options = await api.getPasskeyAuthOptions(targetMobile);

            if (!window.PublicKeyCredential) {
                throw new Error('WebAuthn / Passkeys are not supported on this device/browser.');
            }

            // 2. Prepare PublicKeyCredentialRequestOptions
            // If targetMobile has registered credentials, restrict to them.
            // If allowCredentials is empty or undefined, pass undefined to let the platform authenticator look for any resident passkey on this device.
            const allowedCreds: PublicKeyCredentialDescriptor[] | undefined = (options.allowCredentials && options.allowCredentials.length > 0)
                ? options.allowCredentials.map((c: any) => ({
                    id: base64urlToBuffer(c.id),
                    type: 'public-key' as const
                }))
                : undefined;

            const requestOptions: PublicKeyCredentialRequestOptions = {
                challenge: base64urlToBuffer(options.challenge),
                timeout: options.timeout || 60000,
                rpId: options.rpId || window.location.hostname,
                allowCredentials: allowedCreds,
                userVerification: 'preferred'
            };

            // 3. Prompt user for Biometrics
            const assertion = await navigator.credentials.get({
                publicKey: requestOptions
            }) as PublicKeyCredential | null;

            if (!assertion) {
                throw new Error('Biometric authentication cancelled or timed out.');
            }

            const rawIdBuffer = assertion.rawId;
            const credentialId = bufferToBase64url(rawIdBuffer);
            const response = assertion.response as AuthenticatorAssertionResponse;
            const clientDataJSON = bufferToBase64url(response.clientDataJSON);
            const authenticatorData = bufferToBase64url(response.authenticatorData);
            const signature = bufferToBase64url(response.signature);

            // 4. Verify assertion on backend and issue Session
            const session = await api.verifyPasskeyAuth({
                credentialId,
                clientDataJSON,
                authenticatorData,
                signature,
                challenge: options.challenge,
                mobileNumber: targetMobile
            });

            // Automatically re-save local hint so 1-tap quick sign-in is immediately restored
            if (session) {
                const cleanPhone = String(session.primaryMobile || targetMobile || '').replace(/[^0-9]/g, '').slice(-10);
                setLocalPasskeyUser({
                    userId: session.userId,
                    name: session.name,
                    mobileNumber: cleanPhone,
                    enrolledAt: new Date().toISOString()
                });
            }

            toast('✓ Biometric authentication successful!', 'success');
            loginWithSession(session);
        } catch (error: any) {
            const msg = error?.message || 'Biometric authentication failed.';
            if (msg.includes('publickey-credentials') || msg.includes('Permissions Policy') || msg.includes('cross-origin child frames')) {
                console.warn('[Login] Biometrics not allowed in embedded iframe:', msg);
                toast('Biometrics are restricted in this preview frame. Please open the app in a standalone tab or use Telegram/OTP.', 'info');
            } else if (msg.includes('NotAllowedError') || msg.includes('cancelled') || error?.name === 'NotAllowedError') {
                if (!targetMobile && !localPasskeyUser) {
                    toast('No biometric passkey found on this device. Please enter your mobile number or sign in with Telegram / OTP.', 'info');
                } else {
                    toast('Biometric prompt was cancelled.', 'info');
                }
            } else if (msg.includes('Unrecognized passkey credential') || msg.includes('not found') || msg.includes('not registered')) {
                toast(
                    targetMobile 
                        ? `No biometric passkey is registered for +91 ${targetMobile} yet. Please log in with Telegram or OTP first, then register this device in My Profile ➔ Biometrics.`
                        : 'No biometric passkey registered on this device yet. Please enter your mobile number and log in with Telegram or OTP first, then register this device in My Profile ➔ Biometrics.',
                    'error'
                );
            } else {
                console.error('[Login] Biometric login failed:', error);
                toast(msg, 'error');
            }
        } finally {
            setIsBiometricLoading(false);
            setIsLoading(false);
        }
    };
    
    if (miniAppToken) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white font-sans">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-white mt-3">
                            {branding.name} Verification
                        </h2>
                        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
                            Secure Handshake Protocol
                        </p>
                    </div>

                    {/* Body */}
                    {miniAppVerifiedStatus === 'PENDING' && (
                        <div className="space-y-6">
                            {tgUserInfo ? (
                                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800 flex items-center gap-3">
                                    {tgUserInfo.photoUrl ? (
                                        <img 
                                            src={tgUserInfo.photoUrl} 
                                            alt={tgUserInfo.firstName} 
                                            className="w-12 h-12 rounded-full border border-blue-500/30"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                                            {((tgUserInfo.firstName || '')[0] || 'U').toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">
                                            {tgUserInfo.firstName} {tgUserInfo.lastName}
                                        </h3>
                                        <p className="text-xs text-zinc-400 truncate">
                                            @{tgUserInfo.username || 'telegram_user'} (ID: {tgUserInfo.id})
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                        Active Bot Chat
                                    </span>
                                </div>
                            ) : (
                                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800 text-center space-y-4">
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        We couldn't automatically resolve your Telegram session details. Please enter your Telegram User ID manually below to authorize sign-in:
                                    </p>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            id="manual-tg-id"
                                            type="text"
                                            placeholder="Enter Telegram User ID (e.g. 12345678)"
                                            defaultValue={tgUserInfo?.id || ''}
                                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = (document.getElementById('manual-tg-id') as HTMLInputElement)?.value;
                                                handleManualMiniAppVerify(val || '');
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 duration-150"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Verification Button for resolved info */}
                            {tgUserInfo && (
                                <button
                                    type="button"
                                    onClick={() => autoVerifyMiniApp(miniAppToken, tgUserInfo.id)}
                                    disabled={miniAppVerifying}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/10 transition-all scale-100 hover:scale-[1.01] active:scale-95 duration-200 text-sm disabled:opacity-50"
                                >
                                    {miniAppVerifying ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Verifying Credentials...
                                        </span>
                                    ) : (
                                        <>
                                            <Fingerprint className="w-4 h-4" />
                                            Confirm Login Request
                                        </>
                                    )}
                                </button>
                            )}

                            <div className="text-center space-y-1">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                    Token Verification ID
                                </span>
                                <code className="text-xs bg-zinc-950 px-2.5 py-1 rounded-md text-blue-400 font-mono border border-zinc-800">
                                    {miniAppToken}
                                </code>
                            </div>
                        </div>
                    )}

                    {miniAppVerifiedStatus === 'SUCCESS' && (
                        <div className="space-y-5 text-center py-4 animate-in fade-in duration-300">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                                <CheckCircle2 className="w-6 h-6 animate-bounce" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-md font-bold text-white">✓ Authentication Successful</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-medium">
                                    Your computer session has been logged in successfully.
                                </p>
                            </div>
                            <p className="text-[10px] text-zinc-500 animate-pulse font-bold">
                                This window will close automatically
                            </p>
                        </div>
                    )}

                    {miniAppVerifiedStatus === 'ERROR' && (
                        <div className="space-y-5 text-center py-4 animate-in fade-in duration-300">
                            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-md font-bold text-white">Verification Failed</h3>
                                <p className="text-xs text-red-400 leading-relaxed max-w-xs mx-auto font-medium">
                                    {miniAppErrorMessage}
                                </p>
                            </div>
                            
                            <div className="pt-2 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMiniAppVerifiedStatus('PENDING');
                                        setMiniAppErrorMessage('');
                                    }}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 duration-150"
                                >
                                    Try Again / Manual Input
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        const tg = (window as any).Telegram?.WebApp;
                                        if (tg) tg.close();
                                    }}
                                    className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center p-2 sm:p-4 bg-[var(--background)] py-2 sm:py-6 overflow-y-auto sm:overflow-y-visible">
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center">
                {/* --- Branding Column --- */}
                <div className="w-full sm:w-1/2 lg:w-2/5 p-3 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center">
                    <div className="mx-auto bg-[var(--primary-color)] rounded-full p-2 sm:p-3 w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mb-2 sm:mb-4 ring-2 sm:ring-4 ring-[var(--card-background)] shadow-lg transition-colors duration-500 overflow-hidden">
                        {isBrandingLoading ? (
                            <SkeletonLoader className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                        ) : branding.iconUrl && !logoError ? (
                            <img 
                                src={branding.iconUrl} 
                                alt="App Logo" 
                                className="h-full w-full object-contain"
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            React.cloneElement(branding.icon, { className: "h-10 w-10 sm:h-14 sm:w-14 text-[var(--primary-foreground)]" })
                        )}
                    </div>
                    <h1 className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                        {isBrandingLoading ? (
                            <SkeletonLoader className="h-6 w-36 sm:h-8 sm:w-48 mx-auto" />
                        ) : step === 1 ? (
                            <span>
                                {branding.name}
                                <br />
                                <span className="text-sm sm:text-xl font-medium text-[var(--foreground-muted)]">{branding.tagline}</span>
                            </span>
                        ) : 'Enter OTP'}
                    </h1>
                    <div className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1 sm:mt-2 max-w-sm hidden xs:block sm:block">
                        {isBrandingLoading ? (
                            <SkeletonLoader className="h-4 w-48 sm:w-64 mx-auto mt-2 sm:mt-4" />
                        ) : step === 1 
                            ? 'To Login, enter your mobile number or use your registered biometrics.'
                            : `Enter the 6-digit code received via Telegram or Email, or generated by your Authenticator app for ${mobileNumber}`
                        }
                    </div>
                </div>

                {/* --- Form Column --- */}
                <div className="w-full sm:w-1/2 lg:w-3/5 mt-3 sm:mt-0">
                    {isBrandingLoading ? (
                        <WorkstationSkeleton type="form" />
                    ) : (
                        <Card className="shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-500 p-4 sm:p-6">
                            {step === 1 && (
                                <div className="space-y-4 sm:space-y-6">
                                    {/* 1-Tap Quick Passkey Login Card (if previously enrolled on this device) */}
                                    {localPasskeyUser && (
                                        <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/25 rounded-xl space-y-2.5 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                    <Fingerprint className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                                                        Sign in as {localPasskeyUser.name}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                                                        {localPasskeyUser.mobileNumber ? `+91 ${localPasskeyUser.mobileNumber}` : 'Enrolled Account'} • Biometrics Enrolled
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => handleBiometricLogin(localPasskeyUser.mobileNumber)}
                                                isLoading={isBiometricLoading}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs px-3 h-8 shadow-sm flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Fingerprint className="w-3.5 h-3.5" />
                                                1-Tap Login
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between px-1 text-[11px] text-[var(--foreground-muted)]">
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                                Enrolled on this device
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearLocalPasskeyUser();
                                                    setLocalPasskeyUser(null);
                                                    setMobileNumber('');
                                                    toast('Device memory cleared. You can now type any mobile number.', 'info');
                                                }}
                                                className="text-[var(--primary)] hover:underline font-medium cursor-pointer"
                                            >
                                                Switch account / Clear
                                            </button>
                                        </div>
                                    </div>
                                )}

                                    {/* Segmented Controller / Method Selector */}
                                    <div className="flex p-1 bg-[var(--foreground-muted)]/5 rounded-xl border border-[var(--foreground-muted)]/10">
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('otp')}
                                            className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-white text-[var(--primary)] shadow-sm dark:bg-[var(--card-background)] dark:text-white' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                                        >
                                            Mobile / Biometric
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('google')}
                                            className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'google' ? 'bg-white text-[var(--primary)] shadow-sm dark:bg-[var(--card-background)] dark:text-white' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                                        >
                                            Google Account
                                        </button>
                                    </div>

                                    {/* Mobile Login View */}
                                    {loginMethod === 'otp' && telegramStatus === 'IDLE' && (
                                        <form className="space-y-4 sm:space-y-6" onSubmit={handleStartTelegramLogin}>
                                            <SplitInput
                                                length={10}
                                                value={mobileNumber}
                                                onChange={setMobileNumber}
                                                onClear={() => {
                                                    setMobileNumber('');
                                                    if (localPasskeyUser) {
                                                        clearLocalPasskeyUser();
                                                        setLocalPasskeyUser(null);
                                                        toast('Device memory cleared. You can now enter any mobile number.', 'info');
                                                    }
                                                }}
                                                label="Mobile Number"
                                                variant="unified"
                                                autoFocus={true}
                                            />
                                            {localPasskeyUser && mobileNumber.length === 10 && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                                                    <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Pre-filled from enrolled device for <strong>{localPasskeyUser.name}</strong>. Tap "Clear / Change" above to use another number.</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col sm:flex-row gap-2.5">
                                                <Button 
                                                    type="submit" 
                                                    className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm text-xs sm:text-sm py-2.5" 
                                                    isLoading={isTelegramLoading} 
                                                    disabled={isLoading || isOtpLoading || isTelegramLoading || isBiometricLoading || mobileNumber.length !== 10}
                                                >
                                                    <svg className="w-4 h-4 mr-1.5 fill-current shrink-0" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                                                    </svg>
                                                    Telegram Login
                                                </Button>

                                                <Button 
                                                    type="button" 
                                                    onClick={() => handleRequestOtp()}
                                                    className="flex-1 font-semibold rounded-lg shadow-sm text-xs sm:text-sm py-2.5" 
                                                    isLoading={isOtpLoading} 
                                                    disabled={isLoading || isOtpLoading || isTelegramLoading || isBiometricLoading || cooldown > 0 || mobileNumber.length !== 10}
                                                >
                                                    {cooldown > 0 ? (
                                                        <span className="flex items-center justify-center">
                                                            <Clock className="w-3.5 h-3.5 mr-1" /> 
                                                            Wait {formatTime(cooldown)}
                                                        </span>
                                                    ) : 'Telegram/Email OTP'}
                                                </Button>

                                                {isHardwareSupported && (
                                                    <Button 
                                                        type="button" 
                                                        onClick={() => handleBiometricLogin()}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm text-xs sm:text-sm py-2.5 px-3 flex items-center justify-center cursor-pointer" 
                                                        isLoading={isBiometricLoading} 
                                                        disabled={isLoading || isOtpLoading || isTelegramLoading || isBiometricLoading}
                                                        title="Login with Device Biometrics (Face ID / Fingerprint)"
                                                    >
                                                        <Fingerprint className="w-4 h-4 mr-1 shrink-0" />
                                                        Biometric
                                                    </Button>
                                                )}
                                            </div>
                                            {cooldown > 0 && (
                                                <p className="text-xs text-center text-[var(--foreground-muted)]">
                                                    Please wait before requesting another OTP.
                                                </p>
                                            )}
                                        </form>
                                    )}

                                    {/* Telegram Pending/Expired View */}
                                    {loginMethod === 'otp' && (telegramStatus === 'PENDING' || telegramStatus === 'EXPIRED') && (
                                        <div className="p-4 sm:p-6 bg-gradient-to-tr from-zinc-50/50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-300 max-w-2xl mx-auto">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                {/* Left Column: Real-World Telegram Webhook Verification */}
                                                <div className="space-y-5 flex flex-col justify-between h-full py-2">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-blue-500">
                                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                                <Shield className="w-5 h-5" />
                                                            </div>
                                                            <h3 className="font-bold text-sm tracking-tight text-[var(--foreground)]">Official Mini App Verification</h3>
                                                        </div>
                                                        
                                                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                                                            We've initiated a Telegram secure authentication request. We sent a private verification message directly to your Telegram chat.
                                                        </p>

                                                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                                                            Please open your Telegram app, locate the chat with <strong>@{tgBotUsername}</strong>, and tap the <strong>Confirm Login</strong> button to sign in.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <a 
                                                            href={`https://t.me/${tgBotUsername}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-xs text-center"
                                                        >
                                                            Open Telegram Bot
                                                            <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                                        </a>
                                                        
                                                        <div className="flex items-center justify-center text-xs text-[var(--foreground-muted)] space-x-1.5 font-medium">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Expires in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong></span>
                                                        </div>

                                                        <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 flex flex-col space-y-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTelegramStatus('IDLE');
                                                                    setTelegramToken('');
                                                                }}
                                                                className="text-xs text-red-500 hover:text-red-600 font-bold transition-colors pt-1.5"
                                                            >
                                                                Cancel & Try Different Number
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Sleek Static Mobile Process Mockup */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-full text-center mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                            <Smartphone className="w-3.5 h-3.5" />
                                                            How It Works (Process Flow)
                                                        </span>
                                                    </div>

                                                    {/* Smartphone Frame */}
                                                    <div className="relative w-[240px] h-[440px] bg-zinc-950 rounded-[36px] shadow-2xl border-[6px] border-zinc-850 overflow-hidden flex flex-col select-none ring-4 ring-black/5 animate-in fade-in duration-500">
                                                        {/* Camera Notch */}
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[16px] w-[80px] bg-zinc-900 rounded-b-xl z-50 flex items-center justify-center gap-1 px-2">
                                                            <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-950"></div>
                                                            <div className="w-6 h-0.5 bg-zinc-950 rounded"></div>
                                                        </div>

                                                        {/* Phone Status Bar */}
                                                        <div className="h-[28px] bg-transparent text-white/95 text-[8px] font-medium px-4 pt-1 flex justify-between items-center z-40 shrink-0">
                                                            <span>09:41</span>
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24"><path d="M12 21l-12-12c4.14-4.14 10.86-4.14 15 0l-3 3c-2.48-2.48-6.52-2.48-9 0l9 9 9-9-3-3c2.48 2.48 2.48 6.52 0 9l-3 3z"/></svg>
                                                                <div className="w-3.5 h-2 border border-white/60 rounded-sm px-0.5 flex items-center"><div className="w-2 h-1 bg-white rounded-2xs"></div></div>
                                                            </div>
                                                        </div>

                                                        {/* Static Phone Screen Content */}
                                                        <div className="flex-1 relative flex flex-col bg-zinc-900 text-left p-3 text-white overflow-hidden">
                                                            {/* Chat Header */}
                                                            <div className="h-9 bg-zinc-850 rounded-xl px-2.5 flex items-center gap-2 shrink-0 mb-3 border border-zinc-800">
                                                                <div className="w-5.5 h-5.5 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[9px] shadow-sm">
                                                                    BK
                                                                </div>
                                                                <div>
                                                                    <div className="text-[9px] font-bold flex items-center gap-0.5">
                                                                        BK Audit Bot
                                                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center text-[6px] text-white font-extrabold shrink-0">✓</span>
                                                                    </div>
                                                                    <span className="text-[7px] text-zinc-400 block -mt-1">bot</span>
                                                                </div>
                                                            </div>

                                                            {/* Mock Conversation View */}
                                                            <div className="space-y-4 flex-1">
                                                                {/* Mock Message Bubble */}
                                                                <div className="max-w-[95%] bg-zinc-850 border border-zinc-800 rounded-2xl rounded-tl-none p-2.5 shadow-md space-y-2.5 text-[9px] text-zinc-200">
                                                                    <p className="leading-relaxed">
                                                                        🤖 <strong>Secure Login Service</strong>
                                                                        <br /><br />
                                                                        We received a secure login request for your profile:
                                                                        <br />
                                                                        <span className="font-bold text-blue-400">+91 {mobileNumber}</span>
                                                                        <br /><br />
                                                                        Click the button below to authorize instantly using your safe Telegram credentials:
                                                                    </p>
                                                                    
                                                                    <div className="py-2 px-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-blue-400 font-bold flex items-center justify-center gap-1.5">
                                                                        <Fingerprint className="w-3.5 h-3.5" />
                                                                        Open Mini App Login
                                                                    </div>
                                                                </div>

                                                                {/* Helpful Step Badges */}
                                                                <div className="pt-2 space-y-2">
                                                                    <div className="flex items-center gap-2 text-[8px] bg-zinc-800/40 p-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                                                                        <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">1</span>
                                                                        <span>Check your Telegram chat for a login message</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[8px] bg-zinc-800/40 p-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                                                                        <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">2</span>
                                                                        <span>Tap the 'Confirm Login' button</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[8px] bg-zinc-800/40 p-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                                                                        <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">3</span>
                                                                        <span>Your browser logs in instantly!</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Phone Home Bar */}
                                                        <div className="h-[12px] bg-transparent pb-0.5 flex justify-center items-center z-40 shrink-0">
                                                            <div className="w-20 h-0.5 bg-white/20 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Google Sign-In View */}
                                    {loginMethod === 'google' && (
                                        <div className="space-y-6">
                                            {!isIframe ? (
                                                <div className="flex flex-col items-center">
                                                    <div id="googleSignInBtn" ref={googleBtnRef} className="w-full min-h-[44px] flex justify-center"></div>
                                                    <p className="text-[11px] text-center text-[var(--foreground-muted)] mt-3 max-w-xs leading-relaxed">
                                                        Sign in with your registered Google email address. Supports biometric Passkeys and biometrics on compatible devices.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-xs space-y-3 max-w-sm mx-auto animate-in fade-in duration-300">
                                                    <div className="flex items-start space-x-2">
                                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Preview Sandbox Restricts Popups</p>
                                                            <p className="leading-relaxed">
                                                                Google's security guidelines do not allow sign-in popups inside nested iframe previews. Please open the app in a new tab to sign in.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a 
                                                        href={window.location.href} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-all text-xs text-center"
                                                    >
                                                        Open App in New Tab
                                                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                                                    </a>
                                                </div>
                                            )}

                                            {showGsiTroubleshoot && !isIframe && (
                                                <div className="bg-[var(--foreground-muted)]/5 border border-[var(--foreground-muted)]/10 rounded-xl p-3.5 text-xs text-[var(--foreground-muted)] space-y-2 animate-in fade-in duration-300 max-w-sm mx-auto">
                                                    <p className="font-semibold text-center text-[var(--foreground)] text-sm">Google Sign-In Button Missing?</p>
                                                    <ul className="list-disc pl-4 space-y-1.5 text-left leading-relaxed">
                                                        <li><strong>Authorized JavaScript Origins:</strong> For the Google GSI SDK Popup, your app domain must be added under <em>"Authorized JavaScript origins"</em> in Google Cloud Console, <strong>NOT</strong> just "Authorized redirect URIs".</li>
                                                        <li>Add this origin: <code className="bg-[var(--foreground-muted)]/10 px-1.5 py-0.5 rounded select-all break-all font-mono font-medium">{window.location.origin}</code></li>
                                                        <li>Also, ensure your browser or ad-blocker is not blocking third-party scripts (e.g., Brave Shields, uBlock Origin, Privacy Badger).</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {step === 2 && (
                                <form className="space-y-6" onSubmit={handleLogin}>
                                    <SplitInput
                                        length={6}
                                        value={otp}
                                        onChange={setOtp}
                                        label="One-Time Password (OTP)"
                                        colorize={true}
                                        variant="split"
                                        autoFocus={true}
                                    />
                                    <div className="flex flex-col space-y-3">
                                        <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                                            Sign In
                                        </Button>

                                        <Button type="button" variant="secondary" onClick={handleReturnToStep1} disabled={isLoading} className="w-full">
                                            Use a different number
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
