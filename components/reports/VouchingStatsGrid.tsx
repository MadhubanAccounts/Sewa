import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Card } from '../ui/Card';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle, RefreshCw, BarChart3, Info, LayoutGrid, Table as TableIcon, LayoutPanelLeft, ChevronLeft, ChevronRight, Printer, Image as ImageIcon } from 'lucide-react';
import { getReportData } from '../../services/apiService';
import { PrintModal, initiatePrintProcess } from '../common/PrintModal';

interface VouchingStat {
    institute: string;
    vouchingCategory: string;
    totalDocs: number;
    uploadPending: number;
    vouchingPending: number;
    vouchingDone: number;
    uploadPendingPct: number;
    vouchingPendingPct: number;
    vouchingDonePct: number;
}

const VouchingStatsGrid: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<VouchingStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'image'>('grid');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handlePrint = () => {
        initiatePrintProcess('printable-vouching-stats-content', '');
    };

    const fetchData = useCallback(async () => {
        if (!user?.sessionId) return;
        
        setLoading(true);
        setError(null);
        try {
            const result = await getReportData(user.sessionId, 'vouching_stats_grid');
            if (result && Array.isArray(result)) {
                setData(result);
            } else {
                setError("No data returned or invalid format.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch vouching statistics.");
        } finally {
            setLoading(false);
        }
    }, [user?.sessionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatIndianNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };
    const instOrder = ['PBKIVV', 'WRST', 'RERF', 'BKES', 'TSRCT', 'SSAF', 'MKT', 'RMCS'];
    const institutes = useMemo(() => {
        return Array.from(new Set(data.map(d => String(d.institute || '')))).sort((a, b) => {
            const idxA = instOrder.indexOf(a as string);
            const idxB = instOrder.indexOf(b as string);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        }) as string[];
    }, [data]);

    const rawCategories = useMemo(() => Array.from(new Set(data.map(d => String(d.vouchingCategory || '')))) as string[], [data]);

    // Calculate Row Totals first to enable sorting
    const rowTotals = useMemo(() => rawCategories.reduce((acc, cat) => {
        const catData = data.filter(d => d.vouchingCategory === cat);
        acc[cat] = {
            up: catData.reduce((sum, d) => sum + d.uploadPending, 0),
            vch: catData.reduce((sum, d) => sum + d.vouchingPending, 0),
            done: catData.reduce((sum, d) => sum + d.vouchingDone, 0)
        };
        return acc;
    }, {} as Record<string, { up: number; vch: number; done: number }>), [rawCategories, data]);

    // Sort categories by total (UPL + VCH + DONE) descending
    const categories = useMemo(() => [...rawCategories].sort((a, b) => {
        const totalA = rowTotals[a].up + rowTotals[a].vch + rowTotals[a].done;
        const totalB = rowTotals[b].up + rowTotals[b].vch + rowTotals[b].done;
        return totalB - totalA;
    }), [rawCategories, rowTotals]);

    // Calculate Column Totals
    const colTotals = useMemo(() => institutes.reduce((acc, inst) => {
        const instData = data.filter(d => d.institute === inst);
        acc[inst] = {
            up: instData.reduce((sum, d) => sum + d.uploadPending, 0),
            vch: instData.reduce((sum, d) => sum + d.vouchingPending, 0),
            done: instData.reduce((sum, d) => sum + d.vouchingDone, 0)
        };
        return acc;
    }, {} as Record<string, { up: number; vch: number; done: number }>), [institutes, data]);

    // Grand Total
    const grandTotal = useMemo(() => ({
        up: Object.values(rowTotals).reduce((sum, r) => sum + (r as any).up, 0),
        vch: Object.values(rowTotals).reduce((sum, r) => sum + (r as any).vch, 0),
        done: Object.values(rowTotals).reduce((sum, r) => sum + (r as any).done, 0)
    }), [rowTotals]);

    const Badge = ({ value, type }: { value: number; type: 'up' | 'vch' | 'done' | 'total' }) => {
        if (value === 0) return <span className="text-[10px] text-[var(--foreground-muted)] opacity-20">—</span>;
        
        if (viewMode === 'image') {
            const textColors = {
                up: 'text-rose-600 font-bold',
                vch: 'text-amber-600 font-bold',
                done: 'text-emerald-600 font-bold',
                total: 'text-blue-600 font-bold'
            };
            return <span className={`text-[12px] ${textColors[type]}`}>{formatIndianNumber(value)}</span>;
        }

        const colors = {
            up: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100 border border-rose-300 dark:border-rose-800',
            vch: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 border border-amber-300 dark:border-amber-800',
            done: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800',
            total: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 border border-blue-300 dark:border-blue-800'
        };

        return (
            <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-[11px] font-black shadow-sm transition-all hover:scale-105 ${colors[type]}`}>
                {formatIndianNumber(value)}
            </span>
        );
    };

    if (loading) return <SurfaceLoader message="Loading Vouching Statistics (Cashbook) Grid..." />;

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error Loading Report</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button 
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                    <RefreshCw className="w-4 h-4" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-20 print:p-0 print:pb-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    nav, .no-print, button, .print-hide { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; color: black !important; }
                    .card { border: none !important; box-shadow: none !important; }
                    table { font-size: 8pt !important; width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #ddd !important; padding: 4px !important; }
                    .sticky { position: static !important; }
                    @page { size: landscape; margin: 1cm; }
                }
            `}} />
            <div className="flex justify-between items-end border-b border-[var(--border)] pb-4 print:border-none">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">Vouching Statistics (Cashbook) Grid</h1>
                    <p className="text-[var(--foreground-muted)] mt-1">Real-time status of voucher processing across institutions.</p>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <button 
                        onClick={() => setViewMode(viewMode === 'grid' ? 'image' : 'grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'image' ? 'bg-blue-600 text-white' : 'bg-[var(--card-inset-background)] text-[var(--foreground)] border border-[var(--border)]'}`}
                        title={viewMode === 'image' ? "Switch to Grid View" : "Switch to Image Capture View"}
                    >
                        {viewMode === 'image' ? <TableIcon className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{viewMode === 'image' ? 'Grid View' : 'Image Mode'}</span>
                    </button>
                    <button 
                        onClick={() => setShowPrintModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-opacity"
                        title="Print to PDF"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="text-sm font-medium">Print to PDF</span>
                    </button>
                    <button 
                        onClick={fetchData}
                        className="p-2 rounded-full hover:bg-[var(--card-inset-background)] transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>
                </div>
            </div>

            <Card className={`relative overflow-hidden border border-[var(--border)] shadow-2xl ${viewMode === 'image' ? 'bg-white !text-slate-900' : 'bg-[var(--card-background)]'} print:shadow-none print:border-none`}>
                {/* Side Scroll Buttons */}
                <div className="absolute top-1/2 left-2 -translate-y-1/2 z-40 no-print">
                    <button 
                        onClick={() => scroll('left')}
                        className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-xl border border-[var(--border)] hover:scale-110 active:scale-95 transition-all group"
                        title="Scroll Left"
                    >
                        <ChevronLeft className="w-6 h-6 text-[var(--primary-color)]" />
                    </button>
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 z-40 no-print">
                    <button 
                        onClick={() => scroll('right')}
                        className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-xl border border-[var(--border)] hover:scale-110 active:scale-95 transition-all group"
                        title="Scroll Right"
                    >
                        <ChevronRight className="w-6 h-6 text-[var(--primary-color)]" />
                    </button>
                </div>

                <div 
                    ref={scrollContainerRef}
                    className={`overflow-x-auto scrollbar-hide ${viewMode === 'image' ? 'p-8' : ''}`}
                >
                    <table className={`w-full text-left border-collapse min-w-[1200px] ${viewMode === 'image' ? 'bg-white' : ''}`}>
                        <thead>
                            <tr className={`${viewMode === 'image' ? 'bg-slate-50' : 'bg-[var(--card-inset-background)]'} border-b border-[var(--border)]`}>
                                <th rowSpan={2} className={`p-4 text-[11px] font-black uppercase tracking-widest sticky left-0 z-30 w-[200px] border-r border-[var(--border)] ${viewMode === 'image' ? 'bg-slate-50 text-slate-500' : 'bg-[var(--card-inset-background)] text-[var(--foreground-muted)]'}`}>
                                    Vouching Category
                                </th>
                                {institutes.map(inst => (
                                    <th key={inst} colSpan={3} className={`p-2 text-[10px] font-black uppercase tracking-widest text-center border-l border-[var(--border)] ${viewMode === 'image' ? 'bg-slate-50 text-slate-900' : 'bg-[var(--card-inset-background)]/50 text-[var(--foreground)]'}`}>
                                        {inst}
                                    </th>
                                ))}
                                <th colSpan={3} className={`p-2 text-[10px] font-black uppercase tracking-widest text-center border-l-2 border-[var(--border)] ${viewMode === 'image' ? 'bg-blue-50 text-blue-600' : 'bg-[var(--primary-color)]/5 text-[var(--primary-color)]'}`}>
                                    GRAND TOTAL
                                </th>
                            </tr>
                            <tr className={`${viewMode === 'image' ? 'bg-slate-50' : 'bg-[var(--card-inset-background)]'} border-b-2 border-[var(--border)]`}>
                                {institutes.map(inst => (
                                    <React.Fragment key={`${inst}-sub`}>
                                        <th className={`p-2 text-[10px] font-black text-center border-l border-[var(--border)] ${viewMode === 'image' ? 'text-rose-600' : 'text-rose-800 dark:text-rose-400'}`}>
                                            {viewMode === 'image' ? `${inst}-UPL` : 'UPL'}
                                        </th>
                                        <th className={`p-2 text-[10px] font-black text-center border-l border-[var(--border)]/50 ${viewMode === 'image' ? 'text-amber-600' : 'text-amber-800 dark:text-amber-400'}`}>
                                            {viewMode === 'image' ? `${inst}-VCH` : 'VCH'}
                                        </th>
                                        <th className={`p-2 text-[10px] font-black text-center border-l border-[var(--border)]/50 ${viewMode === 'image' ? 'text-emerald-600' : 'text-emerald-800 dark:text-emerald-400'}`}>
                                            {viewMode === 'image' ? `${inst}-DONE` : 'DONE'}
                                        </th>
                                    </React.Fragment>
                                ))}
                                <th className={`p-2 text-[10px] font-black text-center border-l-2 border-[var(--border)] ${viewMode === 'image' ? 'bg-blue-50 text-rose-600' : 'text-rose-800 dark:text-rose-400 bg-[var(--primary-color)]/5'}`}>UPL</th>
                                <th className={`p-2 text-[10px] font-black text-center border-l border-[var(--border)]/50 ${viewMode === 'image' ? 'bg-blue-50 text-amber-600' : 'text-amber-800 dark:text-amber-400 bg-[var(--primary-color)]/5'}`}>VCH</th>
                                <th className={`p-2 text-[10px] font-black text-center border-l border-[var(--border)]/50 ${viewMode === 'image' ? 'bg-blue-50 text-emerald-600' : 'text-emerald-800 dark:text-emerald-400 bg-[var(--primary-color)]/5'}`}>DONE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {categories.map(cat => (
                                <tr key={cat} className={`${viewMode === 'image' ? 'bg-white' : 'hover:bg-[var(--card-inset-background)]'} transition-colors group`}>
                                    <td className={`p-3 sticky left-0 z-20 border-r border-[var(--border)] ${viewMode === 'image' ? 'bg-white' : 'bg-[var(--card-background)] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-[var(--card-inset-background)]'} transition-colors`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[11px] font-bold leading-tight truncate max-w-[140px] ${viewMode === 'image' ? 'text-slate-900' : 'text-[var(--foreground)]'}`}>{cat}</span>
                                            <Badge value={rowTotals[cat].up + rowTotals[cat].vch + rowTotals[cat].done} type="total" />
                                        </div>
                                    </td>
                                    {institutes.map(inst => {
                                        const stat = data.find(d => d.institute === inst && d.vouchingCategory === cat);
                                        return (
                                            <React.Fragment key={`${inst}-${cat}`}>
                                                <td className={`p-2 text-center border-l border-[var(--border)] ${viewMode === 'image' ? 'bg-white' : ''}`}>
                                                    <Badge value={stat?.uploadPending || 0} type="up" />
                                                </td>
                                                <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-white' : ''}`}>
                                                    <Badge value={stat?.vouchingPending || 0} type="vch" />
                                                </td>
                                                <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-white' : ''}`}>
                                                    <Badge value={stat?.vouchingDone || 0} type="done" />
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    {/* Row Totals */}
                                    <td className={`p-2 text-center border-l-2 border-[var(--border)] ${viewMode === 'image' ? 'bg-blue-50/30' : 'bg-[var(--primary-color)]/5'}`}>
                                        <Badge value={rowTotals[cat].up} type="up" />
                                    </td>
                                    <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-blue-50/30' : 'bg-[var(--primary-color)]/5'}`}>
                                        <Badge value={rowTotals[cat].vch} type="vch" />
                                    </td>
                                    <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-blue-50/30' : 'bg-[var(--primary-color)]/5'}`}>
                                        <Badge value={rowTotals[cat].done} type="done" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={`${viewMode === 'image' ? 'bg-slate-50 font-bold' : 'bg-[var(--card-inset-background)] font-black'} border-t-2 border-[var(--border)]`}>
                                <td className={`p-4 sticky left-0 z-20 border-r border-[var(--border)] text-[11px] uppercase tracking-widest ${viewMode === 'image' ? 'bg-slate-50 text-slate-900' : 'bg-[var(--card-inset-background)] text-[var(--foreground)]'}`}>
                                    Column Totals
                                </td>
                                {institutes.map(inst => (
                                    <React.Fragment key={`${inst}-total`}>
                                        <td className={`p-2 text-center border-l border-[var(--border)] ${viewMode === 'image' ? 'bg-slate-50' : ''}`}>
                                            <Badge value={colTotals[inst].up} type="up" />
                                        </td>
                                        <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-slate-50' : ''}`}>
                                            <Badge value={colTotals[inst].vch} type="vch" />
                                        </td>
                                        <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-slate-50' : ''}`}>
                                            <Badge value={colTotals[inst].done} type="done" />
                                        </td>
                                    </React.Fragment>
                                ))}
                                {/* Grand Totals */}
                                <td className={`p-2 text-center border-l-2 border-[var(--border)] ${viewMode === 'image' ? 'bg-blue-100/50' : 'bg-[var(--primary-color)]/10'}`}>
                                    <Badge value={grandTotal.up} type="up" />
                                </td>
                                <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-blue-100/50' : 'bg-[var(--primary-color)]/10'}`}>
                                    <Badge value={grandTotal.vch} type="vch" />
                                </td>
                                <td className={`p-2 text-center border-l border-[var(--border)]/30 ${viewMode === 'image' ? 'bg-blue-100/50' : 'bg-[var(--primary-color)]/10'}`}>
                                    <Badge value={grandTotal.done} type="done" />
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            <div className="bg-slate-100 dark:bg-slate-900/40 p-5 rounded-xl flex gap-4 items-start border border-slate-200 dark:border-slate-800">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-900 dark:text-slate-300">
                    <p className="font-black mb-2 uppercase tracking-widest text-[var(--primary-color)]">Matrix Legend</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-rose-500"></span>
                            <span>UPL: Upload Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-amber-500"></span>
                            <span>VCH: Vouching Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-500"></span>
                            <span>DONE: Vouching Completed</span>
                        </div>
                    </div>
                    <p className="mt-3 opacity-90">This report excludes institutions GS, MSMF, and SID. It focuses exclusively on the Accounts_CashBook screen.</p>
                    <p className="mt-2 text-[10px] italic opacity-70 no-print">Note: If "Print to PDF" does not trigger, please open the application in a new tab using the button in the top-right corner of the preview.</p>
                </div>
            </div>

            {showPrintModal && (
                <PrintModal 
                    title="Vouching Statistics Grid Preview" 
                    onClose={() => setShowPrintModal(false)} 
                    onPrint={handlePrint}
                >
                    <div id="printable-vouching-stats-content">
                        <h1 className="text-xl font-bold mb-2">Vouching Statistics (Cashbook) Grid</h1>
                        <p className="text-sm mb-4">Generated on: {new Date().toLocaleString()}</p>
                        
                        <table className="w-full text-[10px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th rowSpan={2} className="border border-gray-300 p-1 text-left">Vouching Category</th>
                                    {institutes.map(inst => (
                                        <th key={inst} colSpan={3} className="border border-gray-300 p-1 text-center">{inst}</th>
                                    ))}
                                    <th colSpan={3} className="border border-gray-300 p-1 text-center font-bold">GRAND TOTAL</th>
                                </tr>
                                <tr className="bg-gray-100">
                                    {institutes.map(inst => (
                                        <React.Fragment key={`${inst}-sub`}>
                                            <th className="border border-gray-300 p-1 text-center text-rose-600">UPL</th>
                                            <th className="border border-gray-300 p-1 text-center text-amber-600">VCH</th>
                                            <th className="border border-gray-300 p-1 text-center text-emerald-600">DONE</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="border border-gray-300 p-1 text-center text-rose-600">UPL</th>
                                    <th className="border border-gray-300 p-1 text-center text-amber-600">VCH</th>
                                    <th className="border border-gray-300 p-1 text-center text-emerald-600">DONE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat}>
                                        <td className="border border-gray-300 p-1 font-bold">{cat}</td>
                                        {institutes.map(inst => {
                                            const stat = data.find(d => d.institute === inst && d.vouchingCategory === cat);
                                            return (
                                                <React.Fragment key={`${inst}-${cat}`}>
                                                    <td className="border border-gray-300 p-1 text-center">{stat?.uploadPending || 0}</td>
                                                    <td className="border border-gray-300 p-1 text-center">{stat?.vouchingPending || 0}</td>
                                                    <td className="border border-gray-300 p-1 text-center">{stat?.vouchingDone || 0}</td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="border border-gray-300 p-1 text-center font-bold">{rowTotals[cat].up}</td>
                                        <td className="border border-gray-300 p-1 text-center font-bold">{rowTotals[cat].vch}</td>
                                        <td className="border border-gray-300 p-1 text-center font-bold">{rowTotals[cat].done}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td className="border border-gray-300 p-1">Column Totals</td>
                                    {institutes.map(inst => (
                                        <React.Fragment key={`${inst}-total`}>
                                            <td className="border border-gray-300 p-1 text-center">{colTotals[inst].up}</td>
                                            <td className="border border-gray-300 p-1 text-center">{colTotals[inst].vch}</td>
                                            <td className="border border-gray-300 p-1 text-center">{colTotals[inst].done}</td>
                                        </React.Fragment>
                                    ))}
                                    <td className="border border-gray-300 p-1 text-center">{grandTotal.up}</td>
                                    <td className="border border-gray-300 p-1 text-center">{grandTotal.vch}</td>
                                    <td className="border border-gray-300 p-1 text-center">{grandTotal.done}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </PrintModal>
            )}
        </div>
    );
};

export default VouchingStatsGrid;
