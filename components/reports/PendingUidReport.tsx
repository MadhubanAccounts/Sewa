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
  X
} from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { toast } from '../ui/Toast';
import { PrintModal, initiatePrintProcess } from '../common/PrintModal';

interface PendingUidData {
  institute: string;
  uid: string;
  zone: string;
  uploadPending: number;
  preAuditPending: number;
  inAuditPending: number;
  postAuditPending: number;
  totalPending: number;
  drillDownData: Array<{
    category: string;
    uploadPending: number;
    preAuditPending: number;
    inAuditPending: number;
    postAuditPending: number;
  }>;
  lastUpdated: string;
}

const PendingUidReport: React.FC = () => {
  const { callServer } = useData();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<PendingUidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PendingUidData; direction: 'asc' | 'desc' } | null>({ key: 'uid', direction: 'asc' });
  const [selectedUid, setSelectedUid] = useState<PendingUidData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await callServer('getPendingUidReportData');
      const mappedResult = (result || []).map((item: any) => ({
        ...item,
        preAuditPending: item.vouchingPending,
        inAuditPending: item.auditPending,
        drillDownData: (item.drillDownData || []).map((dd: any) => ({
          ...dd,
          preAuditPending: dd.vouchingPending,
          inAuditPending: dd.auditPending
        }))
      }));
      setData(mappedResult);
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

  const handleSort = (key: keyof PendingUidData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrint = () => {
    initiatePrintProcess('printable-pending-content', 'Pending UID Report');
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Pending Count UID List</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Data as of: <span className="font-semibold text-[var(--primary-color)]">{lastUpdated}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          
          <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800">
            <span className="font-bold">Note:</span> Includes 14 categories: CASH-DEP, CASH-WDR, FD-NEW, FD-RENEW, GS-CB, JV, PROP-CB, RECT, SALE, SPL-CB, TDS-CB, V-ASSET, VEH-CB, WIP-FIN.
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
                <th 
                  className="p-3 font-bold uppercase tracking-wider text-red-500 cursor-pointer hover:opacity-80" 
                  onClick={() => handleSort('uploadPending')}
                  title="Source: Source_VouchingStats > Pending_dues_to_centers_yellow_Red"
                >
                  <div className="flex items-center gap-1">Upload <ArrowUpDown size={12} /></div>
                </th>
                <th 
                  className="p-3 font-bold uppercase tracking-wider text-orange-500 cursor-pointer hover:opacity-80" 
                  onClick={() => handleSort('preAuditPending')}
                  title="Source: Source_VouchingStats > Pending_with_examiners"
                >
                  <div className="flex items-center gap-1">Pre Audit <ArrowUpDown size={12} /></div>
                </th>
                <th 
                  className="p-3 font-bold uppercase tracking-wider text-pink-500 cursor-pointer hover:opacity-80" 
                  onClick={() => handleSort('inAuditPending')}
                  title="Source: Source_VouchingStats > Pending_in_Audit"
                >
                  <div className="flex items-center gap-1">In Audit <ArrowUpDown size={12} /></div>
                </th>
                <th 
                  className="p-3 font-bold uppercase tracking-wider text-green-500 cursor-pointer hover:opacity-80" 
                  onClick={() => handleSort('postAuditPending')}
                  title="Source: Source_VouchingStats > pending_but_audit_completed"
                >
                  <div className="flex items-center gap-1">Post Audit <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-[var(--foreground)] cursor-pointer hover:text-[var(--primary-color)]" onClick={() => handleSort('totalPending')}>
                  <div className="flex items-center gap-1">Total <ArrowUpDown size={12} /></div>
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
                    {item.uploadPending.toLocaleString()}
                  </td>
                  <td 
                    className="p-3 font-bold text-orange-500 cursor-pointer hover:underline"
                    onClick={() => setSelectedUid(item)}
                  >
                    {item.preAuditPending.toLocaleString()}
                  </td>
                  <td 
                    className="p-3 font-bold text-pink-500 cursor-pointer hover:underline"
                    onClick={() => setSelectedUid(item)}
                  >
                    {item.inAuditPending.toLocaleString()}
                  </td>
                  <td 
                    className="p-3 font-bold text-green-500 cursor-pointer hover:underline"
                    onClick={() => setSelectedUid(item)}
                  >
                    {item.postAuditPending.toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-[var(--foreground)]">
                    {item.totalPending.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[var(--foreground-muted)] italic">
                    No records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Print Modal */}
      {showPrintModal && (
        <PrintModal 
          title="Pending UID Report Preview" 
          onClose={() => setShowPrintModal(false)} 
          onPrint={handlePrint}
        >
          <div id="printable-pending-content">
            <h1 className="text-xl font-bold mb-2">Pending Count UID List</h1>
            <p className="text-sm mb-4">Generated on: {new Date().toLocaleString()}</p>
            <table className="w-full text-sm text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">S.No</th>
                  <th className="border border-gray-300 px-2 py-1">Institute</th>
                  <th className="border border-gray-300 px-2 py-1">UID</th>
                  <th className="border border-gray-300 px-2 py-1">Zone</th>
                  <th className="border border-gray-300 px-2 py-1">Upload</th>
                  <th className="border border-gray-300 px-2 py-1">Pre Audit</th>
                  <th className="border border-gray-300 px-2 py-1">In Audit</th>
                  <th className="border border-gray-300 px-2 py-1">Post Audit</th>
                  <th className="border border-gray-300 px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.uid}>
                    <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.institute}</td>
                    <td className="border border-gray-300 px-2 py-1 font-mono">{item.uid}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.zone}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold text-red-500">{item.uploadPending}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold text-orange-500">{item.preAuditPending}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold text-pink-500">{item.inAuditPending}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold text-green-500">{item.postAuditPending}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold">{item.totalPending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintModal>
      )}

      {/* Drill-down Modal */}
      {selectedUid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
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
                    <th className="pb-2 text-xs font-bold uppercase text-red-500 text-right">Upload</th>
                    <th className="pb-2 text-xs font-bold uppercase text-orange-500 text-right">Pre Audit</th>
                    <th className="pb-2 text-xs font-bold uppercase text-pink-500 text-right">In Audit</th>
                    <th className="pb-2 text-xs font-bold uppercase text-green-500 text-right">Post Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {selectedUid.drillDownData.length > 0 ? (
                    selectedUid.drillDownData.map((cat, i) => (
                      <tr key={i} className="hover:bg-[var(--accent-background)] transition-colors">
                        <td className="py-3 text-sm font-medium text-[var(--foreground)]">{cat.category}</td>
                        <td className="py-3 text-sm text-right font-mono text-red-500">{cat.uploadPending.toLocaleString()}</td>
                        <td className="py-3 text-sm text-right font-mono text-orange-500">{cat.preAuditPending.toLocaleString()}</td>
                        <td className="py-3 text-sm text-right font-mono text-pink-500">{cat.inAuditPending.toLocaleString()}</td>
                        <td className="py-3 text-sm text-right font-mono text-green-500">{cat.postAuditPending.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[var(--foreground-muted)] italic">
                        No category breakdown available. Please click "Sync" to refresh data.
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
        }
      `}} />
    </div>
  );
};

export default PendingUidReport;
