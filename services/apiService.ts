
import { User, Session, Setting, MessageTemplate, Permission, SuperMasterRecord, NotificationRecipient, MasterDataItem, SearchResults, AppModuleConfig, KeyMetrics, ActivityLog, PermissionDefinition, Person, RoomDashboardData, Allotment, Reservation, Flat, Room, Bed, AuditRecord, AIResult, LogicOutcome, BatchResult, PhysioSession, PhysioQueueItem, PhysioRegisterData, PhysioAnalyticsData, VitalsRecord, VitalsQueueItem, VitalsReportData, PermissionMatrixData, PermissionChange, VitalsAnalyticsResponse, InventoryItem, RoomStandard, InventoryAuditEvent, InventoryAuditRecord, BulkMessageResponse, BulkRowData, BulkDeliveryStrategy, BulkMessagingParams } from '../types';

// ============================================================================
// API CONFIGURATION
// ============================================================================

// 1. PRODUCTION URL (Live App)
const PROD_URL = (import.meta.env.VITE_GAS_PROD_URL || '').trim();

// 2. STAGING URL (Development App)
const STAGING_URL = (import.meta.env.VITE_GAS_STAGING_URL || '').trim(); 

const getBackendUrl = () => {
    const hostname = window.location.hostname;
    
    // AI Studio Preview environments should use STAGING URL
    if (hostname.startsWith('ais-dev-') || hostname.startsWith('ais-pre-')) {
        console.log(`[API] Detected AI Studio Preview Environment (${hostname}). Using STAGING URL.`);
        return STAGING_URL;
    }

    if (hostname.endsWith('run.app') || hostname.endsWith('firebaseapp.com') || hostname.endsWith('web.app')) {
        console.log(`[API] Detected Production Environment (${hostname}). Using PROD URL.`);
        return PROD_URL;
    }
    console.log(`[API] Detected Development Environment (${hostname}). Using STAGING URL.`);
    return STAGING_URL;
};

const GAS_WEB_APP_URL = getBackendUrl();

if (!GAS_WEB_APP_URL) {
    console.warn('[API] Warning: Backend URL is not configured. API calls will fail. Please set VITE_GAS_STAGING_URL or VITE_GAS_PROD_URL in your environment variables.');
}

// ============================================================================

const READ_ONLY_ACTIONS = new Set([
    'getPublicBranding',
    'getUsers',
    'getAllUsers',
    'getSettings',
    'getMessageTemplates',
    'getUserPermissions',
    'getPermissionsForUsers',
    'getAllUserPermissionsMatrix',
    'getPermissionDefinitions',
    'getSuperMasterRecord',
    'getMasterData',
    'getAllMasterDataItems',
    'getNotificationRecipients',
    'globalSearch',
    'getAppConfiguration',
    'getAllAppModules',
    'getKeyMetrics',
    'getRecentActivity',
    'findUserPage',
    'validateSmrUniqueness',
    'getPeople',
    'getAllPeople',
    'getUnassignedPeople',
    'findPersonPage',
    'getRoomDashboardData',
    'getFlats',
    'getRooms',
    'getBeds',
    'getAuditWorklist',
    'getBatchCandidates',
    'getAIACConfig',
    'getReportData',
    'getAccountSubmissionSettings',
    'getAccountSubmissionStats',
    'getAccountSubmissionRecords',
    'getAllAccountSubmissions',
    'getVouchingStatsSettings',
    'getVouchingOwnershipMaps',
    'getAuditSettings',
    'getAuditStatusSettings',
    'getPhysioWorklist',
    'getPhysioLastSession',
    'getPhysioRegister',
    'getPhysioAnalytics',
    'getVitalsWorklist',
    'getVitalsLastSession',
    'getVitalsReports',
    'getVitalsAnalytics',
    'getPatientVitalsHistory',
    'getInventoryItems',
    'getRoomStandards',
    'getRoomExpectedInventory',
    'getAuditEvents',
    'getEventWorklist',
    'getDataSources',
    'getDataSourceSchema',
    'getSavedReports',
    'executeSavedReport',
    'getPendingUidReportData',
    'getRejectedUidReportData',
    'getSubmissionSummaryReport',
    'getAuditReadinessReportData',
    'getMaintenanceStats',
    'getBulkMessagingMetadata',
    'getRecentBulkJobs',
    'getRecentAIACJobs',
    'getAIACJobStatus',
    'getTelegramData',
    'getUserPasskeys'
]);

