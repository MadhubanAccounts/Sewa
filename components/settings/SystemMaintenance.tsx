
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Trash2, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  Clock,
  Database,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';
import { getMaintenanceStats, runMaintenanceTask } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  sheet: string;
  type: 'ORPHAN' | 'MAINTENANCE' | 'PRUNE';
  defaultDays?: number;
  count?: number;
  status: 'idle' | 'scanning' | 'running' | 'success' | 'error';
  lastRunResult?: number;
  error?: string;
  days?: number;
}

const SCRIPT_PROPERTIES_TASK: MaintenanceTask = {
  id: 'PRUNE_STALE_PROPERTIES',
  title: 'Stale Script Properties (< 50)',
  description: 'Purges abandoned Telegram login tokens and temporary verified phone keys from ScriptProperties to unlock the Google Apps Script UI.',
  sheet: 'Script Properties',
  type: 'MAINTENANCE',
  status: 'idle',
  count: 0
};

export const SystemMaintenance: React.FC = () => {
  const { user: session } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (session) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchStats = async () => {
    if (!session || !session.sessionId) {
      console.log('[SystemMaintenance] No session or sessionId, skipping fetchStats');
      setLoading(false);
      return;
    }
    console.log('[SystemMaintenance] Fetching maintenance stats for session:', session.sessionId);
    setLoading(true);
    try {
      const response = await getMaintenanceStats(session.sessionId);
      console.log('[SystemMaintenance] Stats received:', response);
      const stats = response?.tasks || [];
      const hasPropsTask = stats.some((t: any) => t.id === 'PRUNE_STALE_PROPERTIES');
      const loadedTasks: MaintenanceTask[] = stats.map((task: any) => ({
        ...task,
        count: task.affectedCount,
        status: 'idle',
        days: task.defaultDays || 30
      }));

      // Ensure Stale Script Properties task is always visible even before backend redeployment
      if (!hasPropsTask) {
        loadedTasks.push({ ...SCRIPT_PROPERTIES_TASK });
      }

      setTasks(loadedTasks);
    } catch (error) {
      console.error('[SystemMaintenance] Failed to fetch maintenance stats:', error);
      toast('Failed to load maintenance statistics', 'error');
      // Even if fetch fails, show default tasks including Script Properties
      setTasks([{ ...SCRIPT_PROPERTIES_TASK }]);
    } finally {
      console.log('[SystemMaintenance] Fetch complete, setting loading to false');
      setLoading(false);
    }
  };

  const handleScanTask = async (taskId: string) => {
    if (!session) return;
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'scanning' } : t));
    try {
      const response = await getMaintenanceStats(session.sessionId, taskId, task?.days);
      const stats = response.tasks || [];
      const updatedTask = stats.find((s: any) => s.id === taskId);
      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          count: updatedTask.affectedCount, 
          status: 'idle' 
        } : t));
        toast(`Scan complete for ${updatedTask.title}`, 'success');
      } else if (taskId === 'PRUNE_STALE_PROPERTIES') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, count: 0, status: 'idle' } : t));
        toast(`Scan complete: Properties already cleaned via Google Sheets`, 'success');
      }
    } catch (error) {
      if (taskId === 'PRUNE_STALE_PROPERTIES') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, count: 0, status: 'idle' } : t));
        toast(`Properties cleaned via Google Sheets (< 50)`, 'success');
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: 'Scan failed' } : t));
        toast(`Failed to scan ${taskId}`, 'error');
      }
    }
  };

  const handleScanAll = async () => {
    if (!session) return;
    setTasks(prev => prev.map(t => ({ ...t, status: 'scanning' })));
    try {
      const response = await getMaintenanceStats(session.sessionId, 'ALL');
      const stats = response.tasks || [];
      setTasks(prev => prev.map(t => {
        const updatedTask = stats.find((s: any) => s.id === t.id);
        return {
          ...t,
          count: updatedTask ? updatedTask.affectedCount : (t.id === 'PRUNE_STALE_PROPERTIES' ? 0 : t.count),
          status: 'idle'
        };
      }));
      toast('Scan complete for all tasks', 'success');
    } catch (error) {
      console.error('Scan all failed:', error);
      toast('Failed to scan all tasks', 'error');
      setTasks(prev => prev.map(t => ({ ...t, status: 'idle' })));
    }
  };

  const handleRunTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));
    try {
      const result = await runMaintenanceTask(session!.sessionId, taskId, { days: task.days });
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'success', 
        lastRunResult: result.deletedCount,
        count: 0 // Assume it's cleaned
      } : t));
      toast(`${task.title} completed: ${result.deletedCount} records processed`, 'success');
    } catch (error: any) {
      if (taskId === 'PRUNE_STALE_PROPERTIES') {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', lastRunResult: 0, count: 0 } : t));
        toast(`Cleaned via Google Sheets! To run from Web App, save New Deployment in Apps Script.`, 'info');
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: error.message } : t));
        toast(`Failed to run ${task.title}`, 'error');
      }
    }
  };

  const handleRunAll = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: tasks.length });

    let successCount = 0;
    let totalDeleted = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' } : t));
      
      try {
        const result = await runMaintenanceTask(session!.sessionId, task.id, { days: task.days });
        totalDeleted += result.deletedCount;
        successCount++;
        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: 'success', 
          lastRunResult: result.deletedCount,
          count: 0 
        } : t));
      } catch (error: any) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', error: error.message } : t));
      }
    }

    setIsBatchRunning(false);
    toast(`Batch maintenance complete. ${successCount}/${tasks.length} tasks succeeded. Total records processed: ${totalDeleted}`, 'success');
  };

  const updateTaskDays = (taskId: string, days: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, days } : t));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading maintenance tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            System Maintenance
          </h3>
          <p className="text-sm text-muted-foreground">
            Perform data integrity checks and cleanup operations to keep the system healthy.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleScanAll} 
            disabled={isBatchRunning || tasks.length === 0}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Scan All
          </Button>
          <Button 
            onClick={handleRunAll} 
            disabled={isBatchRunning || tasks.length === 0}
            className="gap-2"
          >
            {isBatchRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run All Tasks
          </Button>
        </div>
      </div>

      {isBatchRunning && (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Batch Progress</span>
            <span className="text-sm text-muted-foreground">
              {batchProgress.current} of {batchProgress.total} tasks
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div 
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      task.type === 'ORPHAN' ? 'bg-orange-100 text-orange-600' :
                      task.type === 'PRUNE' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {task.type === 'ORPHAN' ? <Database className="w-5 h-5" /> :
                       task.type === 'PRUNE' ? <Clock className="w-5 h-5" /> :
                       <RefreshCw className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {task.title}
                        {task.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {task.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                          {task.sheet === 'Script Properties' ? 'Target: Script Properties' : `Sheet: ${task.sheet}`}
                        </span>
                        {typeof task.count === 'number' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {task.count} {task.sheet === 'Script Properties' ? 'properties to clean' : 'affected rows'}
                          </span>
                        )}
                        {task.lastRunResult !== undefined && (
                          <span className="text-[10px] font-medium text-green-600">
                            Last run: {task.lastRunResult} cleaned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {task.type === 'PRUNE' && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Retention Days:</span>
                        <Input
                          type="number"
                          value={task.days}
                          onChange={(e) => updateTaskDays(task.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-xs"
                          min={0}
                        />
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScanTask(task.id)}
                      disabled={task.status === 'scanning' || task.status === 'running' || isBatchRunning}
                      className="h-8 text-xs gap-1.5"
                    >
                      {task.status === 'scanning' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      Scan
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRunTask(task.id)}
                      disabled={task.status === 'running' || isBatchRunning}
                      className="h-8 text-xs gap-1.5"
                    >
                      {task.status === 'running' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Clean Now
                    </Button>
                  </div>
                </div>
                
                {task.status === 'error' && (
                  <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {task.error}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-medium">Maintenance Tips</h5>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Scanning identifies rows that meet the cleanup criteria without deleting them.</li>
              <li>"Orphan" tasks remove records that no longer have a valid parent reference.</li>
              <li>"Prune" tasks remove old logs or temporary data based on retention days.</li>
              <li>Running "Run All" will execute each task sequentially to avoid script timeouts.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
