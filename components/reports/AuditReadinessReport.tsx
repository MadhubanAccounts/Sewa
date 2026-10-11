import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../ui/Card';
import { 
  Search, 
  RefreshCw, 
  Printer, 
  Download, 
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  X,
  CheckCircle2,
  ListFilter,
  FileText,
  AlertTriangle,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  Activity,
  UserCheck,
  Building,
  FileCheck
} from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { SurfaceLoader } from '../common/SurfaceLoader';
import { toast } from '../ui/Toast';
import { PrintModal, initiatePrintProcess } from '../common/PrintModal';
import { ScrollableTableContainer } from '../common/ScrollableTableContainer';
import { PaginationControls } from '../common/PaginationControls';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

import * as api from '../../services/apiService';

interface AuditReadinessData {
  Institute: string;
  UID: string;
  'Reg No': string;
  'Centre Name': string;
  Zone: string;
  SubZone: string;
  'Month of Submission': string;
  'Pending Vouching Count': number;
  'Rejected Vouching Count': number;
  'Audit Status (Excel)': string;
  Auditor: string;
  Grade: string;
  Status: string;
  'Audit Stage': string;
  'Vouching Stage': string;
  'Status Colour': string;
  statusType: string;
  pendingDrillDown?: any[];
  rejectedDrillDown?: any[];
}

interface Metadata {
  sourceTime: string;
  modifiedBy: string;
  syncTimes?: {
    submissions: string;
    vouching: string;
    auditStatus: string;
  };
}

interface SortConfig {
  key: keyof AuditReadinessData;
  direction: 'asc' | 'desc';
}

