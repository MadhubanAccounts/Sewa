
import React from 'react';

export interface User {
    userId: string;
    personId?: string;
    name: string;
    telegramId: string;
    primaryMobile?: string;
    roleLabel: string;
    activeStatus: boolean;
    createdAt?: string;
    lastLogin?: string;
    mobileFavorites?: string;
    viewPreferences?: string; // New JSON string field
    totpEnabled?: boolean;
    totpSecret?: string;
    [key: string]: any;
}

export interface Person {
  personId: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  primaryMobile?: string;
  primaryEmail?: string;
  telegramId?: string;
  bkTitle?: string;
  address?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  [key: string]: any;
}

export interface Role {
  roleId: string;
  personId: string;
  personType: 'USER' | 'RESIDENT' | 'STAFF' | 'GUEST' | 'WORKER' | 'STUDENT';
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  roleSpecificData?: string;
}

export interface UserPermission {
    userPermissionId: string;
    userId: string;
    permissionName: string;
    value: boolean;
    grantedByUserId: string;
    grantedAt: string;
}

export interface Session {
    sessionId: string;
    userId: string;
    name: string;
    roleLabel: string;
    telegramId: string;
    primaryMobile: string;
    permissions: Permission[];
    appModules: AppModuleConfig[];
    mobileFavorites?: string;
    viewPreferences?: string; // New JSON string field
    totpEnabled?: boolean;
    expirationTimestamp?: string;
}

export interface Setting {
    settingName: string;
    settingValue: string;
}

export interface MessageTemplate {
  templateId: string;
  description: string;
  moduleId?: string;
  messageContentEn: string;
  disableWebPagePreview?: boolean; 
  includeIndividualsFromMasters?: string;
  availablePlaceholders: string;
  defaultRecipients?: string;
  isSchedulable?: boolean;
  schedule?: string;
  defaultSilentSend?: boolean;
  targetGroupIds?: string;
  sendingBotId?: string;
  auditGroupId?: string;
  isActive?: boolean;
  isSystem?: boolean;
  isCritical?: boolean;
  systemLockMessage?: string;
  logicSource?: string;
  triggerType?: 'SYSTEM' | 'MANUAL' | 'SCHEDULED' | 'BULK_MESSAGE';
  driveFileId?: string;
  driveFileType?: 'PHOTO' | 'PDF' | 'NONE';
}

export interface NotificationRecipient {
    recipientId: string;
    displayName: string;
    recipientType: string;
    telegramIdOrRole: string;
}

export interface NotificationQueueItem {
    queueId: string;
    templateId: string;
    dataPayload: string;
    recipientIds: string;
    status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';
    scheduledFor: string;
    retryCount: number;
    lastError: string;
    driveFileId?: string;
    driveFileType?: 'PHOTO' | 'PDF' | 'NONE';
}


export interface AIACJob {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  [key: string]: any;
}

export interface SuperMasterRecord {
  fieldId: string;
  fieldName: string;
  displayName: string;
  description: string;
  dataType: string;
  lookupSource?: string;
  validationRegex: string;
  mandatory: boolean;
  isPrimaryKey?: boolean;
  maxLength: number;
  modules: string;
  defaultValue: string;
  sortOrders?: string;
  groupName?: string;
  visibleWhen?: string;
  displayInList?: boolean;
  isSystemLocked?: boolean | string;
}

export interface MasterDataItem {
    masterId: string;
    masterName: string;
    value: string;
    label: string;
    isActive: boolean;
    [key: string]: any;
}

export interface AppModuleConfig {
  moduleId: string;
  displayName: string;
  parentModuleId: string | null;
  moduleType: 'CATEGORY' | 'SUBGROUP' | 'MODULE';
  iconName: string;
  componentKey: string;
  permission: Permission | null;
  isActive: boolean;
  sortOrder: number;
}


export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  module: string;
}

export type SearchResults = Record<string, SearchResultItem[]>;

export interface ActivityLog {
    logId: string;
    timestamp: string;
    userId: string;
    userName: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
    module: string;
    description: string;
    targetId: string;
}

export interface KeyMetrics {
    totalUsers: number;
    activeResidents: number;
    pendingTasks: number;
}

export interface PermissionDefinition {
    permissionId: string;
    permissionName: string;
    description: string;
    category: string;
}

