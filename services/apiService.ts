
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
    
    // AI Studio Preview environments should prefer STAGING URL
    if (hostname.startsWith('ais-dev-') || hostname.startsWith('ais-pre-')) {
        console.log(`[API] Detected AI Studio Preview Environment (${hostname}).`);
        return STAGING_URL || PROD_URL;
    }

    // Cloudflare Pages, GitHub Pages, Vercel, Cloud Run, Firebase
    if (
        hostname.endsWith('github.io') || 
        hostname.endsWith('pages.dev') || 
        hostname.endsWith('vercel.app') || 
        hostname.endsWith('run.app') || 
        hostname.endsWith('firebaseapp.com') || 
        hostname.endsWith('web.app')
    ) {
        console.log(`[API] Detected Hosted Production Environment (${hostname}). Using PROD URL.`);
        return PROD_URL || STAGING_URL;
    }

    console.log(`[API] Detected Environment (${hostname}). Using available URL.`);
    return PROD_URL || STAGING_URL;
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
    'getUserPasskeys',
    'getFarmProduceMasters',
    'getFarmVehicles',
    'getFarmDestinations',
    'getFarmChallans',
    'getFarmReports',
    'getFarmTelegramRecipients',
    'initializeFarmDespatchSheet',
    'seedFarmProduceMasters'
]);

