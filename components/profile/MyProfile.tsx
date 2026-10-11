import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { DynamicFormEngine } from '../common/DynamicFormEngine';
import { AlertTriangle, User, SlidersHorizontal, KeyRound, Copy, ShieldCheck, ShieldAlert, Fingerprint, Trash2, Smartphone, CheckCircle, Info, Loader } from 'lucide-react';
import MobileNavCustomizer from './MobileNavCustomizer';
import { SuperMasterRecord, WebAuthnCredential } from '../../types';
import * as api from '../../services/apiService';
import { base64urlToBuffer, bufferToBase64url, isBiometricsAvailable, isWebAuthnPermitted, isEmbeddedFrame, setLocalPasskeyUser, clearLocalPasskeyUser, getLocalPasskeyUser } from '../../utils/webauthn';

type Tab = 'profile' | 'navigation' | 'twofactor' | 'security' | 'biometrics';

const MyProfile: React.FC = () => {
    const { user, updateSession, hasPermission } = useAuth();
    const { updateMyProfile } = useUsers();
    
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Inactivity Timeout State
    const [inactivityTimeout, setInactivityTimeout] = useState<string>(() => {
        return localStorage.getItem('inactivityTimeout') || '15';
    });

    const handleInactivityTimeoutChange = async (value: string) => {
        setInactivityTimeout(value);
        localStorage.setItem('inactivityTimeout', value);
        window.dispatchEvent(new CustomEvent('inactivity-timeout-changed', { detail: value }));
        
        if (user?.sessionId) {
            try {
                const res = await api.saveUserViewPreference(user.sessionId, 'security', { inactivityTimeout: parseFloat(value) });
                if (res.success && res.viewPreferences) {
                    updateSession({ viewPreferences: res.viewPreferences });
                }
            } catch (error) {
                console.error("[MyProfile] Failed to save inactivity preference to server:", error);
            }
        }

        const labels: Record<string, string> = {
            '0.5': '30 seconds',
            '5': '5 minutes',
            '15': '15 minutes',
            '30': '30 minutes',
            '60': '1 hour',
            '120': '2 hours',
            '240': '4 hours',
            '480': '8 hours',
            '1440': '1 day'
        };
        const label = labels[value] || `${value} minutes`;
        toast(`Inactivity timeout updated to ${label}.`, 'success');
    };

    // Sync inactivity timeout from backend viewPreferences if available
    useEffect(() => {
        if (user?.viewPreferences) {
            try {
                const prefs = JSON.parse(user.viewPreferences);
                if (prefs.security && prefs.security.inactivityTimeout) {
                    setInactivityTimeout(String(prefs.security.inactivityTimeout));
                }
            } catch (e) {
                console.error("[MyProfile] Failed to parse viewPreferences for inactivity timeout", e);
            }
        }
    }, [user?.viewPreferences]);

    // TOTP 2FA State
    const [totpEnabledState, setTotpEnabledState] = useState<boolean>(!!user?.totpEnabled);
    const [setupSecret, setSetupSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [isGeneratingSecret, setIsGeneratingSecret] = useState<boolean>(false);
    const [isVerifyingTotp, setIsVerifyingTotp] = useState<boolean>(false);
    const [isDisablingTotp, setIsDisablingTotp] = useState<boolean>(false);
    const [hasCopied, setHasCopied] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setTotpEnabledState(!!user.totpEnabled);
        }
    }, [user]);

    const handleStartSetup = async () => {
        if (!user) return;
        setIsGeneratingSecret(true);
        try {
            const resp = await api.generateTotpSecret(user.sessionId);
            setSetupSecret(resp.secret);
            setVerificationCode('');
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to generate 2FA secret', 'error');
        } finally {
            setIsGeneratingSecret(false);
        }
    };

    const handleEnableTotp = async () => {
        if (!user || !setupSecret) return;
        if (verificationCode.trim().length !== 6) {
            toast('Please enter a 6-digit confirmation code.', 'error');
            return;
        }
        setIsVerifyingTotp(true);
        try {
            await api.enableTotp(user.sessionId, setupSecret, verificationCode.trim());
            updateSession({ totpEnabled: true });
            setTotpEnabledState(true);
            setSetupSecret('');
            setVerificationCode('');
            toast('Two-Factor Authentication enabled successfully!', 'success');
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Verification failed.', 'error');
        } finally {
            setIsVerifyingTotp(false);
        }
    };

    const handleDisableTotp = async () => {
        if (!user) return;
        const code = prompt('Please enter your current 6-digit code from your Authenticator app to confirm disabling 2FA:');
        if (code === null) return;
        if (code.trim().length !== 6) {
            toast('Invalid code format. 2FA was NOT disabled.', 'error');
            return;
        }

        setIsDisablingTotp(true);
        try {
            await api.disableTotp(user.sessionId, code.trim());
            updateSession({ totpEnabled: false });
            setTotpEnabledState(false);
            toast('Two-Factor Authentication disabled.', 'success');
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to disable 2FA.', 'error');
        } finally {
            setIsDisablingTotp(false);
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(setupSecret);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
        toast('Secret copied to clipboard!', 'success');
    };

    const otpauthUrl = setupSecret 
        ? `otpauth://totp/AuditPortal:${user?.primaryMobile || 'User'}?secret=${setupSecret}&issuer=AuditPortal`
        : '';

    const qrCodeUrl = setupSecret
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`
        : '';

    // =========================================================================
    // WEBAUTHN / BIOMETRICS PASSKEYS STATE & LOGIC
    // =========================================================================
    const [passkeys, setPasskeys] = useState<WebAuthnCredential[]>([]);
    const [isLoadingPasskeys, setIsLoadingPasskeys] = useState<boolean>(false);
    const [isHardwareSupported, setIsHardwareSupported] = useState<boolean>(true);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState<boolean>(false);
    const [deletingCredentialId, setDeletingCredentialId] = useState<string | null>(null);
    const [isCurrentDeviceEnrolled, setIsCurrentDeviceEnrolled] = useState<boolean>(false);

    const loadPasskeys = async () => {
        if (!user) return;
        setIsLoadingPasskeys(true);
        try {
            const data = await api.getUserPasskeys(user.sessionId);
            const local = getLocalPasskeyUser();
            let list = Array.isArray(data) ? [...data] : [];
            if (list.length === 0 && local) {
                list = [{
                    credentialId: 'local_device_key',
                    deviceName: 'This Device (Biometric Passkey)',
                    createdAt: local.enrolledAt,
                    lastUsedAt: new Date().toISOString()
                } as any];
            }
            setPasskeys(list);
            const isEnrolled = !!local || list.length > 0;
            setIsCurrentDeviceEnrolled(isEnrolled);

            // If account already has passkeys registered in backend, ensure this browser has the local hint saved
            if (!local && list.length > 0 && user) {
                const cleanMobile = (
                    user.primaryMobile ||
                    (user as any).mobile ||
                    (user as any).mobileNumber ||
                    (user as any).phone ||
                    ''
                ).toString().replace(/[^0-9]/g, '').slice(-10);

                setLocalPasskeyUser({
                    userId: user.userId,
                    name: user.name,
                    mobileNumber: cleanMobile,
                    enrolledAt: list[0]?.createdAt || new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('[MyProfile] Failed to fetch passkeys:', error);
            const local = getLocalPasskeyUser();
            if (local) {
                setIsCurrentDeviceEnrolled(true);
                setPasskeys([{
                    credentialId: 'local_device_key',
                    deviceName: 'This Device (Biometric Passkey)',
                    createdAt: local.enrolledAt,
                    lastUsedAt: new Date().toISOString()
                } as any]);
            }
        } finally {
            setIsLoadingPasskeys(false);
        }
    };

    useEffect(() => {
        isBiometricsAvailable().then(supported => {
            setIsHardwareSupported(supported);
        });
        const enrolled = getLocalPasskeyUser();
        setIsCurrentDeviceEnrolled(!!enrolled);
    }, []);

    useEffect(() => {
        if (activeTab === 'biometrics' && user) {
            loadPasskeys();
        }
    }, [activeTab, user]);

    const handleRegisterPasskey = async () => {
        if (!user) return;
        if (!window.PublicKeyCredential) {
            toast('WebAuthn / Passkeys are not supported by this browser.', 'error');
            return;
        }

        if (!isWebAuthnPermitted()) {
            toast('Passkey enrollment is restricted inside embedded preview frames by browser security policy. Please open the app directly in a full browser tab to enroll your device.', 'info');
            return;
        }

        setIsRegisteringPasskey(true);
        try {
            // 1. Get Registration Challenge from Backend
            const options = await api.getPasskeyRegistrationOptions(user.sessionId);

            // 2. Prepare Public Key Credential Creation Options
            const creationOptions: PublicKeyCredentialCreationOptions = {
                challenge: base64urlToBuffer(options.challenge),
                rp: {
                    name: options.rp.name || 'BK Audit Portal',
                    id: options.rp.id || window.location.hostname
                },
                user: {
                    id: base64urlToBuffer(options.user.id),
                    name: options.user.name || user.primaryMobile || user.name,
                    displayName: options.user.displayName || user.name
                },
                pubKeyCredParams: [
                    { type: 'public-key' as const, alg: -7 },   // ES256
                    { type: 'public-key' as const, alg: -257 }  // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'preferred',
                    residentKey: 'preferred'
                },
                timeout: 60000,
                attestation: 'none'
            };

            // 3. Invoke Browser WebAuthn API (Face ID, Fingerprint, Touch ID, Windows Hello)
            const credential = await navigator.credentials.create({
                publicKey: creationOptions
            }) as PublicKeyCredential | null;

            if (!credential) {
                throw new Error('Biometric registration was cancelled or timed out.');
            }

            const rawIdBuffer = credential.rawId;
            const credentialId = bufferToBase64url(rawIdBuffer);
            const response = credential.response as AuthenticatorAttestationResponse;
            const clientDataJSON = bufferToBase64url(response.clientDataJSON);
            const attestationObject = bufferToBase64url(response.attestationObject);

            // Friendly device name
            let deviceName = 'Biometric Authenticator';
            const ua = navigator.userAgent;
            if (/iPhone|iPad|iPod/.test(ua)) {
                deviceName = 'Apple iOS Device (Face ID / Touch ID)';
            } else if (/Android/.test(ua)) {
                deviceName = 'Android Device (Fingerprint / Biometrics)';
            } else if (/Macintosh/.test(ua)) {
                deviceName = 'Apple Mac (Touch ID)';
            } else if (/Windows/.test(ua)) {
                deviceName = 'Windows Device (Windows Hello)';
            } else {
                deviceName = 'Platform Authenticator';
            }

            // 4. Send back to Backend to verify & store in Hub Spreadsheet
            await api.verifyPasskeyRegistration(user.sessionId, {
                credentialId,
                clientDataJSON,
                attestationObject,
                deviceName
            });

            // 5. Store local hint for 1-tap quick sign-in on this device
            const cleanMobile = (
                user.primaryMobile ||
                (user as any).mobile ||
                (user as any).mobileNumber ||
                (user as any).phone ||
                ''
            ).toString().replace(/[^0-9]/g, '').slice(-10);

            setLocalPasskeyUser({
                userId: user.userId,
                name: user.name,
                mobileNumber: cleanMobile,
                enrolledAt: new Date().toISOString()
            });
            setIsCurrentDeviceEnrolled(true);

            toast('✓ Biometric Passkey enrolled successfully! You can now log in using your fingerprint or Face ID.', 'success');
            await loadPasskeys();
        } catch (error: any) {
            const msg = error?.message || 'Biometric registration failed.';
            if (msg.includes('publickey-credentials') || msg.includes('Permissions Policy') || msg.includes('cross-origin child frames')) {
                console.warn('[MyProfile] Passkey enrollment not allowed in embedded iframe:', msg);
                toast('Passkeys cannot be registered inside an embedded preview iframe. Open the app directly in a full browser tab.', 'info');
            } else if (msg.includes('NotAllowedError') || msg.includes('cancelled') || error?.name === 'NotAllowedError') {
                toast('Biometric prompt was cancelled.', 'info');
            } else {
                console.error('[MyProfile] Passkey enrollment failed:', error);
                toast(msg, 'error');
            }
        } finally {
            setIsRegisteringPasskey(false);
        }
    };

    const handleDeletePasskey = async (credentialId: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to remove this biometric passkey? You will not be able to log in with this device without re-enrolling.')) {
            return;
        }

        setDeletingCredentialId(credentialId);
        try {
            await api.deletePasskey(user.sessionId, credentialId);
            toast('Passkey removed successfully.', 'success');
            const updated = passkeys.filter(p => p.credentialId !== credentialId);
            setPasskeys(updated);
            if (updated.length === 0) {
                clearLocalPasskeyUser();
                setIsCurrentDeviceEnrolled(false);
            }
        } catch (error: any) {
            toast(error?.message || 'Failed to remove passkey.', 'error');
        } finally {
            setDeletingCredentialId(null);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                telegramId: user.telegramId,
                primaryMobile: user.primaryMobile, // This is read-only, but needed for display
                roleLabel: user.roleLabel,
                mobileFavorites: user.mobileFavorites || '[]'
            });
            setIsDirty(false);
        }
    }, [user]);
    
    const accessibleModules = useMemo(() => {
        return (user?.appModules || []).filter(module => 
            !module.permission || hasPermission(module.permission)
        );
    }, [user?.appModules, hasPermission]);


    const handleFormChange = (fieldName: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        setIsDirty(true);
    };
    
    const handleNavChange = (favorites: string[]) => {
        setFormData(prev => ({ ...prev, mobileFavorites: JSON.stringify(favorites) }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const profileDataToSave = {
                name: formData.name,
                telegramId: formData.telegramId,
                mobileFavorites: formData.mobileFavorites
            };
            await updateMyProfile(profileDataToSave);
            // Instantly update the global session state with the new data
            updateSession(profileDataToSave);
            toast('Profile updated successfully!', 'success');
            setIsDirty(false);
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const isFieldDisabled = (field: SuperMasterRecord): boolean => {
        // Role is managed by an admin.
        // Mobile number is the login credential and cannot be changed here.
        return ['primaryMobile', 'roleLabel'].includes(field.fieldName);
    };

    const profileFieldNames = useMemo(() => ['name', 'primaryMobile', 'telegramId', 'roleLabel'], []);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[var(--foreground)]">My Profile</h1>
                {isDirty && <Button onClick={handleSave} isLoading={isSaving} disabled={!isDirty}>Save Changes</Button>}
            </div>

            {isDirty && (
                <div className="mb-4 p-4 bg-[var(--toast-warning-background)] text-[var(--toast-warning-foreground)] rounded-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    You have unsaved changes. Click "Save Changes" to apply them.
                </div>
            )}

            <div className="mb-6">
                <div className="inline-flex rounded-lg bg-[var(--tab-background)] p-1 space-x-1">
                    <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'bg-[var(--tab-active-background)] shadow text-[var(--tab-active-foreground)]' : 'text-[var(--tab-foreground)] hover:bg-[var(--tab-hover-background)]'} py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center`}>
                        <User className="w-4 h-4 mr-2" /> Profile Details
                    </button>
                    <button onClick={() => setActiveTab('navigation')} className={`${activeTab === 'navigation' ? 'bg-[var(--tab-active-background)] shadow text-[var(--tab-active-foreground)]' : 'text-[var(--tab-foreground)] hover:bg-[var(--tab-hover-background)]'} py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center`}>
                        <SlidersHorizontal className="w-4 h-4 mr-2" /> Navigation
                    </button>
                    <button onClick={() => setActiveTab('twofactor')} className={`${activeTab === 'twofactor' ? 'bg-[var(--tab-active-background)] shadow text-[var(--tab-active-foreground)]' : 'text-[var(--tab-foreground)] hover:bg-[var(--tab-hover-background)]'} py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center`}>
                        <KeyRound className="w-4 h-4 mr-2" /> Two-Factor Auth
                    </button>
                    <button onClick={() => setActiveTab('biometrics')} className={`${activeTab === 'biometrics' ? 'bg-[var(--tab-active-background)] shadow text-[var(--tab-active-foreground)]' : 'text-[var(--tab-foreground)] hover:bg-[var(--tab-hover-background)]'} py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center`}>
                        <Fingerprint className="w-4 h-4 mr-2" /> Biometrics & Passkeys
                    </button>
                    <button onClick={() => setActiveTab('security')} className={`${activeTab === 'security' ? 'bg-[var(--tab-active-background)] shadow text-[var(--tab-active-foreground)]' : 'text-[var(--tab-foreground)] hover:bg-[var(--tab-hover-background)]'} py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center`}>
                        <ShieldAlert className="w-4 h-4 mr-2" /> Session Settings
                    </button>
                </div>
            </div>

            <Card>
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DynamicFormEngine
                            moduleName="MyProfile"
                            fieldNames={profileFieldNames}
                            formData={formData}
                            onFormChange={handleFormChange}
                            isFieldDisabled={isFieldDisabled}
                        />
                    </div>
                )}
                {activeTab === 'navigation' && (
                    <MobileNavCustomizer
                        accessibleModules={accessibleModules}
                        favoriteModuleIds={JSON.parse(formData.mobileFavorites || '[]')}
                        onFavoritesChange={handleNavChange}
                    />
                )}
                {activeTab === 'twofactor' && (
                    <div className="p-4 space-y-6 max-w-xl">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 flex items-center">
                                <KeyRound className="mr-2 text-[var(--primary-color)]" style={{ color: 'var(--primary-color)' }} /> Offline Authenticator Settings
                            </h2>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                Protect your account with Time-based One-Time Passwords (TOTP). This alternative verification method allows you to sign in offline when Telegram is unavailable.
                            </p>
                        </div>

                        {totpEnabledState ? (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-6 rounded-xl space-y-4">
                                <div className="flex items-start">
                                    <ShieldCheck className="h-6 w-6 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Authenticator App Active</h3>
                                        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                                            Your account is secured with offline 2FA. You can sign in using either 6-digit codes received via Telegram, or codes generated by your preferred Authenticator App.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    onClick={handleDisableTotp} 
                                    isLoading={isDisablingTotp}
                                >
                                    Disable Authenticator 2FA
                                </Button>
                            </div>
                        ) : (
                            <div className="border border-[var(--border-color)] p-6 rounded-xl space-y-6 bg-[var(--background-muted)]">
                                {!setupSecret ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--foreground-muted)]">
                                            To enroll your account in offline authentication and pair your device, click the button below to generate a new credentials secret.
                                        </p>
                                        <Button 
                                            onClick={handleStartSetup} 
                                            isLoading={isGeneratingSecret}
                                        >
                                            Set up Authenticator App
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-3">
                                            <h3 className="font-medium text-[var(--foreground)] text-sm">Step 1: Scan this QR Code</h3>
                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                Open your authenticator app (e.g. Google Authenticator, Microsoft Authenticator, 1Password, Duo) and scan the code below:
                                            </p>
                                            <div className="bg-white p-3 inline-block rounded-xl border border-gray-200">
                                                <img 
                                                    src={qrCodeUrl} 
                                                    alt="Scan to pair Authenticator" 
                                                    className="w-44 h-44"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-medium text-[var(--foreground)] text-sm">Or Enter Secret Manually</h3>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-[var(--background)] px-3 py-2 rounded border border-[var(--border-color)] font-mono text-sm tracking-widest text-[var(--foreground)] select-all bg-gray-100 dark:bg-gray-850">
                                                    {setupSecret}
                                                </code>
                                                <button 
                                                    type="button"
                                                    onClick={handleCopySecret}
                                                    className="p-2 border border-[var(--border-color)] hover:bg-[var(--background)] rounded text-[var(--foreground-muted)] transition-colors"
                                                    title="Copy Secret"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 border-t border-[var(--border-color)] pt-4">
                                            <h3 className="font-medium text-[var(--foreground)] text-sm">Step 2: Enter Verification Code</h3>
                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                Enter the 6-digit verification code generated by your Authenticator app to confirm correct styling.
                                            </p>
                                            <div className="flex gap-3 max-w-[280px]">
                                                <input 
                                                    type="text" 
                                                    maxLength={6}
                                                    pattern="\d{6}"
                                                    placeholder="123456" 
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                    className="border border-[var(--border-color)] rounded-lg p-2.5 w-full text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-[var(--foreground)] bg-[var(--background)]"
                                                />
                                                <Button 
                                                    onClick={handleEnableTotp}
                                                    isLoading={isVerifyingTotp}
                                                    disabled={verificationCode.length !== 6}
                                                >
                                                    Verify & Enable
                                                </Button>
                                            </div>
                                        </div>

                                        <button 
                                            type="button" 
                                            onClick={() => setSetupSecret('')}
                                            className="text-xs text-[var(--primary-color)] hover:underline block pt-2 text-[var(--primary-color)]"
                                            style={{ color: 'var(--primary-color)' }}
                                        >
                                            Cancel setup
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'security' && (
                    <div className="p-4 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 flex items-center">
                                <ShieldAlert className="mr-2 text-[var(--primary-color)]" style={{ color: 'var(--primary-color)' }} /> Session Inactivity Timeout
                            </h2>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                For your security, this portal automatically logs you out after a period of inactivity. You can adjust the inactivity timeout duration below.
                            </p>
                        </div>

                        <div className="border border-[var(--border-color)] p-6 rounded-xl space-y-4 bg-[var(--background-muted)]">
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Inactivity Timeout Duration
                            </label>
                            <select
                                value={inactivityTimeout}
                                onChange={(e) => handleInactivityTimeoutChange(e.target.value)}
                                className="w-full max-w-xs rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] shadow-sm focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                            >
                                <option value="0.5">30 Seconds (Testing)</option>
                                <option value="5">5 Minutes (High Security)</option>
                                <option value="15">15 Minutes (Standard)</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="120">2 Hours</option>
                                <option value="240">4 Hours</option>
                                <option value="480">8 Hours</option>
                                <option value="1440">1 Day</option>
                            </select>
                            <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                When active, moving the mouse, pressing keys, or clicking inside the app will reset the inactivity timer.
                            </p>
                        </div>
                    </div>
                )}
                {activeTab === 'biometrics' && (
                    <div className="p-4 space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 flex items-center">
                                <Fingerprint className="mr-2 text-[var(--primary-color)]" style={{ color: 'var(--primary-color)' }} /> Biometric Passkeys (Fingerprint / Face ID)
                            </h2>
                            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                                Log in in less than a second using your device's native fingerprint reader, Apple Face ID, Touch ID, or Windows Hello. Passkeys are phishing-resistant and cryptographic.
                            </p>
                        </div>

                        {/* Hardware Support Indicator */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${isHardwareSupported ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : isEmbeddedFrame() ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                            {isHardwareSupported ? (
                                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            ) : (
                                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                            )}
                            <div className="text-xs leading-relaxed">
                                {isHardwareSupported ? (
                                    <span>
                                        <strong>Hardware Verified:</strong> This device supports native platform biometrics (Face ID / Fingerprint / Touch ID). You can enroll this device below for 1-tap instant sign-in.
                                    </span>
                                ) : isEmbeddedFrame() ? (
                                    <span>
                                        <strong>Preview Mode Note:</strong> You are viewing this application in an embedded preview frame. WebAuthn Passkeys are restricted in child iframes by browser security policies. To register or authenticate with Face ID / Touch ID / Windows Hello, open the app directly in a full browser tab.
                                    </span>
                                ) : (
                                    <span>
                                        <strong>Notice:</strong> Native platform authenticator wasn't automatically verified on this browser. You can still attempt enrollment if your phone or security key supports FIDO2 / WebAuthn.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Enrollment Box */}
                        {isCurrentDeviceEnrolled ? (
                            <div className="border border-emerald-500/30 bg-emerald-500/10 p-5 rounded-xl space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                                                This Device is Registered & Ready
                                            </h3>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                                                Your biometric passkey (Fingerprint / Touch ID / Face ID) is active on this device. When you log in next time, you will see a <strong>1-Tap Login</strong> option.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegisterPasskey}
                                        isLoading={isRegisteringPasskey}
                                        className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shrink-0 text-xs px-3 h-8 self-start sm:self-center"
                                    >
                                        <Fingerprint className="w-3.5 h-3.5 mr-1" />
                                        Add Another Key
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-[var(--border-color)] p-6 rounded-xl space-y-4 bg-[var(--background-muted)]">
                                <h3 className="font-semibold text-sm text-[var(--foreground)] flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-[var(--primary-color)]" /> Register Current Device
                                </h3>
                                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                                    Tap the button below to register this phone or computer. Your device will prompt you to verify your fingerprint, face, or PIN.
                                </p>
                                <div>
                                    <Button
                                        onClick={handleRegisterPasskey}
                                        isLoading={isRegisteringPasskey}
                                        className="flex items-center gap-2"
                                    >
                                        <Fingerprint className="w-4 h-4" />
                                        Register This Device
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Enrolled Devices List */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-[var(--foreground)]">
                                Enrolled Passkeys & Devices {isLoadingPasskeys ? '' : `(${passkeys.length})`}
                            </h3>

                            {isLoadingPasskeys ? (
                                <div className="p-8 border border-[var(--border-color)] rounded-xl bg-[var(--background-muted)]/40 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in duration-200">
                                    <Loader className="w-6 h-6 animate-spin text-[var(--primary-color)]" />
                                    <span className="text-xs font-medium text-[var(--foreground-muted)] animate-pulse">
                                        Loading registered passkeys...
                                    </span>
                                </div>
                            ) : passkeys.length === 0 ? (
                                <div className="p-6 border border-dashed border-[var(--border-color)] rounded-xl text-center space-y-2">
                                    <Fingerprint className="w-8 h-8 mx-auto text-[var(--foreground-muted)] opacity-40" />
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        No biometric devices enrolled yet. Register your current device above to enable instant login.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {passkeys.map((p) => (
                                        <div
                                            key={p.credentialId}
                                            className="p-3.5 bg-[var(--card-background)] border border-[var(--border-color)] rounded-xl flex items-center justify-between gap-3 shadow-xs"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center shrink-0">
                                                    <Fingerprint className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                                                        {p.deviceName || 'Enrolled Device'}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--foreground-muted)]">
                                                        Added: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recently'}
                                                        {p.lastUsedAt && ` • Last used: ${new Date(p.lastUsedAt).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeletePasskey(p.credentialId)}
                                                isLoading={deletingCredentialId === p.credentialId}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 text-xs py-1 px-2.5 h-8"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MyProfile;