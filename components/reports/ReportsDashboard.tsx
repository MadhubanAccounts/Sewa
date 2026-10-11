


import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useReportBuilder } from '../../hooks/useReportBuilder';
import { Card } from '../ui/Card';
import { FileSpreadsheet, FileText, Loader, BarChart3, FileX, ShieldCheck } from 'lucide-react';
import { SurfaceLoader } from '../common/SurfaceLoader';

interface ReportsDashboardProps {
    onModuleSelect: (moduleId: string, selectedItemId?: string) => void;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ onModuleSelect }) => {
    const { hasPermission } = useAuth();
    const { savedReports, fetchData, loading } = useReportBuilder();

    // Fetch saved reports on mount
    useEffect(() => {
        if (hasPermission('reports_view')) {
            fetchData();
        }
    }, [fetchData, hasPermission]);

    const systemReports = [
        {
            id: 'mod_rpt_acc_pivot',
            title: 'Account Pending Status (Zone-wise)',
            description: 'A matrix view of pending account submissions aggregated by Zone and Sub-zone.',
            icon: <FileSpreadsheet className="w-8 h-8 text-pink-500" />,
            permission: 'account_submissions_view'
        },
        {
            id: 'mod_rpt_vouch_grid',
            title: 'Vouching Statistics (Cashbook) Grid',
            description: 'A visual status report of voucher processing with data bars for pending and completed work.',
            icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
            permission: 'vouching_stats_view'
        },
        {
            id: 'mod_rpt_pending_uid',
            title: 'Pending Count UID List (Specified Categories)',
            description: 'A summary of pending vouching and audit counts by UID for specific categories.',
            icon: <FileText className="w-8 h-8 text-orange-500" />,
            permission: 'vouching_stats_view'
        },
        {
            id: 'mod_rpt_rejected_uid',
            title: 'Rejected Count UID List (All Categories)',
            description: 'A summary of rejected counts by UID with category breakdown.',
            icon: <FileX className="w-8 h-8 text-red-500" />,
            permission: 'vouching_stats_view'
        },
        {
            id: 'mod_rpt_submission_summary',
            title: 'Submission Status Report',
            description: 'UID-wise last submitted month sorted by month and UID.',
            icon: <FileSpreadsheet className="w-8 h-8 text-pink-500" />,
            permission: 'report_submission_summary'
        },
        {
            id: 'mod_rpt_audit_readiness',
            title: 'Audit Readiness Report',
            description: 'Determine UID audit readiness based on pending counts, rejected counts, and submission status.',
            icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
            permission: 'account_submissions_view'
        }
    ];

    const accessibleSystemReports = systemReports.filter(r => hasPermission(r.permission));

    // Handle clicking a custom report
    const handleCustomReportClick = (report: any) => {
        // We open the 'mod_custom_viewer' module and pass the reportId as the second arg
        // which the Dashboard treats as 'initialSelectedItemId'
        onModuleSelect('mod_custom_viewer', report.reportId);
    };

    return (
        <div className="animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">Reports Center</h1>
            
            <h2 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">System Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {accessibleSystemReports.map(report => (
                    <button 
                        key={report.id}
                        onClick={() => onModuleSelect(report.id)}
                        className="text-left group focus:outline-none transition-transform hover:scale-[1.02]"
                    >
                        <Card className="h-full hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[var(--primary-color)]">
                            <div className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-[var(--card-inset-background)] group-hover:bg-[var(--accent-background)] transition-colors">
                                    {report.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--foreground)]">{report.title}</h3>
                                    <p className="text-sm text-[var(--foreground-muted)] mt-2">{report.description}</p>
                                </div>
                            </div>
                        </Card>
                    </button>
                ))}
            </div>

            <h2 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Custom Saved Reports</h2>
             {loading && savedReports.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="h-40 animate-pulse bg-gray-100 dark:bg-slate-800"><div /></Card>
                    <Card className="h-40 animate-pulse bg-gray-100 dark:bg-slate-800"><div /></Card>
                </div>
            ) : savedReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedReports.map(report => (
                        <button 
                            key={report.reportId}
                            onClick={() => handleCustomReportClick(report)}
                            className="text-left group focus:outline-none transition-transform hover:scale-[1.02]"
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow border-2 border-dashed border-[var(--border)] hover:border-[var(--primary-color)]">
                                <div className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:text-white group-hover:bg-blue-600 transition-colors">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--foreground)]">{report.displayName}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1 font-mono">ID: {report.reportId}</p>
                                    </div>
                                </div>
                            </Card>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-[var(--foreground-muted)] bg-[var(--card-inset-background)] rounded-lg border border-[var(--border)]">
                    <p>No custom reports saved yet. Use the <strong>Report Builder</strong> to create one.</p>
                </div>
            )}
            
            {accessibleSystemReports.length === 0 && savedReports.length === 0 && (
                <div className="text-center p-12 text-[var(--foreground-muted)]">
                    <p>No reports available. Please contact an administrator for access.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsDashboard;
