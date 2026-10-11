import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import * as XLSX from 'xlsx';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart3, 
  Table, 
  RefreshCw, 
  Search, 
  Filter as FilterIcon, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  X,
  Check,
  ArrowUpDown,
  Download,
  Maximize2,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Info,
  CheckCircle2,
  FileText,
  UserCheck,
  FileCheck,
  Building,
  Activity,
  AlertTriangle,
  FileWarning,
  PieChart as PieChartIcon,
  Clock,
  XCircle,
  Menu,
  ChevronUp,
  LayoutTemplate,
  ListFilter,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { toast } from '../ui/Toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { ScrollableTableContainer } from '../common/ScrollableTableContainer';
import { PaginationControls } from '../common/PaginationControls';

// --- Types ---
interface WorkbenchRow {
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
  gradeA?: string;
  gradeB?: string;
  gradeC?: string;
  gradeD?: string;
  Status: string;
  statusType: string;
  'Audit Stage': string;
  'Vouching Stage': string;
  'Status Colour': string;
  pendingDrillDown?: any[];
  rejectedDrillDown?: any[];
  [key: string]: any;
}

interface FilterState {
  columns: {
    [columnId: string]: {
      values: string[];
      searchText: string;
    };
  };
  globalSearch: string;
  groupBy: string[];
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'grid', label: 'Data Workbench', icon: Table },
  { id: 'logic', label: 'Logic Framework', icon: Info }
];

const TARGET_INST_ORDER = ['PBKIVV', 'WRST', 'RERF', 'BKES', 'TSRCT', 'SSAF', 'MKT', 'RMCS'];

