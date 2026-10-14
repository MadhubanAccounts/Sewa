import React, { useState, useMemo } from 'react';
import { useFarmDespatch } from '../../hooks/useFarmDespatch';
import { FarmChallan } from '../../types';
import { formatFarmDateTime } from '../../utils/farmDateUtils';
import { FarmDespatchWizard } from './FarmDespatchWizard';
import { ChallanPrintModal } from './ChallanPrintModal';
import { FarmTelegramModal } from './FarmTelegramModal';
import { FarmReportsView } from './FarmReportsView';
import { FarmMasterManagement } from './FarmMasterManagement';
import { 
    Plus, 
    RefreshCw, 
    Printer, 
    Share2, 
    Trash2, 
    Edit,
    Search, 
    Filter, 
    Truck, 
    Scale, 
    Package, 
    IndianRupee, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertTriangle,
    BarChart3,
    Shield,
    Leaf,
    Send,
    Sparkles,
    Loader2
} from 'lucide-react';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { toast } from '../ui/Toast';

interface FarmDespatchDashboardProps {
    initialTab?: 'LIST' | 'WIZARD' | 'REPORTS' | 'MASTERS';
}

export const FarmDespatchDashboard: React.FC<FarmDespatchDashboardProps> = ({ initialTab }) => {
    const {
        produceMasters,
        vehicles,
        destinations,
        challans,
        telegramRecipients,
        loading,
        saving,
        deleting,
        broadcasting,
        seeding,
        permissions,
        loadAllData,
        saveChallan,
        deleteChallan,
        saveProduceMaster,
        deleteProduceMaster,
        saveVehicle,
        deleteVehicle,
        saveDestination,
        deleteDestination,
        broadcastTelegram,
        fetchReports,
        seedFarmMasters
    } = useFarmDespatch();

    // Determine initial view mode based on permissions and optional initialTab
    const defaultView = useMemo(() => {
        if (initialTab) return initialTab;
        if (permissions.canViewDespatch) return 'LIST';
        if (permissions.canAdd) return 'WIZARD';
        if (permissions.canViewReports) return 'REPORTS';
        if (permissions.canManageMasters) return 'MASTERS';
        return 'LIST';
    }, [initialTab, permissions]);

    // Active View Mode
    const [viewMode, setViewMode] = useState<'LIST' | 'WIZARD' | 'REPORTS' | 'MASTERS'>(defaultView);

    // Edit state for Draft / Challan modification (Point 1: farm_entry_edit)
    const [editingChallan, setEditingChallan] = useState<FarmChallan | null>(null);

    // Sync view mode when permissions finish loading or change
    React.useEffect(() => {
        if (!permissions.canViewDespatch && viewMode === 'LIST') {
            if (permissions.canAdd) setViewMode('WIZARD');
            else if (permissions.canViewReports) setViewMode('REPORTS');
            else if (permissions.canManageMasters) setViewMode('MASTERS');
        }
    }, [permissions.canViewDespatch, permissions.canAdd, permissions.canViewReports, permissions.canManageMasters, viewMode]);

    // Modals
    const [selectedPrintChallan, setSelectedPrintChallan] = useState<FarmChallan | null>(null);
    const [selectedTelegramChallan, setSelectedTelegramChallan] = useState<FarmChallan | null>(null);
    const [deletingChallanNo, setDeletingChallanNo] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState('');

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [destinationFilter, setDestinationFilter] = useState('');

    // Today's Date String
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Filtered Challans
    const filteredChallans = useMemo(() => {
        return challans.filter(c => {
            const matchesSearch = 
                c.challanNo.includes(searchTerm) ||
                c.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.items || []).some(it => it.hindiName.includes(searchTerm) || (it.englishName && it.englishName.toLowerCase().includes(searchTerm.toLowerCase())));
            
            const matchesDest = !destinationFilter || c.destinationCampus === destinationFilter;

            return matchesSearch && matchesDest;
        });
    }, [challans, searchTerm, destinationFilter]);

    // Today's Key Metrics
    const todayMetrics = useMemo(() => {
        const todayItems = challans.filter(c => (c.dispatchDate || c.challanDate) === todayStr && c.status !== 'CANCELLED');
        let totalKg = 0;
        let totalPacks = 0;
        let totalVal = 0;

        todayItems.forEach(c => {
            totalKg += Number(c.totalQuantityKg || 0);
            totalPacks += Number(c.totalPackagingCount || 0);
            totalVal += Number(c.totalEstimatedValue || 0);
        });

        return {
            todayTrips: todayItems.length,
            todayKg: totalKg,
            todayPacks: totalPacks,
            todayVal: totalVal
        };
    }, [challans, todayStr]);

    // Handle Delete Confirmation
    const handleConfirmDelete = async () => {
        if (!deletingChallanNo) return;
        if (!deletionReason.trim()) {
            toast.error('Audit validation: Please provide a mandatory reason for deletion.');
            return;
        }

        const res = await deleteChallan(deletingChallanNo, deletionReason.trim());
        if (res.success) {
            setDeletingChallanNo(null);
            setDeletionReason('');
        }
    };

    // If user has no permission for despatch, wizard, reports, or masters
    if (!permissions.canViewDespatch && !permissions.canAdd && !permissions.canEdit && !permissions.canDelete && !permissions.canPrint && !permissions.canSendTelegram && !permissions.canViewReports && !permissions.canManageMasters) {
        return (
            <div className="p-8 text-center text-slate-500 max-w-lg mx-auto space-y-3">
                <Leaf className="w-12 h-12 mx-auto text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h3>
                <p className="text-sm">You do not have permission to view Produce Despatches (requires farming permissions).</p>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 animate-fadeIn">
            {/* Compact Top Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm flex items-center justify-between gap-2 overflow-hidden">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Leaf className="w-4 h-4" />
                    </div>
                    Farming
                </h1>

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-1.5 sm:p-2 rounded-xl transition-colors ${showSearch ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Search"
                        aria-label="Search"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => loadAllData()}
                        disabled={loading}
                        className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Refresh data"
                        aria-label="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>

                    {permissions.canViewDespatch && (
                        <button
                            type="button"
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 sm:p-2 rounded-xl transition-colors relative ${viewMode === 'LIST' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title={`All Despatches (${challans.length})`}
                            aria-label="All Despatches"
                        >
                            <Truck className="w-4 h-4" />
                            {challans.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center">
                                    {challans.length}
                                </span>
                            )}
                        </button>
                    )}

                    {permissions.canManageMasters && (
                        <button
                            type="button"
                            onClick={() => setViewMode('MASTERS')}
                            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${viewMode === 'MASTERS' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title="Master Crops & Vehicles"
                            aria-label="Master Crops & Vehicles"
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                    )}

                    {permissions.canViewReports && (
                        <button
                            type="button"
                            onClick={() => setViewMode('REPORTS')}
                            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${viewMode === 'REPORTS' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title="Reports & Analytics"
                            aria-label="Reports & Analytics"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    )}

                </div>
            </div>

            {/* Floating Action Button (FAB) for New Despatch Slip */}
            {viewMode !== 'WIZARD' && permissions.canAdd && (
                <button
                    type="button"
                    onClick={() => {
                        setEditingChallan(null);
                        setViewMode('WIZARD');
                    }}
                    className="fixed bottom-20 right-6 z-40 p-4 bg-emerald-700 text-white rounded-full shadow-lg hover:bg-emerald-800 transition-all flex items-center justify-center"
                    title="New Despatch Slip"
                    aria-label="New Despatch Slip"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}


            {/* Common Search Bar (Toggled) */}
            {showSearch && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex items-center gap-2 animate-fadeIn">
                    <Search className="w-4 h-4 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search challans, drivers, vehicles, or crops..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 font-mono"
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}

            {/* TAB: NEW DESPATCH WIZARD */}
            {viewMode === 'WIZARD' && (
                <FarmDespatchWizard
                    initialChallan={editingChallan || undefined}
                    produceMasters={produceMasters}
                    vehicles={vehicles}
                    destinations={destinations}
                    canFetchAiRate={permissions.canFetchAiRate}
                    onSave={async (newChallan) => {
                        const res = await saveChallan(newChallan);
                        if (res.success) {
                            setEditingChallan(null);
                            setViewMode('LIST');
                        }
                        return res;
                    }}
                    onCancel={() => {
                        setEditingChallan(null);
                        setViewMode(permissions.canViewDespatch ? 'LIST' : 'WIZARD');
                    }}
                    onOpenPrint={permissions.canPrint ? (c) => setSelectedPrintChallan(c) : undefined}
                    onOpenTelegram={permissions.canSendTelegram ? (c) => setSelectedTelegramChallan(c) : undefined}
                />
            )}

            {/* TAB: REPORTS */}
            {viewMode === 'REPORTS' && (
                <FarmReportsView
                    onFetchReports={fetchReports}
                    destinations={destinations}
                />
            )}

            {/* TAB: MASTERS */}
            {viewMode === 'MASTERS' && (
                <FarmMasterManagement
                    produceMasters={produceMasters}
                    vehicles={vehicles}
                    destinations={destinations}
                    challans={challans}
                    onSaveProduce={saveProduceMaster}
                    onDeleteProduce={deleteProduceMaster}
                    onSaveVehicle={saveVehicle}
                    onDeleteVehicle={deleteVehicle}
                    onSaveDestination={saveDestination}
                    onDeleteDestination={deleteDestination}
                    onSeedMasters={() => seedFarmMasters(true)}
                    seeding={seeding}
                    searchTerm={searchTerm}
                />
            )}

            {/* TAB: LIST (MAIN DASHBOARD VIEW) */}
            {viewMode === 'LIST' && (
                <div className="space-y-4">
                    {/* Top KPI Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-blue-500" />
                                Today's Trips
                            </span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                                {todayMetrics.todayTrips}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                                Today's Weight
                            </span>
                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono block">
                                {todayMetrics.todayKg.toLocaleString('en-IN')} <span className="text-xs font-sans font-bold">Kg</span>
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-amber-500" />
                                Crates & Units
                            </span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                                {todayMetrics.todayPacks} <span className="text-xs font-sans font-bold">Packs</span>
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                                <IndianRupee className="w-3.5 h-3.5 text-indigo-500" />
                                Est. Valuation
                            </span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                                ₹{todayMetrics.todayVal.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Campus Filter Bar */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-500">Filter Despatches by Campus:</span>
                        <select
                            value={destinationFilter}
                            onChange={(e) => setDestinationFilter(e.target.value)}
                            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                            <option value="">All Campuses ({destinations.length})</option>
                            {destinations.map(d => (
                                <option key={d.campusName} value={d.campusName}>{d.campusName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Challans List (Mobile-Optimized Cards & Desktop Table) */}
                    {loading && challans.length === 0 ? (
                        <div className="py-16 text-center">
                            <SurfaceLoader label="Loading Dadi Gulzar Upvan despatches..." />
                        </div>
                    ) : filteredChallans.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                                <Truck className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                No Despatch Challans Found
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Start recording today's harvest departure with the step-by-step entry wizard.
                            </p>
                            {permissions.canAdd && (
                                <button
                                    type="button"
                                    onClick={() => setViewMode('WIZARD')}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
                                >
                                    Create First Challan
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredChallans.map(c => (
                                <div
                                    key={c.challanId || c.challanNo}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-all space-y-3"
                                >
                                    {/* Card Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-emerald-700 text-white">
                                                #{c.challanNo}
                                            </span>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {c.destinationCampus}
                                                </span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 font-mono">
                                                    {formatFarmDateTime(c.dispatchDate || c.challanDate, c.dispatchTime)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {c.telegramSentAt && (
                                                <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                                    <Send className="w-2.5 h-2.5" />
                                                    Telegram Broadcasted
                                                </span>
                                            )}

                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                c.status === 'DELIVERED'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                    : c.status === 'CANCELLED'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Details Body */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block">Vehicle & Escort:</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                                                {c.vehicleNo}
                                            </span>
                                            <span className="text-slate-500 ml-1.5">
                                                ({c.driverName})
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[11px] text-slate-400 block">Cargo Weight:</span>
                                            <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                                                {c.totalQuantityKg.toLocaleString('en-IN')} Kg
                                            </span>
                                            <span className="text-slate-500 ml-1.5">
                                                ({c.totalPackagingCount} Packages)
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[11px] text-slate-400 block">Wholesale Valuation:</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {c.totalEstimatedValue ? `₹${c.totalEstimatedValue.toLocaleString('en-IN')}` : 'Unpriced'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Crop Items Preview Badges */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(c.items || []).map((it, idx) => (
                                            <span
                                                key={it.itemId || idx}
                                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                                            >
                                                {it.hindiName}: <strong className="font-mono font-semibold">{it.quantityKg} kg</strong> ({it.packagingCount} {it.packagingUnit === 'CRATE' ? 'कैरेट' : it.packagingUnit})
                                            </span>
                                        ))}
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="text-[11px] text-slate-400">
                                            Sender: <strong>{c.senderName}</strong>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {/* Edit Action (Point 1: farm_entry_edit) */}
                                            {permissions.canEdit && c.status !== 'DELIVERED' && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingChallan(c);
                                                        setViewMode('WIZARD');
                                                    }}
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Edit challan / draft entry"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                            )}

                                            {/* Print / View Challan Slip */}
                                            {permissions.canPrint && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPrintChallan(c)}
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Print official delivery slip"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    Print Slip
                                                </button>
                                            )}

                                            {/* Telegram Broadcast */}
                                            {permissions.canSendTelegram && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTelegramChallan(c)}
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Broadcast photo to Telegram seniors"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
                                                    Telegram
                                                </button>
                                            )}

                                            {/* Delete Action (with validation) */}
                                            {permissions.canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingChallanNo(c.challanNo)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete challan record"
                                                    aria-label="Delete challan record"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Print Slip Modal */}
            {selectedPrintChallan && (
                <ChallanPrintModal
                    challan={selectedPrintChallan}
                    isOpen={!!selectedPrintChallan}
                    onClose={() => setSelectedPrintChallan(null)}
                    onOpenTelegram={permissions.canSendTelegram ? () => {
                        const target = selectedPrintChallan;
                        setSelectedPrintChallan(null);
                        setSelectedTelegramChallan(target);
                    } : undefined}
                />
            )}

            {/* Telegram Broadcast Modal */}
            {selectedTelegramChallan && (
                <FarmTelegramModal
                    challan={selectedTelegramChallan}
                    recipients={telegramRecipients}
                    isOpen={!!selectedTelegramChallan}
                    onClose={() => setSelectedTelegramChallan(null)}
                    onSendTelegram={broadcastTelegram}
                />
            )}

            {/* Delete Validation & Reason Confirmation Modal */}
            {deletingChallanNo && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Confirm Deletion of Challan #{deletingChallanNo}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Audited or broadcasted challans cannot be deleted.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Mandatory Reason for Deletion (Audit Register):
                            </label>
                            <textarea
                                rows={2}
                                required
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="e.g. Duplicate entry created by operator error / Vehicle breakdown before gate departure"
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingChallanNo(null);
                                    setDeletionReason('');
                                }}
                                disabled={deleting}
                                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting || !deletionReason.trim()}
                                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5"
                            >
                                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {deleting ? 'Validating...' : 'Delete Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmDespatchDashboard;
