import React from 'react';
import { useFarmDespatch } from '../../hooks/useFarmDespatch';
import { FarmReportsView } from './FarmReportsView';
import { BarChart3, RefreshCw } from 'lucide-react';
import { SurfaceLoader } from '../common/SurfaceLoader';

export const FarmReportsStandalone: React.FC = () => {
    const { destinations, fetchReports, loading, loadAllData, permissions } = useFarmDespatch();

    if (!permissions.canViewReports) {
        return (
            <div className="p-8 text-center text-slate-500 max-w-lg mx-auto space-y-3">
                <BarChart3 className="w-12 h-12 mx-auto text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h3>
                <p className="text-sm">You do not have permission to view Farm Reports & Analytics (<code>farm_report_view</code> required).</p>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 animate-fadeIn">
            {/* Top Navigation & Brand Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                                Farm Reports & Analytics
                            </h1>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                Dadi Gulzar Upvan
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Daily, Weekly, Monthly Produce Harvest Analytics, Campus Consumption & Distribution Trends
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadAllData()}
                        disabled={loading}
                        className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Refresh data"
                        aria-label="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && destinations.length === 0 ? (
                <div className="py-16 text-center">
                    <SurfaceLoader label="Loading report data..." />
                </div>
            ) : (
                <FarmReportsView
                    onFetchReports={fetchReports}
                    destinations={destinations}
                />
            )}
        </div>
    );
};

export default FarmReportsStandalone;
