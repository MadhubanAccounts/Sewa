import React, { useState } from 'react';
import { FarmProduceMaster, FarmPackagingUnit, FarmProduceCategory, FarmVehicle, FarmDestination, FarmChallan } from '../../types';
import { Plus, Edit2, Trash2, Check, X, Shield, Package, Truck, MapPin, Search, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '../ui/Toast';

interface FarmMasterManagementProps {
    produceMasters: FarmProduceMaster[];
    vehicles: FarmVehicle[];
    destinations: FarmDestination[];
    challans?: FarmChallan[];
    onSaveProduce: (item: Partial<FarmProduceMaster>) => Promise<{ success: boolean; error?: string }>;
    onDeleteProduce: (produceId: string) => Promise<{ success: boolean; error?: string }>;
    onSaveVehicle: (vehicle: Partial<FarmVehicle>) => Promise<{ success: boolean; error?: string }>;
    onDeleteVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
    onSaveDestination: (destination: Partial<FarmDestination>) => Promise<{ success: boolean; error?: string }>;
    onDeleteDestination: (destinationId: string) => Promise<{ success: boolean; error?: string }>;
    onSeedMasters?: () => Promise<{ success: boolean }>;
    seeding?: boolean;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
}

export const FarmMasterManagement: React.FC<FarmMasterManagementProps> = ({
    produceMasters,
    vehicles,
    destinations,
    challans = [],
    onSaveProduce,
    onDeleteProduce,
    onSaveVehicle,
    onDeleteVehicle,
    onSaveDestination,
    onDeleteDestination,
    onSeedMasters,
    seeding = false,
    searchTerm: externalSearchTerm,
    onSearchChange
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
    const [activeTab, setActiveTab] = useState<'CROPS' | 'VEHICLES' | 'CAMPUSES'>('CROPS');
    
    // Modal Edit States
    const [editingCrop, setEditingCrop] = useState<Partial<FarmProduceMaster> | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Partial<FarmVehicle> | null>(null);
    const [editingDestination, setEditingDestination] = useState<Partial<FarmDestination> | null>(null);

    // Confirm Delete States
    const [deletingEntity, setDeletingEntity] = useState<{
        type: 'CROP' | 'VEHICLE' | 'DESTINATION';
        id: string;
        name: string;
        isReferenced: boolean;
    } | null>(null);

    // Processing states
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter crops
    const filteredCrops = produceMasters.filter(m => 
        m.hindiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter vehicles
    const filteredVehicles = vehicles.filter(v => 
        v.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.defaultDriverName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter destinations
    const filteredDestinations = destinations.filter(d => 
        d.campusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check if an entity is referenced in previous challans
    const checkIsCropReferenced = (produceId: string, hindiName: string) => {
        return challans.some(c => (c.items || []).some(it => it.produceId === produceId || it.hindiName === hindiName));
    };

    const checkIsVehicleReferenced = (vehicleNo: string) => {
        return challans.some(c => c.vehicleNo.trim().toUpperCase() === vehicleNo.trim().toUpperCase());
    };

    const checkIsDestinationReferenced = (campusName: string) => {
        return challans.some(c => c.destinationCampus.trim().toLowerCase() === campusName.trim().toLowerCase());
    };

    // --- CROP CRUD ---
    const handleSaveCrop = async (e: React.FormEvent) => {
        e.preventDefault();
        const hindi = editingCrop?.hindiName?.trim();
        if (!hindi) {
            toast.error('Hindi Produce Name is required.');
            return;
        }

        // Duplicate Hindi Name Validation
        const isDuplicate = produceMasters.some(m => 
            m.produceId !== editingCrop?.produceId && 
            m.hindiName.trim().toLowerCase() === hindi.toLowerCase()
        );
        if (isDuplicate) {
            toast.error(`Crop "${hindi}" is already registered in the master catalogue.`);
            return;
        }

        setIsSaving(true);
        try {
            const res = await onSaveProduce(editingCrop!);
            if (res.success) {
                setEditingCrop(null);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- VEHICLE CRUD ---
    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        const vNo = editingVehicle?.vehicleNo?.trim().toUpperCase();
        if (!vNo) {
            toast.error('Vehicle Number is required.');
            return;
        }

        // Duplicate Vehicle Number Validation
        const isDuplicate = vehicles.some(v => 
            v.vehicleId !== editingVehicle?.vehicleId && 
            v.vehicleNo.trim().toUpperCase() === vNo
        );
        if (isDuplicate) {
            toast.error(`Vehicle "${vNo}" already exists in the master records.`);
            return;
        }

        setIsSaving(true);
        try {
            const res = await onSaveVehicle({ ...editingVehicle, vehicleNo: vNo });
            if (res.success) {
                setEditingVehicle(null);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- DESTINATION CRUD ---
    const handleSaveDestination = async (e: React.FormEvent) => {
        e.preventDefault();
        const cName = editingDestination?.campusName?.trim();
        if (!cName) {
            toast.error('Campus Name is required.');
            return;
        }

        // Duplicate Campus Name Validation
        const isDuplicate = destinations.some(d => 
            d.destinationId !== editingDestination?.destinationId && 
            d.campusName.trim().toLowerCase() === cName.toLowerCase()
        );
        if (isDuplicate) {
            toast.error(`Campus destination "${cName}" already exists.`);
            return;
        }

        setIsSaving(true);
        try {
            const res = await onSaveDestination({ ...editingDestination, campusName: cName });
            if (res.success) {
                setEditingDestination(null);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Execute Delete
    const handleConfirmDelete = async () => {
        if (!deletingEntity) return;
        setIsDeleting(true);
        try {
            if (deletingEntity.type === 'CROP') {
                await onDeleteProduce(deletingEntity.id);
            } else if (deletingEntity.type === 'VEHICLE') {
                await onDeleteVehicle(deletingEntity.id);
            } else if (deletingEntity.type === 'DESTINATION') {
                await onDeleteDestination(deletingEntity.id);
            }
            setDeletingEntity(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* Top Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Farm Master Data Management
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Configure produce varieties, default packaging units, vehicles, drivers, and campus destinations with duplicate safeguards.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {onSeedMasters && (
                        <button
                            type="button"
                            onClick={() => onSeedMasters()}
                            disabled={seeding}
                            className="px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            title="Seed or re-populate standard produce items, 5 campus destinations & 3 vehicles into your Google Sheet"
                        >
                            <Sparkles className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 ${seeding ? 'animate-spin' : ''}`} />
                            {seeding ? 'Seeding Masters...' : 'Seed 31 Produce Items'}
                        </button>
                    )}

                    {activeTab === 'CROPS' && (
                        <button
                            type="button"
                            onClick={() => setEditingCrop({
                                produceId: `PRD-${(produceMasters.length + 1).toString().padStart(3, '0')}`,
                                hindiName: '',
                                englishName: '',
                                category: 'VEGETABLE',
                                defaultPackagingUnit: 'CRATE',
                                packagingRatioKg: 20,
                                isActive: true
                            })}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Crop
                        </button>
                    )}

                    {activeTab === 'VEHICLES' && (
                        <button
                            type="button"
                            onClick={() => setEditingVehicle({
                                vehicleId: `VEH-${(vehicles.length + 1).toString().padStart(2, '0')}`,
                                vehicleNo: '',
                                defaultDriverName: '',
                                driverPhone: '',
                                capacityKg: 2500,
                                isActive: true
                            })}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Vehicle & Driver
                        </button>
                    )}

                    {activeTab === 'CAMPUSES' && (
                        <button
                            type="button"
                            onClick={() => setEditingDestination({
                                destinationId: `DEST-${(destinations.length + 1).toString().padStart(2, '0')}`,
                                campusName: '',
                                shortCode: '',
                                address: '',
                                contactPerson: '',
                                contactPhone: '',
                                isActive: true,
                                isPrimary: false
                            })}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Campus Destination
                        </button>
                    )}
                </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveTab('CROPS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'CROPS'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <Package className="w-3.5 h-3.5" />
                    Produce Catalogue ({produceMasters.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('VEHICLES')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'VEHICLES'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <Truck className="w-3.5 h-3.5" />
                    Vehicles & Drivers ({vehicles.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('CAMPUSES')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'CAMPUSES'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <MapPin className="w-3.5 h-3.5" />
                    Destinations ({destinations.length})
                </button>
            </div>



            {/* TAB 1: CROPS */}
            {activeTab === 'CROPS' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3 px-4">Hindi Name</th>
                                <th className="py-3 px-4">English Name</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Default Packaging</th>
                                <th className="py-3 px-4">Kg/Unit</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCrops.map(c => {
                                const isArchived = c.isActive === false || c.status === 'INACTIVE';
                                return (
                                    <tr key={c.produceId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isArchived ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                        <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{c.produceId}</td>
                                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-sm">{c.hindiName}</td>
                                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{c.englishName}</td>
                                        <td className="py-2.5 px-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                c.category === 'FRUIT'
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                    : c.category === 'FLOWER'
                                                    ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            }`}>
                                                {c.category}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 font-mono font-semibold">{c.defaultPackagingUnit}</td>
                                        <td className="py-2.5 px-4 font-mono">{c.packagingRatioKg || 20} kg</td>
                                        <td className="py-2.5 px-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                isArchived
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                            }`}>
                                                {isArchived ? 'Archived' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingCrop(c)}
                                                    className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                                    title="Edit crop"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const isRef = checkIsCropReferenced(c.produceId, c.hindiName);
                                                        setDeletingEntity({
                                                            type: 'CROP',
                                                            id: c.produceId,
                                                            name: `${c.hindiName} (${c.englishName})`,
                                                            isReferenced: isRef
                                                        });
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete or archive crop"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB 2: VEHICLES & DRIVERS */}
            {activeTab === 'VEHICLES' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {filteredVehicles.map(v => {
                        const isArchived = v.isActive === false || v.status === 'INACTIVE';
                        return (
                            <div key={v.vehicleId} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 relative ${isArchived ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white uppercase">
                                        {v.vehicleNo}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        isArchived
                                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    }`}>
                                        {isArchived ? 'Archived' : 'Active'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    Default Driver: <strong className="text-slate-900 dark:text-white">{v.defaultDriverName || 'Not assigned'}</strong>
                                </div>
                                {v.driverPhone && (
                                    <div className="text-xs text-slate-500 font-mono">
                                        Phone: {v.driverPhone}
                                    </div>
                                )}
                                {v.capacityKg && (
                                    <div className="text-[11px] text-slate-400 font-mono">
                                        Capacity: {v.capacityKg.toLocaleString('en-IN')} kg
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setEditingVehicle(v)}
                                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isRef = checkIsVehicleReferenced(v.vehicleNo);
                                            setDeletingEntity({
                                                type: 'VEHICLE',
                                                id: v.vehicleId,
                                                name: v.vehicleNo,
                                                isReferenced: isRef
                                            });
                                        }}
                                        className="text-xs font-semibold text-red-600 hover:underline inline-flex items-center gap-1 ml-2"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 3: CAMPUSES / DESTINATIONS */}
            {activeTab === 'CAMPUSES' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {filteredDestinations.map(d => {
                        const isArchived = d.isActive === false || d.status === 'INACTIVE';
                        return (
                            <div key={d.destinationId} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 ${isArchived ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                        {d.campusName}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                        {d.shortCode}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {d.address || 'Mount Abu / Abu Road'}
                                </div>
                                {d.contactPerson && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Contact: {d.contactPerson} {d.contactPhone ? `(${d.contactPhone})` : ''}
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDestination(d)}
                                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isRef = checkIsDestinationReferenced(d.campusName);
                                            setDeletingEntity({
                                                type: 'DESTINATION',
                                                id: d.destinationId,
                                                name: d.campusName,
                                                isReferenced: isRef
                                            });
                                        }}
                                        className="text-xs font-semibold text-red-600 hover:underline inline-flex items-center gap-1 ml-2"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: CROP ADD/EDIT */}
            {editingCrop && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {editingCrop.produceId?.startsWith('PRD-') && produceMasters.some(m => m.produceId === editingCrop.produceId) ? 'Edit Produce Item' : 'Add New Produce Variety'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingCrop(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCrop} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Hindi Name (हिंदी नाम) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingCrop.hindiName || ''}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, hindiName: e.target.value })}
                                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="e.g. सब्जी पेठा"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    English Label
                                </label>
                                <input
                                    type="text"
                                    value={editingCrop.englishName || ''}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, englishName: e.target.value })}
                                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="e.g. Ash Gourd"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={editingCrop.category || 'VEGETABLE'}
                                        onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value as FarmProduceCategory })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                                    >
                                        <option value="VEGETABLE">Vegetable (सब्जी)</option>
                                        <option value="FRUIT">Fruit (फल)</option>
                                        <option value="FLOWER">Flower (फूल)</option>
                                        <option value="AGRI_PRODUCE">Agricultural Crop</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Default Packaging Unit
                                    </label>
                                    <select
                                        value={editingCrop.defaultPackagingUnit || 'CRATE'}
                                        onChange={(e) => setEditingCrop({ ...editingCrop, defaultPackagingUnit: e.target.value as FarmPackagingUnit })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                                    >
                                        <option value="CRATE">Crate (कैरेट)</option>
                                        <option value="BAG">Bag (बोरी)</option>
                                        <option value="BOX">Box (पेटी)</option>
                                        <option value="BUNDLE">Bundle (गट्ठा)</option>
                                        <option value="BASKET">Basket (टोकरी)</option>
                                        <option value="LOOSE">Loose</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Approx Ratio (Kg per packaging unit)
                                </label>
                                <input
                                    type="number"
                                    value={editingCrop.packagingRatioKg || 20}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, packagingRatioKg: parseFloat(e.target.value) || 0 })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="cropActive"
                                    checked={editingCrop.isActive !== false}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, isActive: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="cropActive" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Active for daily despatch entry
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingCrop(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    {isSaving ? 'Saving...' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: VEHICLE ADD/EDIT */}
            {editingVehicle && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {vehicles.some(v => v.vehicleId === editingVehicle.vehicleId) ? 'Edit Vehicle & Driver' : 'Add New Vehicle'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingVehicle(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Vehicle Registration Number (गाड़ी संख्या) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingVehicle.vehicleNo || ''}
                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleNo: e.target.value.toUpperCase() })}
                                    className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                                    placeholder="e.g. RJ 38 GA 1570"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Default Driver Name
                                </label>
                                <input
                                    type="text"
                                    value={editingVehicle.defaultDriverName || ''}
                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, defaultDriverName: e.target.value })}
                                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="e.g. Lakmaram"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Driver Phone (WhatsApp)
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingVehicle.driverPhone || ''}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, driverPhone: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="e.g. 9509005618"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Carrying Capacity (Kg)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingVehicle.capacityKg || 2500}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, capacityKg: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="e.g. 3000"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="vehActive"
                                    checked={editingVehicle.isActive !== false}
                                    onChange={(e) => setEditingVehicle({ ...editingVehicle, isActive: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="vehActive" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Active for daily despatch selection
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingVehicle(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    {isSaving ? 'Saving...' : 'Save Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DESTINATION ADD/EDIT */}
            {editingDestination && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {destinations.some(d => d.destinationId === editingDestination.destinationId) ? 'Edit Campus Destination' : 'Add New Campus Destination'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingDestination(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDestination} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Campus Name (परिसर का नाम) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingDestination.campusName || ''}
                                    onChange={(e) => setEditingDestination({ ...editingDestination, campusName: e.target.value })}
                                    className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="e.g. Shantivan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Short Code (शॉर्ट कोड)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingDestination.shortCode || ''}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, shortCode: e.target.value.toUpperCase() })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                                        placeholder="e.g. SV"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Location / City
                                    </label>
                                    <input
                                        type="text"
                                        value={editingDestination.address || ''}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, address: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="e.g. Abu Road"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Kitchen / Incharge Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingDestination.contactPerson || ''}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, contactPerson: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="e.g. Kitchen Coordinator"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingDestination.contactPhone || ''}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, contactPhone: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="e.g. 9829000000"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="destActive"
                                    checked={editingDestination.isActive !== false}
                                    onChange={(e) => setEditingDestination({ ...editingDestination, isActive: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="destActive" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Active for daily despatch selection
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingDestination(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    {isSaving ? 'Saving...' : 'Save Destination'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL WITH REFERENTIAL INTEGRITY SAFEGUARD */}
            {deletingEntity && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-3.5">
                        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {deletingEntity.isReferenced ? 'Archive Master Record?' : 'Delete Master Record?'}
                            </h3>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingEntity.name}</strong>?
                        </p>

                        {deletingEntity.isReferenced ? (
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                                <span className="font-bold block">Soft-Delete Safeguard Enforced:</span>
                                <span>This item is linked to existing/past challans. It will be <strong>archived (marked Inactive)</strong> to hide it from new entries while preserving all historical delivery slips and reports.</span>
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-500">
                                This item has not been referenced in any challans and will be removed permanently.
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingEntity(null)}
                                disabled={isDeleting}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm flex items-center gap-1.5"
                            >
                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                {isDeleting ? 'Processing...' : deletingEntity.isReferenced ? 'Archive Record' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
