import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { Card } from '../ui/Card';

interface PrintModalProps {
    title: string;
    onClose: () => void;
    onPrint: () => void;
    children: React.ReactNode;
}

export const PrintModal: React.FC<PrintModalProps> = ({ title, onClose, onPrint, children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:z-auto print-modal-container">
            <Card 
                className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl print:max-h-none print:shadow-none print:border-none print:w-full print:block" 
                contentClassName="flex-1 overflow-hidden flex flex-col p-0 print:block"
            >
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-inset-background)] print:hidden">
                    <div className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-[var(--primary-color)]" />
                        <h2 className="text-lg font-bold">{title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onPrint}
                            className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md font-bold hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print Now
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--card-background)] border border-[var(--border)] rounded-md font-bold hover:bg-[var(--accent-background)] transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-white text-black print:p-0 print:overflow-visible print:block" id="printable-content">
                    {children}
                </div>
            </Card>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Hide everything except the print modal container */
                    body > *:not(.print-modal-container) {
                        display: none !important;
                    }
                    
                    /* Ensure the portal root and modal container are visible */
                    #portal-root, .print-modal-container {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 99999 !important;
                    }

                    .print-modal-container * {
                        visibility: visible !important;
                    }

                    /* Ensure colors are preserved */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Hide UI elements during print */
                    .print-modal-container .print\\:hidden,
                    .print-modal-container button,
                    .print-modal-container .border-b,
                    .print-modal-container .bg-\\[var\\(--card-inset-background\\)\\] {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );

    const portalRoot = document.getElementById('portal-root');
    return portalRoot ? createPortal(modalContent, portalRoot) : modalContent;
};

export const initiatePrintProcess = (contentId: string, title: string) => {
    const content = document.getElementById(contentId);
    if (!content) {
        console.error(`Element with id ${contentId} not found`);
        return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
        alert('Please allow popups to print this report.');
        return;
    }

    // Get all stylesheets from the current document
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(style => style.outerHTML)
        .join('\n');

    // Get the Tailwind CDN script if it exists
    const tailwindScript = document.querySelector('script[src*="tailwindcss.com"]')?.outerHTML || '';

    // Construct the print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            ${styles}
            ${tailwindScript}
            <style>
                body { 
                    background: white !important; 
                    color: black !important;
                    padding: 20px !important;
                    margin: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                /* Ensure tables look good in print */
                table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 20px !important; }
                th, td { border: 1px solid #ddd !important; padding: 8px !important; text-align: left !important; }
                th { background-color: #f2f2f2 !important; font-weight: bold !important; }
                
                /* Preserve specific colors used in reports */
                .text-green-600 { color: #16a34a !important; }
                .text-amber-600 { color: #d97706 !important; }
                .text-red-600 { color: #dc2626 !important; }
                .text-blue-600 { color: #2563eb !important; }
                .bg-green-100 { background-color: #dcfce7 !important; }
                .bg-amber-100 { background-color: #fef9c3 !important; }
                .bg-red-100 { background-color: #fee2e2 !important; }
                
                @media print {
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="print-modal-container print-content">
                ${content.innerHTML}
            </div>
            <script>
                // Function to check if Tailwind has finished processing (if using CDN)
                // or just wait for a bit to be safe.
                function startPrint() {
                    window.print();
                    // We don't close the window automatically so the user can see it if print fails
                    // but they can close it manually.
                }

                // Wait for everything to load
                if (document.readyState === 'complete') {
                    setTimeout(startPrint, 1000);
                } else {
                    window.onload = () => setTimeout(startPrint, 1000);
                }
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
};