const MATRIX_STATUSES = [
  { label: 'Completed', type: 'COMPLETED', color: 'text-green-600 dark:text-green-400', hoverColor: 'hover:bg-green-50/50 dark:hover:bg-green-950/20' },
  { label: 'Completed Materially', type: 'COMPLETED_MATERIAL', color: 'text-emerald-600 dark:text-emerald-400', hoverColor: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20' },
  { label: 'Completed with Guidance', type: 'COMPLETED_GUIDANCE', color: 'text-orange-600 dark:text-orange-400', hoverColor: 'hover:bg-orange-50/50 dark:hover:bg-orange-950/20' },
  { label: 'Ready For Completion', type: 'READY_COMPLETION', color: 'text-blue-600 dark:text-blue-400', hoverColor: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20' },
  { label: 'For Guidance (C/D)', type: 'READY_GUIDANCE_C', color: 'text-amber-600 dark:text-amber-400', hoverColor: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20' },
  { label: 'For Guidance (A/B)', type: 'READY_GUIDANCE_AB', color: 'text-yellow-600 dark:text-yellow-400', hoverColor: 'hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20' },
  { label: 'Pre Audit Pending', type: 'PENDING_VOUCHING', color: 'text-pink-600 dark:text-pink-400', hoverColor: 'hover:bg-pink-50/50 dark:hover:bg-pink-950/20' },
  { label: 'Only Bank Balance Checking Needed', type: 'BANK_CHECKING', color: 'text-rose-600 dark:text-rose-400', hoverColor: 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' },
  { label: 'Completed (Recheck Needed)', type: 'COMPLETED_RECHECK', color: 'text-red-600 dark:text-red-400', hoverColor: 'hover:bg-red-50/50 dark:hover:bg-red-950/20' },
  { label: 'Ready For Allocation', type: 'READY_ALLOCATION', color: 'text-violet-600 dark:text-violet-400', hoverColor: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20' },
  { label: 'In Audit', type: 'AUDIT_IN_PROGRESS', color: 'text-slate-900 dark:text-slate-100', hoverColor: 'hover:bg-slate-100 dark:hover:bg-slate-800/40' },
  { label: 'Not Auditable', type: 'NOT_READY', color: 'text-slate-500 dark:text-slate-400', hoverColor: 'hover:bg-slate-100/50 dark:hover:bg-slate-800/20' },
  { label: 'Incomplete Submission', type: 'ACCOUNTS_NOT_READY', color: 'text-slate-500 dark:text-slate-400', hoverColor: 'hover:bg-slate-100/50 dark:hover:bg-slate-800/20' }
];

export default function AuditWorkbench() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'grid' | 'logic'>('grid');
  const [blockerTab, setBlockerTab] = useState<'exclusive' | 'summary'>('exclusive');
  const [data, setData] = useState<WorkbenchRow[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WorkbenchRow | null>(null);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);
  const [selectedAuditStageFilters, setSelectedAuditStageFilters] = useState<string[]>([]);
  const [selectedVouchingStageFilters, setSelectedVouchingStageFilters] = useState<string[]>([]);
  const [selectedInstitutes, setSelectedInstitutes] = useState<string[]>([]);
  const [selectedBlocker, setSelectedBlocker] = useState<{ 
    category: string, 
    type: 'pending' | 'rejected' | 'both' | 'upl' | 'pre' | 'inA' | 'pst' | 'rej' | 'total', 
    mode: 'exclusive' | 'summary' 
  } | null>(null);
  const [infiniteScroll, setInfiniteScroll] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [defaultIsCollapsed, setDefaultIsCollapsed] = useState(false);
  const [columnWrapSettings, setColumnWrapSettings] = useState<Record<string, boolean>>({
    'Centre Name': true,
    'SubZone': true,
    'Audit Status (Excel)': true,
    'Status': true
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'Institute', 'UID', 'Reg No', 'Centre Name', 'Zone', 'SubZone', 
    'Month of Submission', 'Pending Vouching Count', 'Rejected Vouching Count', 
    'Audit Status (Excel)', 'Auditor', 'Grade', 'Audit Stage', 'Vouching Stage', 'Status'
  ]);
  const { callServer } = useData() as any;
  const { user, hasPermission } = useAuth();
  const { theme } = useTheme();

  if (!hasPermission('audit_workbench_view')) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <Card className="p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Permission Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">
            You do not have the required permission (<code>audit_workbench_view</code>) to access the Audit Workbench.
          </p>
        </Card>
      </div>
    );
  }
  
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const chartTheme = useMemo(() => ({
    tooltip: {
      contentStyle: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderRadius: '12px',
        border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        padding: '12px'
      },
      itemStyle: {
        fontSize: '11px',
        fontWeight: '800',
        color: isDark ? '#f8fafc' : '#1e293b'
      }
    },
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    cursor: isDark ? '#1e293b' : '#f8fafc'
  }), [isDark]);

  // State for filtering and grouping
  const [filterState, setFilterState] = useState<FilterState>({
    columns: {},
    globalSearch: '',
    groupBy: []
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }[]>([{ key: 'UID', direction: 'asc' }]);

  // Resize event trigger for charts visibility
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callServer('getAuditReadinessReportData');
      setData(result?.data || []);
      setMetadata(result?.metadata || null);
    } catch (error) {
      console.error('Error fetching workbench data:', error);
      toast('Failed to load workbench data', 'error');
    } finally {
      setLoading(false);
    }
  }, [callServer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncAll = async () => {
    if (!hasPermission('audit_workbench_sync')) {
      toast('You do not have permission to trigger a sync (audit_workbench_sync required)', 'error');
      return;
    }
    try {
      toast('Starting source report sync...', 'info');
      const result = await callServer('syncAllAuditReadinessSources', user?.email);
      if (result.success) {
        toast('Sync completed successfully', 'success');
        fetchData();
      } else {
        toast(result.error || 'Sync failed', 'error');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast('Failed to trigger sync', 'error');
    }
  };

  const isRowMatchingBlocker = useCallback((row: WorkbenchRow, blocker: { category: string, type: string, mode: 'exclusive' | 'summary' } | null) => {
    if (!blocker) return true;
    
    if (blocker.mode === 'exclusive') {
      const catsInRow = new Set<string>();
      const pendingCats = new Set<string>();
      const rejectedCats = new Set<string>();

      (row.pendingDrillDown || []).forEach(p => {
        const up = p.uploadPending || 0;
        const pre = p.vouchingPending || p.preAuditPending || 0;
        const inA = p.auditPending || p.inAuditPending || 0;
        const post = p.postAuditPending || 0;
        if (up !== 0 || pre !== 0 || inA !== 0 || post !== 0) {
          catsInRow.add(p.category);
          pendingCats.add(p.category);
        }
      });
      (row.rejectedDrillDown || []).forEach(r => {
        if ((r.vouchingRejected || 0) !== 0) {
          catsInRow.add(r.category);
          rejectedCats.add(r.category);
        }
      });

      if (blocker.category === 'Multiple Categories') {
        if (catsInRow.size <= 1) return false;
      } else {
        if (catsInRow.size !== 1 || !catsInRow.has(blocker.category)) return false;
      }

      const pMatch = (row.pendingDrillDown || []).find(p => p.category === blocker.category);
      const rMatch = (row.rejectedDrillDown || []).find(r => r.category === blocker.category);

      if (blocker.type === 'upl') {
        if (blocker.category === 'Multiple Categories') {
          return (row.pendingDrillDown || []).some(p => (p.uploadPending || 0) > 0);
        }
        return (pMatch?.uploadPending || 0) > 0;
      }
      if (blocker.type === 'pre') {
        if (blocker.category === 'Multiple Categories') {
          return (row.pendingDrillDown || []).some(p => (p.vouchingPending || p.preAuditPending || 0) > 0);
        }
        return (pMatch?.vouchingPending || pMatch?.preAuditPending || 0) > 0;
      }
      if (blocker.type === 'inA') {
        if (blocker.category === 'Multiple Categories') {
          return (row.pendingDrillDown || []).some(p => (p.auditPending || p.inAuditPending || 0) > 0);
        }
        return (pMatch?.auditPending || pMatch?.inAuditPending || 0) > 0;
      }
      if (blocker.type === 'pst') {
        if (blocker.category === 'Multiple Categories') {
          return (row.pendingDrillDown || []).some(p => (p.postAuditPending || 0) > 0);
        }
        return (pMatch?.postAuditPending || 0) > 0;
      }
      if (blocker.type === 'rej') {
        if (blocker.category === 'Multiple Categories') {
          return (row.rejectedDrillDown || []).some(r => (r.vouchingRejected || 0) > 0);
        }
        return (rMatch?.vouchingRejected || 0) > 0;
      }
      if (blocker.type === 'pending') {
        if (blocker.category === 'Multiple Categories') {
          return Array.from(pendingCats).length > 0;
        }
        return pendingCats.has(blocker.category);
      }
      if (blocker.type === 'rejected') {
        if (blocker.category === 'Multiple Categories') {
          return Array.from(rejectedCats).length > 0;
        }
        return rejectedCats.has(blocker.category);
      }
      return true;
    } else {
      // Summary mode - show any row that has this category and the specific type
      const pMatch = (row.pendingDrillDown || []).find(p => p.category === blocker.category);
      const rMatch = (row.rejectedDrillDown || []).find(r => r.category === blocker.category);

      if (blocker.type === 'upl') return (pMatch?.uploadPending || 0) > 0;
      if (blocker.type === 'pre') return (pMatch?.vouchingPending || pMatch?.preAuditPending || 0) > 0;
      if (blocker.type === 'inA') return (pMatch?.auditPending || pMatch?.inAuditPending || 0) > 0;
      if (blocker.type === 'pst') return (pMatch?.postAuditPending || 0) > 0;
      if (blocker.type === 'rej') return (rMatch?.vouchingRejected || 0) > 0;
      if (blocker.type === 'pending' || blocker.type === 'both' || blocker.type === 'total') {
        const hasPending = !!pMatch && ((pMatch.uploadPending || 0) > 0 || (pMatch.vouchingPending || pMatch.preAuditPending || 0) > 0 || (pMatch.auditPending || pMatch.inAuditPending || 0) > 0 || (pMatch.postAuditPending || 0) > 0);
        const hasRejected = !!rMatch && (rMatch.vouchingRejected || 0) > 0;
        if (blocker.type === 'pending') return hasPending;
        return hasPending || hasRejected;
      }
      if (blocker.type === 'rejected') return !!rMatch && (rMatch.vouchingRejected || 0) > 0;
      return false;
    }
  }, []);

  const getFilteredDataByOmission = useCallback((omittedFilter: 'status' | 'grade' | 'institute' | 'blocker' | 'status_and_institute' | 'none') => {
    return data.filter(row => {
      // Institute filter
      if (omittedFilter !== 'institute' && omittedFilter !== 'status_and_institute' && selectedInstitutes.length > 0) {
        if (!selectedInstitutes.includes(row.Institute)) return false;
      }

      const rowStatusType = row.StatusType || row.statusType;

      // Status/Stage filters
      if (omittedFilter !== 'status' && omittedFilter !== 'status_and_institute') {
        if (selectedStatusFilters.length > 0) {
          const rowStatusType = row.StatusType || row.statusType;
          if (!selectedStatusFilters.includes(rowStatusType)) return false;
        }

        if (selectedAuditStageFilters.length > 0) {
          if (!selectedAuditStageFilters.includes(row['Audit Stage'])) return false;
        }

        if (selectedVouchingStageFilters.length > 0) {
          if (!selectedVouchingStageFilters.includes(row['Vouching Stage'])) return false;
        }
      }

      // Grade filter (Column filter)
      if (omittedFilter !== 'grade') {
        const gradeValues = filterState.columns['Grade']?.values || [];
        if (gradeValues.length > 0 && !gradeValues.includes(row.Grade)) return false;
      }

      // Blocker filter
      if (omittedFilter !== 'blocker' && selectedBlocker) {
        if (!isRowMatchingBlocker(row, selectedBlocker)) return false;
      }

      // Global Search
      if (filterState.globalSearch) {
        const search = filterState.globalSearch.toLowerCase();
        const matchesGlobal = Object.values(row).some(val => 
          String(val).toLowerCase().includes(search)
        );
        if (!matchesGlobal) return false;
      }

      // Other Column Filters
      for (const colId in filterState.columns) {
        if (colId === 'Grade') continue; // Handled separately for omission
        const filter = filterState.columns[colId];
        if (filter.values.length > 0 && !filter.values.includes(String(row[colId]))) return false;
        if (filter.searchText && !String(row[colId]).toLowerCase().includes(filter.searchText.toLowerCase())) return false;
      }

      return true;
    });
  }, [data, selectedInstitutes, selectedStatusFilters, selectedAuditStageFilters, selectedVouchingStageFilters, filterState, selectedBlocker, isRowMatchingBlocker]);

  const filteredContextData = useMemo(() => {
    // This was used for many things, let's make it the "fully filtered but ignoring current row selection" data?
    // Actually, let's keep it for charts and make cards use specific filtered sets.
    return getFilteredDataByOmission('none');
  }, [getFilteredDataByOmission]);

  const stats = useMemo(() => {
    const context = getFilteredDataByOmission('status');
    const auditStats: Record<string, number> = {};
    const vouchStats: Record<string, number> = {};

    context.forEach(d => {
      const aStage = d['Audit Stage'] || 'N/A';
      const vStage = d['Vouching Stage'] || 'N/A';
      auditStats[aStage] = (auditStats[aStage] || 0) + 1;
      vouchStats[vStage] = (vouchStats[vStage] || 0) + 1;
    });

    return {
      total: context.length,
      readyAllocation: context.filter(d => (d.StatusType || d.statusType) === 'READY_ALLOCATION').length,
      readyCompletion: context.filter(d => (d.StatusType || d.statusType) === 'READY_COMPLETION').length,
      readyGuidanceC: context.filter(d => (d.StatusType || d.statusType) === 'READY_GUIDANCE_C').length,
      readyGuidanceAB: context.filter(d => (d.StatusType || d.statusType) === 'READY_GUIDANCE_AB').length,
      bankChecking: context.filter(d => (d.StatusType || d.statusType) === 'BANK_CHECKING').length,
      preAuditPending: context.filter(d => (d.StatusType || d.statusType) === 'PENDING_VOUCHING').length,
      pendingReadiness: context.filter(d => (d.StatusType || d.statusType) === 'PENDING_READINESS').length,
      inProgress: context.filter(d => (d.StatusType || d.statusType) === 'AUDIT_IN_PROGRESS').length,
      completed: context.filter(d => (d.StatusType || d.statusType) === 'COMPLETED').length,
      completedMaterially: context.filter(d => (d.StatusType || d.statusType) === 'COMPLETED_MATERIAL').length,
      completedRecheck: context.filter(d => (d.StatusType || d.statusType) === 'COMPLETED_RECHECK').length,
      completedGuidance: context.filter(d => (d.StatusType || d.statusType) === 'COMPLETED_GUIDANCE').length,
      accountsNotReady: context.filter(d => (d.StatusType || d.statusType) === 'ACCOUNTS_NOT_READY').length,
      notReady: context.filter(d => (d.StatusType || d.statusType) === 'NOT_READY').length,
      auditStages: auditStats,
      vouchingStages: vouchStats
    };
  }, [getFilteredDataByOmission]);

  const uniqueInstitutes = useMemo(() => {
    const institutes = data.map(d => d.Institute).filter(Boolean);
    return Array.from(new Set(institutes)).sort();
  }, [data]);

  const instituteStats = useMemo(() => {
    const context = getFilteredDataByOmission('institute');
    const counts: Record<string, number> = {};
    context.forEach(d => {
      if (d.Institute) {
        counts[d.Institute] = (counts[d.Institute] || 0) + 1;
      }
    });
    return counts;
  }, [getFilteredDataByOmission]);

  const gradeStats = useMemo(() => {
    const context = getFilteredDataByOmission('grade');
    const counts: Record<string, number> = {};
    context.forEach(d => {
      if (d.Grade) {
        counts[d.Grade] = (counts[d.Grade] || 0) + 1;
      }
    });
    return counts;
  }, [getFilteredDataByOmission]);

  const uniqueGrades = useMemo(() => {
    const grades = data.map(d => d.Grade).filter(Boolean);
    return Array.from(new Set(grades)).sort();
  }, [data]);

  const matrixData = useMemo(() => {
    const context = getFilteredDataByOmission('status_and_institute');
    
    const grid: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    MATRIX_STATUSES.forEach(s => {
      grid[s.type] = {};
      rowTotals[s.type] = 0;
      TARGET_INST_ORDER.forEach(inst => {
        grid[s.type][inst] = 0;
      });
    });
    TARGET_INST_ORDER.forEach(inst => {
      colTotals[inst] = 0;
    });

    context.forEach(row => {
      const statusType = row.statusType || row.StatusType;
      const inst = (row.Institute || '').trim().toUpperCase();
      
      if (grid[statusType] && grid[statusType][inst] !== undefined) {
        grid[statusType][inst]++;
        rowTotals[statusType]++;
        colTotals[inst]++;
        grandTotal++;
      }
    });

    return { grid, rowTotals, colTotals, grandTotal };
  }, [getFilteredDataByOmission]);

  const handleMatrixClick = (statusType: string | null, inst: string | null) => {
    if (statusType === null && inst === null) {
      setSelectedStatusFilters([]);
      setSelectedInstitutes([]);
    } else if (statusType === null && inst !== null) {
      setSelectedInstitutes(prev => 
        prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
      );
    } else if (statusType !== null && inst === null) {
      setSelectedStatusFilters(prev => 
        prev.includes(statusType) ? prev.filter(s => s !== statusType) : [...prev, statusType]
      );
    } else if (statusType !== null && inst !== null) {
      const isStatusActive = selectedStatusFilters.includes(statusType);
      const isInstActive = selectedInstitutes.includes(inst);
      
      if (isStatusActive && isInstActive) {
        setSelectedStatusFilters(prev => prev.filter(s => s !== statusType));
        setSelectedInstitutes(prev => prev.filter(i => i !== inst));
      } else {
        setSelectedStatusFilters(prev => prev.includes(statusType) ? prev : [...prev, statusType]);
        setSelectedInstitutes(prev => prev.includes(inst) ? prev : [...prev, inst]);
      }
    }
  };

  // Unified filtering logic for both Grid and Export
  const baseFilteredData = useMemo(() => getFilteredDataByOmission('none'), [getFilteredDataByOmission]);

  const filteredData = useMemo(() => {
    let result = getFilteredDataByOmission('none');

    // Sorting
    if (sortConfig.length > 0) {
      result.sort((a, b) => {
        for (const config of sortConfig) {
          let aVal = a[config.key];
          let bVal = b[config.key];
          
          if (config.key === 'Reg No') {
            const aNum = parseFloat(String(aVal).replace(/[^0-9.]/g, ''));
            const bNum = parseFloat(String(bVal).replace(/[^0-9.]/g, ''));
            if (!isNaN(aNum) && !isNaN(bNum)) { aVal = aNum; bVal = bNum; }
          }

          if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [getFilteredDataByOmission, sortConfig]);

  const blockerStats = useMemo(() => {
    const categories: Record<string, { 
      pending: number; 
      rejected: number; 
      uids: Set<string>;
      uploadPending: number;
      preAuditPending: number;
      inAuditPending: number;
      postAuditPending: number;
    }> = {};
    let multiple = { 
      pending: 0, 
      rejected: 0, 
      uids: new Set<string>(),
      uploadPending: 0,
      preAuditPending: 0,
      inAuditPending: 0,
      postAuditPending: 0
    };

    // Calculate stats based on base filtered data (ignores current Exclusive Vouching Blockers selection)
    // This allows users to see other categories even while one is selected for filtering the list.
    const activeStatusData = getFilteredDataByOmission('blocker');

    const totalUIDs = new Set<string>();
    activeStatusData.forEach(row => {
      const pendingVal = row['Pending Vouching Count'] || 0;
      const rejectedVal = row['Rejected Vouching Count'] || 0;

      // Calculate category-level net totals to determine if active issues exist (net > 0)
      const catTotals: Record<string, number> = {};
      (row.pendingDrillDown || []).forEach(p => {
        const cat = p.category || 'General';
        catTotals[cat] = (catTotals[cat] || 0) + (p.uploadPending || 0) + (p.vouchingPending || p.preAuditPending || 0) + (p.auditPending || p.inAuditPending || 0) + (p.postAuditPending || 0);
      });
      (row.rejectedDrillDown || []).forEach(r => {
        const cat = r.category || 'General';
        catTotals[cat] = (catTotals[cat] || 0) + (r.vouchingRejected || 0);
      });

      const hasIssues = Object.values(catTotals).some(val => val > 0);

      if (hasIssues) {
        totalUIDs.add(row.UID);
        const catsInRow = new Set<string>();
        const rowPending = {
          upload: 0, pre: 0, in: 0, post: 0
        };

        Object.entries(catTotals).forEach(([cat, val]) => {
          if (val > 0) {
            catsInRow.add(cat);
            
            // Sum actual raw values for blockers calculation
            const pForCat = (row.pendingDrillDown || []).filter(p => (p.category || 'General') === cat);
            const rForCat = (row.rejectedDrillDown || []).filter(r => (r.category || 'General') === cat);
            
            pForCat.forEach(p => {
               rowPending.upload += (p.uploadPending || 0);
               rowPending.pre += (p.vouchingPending || p.preAuditPending || 0);
               rowPending.in += (p.auditPending || p.inAuditPending || 0);
               rowPending.post += (p.postAuditPending || 0);
            });
          }
        });

        if (catsInRow.size > 1) {
          multiple.uids.add(row.UID);
          multiple.pending += pendingVal;
          multiple.rejected += rejectedVal;
          multiple.uploadPending += rowPending.upload;
          multiple.preAuditPending += rowPending.pre;
          multiple.inAuditPending += rowPending.in;
          multiple.postAuditPending += rowPending.post;
        } else if (catsInRow.size === 1) {
          const cat = Array.from(catsInRow)[0];
          if (!categories[cat]) {
            categories[cat] = { 
              pending: 0, rejected: 0, uids: new Set(),
              uploadPending: 0, preAuditPending: 0, inAuditPending: 0, postAuditPending: 0
            };
          }
          categories[cat].uids.add(row.UID);
          categories[cat].pending += pendingVal;
          categories[cat].rejected += rejectedVal;
          categories[cat].uploadPending += rowPending.upload;
          categories[cat].preAuditPending += rowPending.pre;
          categories[cat].inAuditPending += rowPending.in;
          categories[cat].postAuditPending += rowPending.post;
        }
      }
    });

    const categoriesList = Object.entries(categories)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => (b.pending + b.rejected) - (a.pending + a.rejected));

    const totalUploadPending = categoriesList.reduce((acc, c) => acc + c.uploadPending, 0) + multiple.uploadPending;
    const totalPreAuditPending = categoriesList.reduce((acc, c) => acc + c.preAuditPending, 0) + multiple.preAuditPending;
    const totalInAuditPending = categoriesList.reduce((acc, c) => acc + c.inAuditPending, 0) + multiple.inAuditPending;
    const totalPostAuditPending = categoriesList.reduce((acc, c) => acc + c.postAuditPending, 0) + multiple.postAuditPending;
    const totalVouchingPending = totalPreAuditPending + totalInAuditPending + totalPostAuditPending;
    const totalRejected = categoriesList.reduce((acc, c) => acc + c.rejected, 0) + multiple.rejected;

    return { 
      categories: categoriesList,
      multiple,
      totals: {
        units: totalUIDs.size,
        uploadPending: totalUploadPending,
        preAuditPending: totalPreAuditPending,
        inAuditPending: totalInAuditPending,
        postAuditPending: totalPostAuditPending,
        vouchingPending: totalVouchingPending,
        rejected: totalRejected,
        totalItems: totalUploadPending + totalVouchingPending + totalRejected
      }
    };
  }, [baseFilteredData]);

  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContextData.forEach(row => {
      const auditor = row.Auditor || 'Unassigned';
      counts[auditor] = (counts[auditor] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 auditors
  }, [filteredContextData]);

  const funnelData = useMemo(() => {
    const total = stats.total;
    const accountsReady = total - stats.accountsNotReady;
    const auditReady = stats.readyAllocation + stats.readyCompletion + stats.readyGeneric + stats.bankChecking;
    const inProgress = stats.inProgress;
    const completed = stats.completed + stats.completedWithRejection;

    return [
      { value: total, name: 'Total Units', fill: '#6366f1' },
      { value: accountsReady, name: 'Accounts Ready', fill: '#8b5cf6' },
      { value: auditReady, name: 'Audit Ready', fill: '#ec4899' },
      { value: inProgress, name: 'In Progress', fill: '#f43f5e' },
      { value: completed, name: 'Completed', fill: '#10b981' },
    ];
  }, [stats]);

  const institutionGradeData = useMemo(() => {
    const instMap: Record<string, Record<string, number>> = {};
    const grades = new Set<string>();

    filteredContextData.forEach(row => {
      const inst = row.Institute || 'Unknown';
      const grade = row.Grade || 'N/A';
      grades.add(grade);
      
      if (!instMap[inst]) instMap[inst] = {};
      instMap[inst][grade] = (instMap[inst][grade] || 0) + 1;
    });

    const sortedInsts = Object.entries(instMap)
      .map(([name, gradeCounts]) => ({
        name,
        total: Object.values(gradeCounts).reduce((a, b) => a + b, 0),
        ...gradeCounts
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 institutions

    return {
      data: sortedInsts,
      grades: Array.from(grades).sort()
    };
  }, [filteredContextData]);

  const completionPieData = useMemo(() => {
    const instMap: Record<string, { completed: number; pending: number }> = {};
    
    filteredContextData.forEach(row => {
      const inst = row.Institute || 'Unknown';
      const isCompleted = ['COMPLETED', 'COMPLETED_MATERIAL', 'COMPLETED_GUIDANCE', 'COMPLETED_RECHECK'].includes(row.statusType);
      
      if (!instMap[inst]) instMap[inst] = { completed: 0, pending: 0 };
      if (isCompleted) {
        instMap[inst].completed += 1;
      } else {
        instMap[inst].pending += 1;
      }
    });

    const sortedInsts = Object.entries(instMap)
      .map(([name, counts]) => ({
        name,
        ...counts,
        total: counts.completed + counts.pending
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 for ring segments

    // Inner ring: Global status
    const innerData = [
      { name: 'Completed', value: stats.completed + stats.completedWithRejection, fill: '#10b981' },
      { name: 'Pending', value: stats.total - (stats.completed + stats.completedWithRejection), fill: '#f43f5e' }
    ];

    // Outer ring: Top 8 institutions broken by completed/pending
    const outerData = sortedInsts.flatMap((inst, i) => {
      const baseColors = ['#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f43f5e', '#84cc16'];
      const baseColor = baseColors[i % baseColors.length];
      return [
        { name: `${inst.name} Done`, value: inst.completed, fill: baseColor },
        { name: `${inst.name} Pend`, value: inst.pending, fill: `${baseColor}33` } // Lighter version for pending
      ];
    });

    return { innerData, outerData };
  }, [filteredContextData, stats]);

  const handleExportExcel = () => {
    if (!hasPermission('audit_workbench_export')) {
      toast('You do not have permission to export data (audit_workbench_export required)', 'error');
      return;
    }
    if (filteredData.length === 0) {
      toast('No data matches the current filters to export.', 'error');
      return;
    }
    try {
      toast('Preparing Excel export for filtered data...', 'info');
      const ws = XLSX.utils.json_to_sheet(filteredData.map(item => {
        const { pendingDrillDown, rejectedDrillDown, statusType, ...rest } = item;
        return rest;
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AuditWorkbench");
      XLSX.writeFile(wb, `Audit_Workbench_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast('Export successful', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      toast('Export failed', 'error');
    }
  };

  const handleRowClick = (row: WorkbenchRow) => {
    setSelectedRow(row);
    setRightDrawerOpen(true);
  };

  return (
    <div className="flex h-full bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* --- Left Sidebar (Filters & Navigation) --- */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm z-20"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight uppercase text-sm">Workbench Tools</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400">
                <PanelLeftClose size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">View Modes</h3>
                <div className="space-y-1">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === tab.id 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3 italic">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Group Hierarchy</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setDefaultIsCollapsed(false);
                        setCollapsedGroups(new Set());
                      }}
                      className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase border-b border-indigo-200 border-dashed"
                    >
                      Expand
                    </button>
                    <span className="text-slate-300">/</span>
                    <button 
                      onClick={() => {
                        setDefaultIsCollapsed(true);
                        setCollapsedGroups(new Set());
                      }}
                      className="text-[9px] font-black text-slate-600 hover:text-slate-800 transition-colors uppercase border-b border-slate-200 border-dashed"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {['Zone', 'SubZone', 'Institute', 'Grade', 'Auditor', 'Audit Status (Excel)', 'Status', 'Audit Stage', 'Vouching Stage'].map((field, idx) => {
                    const isActive = filterState.groupBy.includes(field);
                    const order = filterState.groupBy.indexOf(field) + 1;
                    return (
                      <button
                        key={field}
                        onClick={() => setFilterState(prev => ({
                          ...prev,
                          groupBy: isActive ? prev.groupBy.filter(f => f !== field) : [...prev.groupBy, field]
                        }))}
                        className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-normal leading-none text-center">
                          {field === 'Status' ? 'Readiness' : 
                           field === 'Audit Status (Excel)' ? 'Audit Status' : 
                           field === 'Vouching Stage' ? 'Vch Stage' : field}
                        </span>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] font-black shadow-sm ring-1 ring-indigo-200">
                            {order}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Configuration</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={infiniteScroll} 
                        onChange={() => setInfiniteScroll(!infiniteScroll)} 
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors ${infiniteScroll ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${infiniteScroll ? 'translate-x-4' : ''}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Hybrid Infinite Scroll</span>
                      <span className="text-[9px] text-slate-400 font-medium">Auto-loads rows on scroll</span>
                    </div>
                  </label>
                </div>
              </section>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
               <div className="grid grid-cols-1 gap-2">
                 {hasPermission('audit_workbench_export') && (
                   <button 
                     onClick={handleExportExcel}
                     className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100 dark:shadow-none"
                   >
                     <Download size={14} />
                     Export to Excel
                   </button>
                 )}
                 <button 
                   onClick={fetchData}
                   className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
                 >
                   <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                   Force Refetch
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Ribbon */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 shrink-0 flex items-center justify-between px-6 z-10 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <PanelLeftOpen size={20} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Audit Workbench</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {hasPermission('audit_workbench_sync') && (
               <button
                 onClick={handleSyncAll}
                 className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-bold text-xs hover:bg-green-200 dark:hover:bg-green-900/50 transition-all underline decoration-green-500/30"
               >
                 <RefreshCw size={14} />
                 Sync Sources
               </button>
             )}
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Master Search..."
                  className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs w-48 lg:w-80 focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-slate-400 dark:text-white"
                  value={filterState.globalSearch}
                  onChange={(e) => setFilterState(prev => ({ ...prev, globalSearch: e.target.value }))}
                />
             </div>
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
             {!rightDrawerOpen && (
               <button onClick={() => setRightDrawerOpen(true)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                 <PanelRightOpen size={20} />
               </button>
             )}
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onAnimationComplete={() => {
                  window.dispatchEvent(new Event('resize'));
                }}
                className="absolute inset-0 overflow-y-auto p-6 scrollbar-thin bg-slate-50 dark:bg-slate-950"
              >
                <div className="max-w-7xl mx-auto space-y-6 pb-20">
                  {/* Summary Stats Grid */}
                  <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <StatItem label="All UIDs" count={stats.total} icon={LayoutGrid} variant="all" />
                    <StatItem label="Ready For Allocation" count={stats.readyAllocation} icon={UserCheck} variant="allocation" />
                    <StatItem label="Ready For Completion" count={stats.readyCompletion} icon={FileCheck} variant="completion" />
                    <StatItem label="For Guidance (C/D)" count={stats.readyGuidanceC} icon={HelpCircle} variant="completed" />
                    <StatItem label="For Guidance (A/B)" count={stats.readyGuidanceAB} icon={HelpCircle} variant="progress" />
                    <StatItem label="Bank Reconciliation Needed (Grade C)" count={stats.bankChecking} icon={Building} variant="bank" />
                    <StatItem label="Pre Audit Pending" count={stats.preAuditPending} icon={Clock} variant="pending" />
                    
                    <StatItem label="Pending Readiness" count={stats.pendingReadiness} icon={Clock} variant="pending" />
                    <StatItem label="In Audit" count={stats.inProgress} icon={Activity} variant="progress" />
                    <StatItem label="Completed" count={stats.completed} icon={CheckCircle2} variant="completed" />
                    <StatItem label="Completed Materially" count={stats.completedMaterially} icon={CheckCircle2} variant="auditable" />
                    <StatItem label="Completed with Guidance" count={stats.completedGuidance} icon={ShieldCheck} variant="completedWithPending" />
                    <StatItem label="Completed (Recheck Needed)" count={stats.completedRecheck} icon={AlertTriangle} variant="completedWithRejection" />
                    <StatItem label="Incomplete Submission" count={stats.accountsNotReady} icon={FileWarning} variant="notready" />
                    
                    <StatItem label="Not Auditable" count={stats.notReady} icon={XCircle} variant="notauditable" />
                  </section>

                  {/* Main Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Audit Lifecycle Funnel */}
                    <Card className="p-5 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[450px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-rose-500" />
                          <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">Audit Lifecycle Funnel</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={fetchData}
                            className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="Refresh Funnel Data"
                          >
                            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                          </button>
                          <Badge variant="secondary" className="text-[9px]">Pipeline</Badge>
                        </div>
                      </div>
                      <div className="w-full h-[320px] flex items-center justify-center relative bg-slate-50/10 dark:bg-slate-950/20 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Waking Graphs...</span>
                          </div>
                        ) : funnelData.some(d => d.value > 0) ? (
                          <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={280} key={`funnel-${data.length}`}>
                              <FunnelChart>
                                <RechartsTooltip 
                                  isAnimationActive={false}
                                  contentStyle={chartTheme.tooltip.contentStyle}
                                  itemStyle={chartTheme.tooltip.itemStyle}
                                />
                                <Funnel
                                  dataKey="value"
                                  data={funnelData}
                                  isAnimationActive={false}
                                  labelLine={false}
                                >
                                  <LabelList 
                                    position="center" 
                                    fill="#fff" 
                                    stroke="none" 
                                    dataKey="name" 
                                    fontSize={9} 
                                    fontWeight="900"
                                    className="uppercase tracking-[1px] drop-shadow-sm" 
                                  />
                                </Funnel>
                              </FunnelChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                             <Activity className="w-12 h-12" />
                             <span className="text-[10px] font-black uppercase tracking-widest">No Units Reported</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">Conversion from submission to completion</p>
                    </Card>

                    {/* Auditor Workload Distribution */}
                    <Card className="p-5 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[450px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">Auditor Workload</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={fetchData}
                             className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors"
                             title="Refresh Workload"
                           >
                             <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                           </button>
                           <Badge variant="secondary" className="text-[9px]">Staffing</Badge>
                        </div>
                      </div>
                      <div className="w-full h-[320px] flex items-center justify-center relative bg-slate-50/10 dark:bg-slate-950/20 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Processing...</span>
                          </div>
                        ) : workloadData.length > 0 ? (
                          <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={280} key={`workload-${data.length}`}>
                              <BarChart data={workloadData} layout="vertical" margin={{ left: 10, right: 30, top: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.grid} />
                                <XAxis type="number" hide />
                                <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  width={80} 
                                  axisLine={false} 
                                  tickLine={false} 
                                  fontSize={9} 
                                  fontWeight="bold" 
                                  tick={{ fill: chartTheme.text }}
                                />
                                <RechartsTooltip 
                                    isAnimationActive={false}
                                    cursor={{ fill: chartTheme.cursor }}
                                    contentStyle={chartTheme.tooltip.contentStyle}
                                    itemStyle={chartTheme.tooltip.itemStyle}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                                  {workloadData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                             <UserCheck className="w-12 h-12" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Zero Active Audits</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">Distribution of audit workload among staff members</p>
                    </Card>

                    {/* Institution Wise Completion Visual */}
                    <Card className="p-5 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[450px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">Completion Hierarchy</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={fetchData}
                             className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-500 transition-colors"
                             title="Refresh Hierarchy"
                           >
                             <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                           </button>
                           <Badge variant="secondary" className="text-[9px]">Multi-Level</Badge>
                        </div>
                      </div>
                      <div className="w-full h-[320px] flex items-center justify-center relative bg-slate-50/10 dark:bg-slate-950/20 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculating...</span>
                          </div>
                        ) : completionPieData.innerData.length > 0 ? (
                          <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={280} key={`pie-${data.length}`}>
                              <PieChart>
                                <Pie 
                                  data={completionPieData.innerData} 
                                  dataKey="value" 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={55}
                                  outerRadius={80} 
                                  paddingAngle={5}
                                  fill="#8884d8" 
                                  isAnimationActive={false}
                                  labelLine={false}
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  fontSize={9}
                                  fontWeight="900"
                                  className="uppercase tracking-tighter"
                                />
                                <Pie 
                                  data={completionPieData.outerData} 
                                  dataKey="value" 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={85} 
                                  outerRadius={100} 
                                  paddingAngle={2}
                                  fill="#82ca9d" 
                                  isAnimationActive={false}
                                />
                                <RechartsTooltip 
                                  isAnimationActive={false}
                                  contentStyle={chartTheme.tooltip.contentStyle}
                                  itemStyle={chartTheme.tooltip.itemStyle}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                            <PieChartIcon className="w-12 h-12" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Stats Available</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center flex flex-col gap-1 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Inner: Overall Status</div>
                          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400" /> Outer: Top Inst. Detail</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* bottom Row: Stacked Bar */}
                  <Card className="p-5 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[500px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">Institution Wise Grade Performance</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={fetchData}
                          className="p-1 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-emerald-500 transition-all flex items-center gap-2"
                        >
                          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                          <span className="text-[9px] font-black uppercase tracking-tight">Sync Stats</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase mr-2 tracking-widest">Top 8 Institutions</span>
                          <Badge variant="secondary" className="text-[9px]">Grading Matrix</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-[400px] flex items-center justify-center relative bg-slate-50/10 dark:bg-slate-950/20 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Generating Performance Matrix...</span>
                        </div>
                      ) : institutionGradeData.data.length > 0 ? (
                        <div className="w-full h-full p-6 flex flex-col items-center justify-center" style={{ paddingBottom: '40px' }}>
                          <ResponsiveContainer width="100%" height={340} key={`grades-${data.length}`}>
                            <BarChart data={institutionGradeData.data} margin={{ top: 20, right: 30, left: 20, bottom: 85 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={8} 
                                fontWeight="900" 
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                                tick={{ fill: chartTheme.text }}
                                className="uppercase tracking-tighter"
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={9} 
                                fontWeight="bold" 
                                tick={{ fill: chartTheme.text }} 
                              />
                              <RechartsTooltip 
                                  isAnimationActive={false}
                                  cursor={{ fill: chartTheme.cursor }}
                                  contentStyle={chartTheme.tooltip.contentStyle}
                                  itemStyle={chartTheme.tooltip.itemStyle}
                              />
                              <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="square" 
                                wrapperStyle={{ 
                                  fontSize: '9px', 
                                  fontWeight: '900', 
                                  paddingBottom: '30px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px'
                                }}
                              />
                              {institutionGradeData.grades.map((grade, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
                                return (
                                  <Bar 
                                    key={grade} 
                                    dataKey={grade} 
                                    stackId="a" 
                                    fill={colors[index % colors.length]} 
                                    radius={index === institutionGradeData.grades.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                                    barSize={20}
                                    isAnimationActive={false}
                                  />
                                );
                              })}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                          <Building className="w-12 h-12" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Performance Records</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'grid' && (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <WorkbenchGridTab 
                  data={data} 
                  filteredData={filteredData}
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                  loading={loading} 
                  filterState={filterState} 
                  setFilterState={setFilterState}
                  selectedStatusFilters={selectedStatusFilters}
                  setSelectedStatusFilters={setSelectedStatusFilters}
                  selectedAuditStageFilters={selectedAuditStageFilters}
                  setSelectedAuditStageFilters={setSelectedAuditStageFilters}
                  selectedVouchingStageFilters={selectedVouchingStageFilters}
                  setSelectedVouchingStageFilters={setSelectedVouchingStageFilters}
                  selectedInstitutes={selectedInstitutes}
                  setSelectedInstitutes={setSelectedInstitutes}
                  selectedBlocker={selectedBlocker}
                  setSelectedBlocker={setSelectedBlocker}
                  blockerStats={blockerStats}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  infiniteScroll={infiniteScroll}
                  collapsedGroups={collapsedGroups}
                  setCollapsedGroups={setCollapsedGroups}
                  defaultIsCollapsed={defaultIsCollapsed}
                  columnWrapSettings={columnWrapSettings}
                  setColumnWrapSettings={setColumnWrapSettings}
                  columnOrder={columnOrder}
                  setColumnOrder={setColumnOrder}
                  onRowClick={handleRowClick}
                />
              </motion.div>
            )}

            {activeTab === 'logic' && (
              <motion.div 
                key="logic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto p-10 scrollbar-thin bg-slate-50 dark:bg-slate-950"
              >
                <div className="max-w-4xl mx-auto space-y-10">
                  <header className="text-center">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mb-2 uppercase italic">Readiness Priority Logic</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Deep-dive into the core algorithms used to determine UID audit eligibility.</p>
                  </header>

                  <section className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                      <ShieldCheck size={120} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-black text-indigo-100 mb-4 flex items-center gap-3 text-xs uppercase tracking-[4px]">
                          <CheckCircle2 className="w-5 h-5 text-white" /> Core Eligibility Criteria
                      </h4>
                      <p className="text-white leading-relaxed text-sm font-medium max-w-2xl">
                          A Unit (UID) is generally considered <strong className="text-white underline decoration-indigo-400 decoration-2 underline-offset-4">Ready for Audit</strong> if its accounts are submitted up to the month of <strong>March</strong>, 
                          and has <strong>No Active Issues</strong> (defined as a net sum $\le 0$ per category) across all underlying transaction reports. 
                          The system algebraicly balances Pending and Rejection counts (e.g., -1 Pending + 1 Rejection = 0 Issues) to ensure validity even if corrective entries are present.
                          <br/><br/>
                          <strong>Automated Mappings & Fallbacks:</strong><br/>
                          - If Institute is missing, it is derived from the UID pattern (e.g., BK-PBKIVV, WR-WRST).<br/>
                          - If Zone/SubZone is missing, it defaults to <strong>ABU</strong>.<br/>
                          - If Submission Month is missing, it is treated as <strong>March</strong> by default.<br/>
                          - If an UID is missing from the Account Submission Report, then the Submission month is treated as "other than March".<br/>
                          - If an UID is missing from the Audit Status Report, then the Source Audit status is treated as "Not Available".<br/>
                          - If Grade is missing, it is derived from the Master UID registration pattern.<br/><br/>
                          <strong>Sync Dependency:</strong><br/>
                          The Readiness state is a calculated attribute that relies on the real-time synchronization of three distinct source reports (Account Submissions, Vouching Stats, and Audit Status Excel). Any delay in syncing these sources will impact accuracy.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1 block">Institute Mapping</span>
                          <p className="text-xs font-bold leading-tight">Derived from UID patterns (e.g., BK-PBKIVV, WR-WRST) if missing in source.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1 block">Zone Localization</span>
                          <p className="text-xs font-bold leading-tight">Default to 'ABU' if unspecified in the master registry.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="font-black text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3 text-xs uppercase tracking-[3px] pl-2">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Readiness Priority Logic
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div className="md:col-span-2">
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
                        </div>
                        <div className="md:col-span-2">
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
                        </div>
                        <div className="md:col-span-2">
                          <LogicCard 
                            title="7. Live Data Integrity Safeguard" 
                             logic="External 'Available' markers are overridden if live transaction data reveals unresolved items. All pending counts and active rejections must be cleared before a unit is prioritized for allocation." 
                             outcome="PENDING/REJECTED"
                          />
                        </div>
                        <div className="md:col-span-2">
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
                               { label: "Grid Counts", text: "Pending/Rejected counts in the workbench grid represent the Net Positive Balance (Total - Corrective Entries) at the UID level." }
                            ]}
                            outcome="DATA ORIGIN"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <LogicCard 
                            title="9. Smart Category Netting" 
                             logic="Issues are evaluated by summing all pending and rejected types per category. If a category's net sum is zero or less (Balanced Audit), it is Promoted to 'Cleared'. A UID only maintains an issue status (Pending/Rejected) if at least one category has a net positive balance (>0)." 
                             outcome="NET CATEGORY BALANCE"
                           />
                        </div>
                    </div>
                  </section>

                  <section className="bg-slate-200/50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                    <h4 className="font-black text-slate-400 dark:text-slate-500 mb-6 flex items-center justify-center gap-3 text-xs uppercase tracking-[5px]">
                        <RefreshCw className="w-4 h-4" /> Source Freshness
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <SyncTimeCard label="Submissions" time={metadata?.syncTimes?.submissions} />
                      <SyncTimeCard label="Vouching" time={metadata?.syncTimes?.vouching} />
                      <SyncTimeCard label="Maintenance" time={metadata?.syncTimes?.auditStatus} />
                    </div>
                  </section>

                  <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3 text-xs uppercase tracking-[3px]">
                        <LayoutTemplate className="w-5 h-5 text-indigo-500" /> Interface Enhancements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                          <span className="font-black text-[11px] uppercase tracking-tight text-slate-700 dark:text-slate-300">Legibility Architecture</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          The Data Workbench employs a <strong className="text-slate-700 dark:text-slate-300 underline decoration-indigo-200 decoration-2">High-Contrast Zebra Striping</strong> pattern (alternating white and slate backgrounds) and <strong className="text-slate-700 dark:text-slate-300 italic">Explicit Vertical Borders</strong> to ensure row-to-column tracking across dense financial datasets.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                          <span className="font-black text-[11px] uppercase tracking-tight text-slate-700 dark:text-slate-300">Dynamic UI Sync</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          Column widths are optimized for data density. The <strong className="text-slate-700 dark:text-slate-300">Sync Stats</strong> feature provides atomic, per-module data refreshes to keep the readiness funnel synchronized with the latest live transaction rejections.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Right Detail Drawer --- */}
      <AnimatePresence>
        {rightDrawerOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl z-20"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  {selectedRow ? 'UNIT INSPECTION' : 'Operational Insights'}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                  {selectedRow ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedRow.UID}</span>
                  ) : 'Predefined Filters'}
                </h3>
                {selectedRow && (
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedRow['Centre Name']}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedRow && (
                  <button 
                    onClick={() => setSelectedRow(null)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Back to Insights"
                  >
                    <LayoutGrid size={16} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setRightDrawerOpen(false);
                    setSelectedRow(null);
                  }} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400"
                >
                  <PanelRightClose size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
              {selectedRow ? (
                <>
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grading Info</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100/50 dark:border-slate-800 rounded-xl flex flex-col min-h-[80px]">
                        <p className="text-[10px] font-black text-indigo-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">grade A</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">{selectedRow.gradeA || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100/50 dark:border-slate-800 rounded-xl flex flex-col min-h-[80px]">
                        <p className="text-[10px] font-black text-indigo-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">grade B</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">{selectedRow.gradeB || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100/50 dark:border-slate-800 rounded-xl flex flex-col min-h-[80px]">
                        <p className="text-[10px] font-black text-indigo-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">grade C</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">{selectedRow.gradeC || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100/50 dark:border-slate-800 rounded-xl flex flex-col min-h-[80px]">
                        <p className="text-[10px] font-black text-indigo-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">grade D</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">{selectedRow.gradeD || 'N/A'}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Breakdown</h4>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-3 py-2.5 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] w-[45%]">Category</th>
                            <th colSpan={4} className="px-2 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] border-l border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-900/10">Pending</th>
                            <th className="px-2 py-2.5 text-center font-bold text-red-600 dark:text-red-400 uppercase text-[10px] border-l border-slate-100 dark:border-slate-800 bg-red-50/30 dark:bg-red-900/10">Rej</th>
                          </tr>
                          <tr className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                            <th className="px-3 py-1"></th>
                            <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-red-500" title="Upload Pending">UPL</th>
                            <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-orange-500" title="Pre Audit Pending">PRE</th>
                            <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-pink-500" title="In Audit Pending">IN</th>
                            <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-green-500" title="Post Audit Pending">PST</th>
                            <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-red-600" title="Rejection Items">REJ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(() => {
                            const pendingMap = (selectedRow.pendingDrillDown || []).reduce((acc: any, curr: any) => {
                              acc[curr.category] = curr;
                              return acc;
                            }, {});
                            const rejectedMap = (selectedRow.rejectedDrillDown || []).reduce((acc: any, curr: any) => {
                              acc[curr.category] = curr;
                              return acc;
                            }, {});
                            
                            const allCategories = Array.from(new Set([
                              ...Object.keys(pendingMap),
                              ...Object.keys(rejectedMap)
                            ])).sort();

                            const filteredCategories = allCategories.filter(cat => {
                              const p = pendingMap[cat] || {};
                              const r = rejectedMap[cat] || {};
                              return (p.uploadPending || 0) !== 0 || (p.vouchingPending || p.preAuditPending || 0) !== 0 || (p.auditPending || p.inAuditPending || 0) !== 0 || (p.postAuditPending || 0) !== 0 ||
                                     (r.vouchingRejected || 0) !== 0;
                            });

                            if (filteredCategories.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-3 py-10 text-center text-slate-400 text-xs italic">
                                    No pending or rejected items.
                                  </td>
                                </tr>
                              );
                            }

                            return filteredCategories.map(cat => {
                              const p = pendingMap[cat] || {};
                              const r = rejectedMap[cat] || {};
                              return (
                                 <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                  <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300 text-[11px] leading-tight" title={cat}>{cat}</td>
                                   <td className={`px-1 py-2.5 text-center font-black text-xs border-l border-slate-50 dark:border-slate-900 ${(p.uploadPending || 0) > 0 ? 'text-red-500' : (p.uploadPending || 0) < 0 ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                    {p.uploadPending || 0}
                                  </td>
                                   <td className={`px-1 py-2.5 text-center font-black text-xs border-l border-slate-50 dark:border-slate-900 italic ${(p.vouchingPending || p.preAuditPending || 0) > 0 ? 'text-orange-500' : (p.vouchingPending || p.preAuditPending || 0) < 0 ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                     {p.vouchingPending || p.preAuditPending || 0}
                                   </td>
                                   <td className={`px-1 py-2.5 text-center font-black text-xs border-l border-slate-50 dark:border-slate-900 ${(p.auditPending || p.inAuditPending || 0) > 0 ? 'text-pink-500' : (p.auditPending || p.inAuditPending || 0) < 0 ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                     {p.auditPending || p.inAuditPending || 0}
                                   </td>
                                   <td className={`px-1 py-2.5 text-center font-black text-xs border-l border-slate-50 dark:border-slate-900 ${(p.postAuditPending || 0) > 0 ? 'text-green-500' : (p.postAuditPending || 0) < 0 ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                     {p.postAuditPending || 0}
                                   </td>
                                  <td className={`px-1 py-2.5 text-center font-black text-xs border-l border-slate-50 dark:border-slate-900 italic ${(r.vouchingRejected || 0) > 0 ? 'text-red-600' : (r.vouchingRejected || 0) < 0 ? 'text-blue-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                    {r.vouchingRejected || 0}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
               ) : (
                  <div className="space-y-4">
                     {/* Grade Filters */}
                     <section className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Grade Filters</h4>
                           {filterState.columns['Grade']?.values.length > 0 && (
                             <button 
                               onClick={() => {
                                 setFilterState(prev => ({
                                   ...prev,
                                   columns: {
                                     ...prev.columns,
                                     'Grade': { values: [], searchText: '' }
                                   }
                                 }));
                               }}
                               className="text-[10px] font-bold text-indigo-600 hover:underline px-2 py-0.5"
                             >
                               Reset
                             </button>
                           )}
                        </div>
                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 shadow-sm overflow-hidden">
                           <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                              {uniqueGrades.map(grade => {
                                const isActive = filterState.columns['Grade']?.values.includes(grade);
                                const count = gradeStats[grade] || 0;
                                return (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                       setFilterState(prev => {
                                         const current = prev.columns['Grade']?.values || [];
                                         const next = current.includes(grade) 
                                           ? current.filter(g => g !== grade) 
                                           : [...current, grade];
                                         return {
                                           ...prev,
                                           columns: {
                                             ...prev.columns,
                                             'Grade': { values: next, searchText: '' }
                                           }
                                         };
                                       });
                                    }}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-black transition-all ${
                                      isActive 
                                       ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-110 z-10' 
                                       : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }`}
                                  >
                                    <span className="text-lg leading-none mb-1">{grade}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                       {count}
                                    </span>
                                  </button>
                                );
                              })}
                           </div>
                           {uniqueGrades.length === 0 && (
                             <p className="text-[10px] text-slate-400 italic text-center py-2">No grades found</p>
                           )}
                        </div>
                     </section>

                     {/* Audit Readiness Status Summary */}
                     <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col text-left">
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                            Audit Readiness Status Summary
                          </h4>
                          <span className="text-[8px] text-slate-400 font-mono mt-0.5">
                            Click any figure or header to filter the main grid (Supports multi-select)
                          </span>
                        </div>
                        {(selectedStatusFilters.length > 0 || selectedInstitutes.length > 0) && (
                          <button 
                            onClick={() => {
                              setSelectedStatusFilters([]);
                              setSelectedInstitutes([]);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline px-2 py-0.5"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed select-none min-w-[360px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[8px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold font-mono">
                              <th className="px-1 py-2 text-left w-[24%] font-black font-sans text-[10px] pl-3">STATUS</th>
                              {TARGET_INST_ORDER.map(inst => (
                                <th key={inst} className="px-0.5 py-2 text-center">{inst}</th>
                              ))}
                              <th className="px-0.5 py-2 text-center bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MATRIX_STATUSES.map(s => {
                              const isStatusActive = selectedStatusFilters.includes(s.type);
                              return (
                                <tr key={s.type} className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors ${isStatusActive ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                                  <td 
                                    onClick={() => handleMatrixClick(s.type, null)}
                                    className={`px-1 py-2 text-[9px] font-semibold leading-tight pr-1 whitespace-normal break-words cursor-pointer transition-colors ${s.color} hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                                      isStatusActive ? 'font-black underline decoration-2' : ''
                                    }`}
                                  >
                                    {s.label}
                                  </td>
                                  {TARGET_INST_ORDER.map(inst => {
                                    const count = matrixData.grid[s.type]?.[inst] || 0;
                                    const isCellFiltered = selectedStatusFilters.includes(s.type) && selectedInstitutes.includes(inst);
                                    return (
                                      <td 
                                        key={inst} 
                                        onClick={() => count > 0 && handleMatrixClick(s.type, inst)}
                                        className={`px-0.5 py-2 text-center font-bold font-mono text-[11px] transition-all ${
                                          count > 0 
                                            ? `cursor-pointer ${s.color} ${s.hoverColor}` 
                                            : 'text-slate-200 dark:text-slate-800 cursor-default'
                                        } ${
                                          isCellFiltered ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-white rounded shadow-sm scale-105 z-10 font-black' : ''
                                        }`}
                                        title={count > 0 ? `Filter by ${s.label} + ${inst} (${count} units)` : ''}
                                      >
                                        {count > 0 ? count : '-'}
                                      </td>
                                    );
                                  })}
                                  <td 
                                    onClick={() => matrixData.rowTotals[s.type] > 0 && handleMatrixClick(s.type, null)}
                                    className={`px-0.5 py-2 text-center font-bold font-mono text-[11px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                      isStatusActive ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black rounded' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                    title={`Filter by status ${s.label} (${matrixData.rowTotals[s.type]} units)`}
                                  >
                                    {matrixData.rowTotals[s.type] > 0 ? matrixData.rowTotals[s.type] : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-slate-50/80 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-100">
                              <td 
                                onClick={() => handleMatrixClick(null, null)}
                                className="px-1 py-2 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Reset filters"
                              >
                                TOTAL
                              </td>
                              {TARGET_INST_ORDER.map(inst => {
                                const isInstActive = selectedInstitutes.includes(inst);
                                const count = matrixData.colTotals[inst] || 0;
                                return (
                                  <td 
                                    key={inst}
                                    onClick={() => count > 0 && handleMatrixClick(null, inst)}
                                    className={`px-0.5 py-2 text-center font-bold font-mono text-[11px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                      isInstActive ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-black' : ''
                                    }`}
                                    title={`Filter by ${inst} (${count} units)`}
                                  >
                                    {count > 0 ? count : '-'}
                                  </td>
                                );
                              })}
                              <td 
                                onClick={() => handleMatrixClick(null, null)}
                                className="px-0.5 py-2 text-center font-black font-mono text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                title="Reset all filters"
                              >
                                {matrixData.grandTotal}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                     </section>

                     {/* Exclusive Blockers / Category Summary */}
                     <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button 
                              onClick={() => setBlockerTab('exclusive')}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${blockerTab === 'exclusive' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Exclusive Blockers
                            </button>
                            <button 
                              onClick={() => setBlockerTab('summary')}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${blockerTab === 'summary' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Category Summary
                            </button>
                          </div>
                          <Tooltip align="right" text={blockerTab === 'exclusive' ? "This table identifies units blocked by exactly one vouching category." : "Simple category-wise pending/rejection counts across all filtered units."}>
                            <HelpCircle className="w-4 h-4 text-slate-300 cursor-help" />
                          </Tooltip>
                        </div>

                        {blockerTab === 'exclusive' ? (
                          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                  <th className="px-3 py-2.5 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] w-[30%]">Category</th>
                                  <th className="px-1 py-2.5 text-center font-bold text-indigo-700 dark:text-indigo-400 uppercase text-[9px] border-l border-slate-100 dark:border-slate-800 bg-indigo-50/10 dark:bg-indigo-900/5 tracking-wider font-mono">UIDs</th>
                                  <th colSpan={4} className="px-1 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-l border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-900/10 tracking-widest font-mono">Pending</th>
                                  <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-red-600" title="Rejection Items">REJ</th>
                                  <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 uppercase text-[9px]" title="Total Items">Total</th>
                                </tr>
                                <tr className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black font-mono">
                                  <th className="px-3 py-1"></th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 font-extrabold" title="UID Count">UID</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-red-500" title="Upload Pending">UPL</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-orange-500" title="Pre Audit Pending">PRE</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-pink-500" title="In Audit Pending">IN</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-green-500" title="Post Audit Pending">PST</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-red-600" title="Rejection Items">REJ</th>
                                  <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400" title="Total Items">TOT</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                {blockerStats.categories.length > 0 || blockerStats.multiple.uids.size > 0 ? (
                                  <>
                                    {blockerStats.categories.map(cat => (
                                      <BlockerRow 
                                        key={cat.name}
                                        category={cat.name}
                                        pending={cat.pending}
                                        rejected={cat.rejected}
                                        units={cat.uids.size}
                                        uploadPending={cat.uploadPending}
                                        preAuditPending={cat.preAuditPending}
                                        inAuditPending={cat.inAuditPending}
                                        postAuditPending={cat.postAuditPending}
                                        activeCategory={selectedBlocker?.category === cat.name && selectedBlocker?.mode === 'exclusive'}
                                        activeType={selectedBlocker?.category === cat.name && selectedBlocker?.mode === 'exclusive' ? selectedBlocker.type : null}
                                        onSelect={(type) => {
                                          setSelectedBlocker(prev => {
                                            if (prev?.category === cat.name && prev.type === type && prev.mode === 'exclusive') return null;
                                            return { category: cat.name, type, mode: 'exclusive' };
                                          });
                                        }}
                                      />
                                    ))}
                                    {blockerStats.multiple.uids.size > 0 && (
                                      <BlockerRow 
                                        category="Multiple Categories"
                                        pending={blockerStats.multiple.pending}
                                        rejected={blockerStats.multiple.rejected}
                                        units={blockerStats.multiple.uids.size}
                                        uploadPending={blockerStats.multiple.uploadPending}
                                        preAuditPending={blockerStats.multiple.preAuditPending}
                                        inAuditPending={blockerStats.multiple.inAuditPending}
                                        postAuditPending={blockerStats.multiple.postAuditPending}
                                        activeCategory={selectedBlocker?.category === 'Multiple Categories' && selectedBlocker?.mode === 'exclusive'}
                                        activeType={selectedBlocker?.category === 'Multiple Categories' && selectedBlocker?.mode === 'exclusive' ? selectedBlocker.type : null}
                                        onSelect={(type) => {
                                          setSelectedBlocker(prev => {
                                            if (prev?.category === 'Multiple Categories' && prev.type === type && prev.mode === 'exclusive') return null;
                                            return { category: 'Multiple Categories', type, mode: 'exclusive' };
                                          });
                                        }}
                                      />
                                    )}
                                    <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-800 font-black">
                                      <td className="px-2 py-3 text-[10px] text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">TOTAL</td>
                                      <td className="px-1 py-3 text-center font-mono text-xs text-slate-900 dark:text-slate-100" title="Total units in this view">
                                        {blockerStats.totals.units}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-red-600 dark:text-red-400" title={`Total Upload Pending: ${blockerStats.totals.uploadPending}`}>
                                        {blockerStats.totals.uploadPending}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-orange-600 dark:text-orange-400" title={`Total Pre Audit Pending: ${blockerStats.totals.preAuditPending}`}>
                                        {blockerStats.totals.preAuditPending}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-pink-600 dark:text-pink-400" title={`Total In Audit Pending: ${blockerStats.totals.inAuditPending}`}>
                                        {blockerStats.totals.inAuditPending}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-green-600 dark:text-green-400" title={`Total Post Audit Pending: ${blockerStats.totals.postAuditPending}`}>
                                        {blockerStats.totals.postAuditPending}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-rose-600 dark:text-rose-400 border-l border-slate-100 dark:border-slate-800" title={`Total Rejected: ${blockerStats.totals.rejected}`}>
                                        {blockerStats.totals.rejected}
                                      </td>
                                      <td className="px-1 py-3 text-center text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-l border-slate-100 dark:border-slate-800" title={`Grand Total Items: ${blockerStats.totals.totalItems}`}>
                                        {blockerStats.totals.totalItems}
                                      </td>
                                    </tr>
                                  </>
                                ) : (
                                  <tr>
                                    <td colSpan={8} className="p-8 text-center bg-slate-50 dark:bg-slate-900">
                                      <CheckCircle2 size={24} className="text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Blockers Found</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                             <th className="px-3 py-2.5 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] w-[30%]">Category</th>
                             <th className="px-1 py-2.5 text-center font-bold text-indigo-700 dark:text-indigo-400 uppercase text-[9px] border-l border-slate-100 dark:border-slate-800 bg-indigo-50/10 dark:bg-indigo-900/5 tracking-wider font-mono">UIDs</th>
                             <th colSpan={4} className="px-1 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-l border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-900/10 tracking-widest font-mono">Pending</th>
                             <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-red-600" title="Rejection Items">REJ</th>
                             <th className="px-1 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 uppercase text-[9px]" title="Total Items">Total</th>
                           </tr>
                           <tr className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black font-mono">
                             <th className="px-3 py-1"></th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 font-extrabold" title="UID Count">UID</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-red-500" title="Upload Pending">UPL</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-orange-500" title="Pre Audit Pending">PRE</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-pink-500" title="In Audit Pending">IN</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-green-500" title="Post Audit Pending">PST</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-red-600" title="Rejection Items">REJ</th>
                             <th className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400" title="Total Items">TOT</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                           {(() => {
                             // Rule Type -> Category -> Counters
                             const groupings: Record<string, Record<string, any>> = {};
                             
                             filteredData.forEach(row => {
                               (row.pendingDrillDown || []).forEach(p => {
                                 const rType = p.ruleType || 'Other';
                                 if (!groupings[rType]) groupings[rType] = {};
                                 if (!groupings[rType][p.category]) {
                                   groupings[rType][p.category] = { upl: 0, pre: 0, inA: 0, pst: 0, rej: 0, uids: new Set() };
                                 }
                                 groupings[rType][p.category].upl += (p.uploadPending || 0);
                                 groupings[rType][p.category].pre += (p.vouchingPending || p.preAuditPending || 0);
                                 groupings[rType][p.category].inA += (p.auditPending || p.inAuditPending || 0);
                                 groupings[rType][p.category].pst += (p.postAuditPending || 0);
                                  if ((p.uploadPending || 0) > 0 || (p.vouchingPending || p.preAuditPending || 0) > 0 || (p.auditPending || p.inAuditPending || 0) > 0 || (p.postAuditPending || 0) > 0) {
                                    groupings[rType][p.category].uids.add(row.UID);
                                  }
                               });
                               row.rejectedDrillDown?.forEach(r => {
                                 const pMatch = row.pendingDrillDown?.find(p => p.category === r.category);
                                 const finalRType = pMatch?.ruleType || 'Other';
                                 if (!groupings[finalRType]) groupings[finalRType] = {};
                                 if (!groupings[finalRType][r.category]) {
                                   groupings[finalRType][r.category] = { upl: 0, pre: 0, inA: 0, pst: 0, rej: 0, uids: new Set() };
                                 }
                                 groupings[finalRType][r.category].rej += (r.vouchingRejected || 0);
                                  if ((r.vouchingRejected || 0) > 0) {
                                    groupings[finalRType][r.category].uids.add(row.UID);
                                  }
                               });
                             });

                             const sortedGroups = Object.entries(groupings).sort();
                             if (sortedGroups.length === 0) {
                               return (
                                 <tr>
                                   <td colSpan={8} className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                     All Clean
                                   </td>
                                 </tr>
                               );
                             }

                             return sortedGroups.map(([rType, cats]) => (
                               <React.Fragment key={rType}>
                                 <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
                                   <td colSpan={8} className="px-3 py-1 text-[8px] font-black text-indigo-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono italic text-left">
                                     Group: {rType}
                                   </td>
                                 </tr>
                                 {Object.entries(cats)
                                   .map(([name, counts]) => ({ name, ...counts }))
                                   .filter(item => item.upl !== 0 || item.pre !== 0 || item.inA !== 0 || item.pst !== 0 || item.rej !== 0)
                                   .sort((a, b) => (b.upl + b.pre + b.inA + b.pst + b.rej) - (a.upl + a.pre + a.inA + a.pst + a.rej))
                                   .map(item => (
                                     <SummaryBlockerRow 
                                       key={item.name}
                                       category={item.name}
                                       pending={0}
                                       rejected={item.rej}
                                       units={item.uids ? item.uids.size : 0}
                                       uploadPending={item.upl}
                                       preAuditPending={item.pre}
                                       inAuditPending={item.inA}
                                       postAuditPending={item.pst}
                                       activeCategory={selectedBlocker?.category === item.name && selectedBlocker?.mode === 'summary'}
                                       activeType={selectedBlocker?.category === item.name && selectedBlocker?.mode === 'summary' ? selectedBlocker.type : null}
                                       onSelect={(type) => {
                                         setSelectedBlocker(prev => {
                                           if (prev?.category === item.name && prev.type === type && prev.mode === 'summary') return null;
                                           return { category: item.name, type, mode: 'summary' };
                                         });
                                       }}
                                     />
                                   ))}
                               </React.Fragment>
                             ));
                           })()}
                         </tbody>
                            </table>
                          </div>
                        )}
                     </section>

                     {/* Stage Discovery: Audit Lifecycle & Vouching States */}
                     <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Stage Discovery</h4>
                           {(selectedStatusFilters.length > 0 || selectedAuditStageFilters.length > 0 || selectedVouchingStageFilters.length > 0 || selectedBlocker || selectedInstitutes.length > 0) && (
                             <button 
                               onClick={() => {
                                 setSelectedStatusFilters([]);
                                 setSelectedAuditStageFilters([]);
                                 setSelectedVouchingStageFilters([]);
                                 setSelectedBlocker(null);
                                 setSelectedInstitutes([]);
                               }}
                               className="text-[10px] font-bold text-indigo-600 hover:underline px-2"
                             >
                               Clear
                             </button>
                           )}
                        </div>
                        
                        <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-left">
                           <div className="flex items-center justify-between">
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                               <ShieldCheck className="w-3.5 h-3.5" /> Audit Lifecycle
                             </h5>
                           </div>
                           <div className="space-y-2">
                             <div className="grid grid-cols-3 gap-2">
                                {['Pre Audit', 'In Audit', 'Post Audit'].map(stage => (
                                  <FilterCard 
                                    key={stage}
                                    label={stage} 
                                    count={stats.auditStages[stage] || 0} 
                                    active={selectedAuditStageFilters.includes(stage)}
                                    onClick={() => {
                                      setSelectedAuditStageFilters(prev => 
                                        prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
                                      );
                                    }}
                                    color="slate"
                                    showIcon={false}
                                  />
                                ))}
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                {['Incomplete Submission', 'Not Auditable'].map(stage => (
                                  <FilterCard 
                                    key={stage}
                                    label={stage} 
                                    count={stats.auditStages[stage] || 0} 
                                    active={selectedAuditStageFilters.includes(stage)}
                                    onClick={() => {
                                      setSelectedAuditStageFilters(prev => 
                                        prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
                                      );
                                    }}
                                    color="slate"
                                    showIcon={false}
                                  />
                                ))}
                             </div>
                           </div>
                        </div>

                        <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-left">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                             <Activity className="w-3.5 h-3.5" /> Vouching States
                           </h5>
                           <div className="grid grid-cols-4 gap-2">
                              {['Pending', 'Acceptable', 'To Be Guided', 'Completed'].map(stage => (
                                <FilterCard 
                                  key={stage}
                                  label={stage} 
                                  count={stats.vouchingStages[stage] || 0} 
                                  active={selectedVouchingStageFilters.includes(stage)}
                                  onClick={() => {
                                    setSelectedVouchingStageFilters(prev => 
                                      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
                                    );
                                  }}
                                  color="indigo"
                                  showIcon={false}
                                />
                              ))}
                           </div>
                        </div>
                     </section>
                  </div>
               )}
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
               <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black uppercase transition-colors">Actions</button>
               <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-black uppercase transition-colors shadow-lg shadow-indigo-100 dark:shadow-none">Send Alert</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Internal View Components ---

function WorkbenchGridTab({ 
  data, 
  filteredData,
  sortConfig,
  setSortConfig,
  loading, 
  filterState, 
  setFilterState,
  selectedStatusFilters,
  setSelectedStatusFilters,
  selectedAuditStageFilters,
  setSelectedAuditStageFilters,
  selectedVouchingStageFilters,
  setSelectedVouchingStageFilters,
  selectedInstitutes,
  setSelectedInstitutes,
  selectedBlocker,
  setSelectedBlocker,
  blockerStats,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  infiniteScroll,
  collapsedGroups,
  setCollapsedGroups,
  defaultIsCollapsed,
  columnWrapSettings,
  setColumnWrapSettings,
  columnOrder,
  setColumnOrder,
  onRowClick
}: { 
  data: WorkbenchRow[], 
  filteredData: WorkbenchRow[],
  sortConfig: { key: string, direction: 'asc' | 'desc' }[],
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string, direction: 'asc' | 'desc' }[]>>,
  loading: boolean,
  filterState: FilterState,
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>,
  selectedStatusFilters: string[],
  setSelectedStatusFilters: (s: string[]) => void,
  selectedAuditStageFilters: string[],
  setSelectedAuditStageFilters: (s: string[]) => void,
  selectedVouchingStageFilters: string[],
  setSelectedVouchingStageFilters: (s: string[]) => void,
  selectedInstitutes: string[],
  setSelectedInstitutes: (s: string[]) => void,
  selectedBlocker: { category: string, type: 'pending' | 'rejected' | 'both' } | null,
  setSelectedBlocker: (s: { category: string, type: 'pending' | 'rejected' | 'both' } | null) => void,
  blockerStats: any,
  currentPage: number,
  setCurrentPage: (p: number) => void,
  pageSize: number | 'all',
  setPageSize: (s: number | 'all') => void,
  infiniteScroll: boolean,
  collapsedGroups: Set<string>,
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string>>>,
  defaultIsCollapsed: boolean,
  columnWrapSettings: Record<string, boolean>,
  setColumnWrapSettings: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  columnOrder: string[],
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>,
  onRowClick: (row: WorkbenchRow) => void
}) {
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    'Institute': 100,
    'UID': 140,
    'Reg No': 80,
    'Centre Name': 220,
    'Zone': 80,
    'SubZone': 120,
    'Month of Submission': 90,
    'Pending Vouching Count': 80,
    'Rejected Vouching Count': 80,
    'Audit Status (Excel)': 180,
    'Auditor': 120,
    'Grade': 80,
    'Audit Stage': 150,
    'Vouching Stage': 150,
    'Status': 180
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Columns definition
  const baseColumns = [
    { id: 'Institute', label: 'Institute', width: columnWidths['Institute'] || 100 },
    { id: 'UID', label: 'UID', width: columnWidths['UID'] || 140 },
    { id: 'Reg No', label: 'Reg No', width: columnWidths['Reg No'] || 80 },
    { id: 'Centre Name', label: 'Centre Name', width: columnWidths['Centre Name'] || 220 },
    { id: 'Zone', label: 'Zone', width: columnWidths['Zone'] || 80 },
    { id: 'SubZone', label: 'Sub-Zone', width: columnWidths['SubZone'] || 120 },
    { id: 'Month of Submission', label: 'Month', width: columnWidths['Month of Submission'] || 90 },
    { id: 'Pending Vouching Count', label: 'Pending', width: columnWidths['Pending Vouching Count'] || 80, align: 'center' },
    { id: 'Rejected Vouching Count', label: 'Rejected', width: columnWidths['Rejected Vouching Count'] || 80, align: 'center' },
    { id: 'Audit Status (Excel)', label: 'Audit Status', width: columnWidths['Audit Status (Excel)'] || 180 },
    { id: 'Auditor', label: 'Auditor', width: columnWidths['Auditor'] || 120 },
    { id: 'Grade', label: 'Grade', width: columnWidths['Grade'] || 80, align: 'center' },
    { id: 'Audit Stage', label: 'Audit Stage', width: columnWidths['Audit Stage'] || 150 },
    { id: 'Vouching Stage', label: 'Vouching Stage', width: columnWidths['Vouching Stage'] || 150 },
    { id: 'Status', label: 'Readiness', width: columnWidths['Status'] || 180 }
  ];

  const columns = useMemo(() => {
    return columnOrder.map(id => baseColumns.find(c => c.id === id)!).filter(Boolean);
  }, [columnOrder, columnWidths]);

  const handleResize = useCallback((colId: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [colId]: Math.max(50, width) }));
  }, []);

  // Grouping Helper
  const getGroupedContent = useCallback((data: any[], groupFields: string[], parentPath: string = '') => {
    if (groupFields.length === 0) return data;
    
    const [currentField, ...remainingFields] = groupFields;
    const groups: Record<string, any[]> = {};
    
    data.forEach(item => {
      const val = String(item[currentField] || 'N/A');
      if (!groups[val]) groups[val] = [];
      groups[val].push(item);
    });
    
    const sortedGroups = Object.keys(groups).sort();
    
    let flatResult: any[] = [];
    sortedGroups.forEach(groupValue => {
      const groupItems = groups[groupValue];
      // Create a unique path-based ID to prevent key collisions in nested groups
      const currentPath = parentPath ? `${parentPath}/${groupValue}` : groupValue;
      const groupId = `${currentField}:${currentPath}`;
      const isCollapsed = collapsedGroups.has(groupId) ? !defaultIsCollapsed : defaultIsCollapsed;

      flatResult.push({ 
        type: 'group_header', 
        id: groupId,
        field: currentField, 
        value: groupValue, 
        count: groupItems.length,
        level: filterState.groupBy.length - groupFields.length,
        isCollapsed
      });
      
      if (!isCollapsed) {
        const children = remainingFields.length > 0 
          ? getGroupedContent(groupItems, remainingFields, currentPath) 
          : groupItems;
          
        flatResult = flatResult.concat(children);
      }
    });
    
    return flatResult;
  }, [collapsedGroups, defaultIsCollapsed, filterState.groupBy.length]);

  // Group and Paginate Logic
  const processedData = useMemo(() => {
    const grouped = filterState.groupBy.length > 0 
      ? getGroupedContent(filteredData, filterState.groupBy) 
      : filteredData;
    return grouped;
  }, [filteredData, filterState.groupBy, getGroupedContent]);

  const paginatedData = useMemo(() => {
    if (pageSize === 'all') return processedData;
    const size = pageSize as number;
    
    if (infiniteScroll) {
      return processedData.slice(0, currentPage * size);
    }
    
    const startIndex = (currentPage - 1) * size;
    return processedData.slice(startIndex, startIndex + size);
  }, [processedData, currentPage, pageSize, infiniteScroll]);

  const hasMore = useMemo(() => {
    if (pageSize === 'all') return false;
    return paginatedData.length < processedData.length;
  }, [paginatedData.length, processedData.length, pageSize]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!infiniteScroll || !hasMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setCurrentPage(currentPage + 1);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [infiniteScroll, hasMore, currentPage, setCurrentPage, loading]);

  const handleSort = (key: string, multi: boolean = false) => {
    setSortConfig(prev => {
      const existing = prev.findIndex(s => s.key === key);
      if (existing > -1) {
        const next = [...prev];
        if (next[existing].direction === 'asc') {
          next[existing].direction = 'desc';
          return next;
        } else {
          if (multi) { next.splice(existing, 1); return next; }
          return [{ key, direction: 'asc' }];
        }
      }
      return multi ? [...prev, { key, direction: 'asc' }] : [{ key, direction: 'asc' }];
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative transition-colors">
      {/* Search & Active Filter Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm shrink-0">
            <ListFilter size={12} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 pr-2 mr-1">Active View</span>
            {selectedStatusFilters.length > 0 || selectedAuditStageFilters.length > 0 || selectedVouchingStageFilters.length > 0 || selectedBlocker || selectedInstitutes.length > 0 ? (
              <div className="flex gap-1 items-center">
                {selectedBlocker && (
                  <Badge className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800 text-[10px] font-black flex gap-1 items-center italic">
                    Blocker: {selectedBlocker.category} ({selectedBlocker.type === 'both' ? 'All' : selectedBlocker.type})
                    <X 
                      size={10} 
                      className="cursor-pointer hover:text-amber-900 dark:hover:text-amber-200" 
                      onClick={() => setSelectedBlocker(null)}
                    />
                  </Badge>
                )}
                {selectedInstitutes.map(inst => (
                  <Badge key={`inst-${inst}`} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 text-[10px] font-black flex gap-1 items-center animate-in fade-in slide-in-from-left-2 transition-all">
                    {inst}
                    <X 
                      size={10} 
                      className="cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-200" 
                      onClick={() => setSelectedInstitutes(selectedInstitutes.filter(f => f !== inst))}
                    />
                  </Badge>
                ))}
                {selectedAuditStageFilters.map(sf => (
                  <Badge key={`as-${sf}`} className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800 text-[10px] font-black flex gap-1 items-center animate-in fade-in slide-in-from-left-2 transition-all italic">
                    Audit: {sf}
                    <X 
                      size={10} 
                      className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" 
                      onClick={() => setSelectedAuditStageFilters(selectedAuditStageFilters.filter(f => f !== sf))}
                    />
                  </Badge>
                ))}
                {selectedVouchingStageFilters.map(sf => (
                  <Badge key={`vs-${sf}`} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 text-[10px] font-black flex gap-1 items-center animate-in fade-in slide-in-from-left-2 transition-all italic">
                    Vouching: {sf}
                    <X 
                      size={10} 
                      className="cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-200" 
                      onClick={() => setSelectedVouchingStageFilters(selectedVouchingStageFilters.filter(f => f !== sf))}
                    />
                  </Badge>
                ))}
                {selectedStatusFilters.map(sf => (
                  <Badge key={sf} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 text-[10px] font-black flex gap-1 items-center animate-in fade-in slide-in-from-left-2">
                    {sf.replace(/_/g, ' ')}
                    <X 
                      size={10} 
                      className="cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-200" 
                      onClick={() => setSelectedStatusFilters(selectedStatusFilters.filter(f => f !== sf))}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">Showing All Units</span>
            )}
          </div>
          
          {Object.keys(filterState.columns).map(colId => {
            const f = filterState.columns[colId];
            if (f.values.length === 0 && !f.searchText) return null;
            return (
              <Badge key={colId} variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 shadow-sm flex gap-1 items-center">
                {colId}: {f.values.length > 0 ? `${f.values.length} selected` : `"${f.searchText}"`}
                <X 
                  size={10} 
                  className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" 
                  onClick={() => setFilterState(prev => ({
                    ...prev,
                    columns: {
                      ...prev.columns,
                      [colId]: { values: [], searchText: '' }
                    }
                  }))}
                />
              </Badge>
            );
          })}
        </div>

        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Matches</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full ring-1 ring-indigo-100 dark:ring-indigo-800">
              {filteredData.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <ScrollableTableContainer className="flex-1 min-h-0 relative scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-30 shadow-sm border-b border-slate-200 dark:border-slate-800">
              <tr className="bg-slate-50 dark:bg-slate-950 h-10 uppercase text-[10px] font-black tracking-widest text-slate-900 dark:text-slate-200">
                <th className="px-4 py-3 w-16 text-center border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black align-top">S.No</th>
                {columns.map((col, colIdx) => {
                  const isActive = sortConfig.some(s => s.key === col.id);
                  const sortData = sortConfig.find(s => s.key === col.id);
                  const isFiltered = filterState.columns[col.id]?.values.length > 0 || filterState.columns[col.id]?.searchText;
                  const isWrapped = columnWrapSettings[col.id];
                  const sortIndex = sortConfig.findIndex(s => s.key === col.id);
                  
                  return (
                    <th 
                      key={col.id} 
                      style={{ width: col.width }} 
                      className="group relative border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 select-none overflow-visible align-top"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', col.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId === col.id) return;
                        
                        setColumnOrder(prev => {
                          const newOrder = [...prev];
                          const fromIdx = newOrder.indexOf(draggedId);
                          const toIdx = newOrder.indexOf(col.id);
                          newOrder.splice(fromIdx, 1);
                          newOrder.splice(toIdx, 0, draggedId);
                          return newOrder;
                        });
                      }}
                    >
                      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                        {/* Row 1: Label & Sort */}
                        <div className="flex items-center justify-between px-4 pt-2 gap-1 min-h-[32px] cursor-grab active:cursor-grabbing">
                           <div 
                             className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-1 min-w-0"
                             onClick={(e) => handleSort(col.id, e.shiftKey)}
                             title="Click to Sort (Shift for Multi)"
                           >
                             <span className="truncate font-black">{col.label}</span>
                             <div className="flex flex-col shrink-0">
                               {isActive ? (
                                 sortData?.direction === 'asc' 
                                   ? <ChevronUp size={10} className="text-indigo-600 dark:text-indigo-400" /> 
                                   : <ChevronDown size={10} className="text-indigo-600 dark:text-indigo-400" />
                               ) : (
                                 <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                               )}
                             </div>
                           </div>

                           {/* Resize Handle */}
                           <div 
                              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-200 dark:hover:bg-indigo-900 z-10 transition-colors flex items-center justify-center group/handle"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.pageX;
                                const startWidth = typeof col.width === 'string' ? parseInt(col.width) : col.width;
                                const onMouseMove = (moveE: MouseEvent) => {
                                  handleResize(col.id, startWidth + (moveE.pageX - startX));
                                };
                                const onMouseUp = () => {
                                  document.removeEventListener('mousemove', onMouseMove);
                                  document.removeEventListener('mouseup', onMouseUp);
                                };
                                document.addEventListener('mousemove', onMouseMove);
                                document.addEventListener('mouseup', onMouseUp);
                              }}
                            >
                              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 group-hover/handle:bg-indigo-400" />
                            </div>
                        </div>

                        {/* Row 2: Controls (Action Bar) */}
                        <div className="flex items-center justify-between px-4 pb-2 mt-auto">
                           <div className="flex items-center gap-1">
                             <button 
                                onClick={() => setActiveFilterCol(activeFilterCol === col.id ? null : col.id)}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${isFiltered ? 'text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-900' : 'text-slate-300 dark:text-slate-600'}`}
                                title="Filter Column"
                              >
                                <FilterIcon size={10} />
                              </button>
                              
                              <button 
                                onClick={() => setColumnWrapSettings(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${isWrapped ? 'text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-300 dark:text-slate-600'}`}
                                title={isWrapped ? "Disable Wrap Text" : "Enable Wrap Text"}
                              >
                                <LayoutTemplate size={10} />
                              </button>
                           </div>
                           
                           <div className="flex items-center gap-1">
                              {isActive && (
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[7px] font-black text-indigo-400 dark:text-indigo-500 uppercase leading-none">Sort</span>
                                  <span className="text-[8px] font-black bg-indigo-600 dark:bg-indigo-500 text-white rounded px-1 flex items-center justify-center h-3.5 min-w-[14px] shadow-sm">
                                    {sortIndex + 1}{sortData?.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                </div>
                              )}
                              {isFiltered && !isActive && (
                                <span className="text-[7px] font-black text-indigo-400 dark:text-indigo-500 animate-pulse uppercase">Filtered</span>
                              )}
                           </div>
                        </div>
                      </div>

                    {/* Filter Popup */}
                    <AnimatePresence>
                      {activeFilterCol === col.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-full left-0 z-50 mt-1 bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-4 min-w-[240px] max-h-[400px] flex flex-col overflow-hidden lowercase normal-case tracking-normal"
                        >
                          <div className="flex flex-col mb-3">
                             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-left">Filter Column</span>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-left truncate">{col.label}</span>
                          </div>
                          <div className="relative mb-3">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 font-normal" />
                             <input 
                               autoFocus
                               type="text" 
                               placeholder="Search values..." 
                               className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-all font-medium dark:text-white"
                               value={filterState.columns[col.id]?.searchText || ''}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setFilterState(prev => ({
                                   ...prev,
                                   columns: { ...prev.columns, [col.id]: { ...(prev.columns[col.id] || { values: [] }), searchText: val } }
                                 }));
                               }}
                             />
                          </div>
                          <div className="flex-1 overflow-y-auto mb-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-left">
                             <div className="space-y-0.5">
                               {Array.from(new Set(data.map(r => String(r[col.id] || 'N/A'))))
                                 .filter(val => !filterState.columns[col.id]?.searchText || val.toLowerCase().includes(filterState.columns[col.id].searchText.toLowerCase()))
                                 .sort()
                                 .map(val => {
                                   const isSelected = filterState.columns[col.id]?.values.includes(val);
                                   return (
                                     <button
                                       key={val}
                                       onClick={() => {
                                         setFilterState(prev => {
                                           const currentValues = prev.columns[col.id]?.values || [];
                                           const nextValues = isSelected ? currentValues.filter(v => v !== val) : [...currentValues, val];
                                           return { ...prev, columns: { ...prev.columns, [col.id]: { ...(prev.columns[col.id] || { searchText: '' }), values: nextValues } } };
                                         });
                                       }}
                                       className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                     >
                                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
                                         {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                                       </div>
                                       <span className="text-xs truncate">{val}</span>
                                     </button>
                                   );
                                 })}
                             </div>
                          </div>
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                             <button 
                               onClick={() => { setFilterState(prev => { const n = { ...prev.columns }; delete n[col.id]; return { ...prev, columns: n }; }); setActiveFilterCol(null); }}
                               className="px-3 py-1.5 text-[10px] text-slate-500 font-bold hover:text-red-500 transition-colors uppercase tracking-wider"
                             >
                               Clear
                             </button>
                             <button onClick={() => setActiveFilterCol(null)} className="px-4 py-1.5 text-[10px] bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all uppercase tracking-wider shadow-sm">Apply</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={14} className="py-20 text-center"><RefreshCw className="w-10 h-10 text-indigo-100 animate-spin mx-auto" /></td></tr>
              ) : paginatedData.length > 0 ? (
                <>
                  {paginatedData.map((item, idx) => {
                    if (item.type === 'group_header') {
                      return (
                        <tr 
                          key={`group-${item.id}`} 
                          className="group bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                          onClick={() => {
                            setCollapsedGroups(prev => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }}
                        >
                          <td colSpan={14} className="px-6 py-2">
                             <div className="flex items-center gap-2">
                                <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors">
                                  {item.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.field === 'Status' ? 'Readiness' : 
                                 item.field === 'Audit Status (Excel)' ? 'Audit Status' : item.field}:</span>
                                <span className="text-xs font-bold text-indigo-600">{item.value}</span>
                                <Badge className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black px-1.5 py-0">
                                   {item.count} Units
                                </Badge>
                                {item.isCollapsed && <span className="text-[8px] font-bold text-slate-300 italic">(Collapsed)</span>}
                             </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <DataRow 
                        key={item.UID} 
                        row={item} 
                        index={idx} 
                        pageSize={infiniteScroll ? paginatedData.length : (pageSize === 'all' ? processedData.length : pageSize as number)} 
                        currentPage={infiniteScroll ? 1 : currentPage}
                        onRowClick={onRowClick}
                        isGrouped={filterState.groupBy.length > 0}
                        columnWrapSettings={columnWrapSettings}
                        columnOrder={columnOrder}
                      />
                    );
                  })}
                  {infiniteScroll && hasMore && (
                    <tr>
                      <td colSpan={14} className="p-0">
                        <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/20">
                           <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading next batch...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr><td colSpan={14} className="py-32 text-center text-slate-400 font-bold italic">Zero records matched your filter criteria.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-2 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
           {sortConfig.length > 0 && (
             <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm shrink-0 h-8">
               <ArrowUpDown size={12} className="text-indigo-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-2 mr-1">Sort Keys</span>
               <div className="flex gap-1.5">
                 {sortConfig.map((s, i) => (
                   <div key={s.key} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap">
                     <span className="opacity-60">{i+1}.</span>
                     {s.key}
                     {s.direction === 'asc' ? '↑' : '↓'}
                     <X 
                       size={10} 
                       className="cursor-pointer hover:text-indigo-900 ml-1" 
                       onClick={() => handleSort(s.key, true)}
                     />
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
        <PaginationControls 
          currentPage={currentPage}
          pageSize={pageSize === 'all' ? filteredData.length : pageSize}
          totalItems={filteredData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showAll={pageSize === 'all'}
        />
      </div>
    </div>
  );
}

const DataRow: React.FC<{ 
  row: WorkbenchRow, 
  index: number, 
  pageSize: number, 
  currentPage: number, 
  onRowClick: (r: WorkbenchRow) => void,
  isGrouped?: boolean,
  columnWrapSettings: Record<string, boolean>,
  columnOrder: string[]
}> = ({ 
  row, index, pageSize, currentPage, onRowClick, isGrouped, columnWrapSettings, columnOrder
}) => {
  const getStatusBadge = (row: WorkbenchRow) => {
    const isWrapped = columnWrapSettings['Status'];
    const statusType = row.statusType;
    const status = row.Status;
    
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
    const badgeClass = `font-black text-[9px] px-2 py-1 whitespace-normal leading-tight text-center flex items-center justify-center min-h-[1.5rem] gap-1 shrink-0 ${isWrapped ? 'w-full' : ''} ${colorClass}`;
    
    return <Badge className={badgeClass}>{status}</Badge>;
  };

  const wrapClass = (colId: string) => columnWrapSettings[colId] ? 'whitespace-normal break-words py-2' : 'truncate whitespace-nowrap';

  const renderCell = (colId: string) => {
    switch (colId) {
      case 'Institute':
        return <td key={colId} className={`px-4 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row.Institute}</td>;
      case 'UID':
        return <td key={colId} className={`px-4 text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tight border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row.UID}</td>;
      case 'Reg No':
        return <td key={colId} className={`px-4 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row['Reg No']}</td>;
      case 'Centre Name':
        return <td key={colId} className={`px-4 text-xs text-slate-600 dark:text-slate-400 font-medium border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`} title={row['Centre Name']}>{row['Centre Name']}</td>;
      case 'Zone':
        return <td key={colId} className={`px-4 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row.Zone}</td>;
      case 'SubZone':
        return <td key={colId} className={`px-4 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row.SubZone}</td>;
      case 'Month of Submission':
        return (
          <td key={colId} className={`px-4 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>
            <span className={`font-bold ${row['Month of Submission'] === 'March' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
               {row['Month of Submission']}
            </span>
          </td>
        );
      case 'Pending Vouching Count':
        return (
          <td key={colId} className={`px-4 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); Number(row['Pending Vouching Count'] || 0) !== 0 && onRowClick(row); }}
              className={`font-black tracking-tight ${Number(row['Pending Vouching Count'] || 0) > 0 ? 'text-red-700 dark:text-red-400 hover:underline cursor-pointer' : Number(row['Pending Vouching Count'] || 0) < 0 ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer' : 'text-green-600 dark:text-green-500 cursor-default'}`}
            >
              {Number(row['Pending Vouching Count'] || 0).toLocaleString()}
            </button>
          </td>
        );
      case 'Rejected Vouching Count':
        return (
          <td key={colId} className={`px-4 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); Number(row['Rejected Vouching Count'] || 0) !== 0 && onRowClick(row); }}
              className={`font-black tracking-tight ${Number(row['Rejected Vouching Count'] || 0) > 0 ? 'text-red-700 dark:text-red-400 hover:underline cursor-pointer' : Number(row['Rejected Vouching Count'] || 0) < 0 ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer' : 'text-green-600 dark:text-green-500 cursor-default'}`}
            >
              {Number(row['Rejected Vouching Count'] || 0).toLocaleString()}
            </button>
          </td>
        );
      case 'Audit Status (Excel)':
        return <td key={colId} className={`px-4 text-[10px] italic font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row['Audit Status (Excel)']}</td>;
      case 'Auditor':
        return <td key={colId} className={`px-4 text-xs font-bold text-slate-500 dark:text-slate-400 italic border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row.Auditor || 'N/A'}</td>;
      case 'Audit Stage':
        return <td key={colId} className={`px-4 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row['Audit Stage'] || 'N/A'}</td>;
      case 'Vouching Stage':
        return <td key={colId} className={`px-4 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{row['Vouching Stage'] || 'N/A'}</td>;
      case 'Grade':
        return (
          <td key={colId} className={`px-4 text-center border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>
            <Badge 
              variant="outline" 
              className={`font-mono text-[10px] ${
                row.Grade === 'A' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                row.Grade === 'B' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                row.Grade === 'C' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                row.Grade === 'D' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {row.Grade}
            </Badge>
          </td>
        );
      case 'Status':
        return (
          <td key={colId} className={`px-4 py-2 border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>
            <div className="flex justify-start">
               {getStatusBadge(row)}
            </div>
          </td>
        );
      default:
        return <td key={colId} className={`px-4 text-xs border-r border-slate-200/70 dark:border-slate-800 ${wrapClass(colId)}`}>{String(row[colId] || '')}</td>;
    }
  };

  return (
    <tr 
      onClick={() => onRowClick(row)}
      className={`group hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 min-h-[32px] ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-100/40 dark:bg-slate-950/40'}`}
    >
      <td className="px-4 text-center font-bold text-slate-400 dark:text-slate-500 text-[10px] border-r border-slate-200 dark:border-slate-800">
        { isGrouped ? '-' : (currentPage - 1) * pageSize + index + 1 }
      </td>
      {columnOrder.map(colId => renderCell(colId))}
    </tr>
  );
};


// --- Helpers ---

const FilterCard: React.FC<{ 
  label: string; 
  count: number; 
  icon?: any; 
  active: boolean; 
  onClick: () => void; 
  color: string;
  showIcon?: boolean;
}> = ({ label, count, icon: Icon, active, onClick, color, showIcon = true }) => {
  const colorMap: Record<string, string> = {
    indigo: 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
    emerald: 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    blue: 'border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    amber: 'border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    orange: 'border-orange-100 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    rose: 'border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
    purple: 'border-purple-100 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
    cyan: 'border-cyan-100 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
    slate: 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300',
  };

  const activeColorMap: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-900 shadow-md',
    emerald: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900 shadow-md',
    blue: 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900 shadow-md',
    amber: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-100 dark:ring-amber-900 shadow-md',
    orange: 'bg-orange-600 text-white border-orange-700 ring-2 ring-orange-100 dark:ring-orange-900 shadow-md',
    rose: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-100 dark:ring-rose-900 shadow-md',
    purple: 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-100 dark:ring-purple-900 shadow-md',
    cyan: 'bg-cyan-600 text-white border-cyan-700 ring-2 ring-cyan-100 dark:ring-cyan-900 shadow-md',
    slate: 'bg-slate-700 text-white border-slate-800 ring-2 ring-slate-100 dark:ring-slate-900 shadow-md',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left group w-full ${
        active ? activeColorMap[color] : `bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm ${colorMap[color]}`
      }`}
    >
      {showIcon && Icon && (
        <div className={`p-1.5 rounded-lg transition-colors ${
          active ? 'bg-white/20' : 'bg-white/50'
        }`}>
          <Icon size={14} className={active ? 'text-white' : ''} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-tight truncate ${active ? 'text-white/80' : 'opacity-60'}`}>
          {label}
        </p>
        <p className={`text-base font-black ${active ? 'text-white' : ''}`}>
          {(count || 0).toLocaleString()}
        </p>
      </div>
      {active && <Check size={14} className="text-white shrink-0" />}
    </button>
  );
};

interface BlockerProps {
  category: string;
  pending: number;
  rejected: number;
  units: number;
  activeCategory: boolean;
  activeType: string | null;
  onSelect: (type: 'pending' | 'rejected' | 'both' | 'upl' | 'pre' | 'inA' | 'pst' | 'rej' | 'total') => void;
  uploadPending?: number;
  preAuditPending?: number;
  inAuditPending?: number;
  postAuditPending?: number;
}

const SummaryBlockerRow: React.FC<BlockerProps> = ({ 
  category, activeCategory, activeType, onSelect,
  uploadPending = 0, preAuditPending = 0, inAuditPending = 0, postAuditPending = 0, rejected = 0, units = 0
}) => {
  const total = uploadPending + preAuditPending + inAuditPending + postAuditPending + rejected;

  return (
     <tr className={`group transition-all ${activeCategory ? 'bg-amber-50/50 dark:bg-amber-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors'}`}>
      <td className={`px-3 py-2.5 font-semibold text-[10px] leading-tight truncate max-w-[120px] ${activeCategory ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`} title={category}>
        {category}
      </td>
      <td className="px-1 py-1 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-100 dark:border-slate-800" title="Total number of units affected in this category">
        {units}
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('upl')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'upl'
              ? 'bg-red-500 text-white shadow-sm'
              : uploadPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
          }`}
        >
          {uploadPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center italic">
        <button 
          onClick={() => onSelect('pre')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'pre'
              ? 'bg-orange-500 text-white shadow-sm'
              : preAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'
          }`}
        >
          {preAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('inA')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'inA'
              ? 'bg-pink-500 text-white shadow-sm'
              : inAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30'
          }`}
        >
          {inAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('pst')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'pst'
              ? 'bg-green-500 text-white shadow-sm'
              : postAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
          }`}
        >
          {postAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center italic border-l border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => onSelect('rej')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'rej'
              ? 'bg-red-600 text-white shadow-sm'
              : rejected === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
          }`}
        >
          {rejected || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => onSelect('total')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'total'
              ? 'bg-indigo-600 text-white shadow-sm'
              : total === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400'
          }`}
        >
          {total || 0}
        </button>
      </td>
    </tr>
  );
};

const BlockerRow: React.FC<BlockerProps> = ({ 
  category, pending, rejected, units, activeCategory, activeType, onSelect,
  uploadPending = 0, preAuditPending = 0, inAuditPending = 0, postAuditPending = 0
}) => {
  const total = uploadPending + preAuditPending + inAuditPending + postAuditPending + rejected;
  
  return (
    <tr className={`group transition-all ${activeCategory ? 'bg-amber-50/50 dark:bg-amber-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
      <td className={`px-1 py-2.5 text-[10px] font-bold truncate leading-tight ${activeCategory ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`} title={`Category: ${category}`}>
        <button 
           onClick={() => onSelect('both')}
           className="w-full text-left uppercase tracking-tight"
        >
          {category}
        </button>
      </td>
      <td className="px-1 py-1 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-100 dark:border-slate-800" title="Total number of units affected in this category">
        {units}
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('upl')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'upl'
              ? 'bg-red-500 text-white shadow-sm'
              : uploadPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
          }`}
        >
          {uploadPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center italic">
        <button 
          onClick={() => onSelect('pre')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'pre'
              ? 'bg-orange-500 text-white shadow-sm'
              : preAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'
          }`}
        >
          {preAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('inA')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'inA'
              ? 'bg-pink-500 text-white shadow-sm'
              : inAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30'
          }`}
        >
          {inAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center">
        <button 
          onClick={() => onSelect('pst')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'pst'
              ? 'bg-green-500 text-white shadow-sm'
              : postAuditPending === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
          }`}
        >
          {postAuditPending || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center italic border-l border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => onSelect('rej')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'rej'
              ? 'bg-red-600 text-white shadow-sm'
              : rejected === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
          }`}
        >
          {rejected || 0}
        </button>
      </td>
      <td className="px-0.5 py-1 text-center font-bold border-l border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => onSelect('total')}
          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all ${
            activeCategory && activeType === 'total'
              ? 'bg-indigo-600 text-white shadow-sm'
              : total === 0
                ? 'text-slate-200 dark:text-slate-800'
                : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400'
          }`}
        >
          {total || 0}
        </button>
      </td>
    </tr>
  );
};

const LogicCard = ({ title, logic, outcome, breakdown }: { title: string; logic: string; outcome: string; breakdown?: any[] }) => (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
       <div className="flex items-start justify-between mb-3">
         <h3 className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic">{title}</h3>
         <Badge className="text-[10px] py-1 px-3 font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">{outcome}</Badge>
       </div>
       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">{logic}</p>
       {breakdown && (
            <div className="grid grid-cols-1 gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                {breakdown.map((b, i) => (
                    <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                        <span className="font-black text-indigo-700 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-tighter">{b.label}:</span> 
                        <span className="leading-tight font-bold">{b.text}</span>
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
        <div className="flex flex-col gap-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center shadow-sm">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatted}</span>
        </div>
    );
};

function StatItem({ label, count, icon: Icon, variant }: { label: string, count: number, icon: any, variant: string }) {
  const themes: Record<string, string> = {
    all: 'border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-purple-100 dark:hover:shadow-none',
    allocation: 'border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 hover:shadow-green-100 dark:hover:shadow-none',
    completion: 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-emerald-100 dark:hover:shadow-none',
    bank: 'border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:shadow-orange-100 dark:hover:shadow-none',
    progress: 'border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:shadow-indigo-100 dark:hover:shadow-none',
    completed: 'border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-blue-100 dark:hover:shadow-none',
    completedWithRejection: 'border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:shadow-rose-100 dark:hover:shadow-none',
    completedWithPending: 'border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:shadow-amber-100 dark:hover:shadow-none',
    auditable: 'border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 hover:shadow-green-100 dark:hover:shadow-none',
    pending: 'border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:shadow-amber-100 dark:hover:shadow-none',
    rejected: 'border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-red-100 dark:hover:shadow-none',
    notready: 'border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:shadow-rose-100 dark:hover:shadow-none',
    notauditable: 'border-cyan-200 dark:border-cyan-900/50 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:shadow-cyan-100 dark:hover:shadow-none',
  };

  return (
    <div className={`p-4 rounded-3xl border-2 transition-all cursor-default flex flex-col items-center justify-center text-center group hover:scale-[1.03] hover:shadow-2xl min-h-[100px] ${themes[variant] || themes.all}`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 whitespace-normal leading-tight line-clamp-2 max-w-[120px]">{label}</span>
      <div className="flex items-center gap-2">
         <Icon size={20} className="stroke-[3px]" />
         <span className="text-2xl font-black">{(count || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

function TimelineItem({ label, value, status }: { label: string, value: string, status: 'OK' | 'FAIL' | 'INFO' }) {
  return (
    <div className="flex flex-col">
       <div className="flex items-center gap-2 mb-1">
         <div className={`w-2 h-2 rounded-full ${status === 'OK' ? 'bg-green-500' : status === 'FAIL' ? 'bg-red-500' : 'bg-indigo-400'}`} />
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       </div>
       <p className={`text-xs font-bold ${status === 'FAIL' ? 'text-red-700' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
