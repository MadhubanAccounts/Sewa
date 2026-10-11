import React, { useState, useEffect } from 'react';
import { telegramPublicRegister, getTelegramVerifiedPhone } from '../../services/apiService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Send, 
  Smartphone, 
  User, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  Copy,
  ExternalLink,
  Info,
  Download,
  Bot,
  Image as ImageIcon
} from 'lucide-react';

export default function TelegramMiniAppRegister() {
  // States for Telegram WebApp context
  const [tg, setTg] = useState<any>(null);
  const [tgUser, setTgUser] = useState<any>(null);
  const [isActualTelegram, setIsActualTelegram] = useState(false);

  // States
  const [telegramId, setTelegramId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [deviceOs, setDeviceOs] = useState('Android');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPollingPhone, setIsPollingPhone] = useState(false);

  // Load user data from Telegram SDK with robust polling to avoid race conditions
  useEffect(() => {
    // 1. Parse browser URL parameters first for any prefilled mobile
    const searchParams = new URLSearchParams(window.location.search);
    let urlPhone = searchParams.get('phone') || searchParams.get('mobile') || searchParams.get('mobileNumber') || searchParams.get('phone_number') || '';
    if (urlPhone) {
      setPhone(urlPhone);
    }

    const detectTelegram = () => {
      const telegramApp = (window as any).Telegram?.WebApp;
      if (telegramApp) {
        // Is it actually running inside Telegram?
        // Check if initData is populated, or if platform is not unknown
        const hasInitData = !!telegramApp.initData;
        const platform = telegramApp.platform || '';
        const isTgEnv = hasInitData || (platform && platform !== 'unknown');

        if (isTgEnv) {
          setTg(telegramApp);
          setIsActualTelegram(true);
          telegramApp.ready();
          telegramApp.expand();

          // Try start_param if phone is still empty
          const startParam = telegramApp.initDataUnsafe?.start_param || '';
          if (!urlPhone && startParam) {
            // Clean up startParam: check if it represents a phone number
            const cleanParam = startParam.replace(/[^0-9+]/g, '');
            if (cleanParam.length >= 8 && cleanParam.length <= 15) {
              setPhone(startParam);
              urlPhone = startParam;
            }
          }

          const user = telegramApp.initDataUnsafe?.user;
          if (user) {
            setTgUser(user);
            setTelegramId(String(user.id || ''));
            setName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
            setUsername(user.username || '');
            
            // Auto-map language code
            const langCode = (user.language_code || '').toLowerCase();
            if (langCode.startsWith('hi')) setLanguage('Hindi');
            else if (langCode.startsWith('te')) setLanguage('Telugu');
            else if (langCode.startsWith('ta')) setLanguage('Tamil');
            else if (langCode.startsWith('kn')) setLanguage('Kannada');
            else if (langCode.startsWith('ml')) setLanguage('Malayalam');
            else if (langCode.startsWith('or')) setLanguage('Oriya');
            else if (langCode.startsWith('mr')) setLanguage('Marathi');
            else if (langCode.startsWith('bn')) setLanguage('Bengali');
            else if (langCode.startsWith('as')) setLanguage('Assamese');
            else if (langCode.startsWith('gu')) setLanguage('Gujarati');
            else if (langCode.startsWith('pa')) setLanguage('Punjabi');
            else setLanguage('English');

            // Auto-detect OS from platform
            const plat = (telegramApp.platform || '').toLowerCase();
            if (plat === 'ios') setDeviceOs('iOS');
            else if (plat === 'android') setDeviceOs('Android');
            else if (plat === 'tdesktop' || plat === 'macos') setDeviceOs('Desktop');
            else if (plat === 'web' || plat === 'weba') setDeviceOs('Web');
            else setDeviceOs('Android');
            
            return true; // Successfully initialized with user data
          } else {
            // Inside Telegram, but user is not populated yet or hidden
            setTelegramId('');
            setName('');
            setUsername('');
            return true;
          }
        }
      }
      return false;
    };

    // Try immediately on component load
    const doneImmediately = detectTelegram();
    if (doneImmediately) return;

    // Set up a dynamic polling interval to capture Telegram SDK when ready
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const done = detectTelegram();
      if (done || attempts >= 30) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Listen for contact sharing events from Telegram WebApp SDK
  useEffect(() => {
    if (!tg) return;

    const handleContactShared = (eventData: any) => {
      console.log('[Telegram WebApp] contactRequested event received:', eventData);
      if (eventData) {
        let sharedPhone = eventData.contact?.phone_number || eventData.phone_number;
        if (!sharedPhone && eventData.response) {
          if (typeof eventData.response === 'string') {
            try {
              const parsed = JSON.parse(eventData.response);
              sharedPhone = parsed?.contact?.phone_number || parsed?.phone_number;
            } catch (e) {
              console.error('Failed to parse response string in contactRequested event:', e);
            }
          } else {
            sharedPhone = eventData.response?.contact?.phone_number || eventData.response?.phone_number;
          }
        }

        if (sharedPhone) {
          setPhone(sharedPhone);
          setError(null);
        }
      }
    };

    tg.onEvent('contactRequested', handleContactShared);
    return () => {
      tg.offEvent('contactRequested', handleContactShared);
    };
  }, [tg]);

  // Generates and downloads a perfectly sized image for BotFather
  const downloadBotFatherImage = (width: number, height: number, filename: string) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background gradient matching dark slate theme
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1e293b'); // slate-800
      gradient.addColorStop(1, '#0f172a'); // slate-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw decorative glowing circle in the center
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 20, Math.min(width, height) * 0.28, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'; // blue-600 with opacity
      ctx.fill();

      // Draw paper airplane icon (Telegram style)
      ctx.save();
      ctx.translate(width / 2, height / 2 - 30);
      const scaleFactor = Math.min(width, height) / 360;
      ctx.scale(scaleFactor, scaleFactor);
      
      ctx.beginPath();
      // Path for a neat paper airplane
      ctx.moveTo(0, -60);
      ctx.lineTo(-55, 35);
      ctx.lineTo(-12, 18);
      ctx.lineTo(0, 55);
      ctx.lineTo(12, 18);
      ctx.lineTo(55, 35);
      ctx.closePath();
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.fill();

      // Draw paper airplane highlight fold
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(0, 55);
      ctx.lineTo(12, 18);
      ctx.lineTo(55, 35);
      ctx.closePath();
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fill();
      ctx.restore();

      // Draw title: "CARE PORTAL"
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(width * 0.052)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('CARE PORTAL', width / 2, height / 2 + Math.min(width, height) * 0.16);

      // Draw small subtitle
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = `500 ${Math.round(width * 0.028)}px sans-serif`;
      ctx.fillText('Volunteer Registration Mini App', width / 2, height / 2 + Math.min(width, height) * 0.27);

      // Draw exact dimensions label
      ctx.fillStyle = '#60a5fa'; // blue-400
      ctx.font = `bold ${Math.round(width * 0.025)}px monospace`;
      ctx.fillText(`Dimensions: ${width} x ${height} (EXACT)`, width / 2, height / 2 + Math.min(width, height) * 0.38);

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to generate image via Canvas:', e);
    }
  };

  const pollVerifiedPhone = async (userIdToPoll: string) => {
    if (!userIdToPoll) return;
    setIsPollingPhone(true);
    let attempts = 0;
    const maxAttempts = 20;
    const intervalMs = 1500;

    const executePoll = async () => {
      try {
        const res = await getTelegramVerifiedPhone(userIdToPoll);
        if (res.success && res.phone) {
          setPhone(res.phone);
          setIsPollingPhone(false);
          setError(null);
          return true; // stop polling
        }
      } catch (e) {
        console.error('Error polling phone number:', e);
      }
      return false;
    };

    // Try once immediately
    const found = await executePoll();
    if (found) return;

    const timer = setInterval(async () => {
      attempts++;
      const done = await executePoll();
      if (done || attempts >= maxAttempts) {
        clearInterval(timer);
        setIsPollingPhone(false);
        if (!done) {
          setError('We could not automatically retrieve your phone number yet. Please ensure you have shared your contact with the bot and try again.');
        }
      }
    }, intervalMs);
  };

  const handleRequestContact = () => {
    if (!tg) {
      setError('Telegram SDK is not initialized.');
      return;
    }
    
    setError(null);
    try {
      // Start polling immediately to be highly responsive when they share the contact
      if (telegramId) {
        pollVerifiedPhone(telegramId);
      }

      tg.requestContact((accessGranted: boolean, response?: any) => {
        console.log('[Telegram WebApp] requestContact callback:', accessGranted, response);
        if (accessGranted) {
          let sharedPhone = response?.contact?.phone_number || response?.phone_number;
          if (!sharedPhone && response?.response) {
            if (typeof response.response === 'string') {
              try {
                const parsed = JSON.parse(response.response);
                sharedPhone = parsed?.contact?.phone_number || parsed?.phone_number;
              } catch (e) {
                console.error('Failed to parse response string in callback:', e);
              }
            } else {
              sharedPhone = response.response?.contact?.phone_number || response.response?.phone_number;
            }
          }
          
          if (sharedPhone) {
            setPhone(sharedPhone);
            setIsPollingPhone(false);
            setError(null);
          } else {
            console.log('[Telegram WebApp] Contact shared but phone was not returned directly in JS callback. Webhook/polling will handle it.');
          }
        } else {
          setIsPollingPhone(false);
          setError('Mobile number sharing declined. Registration cannot proceed without a verified contact number.');
        }
      });
    } catch (e: any) {
      console.error('Error invoking requestContact:', e);
      setIsPollingPhone(false);
      setError('An error occurred while launching the contact sharing popup.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
      setError('Name is required.');
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
      setError('Mobile Number is required.');
      setLoading(false);
      return;
    }
    // Mobile number validation (digits and optional leading +)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      setError('Please enter a valid mobile number with country code (at least 8 digits).');
      setLoading(false);
      return;
    }
    if (!telegramId.trim()) {
      setError('Telegram User ID is required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        telegramId: telegramId.trim(),
        username: username.trim(),
        useLanguagePref: language,
        userDeviceOs: deviceOs
      };

      const result = await telegramPublicRegister(payload);

      if (result.success) {
        setSuccess(true);
        // If inside Telegram, notify Telegram WebApp or trigger close after a delay
        if (isActualTelegram) {
          setTimeout(() => {
            tg.close();
          }, 3000);
        }
      } else {
        setError(result.error || 'Failed to submit registration details.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const copyAppUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 py-8">
      {/* Decorative top background representing Telegram styles */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20 ring-4 ring-blue-600/10">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">User Registration</h2>
          <p className="text-xs text-slate-400">BK Acct Msg Bot Official Registration</p>
        </div>

        {/* Success Screen */}
        {success ? (
          <Card className="p-6 bg-slate-800 border-emerald-500/30 text-center space-y-4 shadow-xl">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">Registration Successful!</h3>
              <p className="text-sm text-slate-300">
                Welcome, <strong>{name}</strong>! Your active profile has been securely recorded.
              </p>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-400 leading-relaxed font-mono">
              Telegram ID: {telegramId} <br/>
              Preferred Language: {language}
            </div>
            <p className="text-xs text-emerald-400/90 font-medium">
              {isActualTelegram 
                ? "This Mini App will close automatically in 3 seconds..." 
                : "You can close this browser tab safely now."}
            </p>
            {isActualTelegram && (
              <Button variant="primary" onClick={() => tg.close()} className="w-full bg-blue-600 hover:bg-blue-500 border-none">
                Close Mini App Now
              </Button>
            )}
          </Card>
        ) : (
          <Card className="p-5 sm:p-6 bg-slate-800 border-slate-700/60 shadow-2xl space-y-5">
            
            {/* Telegram context detection banner */}
            {isActualTelegram && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs text-blue-300 font-medium">Connected to Telegram Bot Session</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-200">
              
              {/* Custom Form Fields with styling matching dark theme */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. BK Amit Sharma"
                  disabled={loading}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Mobile Number <span className="text-rose-500">*</span>
                </label>
                
                {isActualTelegram ? (
                  <div className="space-y-2">
                    {phone ? (
                      <div className="flex items-center justify-between bg-slate-900/50 border border-emerald-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs text-slate-400 block font-medium">Verified Number</span>
                            <span className="text-sm font-mono text-white font-semibold">{phone}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleRequestContact}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1 hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={loading || isPollingPhone}
                          onClick={handleRequestContact}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold border-none rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                        >
                          {isPollingPhone ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              Verifying with Telegram bot...
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-4 h-4" />
                              Share Verified Mobile Number
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                          {isPollingPhone 
                            ? "Waiting for you to share your contact inside the Telegram popup..."
                            : "Telegram requires sharing your verified contact details. This ensures absolute accuracy and security."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <input 
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. +91 98765 43210"
                    disabled={loading}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Telegram User ID</label>
                  <input 
                    type="text"
                    required
                    readOnly={isActualTelegram} // Keep readonly under Telegram environment
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className={`w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActualTelegram ? 'opacity-65 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Username</label>
                  <input 
                    type="text"
                    readOnly={isActualTelegram}
                    value={username ? `@${username}` : ''}
                    onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                    placeholder="No username"
                    className={`w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActualTelegram ? 'opacity-65 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Oriya">Oriya</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Assamese">Assamese</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Punjabi">Punjabi</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Device OS</label>
                  <select
                    value={deviceOs}
                    onChange={(e) => setDeviceOs(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Android">Android 🤖</option>
                    <option value="iOS">iOS (iPhone) 📱</option>
                    <option value="Desktop">Desktop App 💻</option>
                    <option value="Web">Telegram Web 🌐</option>
                  </select>
                </div>
              </div>

              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !phone.trim()}
                className={`w-full mt-6 py-3 text-white font-bold border-none rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                  loading || !phone.trim() 
                    ? 'bg-slate-700 cursor-not-allowed text-slate-400 opacity-60 shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/10 cursor-pointer'
                }`}
              >
                {loading ? 'Submitting...' : 'Register Secure Profile'}
              </Button>
            </form>
          </Card>
        )}

        {/* Integration Instructions below card when viewed outside of telegram */}
        {!isActualTelegram && (
          <Card className="p-5 bg-slate-800/80 border-slate-700 text-slate-300 text-xs space-y-3.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5 text-blue-400" />
              How to Link @auditselfhelpbot to this Mini App?
            </h4>
            
            <ol className="list-decimal list-inside space-y-2.5 text-slate-400 leading-relaxed">
              <li>
                Open <strong>BotFather</strong> inside Telegram (`t.me/BotFather`).
              </li>
              <li>
                Type <code className="bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded">/newapp</code> and select your existing bot <strong className="text-blue-400">@auditselfhelpbot</strong>.
              </li>
              <li>
                Provide a title (e.g. <code>Register Profile</code>) and a short description.
              </li>
              <li className="space-y-2">
                <div>
                  When BotFather asks to <strong>upload a photo (640x360)</strong> and an <strong>icon/GIF (512x512)</strong>:
                  <p className="text-slate-500 mt-1">
                    BotFather has extremely strict image dimension requirements and rejects generic files. Click the buttons below to instantly generate and download high-resolution PNGs at the exact dimensions requested:
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1.5">
                  <button
                    type="button"
                    onClick={() => downloadBotFatherImage(640, 360, 'telegram_app_640x360.png')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-700 bg-slate-900/60 hover:bg-slate-700 hover:border-slate-600 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    App Photo (640x360)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBotFatherImage(512, 512, 'telegram_icon_512x512.png')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-700 bg-slate-900/60 hover:bg-slate-700 hover:border-slate-600 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    App Icon (512x512)
                  </button>
                </div>
              </li>
              <li>
                When asked for the <strong>Web App URL</strong>, copy and enter your App's live URL (ensure to append <code>?telegram=true</code> so it targets the registration screen):
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/?telegram=true`}
                    className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-2 rounded border border-slate-700 flex-grow"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?telegram=true`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="border-slate-700 hover:bg-slate-700 text-white px-2.5 py-1.5 shrink-0"
                  >
                    {copiedLink ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </li>
              <li>
                Provide a short name for the app (e.g. <code>register</code>). BotFather will generate your link: <code className="text-blue-400">t.me/auditselfhelpbot/register</code>.
              </li>
              <li>
                <strong>Optionally add a Menu Button:</strong> Type <code>/setmenubutton</code> in BotFather, select <strong>@auditselfhelpbot</strong>, paste the Web App URL with <code>?telegram=true</code>, and name it <code>Register</code>.
              </li>
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
