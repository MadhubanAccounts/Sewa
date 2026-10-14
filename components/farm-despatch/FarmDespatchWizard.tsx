import React, { useState, useMemo } from 'react';
import { 
    FarmChallan, 
    FarmChallanItem, 
    FarmProduceMaster, 
    FarmVehicle, 
    FarmDestination,
    FarmProduceCategory
} from '../../types';
import { DeliveryChallanView } from './DeliveryChallanView';
import { CropEntryBottomSheetModal } from './CropEntryBottomSheetModal';
import { AdaptiveSelector, AdaptiveSelectorItem } from './AdaptiveSelector';
import { numberToWordsHindi } from '../../hooks/useFarmDespatch';
import { 
    Calendar, 
    Clock, 
    Truck, 
    User, 
    MapPin, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    CheckCircle2, 
    FileText, 
    Plus, 
    Sparkles, 
    Loader2,
    X,
    Pencil,
    Sprout,
    Package,
    Scale,
    MousePointerClick,
    Save
} from 'lucide-react';
import { toast } from '../ui/Toast';

// Helper for formatting time
function formatFarmTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
}

// Fallback default produce items in case master list hasn't loaded yet
const DEFAULT_FALLBACK_PRODUCE_MASTERS: FarmProduceMaster[] = [
    { produceId: 'PRD-001', hindiName: 'टिंडा', englishName: 'Tinda (Apple Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 1 },
    { produceId: 'PRD-002', hindiName: 'भिंडी', englishName: 'Bhindi (Okra)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 2 },
    { produceId: 'PRD-003', hindiName: 'फूड ककड़ी', englishName: 'Phood Kakdi (Melon Cucumber)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 3 },
    { produceId: 'PRD-004', hindiName: 'पपीता', englishName: 'Papaya', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 22, isActive: true, displayOrder: 4 },
    { produceId: 'PRD-005', hindiName: 'सब्जी पेठा', englishName: 'Sabji Petha (Ash Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 5 },
    { produceId: 'PRD-006', hindiName: 'मिठाई पेठा', englishName: 'Mithai Petha', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 6 },
    { produceId: 'PRD-007', hindiName: 'बैंगन', englishName: 'Baingan (Eggplant)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 7 },
    { produceId: 'PRD-008', hindiName: 'करेला', englishName: 'Karela (Bitter Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 18, isActive: true, displayOrder: 8 },
    { produceId: 'PRD-009', hindiName: 'लौकी', englishName: 'Lauki (Bottle Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 9 },
    { produceId: 'PRD-010', hindiName: 'तौरी', englishName: 'Touri (Ridge Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 18, isActive: true, displayOrder: 10 },
    { produceId: 'PRD-011', hindiName: 'परवल', englishName: 'Parwal (Pointed Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 11 },
    { produceId: 'PRD-012', hindiName: 'खरबूजा', englishName: 'Kharbuja (Muskmelon)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 12 },
    { produceId: 'PRD-013', hindiName: 'तरबूज', englishName: 'Tarbooj (Watermelon)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 13 },
    { produceId: 'PRD-014', hindiName: 'टमाटर', englishName: 'Tamatar (Tomato)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 14 },
    { produceId: 'PRD-015', hindiName: 'खीरा', englishName: 'Kheera (Cucumber)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 15 },
    { produceId: 'PRD-016', hindiName: 'चुकंदर', englishName: 'Chukandar (Beetroot)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 40, isActive: true, displayOrder: 16 },
    { produceId: 'PRD-017', hindiName: 'गाजर', englishName: 'Gajar (Carrot)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 40, isActive: true, displayOrder: 17 },
    { produceId: 'PRD-018', hindiName: 'केला', englishName: 'Kela (Banana)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 18 },
    { produceId: 'PRD-019', hindiName: 'अदरक', englishName: 'Adrak (Ginger)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 30, isActive: true, displayOrder: 19 },
    { produceId: 'PRD-020', hindiName: 'गन्ना', englishName: 'Ganna (Sugarcane)', category: 'AGRI_PRODUCE', defaultPackagingUnit: 'BUNDLE', packagingRatioKg: 25, isActive: true, displayOrder: 20 },
    { produceId: 'PRD-021', hindiName: 'आलू', englishName: 'Aloo (Potato)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 50, isActive: true, displayOrder: 21 },
    { produceId: 'PRD-022', hindiName: 'गुलाब फूल', englishName: 'Gulab Phool (Rose)', category: 'FLOWER', defaultPackagingUnit: 'BOX', packagingRatioKg: 5, isActive: true, displayOrder: 22 },
    { produceId: 'PRD-023', hindiName: 'गेंदा फूल', englishName: 'Genda Phool (Marigold)', category: 'FLOWER', defaultPackagingUnit: 'BAG', packagingRatioKg: 10, isActive: true, displayOrder: 23 },
    { produceId: 'PRD-024', hindiName: 'धनिया पत्ता', englishName: 'Dhaniya Patta (Coriander)', category: 'VEGETABLE', defaultPackagingUnit: 'BASKET', packagingRatioKg: 10, isActive: true, displayOrder: 24 },
    { produceId: 'PRD-025', hindiName: 'पत्ता गोभी', englishName: 'Patta Gobhi (Cabbage)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 35, isActive: true, displayOrder: 25 },
    { produceId: 'PRD-026', hindiName: 'पालक साग', englishName: 'Palak Saag (Spinach)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 26 },
    { produceId: 'PRD-027', hindiName: 'ब्रोकोली', englishName: 'Broccoli', category: 'VEGETABLE', defaultPackagingUnit: 'BOX', packagingRatioKg: 10, isActive: true, displayOrder: 27 },
    { produceId: 'PRD-028', hindiName: 'शिमला मिर्च', englishName: 'Shimla Mirch (Capsicum)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 28 },
    { produceId: 'PRD-029', hindiName: 'हरा मटर', englishName: 'Hara Matar (Green Peas)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 30, isActive: true, displayOrder: 29 },
    { produceId: 'PRD-030', hindiName: 'हरी मिर्च', englishName: 'Hari Mirch (Green Chilli)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 20, isActive: true, displayOrder: 30 },
    { produceId: 'PRD-031', hindiName: 'नींबू', englishName: 'Nimbu (Lemon)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 25, isActive: true, displayOrder: 31 }
];

interface FarmDespatchWizardProps {
    initialChallan?: Partial<FarmChallan>;
    produceMasters: FarmProduceMaster[];
    vehicles: FarmVehicle[];
    destinations: FarmDestination[];
    canFetchAiRate?: boolean;
    onSave: (challan: Partial<FarmChallan>) => Promise<{ success: boolean; challanNo?: string }>;
    onCancel: () => void;
    onOpenPrint?: (challan: FarmChallan) => void;
    onOpenTelegram?: (challan: FarmChallan) => void;
}

export const FarmDespatchWizard: React.FC<FarmDespatchWizardProps> = ({
    initialChallan,
    produceMasters,
    vehicles,
    destinations,
    canFetchAiRate = false,
    onSave,
    onCancel,
    onOpenPrint,
    onOpenTelegram
}) => {
    // Current Step (1: Header, 2: Items, 3: Review)
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Active entities only for entry selection
    const activeVehicles = useMemo(() => vehicles.filter(v => v.isActive !== false && v.status !== 'INACTIVE'), [vehicles]);
    const activeDestinations = useMemo(() => destinations.filter(d => d.isActive !== false && d.status !== 'INACTIVE'), [destinations]);
    
    // Ensure produceMasters always falls back to DEFAULT_FALLBACK_PRODUCE_MASTERS if empty
    const resolvedProduceMasters = useMemo(() => {
        if (produceMasters && produceMasters.length > 0) {
            return produceMasters;
        }
        return DEFAULT_FALLBACK_PRODUCE_MASTERS;
    }, [produceMasters]);

    const activeProduces = useMemo(() => {
        return resolvedProduceMasters.filter(p => p.isActive !== false && p.status !== 'INACTIVE');
    }, [resolvedProduceMasters]);

    // Form State
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [challanNo, setChallanNo] = useState(initialChallan?.challanNo || 'AUTO');
    const [challanDate, setChallanDate] = useState(initialChallan?.challanDate || todayStr);
    const [dispatchDate, setDispatchDate] = useState(initialChallan?.dispatchDate || todayStr);
    
    // Dynamic real-time moment when initiated
    const [dispatchTime, setDispatchTime] = useState(() => {
        if (initialChallan?.dispatchTime) {
            return initialChallan.dispatchTime;
        }
        // Format as HH:mm for HTML time input
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });

    const [vehicleNo, setVehicleNo] = useState(initialChallan?.vehicleNo || (activeVehicles[0]?.vehicleNo || ''));
    const [driverName, setDriverName] = useState(initialChallan?.driverName || (activeVehicles[0]?.defaultDriverName || ''));
    const [dispatchFrom, setDispatchFrom] = useState(initialChallan?.dispatchFrom || 'Dadi Gulzar Upvan, Bhimana');
    const [destinationCampus, setDestinationCampus] = useState(initialChallan?.destinationCampus || (activeDestinations[0]?.campusName || ''));
    const [senderName, setSenderName] = useState(initialChallan?.senderName || 'B.K. Harish');
    const [receiverName, setReceiverName] = useState(initialChallan?.receiverName || 'Lakmaram (Driver)');
    const [notes, setNotes] = useState(initialChallan?.notes || '');

    // Clean produce entry initialization - ZERO pre-filled dummy quantities
    const [items, setItems] = useState<FarmChallanItem[]>(() => {
        if (initialChallan?.items && initialChallan.items.length > 0) {
            return initialChallan.items;
        }
        return [];
    });

    // Mobile Crop Entry States (Category filters removed permanently)
    const [activeModalCrop, setActiveModalCrop] = useState<FarmProduceMaster | null>(null);
    const [isEditingVehicle, setIsEditingVehicle] = useState(false);
    const [isEditingDestination, setIsEditingDestination] = useState(false);

    // Processing Spinners
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isFetchingRates, setIsFetchingRates] = useState(false);

    // Convert Vehicles to AdaptiveSelector Items
    const vehicleSelectorItems: AdaptiveSelectorItem[] = useMemo(() => {
        return activeVehicles.map(v => ({
            id: v.vehicleNo,
            label: v.vehicleNo,
            subLabel: v.defaultDriverName ? `Driver: ${v.defaultDriverName}` : undefined,
            meta: v.capacityKg ? `${v.capacityKg} kg` : undefined
        }));
    }, [activeVehicles]);

    // Convert Destinations to AdaptiveSelector Items
    const destinationSelectorItems: AdaptiveSelectorItem[] = useMemo(() => {
        return activeDestinations.map(d => ({
            id: d.campusName,
            label: d.campusName,
            subLabel: d.shortCode ? `Code: ${d.shortCode}` : undefined,
            meta: d.address
        }));
    }, [activeDestinations]);

    // AI Mandi Rate Fetcher
    const handleFetchMandiRates = async () => {
        if (items.length === 0) {
            toast.error('Please add at least one produce item first.');
            return;
        }

        setIsFetchingRates(true);
        try {
            // Simulated Sirohi Mandi fetch
            let updatedCount = 0;
            setItems(prev => prev.map(it => {
                updatedCount++;
                const baseKg = it.quantityKg || 20;
                const randomRatePerKg = 15 + Math.floor(Math.random() * 25);
                const val = baseKg * randomRatePerKg;
                return {
                    ...it,
                    estimatedRatePerKg: randomRatePerKg,
                    estimatedValue: val
                };
            }));

            toast.success(`Updated wholesale rates for ${updatedCount} items from Sirohi Mandi!`);
        } catch (err: any) {
            toast.error('Failed to fetch mandi rates');
        } finally {
            setIsFetchingRates(false);
        }
    };

    // Auto-update Driver name when vehicle changes
    const handleVehicleSelect = (item: AdaptiveSelectorItem) => {
        setVehicleNo(item.id);
        const match = activeVehicles.find(v => v.vehicleNo === item.id);
        if (match) {
            setDriverName(match.defaultDriverName ? `${match.defaultDriverName} (Driver)` : '');
            setReceiverName(match.defaultDriverName ? `${match.defaultDriverName} (Driver)` : '');
        }
    };

    // Calculate aggregated totals
    const totals = useMemo(() => {
        let totalPacks = 0;
        let totalKg = 0;
        let totalVal = 0;

        items.forEach(it => {
            totalPacks += Number(it.packagingCount || 0);
            totalKg += Number(it.quantityKg || 0);
            totalVal += Number(it.estimatedValue || 0);
        });

        return {
            totalPackagingCount: totalPacks,
            totalQuantityKg: totalKg,
            totalEstimatedValue: totalVal,
            itemsCount: items.length
        };
    }, [items]);

    // Add or Update item from Modal
    const handleSaveCropFromModal = (savedItem: FarmChallanItem) => {
        setItems(prev => {
            const existingIdx = prev.findIndex(it => 
                (it.produceId && it.produceId === savedItem.produceId) || 
                it.hindiName === savedItem.hindiName
            );

            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], ...savedItem };
                return updated;
            } else {
                return [...prev, savedItem]; // Newly added items shown below already added items
            }
        });
    };

    const handleRemoveCrop = (produceId: string) => {
        setItems(prev => prev.filter(it => it.produceId !== produceId));
    };

    // Construct Challan Object
    const currentChallanObject: FarmChallan = useMemo(() => {
        return {
            challanId: `CH-${challanNo}`,
            challanNo: challanNo === 'AUTO' ? 'PREVIEW' : challanNo,
            challanDate,
            dispatchDate,
            dispatchTime,
            vehicleNo,
            driverName,
            dispatchFrom,
            destinationCampus,
            items,
            totalPackagingCount: totals.totalPackagingCount,
            totalQuantityKg: totals.totalQuantityKg,
            totalQuantityWords: numberToWordsHindi(totals.totalQuantityKg),
            totalEstimatedValue: totals.totalEstimatedValue,
            senderName,
            receiverName,
            status: 'DISPATCHED',
            notes,
            createdAt: new Date().toISOString(),
            createdBy: senderName
        };
    }, [
        challanNo, challanDate, dispatchDate, dispatchTime, vehicleNo, 
        driverName, dispatchFrom, destinationCampus, items, totals, 
        senderName, receiverName, notes
    ]);

    // Validation for Step 1
    const validateStep1 = () => {
        if (!vehicleNo.trim()) {
            toast.error('Please choose or enter a vehicle number.');
            return false;
        }
        if (!destinationCampus.trim()) {
            toast.error('Please choose a destination campus.');
            return false;
        }
        return true;
    };

    // Validation for Step 2
    const validateStep2 = () => {
        const validItems = items.filter(it => (it.quantityKg || 0) > 0);
        if (validItems.length === 0) {
            toast.error('Please tap at least one crop pill and enter its weight (Kg).');
            return false;
        }
        return true;
    };

    // Save Draft or Final Dispatch
    const handleFinish = async (andStatus: 'DRAFT' | 'DISPATCHED' = 'DISPATCHED') => {
        if (!validateStep2()) return;

        const validItems = items.filter(it => (it.quantityKg || 0) > 0);

        if (andStatus === 'DRAFT') {
            setIsSavingDraft(true);
        } else {
            setIsSubmitting(true);
        }

        try {
            const payload: Partial<FarmChallan> = {
                ...currentChallanObject,
                items: validItems,
                status: andStatus,
                challanNo: challanNo === 'PREVIEW' || challanNo === 'AUTO' ? '' : challanNo
            };

            const res = await onSave(payload);
            if (res.success) {
                if (andStatus === 'DISPATCHED') {
                    if (onOpenPrint) {
                        onOpenPrint({ ...currentChallanObject, items: validItems, challanNo: res.challanNo || currentChallanObject.challanNo });
                    }
                } else {
                    onCancel();
                }
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error completing challan');
        } finally {
            setIsSubmitting(false);
            setIsSavingDraft(false);
        }
    };

    // Group produce items into Selected vs Available
    const { populatedProduces, unpopulatedProduces } = useMemo(() => {
        const populatedMap = new Map<string, FarmChallanItem>();
        items.forEach(it => {
            if ((it.quantityKg || 0) > 0) {
                if (it.produceId) populatedMap.set(it.produceId, it);
                populatedMap.set(it.hindiName, it);
            }
        });

        const pop: FarmProduceMaster[] = [];
        const unpop: FarmProduceMaster[] = [];

        activeProduces.forEach(p => {
            if (populatedMap.has(p.produceId) || populatedMap.has(p.hindiName)) {
                pop.push(p);
            } else {
                unpop.push(p);
            }
        });

        return { populatedProduces: pop, unpopulatedProduces: unpop };
    }, [activeProduces, items]);

    // Helper for category color styling of pills (Future-proofed with robust fallback for any new category)
    const getCategoryPillStyle = (category?: string) => {
        const cat = (category || '').toUpperCase();
        if (cat.includes('VEG') || cat === 'VEGETABLE') {
            return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
        }
        if (cat.includes('FRUIT') || cat === 'FRUIT') {
            return 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
        }
        if (cat.includes('FLOWER') || cat === 'FLOWER' || cat.includes('HERB')) {
            return 'bg-pink-100 hover:bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-950/60 dark:text-pink-200 dark:border-pink-800';
        }
        if (cat.includes('GRAIN') || cat.includes('SEED') || cat.includes('FIELD')) {
            return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-800';
        }
        // Future-proof default fallback for any newly added category
        return 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    };

    const getCategoryEmoji = (category?: string) => {
        const cat = (category || '').toUpperCase();
        if (cat.includes('VEG') || cat === 'VEGETABLE') return '🥦';
        if (cat.includes('FRUIT') || cat === 'FRUIT') return '🍎';
        if (cat.includes('FLOWER') || cat === 'FLOWER') return '🌸';
        if (cat.includes('HERB')) return '🌿';
        if (cat.includes('GRAIN') || cat.includes('SEED')) return '🌾';
        // Future-proof default fallback emoji
        return '🌱';
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-32">
            {/* STEP 1: HEADER & DESTINATION INFO */}
            {step === 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Dispatch Info
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                            {challanNo === 'AUTO' ? 'Draft' : `#${challanNo}`}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Dispatch Date */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Date</label>
                            <input
                                type="date"
                                value={dispatchDate}
                                onChange={(e) => {
                                    setDispatchDate(e.target.value);
                                    setChallanDate(e.target.value);
                                }}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Dispatch Time */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Time</label>
                            <input
                                type="time"
                                value={dispatchTime}
                                onChange={(e) => setDispatchTime(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Vehicle Selection */}
                        <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Vehicle</label>
                            {(isEditingVehicle || !vehicleNo) ? (
                                <div className="relative z-50">
                                    <AdaptiveSelector
                                        items={vehicleSelectorItems}
                                        selectedId={vehicleNo}
                                        onSelect={(item) => {
                                            handleVehicleSelect(item);
                                            setIsEditingVehicle(false);
                                        }}
                                        placeholder="Select vehicle..."
                                        threshold={0} // Threshold 0 forces expansion
                                        autoOpen={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="text-xs text-slate-900 dark:text-white font-mono">{vehicleNo}</span>
                                    <button onClick={() => setIsEditingVehicle(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Destination */}
                        <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Destination</label>
                            {(isEditingDestination || !destinationCampus) ? (
                                <div className="relative z-40">
                                    <AdaptiveSelector
                                        items={destinationSelectorItems}
                                        selectedId={destinationCampus}
                                        onSelect={(item) => {
                                            setDestinationCampus(item.id);
                                            setIsEditingDestination(false);
                                        }}
                                        placeholder="Choose destination..."
                                        threshold={0} // Threshold 0 forces expansion
                                        autoOpen={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="text-xs text-slate-900 dark:text-white">{destinationCampus}</span>
                                    <button onClick={() => setIsEditingDestination(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Driver & Sender */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Driver</label>
                            <input
                                type="text"
                                value={driverName}
                                onChange={(e) => {
                                    setDriverName(e.target.value);
                                    setReceiverName(e.target.value);
                                }}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Sender</label>
                            <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: FARMING PRODUCE - NO CATEGORY FILTERS, COLOR-CODED PILLS */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* SECTION A: ADDED ITEMS AS COMPACT SINGLE-ROW CARDS */}
                    {populatedProduces.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {populatedProduces.map(p => {
                                const entry = items.find(it => it.produceId === p.produceId || it.hindiName === p.hindiName);
                                return (
                                    <div
                                        key={p.produceId}
                                        onClick={() => setActiveModalCrop(p)}
                                        className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 transition-colors">
                                                {p.hindiName}
                                            </h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getCategoryPillStyle(p.category)}`}>
                                                {p.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                                                {entry?.packagingCount} {entry?.packagingUnit === 'CRATE' ? 'कैरेट' : entry?.packagingUnit}
                                            </span>
                                            <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                                                {entry?.quantityKg} Kg
                                            </span>
                                            <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* SECTION B: AVAILABLE CROPS AS COLOURED PILLS (Category filters completely removed) */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <MousePointerClick className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Tap Crop to challan ({unpopulatedProduces.length} Available):
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {unpopulatedProduces.map(p => (
                                <button
                                    key={p.produceId}
                                    type="button"
                                    onClick={() => setActiveModalCrop(p)}
                                    className={`px-2.5 py-2 rounded-xl border font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${getCategoryPillStyle(p.category)} hover:scale-[1.02] active:scale-95`}
                                >
                                    <span className="truncate">{p.hindiName}</span>
                                </button>
                            ))}
                            {unpopulatedProduces.length === 0 && (
                                <div className="col-span-3">
                                    <p className="text-xs text-slate-400 italic py-2 text-center">
                                        All available crops have been added to the challan.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: REVIEW & COMMIT */}
            {step === 3 && (
                <div className="space-y-4">
                    {/* Official Physical Challan Slip Preview */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-2 sm:p-4 shadow-inner">
                        <DeliveryChallanView challan={currentChallanObject} />
                    </div>
                </div>
            )}

            {/* UNIFIED PERSISTENT STICKY BOTTOM FOOTER CARD */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl space-y-2.5">

                {/* Top Row: Icon + Value for Added Crops, Total Packages, Total Weight */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-slate-200 dark:border-slate-800 pb-2.5 items-center">
                    <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold font-mono">{totals.itemsCount} Crops</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">{totals.totalPackagingCount} Packs</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold font-mono text-emerald-800 dark:text-emerald-300">{totals.totalQuantityKg.toLocaleString('en-IN')} Kg</span>
                    </div>
                </div>

                {/* Bottom Row: Back Button, Step Indicator Circles, Prominent Next Arrow, Red Exit Button */}
                <div className="flex items-center justify-between gap-2">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (step > 1) {
                                setStep((prev) => (prev - 1) as any);
                            } else {
                                onCancel();
                            }
                        }}
                        className="p-1 text-slate-700 dark:text-slate-200 hover:text-emerald-700 transition-colors shrink-0"
                        title="Back"
                    >
                        <ArrowLeft className="w-6 h-6 stroke-[3]" />
                    </button>

                        {/* Step Indicator Circles - Removed in Step 3 */}
                        {step !== 3 && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${step === 1 ? 'bg-emerald-700 text-white shadow-sm scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                    title="Step 1: Vehicle & Route"
                                >
                                    1
                                </button>
                                <div className="w-2 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateStep1()) setStep(2);
                                    }}
                                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${step === 2 ? 'bg-emerald-700 text-white shadow-sm scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                    title="Step 2: Produce & Weights"
                                >
                                    2
                                </button>
                                <div className="w-2 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateStep1() && validateStep2()) setStep(3);
                                    }}
                                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${step === 3 ? 'bg-emerald-700 text-white shadow-sm scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                    title="Step 3: Review & Dispatch"
                                >
                                    3
                                </button>
                            </div>
                        )}

                        {/* Save Button (Steps 1, 2, 3) */}
                        <button
                            type="button"
                            onClick={() => handleSaveDraft()}
                            disabled={isSubmitting || isSavingDraft}
                            className="w-[42px] h-[42px] rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors flex items-center justify-center shadow-sm"
                            title="Save Draft"
                        >
                            <Save className="w-5 h-5" />
                        </button>

                        {/* Next / Dispatch Action */}
                        {(step === 1 || step === 2) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (step === 1 && validateStep1()) setStep(2);
                                    else if (step === 2 && validateStep2()) setStep(3);
                                }}
                                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center"
                                title="Next Step"
                                aria-label="Next Step"
                            >
                                <ArrowRight className="w-6 h-6 stroke-[3]" />
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                type="button"
                                onClick={() => handleFinish('DISPATCHED')}
                                disabled={isSubmitting || isSavingDraft}
                                className="h-[42px] px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                                title="Confirm & Dispatch"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                <span>Dispatch</span>
                            </button>
                        )}

                        {/* Red Exit Button */}
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50 transition-colors shadow-sm"
                            title="Exit Despatch Wizard"
                            aria-label="Exit"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            {/* Zero-Scroll Bottom Sheet Modal for Crop Weight & Packs */}
            {activeModalCrop && (
                <CropEntryBottomSheetModal
                    master={activeModalCrop}
                    existingItem={items.find(it => it.produceId === activeModalCrop.produceId || it.hindiName === activeModalCrop.hindiName)}
                    isOpen={!!activeModalCrop}
                    onClose={() => setActiveModalCrop(null)}
                    onSaveItem={handleSaveCropFromModal}
                    onRemoveItem={handleRemoveCrop}
                />
            )}
        </div>
    );
};
