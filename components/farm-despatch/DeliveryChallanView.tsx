import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { FarmChallan } from '../../types';
import { numberToWordsHindi } from '../../hooks/useFarmDespatch';
import { formatFarmDate, formatFarmTime } from '../../utils/farmDateUtils';

interface DeliveryChallanViewProps {
    challan: FarmChallan;
    printableRef?: React.RefObject<HTMLDivElement | null>;
    hideActions?: boolean;
}

export const DeliveryChallanView: React.FC<DeliveryChallanViewProps> = ({
    challan,
    printableRef,
    hideActions = false
}) => {
    // Destinations list for the official checkbox strip
    const destinations = ['शान्तिवन', 'ज्ञान सरोवर', 'पांडव भवन'];
    const currentDest = challan.destinationCampus || 'शान्तिवन';

    const wordsHindi = challan.totalQuantityWords || numberToWordsHindi(challan.totalQuantityKg);

    return (
        <div className="w-full flex justify-center py-2">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={2}
            >
                <TransformComponent>
                    {/* The Challan Slip Container */}
                    <div
                        ref={printableRef}
                        id="printable-challan-slip"
                        className="w-full max-w-2xl bg-[#FFF5F7] dark:bg-[#1E1E24] text-slate-900 dark:text-slate-100 border-2 border-emerald-800 shadow-md p-6 font-sans relative overflow-hidden"
                        style={{ minHeight: '850px' }}
                    >
                        {/* Background watermarked pattern hint */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px]" />

                        {/* Top Banner Row */}
                        <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-3 mb-3">
                            {/* Left: Green Banner Header */}
                            <div className="flex-1">
                                <div className="bg-[#15803D] text-white font-extrabold text-xl sm:text-2xl tracking-wider py-1.5 px-4 rounded-sm inline-block shadow-sm">
                                    DELIVERY CHALLAN
                                </div>
                            </div>

                            {/* Right: Emblem & Title */}
                            <div className="flex items-center gap-2 text-right">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-400 font-semibold">
                                        Dadi
                                    </div>
                                    <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-300 leading-tight">
                                        Gulzar Upvan
                                    </div>
                                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                        Bhimana, Abu Road.
                                    </div>
                                </div>
                                {/* Sun Rays Emblem */}
                                <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 flex items-center justify-center p-1 text-center shrink-0">
                                    <span className="text-xl" role="img" aria-label="Sun">☀️</span>
                                </div>
                            </div>
                        </div>

                        {/* Institution Name & Contact Strip */}
                        <div className="text-center space-y-0.5 mb-4">
                            <h2 className="text-xs sm:text-sm font-black tracking-wide text-slate-900 dark:text-white uppercase">
                                DADI GULZAR UPVAN (PRAJAPITA BRAHMA KUMARI ISHWARIYA VISHWA VIDYALAYA)
                            </h2>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                BHIMANA - 307024, SIROHI, RAJASTHAN
                            </p>
                            <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3 pt-0.5 font-mono">
                                <span>📞 9509005618</span>
                                <span>|</span>
                                <span>💬 9414056871</span>
                                <span>|</span>
                                <span>✉ naturalfarming@dadigulzarupvan.in</span>
                            </div>
                        </div>

                        {/* Metadata Matrix (Challan No, Dates, Vehicle) */}
                        <div className="border-t border-b border-emerald-700/60 py-2.5 my-2 text-xs space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Challan No.:</span>
                                    <span className="font-mono font-black text-sm text-emerald-950 dark:text-emerald-300 border-b border-dotted border-slate-600 pb-0.5 px-2">
                                        {challan.challanNo || '0022'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Challan Date:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white border-b border-dotted border-slate-600 pb-0.5 px-2">
                                        {formatFarmDate(challan.challanDate)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Dispatch Date:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white border-b border-dotted border-slate-600 pb-0.5 px-2">
                                        {formatFarmDate(challan.dispatchDate || challan.challanDate)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Dispatch Time:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white border-b border-dotted border-slate-600 pb-0.5 px-2">
                                        {formatFarmTime(challan.dispatchTime)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Vehicle No.:</span>
                                <span className="font-mono font-black tracking-wide text-slate-900 dark:text-white border-b border-dotted border-slate-600 pb-0.5 px-2 uppercase">
                                    {challan.vehicleNo || 'RJ 38 GA 1570'}
                                </span>
                            </div>

                            {/* Destination Checkbox Row */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Deliver to:</span>
                                {destinations.map(dest => {
                                    const isMatch = currentDest.toLowerCase().includes(dest.toLowerCase()) || 
                                                   (dest === 'शान्तिवन' && currentDest.toLowerCase().includes('shantivan')) ||
                                                   (dest === 'ज्ञान सरोवर' && currentDest.toLowerCase().includes('gyan')) ||
                                                   (dest === 'पांडव भवन' && currentDest.toLowerCase().includes('pandav'));
                                    return (
                                        <div key={dest} className="flex items-center gap-1.5 border-b border-dotted border-slate-400 pb-0.5">
                                            <span className="font-semibold text-slate-900 dark:text-white">{dest}</span>
                                            <span className="w-4 h-4 border border-slate-800 dark:border-slate-200 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                {isMatch ? '✓' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Table of Produce Items */}
                        <div className="mt-4 border border-emerald-800 rounded-sm overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#15803D] text-white font-bold border-b border-emerald-900">
                                        <th className="py-2 px-2.5 w-12 border-r border-emerald-700 text-center">Sr. No.</th>
                                        <th className="py-2 px-3 border-r border-emerald-700">Vegetable Name</th>
                                        <th className="py-2 px-3 w-32 border-r border-emerald-700 text-center">Packaging Unit</th>
                                        <th className="py-2 px-3 w-28 text-right">Qty. in Kg.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-800/20 text-slate-900 dark:text-slate-100">
                                    {(challan.items || []).map((it, idx) => (
                                        <tr key={it.itemId || idx} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 font-medium">
                                            <td className="py-2 px-2.5 border-r border-emerald-800/30 text-center font-mono">
                                                ({idx + 1})
                                            </td>
                                            <td className="py-2 px-3 border-r border-emerald-800/30">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {it.hindiName}
                                                </div>
                                                {it.englishName && (
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                                        {it.englishName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 border-r border-emerald-800/30 text-center font-mono font-semibold">
                                                {it.packagingCount} {it.packagingUnit === 'CRATE' ? 'कैरेट' : it.packagingUnit === 'BAG' ? 'बोरी' : it.packagingUnit}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold">
                                                {it.quantityKg.toLocaleString('en-IN')} Kg.
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Blank filler rows to match physical height */}
                                    {Array.from({ length: Math.max(0, 5 - (challan.items?.length || 0)) }).map((_, fIdx) => (
                                        <tr key={`filler-${fIdx}`} className="h-7">
                                            <td className="border-r border-emerald-800/30">&nbsp;</td>
                                            <td className="border-r border-emerald-800/30">&nbsp;</td>
                                            <td className="border-r border-emerald-800/30">&nbsp;</td>
                                            <td>&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-t-2 border-emerald-800 font-bold text-xs">
                                        <td colSpan={3} className="py-2.5 px-3 border-r border-emerald-800 text-left">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Total Qty.: </span>
                                            <span className="font-semibold text-emerald-900 dark:text-emerald-300 italic">
                                                {wordsHindi}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-emerald-950 dark:text-emerald-300">
                                            {challan.totalQuantityKg.toLocaleString('en-IN')} Kg.
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Optional Financial Valuation Summary Banner */}
                        {challan.totalEstimatedValue && challan.totalEstimatedValue > 0 ? (
                            <div className="mt-2 text-right text-[11px] font-mono text-slate-500 dark:text-slate-400 pr-2">
                                Est. Wholesale Valuation: <span className="font-bold text-slate-800 dark:text-slate-200">₹{challan.totalEstimatedValue.toLocaleString('en-IN')}</span>
                            </div>
                        ) : null}

                        {/* Signatures Zone */}
                        <div className="mt-14 pt-4 border-t border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-xs">
                            {/* Receiver's Signature */}
                            <div className="space-y-4">
                                <div className="border-b border-dotted border-slate-600 pb-1 font-serif italic text-sm text-slate-800 dark:text-slate-300">
                                    {challan.receiverName || 'Lakmaram'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                        Receiver's Signature
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                        Receiver's Name: <span className="font-semibold">{challan.receiverName || 'Lakmaram (Driver)'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sender's Signature */}
                            <div className="space-y-4 text-right">
                                <div className="border-b border-dotted border-slate-600 pb-1 font-serif italic text-sm text-slate-800 dark:text-slate-300">
                                    {challan.senderName || 'B.K. Harish'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                        Sender's Signature
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                        Sender's Name: <span className="font-semibold">{challan.senderName || 'B.K. Harish'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Diagonal Hatch Deco */}
                        <div className="mt-6 flex justify-end">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-4 bg-emerald-700 rotate-45 transform" />
                                <div className="w-1.5 h-4 bg-emerald-700 rotate-45 transform" />
                                <div className="w-1.5 h-4 bg-emerald-700 rotate-45 transform" />
                            </div>
                        </div>
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};