// ============================================================================
// MOCK FALLBACK HANDLER FOR PROTOTYPE / SIMULATOR SESSIONS
// ============================================================================
function getMockResponse(action: string, payload: any): any {
    switch (action) {
        case 'getSettings':
            return [
                { settingName: 'primaryColor', settingValue: '#3b82f6', description: 'Primary Color' },
                { settingName: 'appName', settingValue: 'BK Audit Portal', description: 'Application Name' }
            ];
        case 'getKeyMetrics':
            return {
                totalUsers: 24,
                totalAudits: 142,
                pendingApprovals: 3,
                systemHealth: '99.9%'
            };
        case 'getRecentActivity':
            return [
                { id: '1', action: 'Telegram Login Simulator', user: 'Volunteer User', timestamp: new Date().toISOString() },
                { id: '2', action: 'Session Initialized', user: 'Volunteer User', timestamp: new Date().toISOString() }
            ];
        case 'getMasterData':
        case 'getAllMasterDataItems':
            return [];
        case 'getSuperMasterRecord':
            return [];
        case 'getUserPasskeys':
            return [];
        case 'getPasskeyAuthOptions':
            return {
                challenge: 'mock_challenge_' + Math.random().toString(36).substring(2),
                timeout: 60000,
                rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
                allowCredentials: []
            };
        case 'verifyPasskeyAuth':
            return {
                sessionId: 'mock-session-id-' + Math.random().toString(36).substring(2, 11),
                userId: 'U999',
                name: 'Volunteer User',
                roleLabel: 'Master Admin',
                primaryMobile: (payload && payload.mobileNumber) ? String(payload.mobileNumber) : '9876543210',
                permissions: ['SUPER_ADMIN', 'EDIT_ALL', 'VIEW_ALL'],
                expirationTimestamp: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
            };
        case 'getPasskeyRegistrationOptions':
            return {
                challenge: 'mock_challenge_' + Math.random().toString(36).substring(2),
                rp: { name: 'BK Audit Portal', id: typeof window !== 'undefined' ? window.location.hostname : 'localhost' },
                user: { id: 'U999', name: 'Volunteer User', displayName: 'Volunteer User' }
            };
        case 'verifyPasskeyRegistration':
            return { success: true };
        case 'deletePasskey':
            return { success: true };
        case 'getRoomDashboardData':
            return null;
        case 'globalSearch':
            return {};
        case 'getAllAppModules':
            return [];
        case 'getPeople':
            return [];
        case 'getMessageTemplates':
            return [];
        case 'getNotificationRecipients':
            return [];
        default:
            return { success: true };
    }
}

async function callApi<T>(action: string, payload: object = {}, sessionId: string | null = null): Promise<T> {
    if (sessionId && sessionId.startsWith('mock-session-')) {
        return Promise.resolve(getMockResponse(action, payload) as T);
    }

    if (!GAS_WEB_APP_URL) {
        console.error('[API] Execution failed: GAS_WEB_APP_URL is not defined.');
        throw new Error('Backend API URL is not configured. Please check your environment variables (VITE_GAS_STAGING_URL or VITE_GAS_PROD_URL).');
    }

    // Basic URL validation
    if (!GAS_WEB_APP_URL.startsWith('https://script.google.com/')) {
        console.error('[API] Invalid backend URL structure detected:', GAS_WEB_APP_URL);
        throw new Error(`The configured Backend URL appears invalid. It should start with https://script.google.com/. Current value: ${GAS_WEB_APP_URL.substring(0, 30)}...`);
    }

    if (!GAS_WEB_APP_URL.endsWith('/exec')) {
       console.warn('[API] Warning: Backend URL does not end with /exec. This might cause failures. URL:', GAS_WEB_APP_URL);
    }

    const isReadOnly = READ_ONLY_ACTIONS.has(action);
    const method = isReadOnly ? 'GET' : 'POST';
    
    let url = GAS_WEB_APP_URL;
    const fetchOptions: RequestInit = {
        method,
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-store',
        ...(!sessionId ? { credentials: 'omit' as const } : {})
    };

    if (isReadOnly) {
        const params = new URLSearchParams();
        if (sessionId) params.append('sessionId', sessionId);
        params.append('action', action);
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                if ((payload as any)[key] !== null && (payload as any)[key] !== undefined) {
                    params.append(key, (payload as any)[key]);
                }
            }
        }
        url += `?${params.toString()}`;
    } else {
        if (sessionId) {
            if (url.includes('?')) {
                url += `&sessionId=${sessionId}`;
            } else {
                url += `?sessionId=${sessionId}`;
            }
        }
        fetchOptions.headers = {
             'Content-Type': 'text/plain;charset=utf-8',
        };
        fetchOptions.body = JSON.stringify({ action, ...payload });
    }

    let response: Response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (fetchError: any) {
        const rawMsg = fetchError?.message || String(fetchError);
        const cleanMsg = rawMsg.length > 200 ? rawMsg.substring(0, 200) + '...' : rawMsg;
        console.warn(`[API] Network/Fetch Error (${action}):`, cleanMsg);
        
        if (rawMsg === 'Failed to fetch') {
            throw new Error(`Connection failed: The browser could not reach the backend server. Verify that the Google Apps Script is deployed as a Web App with access 'Anyone' and that VITE_GAS_URL is correct. (URL: ${GAS_WEB_APP_URL.substring(0, 30)}...)`);
        }
        
        throw fetchError;
    }

    if (!response.ok) {
        let errorText = 'An unknown API error occurred.';
        try {
            const text = await response.text();
            if (text.trim().startsWith('<')) {
                errorText = `Received HTML response (status ${response.status}) instead of JSON. The backend might require login, be blocked, or be incorrectly configured.`;
            } else {
                try {
                    const errorJson = JSON.parse(text);
                    if (errorJson && errorJson.error) {
                        errorText = errorJson.error;
                    } else {
                        errorText = text || `API request failed with status ${response.status}`;
                    }
                } catch {
                    errorText = text || `API request failed with status ${response.status}`;
                }
            }
        } catch {
            errorText = `API request failed with status ${response.status} (Could not read response body)`;
        }
        
        const truncatedLog = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
        console.warn(`[API] Server Error (${action}):`, truncatedLog);
        
        if (sessionId && (errorText.includes('Authentication failed') || errorText.includes('Invalid or expired session'))) {
             window.dispatchEvent(new Event('session-expired'));
        }
        throw new Error(errorText);
    }
    
    let text = '';
    try {
        text = await response.text();
    } catch (readError: any) {
        throw new Error(`Failed to read response body: ${readError?.message || readError}`);
    }

    let result: any;
    try {
        result = JSON.parse(text);
    } catch (jsonError: any) {
        if (text.trim().startsWith('<')) {
            throw new Error(`Received HTML response (status ${response.status}) instead of JSON. The Google Apps Script web app may be blocked, require login, or be incorrectly configured.`);
        } else {
            const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
            throw new Error(`Invalid JSON response (status ${response.status}): ${preview}`);
        }
    }

    if (result && result.error) {
        const truncatedError = result.error.length > 200 ? result.error.substring(0, 200) + '...' : result.error;
        console.warn(`[API] Logic Error (${action}):`, truncatedError);
        if (sessionId && (result.error.includes('Authentication failed') || result.error.includes('Invalid or expired session'))) {
             window.dispatchEvent(new Event('session-expired'));
        }
        throw new Error(result.error);
    }
    return result as T;
}

