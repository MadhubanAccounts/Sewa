import React, { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface AdaptiveSelectorItem {
    id: string;
    label: string;
    subLabel?: string;
    meta?: string;
    badge?: string;
}

interface AdaptiveSelectorProps {
    items: AdaptiveSelectorItem[];
    selectedId: string;
    onSelect: (item: AdaptiveSelectorItem) => void;
    placeholder?: string;
    threshold?: number; // default 8
    gridColsClassName?: string;
    renderCustomCard?: (item: AdaptiveSelectorItem, isSelected: boolean) => React.ReactNode;
    autoOpen?: boolean;
}

export const AdaptiveSelector: React.FC<AdaptiveSelectorProps> = ({
    items,
    selectedId,
    onSelect,
    placeholder = 'Select option...',
    threshold = 8,
    gridColsClassName = 'grid-cols-2 sm:grid-cols-3',
    renderCustomCard,
    autoOpen = false
}) => {
    const isDropdownMode = items.length > threshold;
    const [searchFilter, setSearchFilter] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(autoOpen);

    const filteredItems = items.filter(item => 
        item.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.subLabel && item.subLabel.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (item.meta && item.meta.toLowerCase().includes(searchFilter.toLowerCase()))
    );

    const currentSelectedItem = items.find(i => i.id === selectedId);

    // MODE 1: Cards / Chips Grid (When items count <= threshold e.g. 8)
    if (!isDropdownMode) {
        return (
            <div className={`grid ${gridColsClassName} gap-2 pt-1`}>
                {items.map(item => {
                    const isSelected = item.id === selectedId;
                    if (renderCustomCard) {
                        return (
                            <div key={item.id} onClick={() => onSelect(item)} className="cursor-pointer">
                                {renderCustomCard(item, isSelected)}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item)}
                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-2 ring-emerald-500/20'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 w-full">
                                <span className="truncate">{item.label}</span>
                                {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5" />
                                    </span>
                                )}
                            </div>
                            {item.subLabel && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                                    {item.subLabel}
                                </div>
                            )}
                            {item.meta && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {item.meta}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // MODE 2: Searchable Dropdown / Select (When items count > threshold e.g. > 8)
    return (
        <div className="relative pt-1">
            <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-left text-xs text-slate-900 dark:text-white shadow-sm hover:border-emerald-500 transition-colors"
            >
                <div>
                    <span className="font-bold block">
                        {currentSelectedItem ? currentSelectedItem.label : placeholder}
                    </span>
                    {currentSelectedItem?.subLabel && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                            {currentSelectedItem.subLabel}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {items.length} options
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isMenuOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fadeIn">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        <input
                            type="text"
                            placeholder="Type to filter..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredItems.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                                No matching options found
                            </div>
                        ) : (
                            filteredItems.map(item => {
                                const isSelected = item.id === selectedId;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(item);
                                            setIsMenuOpen(false);
                                            setSearchFilter('');
                                        }}
                                        className={`w-full p-2.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-semibold">{item.label}</div>
                                            {item.subLabel && (
                                                <div className="text-[11px] text-slate-500 font-normal">{item.subLabel}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