export type Permission = string;

// Permission Matrix Types
export interface PermissionMatrixData {
    users: { userId: string; name: string; roleLabel?: string }[];
    permissions: PermissionDefinition[];
    userPermissions: Record<string, string[]>;
}

export interface PermissionChange {
    userId: string;
    permission: string;
    action: 'grant' | 'revoke';
}

export interface AuditRecord {
    recId: string;
    ledgerDate: string;
    ledgerAmount: string | number;
    ledgerUid: string;
    ledgerParty: string;
    ledgerNarration: string;
    docLink: string;
    docName: string;
    status: 'PENDING' | 'ANALYSED' | 'VERIFIED_OK' | 'VERIFIED_CORRECTED' | 'REJECTED' | 'FATAL_ERROR' | 'AI_TIMEOUT' | 'SANITIZED';
    aiResult: AIResult | null;
    examinerResult: AIResult | null;
    aiQuality?: string;
    aiDocType?: string;
    aiLogicOutcome?: LogicOutcome;
    examinerRemarks?: string;
    aiVisualAnomalies?: string;
}

export interface AIResult {
    doc_date: string;
    amount_fig: number;
    amount_words: string;
    unit_id: string;
    party_name: string;
    signature_count: number;
    denominations: string;
    declaration_present: boolean;
    math_correct: boolean;
    words_match_figures: boolean;
    invalid_currency_found: boolean;
    visual_anomalies: string;
    other_observations: string;
    orientation_degrees?: number;
    doc_quality?: string;
    doc_type?: string;
    signature_name_match?: boolean;
}

export interface LogicOutcome {
    date_match: boolean;
    amount_match: boolean;
    signature_check: boolean;
    signature_match?: boolean;
    declaration_check: boolean;
    math_integrity: boolean;
    no_anomalies: boolean;
    party_match?: boolean;
    denom_match?: boolean;
}

export type BatchStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAIL_IMAGE' | 'FAIL_GEMINI' | 'FAIL_SCRIPT' | 'FAIL_PERMANENT' | 'FAIL_TIMEOUT';

export interface BatchLogEntry {
    recId: string;
    status: BatchStatus;
    startTime?: number;
    duration?: number;
    error?: string;
}

export interface BatchProgress {
    current: number;
    total: number;
    completed: number;
    failed: number;
    duration?: number;
}

