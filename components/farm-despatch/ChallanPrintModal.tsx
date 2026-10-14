import React, { useRef, useState } from 'react';
import { FarmChallan } from '../../types';
import { DeliveryChallanView } from './DeliveryChallanView';
import { Printer, Download, Share2, X, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from '../ui/Toast';

interface ChallanPrintModalProps {
    challan: FarmChallan;
    isOpen: boolean;
    onClose: () => void;
    onOpenTelegram?: () => void;
}

export const ChallanPrintModal: React.FC<ChallanPrintModalProps> = ({
    challan,
    isOpen,
    onClose,
    onOpenTelegram
}) => {
    const slipRef = useRef<HTMLDivElement | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    // Instant Slip Print
    const handlePrint = () => {
        const printContent = document.getElementById('printable-challan-slip');
        if (!printContent) {
            window.print();
            return;
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Challan #${challan.challanNo} - Dadi Gulzar Upvan</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { margin: 0; padding: 10px; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            @page { margin: 10mm; size: auto; }
                        }
                    </style>
                </head>
                <body class="bg-white">
                    <div style="max-width: 700px; margin: 0 auto;">
                        ${printContent.outerHTML}
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 400);
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            window.print();
        }
    };

    // Export as PNG Image using html2canvas
    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-challan-slip');
        if (!element) {
            toast.error('Challan slip element not found for export');
            return;
        }

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution for mobile sharing
                useCORS: true,
                backgroundColor: '#FFF5F7',
                logging: false
            });

            const imageUri = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Challan_${challan.challanNo || 'Slip'}_${challan.dispatchDate || 'Today'}.png`;
            link.href = imageUri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Challan #${challan.challanNo} image downloaded!`);
        } catch (err: any) {
            console.error('Export error:', err);
            toast.error('Failed to export challan image');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header Bar */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Delivery Challan #{challan.challanNo}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                ({challan.destinationCampus})
                            </span>
                        </h3>
                    </div>
                    
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Printable Slip Preview Viewport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/50">
                    <DeliveryChallanView
                        challan={challan}
                        printableRef={slipRef}
                    />
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                        {onOpenTelegram && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenTelegram();
                                }}
                                className="px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Telegram Dispatch
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadImage}
                            disabled={isExporting}
                            className="px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Download Image (PNG)
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print Delivery Slip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
