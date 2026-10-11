import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { 
  Search, 
  RefreshCw, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { toast } from '../ui/Toast';
import { PrintModal, initiatePrintProcess } from '../common/PrintModal';

interface RejectedUidData {
  institute: string;
  uid: string;
  zone: string;
  vouchingRejected: number;
  drillDownData: Array<{
    category: string;
    vouchingRejected: number;
  }>;
  lastUpdated: string;
}

const RejectedUidReport: React.FC = () => {
  const { callServer } = useData();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<RejectedUidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RejectedUidData; direction: 'asc' | 'desc' } | null>({ key: 'uid', direction: 'asc' });
  const [selectedUid, setSelectedUid] = useState<RejectedUidData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await callServer('getRejectedUidReportData');
      setData(result || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    if (!hasPermission('vouching_stats_edit')) {
      toast('You do not have permission to sync data', 'error');
      return;
    }
    setSyncing(true);
    try {
      const result = await callServer('syncVouchingStats');
      if (result?.success) {
        toast('Sync completed successfully', 'success');
        fetchData();
      } else {
        toast(result?.message || 'Sync failed', 'error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast('An error occurred during sync', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const zones = useMemo(() => {
    const z = new Set(data.map(d => String(d.zone || '')));
    const sortedZones = Array.from(z).filter(Boolean).sort();
    return ['All', ...sortedZones];
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data].filter(item => {
      const matchesSearch = 
        (item.institute || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.uid || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone = zoneFilter === 'All' || item.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, zoneFilter, sortConfig]);

  const summaryMatrix = useMemo(() => {
    if (data.length === 0) return null;

    const categoriesMap: Record<string, Record<string, number>> = {};
    const institutesMap: Record<string, number> = {};
    const categoriesTotal: Record<string, number> = {};

    data.forEach(item => {
      institutesMap[item.institute] = (institutesMap[item.institute] || 0) + item.vouchingRejected;
      
      if (Array.isArray(item.drillDownData)) {
        item.drillDownData.forEach(dd => {
          if (dd.vouchingRejected !== 0) {
            if (!categoriesMap[dd.category]) categoriesMap[dd.category] = {};
            categoriesMap[dd.category][item.institute] = (categoriesMap[dd.category][item.institute] || 0) + dd.vouchingRejected;
            categoriesTotal[dd.category] = (categoriesTotal[dd.category] || 0) + dd.vouchingRejected;
          }
        });
      }
    });

    // Sort institutes by total rejected count descending
    const sortedInstitutes = Object.keys(institutesMap)
      .sort((a, b) => institutesMap[b] - institutesMap[a]);

    // Sort categories by total rejected count descending
    const sortedCategories = Object.keys(categoriesTotal)
      .sort((a, b) => categoriesTotal[b] - categoriesTotal[a]);

    return {
      institutes: sortedInstitutes,
      categories: sortedCategories,
      matrix: categoriesMap,
      institutesTotal: institutesMap,
      categoriesTotal: categoriesTotal,
      grandTotal: Object.values(institutesMap).reduce((a, b) => a + b, 0)
    };
  }, [data]);

  const handleSort = (key: keyof RejectedUidData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrint = () => {
    initiatePrintProcess('printable-rejected-content', 'Rejected UID Report');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
      const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart} ${timePart}`;
    } catch (e) {
      return dateStr;
    }
  };

  const lastUpdated = data.length > 0 ? formatDate(data[0].lastUpdated) : 'N/A';

  if (loading && data.length === 0) return <SurfaceLoader />;

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6 space-y-4 animate-fade-in overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Rejected Count UID List</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Data as of: <span className="font-semibold text-[var(--primary-color)]">{lastUpdated}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--card-inset-background)] p-1 rounded-lg mr-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--primary-color)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('summary')}
              className={`p-2 rounded-md transition-all ${viewMode === 'summary' ? 'bg-white shadow-sm text-[var(--primary-color)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
              title="Summary View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg bg-[var(--card-inset-background)] hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowPrintModal(true)}
            className="p-2 rounded-lg bg-[var(--card-inset-background)] hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
            title="Print Preview"
          >
            <Printer size={20} />
          </button>
          {hasPermission('vouching_stats_edit') && (
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-medium"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Manual Sync'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card 
          className="flex-1 min-h-0 overflow-hidden flex flex-col border border-[var(--border)] shadow-sm"
          contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col p-0"
        >
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card-inset-background)] flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={18} />
                <input 
                  type="text"
                  placeholder="Search Institute or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-background)] focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[var(--foreground-muted)]" />
                <select 
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-background)] focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition-all"
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse min-w-[800px] text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--card-inset-background)] shadow-sm">
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-3 font-bold uppercase tracking-wider text-[var(--foreground-muted)] w-16">S.No</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Institute</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--primary-color)]" onClick={() => handleSort('uid')}>
                    <div className="flex items-center gap-1">UID <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--primary-color)]" onClick={() => handleSort('zone')}>
                    <div className="flex items-center gap-1">Zone <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-red-500 cursor-pointer hover:opacity-80" onClick={() => handleSort('vouchingRejected')}>
                    <div className="flex items-center gap-1">Rejected Count <ArrowUpDown size={12} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map((item, index) => (
                  <tr key={item.uid} className="hover:bg-[var(--accent-background)] transition-colors group">
                    <td className="p-3 font-mono text-[var(--foreground-muted)]">{index + 1}</td>
                    <td className="p-3 font-medium text-[var(--foreground)]">{item.institute}</td>
                    <td className="p-3 font-mono text-[var(--foreground-muted)]">{item.uid}</td>
                    <td className="p-3 text-[var(--foreground-muted)]">{item.zone}</td>
                    <td 
                      className="p-3 font-bold text-red-500 cursor-pointer hover:underline"
                      onClick={() => setSelectedUid(item)}
                    >
                      {item.vouchingRejected.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[var(--foreground-muted)] italic">
                      No records found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card 
          className="flex-1 min-h-0 overflow-hidden flex flex-col border border-[var(--border)] shadow-sm"
          contentClassName="flex-1 min-h-0 overflow-auto p-4"
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Summary Matrix (Institutes vs Categories)</h2>
            <p className="text-xs text-[var(--foreground-muted)]">Sorted by total rejected count (descending)</p>
          </div>
          {summaryMatrix ? (
            <table className="w-full border-collapse text-[10px]">
              <thead className="sticky top-0 z-20 bg-[var(--card-inset-background)]">
                <tr className="bg-[var(--card-inset-background)]">
                  <th className="p-2 border border-[var(--border)] text-left font-bold sticky left-0 z-30 bg-[var(--card-inset-background)]">Categories / Institutes</th>
                  {summaryMatrix.institutes.map(inst => (
                    <th key={inst} className="p-2 border border-[var(--border)] text-center font-bold min-w-[100px]">
                      {inst}
                    </th>
                  ))}
                  <th className="p-2 border border-[var(--border)] text-center font-bold bg-gray-100 min-w-[60px] sticky right-0 z-30">Total</th>
                </tr>
              </thead>
              <tbody>
                {summaryMatrix.categories.map(cat => (
                  <tr key={cat} className="hover:bg-[var(--accent-background)]">
                    <td className="p-2 border border-[var(--border)] font-medium sticky left-0 z-10 bg-white group-hover:bg-[var(--accent-background)]">{cat}</td>
                    {summaryMatrix.institutes.map(inst => {
                      const val = summaryMatrix.matrix[cat]?.[inst] || 0;
                      return (
                        <td key={inst} className={`p-2 border border-[var(--border)] text-center font-mono ${val > 0 ? 'text-red-500 font-bold' : 'text-gray-300'}`}>
                          {val > 0 ? val.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="p-2 border border-[var(--border)] text-center font-bold bg-gray-50 text-red-600 sticky right-0 z-10">
                      {summaryMatrix.categoriesTotal[cat].toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold sticky bottom-0 z-20">
                  <td className="p-2 border border-[var(--border)] sticky left-0 z-30 bg-gray-100">Total</td>
                  {summaryMatrix.institutes.map(inst => (
                    <td key={inst} className="p-2 border border-[var(--border)] text-center text-red-600 bg-gray-100">
                      {summaryMatrix.institutesTotal[inst].toLocaleString()}
                    </td>
                  ))}
                  <td className="p-2 border border-[var(--border)] text-center text-red-700 bg-gray-200 sticky right-0 z-30">
                    {summaryMatrix.grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-[var(--foreground-muted)] italic">
              No data available for summary view.
            </div>
          )}
        </Card>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <PrintModal 
          title="Rejected UID Report Preview" 
          onClose={() => setShowPrintModal(false)} 
          onPrint={handlePrint}
        >
          <div id="printable-rejected-content">
            <h1 className="text-xl font-bold mb-2">Rejected Count UID List</h1>
            <p className="text-sm mb-4">Generated on: {new Date().toLocaleString()}</p>
            {viewMode === 'list' ? (
              <table className="w-full text-sm text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1">S.No</th>
                    <th className="border border-gray-300 px-2 py-1">Institute</th>
                    <th className="border border-gray-300 px-2 py-1">UID</th>
                    <th className="border border-gray-300 px-2 py-1">Zone</th>
                    <th className="border border-gray-300 px-2 py-1">Rejected Count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.uid}>
                      <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">{item.institute}</td>
                      <td className="border border-gray-300 px-2 py-1 font-mono">{item.uid}</td>
                      <td className="border border-gray-300 px-2 py-1">{item.zone}</td>
                      <td className="border border-gray-300 px-2 py-1 font-bold text-red-600">{item.vouchingRejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : summaryMatrix ? (
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border border-gray-300 text-left">Categories / Institutes</th>
                    {summaryMatrix.institutes.map(inst => (
                      <th key={inst} className="p-1 border border-gray-300 text-center">{inst}</th>
                    ))}
                    <th className="p-1 border border-gray-300 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryMatrix.categories.map(cat => (
                    <tr key={cat}>
                      <td className="p-1 border border-gray-300 font-medium">{cat}</td>
                      {summaryMatrix.institutes.map(inst => {
                        const val = summaryMatrix.matrix[cat]?.[inst] || 0;
                        return (
                          <td key={inst} className={`p-1 border border-gray-300 text-center ${val > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                            {val > 0 ? val : '-'}
                          </td>
                        );
                      })}
                      <td className="p-1 border border-gray-300 text-center font-bold text-red-700">
                        {summaryMatrix.categoriesTotal[cat]}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-1 border border-gray-300">Total</td>
                    {summaryMatrix.institutes.map(inst => (
                      <td key={inst} className="p-1 border border-gray-300 text-center text-red-700">
                        {summaryMatrix.institutesTotal[inst]}
                      </td>
                    ))}
                    <td className="p-1 border border-gray-300 text-center text-red-800">
                      {summaryMatrix.grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        </PrintModal>
      )}

      {/* Drill-down Modal */}
      {selectedUid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-inset-background)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Category Breakdown</h2>
                <p className="text-sm text-[var(--foreground-muted)]">{selectedUid.institute} ({selectedUid.uid})</p>
              </div>
              <button 
                onClick={() => setSelectedUid(null)}
                className="p-2 rounded-full hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-[var(--border)]">
                    <th className="pb-2 text-xs font-bold uppercase text-[var(--foreground-muted)]">Category</th>
                    <th className="pb-2 text-xs font-bold uppercase text-red-500 text-right">Rejected Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {Array.isArray(selectedUid.drillDownData) && selectedUid.drillDownData.length > 0 ? (
                    selectedUid.drillDownData.map((cat, i) => (
                      <tr key={i} className="hover:bg-[var(--accent-background)] transition-colors">
                        <td className="py-3 text-sm font-medium text-[var(--foreground)]">{cat.category}</td>
                        <td className="py-3 text-sm text-right font-mono text-red-500 font-bold">{cat.vouchingRejected.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-[var(--foreground-muted)] italic">
                        No category breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[var(--border)] bg-[var(--card-inset-background)] text-right">
              <button 
                onClick={() => setSelectedUid(null)}
                className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; }
          th { background-color: #f2f2f2 !important; }
          .sticky { position: static !important; }
        }
      `}} />
    </div>
  );
};

export default RejectedUidReport;
