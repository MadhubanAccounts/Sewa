import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FarmChallan, 
    FarmChallanItem, 
    FarmProduceMaster, 
    FarmVehicle, 
    FarmDestination, 
    FarmReportFilters, 
    FarmReportRow, 
    FarmTelegramRecipient 
} from '../types';
import * as api from '../services/apiService';
import { useAuth } from './useAuth';
import { toast } from '../components/ui/Toast';

// Helper to convert number to words (English + Hindi phonetics)
export function numberToWordsHindi(num: number): string {
    if (!num || isNaN(num) || num <= 0) return 'शून्य (Zero)';

    const a = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 
               'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
    const b = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];

    function convertTwoDigits(n: number): string {
        if (n < 20) return a[n];
        const tens = Math.floor(n / 10);
        const rest = n % 10;
        return b[tens] + (rest > 0 ? ' ' + a[rest] : '');
    }

    let result = '';
    const crore = Math.floor(num / 10000000);
    let rem = num % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;
    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;
    const hundred = Math.floor(rem / 100);
    rem = rem % 100;

    if (crore > 0) result += convertTwoDigits(crore) + ' करोड़ ';
    if (lakh > 0) result += convertTwoDigits(lakh) + ' लाख ';
    if (thousand > 0) result += convertTwoDigits(thousand) + ' हजार ';
    if (hundred > 0) result += a[hundred] + ' सौ ';
    if (rem > 0) result += convertTwoDigits(rem) + ' ';

    return result.trim() + ' के.जी.';
}

