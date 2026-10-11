
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getSubmissionSummaryReport } from '../../services/apiService';
import { UniversalDataGrid } from '../common/UniversalDataGrid';
import { GridConfig } from '../../types';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { Card } from '../ui/Card';
import { FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

const SubmissionSummaryReport: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!user?.sessionId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await getSubmissionSummaryReport(user.sessionId);
            if (response.error) {
                setError(response.error);
            } else {
                setData(response.data || []);
                setMetadata(response.metadata || null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const gridConfig: GridConfig = {
        title: 'UID-wise Last Submitted Month',
        columns: [
            { key: 'S.No.', header: 'S.No.', width: '80px', aggregation: 'count' },
            { key: 'Institute', header: 'Institute', width: '150px' },
            { key: 'UID', header: 'UID', width: '120px' },
            { key: 'Centre Name', header: 'Centre Name', width: '200px' },
            { key: 'Zone', header: 'Zone', width: '120px' },
            { key: 'SubZone', header: 'SubZone', width: '120px' },
            { key: 'Last Submitted Month', header: 'Last Submitted Month', width: '180px' }
        ],
        groupBy: [],
        pivotConfig: { enabled: false, rowKey: '', columnKey: '', valueKey: '', aggregation: 'count' }
    };

    const formatTimestamp = (ts: string) => {
        if (!ts) return 'N/A';
        try {
            return new Date(ts).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return ts;
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col p-4 sm:p-6 space-y-6 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20 text-pink-600">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Submission Status Report</h1>
                        {metadata && (
                            <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mt-0.5">
                                Data As on: {formatTimestamp(metadata.sourceTime)} by {metadata.modifiedBy}
                            </p>
                        )}
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">UID-wise last submitted month sorted by month and UID.</p>
                    </div>
                </div>
                <Button 
                    variant="secondary" 
                    onClick={fetchData} 
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </Button>
            </div>

            {error ? (
                <div className="p-8 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <div>
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Report Error</h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                        <Button variant="outline" onClick={fetchData}>Try Again</Button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--card-background)] flex flex-col rounded-xl">
                    <div className="flex-1 min-h-0 p-4 flex flex-col">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <SurfaceLoader />
                            </div>
                        ) : (
                            <UniversalDataGrid 
                                data={data} 
                                config={gridConfig} 
                                loading={loading} 
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionSummaryReport;
