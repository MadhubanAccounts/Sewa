import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { ConfirmModal } from '../ui/ConfirmModal';
import { 
  getTelegramData, 
  upsertTelegramData, 
  deleteTelegramData 
} from '../../services/apiService';
import { 
  Send, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Info,
  Calendar,
  Smartphone,
  Globe,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'Other', label: 'Other' }
];

const DEVICE_OS_OPTIONS = [
  { value: 'Android', label: 'Android' },
  { value: 'iOS', label: 'iOS (iPhone/iPad)' },
  { value: 'Desktop', label: 'Desktop App (Windows/Mac)' },
  { value: 'Web', label: 'Telegram Web' },
  { value: 'Other', label: 'Other' }
];

interface TelegramUser {
  timestamp: string;
  name: string;
  phone: string;
  telegramId: string;
  username: string;
  useLanguagePref: string;
  userDeviceOs: string;
  lastActiveinTelegram: string;
}

export default function TelegramDataManagement() {
  const { user: currentUser, hasPermission } = useAuth();
  const sessionId = currentUser?.sessionId || '';

  const canEdit = hasPermission('telegram_data_edit');

  // List State
  const [registrations, setRegistrations] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [osFilter, setOsFilter] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    telegramId: '',
    username: '',
    useLanguagePref: 'English',
    userDeviceOs: 'Android'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Deletion Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTelegramData(sessionId);
      // Ensure we get an array
      if (Array.isArray(data)) {
        setRegistrations(data);
      } else {
        setRegistrations([]);
        console.warn('API returned non-array for getTelegramData:', data);
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filteredUsers = useMemo(() => {
    return registrations.filter(user => {
      const nameMatch = String(user.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = String(user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = String(user.telegramId || '').toLowerCase().includes(searchQuery.toLowerCase());
      const usernameMatch = String(user.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const queryMatch = nameMatch || phoneMatch || idMatch || usernameMatch;
      
      const langMatch = !langFilter || user.useLanguagePref === langFilter;
      const osMatch = !osFilter || user.userDeviceOs === osFilter;
      
      return queryMatch && langMatch && osMatch;
    });
  }, [registrations, searchQuery, langFilter, osFilter]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formValues.name.trim()) {
      setSubmitError('Name is required.');
      return;
    }
    if (!formValues.telegramId.trim()) {
      setSubmitError('Telegram ID is required.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        name: formValues.name.trim(),
        phone: formValues.phone.trim(),
        telegramId: formValues.telegramId.trim(),
        username: formValues.username.trim(),
        useLanguagePref: formValues.useLanguagePref,
        userDeviceOs: formValues.userDeviceOs
      };

      const result = await upsertTelegramData(sessionId, payload);

      if (result.success) {
        showToast(result.message || 'Operation completed successfully.');
        setIsFormOpen(false);
        fetchData();
      } else {
        setSubmitError(result.error || 'Failed to save record.');
      }
    } catch (e: any) {
      setSubmitError(e.message || 'An error occurred during submission.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open Form for Adding
  const openAddForm = () => {
    setFormMode('ADD');
    setSubmitError(null);
    setFormValues({
      name: '',
      phone: '',
      telegramId: '',
      username: '',
      useLanguagePref: 'English',
      userDeviceOs: 'Android'
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const openEditForm = (user: TelegramUser) => {
    setFormMode('EDIT');
    setSubmitError(null);
    setFormValues({
      name: user.name || '',
      phone: user.phone || '',
      telegramId: user.telegramId || '',
      username: user.username || '',
      useLanguagePref: user.useLanguagePref || 'English',
      userDeviceOs: user.userDeviceOs || 'Android'
    });
    setIsFormOpen(true);
  };

  // Handle Record Deletion
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const result = await deleteTelegramData(sessionId, deleteConfirmId);
      if (result.success) {
        showToast(result.message || 'Record successfully deleted.');
        fetchData();
      } else {
        showToast(result.error || 'Failed to delete record.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error occurred during deletion.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmId(null);
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'English': return 'blue';
      case 'Hindi': return 'emerald';
      case 'Punjabi': return 'amber';
      case 'Spanish': return 'purple';
      case 'French': return 'rose';
      default: return 'gray';
    }
  };

  const getDeviceOsIcon = (os: string) => {
    switch (os) {
      case 'iOS': return '📱';
      case 'Android': return '🤖';
      case 'Desktop': return '💻';
      case 'Web': return '🌐';
      default: return '⚙️';
    }
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2" id="telegram-data-module">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-2xl border transition-all transform duration-300 translate-y-0 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
          role="alert"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-3">
            <Send className="w-8 h-8 text-[var(--primary-color)]" />
            Telegram Registrations
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Database of user profiles registered and active in the Telegram system.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canEdit && (
            <Button 
              variant="primary" 
              onClick={openAddForm}
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Registration
            </Button>
          )}
        </div>
      </div>

      {/* Error Panel */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to Load Registrations</p>
            <p className="text-xs text-rose-700/80 mt-0.5">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-3 border-rose-300 text-rose-800 hover:bg-rose-100">
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search controls */}
      <Card className="p-4 bg-[var(--card-background)] rounded-xl border border-[var(--border)] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] w-4.5 h-4.5" />
            <input 
              type="text" 
              placeholder="Search by Name, Phone, Telegram ID, or Username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--main-background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-all placeholder-[var(--placeholder-foreground)]"
            />
          </div>

          <div>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="block w-full px-3 py-2.5 text-sm bg-[var(--main-background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-all cursor-pointer"
            >
              <option value="">All Languages</option>
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="block w-full px-3 py-2.5 text-sm bg-[var(--main-background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-all cursor-pointer"
            >
              <option value="">All Operating Systems</option>
              {DEVICE_OS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Registrations List Panel */}
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card-background)] shadow-sm rounded-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
            <p className="text-sm font-medium text-[var(--foreground-muted)]">Loading registrations database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
            <div className="p-4 bg-[var(--main-background)] rounded-full text-[var(--foreground-muted)] mb-4 border border-[var(--border)]">
              <Send className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">No Registrations Found</h3>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {searchQuery || langFilter || osFilter 
                ? "No users match your active filters and search criteria. Try resetting them." 
                : "No Telegram users have been registered in this system yet."}
            </p>
            {(searchQuery || langFilter || osFilter) && (
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setLangFilter(''); setOsFilter(''); }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--header-background)] border-b border-[var(--border)] text-[var(--foreground-muted)] text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name / Username</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Telegram ID</th>
                  <th className="px-6 py-4 text-center">Language</th>
                  <th className="px-6 py-4 text-center">Device OS</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map((reg, index) => (
                  <tr 
                    key={reg.telegramId || index}
                    className="hover:bg-[var(--list-item-hover-background)] transition-colors text-sm text-[var(--foreground)]"
                  >
                    {/* Name column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold text-sm">
                          {reg.name ? reg.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--foreground-display)]">{reg.name || 'Unknown User'}</p>
                          {reg.username ? (
                            <p className="text-xs text-[var(--primary-color)]">@{reg.username}</p>
                          ) : (
                            <p className="text-xs text-[var(--foreground-muted)] italic">No username</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact info column */}
                    <td className="px-6 py-4 font-mono text-xs text-[var(--foreground-muted)]">
                      {reg.phone || 'No Phone Number'}
                    </td>

                    {/* Telegram ID column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-xs px-2 py-1 bg-[var(--main-background)]">
                          {reg.telegramId}
                        </Badge>
                      </div>
                    </td>

                    {/* Language Preference Column */}
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        variant={getLanguageColor(reg.useLanguagePref) as any}
                        className="px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block"
                      >
                        {reg.useLanguagePref || 'English'}
                      </Badge>
                    </td>

                    {/* Device OS Column */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[var(--main-background)] border border-[var(--border)] font-medium text-[var(--foreground-muted)]">
                        <span className="text-sm">{getDeviceOsIcon(reg.userDeviceOs)}</span>
                        {reg.userDeviceOs || 'Android'}
                      </span>
                    </td>

                    {/* Last Active Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                        <Clock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        <span>{formatDateTime(reg.lastActiveinTelegram)}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditForm(reg)}
                          className="text-[var(--foreground-muted)] hover:text-[var(--primary-color)]"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { 
                              setDeleteConfirmId(reg.telegramId); 
                              setDeleteConfirmName(reg.name); 
                            }}
                            className="text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Counter Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--header-background)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="font-medium">Total Registered Users: {registrations.length}</span>
            {filteredUsers.length !== registrations.length && (
              <span>Filtered Records: {filteredUsers.length}</span>
            )}
          </div>
        )}
      </Card>

      {/* Manual / Info banner about data source */}
      <div className="p-4 bg-[var(--card-background)] rounded-2xl border border-[var(--border)] flex items-start gap-3.5 max-w-3xl">
        <Info className="w-5.5 h-5.5 text-[var(--primary-color)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--foreground-muted)] leading-relaxed">
          <p className="font-bold text-[var(--foreground)] mb-1">About the Telegram Registration Database</p>
          <p className="mb-1">
            This module represents the official standalone database containing registered users configured to interact with the system bots.
          </p>
          <p>
            The backend updates dynamically to capture details like <strong>Language Preferences</strong>, <strong>Device Operating System</strong>, and tracking <strong>Last Active</strong> timestamps securely without mixing it with attendance or workflow records.
          </p>
        </div>
      </div>

      {/* Dialog for Add / Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'ADD' ? 'Add New Telegram User' : 'Edit Telegram User Profile'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <Input 
            label="Full Name"
            id="form-name"
            required
            placeholder="John Doe"
            value={formValues.name}
            onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            disabled={submitLoading}
          />

          <Input 
            label="Phone Number"
            id="form-phone"
            placeholder="+91 99999 88888"
            value={formValues.phone}
            onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
            disabled={submitLoading}
          />

          <Input 
            label="Telegram ID"
            id="form-tgid"
            required
            placeholder="1234567890"
            value={formValues.telegramId}
            onChange={(e) => setFormValues({ ...formValues, telegramId: e.target.value })}
            disabled={submitLoading || formMode === 'EDIT'} // Keep Telegram ID locked in edit mode
            className="font-mono text-sm"
          />

          <Input 
            label="Telegram Username"
            id="form-username"
            placeholder="johndoe"
            value={formValues.username}
            onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
            disabled={submitLoading}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Language Preference
            </label>
            <Select 
              options={LANGUAGE_OPTIONS}
              value={formValues.useLanguagePref}
              onChange={(value) => setFormValues({ ...formValues, useLanguagePref: value })}
              disabled={submitLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Device Operating System
            </label>
            <Select 
              options={DEVICE_OS_OPTIONS}
              value={formValues.userDeviceOs}
              onChange={(value) => setFormValues({ ...formValues, userDeviceOs: value })}
              disabled={submitLoading}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)] mt-6">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitLoading}
              className="flex items-center gap-1.5"
            >
              {submitLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {formMode === 'ADD' ? 'Register User' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion Dialog */}
      <ConfirmModal 
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--foreground)]">
            Are you sure you want to remove the Telegram registration for <strong className="font-semibold text-red-600 dark:text-red-400">"{deleteConfirmName}"</strong>?
          </p>
          <p className="text-xs text-[var(--foreground-muted)] bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 p-2.5 rounded-lg">
            ⚠️ This will completely delete their active profile registration record from the Google sheet database. The user will lose bot interaction rights until re-registered.
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