export function useFarmDespatch() {
    const { user, hasPermission } = useAuth();
    const sessionId = user?.sessionId;

    const [produceMasters, setProduceMasters] = useState<FarmProduceMaster[]>([]);
    const [vehicles, setVehicles] = useState<FarmVehicle[]>([]);
    const [destinations, setDestinations] = useState<FarmDestination[]>([]);
    const [challans, setChallans] = useState<FarmChallan[]>([]);
    const [telegramRecipients, setTelegramRecipients] = useState<FarmTelegramRecipient[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Load
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [prodRes, vehRes, destRes, chalRes, tgRes] = await Promise.all([
                api.getFarmProduceMasters(sessionId).catch(() => ({ success: true, items: [] })),
                api.getFarmVehicles(sessionId).catch(() => ({ success: true, vehicles: [] })),
                api.getFarmDestinations(sessionId).catch(() => ({ success: true, destinations: [] })),
                api.getFarmChallans(sessionId).catch(() => ({ success: true, challans: [] })),
                api.getFarmTelegramRecipients(sessionId).catch(() => ({ success: true, recipients: [] }))
            ]);

            if (prodRes.items) setProduceMasters(prodRes.items);
            if (vehRes.vehicles) setVehicles(vehRes.vehicles);
            if (destRes.destinations) setDestinations(destRes.destinations);
            if (chalRes.challans) setChallans(chalRes.challans);
            if (tgRes.recipients) setTelegramRecipients(tgRes.recipients);
        } catch (err: any) {
            console.error('[Farm Hook] Error loading data:', err);
            setError(err?.message || 'Failed to load farm produce records');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Permissions check - Strictly 100% Permission-Based Access Control (No role bypasses)
    const permissions = useMemo(() => {
        return {
            canViewDespatch: hasPermission('farm_despatch_view'),
            canAdd: hasPermission('farm_entry_add'),
            canEdit: hasPermission('farm_entry_edit'),
            canDelete: hasPermission('farm_entry_delete'),
            canPrint: hasPermission('farm_entry_print'),
            canSendTelegram: hasPermission('farm_telegram_send'),
            canFetchAiRate: hasPermission('farm_ai_rate_fetch'),
            canViewReports: hasPermission('farm_report_view'),
            canManageMasters: hasPermission('farm_admin_manage'),
            isAdmin: hasPermission('farm_admin_manage') // Kept for backwards compatibility
        };
    }, [hasPermission]);

    // Save Challan
    const saveChallan = async (challan: Partial<FarmChallan>) => {
        setSaving(true);
        try {
            const res = await api.saveFarmChallan(challan, sessionId);
            if (res.success) {
                toast.success(res.message || `Challan #${res.challanNo} saved successfully!`);
                await loadAllData();
                return { success: true, challanNo: res.challanNo };
            } else {
                toast.error(res.message || 'Failed to save challan');
                return { success: false, error: res.message };
            }
        } catch (err: any) {
            const msg = err?.message || 'Error occurred while saving challan';
            toast.error(msg);
            return { success: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

    // Delete Challan with validation
    const deleteChallan = async (challanNo: string, reason: string) => {
        const target = challans.find(c => c.challanNo === challanNo);
        if (target) {
            if (target.isAudited) {
                toast.error('Deletion Blocked: This challan has already been verified by auditors.');
                return { success: false, error: 'Audited record' };
            }
            if (target.telegramSentAt) {
                toast.error('Deletion Blocked: Telegram delivery notice was already broadcasted to senior groups.');
                return { success: false, error: 'Telegram sent' };
            }
            if (target.status === 'DELIVERED') {
                toast.error('Deletion Blocked: Challan has already been marked as DELIVERED by receiving campus.');
                return { success: false, error: 'Delivered record' };
            }
        }

        setDeleting(true);
        try {
            const res = await api.deleteFarmChallan(challanNo, reason, sessionId);
            if (res.success) {
                toast.success(res.message || `Challan #${challanNo} deleted successfully.`);
                setChallans(prev => prev.filter(c => c.challanNo !== challanNo));
                return { success: true };
            } else {
                toast.error(res.error || res.message || 'Failed to delete challan');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            const msg = err?.message || 'Error deleting challan';
            toast.error(msg);
            return { success: false, error: msg };
        } finally {
            setDeleting(false);
        }
    };

    // Save Master Produce Item
    const saveProduceMaster = async (item: Partial<FarmProduceMaster>) => {
        setSaving(true);
        try {
            const res = await api.saveFarmProduceMaster(item, sessionId);
            if (res.success) {
                toast.success(res.message || `Produce "${item.hindiName}" saved successfully.`);
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to save produce item');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error saving produce item');
            return { success: false };
        } finally {
            setSaving(false);
        }
    };

    // Delete Master Produce Item (with soft-delete safeguard)
    const deleteProduceMaster = async (produceId: string) => {
        setDeleting(true);
        try {
            const res = await api.deleteFarmProduceMaster(produceId, sessionId);
            if (res.success) {
                toast.success(res.message || 'Produce item deleted.');
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to delete produce item');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error deleting produce item');
            return { success: false };
        } finally {
            setDeleting(false);
        }
    };

    // Save Farm Vehicle
    const saveVehicle = async (vehicle: Partial<FarmVehicle>) => {
        setSaving(true);
        try {
            const res = await api.saveFarmVehicle(vehicle, sessionId);
            if (res.success) {
                toast.success(res.message || `Vehicle "${vehicle.vehicleNo}" saved successfully.`);
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to save vehicle');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error saving vehicle');
            return { success: false };
        } finally {
            setSaving(false);
        }
    };

    // Delete Farm Vehicle (with soft-delete safeguard)
    const deleteVehicle = async (vehicleId: string) => {
        setDeleting(true);
        try {
            const res = await api.deleteFarmVehicle(vehicleId, sessionId);
            if (res.success) {
                toast.success(res.message || 'Vehicle record updated.');
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to delete vehicle');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error deleting vehicle');
            return { success: false };
        } finally {
            setDeleting(false);
        }
    };

    // Save Farm Destination
    const saveDestination = async (destination: Partial<FarmDestination>) => {
        setSaving(true);
        try {
            const res = await api.saveFarmDestination(destination, sessionId);
            if (res.success) {
                toast.success(res.message || `Destination "${destination.campusName}" saved successfully.`);
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to save destination');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error saving destination');
            return { success: false };
        } finally {
            setSaving(false);
        }
    };

    // Delete Farm Destination (with soft-delete safeguard)
    const deleteDestination = async (destinationId: string) => {
        setDeleting(true);
        try {
            const res = await api.deleteFarmDestination(destinationId, sessionId);
            if (res.success) {
                toast.success(res.message || 'Destination record updated.');
                await loadAllData();
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to delete destination');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error deleting destination');
            return { success: false };
        } finally {
            setDeleting(false);
        }
    };

    // Broadcast Telegram
    const broadcastTelegram = async (payload: {
        challan: FarmChallan;
        imageBase64?: string;
        chatIds: string[];
        customNote?: string;
    }) => {
        setBroadcasting(true);
        try {
            const res = await api.sendFarmChallanTelegram(payload, sessionId);
            if (res.success) {
                toast.success('Challan image broadcasted to Telegram senior groups!');
                // Mark locally as telegram sent
                setChallans(prev => prev.map(c => 
                    c.challanNo === payload.challan.challanNo 
                        ? { ...c, telegramSentAt: res.sentAt || new Date().toISOString() } 
                        : c
                ));
                return { success: true };
            } else {
                toast.error(res.error || 'Failed to send Telegram broadcast');
                return { success: false, error: res.error };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Network error sending Telegram notification');
            return { success: false };
        } finally {
            setBroadcasting(false);
        }
    };

    // Fetch Custom Reports
    const fetchReports = async (filters: FarmReportFilters) => {
        setLoading(true);
        try {
            const res = await api.getFarmReports(filters, sessionId);
            return res;
        } catch (err: any) {
            toast.error(err?.message || 'Error generating reports');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Force Seed / Re-seed Farm Masters into Google Sheet
    const [seeding, setSeeding] = useState(false);
    const seedFarmMasters = async (force = true) => {
        setSeeding(true);
        try {
            const res = await api.seedFarmProduceMasters(force, sessionId);
            if (res.success) {
                toast.success(res.message || 'Farm produce items and masters successfully seeded!');
                await loadAllData();
                return { success: true };
            } else {
                toast.error('Failed to seed farm produce items');
                return { success: false };
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error seeding farm masters');
            return { success: false };
        } finally {
            setSeeding(false);
        }
    };

    return {
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
        error,
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
    };
}