export const getPublicBranding = (): Promise<{ appName: string, appTagline: string, appIcon: string, appIconUrl: string, primaryColor: string }> => {
    return callApi('getPublicBranding', {}, null);
};

export const requestOtp = (mobileNumber: string): Promise<{ success: boolean }> => {
    return callApi('requestOtp', { mobileNumber });
};

export const verifyOtp = (mobileNumber: string, otp: string): Promise<Session> => {
    return callApi('verifyOtp', { mobileNumber, otp });
};

export const verifyGoogleLogin = (idToken: string): Promise<Session> => {
    return callApi('verifyGoogleLogin', { idToken });
};

export const initiateTelegramLogin = async (mobileNumber: string, appUrl: string = ''): Promise<{ success: boolean; token: string; botUsername: string }> => {
    return callApi('initiateTelegramLogin', { mobileNumber, appUrl });
};

export const verifyTelegramLoginMiniApp = (token: string, telegramId: string): Promise<{ success: boolean; message: string }> => {
    if (token.startsWith('proto_tok_')) {
        return Promise.resolve({ success: true, message: 'Verified prototype' });
    }
    return callApi('verifyTelegramLoginMiniApp', { token, telegramId });
};

export const checkTelegramLogin = (token: string): Promise<{ status: 'PENDING_VERIFICATION' | 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'MISMATCH'; session?: Session; attemptedTelegramId?: string; expectedTelegramId?: string }> => {
    if (!token || token.startsWith('proto_tok_')) {
        return Promise.resolve({ status: 'PENDING' } as any);
    }
    return callApi('checkTelegramLogin', { token });
};

export const logout = (sessionId: string): Promise<void> => {
    return callApi('logout', {}, sessionId);
};

export const getUsers = (sessionId: string, page: number, pageSize: number): Promise<{ users: User[], total: number }> => {
    return callApi('getUsers', { page, pageSize }, sessionId);
};

export const getAllUsers = (sessionId: string): Promise<User[]> => {
    return callApi('getAllUsers', {}, sessionId);
};

export const createUser = (sessionId: string, newUser: Partial<User>): Promise<User> => {
    return callApi('createUser', { newUser }, sessionId);
};

export const updateUser = (sessionId: string, updatedUser: User): Promise<User> => {
    return callApi('updateUser', { updatedUser }, sessionId);
};

export const updateMyProfile = (sessionId: string, profileData: Partial<User>): Promise<void> => {
    return callApi('updateMyProfile', { profileData }, sessionId);
};

export const deleteUser = (sessionId: string, userId: string): Promise<void> => {
    return callApi('deleteUser', { userId }, sessionId);
};

export const getSettings = (sessionId: string): Promise<Setting[]> => {
    return callApi('getSettings', {}, sessionId);
};

export const updateSettings = (sessionId: string, newSettings: Setting[]): Promise<void> => {
    return callApi('updateSettings', { newSettings }, sessionId);
};

export const getMessageTemplates = (sessionId: string): Promise<MessageTemplate[]> => {
    return callApi('getMessageTemplates', {}, sessionId);
};

export const createMessageTemplate = (sessionId: string, template: Partial<MessageTemplate>): Promise<MessageTemplate> => {
    return callApi('createMessageTemplate', { template }, sessionId);
};

export const updateMessageTemplates = (sessionId: string, newTemplates: MessageTemplate[]): Promise<void> => {
    return callApi('updateMessageTemplates', { newTemplates }, sessionId);
};

export const sendTemplatedNotification = (sessionId: string, templateId: string, data: Record<string, string>, recipientUserIds: string[], adminUser: Session, moduleName: string | null = null): Promise<void> => {
    return callApi('sendTemplatedNotification', { templateId, data, recipientUserIds, adminUser, moduleName }, sessionId);
}

export const getUserPermissions = (sessionId: string, userId: string): Promise<Permission[]> => {
    return callApi('getUserPermissions', { userId }, sessionId);
};

export const getPermissionsForUsers = (sessionId: string, userIds: string[]): Promise<Record<string, Permission[]>> => {
    return callApi('getPermissionsForUsers', { userIds: userIds.join(',') }, sessionId);
};

export const getAllUserPermissionsMatrix = (sessionId: string): Promise<PermissionMatrixData> => {
    return callApi('getAllUserPermissionsMatrix', {}, sessionId);
};

export const getPermissionDefinitions = (sessionId: string): Promise<PermissionDefinition[]> => {
    return callApi('getPermissionDefinitions', {}, sessionId);
};

export const updateUserPermissions = (sessionId: string, userId: string, permissions: Permission[]): Promise<void> => {
    return callApi('updateUserPermissions', { userId, permissions }, sessionId);
};

export const bulkUpdatePermissionsMatrix = (sessionId: string, changes: PermissionChange[]): Promise<void> => {
    return callApi('bulkUpdatePermissionsMatrix', { changes }, sessionId);
};

