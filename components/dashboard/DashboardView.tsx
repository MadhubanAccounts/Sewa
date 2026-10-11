import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import KeyMetricsWidget from './widgets/KeyMetricsWidget';
import ActivityWidget from './widgets/ActivityWidget';
import { Send } from 'lucide-react';

interface DashboardViewProps {
    onModuleSelect?: (id: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onModuleSelect }) => {
    const { user } = useAuth();
    const isAdmin = user?.roleLabel === 'ADMIN' || user?.email === 'krishna.acct@bkivv.org';

    return (
        <div className="flex flex-col h-full">
            {/* Standardized title placement at the top */}
            <div className="flex flex-col justify-start pb-6 pt-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight uppercase">
                    Welcome, {user?.name}!
                </h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content area */}
                <div className="lg:col-span-2 space-y-6">
                    <KeyMetricsWidget onModuleSelect={onModuleSelect} />
                    
                    {isAdmin && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                             onClick={() => onModuleSelect?.('bulk-messaging')}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Send className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Bulk Messaging</h3>
                                    <p className="text-sm text-gray-500">Send automated Telegram notifications from Excel data.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar-like content area */}
                <div className="lg:col-span-1 space-y-6">
                    <ActivityWidget />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;