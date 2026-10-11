
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getMessageTemplates, processBulkMessageRequest, initiateBulkJob, getBulkMessagingMetadata, getRecentBulkJobs } from '../services/apiService';
import { MessageTemplate, BulkMessageResult, BulkRowData, BulkDeliveryStrategy } from '../types';
import { toast } from './ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { WysiwygEditor, WysiwygEditorRef } from './ui/WysiwygEditor';
import { Checkbox } from './ui/Checkbox';
import { Badge } from './ui/Badge';
import { RefreshCw, History, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

const BulkMessaging: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const sessionId = user?.sessionId || '';
    const [fileData, setFileData] = useState<BulkRowData[]>([]);
    const [messageContent, setMessageContent] = useState<string>('');
    const [selectedToRoles, setSelectedToRoles] = useState<string[]>(['ARP', 'Incharge', 'SAC', 'ZAC']);
    const [selectedCcRoles, setSelectedCcRoles] = useState<string[]>([]);
    const [deliveryStrategy, setDeliveryStrategy] = useState<BulkDeliveryStrategy>('UID_PRIORITY_FALLBACK');
    const [summaryGroupIds, setSummaryGroupIds] = useState<string[]>([]);
    const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string; telegramId: string }[]>([]);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [results, setResults] = useState<BulkMessageResult[] | null>(null);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [jobName, setJobName] = useState<string>('');
    const [selectedMessageForModal, setSelectedMessageForModal] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ previewOnly: boolean } | null>(null);
    const [confirmMessage, setConfirmMessage] = useState<string>('');
    const [ccPrefixTemplate, setCcPrefixTemplate] = useState<string>('The below message is sent to {ARPName}{InchargeName}');
    const [includeOriginalInCc, setIncludeOriginalInCc] = useState<boolean>(true);
    const [summaryPrefixTemplate, setSummaryPrefixTemplate] = useState<string>('Bulk Message Job: {JobName}\nTotal UIDs Processed: {TotalUIDs}\nTime: {Timestamp}');
    const [includeZoneSummary, setIncludeZoneSummary] = useState<boolean>(true);
    const [includeSubZoneSummary, setIncludeSubZoneSummary] = useState<boolean>(true);
    const [includeBcc, setIncludeBcc] = useState<boolean>(false);

    useEffect(() => {
        if (sessionId) {
            fetchMetadata();
            fetchRecentJobs();
            fetchDefaultTemplate();
        }
    }, [sessionId]);

    const fetchDefaultTemplate = async () => {
        try {
            const templates = await getMessageTemplates(sessionId);
            if (templates && Array.isArray(templates)) {
                const sampleTemplate = templates.find(t => t.templateId === 'bulk_message_sample');
                if (sampleTemplate && sampleTemplate.messageContentEn) {
                    setMessageContent(sampleTemplate.messageContentEn);
                }
            }
        } catch (error) {
            console.error('Error fetching default template:', error);
        }
    };

    const fetchMetadata = async () => {
        setIsFetchingMetadata(true);
        try {
            const response = await getBulkMessagingMetadata(sessionId);
            if (response.success) {
                setAvailableGroups(response.groups);
                
                // Default select "Bulk Message Log" if found
                const logGroup = response.groups.find(g => g.name === 'Bulk Message Log');
                if (logGroup) {
                    setSummaryGroupIds([logGroup.id]);
                }
            }
        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setIsFetchingMetadata(false);
        }
    };

    const fetchRecentJobs = async () => {
        setIsFetchingHistory(true);
        try {
            const response = await getRecentBulkJobs(sessionId, 5, user?.username);
            if (response.success) {
                setRecentJobs(response.jobs);
            }
        } catch (error) {
            console.error('Error fetching recent jobs:', error);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const operationalStrategies = [
        { id: 'NONE', label: 'None (No Operational Recipients)', roles: [] },
        { id: 'ARP_ONLY', label: 'ARP Only', roles: ['ARP'] },
        { id: 'INCHARGE_ONLY', label: 'Incharge Only', roles: ['Incharge'] },
        { id: 'ARP_INCHARGE_FALLBACK', label: 'ARP / Incharge Fallback (Priority ARP)', roles: ['ARP', 'Incharge'] },
        { id: 'INCHARGE_ARP_FALLBACK', label: 'Incharge / ARP Fallback (Priority Incharge)', roles: ['ARP', 'Incharge'] },
        { id: 'BOTH_DEDUPLICATED', label: 'Both ARP & Incharge (Deduplicated)', roles: ['ARP', 'Incharge'] },
        { id: 'UID_PRIORITY_FALLBACK', label: 'Priority Fallback (ARP > Incharge > SAC > ZAC)', roles: ['ARP', 'Incharge', 'SAC', 'ZAC'] }
    ];

    const supervisoryRoles = [
        { id: 'ZAC', label: 'ZAC' },
        { id: 'SAC', label: 'SAC' }
    ];

    const operationalRoles = [
        { id: 'ARP', label: 'ARP' },
        { id: 'Incharge', label: 'Incharge' }
    ];

    const isCcEnabled = selectedCcRoles.length > 0;

    if (!hasPermission('bulk_messaging_view')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl mb-4">
                    <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    You do not have the required permissions (`bulk_messaging_view`) to access the Bulk Messaging Workstation. 
                    Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const placeholders = [
        '{center}', '{ARPName}', '{ARPMobile}', 
        '{InchargeName}', '{InchargeMobile}',
        '{Zone}', '{ZACName}', '{ZACMobile}',
        '{SubZone}', '{SACName}', '{SACMobile}',
        '{username}', '{UID}', '{Message}' 
    ];

    const editorRef = useRef<WysiwygEditorRef>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (data.length === 0) {
                    toast('The uploaded file is empty.', 'error');
                    return;
                }

                const headers = data[0].map(h => String(h).toLowerCase().trim());
                const uidIdx = headers.indexOf('uid');
                const messageIdx = headers.indexOf('message');

                if (uidIdx === -1) {
                    toast('No "UID" column found in the file.', 'error');
                    return;
                }

                const mappedData: BulkRowData[] = data.slice(1).map(row => {
                    if (!row[uidIdx]) return null;
                    return {
                        uid: String(row[uidIdx]).trim(),
                        message: messageIdx !== -1 && row[messageIdx] ? String(row[messageIdx]).trim() : ''
                    };
                }).filter((item): item is BulkRowData => item !== null);

                if (mappedData.length === 0) {
                    toast('No valid UID data found in the file.', 'error');
                } else {
                    setFileData(mappedData);
                    toast(`Loaded ${mappedData.length} records from ${file.name}`, 'success');
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                toast('Failed to parse file. Ensure it is a valid Excel or CSV.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    const toggleToRole = (roleId: string) => {
        setSelectedToRoles(prev => 
            prev.includes(roleId) 
                ? prev.filter(r => r !== roleId) 
                : [...prev, roleId]
        );
    };

    const toggleCcRole = (roleId: string) => {
        setSelectedCcRoles(prev => 
            prev.includes(roleId) 
                ? prev.filter(r => r !== roleId) 
                : [...prev, roleId]
        );
    };

    const handleProcess = async (previewOnly: boolean = false) => {
        // Strip HTML tags and common empty entities to check if message is truly empty
        // We also handle potential hidden characters and multiple types of spaces
        const strippedContent = messageContent
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces with normal spaces
            .replace(/\u00A0/g, ' ') // Replace actual non-breaking space character
            .replace(/\s/g, '')      // Remove all whitespace
            .trim();

        console.log('[BulkMessaging] handleProcess - messageContent:', JSON.stringify(messageContent));
        console.log('[BulkMessaging] handleProcess - strippedContent:', JSON.stringify(strippedContent));

        if (!messageContent || strippedContent === '') {
            toast('Message template is empty. Please compose a message before previewing or sending.', 'error');
            return;
        }
        if (fileData.length === 0) {
            toast('Please upload a file with UID data', 'error');
            return;
        }
        if (!previewOnly && (!jobName || jobName.trim() === '')) {
            toast('Please enter a Job Name', 'error');
            return;
        }
        if (!sessionId) {
            toast('Session not found. Please re-login.', 'error');
            return;
        }

        // Confirmation Logic
        const noRecipients = selectedToRoles.length === 0 && selectedCcRoles.length === 0;
        const noSummaryGroups = !summaryGroupIds || summaryGroupIds.length === 0;

        if (!showConfirmModal) {
            let msg = "";
            if (noRecipients && noSummaryGroups) {
                msg = "Warning: No recipient roles (TO/CC) and no summary groups are selected. This job will process UIDs but send NO messages. Continue?";
            } else if (noRecipients) {
                msg = "No recipient roles (TO/CC) selected. Only summary messages will be sent to the selected groups. Continue?";
            } else if (noSummaryGroups && !previewOnly) {
                msg = "No summary groups selected. No final report will be sent to Telegram groups. Continue?";
            } else {
                msg = previewOnly 
                    ? "Are you sure you want to preview recipients for this job?" 
                    : "Are you sure you want to start this bulk messaging job?";
            }
            
            setConfirmMessage(msg);
            setConfirmAction({ previewOnly });
            setShowConfirmModal(true);
            return;
        }

        setShowConfirmModal(false);
        setIsProcessing(true);
        if (!previewOnly) setResults(null);
        
        try {
            if (previewOnly) {
                // Keep current logic for preview as it's fast and doesn't write to sheets
                const jobId = `preview_${Date.now()}`;
                const CHUNK_SIZE = 40; 
                const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
                const allResults: BulkMessageResult[] = [];
                const CONCURRENCY_LIMIT = 2;
                const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
                let completedChunks = 0;

                const processChunk = async (i: number) => {
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, fileData.length);
                    const chunk = fileData.slice(start, end);
                    
                    const response = await processBulkMessageRequest({
                        sessionId, 
                        jobId,
                        jobName: "Preview",
                        bulkData: chunk, 
                        messageContent, 
                        selectedToRoles, 
                        selectedCcRoles, 
                        deliveryStrategy,
                        summaryGroupIds,
                        ccPrefixTemplate,
                        includeOriginalInCc,
                        summaryPrefixTemplate,
                        includeZoneSummary,
                        includeSubZoneSummary,
                        includeBcc,
                        previewOnly: true,
                        isLastChunk: i === totalChunks - 1,
                        totalRecords: fileData.length
                    });

                    if (response.success) {
                        allResults.push(...(response.results || []));
                        completedChunks++;
                        const progress = Math.round((completedChunks / totalChunks) * 100);
                        toast(`Previewing: ${progress}%`, 'info');
                    } else {
                        throw new Error(response.error || `Failed at batch ${i + 1}`);
                    }
                };

                for (let i = 0; i < chunkIndices.length; i += CONCURRENCY_LIMIT) {
                    const batch = chunkIndices.slice(i, i + CONCURRENCY_LIMIT);
                    await Promise.all(batch.map(idx => processChunk(idx)));
                }

                allResults.sort((a, b) => a.uid.localeCompare(b.uid));
                setResults(allResults);
                setIsPreviewMode(true);
                toast(`Preview generated for ${allResults.length} potential recipients`, 'success');
            } else {
                // Use the new Background Batcher for actual sending
                const response = await initiateBulkJob({
                    sessionId, 
                    jobName: jobName,
                    bulkData: fileData, 
                    messageContent, 
                    selectedToRoles, 
                    selectedCcRoles, 
                    deliveryStrategy,
                    summaryGroupIds,
                    ccPrefixTemplate,
                    includeOriginalInCc,
                    summaryPrefixTemplate,
                    includeZoneSummary,
                    includeSubZoneSummary,
                    includeBcc
                });

                if (response.success) {
                    setIsPreviewMode(false);
                    setJobName('');
                    toast(response.message || 'Job initiated successfully. You can close this tab.', 'success');
                    setResults([]); // Clear results to show success state
                    fetchRecentJobs();
                } else {
                    throw new Error(response.error || 'Failed to initiate bulk job');
                }
            }
        } catch (error: any) {
            console.error('Error processing bulk messages:', error);
            toast(error.message || 'An error occurred during processing', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getSummaryStats = () => {
        if (!results) return null;
        
        const zoneStats: Record<string, { s: number; f: number }> = {};
        const subZoneStats: Record<string, { s: number; f: number }> = {};
        let totalSuccess = 0;
        let totalFailed = 0;
        const uniqueUids = new Set<string>();

        results.forEach(res => {
            const isCc = /\(CC\)/i.test(res.recipient || '');
            if (isCc) return; // Skip CCs for main counts to match backend primary summary

            const zone = res.zone || 'Unknown';
            const sz = res.subZone || 'Unknown';
            const isSuccess = res.status === 'READY' || res.status === 'QUEUED' || res.status === 'SENT';

            if (res.uid) uniqueUids.add(String(res.uid));

            if (isSuccess) totalSuccess++;
            else totalFailed++;

            if (!zoneStats[zone]) zoneStats[zone] = { s: 0, f: 0 };
            if (isSuccess) zoneStats[zone].s++;
            else zoneStats[zone].f++;

            if (!subZoneStats[sz]) subZoneStats[sz] = { s: 0, f: 0 };
            if (isSuccess) subZoneStats[sz].s++;
            else subZoneStats[sz].f++;
        });

        return { 
            totalSuccess,
            totalFailed,
            totalUids: uniqueUids.size,
            zones: Object.entries(zoneStats).sort((a, b) => a[0].localeCompare(b[0])), 
            subZones: Object.entries(subZoneStats).sort((a, b) => a[0].localeCompare(b[0])) 
        };
    };

    const summaryStats = getSummaryStats();

    const handleStrategyChange = (strategyId: BulkDeliveryStrategy) => {
        setDeliveryStrategy(strategyId);
        const strategy = operationalStrategies.find(s => s.id === strategyId);
        if (strategy) {
            if (strategyId === 'UID_PRIORITY_FALLBACK') {
                setSelectedToRoles(['ARP', 'Incharge', 'SAC', 'ZAC']);
            } else if (strategyId === 'NONE') {
                setSelectedToRoles([]);
            } else {
                // Keep supervisory roles (SAC/ZAC), update operational roles (ARP/Incharge)
                setSelectedToRoles(prev => {
                    const nonOperational = prev.filter(r => !['ARP', 'Incharge'].includes(r));
                    return [...new Set([...nonOperational, ...strategy.roles])];
                });
            }
        }
    };

    const toggleSummaryGroup = (groupId: string) => {
        setSummaryGroupIds(prev => 
            prev.includes(groupId) 
                ? prev.filter(id => id !== groupId) 
                : [...prev, groupId]
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto text-[var(--foreground)]">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Bulk Messaging Workstation</h1>
                <p className="text-[var(--foreground-muted)]">Upload an Excel or CSV file with UIDs and Message to send automated Telegram notifications.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Step 1: Compose Message & Select Roles */}
                <div className="bg-[var(--card-background)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                    <div className="flex flex-col gap-6 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--badge-primary-background)] text-[var(--badge-primary-foreground)] flex items-center justify-center font-bold">1</div>
                            <h2 className="font-semibold text-[var(--foreground)]">Compose Message</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: TO & CC */}
                            <div className="space-y-6">
                                {/* TO Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">TO: Recipients</span>
                                        {selectedToRoles.length > 0 && (
                                            <Badge variant="primary">
                                                {selectedToRoles.length} Selected
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Operational Group */}
                                    <div className="bg-[var(--card-inset-background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase">Operational Recipients</span>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">Delivery Strategy & Role Selection</label>
                                            <select 
                                                value={deliveryStrategy}
                                                onChange={(e) => handleStrategyChange(e.target.value as BulkDeliveryStrategy)}
                                                className="w-full p-2 bg-[var(--card-background)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-color)] outline-none text-[var(--foreground)]"
                                            >
                                                {operationalStrategies.map(s => (
                                                    <option key={s.id} value={s.id}>{s.label}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-[var(--foreground-muted)] italic">
                                                This selection determines which operational roles (ARP/Incharge) receive the message and the fallback logic.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CC Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">CC: Recipients</span>
                                        {selectedCcRoles.length > 0 && (
                                            <Badge variant="secondary">
                                                {selectedCcRoles.length} Selected
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 bg-[var(--card-inset-background)] p-4 rounded-lg border border-[var(--border)]">
                                        {supervisoryRoles.map(role => (
                                            <div key={role.id} className="flex items-center gap-2">
                                                <Checkbox 
                                                    id={`cc-role-${role.id}`}
                                                    checked={selectedCcRoles.includes(role.id)}
                                                    onChange={() => toggleCcRole(role.id)}
                                                />
                                                <label htmlFor={`cc-role-${role.id}`} className="text-sm font-medium text-[var(--foreground-muted)] cursor-pointer select-none">
                                                    {role.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* CC Formatting Box */}
                                    <div className="bg-[var(--card-inset-background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                id="include-bcc-group"
                                                checked={includeBcc}
                                                onChange={() => setIncludeBcc(!includeBcc)}
                                            />
                                            <label htmlFor="include-bcc-group" className="text-sm font-bold text-[var(--foreground)] cursor-pointer select-none uppercase tracking-wider">
                                                Enable Template BCC (Audit Group)
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-[var(--foreground-muted)] italic">
                                            If checked, a copy of each message will be sent to the <b>auditGroupId</b> defined in the template master.
                                        </p>

                                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]">
                                            <label className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">CC Prefix Template</label>
                                            <textarea 
                                                value={ccPrefixTemplate}
                                                onChange={(e) => setCcPrefixTemplate(e.target.value)}
                                                className="w-full p-2 bg-[var(--card-background)] border border-[var(--border)] rounded-lg text-[11px] focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[60px] text-[var(--foreground)]"
                                                placeholder="Enter CC prefix template..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                id="include-original-in-cc"
                                                checked={includeOriginalInCc}
                                                onChange={() => setIncludeOriginalInCc(!includeOriginalInCc)}
                                            />
                                            <label htmlFor="include-original-in-cc" className="text-xs font-medium text-[var(--foreground-muted)] cursor-pointer select-none">
                                                Include Original Message
                                            </label>
                                        </div>
                                        <div className="bg-[var(--badge-primary-background)] p-3 rounded-lg border border-[var(--border)]">
                                            <h4 className="text-[10px] font-bold text-[var(--badge-primary-foreground)] mb-1 uppercase tracking-wider">CC Message Preview:</h4>
                                            <div className="text-[10px] text-[var(--badge-primary-foreground)] font-mono italic whitespace-pre-wrap leading-tight">
                                                {ccPrefixTemplate.replace('{ARPName}', 'John Doe').replace('{InchargeName}', 'Jane Smith')}
                                                {includeOriginalInCc && (
                                                    <>
                                                        {"\n\n"}[Original Message Content]
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[var(--foreground-muted)] italic">
                                            Note: Only one CC message will be sent per UID, regardless of the number of recipients in the TO field.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Summary */}
                            <div className="space-y-4">
                                {/* Summary Groups */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Summary Recipient Groups</span>
                                    {summaryGroupIds.length > 0 && (
                                        <Badge variant="success">
                                            {summaryGroupIds.length} Groups
                                        </Badge>
                                    )}
                                </div>
                                
                                <div className="bg-[var(--card-inset-background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2">
                                        {isFetchingMetadata ? (
                                            <div className="flex items-center justify-center py-4 gap-2 text-[var(--foreground-muted)]">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Loading Groups...</span>
                                            </div>
                                        ) : availableGroups.length > 0 ? (
                                            availableGroups.map(group => (
                                                <div key={group.id} className="flex items-center gap-2">
                                                    <Checkbox 
                                                        id={`summary-group-${group.id}`}
                                                        checked={summaryGroupIds.includes(group.id)}
                                                        onChange={() => toggleSummaryGroup(group.id)}
                                                    />
                                                    <label htmlFor={`summary-group-${group.id}`} className="text-[11px] font-medium text-[var(--foreground-muted)] cursor-pointer select-none truncate">
                                                        {group.name}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-[var(--foreground-muted)] italic">No groups found in masters.</p>
                                        )}
                                    </div>
                                    
                                    {/* Summary Customization */}
                                    <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">Summary Prefix Template</label>
                                            <textarea 
                                                value={summaryPrefixTemplate}
                                                onChange={(e) => setSummaryPrefixTemplate(e.target.value)}
                                                className="w-full p-2 bg-[var(--card-background)] border border-[var(--border)] rounded-lg text-[11px] focus:ring-2 focus:ring-[var(--primary-color)] outline-none min-h-[60px] text-[var(--foreground)]"
                                                placeholder="Enter summary prefix..."
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <div className="flex items-center gap-2">
                                                <Checkbox 
                                                    id="include-zone-summary"
                                                    checked={includeZoneSummary}
                                                    onChange={() => setIncludeZoneSummary(!includeZoneSummary)}
                                                />
                                                <label htmlFor="include-zone-summary" className="text-[10px] font-medium text-[var(--foreground-muted)] cursor-pointer select-none">
                                                    Add Zone Summary
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox 
                                                    id="include-subzone-summary"
                                                    checked={includeSubZoneSummary}
                                                    onChange={() => setIncludeSubZoneSummary(!includeSubZoneSummary)}
                                                />
                                                <label htmlFor="include-subzone-summary" className="text-[10px] font-medium text-[var(--foreground-muted)] cursor-pointer select-none">
                                                    Add Sub Zone Summary
                                                </label>
                                            </div>
                                        </div>
                                        
                                        {/* Summary Sample Preview */}
                                        <div className="bg-[var(--badge-success-background)] p-3 rounded-lg border border-[var(--border)]">
                                            <h4 className="text-[10px] font-bold text-[var(--badge-success-foreground)] mb-1 uppercase tracking-wider">
                                                {results ? 'Actual Summary Preview (Based on Results):' : 'Sample Summary Preview:'}
                                            </h4>
                                            <div className="text-[10px] text-[var(--badge-success-foreground)] font-mono whitespace-pre-wrap leading-tight">
                                                {summaryPrefixTemplate
                                                    .replace('{JobName}', jobName || 'My Job')
                                                    .replace('{username}', user?.username || 'Admin')
                                                    .replace('{TotalUIDs}', summaryStats ? summaryStats.totalUids.toString() : fileData.length.toString())
                                                    .replace('{Timestamp}', new Date().toLocaleString())}
                                                {"\n\n"}
                                                📊 *Bulk Message Summary*{"\n\n"}
                                                *Job ID:* {results ? 'JOB-12345' : 'PENDING'}{"\n"}
                                                *Status:* {results ? 'COMPLETED' : 'QUEUED'}{"\n\n"}
                                                *Total:* {summaryStats ? (summaryStats.totalSuccess + summaryStats.totalFailed) : fileData.length}{"\n"}
                                                *Success:* {summaryStats ? summaryStats.totalSuccess : (fileData.length > 0 ? fileData.length - 2 : 18)}{"\n"}
                                                *Failed:* {summaryStats ? summaryStats.totalFailed : (fileData.length > 0 ? 2 : 2)}{"\n\n"}

                                                {includeZoneSummary && (
                                                    <>
                                                        *Zone Summary:*{"\n"}
                                                        {summaryStats ? (
                                                            summaryStats.zones.map(([zone, stats]) => (
                                                                <div key={zone}>📍 *{zone}*: ✅ {stats.s}{stats.f > 0 ? ` | ❌ ${stats.f}` : ''}</div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                📍 *Zone A*: ✅ 10 | ❌ 2{"\n"}
                                                                📍 *Zone B*: ✅ 8{"\n\n"}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {includeSubZoneSummary && (
                                                    <>
                                                        {"\n"}*Sub-Zone Summary:*{"\n"}
                                                        {summaryStats ? (
                                                            summaryStats.subZones.map(([sz, stats]) => (
                                                                <div key={sz}>🔹 {sz}: ✅ {stats.s}{stats.f > 0 ? ` | ❌ ${stats.f}` : ''}</div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                🔹 SubZone 1: ✅ 5 | ❌ 1{"\n"}
                                                                🔹 SubZone 2: ✅ 5
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <WysiwygEditor 
                            ref={editorRef}
                            value={messageContent}
                            onChange={setMessageContent}
                            className="min-h-[200px]"
                        />
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-2">Available Placeholders (Click to insert)</p>
                        <div className="flex flex-wrap gap-2">
                            {placeholders.map(p => (
                                <Badge 
                                    key={p} 
                                    variant="secondary" 
                                    className="cursor-pointer hover:bg-[var(--list-item-hover-background)] hover:text-[var(--primary-color)] transition-colors py-1 px-2 font-mono text-[10px] border border-[var(--border)]"
                                    onClick={() => {
                                        editorRef.current?.insertText(p);
                                    }}
                                >
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 2: Upload File */}
                <div className="bg-[var(--card-background)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--badge-primary-background)] text-[var(--badge-primary-foreground)] flex items-center justify-center font-bold">2</div>
                        <h2 className="font-semibold text-[var(--foreground)]">Upload Data</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--card-inset-background)] transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-[var(--foreground-muted)] mb-2" />
                                <p className="text-sm text-[var(--foreground-muted)]">Click to upload or drag and drop</p>
                                <p className="text-xs text-[var(--foreground-muted)]">Excel (.xlsx, .xls) or CSV with UID and Message columns</p>
                            </div>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                        </label>
                        <div className="bg-[var(--badge-primary-background)] p-4 rounded-lg border border-[var(--border)]">
                            <h4 className="text-sm font-bold text-[var(--badge-primary-foreground)] mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Excel Requirements
                            </h4>
                            <ul className="text-xs text-[var(--badge-primary-foreground)] space-y-1 list-disc pl-4">
                                <li><strong>UID:</strong> Unique identifier for the center (Required)</li>
                                <li><strong>Message:</strong> Custom message for this specific UID (Optional, used with {'{Message}'} placeholder)</li>
                            </ul>
                        </div>
                    </div>
                    {fileData.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--badge-success-foreground)] font-medium">
                            <FileText className="w-4 h-4" />
                            <span>{fileData.length} records ready</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 3: Finalize & Send */}
            <div className="bg-[var(--card-background)] p-6 rounded-xl border border-[var(--border)] shadow-sm mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--badge-primary-background)] text-[var(--badge-primary-foreground)] flex items-center justify-center font-bold">3</div>
                        <h2 className="font-semibold text-[var(--foreground)]">Finalize & Send</h2>
                    </div>
                    <div className="bg-[var(--badge-success-background)] px-3 py-1.5 rounded-lg border border-[var(--border)] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--badge-success-foreground)]" />
                        <span className="text-[11px] font-medium text-[var(--badge-success-foreground)]">Automatic ZAC/SAC Summary Enabled</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {!isPreviewMode ? (
                        <button 
                            onClick={() => handleProcess(true)}
                            disabled={isProcessing || fileData.length === 0}
                            className="flex-1 bg-[var(--primary-color)] text-[var(--primary-foreground)] py-3 px-6 rounded-lg font-semibold hover:bg-[var(--primary-color-hover)] transition-colors disabled:bg-[var(--input-disabled-background)] disabled:text-[var(--input-disabled-foreground)] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileText className="w-5 h-5" />
                            )}
                            Preview Recipients
                        </button>
                    ) : (
                        <>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase">Job Name (Mandatory)</label>
                                <input 
                                    type="text"
                                    value={jobName}
                                    onChange={(e) => setJobName(e.target.value.substring(0, 30))}
                                    placeholder="Enter a descriptive name for this job..."
                                    className="w-full p-3 bg-[var(--card-background)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-color)] outline-none text-[var(--foreground)]"
                                    maxLength={30}
                                />
                                <p className="text-[10px] text-[var(--foreground-muted)] italic">Max 30 characters. This name will appear in your history.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsPreviewMode(false);
                                    setResults(null);
                                }}
                                disabled={isProcessing}
                                className="bg-[var(--secondary-background)] text-[var(--secondary-foreground)] py-3 px-6 rounded-lg font-semibold hover:bg-[var(--secondary-hover-background)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-[var(--border)]"
                            >
                                Back to Edit
                            </button>
                            <button 
                                onClick={() => handleProcess(false)}
                                disabled={isProcessing || !jobName.trim()}
                                className="bg-[var(--badge-success-foreground)] text-[var(--badge-success-background)] py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:bg-[var(--input-disabled-background)] disabled:text-[var(--input-disabled-foreground)] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                Confirm & Send Bulk Messages
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-4 p-4 bg-[var(--card-inset-background)] rounded-lg border border-[var(--border)]">
                    <h4 className="text-xs font-bold text-[var(--foreground-muted)] uppercase mb-2">Summary Reporting Logic</h4>
                    <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                        Once processing is complete, a consolidated summary will be sent to the ZAC/SAC Telegram group. 
                        This includes <strong>Zone-wise</strong> and <strong>Sub-Zone-wise</strong> success/failure counts. 
                        No individual messages are sent to ZAC/SAC unless selected in the TO/CC fields above.
                    </p>
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className="bg-[var(--card-background)] p-6 rounded-xl border border-[var(--border)] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                            {isPreviewMode ? (
                                <>
                                    <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                                    Preview: Potential Recipients
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-[var(--badge-success-foreground)]" />
                                    Processing Results
                                </>
                            )}
                        </h2>
                        <div className="flex gap-2">
                            <Badge variant="success">
                                {results.filter(r => r.status === 'QUEUED' || r.status === 'READY').length} Ready
                            </Badge>
                            <Badge variant="danger">
                                {results.filter(r => r.status === 'FAILED').length} Failed
                            </Badge>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--card-inset-background)] text-[var(--foreground-muted)] uppercase text-[10px] font-bold">
                                <tr>
                                    <th className="px-4 py-3">UID</th>
                                    <th className="px-4 py-3">Recipient</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Actual Message</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-[var(--foreground-muted)] italic">
                                            No individual recipients found for the selected roles. 
                                            {summaryGroupIds && summaryGroupIds.length > 0 && !isPreviewMode && (
                                                <div className="mt-2 text-[10px] text-[var(--primary-color)]">
                                                    A summary will still be sent to the selected Telegram groups.
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-[var(--list-item-hover-background)] transition-colors">
                                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--foreground-muted)]">{res.uid}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[var(--foreground)]">{res.recipient}</div>
                                            <div className="text-[10px] text-[var(--foreground-muted)] font-mono">{res.mobile || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{res.role}</td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="text-[10px] text-[var(--foreground-muted)] max-w-[200px] line-clamp-2 italic bg-[var(--card-inset-background)] p-1.5 rounded border border-[var(--border)]"
                                                dangerouslySetInnerHTML={{ __html: res.message || '' }}
                                            />
                                            {res.message && res.message.length > 50 && (
                                                <button 
                                                    onClick={() => setSelectedMessageForModal(res.message || null)}
                                                    className="text-[10px] text-[var(--primary-color)] hover:underline mt-1 font-medium"
                                                >
                                                    View Full Message
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge 
                                                variant={res.status === 'QUEUED' || res.status === 'READY' ? 'success' : 'danger'}
                                            >
                                                {res.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-[var(--foreground-muted)] italic">
                                            {res.errorDetail || (res.status === 'READY' ? 'Valid Telegram ID found' : 'Queued for delivery')}
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Jobs History Section */}
            <div className="bg-[var(--card-background)] p-6 rounded-xl border border-[var(--border)] shadow-sm mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-[var(--foreground-muted)]" />
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Jobs History</h2>
                    </div>
                    <button 
                        onClick={fetchRecentJobs}
                        disabled={isFetchingHistory}
                        className="flex items-center gap-2 text-xs font-bold text-[var(--primary-color)] uppercase hover:opacity-80 transition-colors disabled:opacity-50"
                    >
                        {isFetchingHistory ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                        Refresh History
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[var(--card-inset-background)] text-[var(--foreground-muted)] uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-4 py-3">Job Name / Time</th>
                                <th className="px-4 py-3">Stats</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {recentJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--foreground-muted)] italic">
                                        No recent jobs found
                                    </td>
                                </tr>
                            ) : (
                                recentJobs.map((job, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--list-item-hover-background)] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-sm text-[var(--foreground)] mb-0.5">{job.jobName || job.jobId}</div>
                                            <div className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(job.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold">UID Total</span>
                                                    <span className="text-xs font-bold text-[var(--foreground)]">{job.totalUids || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--primary-color)] uppercase font-bold opacity-80">Msg Total</span>
                                                    <span className="text-xs font-bold text-[var(--primary-color)]">{job.totalQueued || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--badge-success-foreground)] uppercase font-bold">Sent</span>
                                                    <span className="text-xs font-bold text-[var(--badge-success-foreground)]">{job.totalSent || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--badge-danger-foreground)] uppercase font-bold">Failed</span>
                                                    <span className="text-xs font-bold text-[var(--badge-danger-foreground)]">{job.totalFailed || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge 
                                                variant={job.status === 'COMPLETED' ? 'success' : 'primary'}
                                                className={job.status !== 'COMPLETED' ? 'animate-pulse' : ''}
                                            >
                                                {job.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.summarySentAt ? (
                                                <div className="flex items-center gap-1.5 text-[var(--badge-success-foreground)]">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase">Sent</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase">Pending</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                <div className="mt-4 p-3 bg-[var(--card-inset-background)] rounded-lg border border-[var(--border)] space-y-2">
                    <p className="text-[11px] text-[var(--foreground-muted)] italic">
                        Note: Showing last 5 jobs initiated by you ({user?.username || 'Current User'})
                    </p>
                    <div className="pt-2 border-t border-[var(--border)]">
                        <h4 className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase mb-1">Display Logic Explanation:</h4>
                        <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
                            The history table displays the <strong>Job Name</strong> (or ID if name is missing). 
                            <strong>UID Total</strong> represents the number of unique identifiers processed. 
                            <strong>Msg Total</strong> shows the total number of messages queued for delivery (including TO and CC recipients).
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="bg-[var(--card-background)] rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-[var(--border)] overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-[var(--badge-primary-background)] text-[var(--badge-primary-foreground)] flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] text-center mb-2">Confirm Action</h3>
                        <p className="text-sm text-[var(--foreground-muted)] text-center leading-relaxed">
                            {confirmMessage}
                        </p>
                    </div>
                    <div className="p-4 bg-[var(--card-inset-background)] border-t border-[var(--border)] flex gap-3">
                        <button 
                            onClick={() => {
                                setShowConfirmModal(false);
                                setConfirmAction(null);
                            }}
                            className="flex-1 px-4 py-2.5 bg-[var(--secondary-background)] text-[var(--secondary-foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--secondary-hover-background)] transition-colors border border-[var(--border)]"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (confirmAction) {
                                    handleProcess(confirmAction.previewOnly);
                                }
                            }}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2.5 bg-[var(--primary-color)] text-[var(--primary-foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--primary-color-hover)] transition-colors disabled:opacity-50"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Full Message Modal */}
        {selectedMessageForModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-[var(--card-background)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border)]">
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-inset-background)]">
                        <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[var(--primary-color)]" />
                            Full Message Content
                        </h3>
                        <button 
                            onClick={() => setSelectedMessageForModal(null)}
                            className="p-1.5 hover:bg-[var(--list-item-hover-background)] rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto bg-[var(--card-background)]">
                        <div 
                            className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: selectedMessageForModal }}
                        />
                    </div>
                    <div className="p-4 border-t border-[var(--border)] flex justify-end bg-[var(--card-inset-background)]">
                        <button 
                            onClick={() => setSelectedMessageForModal(null)}
                            className="px-4 py-2 bg-[var(--secondary-background)] text-[var(--secondary-foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--secondary-hover-background)] transition-colors border border-[var(--border)]"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default BulkMessaging;