export const getSuperMasterRecord = (sessionId: string): Promise<SuperMasterRecord[]> => {
    return callApi('getSuperMasterRecord', {}, sessionId);
};

export const getMasterData = (sessionId: string): Promise<MasterDataItem[]> => {
    return callApi('getMasterData', {}, sessionId);
}

export const getAllMasterDataItems = (sessionId: string): Promise<MasterDataItem[]> => {
    return callApi('getAllMasterDataItems', {}, sessionId);
};

export const getNotificationRecipients = (sessionId: string): Promise<NotificationRecipient[]> => {
    return callApi('getNotificationRecipients', {}, sessionId);
};

export const updateSingleMessageTemplate = (sessionId: string, template: MessageTemplate): Promise<void> => {
    return callApi('updateSingleMessageTemplate', { template }, sessionId);
};

export const deleteMessageTemplate = (sessionId: string, templateId: string): Promise<void> => {
    return callApi('deleteMessageTemplate', { templateId }, sessionId);
};

export const toggleMessageTemplateStatus = (sessionId: string, templateId: string, isActive: boolean): Promise<void> => {
    return callApi('toggleMessageTemplateStatus', { templateId, isActive }, sessionId);
};

export const sendPreviewNotification = (sessionId: string, templateId: string): Promise<void> => {
    return callApi('sendPreviewNotification', { templateId }, sessionId);
};

export const queueManualNotification = (sessionId: string, templateId: string, recipientIds: string[]): Promise<void> => {
    return callApi('queueManualNotification', { templateId, recipientIds }, sessionId);
};

export const testTelegramGroup = (sessionId: string, groupId: string): Promise<{ success: boolean; error?: string }> => {
    return callApi('testTelegramGroup', { groupId }, sessionId);
};

export const globalSearch = (sessionId: string, searchTerm: string): Promise<SearchResults> => {
    return callApi('globalSearch', { searchTerm }, sessionId);
};

export const getAppConfiguration = (sessionId: string): Promise<{ appModules: AppModuleConfig[], permissions: Permission[] }> => {
    return callApi('getAppConfiguration', {}, sessionId);
};

export const getAllAppModules = (sessionId: string): Promise<AppModuleConfig[]> => {
    return callApi('getAllAppModules', {}, sessionId);
};

export const updateAppModules = (sessionId: string, modules: AppModuleConfig[]): Promise<{ success: boolean }> => {
    return callApi('updateAppModules', { modules }, sessionId);
};

export const getKeyMetrics = (sessionId: string): Promise<KeyMetrics> => {
    return callApi('getKeyMetrics', {}, sessionId);
};

export const getRecentActivity = (sessionId: string): Promise<ActivityLog[]> => {
    return callApi('getRecentActivity', {}, sessionId);
};

export const findUserPage = (sessionId: string, userId: string, pageSize: number): Promise<{ page: number }> => {
    return callApi('findUserPage', { userId, pageSize }, sessionId);
};

export const validateSmrUniqueness = (sessionId: string, property: 'fieldId' | 'fieldName', value: string, currentFieldId: string | null): Promise<{ isUnique: boolean; message?: string }> => {
    return callApi('validateSmrUniqueness', { property, value, currentFieldId: currentFieldId || '' }, sessionId);
};

export const createSmrField = (sessionId: string, newField: Omit<SuperMasterRecord, 'fieldId'>): Promise<SuperMasterRecord> => {
    return callApi('createSmrField', { newField }, sessionId);
};

export const updateSmrField = (sessionId: string, updatedField: SuperMasterRecord): Promise<SuperMasterRecord> => {
    return callApi('updateSmrField', { updatedField }, sessionId);
};

export const deleteSmrField = (sessionId: string, fieldId: string): Promise<{ success: boolean }> => {
    return callApi('deleteSmrField', { fieldId }, sessionId);
};

export const createMasterDataItem = (sessionId: string, newItem: Omit<MasterDataItem, 'masterId'>): Promise<MasterDataItem> => {
    return callApi('createMasterDataItem', { newItem }, sessionId);
};

export const updateMasterDataItem = (sessionId: string, updatedItem: MasterDataItem): Promise<MasterDataItem> => {
    return callApi('updateMasterDataItem', { updatedItem }, sessionId);
};

export const deleteMasterDataItem = (sessionId: string, masterId: string): Promise<{ success: boolean }> => {
    return callApi('deleteMasterDataItem', { masterId }, sessionId);
};

export const getPeople = (sessionId: string, page: number, pageSize: number): Promise<{ people: Person[], total: number }> => {
    return callApi('getPeople', { page, pageSize }, sessionId);
};

export const getAllPeople = (sessionId: string): Promise<Person[]> => {
    return callApi('getAllPeople', {}, sessionId);
};

export const getUnassignedPeople = (sessionId: string): Promise<Person[]> => {
    return callApi('getUnassignedPeople', {}, sessionId);
};

export const createPerson = (sessionId: string, newPerson: Partial<Person>): Promise<Person> => {
    return callApi('createPerson', { newPerson }, sessionId);
};

export const updatePerson = (sessionId: string, updatedPerson: Person): Promise<Person> => {
    return callApi('updatePerson', { updatedPerson }, sessionId);
};

export const deletePerson = (sessionId: string, personId: string): Promise<void> => {
    return callApi('deletePerson', { personId }, sessionId);
};

export const findPersonPage = (sessionId: string, personId: string, pageSize: number): Promise<{ page: number }> => {
    return callApi('findPersonPage', { personId, pageSize }, sessionId);
};

