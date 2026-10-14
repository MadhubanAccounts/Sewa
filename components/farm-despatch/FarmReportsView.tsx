import React, { useState, useEffect, useMemo } from 'react';
import { FarmReportFilters, FarmReportRow } from '../../types';
import { 
    BarChart3, 
    Download, 
    Calendar, 
    Filter, 
    Layers, 
    TrendingUp, 
    Scale, 
    Package, 
    IndianRupee, 
    Truck, 
    MapPin,
    Loader2
} from 'lucide-react';
import { toast } from '../ui/Toast';

interface FarmReportsViewProps {
    onFetchReports: (filters: FarmReportFilters) => Promise<{
        success: boolean;
        rows: FarmReportRow[];
        summary: {
            totalTrips: number;
            grandTotalKg: number;
            grandTotalPacks: number;
            grandTotalValue: number;
            uniqueGroupsCount: number;
        };
    } | null>;
    destinations: { campusName: string }[];
}

export const FarmReportsView: React.FC<FarmReportsViewProps> = ({
    onFetchReports,
    destinations
}) => {
    const today = new Date().toISOString().split('T')[0];
    const [cadence, setCadence] = useState<'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'CUSTOM'>('DAILY');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [groupBy, setGroupBy] = useState<'ITEM' | 'CATEGORY' | 'DESTINATION' | 'VEHICLE'>('ITEM');
    const [selectedDestination, setSelectedDestination] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const [rows, setRows] = useState<FarmReportRow[]>([]);
    const [summary, setSummary] = useState({
        totalTrips: 0,
        grandTotalKg: 0,
        grandTotalPacks: 0,
        grandTotalValue: 0,
        uniqueGroupsCount: 0
    });
    const [loading, setLoading] = useState(false);

    // Auto-update date range on cadence change
    useEffect(() => {
        const now = new Date();
        const end = now.toISOString().split('T')[0];
        setEndDate(end);

        if (cadence === 'DAILY') {
            setStartDate(end);
        } else if (cadence === 'WEEKLY') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            setStartDate(d.toISOString().split('T')[0]);
        } else if (cadence === 'FORTNIGHTLY') {
            const d = new Date();
            d.setDate(d.getDate() - 15);
            setStartDate(d.toISOString().split('T')[0]);
        } else if (cadence === 'MONTHLY') {
            const d = new Date();
            d.setMonth(d.getMonth() - 1);
            setStartDate(d.toISOString().split('T')[0]);
        }
    }, [cadence]);

    // Fetch reports
    const executeReport = async () => {
        setLoading(true);
        try {
            const res = await onFetchReports({
                cadence,
                startDate,
                endDate,
                groupBy,
                destinationCampus: selectedDestination || undefined,
                category: selectedCategory || undefined
            });

            if (res && res.success) {
                setRows(res.rows || []);
                setSummary(res.summary || {
                    totalTrips: 0,
                    grandTotalKg: 0,
                    grandTotalPacks: 0,
                    grandTotalValue: 0,
                    uniqueGroupsCount: 0
                });
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        executeReport();
    }, [startDate, endDate, groupBy, selectedDestination, selectedCategory]);

    // Export to CSV
    const exportCSV = () => {
        if (rows.length === 0) {
            toast.error('No data available to export');
            return;
        }

        const headers = ['Group / Crop', 'Category', 'Total Trips', 'Total Packages', 'Total Quantity (Kg)', 'Estimated Value (₹)'];
        const csvRows = [headers.join(',')];

        rows.forEach(r => {
            csvRows.push([
                `"${r.groupLabel || r.groupKey}"`,
                `"${r.category || ''}"`,
                r.totalTrips,
                r.totalPackagingCount,
                r.totalQuantityKg,
                r.totalEstimatedValue
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Farm_Despatch_Report_${groupBy}_${startDate}_to_${endDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Report CSV exported successfully!');
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Farm Despatch Analytics & Reports
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Dynamic rollups by crop, category, destination campus, and vehicles.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={exportCSV}
                        className="px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>

                {/* Cadence Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                        Cadence:
                    </span>
                    {(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'CUSTOM'] as const).map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCadence(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                cadence === c
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            {c === 'DAILY' ? 'Daily' : c === 'WEEKLY' ? 'Weekly' : c === 'FORTNIGHTLY' ? 'Fortnightly (15d)' : c === 'MONTHLY' ? 'Monthly' : 'Custom Dates'}
                        </button>
                    ))}
                </div>

                {/* Date Ranges & Grouping Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCadence('CUSTOM');
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCadence('CUSTOM');
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Group Report By
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                            <option value="ITEM">Crop / Produce Item Wise</option>
                            <option value="CATEGORY">Category Wise (Veg/Fruit/Flower)</option>
                            <option value="DESTINATION">Destination Campus Wise</option>
                            <option value="VEHICLE">Vehicle & Driver Wise</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Filter Destination
                        </label>
                        <select
                            value={selectedDestination}
                            onChange={(e) => setSelectedDestination(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                            <option value="">All Campuses</option>
                            {destinations.map(d => (
                                <option key={d.campusName} value={d.campusName}>
                                    {d.campusName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        Total Despatches
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono block mt-1">
                        {summary.totalTrips} Trips
                    </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        Total Net Weight
                    </span>
                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono block mt-1">
                        {summary.grandTotalKg.toLocaleString('en-IN')} Kg
                    </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-amber-500" />
                        Total Packaging
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono block mt-1">
                        {summary.grandTotalPacks.toLocaleString('en-IN')} Units
                    </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-indigo-500" />
                        Est. Produce Value
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono block mt-1">
                        ₹{summary.grandTotalValue.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {/* Reports Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                <th className="py-3 px-4">
                                    {groupBy === 'ITEM' ? 'Produce Item (फसल)' : groupBy === 'CATEGORY' ? 'Category' : groupBy === 'DESTINATION' ? 'Campus Destination' : 'Vehicle & Driver'}
                                </th>
                                {groupBy === 'ITEM' && <th className="py-3 px-4">Category</th>}
                                <th className="py-3 px-4 text-center">Packaging Count</th>
                                <th className="py-3 px-4 text-right">Net Weight (Kg)</th>
                                <th className="py-3 px-4 text-right">Est. Valuation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                                        Computing report aggregates...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        No despatches found for selected dates and criteria.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr key={r.groupKey || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 font-medium">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {r.groupLabel || r.groupKey}
                                            </div>
                                        </td>
                                        {groupBy === 'ITEM' && (
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                                                {r.category || 'VEGETABLE'}
                                            </td>
                                        )}
                                        <td className="py-3 px-4 text-center font-mono">
                                            {r.totalPackagingCount.toLocaleString('en-IN')} units
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                            {r.totalQuantityKg.toLocaleString('en-IN')} Kg
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                            ₹{r.totalEstimatedValue.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
