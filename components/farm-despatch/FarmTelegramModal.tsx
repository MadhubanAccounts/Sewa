import React, { useState } from 'react';
import { FarmChallan, FarmTelegramRecipient } from '../../types';
import { Send, X, Loader2, CheckCircle2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from '../ui/Toast';

interface FarmTelegramModalProps {
    challan: FarmChallan;
    recipients: FarmTelegramRecipient[];
    isOpen: boolean;
    onClose: () => void;
    onSendTelegram: (payload: {
        challan: FarmChallan;
        imageBase64?: string;
        chatIds: string[];
        customNote?: string;
    }) => Promise<{ success: boolean; error?: string }>;
}

export const FarmTelegramModal: React.FC<FarmTelegramModalProps> = ({
    challan,
    recipients,
    isOpen,
    onClose,
    onSendTelegram
}) => {
    // Track selection by unique recipientId to guarantee zero cross-toggling
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(() => {
        return recipients.filter(r => r.isDefault && r.isActive).map(r => r.recipientId);
    });
    const [customNote, setCustomNote] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachPhoto, setAttachPhoto] = useState(true);

    if (!isOpen) return null;

    const toggleRecipient = (recipientId: string) => {
        setSelectedRecipientIds(prev => 
            prev.includes(recipientId) ? prev.filter(id => id !== recipientId) : [...prev, recipientId]
        );
    };

    const handleSelectAll = () => {
        setSelectedRecipientIds(recipients.filter(r => r.isActive).map(r => r.recipientId));
    };

    const handleDeselectAll = () => {
        setSelectedRecipientIds([]);
    };

    const handleSend = async () => {
        if (selectedRecipientIds.length === 0) {
            toast.error('Please select at least one recipient group or contact');
            return;
        }

        // Map selected recipient IDs to their respective chatIds
        const targetChatIds = recipients
            .filter(r => selectedRecipientIds.includes(r.recipientId) && r.chatId)
            .map(r => r.chatId);

        if (targetChatIds.length === 0) {
            toast.error('Selected recipients have no valid Telegram chat IDs configured.');
            return;
        }

        setIsSending(true);
        try {
            let imageBase64: string | undefined = undefined;

            if (attachPhoto) {
                const element = document.getElementById('printable-challan-slip');
                if (element) {
                    try {
                        const canvas = await html2canvas(element, {
                            scale: 1.5,
                            useCORS: true,
                            backgroundColor: '#FFF5F7',
                            logging: false
                        });
                        imageBase64 = canvas.toDataURL('image/png');
                    } catch (canvasErr) {
                        console.warn('Canvas capture fallback:', canvasErr);
                    }
                }
            }

            const res = await onSendTelegram({
                challan,
                imageBase64,
                chatIds: targetChatIds,
                customNote: customNote.trim()
            });

            if (res.success) {
                onClose();
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to dispatch Telegram message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-sky-50/70 dark:bg-sky-950/30">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                            <Send className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Broadcast Challan #{challan.challanNo}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Send photo & produce report directly to Senior Telegram groups
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Summary Card */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Destination:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{challan.destinationCampus}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Vehicle & Driver:</span>
                            <span className="font-mono">{challan.vehicleNo} ({challan.driverName})</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Total Cargo:</span>
                            <span className="font-mono font-bold">{challan.totalQuantityKg} Kg ({challan.totalPackagingCount} Packages)</span>
                        </div>
                        {challan.totalEstimatedValue && challan.totalEstimatedValue > 0 ? (
                            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Estimated Value:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{challan.totalEstimatedValue.toLocaleString('en-IN')}</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Recipient Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Select Recipient Channels / Groups ({selectedRecipientIds.length}/{recipients.length}):
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {recipients.map(r => {
                                const isChecked = selectedRecipientIds.includes(r.recipientId);
                                return (
                                    <label
                                        key={r.recipientId}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                            isChecked
                                                ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleRecipient(r.recipientId)}
                                                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                                            />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{r.label}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">Role: {r.role} • ID: {r.recipientId}</div>
                                            </div>
                                        </div>
                                        {r.isDefault && (
                                            <span className="text-[10px] font-semibold bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Attachment Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    Attach Challan Slip Photo
                                </span>
                                <p className="text-[10px] text-slate-500">
                                    Auto-generates high-res image of the physical slip for instant viewing
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={attachPhoto}
                            onChange={(e) => setAttachPhoto(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                    </div>

                    {/* Custom Note */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Additional Note / Instructions (Optional):
                        </label>
                        <textarea
                            rows={2}
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder="e.g. Please unload at Shantivan central kitchen by 5:00 PM."
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSending}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || selectedRecipientIds.length === 0}
                        className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Transmitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Send Photo & Summary
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