export const bulkUpdatePeople = (sessionId: string, personIds: string[], fieldName: string, value: any): Promise<{ success: boolean, count: number }> => {
    return callApi('bulkUpdatePeople', { personIds, fieldName, value }, sessionId);
};

export const getRoomDashboardData = (sessionId: string, buildingId: string | null = null): Promise<RoomDashboardData> => {
    return callApi('getRoomDashboardData', { buildingId }, sessionId);
};

export const createAllotment = (sessionId: string, allotmentData: Partial<Allotment>): Promise<void> => {
    return callApi('createAllotment', { allotmentData }, sessionId);
};

export const vacateAllotment = (sessionId: string, allotmentId: string, vacateDate: string): Promise<void> => {
    return callApi('vacateAllotment', { allotmentId, vacateDate }, sessionId);
};

export const createReservation = (sessionId: string, reservationData: Partial<Reservation>): Promise<void> => {
    return callApi('createReservation', { reservationData }, sessionId);
};

export const cancelReservation = (sessionId: string, reservationId: string): Promise<void> => {
    return callApi('cancelReservation', { reservationId }, sessionId);
};

export const getFlats = (sessionId: string): Promise<Flat[]> => {
    return callApi('getFlats', {}, sessionId);
};

export const createFlat = (sessionId: string, flatData: Partial<Flat>): Promise<Flat> => {
    return callApi('createFlat', { flatData }, sessionId);
};

export const updateFlat = (sessionId: string, flatData: Flat): Promise<Flat> => {
    return callApi('updateFlat', { flatData }, sessionId);
};

export const deleteFlat = (sessionId: string, flatId: string): Promise<void> => {
    return callApi('deleteFlat', { flatId }, sessionId);
};

export const getRooms = (sessionId: string): Promise<Room[]> => {
    return callApi('getRooms', {}, sessionId);
};

export const createRoom = (sessionId: string, roomData: Partial<Room>): Promise<Room> => {
    return callApi('createRoom', { roomData }, sessionId);
};

export const updateRoom = (sessionId: string, roomData: Room): Promise<Room> => {
    return callApi('updateRoom', { roomData }, sessionId);
};

export const deleteRoom = (sessionId: string, roomId: string): Promise<void> => {
    return callApi('deleteRoom', { roomId }, sessionId);
};

export const getBeds = (sessionId: string): Promise<Bed[]> => {
    return callApi('getBeds', {}, sessionId);
};

export const createBed = (sessionId: string, bedData: Partial<Bed>): Promise<Bed> => {
    return callApi('createBed', { bedData }, sessionId);
};

export const updateBed = (sessionId: string, bedData: Bed): Promise<Bed> => {
    return callApi('updateBed', { bedData }, sessionId);
};

export const deleteBed = (sessionId: string, bedId: string): Promise<void> => {
    return callApi('deleteBed', { bedId }, sessionId);
};

export const toggleMaintenance = (sessionId: string, type: 'Room' | 'Bed', id: string, status: boolean): Promise<void> => {
    return callApi('toggleMaintenance', { type, id, status }, sessionId);
};

export const getAIACConfig = (sessionId: string): Promise<{ worklist: AuditRecord[], failureReasons: MasterDataItem[] }> => {
    return callApi('getAIACConfig', {}, sessionId);
};

export const processDocument = (sessionId: string, recId: string): Promise<{ success: boolean, aiResult: AIResult, logicOutcome: LogicOutcome }> => {
    return callApi('processDocument', { recId }, sessionId);
};

export const recalculateLogic = (sessionId: string, recId: string): Promise<{ success: boolean, logicOutcome: LogicOutcome }> => {
    return callApi('recalculateLogic', { recId }, sessionId);
};

export const saveExaminerVerdict = (sessionId: string, verdictData: { recId: string, docName: string, verdictStatus: string, examinerJson: AIResult, examinerRemarks: string }): Promise<void> => {
    return callApi('saveExaminerVerdict', { verdictData }, sessionId);
};

export const getBatchCandidates = (sessionId: string, limit: number, statuses: string): Promise<string[]> => {
    return callApi('getBatchCandidates', { limit, mode: statuses }, sessionId);
};

export const processBatch = (sessionId: string, recIds: string[]): Promise<BatchResult[]> => {
    return callApi('processBatch', { recIds }, sessionId);
};

export const sanitizeBatch = (sessionId: string, recIds: string[]): Promise<BatchResult[]> => {
    return callApi('sanitizeBatch', { recIds }, sessionId);
};

export const startAIACJob = (sessionId: string, payload: { recIds: string[], jobName?: string, parallelSize?: number }): Promise<{ success: boolean, jobId: string, totalRecords: number }> => {
    return callApi('startAIACJob', payload, sessionId);
};

export const processAIACJobChunk = (sessionId: string, payload: { jobId: string, chunkIds: string[] }): Promise<{ success: boolean, processed: number, results: BatchResult[] }> => {
    return callApi('processAIACJobChunk', payload, sessionId);
};

export const getRecentAIACJobs = (sessionId: string, limit: number = 10): Promise<any[]> => {
    return callApi('getRecentAIACJobs', { limit }, sessionId);
};

export const getAIACJobStatus = (sessionId: string, jobId: string): Promise<{ job: any, logs: any[] }> => {
    return callApi('getAIACJobStatus', { jobId }, sessionId);
};

export const getReportData = (sessionId: string, reportType: string, eventIds?: string[]): Promise<any> => {
    return callApi('getReportData', { reportType, eventIds: eventIds?.join(',') }, sessionId);
};

