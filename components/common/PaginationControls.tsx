import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number | 'all') => void;
    showAll: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    showAll
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endItem = showAll ? totalItems : Math.min(currentPage * pageSize, totalItems);

    const [jumpToPage, setJumpToPage] = useState(String(currentPage));

    useEffect(() => {
        setJumpToPage(String(currentPage));
    }, [currentPage]);

    const handleJump = () => {
        const page = parseInt(jumpToPage, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            if (page !== currentPage) {
                onPageChange(page);
            }
        } else {
            setJumpToPage(String(currentPage));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleJump();
            e.preventDefault();
        }
    };

    if (totalItems === 0) {
        return null;
    }
    
    return (
        <div className="flex items-center justify-between py-0 text-sm text-[var(--foreground-muted)] gap-4">
            <div className="flex items-center">
                <span className="mr-3 font-semibold text-[11px] uppercase tracking-wider opacity-60">Rows:</span>
                <select
                    value={showAll ? 'all' : pageSize}
                    onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-[var(--card-background)] border border-[var(--border)] rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-bold text-[var(--foreground)] text-xs"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value="all">All</option>
                </select>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="whitespace-nowrap font-bold text-[var(--foreground)] text-xs">
                    {totalItems > 0 ? `${startItem}–${endItem}` : '0'} <span className="opacity-40">/</span> {totalItems}
                </span>
                
                <div className="flex items-center gap-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-0 h-8 w-8 shadow-none bg-transparent hover:bg-[var(--border)] border-none"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || showAll}
                        aria-label="First page"
                    >
                        <ChevronsLeft size={16} strokeWidth={2} />
                    </Button>
                    
                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-0 h-8 w-8 shadow-none bg-transparent hover:bg-[var(--border)] border-none"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || showAll}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={16} strokeWidth={2} />
                    </Button>
                    
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-[var(--card-background)] border border-[var(--border)] rounded-md">
                        <input
                            type="number"
                            value={jumpToPage}
                            onChange={(e) => setJumpToPage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleJump}
                            disabled={showAll || totalPages <= 1}
                            className="w-8 text-center bg-transparent font-bold text-[var(--foreground)] focus:outline-none text-xs"
                            aria-label="Jump to page"
                        />
                        <span className="text-[var(--foreground-muted)] font-medium text-[10px] opacity-40">of {totalPages}</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-0 h-8 w-8 shadow-none bg-transparent hover:bg-[var(--border)] border-none"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || showAll}
                        aria-label="Next page"
                    >
                        <ChevronRight size={16} strokeWidth={2} />
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-0 h-8 w-8 shadow-none bg-transparent hover:bg-[var(--border)] border-none"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages || showAll}
                        aria-label="Last page"
                    >
                        <ChevronsRight size={16} strokeWidth={2} />
                    </Button>
                </div>
            </div>
        </div>
    );
};