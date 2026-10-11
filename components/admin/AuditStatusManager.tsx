
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';
import { useData } from '../../hooks/useData';
import { format } from 'date-fns';

interface AuditStatusSettings {
  sourceExcelFileId: string;
  lastSyncTimestamp: string;
  enableAutoSync: string;
  autoSyncTime: string;
  lastSourceFileModifiedTime: string;
}

const AuditStatusManager: React.FC = () => {
  const { callServer } = useData();
  const [settings, setSettings] = useState<AuditStatusSettings>({
    sourceExcelFileId: '',
    lastSyncTimestamp: '',
    enableAutoSync: 'false',
    autoSyncTime: '10:00',
    lastSourceFileModifiedTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await callServer('getAuditStatusSettings');
      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      toast('Failed to load Audit Status settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await callServer('updateAuditStatusSettings', settings);
      toast('Settings updated successfully', 'success');
    } catch (error) {
      toast('Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await callServer('syncAuditStatus');
      if (result.success) {
        toast(result.message || 'Data synchronized successfully', 'success');
        fetchSettings();
      }
    } catch (error: any) {
      toast(error.message || 'Synchronization failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const formatSafeDate = (dateVal: any): string => {
    if (dateVal === null || dateVal === undefined) return '';
    
    try {
      let strValue = '';
      
      // Handle different types safely to avoid "Cannot convert object to primitive value"
      if (typeof dateVal === 'object') {
        if (dateVal instanceof Date) {
          strValue = dateVal.toISOString();
        } else {
          // Check if it's a plain object or null-prototype object
          try {
            strValue = dateVal.toString ? dateVal.toString() : JSON.stringify(dateVal);
          } catch (e) {
            return '';
          }
        }
      } else {
        strValue = String(dateVal);
      }

      const trimmed = strValue.trim();
      if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '[object Object]') {
        return '';
      }
      
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return '';
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Status Management</h1>
          <p className="text-gray-500">Configure and synchronize audit readiness source data.</p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncing || !settings.sourceExcelFileId}
          className="flex items-center gap-2"
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Settings">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                <SettingsIcon className="w-3 h-3 text-blue-600" />
                Source Excel File ID
              </label>
              <div className="flex gap-2">
                <Input 
                  value={settings.sourceExcelFileId}
                  onChange={(e) => setSettings({ ...settings, sourceExcelFileId: e.target.value })}
                  placeholder="Paste File ID from Google Drive URL"
                  className="flex-1"
                />
              </div>
              <p className="text-[10px] text-gray-500 flex items-center gap-1 italic">
                <Info className="w-3 h-3" />
                The long string in the Google Drive URL between /d/ and /edit
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="enableAutoSync"
                  checked={settings.enableAutoSync === 'true'}
                  onChange={(e) => setSettings({ ...settings, enableAutoSync: e.target.checked ? 'true' : 'false' })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enableAutoSync" className="text-sm font-medium text-gray-700">Enable Auto-Sync</label>
              </div>
              
              {settings.enableAutoSync === 'true' && (
                <Input 
                  type="time"
                  value={settings.autoSyncTime}
                  onChange={(e) => setSettings({ ...settings, autoSyncTime: e.target.value })}
                  className="w-32"
                />
              )}
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="w-full"
                variant="outline"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Sync Statistics">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Last Synchronized</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {formatSafeDate(settings.lastSyncTimestamp) || 'Never'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Source File Modified</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {formatSafeDate(settings.lastSourceFileModifiedTime) || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Database className="w-3 h-3" />
                Status Indicators
              </h3>
              <div className="space-y-2 text-sm font-medium">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Success: Data updated in internal system.</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Skipped: Source file has not changed.</span>
                </div>
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Failed: Check File ID or permissions.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-bold uppercase tracking-tight">Required Excel Columns:</p>
                <p className="font-mono bg-blue-100/50 px-1 py-0.5 rounded">UID, Audit Status, Auditor, Grade, Grade-C, Reg No</p>
                <p className="italic mt-2 opacity-75">* UID is matched for each center.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuditStatusManager;