export const getAccountSubmissionSettings = (sessionId: string): Promise<any> => {
    return callApi('getAccountSubmissionSettings', {}, sessionId);
};

export const syncAccountSubmissions = (sessionId: string): Promise<{ success: boolean, message: string, synced: boolean }> => {
    return callApi('syncAccountSubmissions', {}, sessionId);
};

export const updateAccountSubmissionSettings = (sessionId: string, settings: any): Promise<{ success: boolean }> => {
    return callApi('updateAccountSubmissionSettings', { settings }, sessionId);
};

export const getAccountSubmissionStats = (sessionId: string): Promise<{ totalUnits: number, completedMonths: string[], monthCounts: Record<string, { submitted: number, pending: number }> }> => {
    return callApi('getAccountSubmissionStats', {}, sessionId);
};

export const getAccountSubmissionRecords = (sessionId: string, page: number, pageSize: number, month: string, statusFilter: string): Promise<{ records: any[], total: number }> => {
    return callApi('getAccountSubmissionRecords', { page, pageSize, month, statusFilter }, sessionId);
};

export const getAllAccountSubmissions = (sessionId: string): Promise<any[]> => {
    return callApi('getAllAccountSubmissions', {}, sessionId);
};

export const triggerAutoSyncCheck = (sessionId: string): Promise<{ success: boolean, message: string }> => {
    return callApi('triggerAutoSyncCheck', {}, sessionId);
};

// --- NEW: Vouching Stats Actions ---
export const getVouchingStatsSettings = (sessionId: string): Promise<any> => {
    return callApi('getVouchingStatsSettings', {}, sessionId);
};

export const syncVouchingStats = (sessionId: string): Promise<{ success: boolean, message: string, synced: boolean }> => {
    return callApi('syncVouchingStats', {}, sessionId);
};

export const updateVouchingStatsSettings = (sessionId: string, settings: any): Promise<{ success: boolean }> => {
    return callApi('updateVouchingStatsSettings', { settings }, sessionId);
};

export const triggerVouchingAutoSyncCheck = (sessionId: string): Promise<{ success: boolean, message: string }> => {
    return callApi('triggerVouchingAutoSyncCheck', {}, sessionId);
};

export const getVouchingOwnershipMaps = (sessionId: string): Promise<any[]> => {
    return callApi('getVouchingOwnershipMaps', {}, sessionId);
};

export const saveVouchingOwnershipMap = (sessionId: string, mapData: any): Promise<any> => {
    return callApi('saveVouchingOwnershipMap', { mapData }, sessionId);
};

export const deleteVouchingOwnershipMap = (sessionId: string, mapId: string): Promise<{ success: boolean, message: string }> => {
    return callApi('deleteVouchingOwnershipMap', { mapId }, sessionId);
};

export const getAuditSettings = (sessionId: string): Promise<any> => {
    return callApi('getAuditSettings', {}, sessionId);
};

export const getAuditStatusSettings = (sessionId: string): Promise<any> => {
    return callApi('getAuditStatusSettings', {}, sessionId);
};

export const syncAuditData = (sessionId: string): Promise<{ success: boolean, message: string, synced: boolean }> => {
    return callApi('syncAuditData', {}, sessionId);
};

export const syncAuditStatus = (sessionId: string): Promise<{ success: boolean, message: string, synced: boolean }> => {
    return callApi('syncAuditStatus', {}, sessionId);
};

export const updateAuditSettings = (sessionId: string, settings: any): Promise<{ success: boolean }> => {
    return callApi('updateAuditSettings', { settings }, sessionId);
};

export const updateAuditStatusSettings = (sessionId: string, settings: any): Promise<{ success: boolean }> => {
    return callApi('updateAuditStatusSettings', { settings }, sessionId);
};

export const getPhysioWorklist = (sessionId: string): Promise<PhysioQueueItem[]> => {
    return callApi('getPhysioWorklist', {}, sessionId);
};

export const getPhysioLastSession = (sessionId: string, personId: string): Promise<Partial<PhysioSession>> => {
    return callApi('getPhysioLastSession', { personId }, sessionId);
};

export const logPhysioSession = (sessionId: string, sessionData: Partial<PhysioSession>): Promise<void> => {
    return callApi('logPhysioSession', { sessionData }, sessionId);
};

export const deletePhysioSession = (sessionId: string, physioSessionId: string): Promise<void> => {
    return callApi('deletePhysioSession', { physioSessionId }, sessionId);
}

export const getPhysioRegister = (sessionId: string, period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'All'): Promise<PhysioRegisterData> => {
    return callApi('getPhysioRegister', { period }, sessionId);
};

export const getPhysioAnalytics = (sessionId: string, month: number, year: number): Promise<PhysioAnalyticsData> => {
    return callApi('getPhysioAnalytics', { month, year }, sessionId);
};

export const getVitalsWorklist = (sessionId: string): Promise<VitalsQueueItem[]> => {
    return callApi('getVitalsWorklist', {}, sessionId);
};

export const getVitalsLastSession = (sessionId: string, personId: string): Promise<Partial<VitalsRecord>> => {
    return callApi('getVitalsLastSession', { personId }, sessionId);
};

export const logVitalsSession = (sessionId: string, vitalsData: Partial<VitalsRecord>): Promise<void> => {
    return callApi('logVitalsSession', { vitalsData }, sessionId);
};

export const deleteVitalsSession = (sessionId: string, vitalsId: string): Promise<void> => {
    return callApi('deleteVitalsSession', { vitalsId }, sessionId);
};

