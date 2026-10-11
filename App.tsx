
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import TelegramMiniAppRegister from './components/attendance/TelegramMiniAppRegister';
import ContactUsMiniApp from './components/attendance/ContactUsMiniApp';
import { Toaster } from './components/ui/Toast';
import { ScopeProvider } from './context/ScopeContext';

const App: React.FC = () => {
    const { user } = useAuth();

    // Check if the current context is the Telegram Mini App or requested in URL
    const isTelegramUrl = window.location.search.includes('telegram') || 
                          window.location.hash.includes('telegram') || 
                          !!(window as any).Telegram?.WebApp?.initData;

    const isContactUsMiniApp = window.location.search.includes('miniapp=contactus');

    const hasLoginToken = window.location.search.includes('tgLoginToken');

    return (
        <ScopeProvider>
            {isContactUsMiniApp ? (
                <ContactUsMiniApp isMiniAppMode={true} />
            ) : hasLoginToken ? (
                <Login />
            ) : isTelegramUrl ? (
                user ? (
                    <Dashboard />
                ) : (
                    <TelegramMiniAppRegister />
                )
            ) : user ? (
                <Dashboard />
            ) : (
                <Login />
            )}
            <Toaster />
        </ScopeProvider>
    );
};

export default App;
