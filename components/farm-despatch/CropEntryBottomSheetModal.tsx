import React, { useState, useEffect } from 'react';
import { FarmProduceMaster, FarmChallanItem, FarmPackagingUnit } from '../../types';
import { X, Check, Trash2, Plus, Minus, Scale, Package, IndianRupee } from 'lucide-react';
import { toast } from '../ui/Toast';

interface CropEntryBottomSheetModalProps {
    master: FarmProduceMaster;
    existingItem?: FarmChallanItem;
    isOpen: boolean;
    onClose: () => void;
    onSaveItem: (item: FarmChallanItem) => void;
    onRemoveItem?: (produceId: string) => void;
}

export const CropEntryBottomSheetModal: React.FC<CropEntryBottomSheetModalProps> = ({
    master,
    existingItem,
    isOpen,
    onClose,
    onSaveItem,
    onRemoveItem
}) => {
    const ratio = master.packagingRatioKg || 20;
    const [quantityKg, setQuantityKg] = useState<number | ''>(existingItem?.quantityKg || '');
    const [packagingCount, setPackagingCount] = useState<number | ''>(existingItem?.packagingCount || '');
    const [packagingUnit, setPackagingUnit] = useState<FarmPackagingUnit>(existingItem?.packagingUnit || master.defaultPackagingUnit || 'CRATE');
    const [ratePerKg, setRatePerKg] = useState<number | ''>(existingItem?.ratePerKg || '');

    useEffect(() => {
        if (isOpen) {
            setQuantityKg(existingItem?.quantityKg || '');
            setPackagingCount(existingItem?.packagingCount || '');
            setPackagingUnit(existingItem?.packagingUnit || master.defaultPackagingUnit || 'CRATE');
            setRatePerKg(existingItem?.ratePerKg || '');
        }
    }, [isOpen, existingItem, master]);

    if (!isOpen) return null;

    // When weight changes, auto-suggest packaging count if not manually entered
    const handleWeightChange = (newWeightStr: string) => {
        if (!newWeightStr) {
            setQuantityKg('');
            setPackagingCount('');
            return;
        }
        const val = parseFloat(newWeightStr);
        if (isNaN(val) || val < 0) {
            setQuantityKg('');
            return;
        }
        setQuantityKg(val);
        if (val > 0 && ratio > 0) {
            setPackagingCount(Math.ceil(val / ratio));
        }
    };

    const addQuickWeight = (delta: number) => {
        const current = typeof quantityKg === 'number' ? quantityKg : 0;
        const next = Math.max(0, current + delta);
        setQuantityKg(next);
        if (ratio > 0) {
            setPackagingCount(Math.ceil(next / ratio));
        }
    };

    const handleSave = () => {
        const finalKg = typeof quantityKg === 'number' ? quantityKg : 0;
        const finalCount = typeof packagingCount === 'number' ? packagingCount : (finalKg > 0 ? Math.ceil(finalKg / ratio) : 0);
        const finalRate = typeof ratePerKg === 'number' ? ratePerKg : undefined;

        if (finalKg <= 0) {
            toast.error('Please enter a valid weight.');
            return;
        }

        const updated: FarmChallanItem = {
            itemId: existingItem?.itemId || `ITM-${master.produceId}-${Date.now()}`,
            challanNo: existingItem?.challanNo || 'AUTO',
            srNo: existingItem?.srNo || 1,
            produceId: master.produceId,
            hindiName: master.hindiName,
            englishName: master.englishName,
            category: master.category,
            packagingUnit: packagingUnit,
            packagingCount: finalCount,
            packagingRatioKg: ratio,
            quantityKg: finalKg,
            ratePerKg: finalRate,
            estimatedValue: finalRate ? Math.round(finalKg * finalRate) : 0
        };

        onSaveItem(updated);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Zero Scroll Compact) */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                {master.hindiName}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                {master.category}
                            </span>
                        </div>
                        {master.englishName && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {master.englishName}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Compact Form Inputs - Designed to fit 100% without vertical scrolling) */}
                <div className="p-4 space-y-3.5">
                    {/* Weight (Kg) Input & Quick Delta Buttons */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                                Net Weight (कुल वजन - Kg) <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] text-slate-500 font-mono">
                                Ratio: ~{ratio} kg/{packagingUnit === 'CRATE' ? 'कैरेट' : packagingUnit}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const c = typeof quantityKg === 'number' ? quantityKg : 0;
                                    setQuantityKg(Math.max(0, c - 1));
                                    if (ratio > 0) setPackagingCount(Math.ceil(Math.max(0, c - 1) / ratio));
                                }}
                                className="p-2.5 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                                type="number"
                                autoFocus
                                min="0"
                                step="any"
                                placeholder="Enter net weight in kg (e.g. 50)"
                                value={quantityKg}
                                onChange={(e) => handleWeightChange(e.target.value)}
                                className="w-full text-lg font-mono font-bold px-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const c = typeof quantityKg === 'number' ? quantityKg : 0;
                                    setQuantityKg(c + 1);
                                    if (ratio > 0) setPackagingCount(Math.ceil((c + 1) / ratio));
                                }}
                                className="p-2.5 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Quick touch buttons */}
                        <div className="flex items-center gap-1.5 pt-1.5">
                            {[10, 25, 50, 100].map(addVal => (
                                <button
                                    key={addVal}
                                    type="button"
                                    onClick={() => addQuickWeight(addVal)}
                                    className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono transition-colors"
                                >
                                    +{addVal} kg
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => { setQuantityKg(''); setPackagingCount(''); }}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Packaging Count & Unit Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                                <Package className="w-3.5 h-3.5 text-emerald-600" />
                                Packaging Count
                            </label>
                            <div className="flex items-center h-10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const c = typeof packagingCount === 'number' ? packagingCount : 0;
                                        setPackagingCount(Math.max(0, c - 1));
                                    }}
                                    className="p-2.5 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    value={packagingCount}
                                    placeholder="Count"
                                    onChange={(e) => setPackagingCount(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                                    className="w-full h-10 text-center text-sm font-bold font-mono px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const c = typeof packagingCount === 'number' ? packagingCount : 0;
                                        setPackagingCount(c + 1);
                                    }}
                                    className="p-2.5 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                Packaging Type
                            </label>
                            <select
                                value={packagingUnit}
                                onChange={(e) => setPackagingUnit(e.target.value as FarmPackagingUnit)}
                                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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

                    {/* Optional Rate per Kg */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3 text-slate-400" />
                                Rate per Kg (₹/kg - Optional)
                            </label>
                            {typeof quantityKg === 'number' && typeof ratePerKg === 'number' && ratePerKg > 0 && (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                    Est. Value: ₹{(quantityKg * ratePerKg).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Mandi wholesale rate (e.g. 18)"
                            value={ratePerKg}
                            onChange={(e) => setRatePerKg(e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            className="w-full text-xs font-mono p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2">
                    {existingItem && onRemoveItem ? (
                        <button
                            type="button"
                            onClick={() => {
                                onRemoveItem(master.produceId);
                                onClose();
                            }}
                            className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 max-w-[200px] py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                        <Check className="w-4 h-4" />
                        {existingItem ? 'Update Produce' : 'Add to Challan'}
                    </button>
                </div>
            </div>
        </div>
    );
};