export const getVitalsReports = (sessionId: string, period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'All'): Promise<VitalsReportData> => {
    return callApi('getVitalsReports', { period }, sessionId);
};

export const getVitalsAnalytics = (sessionId: string, filters: any): Promise<VitalsAnalyticsResponse> => {
    return callApi('getVitalsAnalytics', { filters: JSON.stringify(filters) }, sessionId);
};

export const getPatientVitalsHistory = (sessionId: string, personId: string): Promise<VitalsRecord[]> => {
    return callApi('getPatientVitalsHistory', { personId }, sessionId);
};

export const getInventoryItems = (sessionId: string): Promise<InventoryItem[]> => {
    return callApi('getInventoryItems', {}, sessionId);
};

export const createInventoryItem = (sessionId: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    return callApi('createInventoryItem', { item }, sessionId);
};

export const updateInventoryItem = (sessionId: string, item: InventoryItem): Promise<InventoryItem> => {
    return callApi('updateInventoryItem', { item }, sessionId);
};

export const deleteInventoryItem = (sessionId: string, itemId: string): Promise<void> => {
    return callApi('deleteInventoryItem', { itemId }, sessionId);
};

export const getRoomStandards = (sessionId: string): Promise<RoomStandard[]> => {
    return callApi('getRoomStandards', {}, sessionId);
};

export const createRoomStandard = (sessionId: string, standard: Partial<RoomStandard>): Promise<RoomStandard> => {
    return callApi('createRoomStandard', { standard }, sessionId);
};

export const updateRoomStandard = (sessionId: string, standard: RoomStandard): Promise<RoomStandard> => {
    return callApi('updateRoomStandard', { standard }, sessionId);
};

export const deleteRoomStandard = (sessionId: string, standardId: string): Promise<void> => {
    return callApi('deleteRoomStandard', { standardId }, sessionId);
};

export const getRoomExpectedInventory = (sessionId: string, roomId: string): Promise<any[]> => {
    return callApi('getRoomExpectedInventory', { roomId }, sessionId);
};

export const submitRoomAudit = (sessionId: string, auditPayload: any): Promise<void> => {
    return callApi('submitRoomAudit', { auditPayload }, sessionId);
};

export const saveUserViewPreference = (sessionId: string, moduleId: string, config: any): Promise<{ success: boolean; viewPreferences: string }> => {
    return callApi('saveUserViewPreference', { moduleId, config }, sessionId);
};

export const getAuditEvents = (sessionId: string, status: string): Promise<InventoryAuditEvent[]> => {
    return callApi('getAuditEvents', { status }, sessionId);
};

export const createAuditEvent = (sessionId: string, config: any): Promise<InventoryAuditEvent> => {
    return callApi('createAuditEvent', { config }, sessionId);
};

export const closeAuditEvent = (sessionId: string, eventId: string): Promise<void> => {
    return callApi('closeAuditEvent', { eventId }, sessionId);
};

export const reopenAuditEvent = (sessionId: string, eventId: string): Promise<void> => {
    return callApi('reopenAuditEvent', { eventId }, sessionId);
};

// NEW: DELETE AUDIT EVENT
export const deleteAuditEvent = (sessionId: string, eventId: string, forceDelete: boolean): Promise<void> => {
    return callApi('deleteAuditEvent', { eventId, forceDelete }, sessionId);
};

export const getEventWorklist = (sessionId: string, eventId: string): Promise<InventoryAuditRecord[]> => {
    return callApi('getEventWorklist', { eventId }, sessionId);
};

export const saveAuditRecord = (sessionId: string, record: Partial<InventoryAuditRecord>): Promise<void> => {
    return callApi('saveAuditRecord', { record }, sessionId);
};

export const getDataSources = (sessionId: string): Promise<any[]> => {
    return callApi('getDataSources', {}, sessionId);
};

export const getDataSourceSchema = (sessionId: string, sourceId: string): Promise<any[]> => {
    return callApi('getDataSourceSchema', { sourceId }, sessionId);
};

export const createDataSource = (sessionId: string, newSource: any): Promise<any> => {
    return callApi('createDataSource', { newSource }, sessionId);
};

export const updateDataSource = (sessionId: string, updatedSource: any): Promise<any> => {
    return callApi('updateDataSource', { updatedSource }, sessionId);
};

export const deleteDataSource = (sessionId: string, sourceId: string): Promise<void> => {
    return callApi('deleteDataSource', { sourceId }, sessionId);
};

export const syncDataSource = (sessionId: string, sourceId: string): Promise<any> => {
    return callApi('syncDataSource', { sourceId }, sessionId);
};

export const saveDataSourceSchema = (sessionId: string, sourceId: string, schemaRows: any[]): Promise<any> => {
    return callApi('saveDataSourceSchema', { sourceId, schemaRows }, sessionId);
};

export const getSavedReports = (sessionId: string): Promise<any[]> => {
    return callApi('getSavedReports', {}, sessionId);
};

export const saveReportConfig = (sessionId: string, reportConfig: any): Promise<any> => {
    return callApi('saveReportConfig', { reportConfig }, sessionId);
};

export const deleteSavedReport = (sessionId: string, reportId: string): Promise<void> => {
    return callApi('deleteSavedReport', { reportId }, sessionId);
};

export const executeSavedReport = (sessionId: string, reportId: string, filters?: any[]): Promise<{ data: any[], config: any }> => {
    return callApi('executeSavedReport', { reportId, filters }, sessionId);
};

export const sendReportPdfToUser = (sessionId: string, reportId: string): Promise<{ success: boolean, message: string }> => {
    return callApi('sendReportPdfToUser', { reportId }, sessionId);
};