// Pre-seeded 31 Produce Items matching user specification
const SEED_FARM_PRODUCE_ITEMS: import('../types').FarmProduceMaster[] = [
    { produceId: 'PRD-001', hindiName: 'टिंडा', englishName: 'Tinda (Apple Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 1 },
    { produceId: 'PRD-002', hindiName: 'भिंडी', englishName: 'Bhindi (Okra)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 2 },
    { produceId: 'PRD-003', hindiName: 'फूड ककड़ी', englishName: 'Phood Kakdi (Melon Cucumber)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 3 },
    { produceId: 'PRD-004', hindiName: 'पपीता', englishName: 'Papaya', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 22, isActive: true, displayOrder: 4 },
    { produceId: 'PRD-005', hindiName: 'सब्जी पेठा', englishName: 'Sabji Petha (Ash Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 5 },
    { produceId: 'PRD-006', hindiName: 'मिठाई पेठा', englishName: 'Mithai Petha', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 6 },
    { produceId: 'PRD-007', hindiName: 'बैंगन', englishName: 'Baingan (Eggplant)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 7 },
    { produceId: 'PRD-008', hindiName: 'करेला', englishName: 'Karela (Bitter Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 18, isActive: true, displayOrder: 8 },
    { produceId: 'PRD-009', hindiName: 'लौकी', englishName: 'Lauki (Bottle Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 9 },
    { produceId: 'PRD-010', hindiName: 'तौरी', englishName: 'Touri (Ridge Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 18, isActive: true, displayOrder: 10 },
    { produceId: 'PRD-011', hindiName: 'परवल', englishName: 'Parwal (Pointed Gourd)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 11 },
    { produceId: 'PRD-012', hindiName: 'खरबूजा', englishName: 'Kharbuja (Muskmelon)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 12 },
    { produceId: 'PRD-013', hindiName: 'तरबूज', englishName: 'Tarbooj (Watermelon)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 13 },
    { produceId: 'PRD-014', hindiName: 'टमाटर', englishName: 'Tamatar (Tomato)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 25, isActive: true, displayOrder: 14 },
    { produceId: 'PRD-015', hindiName: 'खीरा', englishName: 'Kheera (Cucumber)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 15 },
    { produceId: 'PRD-016', hindiName: 'चुकंदर', englishName: 'Chukandar (Beetroot)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 40, isActive: true, displayOrder: 16 },
    { produceId: 'PRD-017', hindiName: 'गाजर', englishName: 'Gajar (Carrot)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 40, isActive: true, displayOrder: 17 },
    { produceId: 'PRD-018', hindiName: 'केला', englishName: 'Kela (Banana)', category: 'FRUIT', defaultPackagingUnit: 'CRATE', packagingRatioKg: 20, isActive: true, displayOrder: 18 },
    { produceId: 'PRD-019', hindiName: 'अदरक', englishName: 'Adrak (Ginger)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 30, isActive: true, displayOrder: 19 },
    { produceId: 'PRD-020', hindiName: 'गन्ना', englishName: 'Ganna (Sugarcane)', category: 'AGRI_PRODUCE', defaultPackagingUnit: 'BUNDLE', packagingRatioKg: 25, isActive: true, displayOrder: 20 },
    { produceId: 'PRD-021', hindiName: 'आलू', englishName: 'Aloo (Potato)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 50, isActive: true, displayOrder: 21 },
    { produceId: 'PRD-022', hindiName: 'गुलाब फूल', englishName: 'Gulab Phool (Rose)', category: 'FLOWER', defaultPackagingUnit: 'BOX', packagingRatioKg: 5, isActive: true, displayOrder: 22 },
    { produceId: 'PRD-023', hindiName: 'गेंदा फूल', englishName: 'Genda Phool (Marigold)', category: 'FLOWER', defaultPackagingUnit: 'BAG', packagingRatioKg: 10, isActive: true, displayOrder: 23 },
    { produceId: 'PRD-024', hindiName: 'धनिया पत्ता', englishName: 'Dhaniya Patta (Coriander)', category: 'VEGETABLE', defaultPackagingUnit: 'BASKET', packagingRatioKg: 10, isActive: true, displayOrder: 24 },
    { produceId: 'PRD-025', hindiName: 'पत्ता गोभी', englishName: 'Patta Gobhi (Cabbage)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 35, isActive: true, displayOrder: 25 },
    { produceId: 'PRD-026', hindiName: 'पालक साग', englishName: 'Palak Saag (Spinach)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 26 },
    { produceId: 'PRD-027', hindiName: 'ब्रोकोली', englishName: 'Broccoli', category: 'VEGETABLE', defaultPackagingUnit: 'BOX', packagingRatioKg: 10, isActive: true, displayOrder: 27 },
    { produceId: 'PRD-028', hindiName: 'शिमला मिर्च', englishName: 'Shimla Mirch (Capsicum)', category: 'VEGETABLE', defaultPackagingUnit: 'CRATE', packagingRatioKg: 15, isActive: true, displayOrder: 28 },
    { produceId: 'PRD-029', hindiName: 'हरा मटर', englishName: 'Hara Matar (Green Peas)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 30, isActive: true, displayOrder: 29 },
    { produceId: 'PRD-030', hindiName: 'हरी मिर्च', englishName: 'Hari Mirch (Green Chilli)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 20, isActive: true, displayOrder: 30 },
    { produceId: 'PRD-031', hindiName: 'नींबू', englishName: 'Nimbu (Lemon)', category: 'VEGETABLE', defaultPackagingUnit: 'BAG', packagingRatioKg: 25, isActive: true, displayOrder: 31 }
];

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
        case 'getAppConfiguration':
            return {
                appModules: [
                    { moduleId: 'cat_farming', displayName: 'Farming & Agriculture', parentModuleId: null, moduleType: 'CATEGORY', iconName: 'Sprout', componentKey: '', permission: null, isVisible: true, sortOrder: 10 },
                    { moduleId: 'mod_farm_despatch', displayName: 'Produce Despatch (Dadi Gulzar Upvan)', parentModuleId: 'cat_farming', moduleType: 'MODULE', iconName: 'Sprout', componentKey: 'farming-despatch', permission: 'farm_despatch_view,farm_entry_add,farm_entry_edit,farm_entry_delete,farm_entry_print,farm_telegram_send,farm_admin_manage,farm_ai_rate_fetch', isVisible: true, sortOrder: 11 },
                    { moduleId: 'mod_farm_masters', displayName: 'Farm Masters & Rates', parentModuleId: 'cat_farming', moduleType: 'MODULE', iconName: 'Shield', componentKey: 'farming-masters', permission: 'farm_admin_manage', isVisible: true, sortOrder: 12 },
                    { moduleId: 'mod_farm_report', displayName: 'Farm Reports & Analytics', parentModuleId: 'cat_farming', moduleType: 'MODULE', iconName: 'BarChart3', componentKey: 'farming-report', permission: 'farm_report_view', isVisible: true, sortOrder: 13 },
                    { moduleId: 'mod_dashboard', displayName: 'Dashboard', parentModuleId: null, moduleType: 'MODULE', iconName: 'LayoutDashboard', componentKey: 'dashboard', permission: 'users_view', isVisible: true, sortOrder: 1 },
                    { moduleId: 'mod_users', displayName: 'User Management', parentModuleId: null, moduleType: 'MODULE', iconName: 'Users', componentKey: 'users', permission: 'users_view', isVisible: true, sortOrder: 2 },
                    { moduleId: 'mod_settings', displayName: 'App Settings', parentModuleId: null, moduleType: 'MODULE', iconName: 'Settings', componentKey: 'settings', permission: 'settings_view', isVisible: true, sortOrder: 3 }
                ],
                permissions: ['SUPER_ADMIN', 'farm_despatch_view', 'farm_entry_add', 'farm_entry_edit', 'farm_entry_delete', 'farm_entry_print', 'farm_telegram_send', 'farm_admin_manage', 'farm_ai_rate_fetch', 'farm_report_view']
            };
        case 'getPeople':
            return [];
        case 'getPermissionDefinitions':
            return [
                { permissionId: 'farm_despatch_view', permissionName: 'farm_despatch_view', description: 'View Produce Despatch Dashboard & Challans', category: 'Farming & Agriculture' },
                { permissionId: 'farm_entry_add', permissionName: 'farm_entry_add', description: 'Create New Produce Despatch Challans', category: 'Farming & Agriculture' },
                { permissionId: 'farm_entry_edit', permissionName: 'farm_entry_edit', description: 'Edit Pending Draft Challans', category: 'Farming & Agriculture' },
                { permissionId: 'farm_entry_delete', permissionName: 'farm_entry_delete', description: 'Delete Draft Challans', category: 'Farming & Agriculture' },
                { permissionId: 'farm_entry_print', permissionName: 'farm_entry_print', description: 'Print Delivery Slips & Export Image', category: 'Farming & Agriculture' },
                { permissionId: 'farm_telegram_send', permissionName: 'farm_telegram_send', description: 'Broadcast Challans to Telegram Groups', category: 'Farming & Agriculture' },
                { permissionId: 'farm_ai_rate_fetch', permissionName: 'farm_ai_rate_fetch', description: 'Query Gemini AI for Wholesale Mandi Rates', category: 'Farming & Agriculture' },
                { permissionId: 'farm_report_view', permissionName: 'farm_report_view', description: 'View Farm Analytics & Dispatch Reports', category: 'Farming & Agriculture' },
                { permissionId: 'farm_admin_manage', permissionName: 'farm_admin_manage', description: 'Manage Produce Items, Vehicles & Campus Masters', category: 'Farming & Agriculture' },
                { permissionId: 'users_view', permissionName: 'users_view', description: 'View User Accounts', category: 'User Management' },
                { permissionId: 'users_edit', permissionName: 'users_edit', description: 'Edit User Accounts', category: 'User Management' },
                { permissionId: 'settings_view', permissionName: 'settings_view', description: 'View System Settings', category: 'Administration' },
                { permissionId: 'settings_edit', permissionName: 'settings_edit', description: 'Manage System Settings', category: 'Administration' },
                { permissionId: 'permissions_view', permissionName: 'permissions_view', description: 'View Permissions Matrix', category: 'Security' },
                { permissionId: 'permissions_edit', permissionName: 'permissions_edit', description: 'Manage Permissions Matrix', category: 'Security' }
            ];
        case 'getFarmProduceMasters': {
            try {
                const stored = localStorage.getItem('mock_farm_produces');
                if (stored) return { success: true, items: JSON.parse(stored) };
            } catch {}
            return {
                success: true,
                items: SEED_FARM_PRODUCE_ITEMS
            };
        }
        case 'saveFarmProduceMaster': {
            let items: any[] = [];
            try {
                const stored = localStorage.getItem('mock_farm_produces');
                items = stored ? JSON.parse(stored) : [...SEED_FARM_PRODUCE_ITEMS];
            } catch { items = [...SEED_FARM_PRODUCE_ITEMS]; }

            const incoming = payload?.item || {};
            const cleanHindi = String(incoming.hindiName || '').trim();

            const isDup = items.some(i => i.produceId !== incoming.produceId && String(i.hindiName || '').trim().toLowerCase() === cleanHindi.toLowerCase());
            if (isDup) {
                return { success: false, error: `Produce with Hindi name "${cleanHindi}" already exists.` };
            }

            const existingIdx = items.findIndex(i => i.produceId === incoming.produceId);
            if (existingIdx >= 0) {
                items[existingIdx] = { ...items[existingIdx], ...incoming };
            } else {
                const newId = incoming.produceId || `PRD-${String(items.length + 1).padStart(3, '0')}`;
                items.push({ ...incoming, produceId: newId, isActive: incoming.isActive !== false });
            }
            try { localStorage.setItem('mock_farm_produces', JSON.stringify(items)); } catch {}
            return { success: true, message: `Produce "${cleanHindi}" saved successfully.` };
        }
        case 'deleteFarmProduceMaster': {
            let items: any[] = [];
            let challans: any[] = [];
            try {
                items = JSON.parse(localStorage.getItem('mock_farm_produces') || '[]');
                challans = JSON.parse(localStorage.getItem('mock_farm_challans') || '[]');
            } catch {}
            if (items.length === 0) items = [...SEED_FARM_PRODUCE_ITEMS];

            const targetId = payload?.produceId;
            const targetItem = items.find(i => i.produceId === targetId);

            const isReferenced = challans.some(c => (c.items || []).some((it: any) => it.produceId === targetId || (targetItem && it.hindiName === targetItem.hindiName)));
            let nextItems;
            if (isReferenced) {
                nextItems = items.map(i => i.produceId === targetId ? { ...i, isActive: false, status: 'INACTIVE' } : i);
            } else {
                nextItems = items.filter(i => i.produceId !== targetId);
            }
            try { localStorage.setItem('mock_farm_produces', JSON.stringify(nextItems)); } catch {}
            return { success: true, message: isReferenced ? 'Produce archived (soft-deleted to preserve past challans).' : 'Produce deleted permanently.' };
        }
        case 'getFarmVehicles': {
            try {
                const stored = localStorage.getItem('mock_farm_vehicles');
                if (stored) return { success: true, vehicles: JSON.parse(stored) };
            } catch {}
            return {
                success: true,
                vehicles: [
                    { vehicleId: 'VEH-01', vehicleNo: 'RJ 38 GA 1570', defaultDriverName: 'Lakmaram', driverPhone: '9509005618', capacityKg: 3000, isActive: true },
                    { vehicleId: 'VEH-02', vehicleNo: 'RJ 24 GA 2341', defaultDriverName: 'Ramesh Kumar', driverPhone: '9414056871', capacityKg: 2500, isActive: true },
                    { vehicleId: 'VEH-03', vehicleNo: 'RJ 38 EA 4412', defaultDriverName: 'Suresh Driver', driverPhone: '', capacityKg: 2000, isActive: true }
                ]
            };
        }
        case 'saveFarmVehicle': {
            let vehicles: any[] = [];
            try {
                const stored = localStorage.getItem('mock_farm_vehicles');
                vehicles = stored ? JSON.parse(stored) : [
                    { vehicleId: 'VEH-01', vehicleNo: 'RJ 38 GA 1570', defaultDriverName: 'Lakmaram', driverPhone: '9509005618', capacityKg: 3000, isActive: true },
                    { vehicleId: 'VEH-02', vehicleNo: 'RJ 24 GA 2341', defaultDriverName: 'Ramesh Kumar', driverPhone: '9414056871', capacityKg: 2500, isActive: true },
                    { vehicleId: 'VEH-03', vehicleNo: 'RJ 38 EA 4412', defaultDriverName: 'Suresh Driver', driverPhone: '', capacityKg: 2000, isActive: true }
                ];
            } catch {}

            const incoming = payload?.vehicle || {};
            const cleanNo = String(incoming.vehicleNo || '').trim().toUpperCase();

            const isDup = vehicles.some(v => v.vehicleId !== incoming.vehicleId && String(v.vehicleNo || '').trim().toUpperCase() === cleanNo);
            if (isDup) {
                return { success: false, error: `Vehicle with number "${cleanNo}" already exists.` };
            }

            const existingIdx = vehicles.findIndex(v => v.vehicleId === incoming.vehicleId);
            if (existingIdx >= 0) {
                vehicles[existingIdx] = { ...vehicles[existingIdx], ...incoming, vehicleNo: cleanNo };
            } else {
                const newId = incoming.vehicleId || `VEH-${String(vehicles.length + 1).padStart(2, '0')}`;
                vehicles.push({ ...incoming, vehicleId: newId, vehicleNo: cleanNo, isActive: true });
            }
            try { localStorage.setItem('mock_farm_vehicles', JSON.stringify(vehicles)); } catch {}
            return { success: true, message: `Vehicle "${cleanNo}" saved successfully.` };
        }
        case 'deleteFarmVehicle': {
            let vehicles: any[] = [];
            let challans: any[] = [];
            try {
                vehicles = JSON.parse(localStorage.getItem('mock_farm_vehicles') || '[]');
                challans = JSON.parse(localStorage.getItem('mock_farm_challans') || '[]');
            } catch {}

            const targetId = payload?.vehicleId;
            const target = vehicles.find(v => v.vehicleId === targetId);

            const isReferenced = challans.some(c => target && String(c.vehicleNo || '').trim().toUpperCase() === String(target.vehicleNo || '').trim().toUpperCase());
            let nextVehicles;
            if (isReferenced) {
                nextVehicles = vehicles.map(v => v.vehicleId === targetId ? { ...v, isActive: false, status: 'INACTIVE' } : v);
            } else {
                nextVehicles = vehicles.filter(v => v.vehicleId !== targetId);
            }
            try { localStorage.setItem('mock_farm_vehicles', JSON.stringify(nextVehicles)); } catch {}
            return { success: true, message: isReferenced ? 'Vehicle archived (retained in past records).' : 'Vehicle deleted successfully.' };
        }
        case 'getFarmDestinations': {
            try {
                const stored = localStorage.getItem('mock_farm_destinations');
                if (stored) return { success: true, destinations: JSON.parse(stored) };
            } catch {}
            return {
                success: true,
                destinations: [
                    { destinationId: 'DEST-01', campusName: 'Shantivan', shortCode: 'SV', address: 'Abu Road, Rajasthan', isActive: true, isPrimary: true },
                    { destinationId: 'DEST-02', campusName: 'Gyan Sarovar', shortCode: 'GS', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-03', campusName: 'Pandav Bhawan', shortCode: 'PB', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-04', campusName: 'Global Hospital', shortCode: 'GH', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-05', campusName: 'Taleti Complex', shortCode: 'TL', address: 'Taleti, Abu Road', isActive: true, isPrimary: false }
                ]
            };
        }
        case 'saveFarmDestination': {
            let destinations: any[] = [];
            try {
                const stored = localStorage.getItem('mock_farm_destinations');
                destinations = stored ? JSON.parse(stored) : [
                    { destinationId: 'DEST-01', campusName: 'Shantivan', shortCode: 'SV', address: 'Abu Road, Rajasthan', isActive: true, isPrimary: true },
                    { destinationId: 'DEST-02', campusName: 'Gyan Sarovar', shortCode: 'GS', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-03', campusName: 'Pandav Bhawan', shortCode: 'PB', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-04', campusName: 'Global Hospital', shortCode: 'GH', address: 'Mount Abu, Rajasthan', isActive: true, isPrimary: false },
                    { destinationId: 'DEST-05', campusName: 'Taleti Complex', shortCode: 'TL', address: 'Taleti, Abu Road', isActive: true, isPrimary: false }
                ];
            } catch {}

            const incoming = payload?.destination || {};
            const cleanName = String(incoming.campusName || '').trim();

            const isDup = destinations.some(d => d.destinationId !== incoming.destinationId && String(d.campusName || '').trim().toLowerCase() === cleanName.toLowerCase());
            if (isDup) {
                return { success: false, error: `Destination "${cleanName}" already exists.` };
            }

            const existingIdx = destinations.findIndex(d => d.destinationId === incoming.destinationId);
            if (existingIdx >= 0) {
                destinations[existingIdx] = { ...destinations[existingIdx], ...incoming, campusName: cleanName };
            } else {
                const newId = incoming.destinationId || `DEST-${String(destinations.length + 1).padStart(2, '0')}`;
                destinations.push({ ...incoming, destinationId: newId, campusName: cleanName, isActive: true });
            }
            try { localStorage.setItem('mock_farm_destinations', JSON.stringify(destinations)); } catch {}
            return { success: true, message: `Destination "${cleanName}" saved successfully.` };
        }
        case 'deleteFarmDestination': {
            let destinations: any[] = [];
            let challans: any[] = [];
            try {
                destinations = JSON.parse(localStorage.getItem('mock_farm_destinations') || '[]');
                challans = JSON.parse(localStorage.getItem('mock_farm_challans') || '[]');
            } catch {}

            const targetId = payload?.destinationId;
            const target = destinations.find(d => d.destinationId === targetId);

            const isReferenced = challans.some(c => target && String(c.destinationCampus || '').trim().toLowerCase() === String(target.campusName || '').trim().toLowerCase());
            let nextDest;
            if (isReferenced) {
                nextDest = destinations.map(d => d.destinationId === targetId ? { ...d, isActive: false, status: 'INACTIVE' } : d);
            } else {
                nextDest = destinations.filter(d => d.destinationId !== targetId);
            }
            try { localStorage.setItem('mock_farm_destinations', JSON.stringify(nextDest)); } catch {}
            return { success: true, message: isReferenced ? 'Destination archived (retained in past records).' : 'Destination deleted successfully.' };
        }
        case 'getFarmChallans': {
            try {
                const stored = localStorage.getItem('mock_farm_challans');
                if (stored) return { success: true, challans: JSON.parse(stored) };
            } catch {}
            const initialChallans = [
                {
                    challanId: 'CH-0022',
                    challanNo: '0022',
                    challanDate: '2026-07-16',
                    dispatchDate: '2026-07-16',
                    dispatchTime: '03:30 PM',
                    vehicleNo: 'RJ 38 GA 1570',
                    driverName: 'Lakmaram (Driver)',
                    dispatchFrom: 'Dadi Gulzar Upvan, Bhimana',
                    destinationCampus: 'Shantivan',
                    totalPackagingCount: 203,
                    totalQuantityKg: 4280,
                    totalQuantityWords: 'Four Thousand Two Hundred Eighty Kg (चार हजार दो सौ अस्सी के.जी.)',
                    totalEstimatedValue: 68480,
                    senderName: 'B.K. Harish',
                    receiverName: 'Lakmaram (Driver)',
                    status: 'DISPATCHED',
                    telegramSentAt: '2026-07-16T15:35:00Z',
                    createdAt: '2026-07-16T15:30:00Z',
                    createdBy: 'B.K. Harish',
                    items: [
                        {
                            itemId: 'ITM-0022-1',
                            challanNo: '0022',
                            srNo: 1,
                            hindiName: 'सब्जी पेठा',
                            englishName: 'Sabji Petha (Ash Gourd)',
                            category: 'VEGETABLE',
                            packagingUnit: 'CRATE',
                            packagingCount: 112,
                            quantityKg: 2240,
                            ratePerKg: 14,
                            estimatedValue: 31360
                        },
                        {
                            itemId: 'ITM-0022-2',
                            challanNo: '0022',
                            srNo: 2,
                            hindiName: 'मिठाई पेठा',
                            englishName: 'Mithai Petha',
                            category: 'VEGETABLE',
                            packagingUnit: 'CRATE',
                            packagingCount: 44,
                            quantityKg: 1100,
                            ratePerKg: 16,
                            estimatedValue: 17600
                        },
                        {
                            itemId: 'ITM-0022-3',
                            challanNo: '0022',
                            srNo: 3,
                            hindiName: 'बैंगन',
                            englishName: 'Baingan (Eggplant)',
                            category: 'VEGETABLE',
                            packagingUnit: 'CRATE',
                            packagingCount: 47,
                            quantityKg: 940,
                            ratePerKg: 20,
                            estimatedValue: 18800
                        }
                    ]
                }
            ];
            try { localStorage.setItem('mock_farm_challans', JSON.stringify(initialChallans)); } catch {}
            return {
                success: true,
                challans: initialChallans
            };
        }
        case 'saveFarmChallan': {
            let challans: any[] = [];
            try {
                const stored = localStorage.getItem('mock_farm_challans');
                challans = stored ? JSON.parse(stored) : [];
            } catch {}

            const incoming = payload?.challan || {};
            let assignedNo = incoming.challanNo;

            // Zero-Gap sequential numbering: Assign contiguous number ONLY upon DISPATCHED!
            if (incoming.status === 'DISPATCHED') {
                if (!assignedNo || assignedNo === 'AUTO' || assignedNo.startsWith('DRAFT-') || assignedNo === 'PREVIEW') {
                    let maxNum = 22;
                    challans.forEach(c => {
                        const num = parseInt(c.challanNo, 10);
                        if (!isNaN(num) && num > maxNum) maxNum = num;
                    });
                    assignedNo = String(maxNum + 1).padStart(4, '0');
                }
            } else {
                // Draft status: Use temporary ID DRAFT-XXXX so deleting draft never leaves gaps
                if (!assignedNo || assignedNo === 'AUTO' || assignedNo === 'PREVIEW') {
                    assignedNo = `DRAFT-${Math.floor(100 + Math.random() * 900)}`;
                }
            }

            const challanRecord = {
                ...incoming,
                challanId: `CH-${assignedNo}`,
                challanNo: assignedNo,
                updatedAt: new Date().toISOString()
            };

            const existingIdx = challans.findIndex(c => c.challanNo === assignedNo || (incoming.challanId && c.challanId === incoming.challanId));
            if (existingIdx >= 0) {
                challans[existingIdx] = { ...challans[existingIdx], ...challanRecord };
            } else {
                challans.unshift(challanRecord);
            }
            try { localStorage.setItem('mock_farm_challans', JSON.stringify(challans)); } catch {}

            return {
                success: true,
                challanNo: assignedNo,
                totalQuantityKg: challanRecord.totalQuantityKg || 0,
                totalPackagingCount: challanRecord.totalPackagingCount || 0,
                totalEstimatedValue: challanRecord.totalEstimatedValue || 0,
                message: incoming.status === 'DRAFT' ? `Draft #${assignedNo} saved successfully.` : `Challan #${assignedNo} dispatched successfully.`
            };
        }
        case 'deleteFarmChallan': {
            let challans: any[] = [];
            try {
                challans = JSON.parse(localStorage.getItem('mock_farm_challans') || '[]');
                challans = challans.filter(c => c.challanNo !== payload?.challanNo);
                localStorage.setItem('mock_farm_challans', JSON.stringify(challans));
            } catch {}
            return {
                success: true,
                message: `Challan #${payload?.challanNo} deleted successfully.`
            };
        }
        case 'getFarmTelegramRecipients':
            return {
                success: true,
                recipients: [
                    { recipientId: 'GRP-1', label: 'Seniors & Kitchen Coordinators Group', chatId: '-1001928374650', role: 'SENIOR', isDefault: true, isActive: true },
                    { recipientId: 'GRP-2', label: 'Shantivan Main Dining & Kitchen', chatId: '-1001837462510', role: 'KITCHEN_HEAD', isDefault: true, isActive: true },
                    { recipientId: 'GRP-3', label: 'Gyan Sarovar Kitchen Incharge', chatId: '-1001746251430', role: 'KITCHEN_HEAD', isDefault: false, isActive: true }
                ]
            };
        case 'sendFarmChallanTelegram':
            return {
                success: true,
                message: 'Telegram broadcast sent successfully with photo attachment.',
                sentAt: new Date().toISOString()
            };
        case 'initializeFarmDespatchSheet':
        case 'seedFarmProduceMasters':
            return {
                success: true,
                message: 'Farm sheets initialized and 31 produce items pre-seeded successfully into Google Sheet.'
            };
        case 'getFarmReports':
            return {
                success: true,
                rows: [
                    { groupKey: 'सब्जी पेठा', groupLabel: 'सब्जी पेठा (Sabji Petha)', category: 'VEGETABLE', totalTrips: 8, totalPackagingCount: 890, totalQuantityKg: 17800, totalEstimatedValue: 249200, itemsCount: 8 },
                    { groupKey: 'मिठाई पेठा', groupLabel: 'मिठाई पेठा (Mithai Petha)', category: 'VEGETABLE', totalTrips: 6, totalPackagingCount: 320, totalQuantityKg: 8000, totalEstimatedValue: 128000, itemsCount: 6 },
                    { groupKey: 'बैंगन', groupLabel: 'बैंगन (Eggplant)', category: 'VEGETABLE', totalTrips: 7, totalPackagingCount: 295, totalQuantityKg: 5900, totalEstimatedValue: 118000, itemsCount: 7 },
                    { groupKey: 'टमाटर', groupLabel: 'टमाटर (Tomato)', category: 'VEGETABLE', totalTrips: 5, totalPackagingCount: 210, totalQuantityKg: 5250, totalEstimatedValue: 115500, itemsCount: 5 },
                    { groupKey: 'पपीता', groupLabel: 'पपीता (Papaya)', category: 'FRUIT', totalTrips: 4, totalPackagingCount: 160, totalQuantityKg: 3520, totalEstimatedValue: 88000, itemsCount: 4 }
                ],
                summary: {
                  totalTrips: 12,
                  grandTotalKg: 40470,
                  grandTotalPacks: 1875,
                  grandTotalValue: 698700,
                  uniqueGroupsCount: 5
                }
            };
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

// ============================================================================
// FARMING (DADI GULZAR UPVAN) MODULE API METHODS
// ============================================================================

export const getFarmProduceMasters = (sessionId?: string): Promise<{ success: boolean; items: import('../types').FarmProduceMaster[] }> => {
    return callApi('getFarmProduceMasters', {}, sessionId || null);
};

export const saveFarmProduceMaster = (item: Partial<import('../types').FarmProduceMaster>, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('saveFarmProduceMaster', { item }, sessionId || null);
};

export const deleteFarmProduceMaster = (produceId: string, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('deleteFarmProduceMaster', { produceId }, sessionId || null);
};

export const getFarmVehicles = (sessionId?: string): Promise<{ success: boolean; vehicles: import('../types').FarmVehicle[] }> => {
    return callApi('getFarmVehicles', {}, sessionId || null);
};

export const saveFarmVehicle = (vehicle: Partial<import('../types').FarmVehicle>, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('saveFarmVehicle', { vehicle }, sessionId || null);
};

export const deleteFarmVehicle = (vehicleId: string, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('deleteFarmVehicle', { vehicleId }, sessionId || null);
};

export const getFarmDestinations = (sessionId?: string): Promise<{ success: boolean; destinations: import('../types').FarmDestination[] }> => {
    return callApi('getFarmDestinations', {}, sessionId || null);
};

export const saveFarmDestination = (destination: Partial<import('../types').FarmDestination>, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('saveFarmDestination', { destination }, sessionId || null);
};

export const deleteFarmDestination = (destinationId: string, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('deleteFarmDestination', { destinationId }, sessionId || null);
};

export const getFarmChallans = (sessionId?: string): Promise<{ success: boolean; challans: import('../types').FarmChallan[] }> => {
    return callApi('getFarmChallans', {}, sessionId || null);
};

export const saveFarmChallan = (challan: Partial<import('../types').FarmChallan>, sessionId?: string): Promise<{
    success: boolean;
    challanNo: string;
    totalQuantityKg: number;
    totalPackagingCount: number;
    totalEstimatedValue: number;
    message: string;
}> => {
    return callApi('saveFarmChallan', { challan }, sessionId || null);
};

export const deleteFarmChallan = (challanNo: string, reason: string, sessionId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    return callApi('deleteFarmChallan', { challanNo, reason }, sessionId || null);
};

export const getFarmReports = (filters: import('../types').FarmReportFilters, sessionId?: string): Promise<{
    success: boolean;
    rows: import('../types').FarmReportRow[];
    summary: {
        totalTrips: number;
        grandTotalKg: number;
        grandTotalPacks: number;
        grandTotalValue: number;
        uniqueGroupsCount: number;
    };
}> => {
    return callApi('getFarmReports', filters, sessionId || null);
};

export const getFarmTelegramRecipients = (sessionId?: string): Promise<{ success: boolean; recipients: import('../types').FarmTelegramRecipient[] }> => {
    return callApi('getFarmTelegramRecipients', {}, sessionId || null);
};

export const sendFarmChallanTelegram = (payload: {
    challan: import('../types').FarmChallan;
    imageBase64?: string;
    chatIds: string[];
    customNote?: string;
    botToken?: string;
}, sessionId?: string): Promise<{ success: boolean; message: string; sentAt?: string; error?: string }> => {
    return callApi('sendFarmChallanTelegram', payload, sessionId || null);
};

export const initializeFarmDespatchSheet = (sessionId?: string): Promise<{ success: boolean; message: string }> => {
    return callApi('initializeFarmDespatchSheet', {}, sessionId || null);
};

export const seedFarmProduceMasters = (force = true, sessionId?: string): Promise<{ success: boolean; message: string }> => {
    return callApi('seedFarmProduceMasters', { force }, sessionId || null);
};



