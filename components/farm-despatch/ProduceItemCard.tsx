import React, { useState } from 'react';
import { FarmChallanItem, FarmPackagingUnit, FarmProduceCategory, FarmProduceMaster } from '../../types';
import { Trash2, Plus, Minus, Package, Scale, IndianRupee, HelpCircle } from 'lucide-react';

interface ProduceItemCardProps {
    item: FarmChallanItem;
    index: number;
    produceMasters: FarmProduceMaster[];
    onChange: (updated: FarmChallanItem) => void;
    onRemove: () => void;
}

const PACKAGING_OPTIONS: { value: FarmPackagingUnit; label: string; hindi: string }[] = [
    { value: 'CRATE', label: 'Crate', hindi: 'कैरेट' },
    { value: 'BAG', label: 'Bag', hindi: 'बोरी' },
    { value: 'BOX', label: 'Box', hindi: 'पेटी' },
    { value: 'BUNDLE', label: 'Bundle', hindi: 'गट्ठा' },
    { value: 'BASKET', label: 'Basket', hindi: 'टोकरी' },
    { value: 'LOOSE', label: 'Loose', hindi: 'खुला' }
];

export const ProduceItemCard: React.FC<ProduceItemCardProps> = ({
    item,
    index,
    produceMasters,
    onChange,
    onRemove
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter masters based on search
    const filteredMasters = produceMasters.filter(m => 
        m.isActive && (
            m.hindiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.englishName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleSelectProduce = (m: FarmProduceMaster) => {
        onChange({
            ...item,
            produceId: m.produceId,
            hindiName: m.hindiName,
            englishName: m.englishName,
            category: m.category,
            packagingUnit: m.defaultPackagingUnit || 'CRATE',
            packagingRatioKg: m.packagingRatioKg || 20,
            // Calculate initial weight suggestion if packagingCount > 0
            quantityKg: item.packagingCount > 0 && m.packagingRatioKg 
                ? item.packagingCount * m.packagingRatioKg 
                : item.quantityKg
        });
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const handleCountChange = (delta: number) => {
        const nextCount = Math.max(0, (item.packagingCount || 0) + delta);
        const ratio = item.packagingRatioKg || 20;
        const autoKg = nextCount > 0 && (!item.quantityKg || item.quantityKg === item.packagingCount * ratio)
            ? nextCount * ratio
            : item.quantityKg;
        
        const estVal = item.ratePerKg ? autoKg * item.ratePerKg : 0;

        onChange({
            ...item,
            packagingCount: nextCount,
            quantityKg: autoKg,
            estimatedValue: estVal
        });
    };

    const handleWeightChange = (weight: number) => {
        const estVal = item.ratePerKg ? weight * item.ratePerKg : 0;
        onChange({
            ...item,
            quantityKg: weight,
            estimatedValue: estVal
        });
    };

    const handleRateChange = (rate: number | undefined) => {
        const estVal = rate ? (item.quantityKg || 0) * rate : 0;
        onChange({
            ...item,
            ratePerKg: rate,
            estimatedValue: estVal
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3 transition-all hover:border-emerald-500/50">
            {/* Header: Item Sr No & Remove Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs font-mono">
                        {index + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Produce Item
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Produce Selection: Hindi Name & Dropdown */}
            <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Produce (सब्जी / फल / फूल) <span className="text-red-500">*</span>
                </label>
                
                {item.hindiName ? (
                    <div 
                        onClick={() => setIsDropdownOpen(true)}
                        className="cursor-pointer flex items-center justify-between p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 transition-colors"
                    >
                        <div>
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                                {item.hindiName}
                            </span>
                            {item.englishName && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                    ({item.englishName})
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Change
                        </span>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Type Hindi or English name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                )}

                {/* Dropdown List */}
                {isDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 divide-y divide-slate-100 dark:divide-slate-800">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                            <input
                                type="text"
                                placeholder="Filter 31 items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                autoFocus
                            />
                        </div>
                        {filteredMasters.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500">
                                No matching produce found.
                            </div>
                        ) : (
                            filteredMasters.map(m => (
                                <button
                                    key={m.produceId}
                                    type="button"
                                    onClick={() => handleSelectProduce(m)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center justify-between transition-colors"
                                >
                                    <div>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {m.hindiName}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                            {m.englishName}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-mono">
                                        Default: {m.defaultPackagingUnit}
                                    </span>
                                </button>
                            ))
                        )}
                        <div className="p-1 text-right">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(false)}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Packaging Unit & Count Row (Touch Stepper) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Packaging Unit Selector */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        Packaging Unit (पैकिंग)
                    </label>
                    <select
                        value={item.packagingUnit || 'CRATE'}
                        onChange={(e) => onChange({ ...item, packagingUnit: e.target.value as FarmPackagingUnit })}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                        {PACKAGING_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.hindi} ({opt.label})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Packaging Count Stepper */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Count ({item.packagingUnit || 'Crates'})
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => handleCountChange(-1)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
                            aria-label="Decrease count"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <input
                            type="number"
                            min="0"
                            value={item.packagingCount || ''}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                const ratio = item.packagingRatioKg || 20;
                                const autoKg = val > 0 && (!item.quantityKg || item.quantityKg === (item.packagingCount || 0) * ratio)
                                    ? val * ratio
                                    : item.quantityKg;
                                onChange({ 
                                    ...item, 
                                    packagingCount: val, 
                                    quantityKg: autoKg,
                                    estimatedValue: item.ratePerKg ? autoKg * item.ratePerKg : 0
                                });
                            }}
                            className="w-full text-center font-mono font-bold text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none py-1.5"
                            placeholder="0"
                        />
                        <button
                            type="button"
                            onClick={() => handleCountChange(1)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
                            aria-label="Increase count"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Net Quantity in Kg & Daily Rate (₹/kg) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Net Quantity in Kg */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-emerald-600" />
                            Net Weight (Kg) <span className="text-red-500">*</span>
                        </span>
                        {item.packagingRatioKg && item.packagingCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">
                                (~{item.packagingRatioKg} kg/unit)
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="e.g. 2240"
                            value={item.quantityKg || ''}
                            onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-mono font-bold p-2 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                            Kg
                        </span>
                    </div>
                </div>

                {/* Optional Daily Rate (₹/kg) - No static default per prompt! */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                        Daily Rate (₹/Kg) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Enter today's rate"
                            value={item.ratePerKg || ''}
                            onChange={(e) => handleRateChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full text-sm font-mono p-2 pr-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                            ₹/kg
                        </span>
                    </div>
                </div>
            </div>

            {/* Estimated Value Micro-Badge */}
            {item.quantityKg > 0 && item.ratePerKg && item.ratePerKg > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                    <span className="font-sans">Est. Item Value:</span>
                    <span className="font-bold">₹{((item.quantityKg || 0) * item.ratePerKg).toLocaleString('en-IN')}</span>
                </div>
            )}
        </div>
    );
};