export const getPendingUidReportData = (sessionId: string): Promise<any[]> => {
    return callApi('getPendingUidReportData', {}, sessionId);
};

export const getRejectedUidReportData = (sessionId: string): Promise<any[]> => {
    return callApi('getRejectedUidReportData', {}, sessionId);
};

export const getSubmissionSummaryReport = (sessionId: string): Promise<{ data: any[], metadata?: any, error?: string }> => {
    return callApi('getSubmissionSummaryReport', {}, sessionId);
};

export const getAuditReadinessReportData = (sessionId: string): Promise<{ data: any[], metadata?: any, error?: string }> => {
    return callApi('getAuditReadinessReportData', {}, sessionId);
};

export const syncAllAuditReadinessSources = (sessionId: string, adminUser: string): Promise<{ success: boolean, results: any, error?: string }> => {
    return callApi('syncAllAuditReadinessSources', { adminUser }, sessionId);
};

export const getMaintenanceStats = (sessionId: string, taskId?: string, days?: number): Promise<any> => {
    const payload: any = {};
    if (taskId) payload.taskId = taskId;
    if (days !== undefined) payload.days = days;
    return callApi('getMaintenanceStats', payload, sessionId);
};

export const runMaintenanceTask = (sessionId: string, taskId: string, params: any = {}): Promise<{ deletedCount: number }> => {
    return callApi('runMaintenanceTask', { taskId, params }, sessionId);
};

export const getBulkMessagingMetadata = (sessionId: string): Promise<{ success: boolean; groups: { id: string; name: string; telegramId: string }[] }> => {
    return callApi('getBulkMessagingMetadata', {}, sessionId);
};

export const getRecentBulkJobs = (sessionId: string, limit: number = 10, senderName?: string): Promise<{ success: boolean; jobs: any[] }> => {
    return callApi('getRecentBulkJobs', { limit, senderName: senderName || '' }, sessionId);
};

export const processBulkMessageRequest = (params: BulkMessagingParams): Promise<BulkMessageResponse> => {
    return callApi('processBulkMessageRequest', params, params.sessionId);
};

export const initiateBulkJob = (params: BulkMessagingParams): Promise<any> => {
    return callApi('initiateBulkJob', params, params.sessionId);
};

// ============================================================================
// TWO-FACTOR AUTHENTICATION (TOTP)
// ============================================================================
export const generateTotpSecret = (sessionId: string): Promise<{ secret: string }> => {
    return callApi('generateTotpSecret', {}, sessionId);
};

export const enableTotp = (sessionId: string, secret: string, code: string): Promise<{ success: boolean }> => {
    return callApi('enableTotp', { secret, code }, sessionId);
};

export const disableTotp = (sessionId: string, code: string): Promise<{ success: boolean }> => {
    return callApi('disableTotp', { code }, sessionId);
};

// ============================================================================
// TELEGRAM DATA REGISTRATIONS
// ============================================================================
export const getTelegramData = (sessionId: string): Promise<any[]> => {
    return callApi('getTelegramData', {}, sessionId);
};

export const upsertTelegramData = (sessionId: string, record: any): Promise<{ success: boolean, action: string, message: string, error?: string }> => {
    return callApi('upsertTelegramData', { record }, sessionId);
};

export const deleteTelegramData = (sessionId: string, telegramId: string): Promise<{ success: boolean, message: string, error?: string }> => {
    return callApi('deleteTelegramData', { telegramId }, sessionId);
};

export const telegramPublicRegister = (record: any): Promise<{ success: boolean, action: string, message: string, error?: string }> => {
    return callApi('telegram_publicRegister', { record }, null);
};

export const getTelegramVerifiedPhone = (telegramId: string): Promise<{ success: boolean, phone?: string, error?: string }> => {
    return callApi('getTelegramVerifiedPhone', { telegramId }, null);
};

// ============================================================================
// WEBAUTHN / BIOMETRIC PASSKEYS
// ============================================================================
export const getPasskeyRegistrationOptions = (sessionId: string): Promise<{
    challenge: string;
    rp: { name: string; id: string };
    user: { id: string; name: string; displayName: string };
    pubKeyCredParams: { type: string; alg: number }[];
    timeout: number;
    authenticatorSelection: any;
}> => {
    return callApi('getPasskeyRegistrationOptions', {}, sessionId);
};

export const verifyPasskeyRegistration = (
    sessionId: string,
    payload: {
        credentialId: string;
        clientDataJSON: string;
        attestationObject: string;
        publicKey?: string;
        deviceName: string;
    }
): Promise<{ success: boolean; message: string; credentialId: string }> => {
    return callApi('verifyPasskeyRegistration', payload, sessionId);
};

export const getUserPasskeys = (sessionId: string): Promise<import('../types').WebAuthnCredential[]> => {
    return callApi('getUserPasskeys', {}, sessionId);
};

export const deletePasskey = (sessionId: string, credentialId: string): Promise<{ success: boolean; message: string }> => {
    return callApi('deletePasskey', { credentialId }, sessionId);
};

export const getPasskeyAuthOptions = (mobileNumber?: string): Promise<{
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials: { id: string; type: string }[];
    userFound?: boolean;
}> => {
    return callApi('getPasskeyAuthOptions', { mobileNumber: mobileNumber || '' }, null);
};

export const verifyPasskeyAuth = (payload: {
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    challenge: string;
    mobileNumber?: string;
}): Promise<Session> => {
    return callApi('verifyPasskeyAuth', payload, null);
};