const AuditReadinessReport: React.FC = () => {
  const { callServer } = useData();
  const { hasPermission, user } = useAuth();
  const [data, setData] = useState<AuditReadinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ [key: string]: { status: string; error: null | string } } | null>(null);
  const [groupBy, setGroupBy] = useState<(keyof AuditReadinessData)[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isChangingPageSize, setIsChangingPageSize] = useState(false);
  const [isProcessingGroups, setIsProcessingGroups] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedDrillDown, setSelectedDrillDown] = useState<{ row: AuditReadinessData; type: 'pending' | 'rejected' } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  
  // Sorting State (Multi-step)
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([{ key: 'UID', direction: 'asc' }]);
  const [vouchSettings, setVouchSettings] = useState<any>({});

  const handleVouchSettingChange = (key: string, value: string) => {
    setVouchSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveVouchSettings = async () => {
    setLoading(true);
    try {
      await api.updateVouchingStatsSettings(getAuthHeader(), vouchSettings);
      toast("Vouching settings saved.", "success");
    } catch (error) {
      toast("Failed to save vouching settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeader = () => {
    if (!user?.sessionId) return '';
    return user.sessionId;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [result, vSettings] = await Promise.all([
        callServer('getAuditReadinessReportData'),
        api.getVouchingStatsSettings(getAuthHeader())
      ]);
      setData(result?.data || []);
      setMetadata(result?.metadata || null);
      setVouchSettings(vSettings || {});
    } catch (error) {
      console.error('Error fetching audit readiness data:', error);
      toast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!hasPermission('account_submissions_edit')) {
      toast('You do not have permission to sync source data', 'error');
      return;
    }

    setSyncLoading(true);
    setSyncProgress({
      submissions: { status: 'Syncing...', error: null },
      vouching: { status: 'Pending', error: null },
      auditStatus: { status: 'Pending', error: null }
    });

    try {
      const result = await callServer('syncAllAuditReadinessSources', user?.email);
      if (result && result.success) {
        setSyncProgress(result.results);
        toast('Full Data Sync Completed', 'success');
        fetchData(); // Refresh data after sync
      } else {
        setSyncProgress(result?.results || null);
        toast(result?.error || 'Sync failed', 'error');
      }
    } catch (error) {
       console.error('Sync error:', error);
       toast('Error initiating full sync', 'error');
    } finally {
      setTimeout(() => setSyncLoading(false), 5000); // Keep progress visible for a bit
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate counts for the filter bar
  const stats = useMemo(() => {
    return {
      total: data.length,
      readyAll: data.filter(d => ['READY_ALLOCATION', 'READY_COMPLETION', 'BANK_CHECKING', 'READY_GUIDANCE_C', 'READY_GUIDANCE_AB'].includes(d.statusType)).length,
      readyAllocation: data.filter(d => d.statusType === 'READY_ALLOCATION').length,
      readyCompletion: data.filter(d => d.statusType === 'READY_COMPLETION').length,
      bankChecking: data.filter(d => d.statusType === 'BANK_CHECKING').length,
      readyGuidanceC: data.filter(d => d.statusType === 'READY_GUIDANCE_C').length,
      readyGuidanceAB: data.filter(d => d.statusType === 'READY_GUIDANCE_AB').length,
      pendingVouching: data.filter(d => d.statusType === 'PENDING_VOUCHING').length,
      inProgress: data.filter(d => d.statusType === 'AUDIT_IN_PROGRESS').length,
      completed: data.filter(d => d.statusType === 'COMPLETED').length,
      completedMaterial: data.filter(d => d.statusType === 'COMPLETED_MATERIAL').length,
      completedGuidance: data.filter(d => d.statusType === 'COMPLETED_GUIDANCE').length,
      completedRecheck: data.filter(d => d.statusType === 'COMPLETED_RECHECK').length,
      accountsNotReady: data.filter(d => d.statusType === 'ACCOUNTS_NOT_READY').length,
      notReady: data.filter(d => d.statusType === 'NOT_READY').length
    };
  }, [data]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Status Filter
    if (statusFilters.length > 0) {
       result = result.filter(d => {
           if (statusFilters.includes('NOT_READY_GROUP') && (d.statusType === 'NOT_READY' || d.statusType === 'ACCOUNTS_NOT_READY')) return true;
           if (statusFilters.includes('READY_GROUP') && ['READY_ALLOCATION', 'READY_COMPLETION', 'BANK_CHECKING', 'READY_GUIDANCE_C', 'READY_GUIDANCE_AB', 'READY'].includes(d.statusType)) return true;
           if (statusFilters.includes('READY_AUDIT_ITEM') && (d.statusType === 'READY' || d.statusType === 'READY_AUDIT' || d.statusType === 'READY_GUIDANCE_C' || d.statusType === 'READY_GUIDANCE_AB')) return true;
           return statusFilters.includes(d.statusType);
       });
    }

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.Institute || '').toLowerCase().includes(lowerSearch) ||
        (item.UID || '').toLowerCase().includes(lowerSearch) ||
        (item['Centre Name'] || '').toLowerCase().includes(lowerSearch) ||
        (item.Zone || '').toLowerCase().includes(lowerSearch) ||
        (item.SubZone || '').toLowerCase().includes(lowerSearch)
      );
    }

    // Sorting (Multi-step)
    if (sortConfig.length > 0) {
      result.sort((a, b) => {
        for (const config of sortConfig) {
          let aVal = a[config.key];
          let bVal = b[config.key];
          
          // Numeric Sorting for Reg No
          if (config.key === 'Reg No') {
            const aNum = parseFloat(String(aVal).replace(/[^0-9.]/g, ''));
            const bNum = parseFloat(String(bVal).replace(/[^0-9.]/g, ''));
            if (!isNaN(aNum) && !isNaN(bNum)) {
              aVal = aNum;
              bVal = bNum;
            }
          }

          if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, statusFilters, searchTerm, sortConfig]);

  // Grouping Logic (Multi-level)
  const tree = useMemo(() => {
    if (groupBy.length === 0) return [];

    const buildGroups = (rows: AuditReadinessData[], depth: number, path: string): any[] => {
      if (depth >= groupBy.length) return [];

      const groupKey = groupBy[depth];
      const groups: Record<string, AuditReadinessData[]> = {};

      rows.forEach(row => {
        const val = String(row[groupKey] || 'Unknown');
        if (!groups[val]) groups[val] = [];
        groups[val].push(row);
      });

      return Object.keys(groups).sort().map(val => {
        const currentPath = path ? `${path}::${val}` : val;
        return {
          key: groupKey,
          value: val,
          path: currentPath,
          level: depth,
          children: buildGroups(groups[val], depth + 1, currentPath),
          items: groups[val]
        };
      });
    };

    return buildGroups(filteredData, 0, '');
  }, [filteredData, groupBy]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    if (groupBy.length > 0) return []; // Handled by tree rendering
    if (pageSize === 'all') return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, groupBy]);

  // Paginated Tree for Performance
  const flattenedVisibleRows = useMemo(() => {
    if (groupBy.length === 0) return [];
    
    const rows: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach(node => {
        rows.push({ type: 'group', node });
        if (expandedPaths.has(node.path)) {
          if (node.children && node.children.length > 0) {
            walk(node.children);
          } else {
            node.items.forEach((item: any, idx: number) => {
              rows.push({ type: 'data', row: item, index: idx });
            });
          }
        }
      });
    };
    walk(tree);
    return rows;
  }, [tree, expandedPaths, groupBy]);

  const paginatedFlattenedRows = useMemo(() => {
    if (groupBy.length === 0) return [];
    if (pageSize === 'all') return flattenedVisibleRows;
    const startIndex = (currentPage - 1) * pageSize;
    return flattenedVisibleRows.slice(startIndex, startIndex + pageSize);
  }, [flattenedVisibleRows, currentPage, pageSize, groupBy]);

  useEffect(() => {
    if (isChangingPageSize) {
      const timer = setTimeout(() => {
        setIsChangingPageSize(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pageSize, isChangingPageSize]);

  const handleStatusToggle = (type: string | null) => {
    if (type === null) {
      setStatusFilters([]);
      return;
    }

    setStatusFilters(prev => {
      if (prev.includes(type)) return prev.filter(t => t !== type);
      return [...prev, type];
    });
    setCurrentPage(1);
  };

  const getSyncBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge variant="success" size="sm">Synced</Badge>;
      case 'Failed': return <Badge variant="danger" size="sm">Failed</Badge>;
      case 'Syncing...': return <Badge variant="warning" size="sm" className="animate-pulse">Syncing...</Badge>;
      default: return <Badge variant="secondary" size="sm">Pending</Badge>;
    }
  };

  const handleSort = (key: keyof AuditReadinessData, multi: boolean = false) => {
    setSortConfig(prev => {
      const existingIndex = prev.findIndex(s => s.key === key);
      
      if (existingIndex > -1) {
        const newSort = [...prev];
        const current = newSort[existingIndex];
        
        if (current.direction === 'asc') {
          newSort[existingIndex] = { ...current, direction: 'desc' };
          return newSort;
        } else {
          // Remove if already desc
          if (multi) {
            newSort.splice(existingIndex, 1);
            return newSort;
          } else {
            return [{ key, direction: 'asc' }];
          }
        }
      }
      
      if (multi) {
        return [...prev, { key, direction: 'asc' }];
      }
      return [{ key, direction: 'asc' }];
    });
  };

  const togglePath = (path: string) => {
    setIsProcessingGroups(true);
    setTimeout(() => {
      setExpandedPaths(prev => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
      setIsProcessingGroups(false);
    }, 50);
  };

  const handleGroupByChange = (key: keyof AuditReadinessData) => {
    setGroupBy(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
    setCurrentPage(1);
    setExpandedPaths(new Set());
  };

  const expandAllGroups = () => {
    setIsProcessingGroups(true);
    setTimeout(() => {
      const allPaths = new Set<string>();
      const collectPaths = (nodes: any[]) => {
        nodes.forEach(node => {
          allPaths.add(node.path);
          if (node.children && node.children.length > 0) {
            collectPaths(node.children);
          }
        });
      };
      collectPaths(tree);
      setExpandedPaths(allPaths);
      setIsProcessingGroups(false);
    }, 100);
  };

  const collapseAllGroups = () => {
    setIsProcessingGroups(true);
    setTimeout(() => {
      setExpandedPaths(new Set());
      setIsProcessingGroups(false);
    }, 100);
  };

  const getStatusBadge = (statusType: string, status: string) => {
    switch (statusType) {
      case 'READY':
      case 'READY_AUDIT':
        return <Badge variant="success" className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {status}</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-600 text-white font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"><CheckCircle2 className="w-3 h-3 text-white" /> {status}</Badge>;
      case 'COMPLETED_MATERIAL':
        return <Badge className="bg-emerald-500 text-white font-bold flex items-center gap-1 hover:bg-emerald-600 transition-colors"><CheckCircle2 className="w-3 h-3 text-white" /> {status}</Badge>;
      case 'COMPLETED_RECHECK':
        return <Badge className="bg-rose-500 text-white font-bold flex items-center gap-1 hover:bg-rose-600 transition-colors"><AlertTriangle className="w-3 h-3 text-white" /> {status}</Badge>;
      case 'COMPLETED_GUIDANCE':
        return <Badge className="bg-orange-500 text-white font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors"><Clock className="w-3 h-3 text-white" /> {status}</Badge>;
      case 'AUDIT_IN_PROGRESS':
        return <Badge className="bg-indigo-500 text-white font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> {status}</Badge>;
      case 'READY_COMPLETION':
        return <Badge className="bg-emerald-600 text-white font-bold flex items-center gap-1"><FileCheck className="w-3 h-3" /> Ready For Completion</Badge>;
      case 'READY_ALLOCATION':
        return <Badge className="bg-cyan-600 text-white font-bold flex items-center gap-1"><UserCheck className="w-3 h-3" /> Ready For Allocation</Badge>;
      case 'READY_GUIDANCE_C':
        return <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> For Guidance (C/D)</Badge>;
      case 'READY_GUIDANCE_AB':
        return <Badge className="bg-amber-600 text-white font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> For Guidance (A/B)</Badge>;
      case 'BANK_CHECKING':
        return <Badge className="bg-rose-500 text-white font-bold flex items-center gap-1"><Building className="w-3 h-3" /> Bank Reconciliation Needed (Grade C)</Badge>;
      case 'PENDING_VOUCHING':
        return <Badge variant="warning" className="font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pre Audit Pending</Badge>;
      case 'REJECTED_VOUCHING':
        return <Badge variant="danger" className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {status}</Badge>;
      case 'NOT_READY':
      case 'ACCOUNTS_NOT_READY':
        return <Badge variant="secondary" className="font-bold flex items-center gap-1 grayscale-[0.5] opacity-80"><XCircle className="w-3 h-3" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const initiatePrint = () => {
    initiatePrintProcess('printable-report-content', 'Audit Readiness Report');
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;
    
    const headers = ['Institute', 'UID', 'Reg No', 'Centre Name', 'Zone', 'SubZone', 'Month of Submission', 'Pending Vouching Count', 'Rejected Vouching Count', 'Audit Status (Excel)', 'Auditor', 'Grade', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => headers.map(h => `"${row[h as keyof AuditReadinessData] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Audit_Readiness_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <SurfaceLoader message="Loading Audit Readiness Report..." />;

  return (
    <div 
      ref={scrollContainerRef}
      className="relative sm:absolute sm:inset-0 flex flex-col p-4 sm:p-6 space-y-4 animate-fade-in sm:overflow-hidden bg-[var(--background)] min-h-screen sm:min-h-0"
    >
      {/* Scroll Navigation Overlay for Mobile */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[60] sm:hidden">
        <button 
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="p-3 bg-white/90 backdrop-blur-md shadow-2xl rounded-full border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button 
          onClick={() => {
            if (scrollContainerRef.current) {
              const bottom = scrollContainerRef.current.scrollHeight;
              window.scrollTo({ top: bottom, behavior: 'smooth' });
            }
          }}
          className="p-3 bg-white/90 backdrop-blur-md shadow-2xl rounded-full border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              Audit Readiness Report
            </h1>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="View Logic Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Determine UID audit readiness based on multiple criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 rounded-md hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 rounded-md hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
            title="Print Report"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={handleExport}
            className="p-2 rounded-md hover:bg-[var(--accent-background)] text-[var(--foreground-muted)] transition-colors"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Status Dashboard
            </h2>
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              {showDashboard ? <><ChevronUp className="w-3 h-3" /> Hide Dashboard</> : <><ChevronDown className="w-3 h-3" /> Show Dashboard</>}
            </button>
            {statusFilters.length > 0 && (
                <button 
                  onClick={() => handleStatusToggle(null)} 
                  className="text-[10px] font-bold text-red-500 hover:underline px-2 py-0.5 bg-red-50 rounded"
                >
                    Clear Filters ({statusFilters.length})
                </button>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={handleSyncAll}
               disabled={syncLoading}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                 syncLoading 
                   ? 'bg-amber-100 text-amber-700 cursor-wait' 
                   : 'bg-green-100 text-green-700 hover:bg-green-200'
               }`}
             >
               <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
               {syncLoading ? 'Sync in Progress...' : 'Sync All Source Reports'}
             </button>
          </div>
        </div>

        {syncProgress && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between text-xs p-2 bg-white rounded shadow-sm border border-slate-100">
                <span className="font-medium text-slate-500">Account Submissions</span>
                {getSyncBadge(syncProgress.submissions.status)}
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-white rounded shadow-sm border border-slate-100">
                <span className="font-medium text-slate-500">Vouching Stats</span>
                {getSyncBadge(syncProgress.vouching.status)}
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-white rounded shadow-sm border border-slate-100">
                <span className="font-medium text-slate-500">Audit Status Excel</span>
                {getSyncBadge(syncProgress.auditStatus.status)}
              </div>
           </div>
        )}

        {showDashboard && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-4">
                <StatItem 
                    label="All UIDs" 
                    count={stats.total} 
                    isActive={statusFilters.length === 0} 
                    onClick={() => handleStatusToggle(null)} 
                    icon={FileText}
                    variant="all"
                />
                
                <StatItem 
                    label="Ready For Completion" 
                    count={stats.readyCompletion} 
                    isActive={statusFilters.includes('READY_COMPLETION')} 
                    onClick={() => handleStatusToggle('READY_COMPLETION')} 
                    icon={FileCheck}
                    variant="completion"
                />
                <StatItem 
                    label="Ready For Allocation" 
                    count={stats.readyAllocation} 
                    isActive={statusFilters.includes('READY_ALLOCATION')} 
                    onClick={() => handleStatusToggle('READY_ALLOCATION')} 
                    icon={UserCheck}
                    variant="allocation"
                />
                <StatItem 
                    label="For Guidance (C/D)" 
                    count={stats.readyGuidanceC} 
                    isActive={statusFilters.includes('READY_GUIDANCE_C')} 
                    onClick={() => handleStatusToggle('READY_GUIDANCE_C')} 
                    icon={ShieldCheck}
                    variant="auditable"
                />
                <StatItem 
                    label="For Guidance (A/B)" 
                    count={stats.readyGuidanceAB} 
                    isActive={statusFilters.includes('READY_GUIDANCE_AB')} 
                    onClick={() => handleStatusToggle('READY_GUIDANCE_AB')} 
                    icon={ShieldCheck}
                    variant="auditable"
                />
                <StatItem 
                    label="Bank Reconciliation Needed (Grade C)" 
                    count={stats.bankChecking} 
                    isActive={statusFilters.includes('BANK_CHECKING')} 
                    onClick={() => handleStatusToggle('BANK_CHECKING')} 
                    icon={Building}
                    variant="bank"
                />

                 <StatItem 
                    label="In Audit" 
                    count={stats.inProgress} 
                    isActive={statusFilters.includes('AUDIT_IN_PROGRESS')} 
                    onClick={() => handleStatusToggle('AUDIT_IN_PROGRESS')} 
                    icon={Activity}
                    variant="progress"
                />
                 <StatItem 
                    label="Completed" 
                    count={stats.completed} 
                    isActive={statusFilters.includes('COMPLETED')} 
                    onClick={() => handleStatusToggle('COMPLETED')} 
                    icon={CheckCircle2}
                    variant="completed"
                />
                <StatItem 
                    label="Completed Materially" 
                    count={stats.completedMaterial} 
                    isActive={statusFilters.includes('COMPLETED_MATERIAL')} 
                    onClick={() => handleStatusToggle('COMPLETED_MATERIAL')} 
                    icon={CheckCircle2}
                    variant="completed"
                />
                <StatItem 
                    label="Completed (Recheck Needed)" 
                    count={stats.completedRecheck} 
                    isActive={statusFilters.includes('COMPLETED_RECHECK')} 
                    onClick={() => handleStatusToggle('COMPLETED_RECHECK')} 
                    icon={AlertTriangle}
                    variant="rejected"
                />
                <StatItem 
                    label="Completed with Guidance" 
                    count={stats.completedGuidance} 
                    isActive={statusFilters.includes('COMPLETED_GUIDANCE')} 
                    onClick={() => handleStatusToggle('COMPLETED_GUIDANCE')} 
                    icon={ShieldCheck}
                    variant="completed"
                />
                <StatItem 
                    label="Pre Audit Pending" 
                    count={stats.pendingVouching} 
                    isActive={statusFilters.includes('PENDING_VOUCHING')} 
                    onClick={() => handleStatusToggle('PENDING_VOUCHING')} 
                    icon={Clock}
                    variant="pending"
                />
                <StatItem 
                    label="Incomplete Submission" 
                    count={stats.accountsNotReady} 
                    isActive={statusFilters.includes('ACCOUNTS_NOT_READY')} 
                    onClick={() => handleStatusToggle('ACCOUNTS_NOT_READY')} 
                    icon={AlertCircle}
                    variant="notready"
                />
                <StatItem 
                    label="Not Auditable" 
                    count={stats.notReady} 
                    isActive={statusFilters.includes('NOT_READY')} 
                    onClick={() => handleStatusToggle('NOT_READY')} 
                    icon={XCircle}
                    variant="notauditable"
                />
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
            <input 
              type="text"
              placeholder="Search by Institute, UID, Zone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-[var(--border)] bg-[var(--card-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 bg-[var(--card-inset-background)] px-3 py-1.5 rounded-lg border border-[var(--border)] max-w-full overflow-hidden">
              <Layers className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
              <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase shrink-0">Group By:</span>
              {[
                { key: 'Institute', label: 'Institute' },
                { key: 'Zone', label: 'Zone' },
                { key: 'SubZone', label: 'SubZone' },
                { key: 'Grade', label: 'Grade' },
                { key: 'Audit Status (Excel)', label: 'Audit Status' },
                { key: 'Audit Stage', label: 'Audit Stage' },
                { key: 'Vouching Stage', label: 'Vouching Stage' },
                { key: 'Status', label: 'Readiness' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleGroupByChange(item.key as keyof AuditReadinessData)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                    groupBy.includes(item.key as keyof AuditReadinessData)
                      ? 'bg-[var(--primary-color)] text-white shadow-sm'
                      : 'bg-[var(--card-background)] text-[var(--foreground-muted)] hover:bg-[var(--accent-background)] border border-[var(--border)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {groupBy.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-[var(--border)] ml-1 pl-2">
                  <button 
                    onClick={expandAllGroups}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline px-1"
                    title="Expand All Groups"
                  >
                    Expand All
                  </button>
                  <span className="text-[var(--border)] text-[10px] opacity-50">|</span>
                  <button 
                    onClick={collapseAllGroups}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:underline px-1"
                    title="Collapse All Groups"
                  >
                    Collapse All
                  </button>
                  <span className="text-[var(--border)] text-[10px] opacity-50">|</span>
                  <button 
                    onClick={() => { setGroupBy([]); setExpandedPaths(new Set()); }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline px-1"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] ml-2">
              <ListFilter className="w-4 h-4" />
              <span>{filteredData.length} records found</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Grid */}
      <Card 
        className="flex-none sm:flex-1 min-h-[500px] sm:min-h-0 overflow-hidden flex flex-col border border-[var(--border)] shadow-sm"
        contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col p-0"
      >
        <ScrollableTableContainer className="flex-1 min-h-0 relative">
          {(isChangingPageSize || isProcessingGroups) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                <div className="text-center">
                  <span className="block text-sm font-black text-slate-800 uppercase tracking-wider">
                    {isProcessingGroups ? 'Processing Tree Hierarchy' : 'Adjusting Viewport'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">This may take a moment for large datasets...</p>
                </div>
              </div>
            </div>
          )}
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[var(--card-inset-background)] border-b border-[var(--border)] shadow-sm text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3 font-bold text-[var(--foreground)] w-16 bg-[var(--card-inset-background)]">S.No</th>
                <SortableHeader label="Institute" sortKey="Institute" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="UID" sortKey="UID" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Reg No" sortKey="Reg No" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Centre Name" sortKey="Centre Name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Zone" sortKey="Zone" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="SubZone" sortKey="SubZone" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Month of Submission" sortKey="Month of Submission" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Pending Vouching" sortKey="Pending Vouching Count" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Rejected Vouching" sortKey="Rejected Vouching Count" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Audit Status (Excel)" sortKey="Audit Status (Excel)" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Auditor" sortKey="Auditor" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Grade" sortKey="Grade" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Audit Stage" sortKey="Audit Stage" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Vouching Stage" sortKey="Vouching Stage" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Status" sortKey="Status" currentSort={sortConfig} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--card-background)]">
              {groupBy.length > 0 ? (
                paginatedFlattenedRows.length > 0 ? (
                  paginatedFlattenedRows.map((row) => {
                    if (row.type === 'group') {
                      return renderGroupRow(row.node, expandedPaths, togglePath, getStatusBadge);
                    } else {
                      return <DataRow key={row.row.UID} row={row.row} index={row.index} pageSize="all" currentPage={1} getStatusBadge={getStatusBadge} onDrillDown={(row, type) => setSelectedDrillDown({row, type})} />;
                    }
                  })
                ) : (
                  <tr>
                    <td colSpan={16} className="px-4 py-10 text-center text-[var(--foreground-muted)]">
                      No data found for the current view.
                    </td>
                  </tr>
                )
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <DataRow key={row.UID} row={row} index={index} pageSize={pageSize} currentPage={currentPage} getStatusBadge={getStatusBadge} onDrillDown={(row, type) => setSelectedDrillDown({row, type})} />
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="px-4 py-10 text-center text-[var(--foreground-muted)]">
                    No records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>

        {/* Pagination */}
        <div className="print:hidden border-t border-[var(--border)] bg-[var(--card-inset-background)] flex-shrink-0">
          <PaginationControls 
            currentPage={currentPage}
            pageSize={pageSize === 'all' ? (groupBy.length > 0 ? flattenedVisibleRows.length : filteredData.length) : pageSize}
            totalItems={groupBy.length > 0 ? flattenedVisibleRows.length : filteredData.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { 
              setIsChangingPageSize(true);
              setTimeout(() => {
                setPageSize(size); 
                setCurrentPage(1); 
              }, 50);
            }}
            showAll={pageSize === 'all'}
          />
        </div>
      </Card>

      {/* Logic Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[var(--card-background)] shadow-2xl overflow-hidden animate-scale-up border border-[var(--border)] rounded-2xl">
            <div className="p-3 border-b border-[var(--border)] bg-blue-600 flex justify-between items-center text-white shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Audit Readiness Framework
              </h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6 text-sm bg-slate-50 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Core Eligibility Criteria
                </h4>
                <p className="text-gray-700 leading-relaxed text-[11px]">
                    A Unit (UID) is generally considered <strong>Ready for Audit</strong> if its accounts are submitted up to the month of <strong>March</strong>, 
                    and has <strong>No Active Issues</strong> (defined as a net balance $\le 0$ at the category level) across all underlying transaction reports. 
                    This ensures the data is finalized even if corrective negative entries are present.
                    <br/><br/>
                    <strong>Automated Mappings & Fallbacks:</strong><br/>
                    - If Institute is missing, it is derived from the UID pattern (e.g., BK-PBKIVV, WR-WRST).<br/>
                    - If Zone/SubZone is missing, it defaults to <strong>ABU</strong>.<br/>
                    - If Submission Month is missing, it is treated as <strong>March</strong> by default.<br/>
                    - If an UID is missing from the Account Submission Report, then the Submission month is treated as "other than March".<br/>
                    - If an UID is missing from the Audit Status Report, then the Source Audit status is treated as "Not Available".<br/>
                    - If Grade is missing, it is derived from the Master UID registration pattern.<br/><br/>
                    <strong>Sync Dependency:</strong><br/>
                    The Readiness state is a calculated attribute that relies on the real-time synchronization of three distinct source reports (Account Submissions, Vouching Stats, and Audit Status Excel). Any delay in syncing these sources will impact the accuracy of the readiness report.
                </p>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-slate-700 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider pl-1">
                    <Activity className="w-4 h-4" /> Readiness Priority Logic
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    <LogicCard 
                      title="1. Not Auditable (Explicit Exclusions)" 
                      logic="Units explicitly marked in the source as 'Not Available', 'Absent', or 'Not Audited'—as well as those missing from the Audit Status registry (N/A)—are excluded from the readiness pool, irrespective of their submission status." 
                      outcome="NOT_READY"
                    />
                    <LogicCard 
                      title="2. Incomplete Submission" 
                      logic="Only evaluated when the Account Submission setting is set to 'PREVIOUS_FY'. Under 'PREVIOUS_FY' mode, units with a last submitted month other than March are classified as 'Incomplete Submission'. Under other reporting modes, account submission data is not referred to at all for deciding audit logic, and the submission month defaults to March." 
                      outcome="INCOMPLETE_SUBMISSION"
                    />
                    <LogicCard 
                      title="3. Verification Status" 
                      logic="When the Audit Status in the source Excel is 'Verified', the audit cycle is concluded. Any residual rejections or pending items in live data will transition the status to 'Completed with Rejection' or 'Completed with Guidance'." 
                      outcome="COMPLETED STATUSES"
                    />
                    <LogicCard 
                      title="4. Active Audit Lock" 
                      logic="Units already tagged with in-progress markers (e.g., 'Allocated', 'Audit re-opened', 'Report submitted') are maintained in the 'In Audit' state to ensure stability during active processing." 
                      outcome="IN AUDIT"
                    />
                     <LogicCard 
                      title="5. Vouching Stage Logic (Hierarchical Priority)" 
                      logic="The system uses a prioritized logic to categorize UIDs. Any failure in 'Net Count' categories keeps the UID in 'Pending'. Guidance is only triggered if Net Count categories are all cleared." 
                      breakdown={[
                        { label: "Completed", text: "Truly all categories have net balance ≤ 0." },
                        { label: "Pending (Priority)", text: "Any 'Net Count' category exceeds its limit. This takes precedence over guidance." },
                        { label: "To Be Guided", text: "ALL 'Net Count' limits are met, BUT 'OnlyRejectionLimit' categories breach individual or global thresholds." },
                        { label: "Acceptable", text: "ALL Net Count and OnlyRejectionLimit categories are within thresholds." }
                      ]}
                      outcome="VOUCHING STAGE"
                    />
                    <LogicCard 
                      title="6. Grade-Based Readiness Matrix" 
                      logic={`Readiness is determined by the intersection of Vouching Stage (derived from category-level issues) and the Unit's Grade. Current threshold parameters are:`}
                      breakdown={[
                        { label: "Grade A/B", text: "For Guidance (A/B) - Stage is 'To Be Guided'. Ready for auditor guidance." },
                        { label: "Grade C/D", text: "For Guidance (C/D) - Stage is 'To Be Guided'. Ready for auditor guidance (excluding specific bank-check cases for C)." },
                        { label: "Grade D", text: "Ready For Completion (D) - Final stage when Vouching Stage is 'Completed' or 'Acceptable'." },
                        { label: "Grade A/B/C", text: "Ready For Allocation - Stage is 'Acceptable' or 'Completed'. Ready for immediate auditor assignment." },
                        { label: "Bank Reconciliation Needed (Grade C)", text: "Grade C units that are in 'Completed' or 'Acceptable' Vouching Stage but have bank balance mismatch (BB-1, 2, 3)." }
                      ]}
                      outcome="READY (A-D)"
                    />
                    <LogicCard 
                      title="7. Live Data Integrity Safeguard" 
                      logic="External 'Available' markers are overridden if live transaction data reveals unresolved items. All pending counts and active rejections must be cleared before a unit is prioritized for allocation." 
                      outcome="PENDING/REJECTED"
                    />
                    <LogicCard 
                      title="8. Source Column Mapping" 
                      logic="Understanding the data origin for report metrics (e.g., UPL, VCH, REJ, D) and Grid counts:" 
                      breakdown={[
                        { label: "UPL (Upload Pending)", text: "Derived from 'Pending_dues_to_centers_yellow_Red'. Represents items awaiting document upload." },
                        { label: "VCH (Vouching Pending)", text: "Aggregated count of PRE, IN, and PST stages in summary views." },
                        { label: "PRE (Pre Audit Pending)", text: "Derived from 'Pending_with_examiners'. Core pending vouching queue." },
                        { label: "IN (In Audit Pending)", text: "Derived from 'Pending_in_Audit'. Items currently under active audit." },
                        { label: "PST (Post Audit Pending)", text: "Derived from 'Pending_but_Audit_Completed'. Items where audit is finished but vouchers remain in system." },
                        { label: "REJ (Rejected)", text: "Mapped from 'Vouching_Rejected'. Items rejected by auditors/examiners needing correction." },
                        { label: "D (Completed)", text: "Mapped from 'Vouching_Accepted'. Verified and accepted vouchers." },
                        { label: "Grid Counts", text: "Pending/Rejected counts in the report grid represent the Net Positive Balance (Total - Corrective Entries) at the UID level." }
                      ]}
                      outcome="DATA ORIGIN"
                    />
                </div>
              </section>

              <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4" /> Source Freshness
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <SyncTimeCard label="Submissions" time={metadata?.syncTimes?.submissions} />
                  <SyncTimeCard label="Vouching" time={metadata?.syncTimes?.vouching} />
                  <SyncTimeCard label="Maintenance" time={metadata?.syncTimes?.auditStatus} />
                </div>
              </section>
            </div>
            <div className="p-3 border-t border-[var(--border)] bg-gray-50 flex justify-end">
              <Button onClick={() => setShowInfoModal(false)} size="sm" className="px-6">Understood</Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <PrintModal 
          title="Audit Readiness Report Preview" 
          onClose={() => setShowPrintModal(false)} 
          onPrint={initiatePrint}
        >
          <div id="printable-report-content">
            <h1 className="text-xl font-bold mb-2">Audit Readiness Report</h1>
            <p className="text-sm mb-4">Generated on: {new Date().toLocaleString()}</p>
            <table className="w-full text-sm text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">S.No</th>
                  <th className="border border-gray-300 px-2 py-1">Institute</th>
                  <th className="border border-gray-300 px-2 py-1">UID</th>
                  <th className="border border-gray-300 px-2 py-1">Centre</th>
                  <th className="border border-gray-300 px-2 py-1">Zone</th>
                  <th className="border border-gray-300 px-2 py-1">SubZone</th>
                  <th className="border border-gray-300 px-2 py-1">Month</th>
                  <th className="border border-gray-300 px-2 py-1">Pending</th>
                  <th className="border border-gray-300 px-2 py-1">Rejected</th>
                  <th className="border border-gray-300 px-2 py-1">Auditor</th>
                  <th className="border border-gray-300 px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={row.UID}>
                    <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{String(row.Institute || '')}</td>
                    <td className="border border-gray-300 px-2 py-1 font-mono font-bold text-blue-600">{String(row.UID || '')}</td>
                    <td className="border border-gray-300 px-2 py-1">{String(row['Centre Name'] || '')}</td>
                    <td className="border border-gray-300 px-2 py-1">{String(row.Zone || '')}</td>
                    <td className="border border-gray-300 px-2 py-1">{String(row.SubZone || '')}</td>
                    <td className="border border-gray-300 px-2 py-1 font-bold" style={{ color: String(row['Month of Submission']) === 'March' ? '#16a34a' : '#d97706' }}>
                      {String(row['Month of Submission'] || '')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-bold" style={{ color: Number(row['Pending Vouching Count'] || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      {Number(row['Pending Vouching Count'] || 0)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-bold" style={{ color: Number(row['Rejected Vouching Count'] || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                      {Number(row['Rejected Vouching Count'] || 0)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {String(row.Auditor || 'N/A')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-bold">
                      {String(row.Status || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintModal>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\:hidden { display: none !important; }
          .print\:border-none { border: none !important; }
          .print\:shadow-none { box-shadow: none !important; }
          .print\:p-0 { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; }
          th { background-color: #f2f2f2 !important; }
          .Card { border: none !important; box-shadow: none !important; }
        }
      `}} />

      {/* Drill-down Modal */}
      {selectedDrillDown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in shadow-2xl">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border-2 border-[var(--border)]">
            <div className={`p-4 border-b border-[var(--border)] flex items-center justify-between ${selectedDrillDown.type === 'pending' ? 'bg-orange-50' : 'bg-red-50'}`}>
              <div>
                <h2 className={`text-xl font-black uppercase tracking-tight ${selectedDrillDown.type === 'pending' ? 'text-orange-700' : 'text-red-700'}`}>
                  {selectedDrillDown.type === 'pending' ? 'Pending' : 'Rejected'} Breakdown
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase">{selectedDrillDown.row.Institute} ({selectedDrillDown.row.UID})</p>
              </div>
              <button 
                onClick={() => setSelectedDrillDown(null)}
                className="p-2 rounded-full hover:bg-white/50 text-slate-500 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {selectedDrillDown.type === 'pending' ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b-2 border-slate-100 italic">
                      <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Category</th>
                      <th className="pb-3 text-[10px] font-black uppercase text-red-500 text-right">Upload</th>
                      <th className="pb-3 text-[10px] font-black uppercase text-orange-500 text-right">Pre Audit</th>
                      <th className="pb-3 text-[10px] font-black uppercase text-pink-500 text-right">In Audit</th>
                      <th className="pb-3 text-[10px] font-black uppercase text-green-500 text-right">Post Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const filtered = (selectedDrillDown.row.pendingDrillDown || []).filter(
                        (cat: any) => (cat.uploadPending || 0) !== 0 || (cat.vouchingPending || cat.preAuditPending || 0) !== 0 || (cat.auditPending || cat.inAuditPending || 0) !== 0 || (cat.postAuditPending || 0) !== 0
                      );
                      return filtered.length > 0 ? (
                        filtered.map((cat: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 text-sm font-bold text-slate-700">{cat.category}</td>
                            <td className="py-3 text-sm text-right font-mono text-red-500 font-black">{(cat.uploadPending || 0).toLocaleString()}</td>
                            <td className="py-3 text-sm text-right font-mono text-orange-500 font-black">{(cat.vouchingPending || cat.preAuditPending || 0).toLocaleString()}</td>
                            <td className="py-3 text-sm text-right font-mono text-pink-500 font-black">{(cat.auditPending || cat.inAuditPending || 0).toLocaleString()}</td>
                            <td className="py-3 text-sm text-right font-mono text-green-500 font-black">{(cat.postAuditPending || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                            No pending details found for this UID.
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b-2 border-slate-100 italic">
                      <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Rejection Category</th>
                      <th className="pb-3 text-[10px] font-black uppercase text-red-600 text-right">Rejected Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const filtered = (selectedDrillDown.row.rejectedDrillDown || []).filter(
                        (cat: any) => (cat.vouchingRejected || 0) !== 0
                      );
                      return filtered.length > 0 ? (
                        filtered.map((cat: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 text-sm font-bold text-slate-700">{cat.category}</td>
                            <td className="py-3 text-sm text-right font-mono text-red-600 font-black">{(cat.vouchingRejected || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-12 text-center text-slate-400 italic">
                            No rejection details found for this UID.
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            <div className={`p-4 border-t border-[var(--border)] text-right ${selectedDrillDown.type === 'pending' ? 'bg-orange-50/50' : 'bg-red-50/50'}`}>
              <Button 
                onClick={() => setSelectedDrillDown(null)}
                variant="outline"
                className="bg-white hover:bg-slate-100"
              >
                Close Report
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

interface DataRowProps {
  row: AuditReadinessData;
  index: number;
  pageSize: number | 'all';
  currentPage: number;
  getStatusBadge: (type: string, status: string) => React.ReactNode;
  onDrillDown: (row: AuditReadinessData, type: 'pending' | 'rejected') => void;
}

const DataRow: React.FC<DataRowProps> = ({ row, index, pageSize, currentPage, getStatusBadge, onDrillDown }) => {
  const statusColorMap: Record<string, string> = {
    'Sky Blue': 'bg-sky-100 text-sky-700 border-sky-300',
    'Indigo': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'Rose': 'bg-rose-100 text-rose-700 border-rose-300',
    'Yellow': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Pink': 'bg-pink-100 text-pink-700 border-pink-300',
    'Black': 'bg-slate-900 text-white border-slate-700',
    'Violet': 'bg-violet-100 text-violet-700 border-violet-300',
    'Green': 'bg-green-100 text-green-700 border-green-300',
    'Light Green': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Orange': 'bg-orange-100 text-orange-700 border-orange-300',
    'Red': 'bg-red-100 text-red-700 border-red-300',
    'Gray': 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const colorClass = statusColorMap[row['Status Colour'] || ''] || statusColorMap['Gray'];

  return (
    <tr className="hover:bg-[var(--list-item-hover-background)] transition-colors border-b border-[var(--border)] group">
      <td className="px-4 py-3 font-medium text-[var(--foreground-muted)]">
        {pageSize === 'all' ? index + 1 : (currentPage - 1) * pageSize + index + 1}
      </td>
      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{String(row.Institute || '')}</td>
      <td className="px-4 py-3 font-bold text-[var(--primary-color)]">{String(row.UID || '')}</td>
      <td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-[10px]">{String(row['Reg No'] || '')}</td>
      <td className="px-4 py-3 text-[var(--foreground-muted)]">{String(row['Centre Name'] || '')}</td>
      <td className="px-4 py-3 text-[var(--foreground-muted)]">{String(row.Zone || '')}</td>
      <td className="px-4 py-3 text-[var(--foreground-muted)]">{String(row.SubZone || '')}</td>
      <td className="px-4 py-3">
        <span className={`font-bold ${String(row['Month of Submission']) === 'March' ? 'text-green-600' : 'text-amber-600'}`}>
          {String(row['Month of Submission'] || '')}
        </span>
      </td>
      <td className="px-4 py-3">
        <button 
          onClick={() => Number(row['Pending Vouching Count'] || 0) !== 0 && onDrillDown(row, 'pending')}
          disabled={Number(row['Pending Vouching Count'] || 0) === 0}
          className={`font-black tracking-tight ${Number(row['Pending Vouching Count'] || 0) !== 0 ? 'text-red-700 hover:underline cursor-pointer' : 'text-green-600 cursor-default'}`}
        >
          {Number(row['Pending Vouching Count'] || 0).toLocaleString()}
        </button>
      </td>
      <td className="px-4 py-3">
        <button 
          onClick={() => Number(row['Rejected Vouching Count'] || 0) !== 0 && onDrillDown(row, 'rejected')}
          disabled={Number(row['Rejected Vouching Count'] || 0) === 0}
          className={`font-black tracking-tight ${Number(row['Rejected Vouching Count'] || 0) !== 0 ? 'text-red-700 hover:underline cursor-pointer font-black' : 'text-green-600 cursor-default'}`}
        >
          {Number(row['Rejected Vouching Count'] || 0).toLocaleString()}
        </button>
      </td>
      <td className="px-4 py-3 italic text-[var(--foreground-muted)] text-xs">
        {String(row['Audit Status (Excel)'] || '')}
      </td>
      <td className="px-4 py-3 font-medium text-[var(--foreground-muted)] text-xs">
        {String(row.Auditor || 'N/A')}
      </td>
      <td className="px-4 py-3 text-center">
          <Badge 
            variant="outline" 
            className={`font-mono text-[10px] ${
              row.Grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              row.Grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              row.Grade === 'C' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              row.Grade === 'D' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {String(row.Grade || 'N/A')}
          </Badge>
      </td>
      <td className="px-4 py-3 font-medium text-[var(--foreground-muted)] text-xs">
        {String(row['Audit Stage'] || '')}
      </td>
      <td className="px-4 py-3 font-medium text-[var(--foreground-muted)] text-xs">
        {String(row['Vouching Stage'] || '')}
      </td>
      <td className="px-4 py-3">
        <Badge className={`font-bold ${colorClass}`}>
          {String(row.Status || '')}
        </Badge>
      </td>
    </tr>
  );
};

const renderGroupRow = (
  node: any, 
  expandedPaths: Set<string>, 
  togglePath: (path: string) => void,
  _getStatusBadge: (type: string, status: string) => React.ReactNode
): React.ReactNode => {
  const isExpanded = expandedPaths.has(node.path);
  const indent = node.level * 24;

  return (
    <tr 
      key={node.path}
      className="bg-[var(--accent-background)] cursor-pointer hover:bg-[var(--list-item-hover-background)] border-b border-[var(--border)]"
      onClick={() => togglePath(node.path)}
    >
      <td colSpan={16} className="px-4 py-2 font-bold text-[var(--primary-color)]" style={{ paddingLeft: `${16 + indent}px` }}>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="text-[var(--foreground-muted)] font-medium uppercase text-[10px] tracking-wider">{String(node.key || '')}:</span>
          {String(node.value || '')} ({node.items.length})
        </div>
      </td>
    </tr>
  );
};

interface StatItemProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon: any;
  variant?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, count, isActive, onClick, icon: Icon, variant }) => {
  const variants: Record<string, { bg: string, border: string, text: string }> = {
    all: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    allocation: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    completion: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    bank: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    progress: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
    completed: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    completedWithRejection: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
    completedWithPending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    auditable: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    notready: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
    notauditable: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  };

  const v = variants[variant || 'all'] || variants.all;

  return (
    <div 
      onClick={onClick}
      className={`p-2.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[75px] sm:min-h-[100px] overflow-hidden relative ${v.bg} ${v.border} ${
        isActive 
          ? `shadow-lg translate-y-[-2px] ring-4 ring-offset-2 ring-white dark:ring-black border-opacity-100` 
          : `opacity-90 hover:opacity-100 border-opacity-40`
      }`}
    >
      <span className={`text-[10px] sm:text-[13px] font-black uppercase tracking-tight mb-2 px-1 w-full leading-tight ${v.text}`}>
        {label}
      </span>
      
      <div className="flex items-center gap-2 sm:gap-3">
         <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${v.text}`} />
         <span className={`text-lg sm:text-2xl font-black ${v.text}`}>
           {(count || 0).toLocaleString()}
         </span>
      </div>
      
      {isActive && (
        <div className="absolute top-1 right-2">
          <div className={`w-1.5 h-1.5 rounded-full ${v.bg.replace('bg-', 'bg-').replace('50', '600')} animate-pulse`} />
        </div>
      )}
    </div>
  );
};

const LogicCard = ({ title, logic, outcome, breakdown }: { title: string; logic: string; outcome: string; breakdown?: any[] }) => (
    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
        <h6 className="font-bold text-slate-800 text-[11px] mb-1 uppercase tracking-wide flex justify-between">
            {title}
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-2 shrink-0">{outcome}</span>
        </h6>
        <p className="text-slate-600 text-[11px] leading-relaxed mb-2">{logic}</p>
        {breakdown && (
            <div className="grid grid-cols-1 gap-1.5 mt-2 border-t border-slate-50 pt-2 pb-1">
                {breakdown.map((b, i) => (
                    <div key={i} className="text-[10px] text-slate-700 flex gap-2">
                        <span className="font-bold text-blue-700 shrink-0 bg-blue-50/50 px-1 rounded">{b.label}:</span> 
                        <span className="leading-tight">{b.text}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const SyncTimeCard = ({ label, time }: { label: string; time?: string }) => {
    const formatted = time === 'Not Considered' ? 'Not Considered' : (time ? new Date(time).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }) : 'Never');

    return (
        <div className="flex flex-col gap-1 p-2 bg-white border border-gray-100 rounded-lg text-center shadow-sm">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-[10px] font-bold text-gray-700">{formatted}</span>
        </div>
    );
};

interface SortableHeaderProps {
  label: string;
  sortKey: keyof AuditReadinessData;
  currentSort: SortConfig[];
  onSort: (key: keyof AuditReadinessData, multi: boolean) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSort, onSort }) => {
  const sortIndex = currentSort.findIndex(s => s.key === sortKey);
  const config = sortIndex > -1 ? currentSort[sortIndex] : null;
  
  return (
    <th 
      className="px-4 py-3 font-bold text-[var(--foreground)] cursor-pointer hover:bg-[var(--list-item-hover-background)] transition-colors group"
      onClick={(e) => onSort(sortKey, e.shiftKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <div className="flex items-center">
          <ArrowUpDown className={`w-3 h-3 transition-opacity ${config ? 'opacity-100 text-[var(--primary-color)]' : 'opacity-0 group-hover:opacity-50'}`} />
          {currentSort.length > 1 && sortIndex > -1 && (
            <span className="text-[8px] ml-0.5 bg-[var(--primary-color)] text-white rounded-full w-3 h-3 flex items-center justify-center">
              {sortIndex + 1}
            </span>
          )}
        </div>
      </div>
    </th>
  );
};

export default AuditReadinessReport;