export interface BatchResult {
    recId: string;
    status: BatchStatus;
    timeTaken?: number;
    error?: string;
    usage?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

// --- UNIVERSAL DATA GRID TYPES ---

export interface GridColumnDef {
  key: string; // Unique key for the column
  header: string; // Display label
  // Function to calculate value for a leaf row
  accessor?: (row: any) => React.ReactNode; 
  // Function to calculate value for a group header (aggregation)
  aggregator?: (leafRows: any[]) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  aggregation?: 'none' | 'sum' | 'count' | 'avg';
}

export interface PivotConfig {
    enabled: boolean;
    rowKey: string;
    columnKey: string;
    valueKey: string;
    aggregation: 'sum' | 'count' | 'avg';
}

export interface GridConfig {
  title?: string;
  groupBy: string[]; // Fields to group by (in order)
  columns: GridColumnDef[];
  showLeafNodes?: boolean; // Whether to show the individual items inside the lowest group
  defaultExpandedDepth?: number; // 0 = all collapsed, 1 = first level expanded
  pivotConfig?: PivotConfig; // New property
}

export interface VouchingStat {
    zone: string;
    institute: string;
    category: string;
    vouchingCategory?: string;
    unitName: string;
    totalVouchers: number;
    vouchedCount: number;
    pendingCount: number;
    pendingWithExaminers?: number;
    pendingInAudit?: number;
    vouchingAccepted?: number;
    vouchingRejected?: number;
    pendingDuesToCenters?: number;
    pendingAttachCnt?: number;
    asOn?: string;
    calcPendingTotal?: number;
    calcTotalDone?: number;
    calcStatus?: string;
    [key: string]: any;
}

export interface VouchingOwnershipMap {
    mapId: string;
    institute: string;
    category: string;
    responsiblePersonId: string;
    responsiblePersonName?: string;
    updatedAt: string;
    updatedBy?: string;
    [key: string]: any;
}

export interface RoomDashboardData {
    flats: Flat[];
    rooms: Room[];
    beds: Bed[];
    allotments: Allotment[];
    reservations: Reservation[];
}

export interface Flat {
    flatId: string;
    flatLabel: string;
    floorLabel: string;
    buildingId: string;
    wingId?: string;
    [key: string]: any;
}

export interface Room {
    roomId: string;
    flatId: string;
    roomLabel: string;
    roomType: string;
    isUnderMaintenance: boolean;
    buildingId: string;
    [key: string]: any;
}

export interface Bed {
    bedId: string;
    roomId: string;
    bedLabel: string;
    isUnderMaintenance: boolean;
    [key: string]: any;
}

export interface Allotment {
    allotmentId: string;
    personId: string;
    bedId: string;
    startDate: string;
    endDate?: string;
    allotStatus: 'ACTIVE' | 'VACATED' | 'CANCELLED';
    [key: string]: any;
}

export interface Reservation {
    reservationId: string;
    personId: string;
    bedId: string;
    reservationDate: string;
    reservationStatus: 'ACTIVE' | 'CANCELLED' | 'CONVERTED';
    [key: string]: any;
}

export interface PhysioSession {
    physioSessionId: string;
    personId: string;
    sessionDate: string;
    notes?: string;
    treatedBy: string;
    [key: string]: any;
}

export interface PhysioQueueItem {
    personId: string;
    name: string;
    treatedToday: boolean;
    [key: string]: any;
}

export interface PhysioRegisterData {
    sessions: PhysioSession[];
    [key: string]: any;
}

export interface PhysioAnalyticsData {
    stats: any;
    [key: string]: any;
}

export interface VitalsRecord {
    vitalsId: string;
    personId: string;
    visitDate: string;
    isPartial: boolean;
    [key: string]: any;
}

export interface VitalsQueueItem {
    personId: string;
    name: string;
    status: 'PENDING' | 'PARTIAL' | 'COMPLETE';
    [key: string]: any;
}

export interface VitalsReportData {
    records: VitalsRecord[];
    [key: string]: any;
}

export interface VitalsAnalyticsResponse {
    matrix: any;
    [key: string]: any;
}

export interface InventoryItem {
    itemId: string;
    itemName: string;
    category: string;
    basis: 'Per_Bed' | 'Per_Room' | 'Per_Person' | 'Per_Washroom';
    isActive: boolean | string;
    [key: string]: any;
}

export interface RoomStandard {
    standardId: string;
    roomId?: string;
    roomType: string;
    roomSubType: string; // JSON array string
    itemId: string;
    standardQuantity: number;
    basis?: string;
    targetWashroomTypes?: string; // JSON array string
    [key: string]: any;
}

export interface InventoryAuditEvent {
    eventId: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    scopeConfig: string; // JSON string
    createdAt: string;
    [key: string]: any;
}

export interface InventoryAuditRecord {
    recordId: string;
    eventId: string;
    roomId: string;
    roomLabel: string;
    floorLabel: string;
    itemId: string;
    itemName: string;
    expectedQty: number;
    actualQty: number;
    basis: string;
    status: 'PENDING' | 'OK' | 'NOT_OK' | string;
    isVerified: boolean;
    notes?: string;
    category?: string;
    [key: string]: any;
}

export type BulkDeliveryStrategy = 'ARP_INCHARGE_FALLBACK' | 'INCHARGE_ARP_FALLBACK' | 'ARP_ONLY' | 'INCHARGE_ONLY' | 'BOTH_DEDUPLICATED' | 'UID_PRIORITY_FALLBACK' | 'NONE';

export interface BulkRowData {
    uid: string;
    message: string;
}

export interface BulkMessageResult {
    uid: string;
    recipient: string;
    mobile?: string;
    role: string;
    status: 'QUEUED' | 'FAILED' | 'READY';
    message?: string;
    errorDetail?: string;
    zone?: string;
    subZone?: string;
}

export interface BulkMessagingParams {
    sessionId: string;
    jobId?: string;
    isLastChunk?: boolean;
    totalRecords?: number;
    jobName: string;
    bulkData: BulkRowData[];
    messageContent: string;
    selectedToRoles: string[];
    selectedCcRoles: string[];
    deliveryStrategy: BulkDeliveryStrategy;
    summaryGroupIds: string[];
    ccPrefixTemplate: string;
    includeOriginalInCc: boolean;
    summaryPrefixTemplate: string;
    includeZoneSummary: boolean;
    includeSubZoneSummary: boolean;
    includeBcc?: boolean;
    previewOnly?: boolean;
}

export interface BulkMessageResponse {
    success: boolean;
    results?: BulkMessageResult[];
    error?: string;
}

export interface BulkMessageLogEntry {
    timestamp: string;
    senderName: string;
    recipientName: string;
    recipientRole: string;
    uid: string;
    centerName: string;
    actualMessage: string;
    status: string;
    errorDetail?: string;
}

export interface WebAuthnCredential {
    credentialId: string;
    userId: string;
    personId?: string;
    publicKey?: string;
    counter?: number;
    deviceName: string;
    domain?: string;
    createdAt: string;
    lastUsedAt?: string;
}


// ============================================================================
// FARMING (DADI GULZAR UPVAN) PRODUCE DESPATCH MODULE TYPES
// ============================================================================

export type FarmProduceCategory = 'VEGETABLE' | 'FRUIT' | 'FLOWER' | 'AGRI_PRODUCE';

export type FarmPackagingUnit = 'CRATE' | 'BAG' | 'BOX' | 'BUNDLE' | 'BASKET' | 'LOOSE';

export interface FarmProduceMaster {
    produceId: string;
    hindiName: string;
    englishName: string;
    category: FarmProduceCategory;
    defaultPackagingUnit: FarmPackagingUnit;
    packagingRatioKg?: number; // Approximate kg per packaging unit
    isActive: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
    displayOrder?: number;
    createdAt?: string;
}

export interface FarmVehicle {
    vehicleId: string;
    vehicleNo: string;
    defaultDriverName: string;
    driverPhone?: string;
    capacityKg?: number;
    isActive: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface FarmDestination {
    destinationId: string;
    campusName: string;
    shortCode: string;
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    isActive: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
    isPrimary?: boolean;
}

export interface FarmChallanItem {
    itemId: string;
    challanNo: string;
    srNo: number;
    produceId?: string;
    hindiName: string;
    englishName?: string;
    category: FarmProduceCategory;
    packagingUnit: FarmPackagingUnit;
    packagingCount: number; // e.g. 112 Crates
    packagingRatioKg?: number;
    quantityKg: number; // e.g. 2240 kg
    ratePerKg?: number; // Optional daily rate (₹/kg)
    estimatedValue?: number; // auto-computed: quantityKg * (ratePerKg || 0)
    notes?: string;
}

export interface FarmChallan {
    challanId: string;
    challanNo: string; // e.g. "0022"
    challanDate: string; // YYYY-MM-DD
    dispatchDate: string; // YYYY-MM-DD
    dispatchTime: string; // HH:mm or "3:30 PM"
    vehicleNo: string;
    driverName: string;
    dispatchFrom: string; // "Dadi Gulzar Upvan, Bhimana"
    destinationCampus: string; // e.g. "Shantivan"
    items: FarmChallanItem[];
    totalPackagingCount: number; // Sum of crates/bags
    totalQuantityKg: number; // Sum of kg
    totalQuantityWords?: string; // Hindi or English words
    totalEstimatedValue?: number; // Sum of item values in ₹
    senderName: string; // e.g. "B.K. Harish"
    receiverName: string; // e.g. "Lakmaram (Driver)"
    status: 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
    telegramSentAt?: string;
    telegramMessageId?: string;
    isAudited?: boolean;
    cancellationReason?: string;
    notes?: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface FarmReportFilters {
    cadence: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
    destinationCampus?: string;
    category?: string;
    produceName?: string;
    vehicleNo?: string;
    groupBy?: 'ITEM' | 'CATEGORY' | 'DESTINATION' | 'VEHICLE';
}

export interface FarmReportRow {
    groupKey: string;
    groupLabel: string;
    category?: string;
    totalTrips: number;
    totalPackagingCount: number;
    totalQuantityKg: number;
    totalEstimatedValue: number;
    itemsCount: number;
}

export interface FarmTelegramRecipient {
    recipientId: string;
    label: string;
    chatId: string;
    role: string;
    isDefault: boolean;
    isActive: boolean;
}


