import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePeople } from '../../hooks/usePeople';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Users, 
  Clock, 
  ShieldAlert, 
  Smartphone, 
  Bot, 
  Lock, 
  Key, 
  UserCheck, 
  HelpCircle,
  Code,
  Check,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  Eye,
  ShieldCheck,
  MapPin,
  Calendar,
  Bell,
  Sliders,
  History,
  Trash2,
  Plus,
  Edit
} from 'lucide-react';

// ============================================================================
// SIMULATION SCHEMAS & TYPES
// ============================================================================

interface SimulatedLocation {
  id: string;
  name: string;
}

interface SimulatedGroup {
  id: string;
  name: string;
  isExcluded: boolean;
}

interface SimulatedVolunteer {
  id: string;
  name: string;
  telegramId: string;
  locationId: string;
  groupIds: string[];
  canResolveApprovals: boolean;
  isActive: boolean;
}

interface SimulatedSession {
  id: string;
  name: string;
  locationId: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  isMandatory: boolean;
  marginBackMin: number;
  reminderInMin: number;
  reminderOutMin: number;
}

interface SimulatedAttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sessionId: string;
  locationId: string;
  status: 'Present' | 'Leave' | 'Absent';
  reason?: string;
  punchInTime?: string; // ISO string or HH:MM
  punchOutTime?: string; // ISO string or HH:MM
  firstPersonClaimed: boolean;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  disputedByUserId?: string;
  approverUserId?: string;
  notes?: string;
}

interface TelegramLog {
  id: string;
  timestamp: string;
  type: 'GROUP' | 'SUPERIOR' | 'REMINDER';
  target: string;
  message: string;
}

export const TelegramAttendancePrototype: React.FC = () => {
  const { user } = useAuth();

  // ============================================================================
  // INITIAL SEED DATA
  // ============================================================================
  
  const [locations, setLocations] = useState<SimulatedLocation[]>([
    { id: 'LOC_1', name: 'Main Meditation Hall' },
    { id: 'LOC_2', name: 'Administrative Annex' }
  ]);

  const [groups, setGroups] = useState<SimulatedGroup[]>([
    { id: 'GRP_ADMIN', name: 'Coordinators & Incharges', isExcluded: false },
    { id: 'GRP_VOL', name: 'Regular Volunteers', isExcluded: false },
    { id: 'GRP_EXCL', name: 'Guest Speakers (Excluded)', isExcluded: true }
  ]);

  const [volunteers, setVolunteers] = useState<SimulatedVolunteer[]>([
    { id: 'VOL_1', name: 'BK Amit Sharma', telegramId: '65432101', locationId: 'LOC_1', groupIds: ['GRP_ADMIN'], canResolveApprovals: true, isActive: true },
    { id: 'VOL_2', name: 'BK Savita Patel', telegramId: '98765432', locationId: 'LOC_1', groupIds: ['GRP_VOL'], canResolveApprovals: false, isActive: true },
    { id: 'VOL_3', name: 'BK Rahul Gupta', telegramId: '12345678', locationId: 'LOC_2', groupIds: ['GRP_ADMIN'], canResolveApprovals: true, isActive: true },
    { id: 'VOL_4', name: 'BK Sneha Reddy', telegramId: '87654321', locationId: 'LOC_1', groupIds: ['GRP_EXCL'], canResolveApprovals: false, isActive: true },
    { id: 'VOL_5', name: 'BK Gopal Das', telegramId: '550123456', locationId: 'LOC_1', groupIds: ['GRP_VOL'], canResolveApprovals: false, isActive: true }
  ]);

  // Seed 24-hour continuous sessions for LOC_1 (covers all day without breaks)
  const [sessions, setSessions] = useState<SimulatedSession[]>([
    { id: 'SES_1', name: 'Early Morning Session', locationId: 'LOC_1', startTime: '04:00', endTime: '08:00', isMandatory: true, marginBackMin: 15, reminderInMin: 10, reminderOutMin: 10 },
    { id: 'SES_2', name: 'Morning Service Slot', locationId: 'LOC_1', startTime: '08:00', endTime: '12:00', isMandatory: true, marginBackMin: 15, reminderInMin: 10, reminderOutMin: 10 },
    { id: 'SES_3', name: 'Afternoon Quiet Hours', locationId: 'LOC_1', startTime: '12:00', endTime: '16:00', isMandatory: false, marginBackMin: 15, reminderInMin: 10, reminderOutMin: 10 },
    { id: 'SES_4', name: 'Evening Public Program', locationId: 'LOC_1', startTime: '16:00', endTime: '20:00', isMandatory: true, marginBackMin: 15, reminderInMin: 10, reminderOutMin: 10 },
    { id: 'SES_5', name: 'Night Vigil Service', locationId: 'LOC_1', startTime: '20:00', endTime: '04:00', isMandatory: true, marginBackMin: 15, reminderInMin: 15, reminderOutMin: 15 },
    
    // Seed LOC_2 sessions
    { id: 'SES_6', name: 'Annex Day Shift', locationId: 'LOC_2', startTime: '09:00', endTime: '17:00', isMandatory: true, marginBackMin: 30, reminderInMin: 15, reminderOutMin: 15 },
    { id: 'SES_7', name: 'Annex Night Shift', locationId: 'LOC_2', startTime: '17:00', endTime: '09:00', isMandatory: true, marginBackMin: 30, reminderInMin: 15, reminderOutMin: 15 }
  ]);

  const [records, setRecords] = useState<SimulatedAttendanceRecord[]>([
    // A pre-existing leave to demo leaves
    { 
      id: 'REC_PRE_1', 
      userId: 'VOL_2', 
      date: '2026-07-07', 
      sessionId: 'SES_1', 
      locationId: 'LOC_1', 
      status: 'Leave', 
      reason: 'Visiting native place for family event', 
      firstPersonClaimed: false, 
      approvalStatus: 'Approved' 
    }
  ]);

  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>([
    { id: 'T_1', timestamp: '04:05 AM', type: 'GROUP', target: 'Main Meditation Hall Group', message: '📢 BK Savita Patel is on Leave for the Early Morning Session.' },
    { id: 'T_2', timestamp: '04:05 AM', type: 'SUPERIOR', target: 'Superiors Admin Group', message: '🔔 LEAVE NOTIFICATION: BK Savita Patel marked Leave. Reason: Visiting native place for family event' }
  ]);

  // ============================================================================
  // SIMULATOR CONTROL STATES
  // ============================================================================
  const { theme } = useTheme();
  const { getAllPeople } = usePeople();
  const [peopleFromList, setPeopleFromList] = useState<any[]>([]);
  const [peopleLoading, setPeopleLoading] = useState<boolean>(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [editingVolId, setEditingVolId] = useState<string | null>(null);

  const [simDate, setSimDate] = useState<string>('2026-07-07');
  const [simTime, setSimTime] = useState<string>('09:15'); // Current simulated time
  const [selectedSimUser, setSelectedSimUser] = useState<string>('VOL_5'); // Currently logged-in volunteer in Mini App
  const [activeRightTab, setActiveRightTab] = useState<'pending' | 'settings' | 'sessions' | 'tele_logs'>('pending');
  const [appOpen, setAppOpen] = useState<boolean>(true);

  // Form states for creation
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionLocs, setNewSessionLocs] = useState<string[]>(['LOC_1']); // Supports multi-select target locations
  const [newSessionStart, setNewSessionStart] = useState('08:00');
  const [newSessionEnd, setNewSessionEnd] = useState('12:00');
  const [newSessionMandatory, setNewSessionMandatory] = useState(true);
  const [newSessionMargin, setNewSessionMargin] = useState(15);

  // Session Planner Draft States
  const [draftSessions, setDraftSessions] = useState<SimulatedSession[]>([]);
  const [activePlannerLoc, setActivePlannerLoc] = useState<string>('LOC_1');

  // New Whitelist volunteer form states
  const [newVolName, setNewVolName] = useState('');
  const [newVolTg, setNewVolTg] = useState('');
  const [newVolLoc, setNewVolLoc] = useState('LOC_1');
  const [newVolGroups, setNewVolGroups] = useState<string[]>(['GRP_VOL']);
  const [newVolCanResolve, setNewVolCanResolve] = useState(false);

  // Mini App forms states
  const [selectedMiniAppSessionId, setSelectedMiniAppSessionId] = useState<string>('SES_2');
  const [isFirstPersonCheck, setIsFirstPersonCheck] = useState<boolean>(false);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [customPunchInOffset, setCustomPunchInOffset] = useState<number>(0); // back margin offset in minutes
  
  // Missing Punch Out prompt states
  const [missingPunchOutModal, setMissingPunchOutModal] = useState<boolean>(false);
  const [missingRecordToClose, setMissingRecordToClose] = useState<SimulatedAttendanceRecord | null>(null);
  const [missingPunchOutTimeInput, setMissingPunchOutTimeInput] = useState<string>('');

  // Loading animation state for realistic saving feel
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Load real people from system hook on mount
  useEffect(() => {
    let active = true;
    setPeopleLoading(true);
    getAllPeople()
      .then(data => {
        if (active) {
          setPeopleFromList(data || []);
          setPeopleLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load people database:", err);
        if (active) setPeopleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAllPeople]);

  // Sync session drafts with actual sessions when they change
  useEffect(() => {
    setDraftSessions(sessions);
  }, [sessions]);

  // Helpers for continuous 24-hour verification
  const formatMinutesToHHMM = (m: number) => {
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const validate24HourCoverage = (locationId: string, drafts: SimulatedSession[]) => {
    const locDrafts = drafts.filter(s => s.locationId === locationId);
    if (locDrafts.length === 0) return { isValid: false, gaps: ['00:00 - 24:00'] };

    // Convert HH:MM to minutes from midnight
    const getMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Intervals in [start, end] minutes
    const intervals: [number, number][] = [];
    locDrafts.forEach(s => {
      const start = getMinutes(s.startTime);
      const end = getMinutes(s.endTime);
      if (end < start) {
        // cross midnight (wrap-around)
        intervals.push([start, 1440]);
        intervals.push([0, end]);
      } else {
        intervals.push([start, end]);
      }
    });

    // Sort intervals by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Merge intervals
    const merged: [number, number][] = [];
    for (const interval of intervals) {
      if (merged.length === 0) {
        merged.push([...interval]);
      } else {
        const prev = merged[merged.length - 1];
        if (interval[0] <= prev[1]) {
          // overlap or contiguous
          prev[1] = Math.max(prev[1], interval[1]);
        } else {
          merged.push([...interval]);
        }
      }
    }

    // Find gaps
    const gaps: string[] = [];
    let lastEnd = 0;
    for (const [start, end] of merged) {
      if (start > lastEnd) {
        gaps.push(`${formatMinutesToHHMM(lastEnd)} - ${formatMinutesToHHMM(start)}`);
      }
      lastEnd = end;
    }
    if (lastEnd < 1440) {
      gaps.push(`${formatMinutesToHHMM(lastEnd)} - 24:00`);
    }

    return {
      isValid: gaps.length === 0,
      gaps
    };
  };

  // ============================================================================
  // HELPERS & VALIDATION LOGIC
  // ============================================================================

  const currentLoggedInUser = volunteers.find(v => v.id === selectedSimUser);

  // Automatically update the default session when switching simulated users based on location
  useEffect(() => {
    if (currentLoggedInUser) {
      const locSessions = sessions.filter(s => s.locationId === currentLoggedInUser.locationId);
      if (locSessions.length > 0) {
        setSelectedMiniAppSessionId(locSessions[0].id);
      }
    }
  }, [selectedSimUser, sessions]);

  const addTelegramLog = (type: 'GROUP' | 'SUPERIOR' | 'REMINDER', target: string, message: string) => {
    const newLog: TelegramLog = {
      id: 'T_' + Date.now() + Math.random(),
      timestamp: simTime,
      type,
      target,
      message
    };
    setTelegramLogs(prev => [newLog, ...prev]);
  };

  // Check if two HH:MM time ranges overlap
  const checkTimeRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const getMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    let s1 = getMinutes(start1);
    let e1 = getMinutes(end1);
    let s2 = getMinutes(start2);
    let e2 = getMinutes(end2);

    // Support wrap-around for midnight sessions (e.g., 20:00 to 04:00)
    const splitIntervals = (start: number, end: number) => {
      if (end < start) {
        // Midnight crossing
        return [[start, 1440], [0, end]];
      }
      return [[start, end]];
    };

    const ranges1 = splitIntervals(s1, e1);
    const ranges2 = splitIntervals(s2, e2);

    for (const r1 of ranges1) {
      for (const r2 of ranges2) {
        if (Math.max(r1[0], r2[0]) < Math.min(r1[1], r2[1])) {
          return true; // Overlap detected
        }
      }
    }
    return false;
  };

  // Overlap prevention for continuous sessions during creation (adds to draft planner)
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setOverlapError(null);

    if (!newSessionName.trim()) {
      setOverlapError('🚨 Session/Roster Name is a mandatory field.');
      return;
    }
    if (newSessionLocs.length === 0) {
      setOverlapError('🚨 Target Location is a mandatory field (at least one must be selected).');
      return;
    }

    setIsActionLoading(true);

    setTimeout(() => {
      // Check overlaps in draft sessions for each of the selected locations
      const newSessionsToAdd: SimulatedSession[] = [];
      let overlapDetected = false;

      for (const locId of newSessionLocs) {
        const sameLocDrafts = draftSessions.filter(s => s.locationId === locId);
        const hasOverlap = sameLocDrafts.some(s => 
          checkTimeRangesOverlap(newSessionStart, newSessionEnd, s.startTime, s.endTime)
        );

        if (hasOverlap) {
          const locName = locations.find(l => l.id === locId)?.name || locId;
          setOverlapError(`🚨 OVERLAP PREVENTED: The proposed timing conflicts with an already drafted roster slot at "${locName}". Please adjust.`);
          overlapDetected = true;
          break;
        }

        const newSessionId = 'SES_DRAFT_' + Math.random().toString(36).substring(2, 9);
        const newSession: SimulatedSession = {
          id: newSessionId,
          name: newSessionName,
          locationId: locId,
          startTime: newSessionStart,
          endTime: newSessionEnd,
          isMandatory: newSessionMandatory,
          marginBackMin: newSessionMargin,
          reminderInMin: 10,
          reminderOutMin: 10
        };
        newSessionsToAdd.push(newSession);
      }

      if (!overlapDetected) {
        setDraftSessions(prev => [...prev, ...newSessionsToAdd]);
        setNewSessionName('');
        setOverlapError(null);
      }
      setIsActionLoading(false);
    }, 300);
  };

  const handleDeleteDraftSession = (id: string) => {
    setDraftSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleDeployDraftSessions = (locationId: string) => {
    const coverageResult = validate24HourCoverage(locationId, draftSessions);
    if (!coverageResult.isValid) {
      alert(`❌ Cannot Save: The sessions do not cover the 24-hour period entirely! Gaps remaining: ${coverageResult.gaps.join(', ')}. All 24 hours must be covered without breaks before deploying.`);
      return;
    }

    setIsActionLoading(true);
    setTimeout(() => {
      setSessions(prev => {
        // Keep other locations, replace only this location's sessions with the fully validated drafts
        const otherLocSessions = prev.filter(s => s.locationId !== locationId);
        const locNewSessions = draftSessions.filter(s => s.locationId === locationId).map((s, index) => ({
          ...s,
          id: s.id.startsWith('SES_DRAFT_') ? `SES_DEP_${locationId}_${index + 1}` : s.id
        }));
        return [...otherLocSessions, ...locNewSessions];
      });
      setIsActionLoading(false);
      alert(`✅ Continuous 24-Hour Configuration Successfully Verified & Deployed! All session roster changes for ${locations.find(l => l.id === locationId)?.name} have been saved at once.`);
    }, 400);
  };

  // Add new whitelisted volunteer
  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim()) {
      alert('❌ Name is a mandatory field.');
      return;
    }
    if (!newVolTg.trim()) {
      alert('❌ Telegram Account ID is a mandatory field.');
      return;
    }
    if (!newVolLoc) {
      alert('❌ Primary Location is a mandatory field.');
      return;
    }
    if (newVolGroups.length === 0) {
      alert('❌ Group Membership is a mandatory field.');
      return;
    }

    setIsActionLoading(true);
    setTimeout(() => {
      const isDuplicate = volunteers.some(v => v.telegramId === newVolTg);
      if (isDuplicate) {
        alert('❌ Duplicate Telegram ID: This Telegram Account ID is already registered in the whitelist.');
        setIsActionLoading(false);
        return;
      }

      const newV: SimulatedVolunteer = {
        id: 'VOL_' + (volunteers.length + 1) + '_' + Math.random().toString(36).substring(2, 5),
        name: newVolName,
        telegramId: newVolTg,
        locationId: newVolLoc,
        groupIds: newVolGroups,
        canResolveApprovals: newVolCanResolve,
        isActive: true
      };

      setVolunteers(prev => [...prev, newV]);
      setNewVolName('');
      setNewVolTg('');
      setSelectedPersonId('');
      setNewVolGroups(['GRP_VOL']);
      setNewVolCanResolve(false);
      setIsActionLoading(false);
    }, 300);
  };

  // Edit whitelisted volunteer states and handlers
  const handleStartEditVolunteer = (vol: SimulatedVolunteer) => {
    setEditingVolId(vol.id);
    setNewVolName(vol.name);
    setNewVolTg(vol.telegramId);
    setNewVolLoc(vol.locationId);
    setNewVolGroups(vol.groupIds);
    setNewVolCanResolve(vol.canResolveApprovals);
    // Find matching person from directory if possible
    const match = peopleFromList.find(p => p.telegramId === vol.telegramId);
    if (match) {
      setSelectedPersonId(match.personId);
    } else {
      setSelectedPersonId('CUSTOM');
    }
  };

  const handleSaveEditVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim() || !newVolTg.trim() || !newVolLoc || newVolGroups.length === 0) {
      alert('❌ All fields (Name, Telegram ID, Location, Membership) are mandatory and must be supplied.');
      return;
    }

    setIsActionLoading(true);
    setTimeout(() => {
      setVolunteers(prev => prev.map(v => 
        v.id === editingVolId 
          ? { 
              ...v, 
              name: newVolName, 
              telegramId: newVolTg, 
              locationId: newVolLoc, 
              groupIds: newVolGroups, 
              canResolveApprovals: newVolCanResolve 
            }
          : v
      ));

      setEditingVolId(null);
      setNewVolName('');
      setNewVolTg('');
      setSelectedPersonId('');
      setNewVolGroups(['GRP_VOL']);
      setNewVolCanResolve(false);
      setIsActionLoading(false);
      alert('✅ Whitelisted volunteer information updated successfully!');
    }, 300);
  };

  const handleCancelEditVolunteer = () => {
    setEditingVolId(null);
    setNewVolName('');
    setNewVolTg('');
    setSelectedPersonId('');
    setNewVolGroups(['GRP_VOL']);
    setNewVolCanResolve(false);
  };

  // Convert simulated time to Date object
  const getSimulatedDateTimeObj = (timeStr: string) => {
    return new Date(`${simDate}T${timeStr}:00`);
  };

  // ============================================================================
  // ATTENDANCE ACTIONS
  // ============================================================================

  // User requests Punch-In via Mini App
  const handlePunchIn = () => {
    if (!currentLoggedInUser) return;
    
    const activeSession = sessions.find(s => s.id === selectedMiniAppSessionId);
    if (!activeSession) return;

    // Check if user is already checked in for this session/date but missing punch-out
    const uncompletedRecord = records.find(r => 
      r.userId === currentLoggedInUser.id && 
      r.sessionId === activeSession.id && 
      r.date === simDate && 
      r.status === 'Present' && 
      !r.punchOutTime
    );

    if (uncompletedRecord) {
      // Force completing previous punch-out
      setMissingRecordToClose(uncompletedRecord);
      setMissingPunchOutTimeInput(simTime);
      setMissingPunchOutModal(true);
      return;
    }

    // Determine target punch in time factoring in margin back selection
    const computedPunchInTimeObj = new Date(getSimulatedDateTimeObj(simTime).getTime() - (customPunchInOffset * 60000));
    const punchInHHMM = computedPunchInTimeObj.toTimeString().substring(0, 5);

    // Rule: Punch in time cannot precede session start time
    const sessionStartObj = getSimulatedDateTimeObj(activeSession.startTime);
    if (computedPunchInTimeObj < sessionStartObj) {
      alert(`❌ Invalid Punch In: Punch-in time (${punchInHHMM}) cannot precede the session start time (${activeSession.startTime})!`);
      return;
    }

    // Check first person claim logic scoped to current session and location
    const otherSessionsRecords = records.filter(r => 
      r.sessionId === activeSession.id && 
      r.locationId === currentLoggedInUser.locationId && 
      r.date === simDate && 
      r.status === 'Present'
    );

    const approvedFirstPerson = otherSessionsRecords.find(r => r.firstPersonClaimed && r.approvalStatus === 'Approved');

    let approvalStatus: 'Approved' | 'Pending' | 'Rejected' = 'Pending';
    let disputeNotes = 'Pending peer vouching or supervisor approval.';
    let disputedByUserId = '';

    if (isFirstPersonCheck) {
      if (approvedFirstPerson) {
        // Dispute triggered! Both entries flag as Pending Approvals for superiors to resolve
        approvalStatus = 'Pending';
        disputeNotes = `First-person claim disputed. ${volunteers.find(v => v.id === approvedFirstPerson.userId)?.name} already asserted first-person status.`;
        disputedByUserId = approvedFirstPerson.userId;

        // Mark the previous one as Pending too for superior audit
        setRecords(prev => prev.map(r => 
          r.id === approvedFirstPerson.id 
            ? { ...r, approvalStatus: 'Pending', notes: `Disputed arrival claimed by ${currentLoggedInUser.name}` }
            : r
        ));

        // Dispatch alert logs
        addTelegramLog('SUPERIOR', 'Superiors Admin Group', `🚨 DISPUTE REPORTED: ${currentLoggedInUser.name} claims to be the first arrival at ${activeSession.name}, disputing ${volunteers.find(v => v.id === approvedFirstPerson.userId)?.name}. Requires superior resolution.`);
      } else {
        approvalStatus = 'Approved';
        disputeNotes = 'First person to open. Approved center opener.';
        addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser.locationId)?.name} Group`, `🔑 ${currentLoggedInUser.name} opened the office center for session ${activeSession.name}.`);
      }
    } else {
      // Standard punch-in starts as Pending, waiting for peer vouching
      approvalStatus = 'Pending';
      disputeNotes = 'Pending peer vouch or supervisor approval.';
    }

    const newRecord: SimulatedAttendanceRecord = {
      id: 'REC_' + Date.now(),
      userId: currentLoggedInUser.id,
      date: simDate,
      sessionId: activeSession.id,
      locationId: currentLoggedInUser.locationId,
      status: 'Present',
      punchInTime: punchInHHMM,
      firstPersonClaimed: isFirstPersonCheck,
      approvalStatus,
      disputedByUserId,
      notes: disputeNotes
    };

    setRecords(prev => [...prev, newRecord]);
    addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser.locationId)?.name} Group`, `✅ ${currentLoggedInUser.name} punched in for session ${activeSession.name} at ${punchInHHMM} (${approvalStatus === 'Pending' ? '⚠️ Pending Vouch' : 'Approved'}).`);
    
    // Clear forms
    setIsFirstPersonCheck(false);
    setCustomPunchInOffset(0);
  };

  // Peer Vouch Handler
  const handlePeerVouch = (recordId: string) => {
    if (!currentLoggedInUser) return;

    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          approvalStatus: 'Approved',
          notes: `Peer vouched by ${currentLoggedInUser.name} at ${simTime}`
        };
      }
      return r;
    }));

    const rec = records.find(r => r.id === recordId);
    if (rec) {
      const peer = volunteers.find(v => v.id === rec.userId);
      const ses = sessions.find(s => s.id === rec.sessionId);
      addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser.locationId)?.name} Group`, `🤝 PEER VOUCH: ${currentLoggedInUser.name} vouched for ${peer?.name} for session ${ses?.name}. Attendance Approved!`);
    }
  };

  // Force resolution of missing punch out
  const handleResolveMissingPunchOut = () => {
    if (!missingRecordToClose) return;

    // Validate that punch-out is after punch-in
    const pin = missingRecordToClose.punchInTime || '';
    const pout = missingPunchOutTimeInput;

    if (pout <= pin) {
      alert(`❌ Invalid punch-out: Punch-out time (${pout}) must be after punch-in time (${pin}).`);
      return;
    }

    setRecords(prev => prev.map(r => 
      r.id === missingRecordToClose.id 
        ? { ...r, punchOutTime: pout }
        : r
    ));

    setMissingPunchOutModal(false);
    setMissingRecordToClose(null);
    addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser?.locationId)?.name} Group`, `⏱️ Recorded missing punch-out for previous session at ${pout}.`);
  };

  // Submit Leave request (must be prior to session start)
  const handleMarkLeave = () => {
    if (!currentLoggedInUser) return;
    const activeSession = sessions.find(s => s.id === selectedMiniAppSessionId);
    if (!activeSession) return;

    if (!leaveReason.trim()) {
      alert('❌ Leave reason is mandatory!');
      return;
    }

    const sessionStart = activeSession.startTime;
    // Check if current simulated time is past session start
    if (simTime > sessionStart) {
      alert('❌ Leave requests must be submitted prior to the session start time.');
      return;
    }

    const newRecord: SimulatedAttendanceRecord = {
      id: 'REC_' + Date.now(),
      userId: currentLoggedInUser.id,
      date: simDate,
      sessionId: activeSession.id,
      locationId: currentLoggedInUser.locationId,
      status: 'Leave',
      reason: leaveReason,
      firstPersonClaimed: false,
      approvalStatus: 'Approved'
    };

    setRecords(prev => [...prev, newRecord]);
    addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser.locationId)?.name} Group`, `📢 ${currentLoggedInUser.name} is on Leave for the session ${activeSession.name}.`);
    addTelegramLog('SUPERIOR', 'Superiors Admin Group', `🔔 LEAVE SUBMITTED: ${currentLoggedInUser.name} applied for leave (${activeSession.name}). Reason: "${leaveReason}"`);
    
    setLeaveReason('');
  };

  // Punch Out current active session
  const handlePunchOut = (recordId: string) => {
    setRecords(prev => prev.map(r => 
      r.id === recordId 
        ? { ...r, punchOutTime: simTime }
        : r
    ));

    const rec = records.find(r => r.id === recordId);
    const ses = sessions.find(s => s.id === rec?.sessionId);
    addTelegramLog('GROUP', `${locations.find(l => l.id === currentLoggedInUser?.locationId)?.name} Group`, `🚪 ${currentLoggedInUser?.name} punched out of session ${ses?.name} at ${simTime}.`);
  };

  // ============================================================================
  // SUPERVISOR WORKFLOW RESOLUTIONS
  // ============================================================================

  const handleResolvePendingClaim = (recordId: string, action: 'Approve' | 'Reject', overridePunchOut?: string) => {
    const supervisor = currentLoggedInUser;
    if (!supervisor || !supervisor.canResolveApprovals) {
      alert('❌ Authorization Denied: Only whitelisted superiors can resolve Pending Approvals.');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        let notes = `Resolved by superior: ${supervisor.name} as ${action}d.`;
        if (overridePunchOut) {
          notes += ` Custom punch-out overridden to ${overridePunchOut}.`;
        }
        return { 
          ...r, 
          approvalStatus: action === 'Approve' ? 'Approved' : 'Rejected',
          punchOutTime: overridePunchOut || r.punchOutTime,
          approverUserId: supervisor.id,
          notes
        };
      }
      return r;
    }));

    const record = records.find(r => r.id === recordId);
    const applicant = volunteers.find(v => v.id === record?.userId);
    const session = sessions.find(s => s.id === record?.sessionId);

    addTelegramLog('SUPERIOR', 'Superiors Admin Group', `🛡️ RESOLVED: ${supervisor.name} ${action === 'Approve' ? 'APPROVED' : 'REJECTED'} the disputed first-person claim of ${applicant?.name} for ${session?.name}.`);
  };

  // ============================================================================
  // CRON TASK TRIGGERS & SWEEPS
  // ============================================================================

  // Auto Absent Sweep: If session ended and no punch-in or leave, auto mark Absent
  const runAutoAbsentSweep = () => {
    let sweptCount = 0;
    const activeMandatorySessions = sessions.filter(s => s.isMandatory);

    activeMandatorySessions.forEach(session => {
      // Find all whitelisted volunteers for this location
      const locationVolunteers = volunteers.filter(v => v.locationId === session.locationId && v.isActive);

      locationVolunteers.forEach(vol => {
        // Check if vol belongs to an excluded group
        const isExcluded = vol.groupIds.some(gId => groups.find(g => g.id === gId)?.isExcluded);
        if (isExcluded) return;

        // Check if record exists for today
        const recordExists = records.some(r => r.userId === vol.id && r.sessionId === session.id && r.date === simDate);

        if (!recordExists) {
          // If simulated current time is past the session's end time, commit absence
          if (simTime >= session.endTime) {
            const newRecord: SimulatedAttendanceRecord = {
              id: 'REC_AUTO_ABS_' + Date.now() + Math.random(),
              userId: vol.id,
              date: simDate,
              sessionId: session.id,
              locationId: session.locationId,
              status: 'Absent',
              reason: 'Auto-marked absent: Missing attendance/leave check',
              firstPersonClaimed: false,
              approvalStatus: 'Approved',
              notes: 'SYSTEM AUTO-MARK'
            };
            setRecords(prev => [...prev, newRecord]);
            addTelegramLog('GROUP', `${locations.find(l => l.id === session.locationId)?.name} Group`, `⚠️ ${vol.name} was marked Absent for mandatory session: ${session.name}.`);
            addTelegramLog('SUPERIOR', 'Superiors Admin Group', `🚨 ABSENT TRIGGER: ${vol.name} marked absent for mandatory ${session.name}. No check-in or leave recorded.`);
            sweptCount++;
          }
        }
      });
    });

    if (sweptCount > 0) {
      alert(`🧹 Auto-Absent Sweep Completed! Marked ${sweptCount} volunteers absent.`);
    } else {
      alert(`🧹 Sweep completed: No new absences detected based on current simulated time (${simTime}).`);
    }
  };

  // Auto Punch-out: If user is checked in but session has expired, close the log at session end time minus back margin
  const runAutoPunchOutSweep = () => {
    let sweptCount = 0;

    records.forEach(rec => {
      if (rec.date === simDate && rec.status === 'Present' && !rec.punchOutTime) {
        const session = sessions.find(s => s.id === rec.sessionId);
        if (session && simTime >= session.endTime) {
          // Adjust punch out automatically to session end time
          setRecords(prev => prev.map(r => 
            r.id === rec.id 
              ? { ...r, punchOutTime: session.endTime, notes: 'SYSTEM AUTO-PUNCH-OUT' }
              : r
          ));
          const vol = volunteers.find(v => v.id === rec.userId);
          addTelegramLog('GROUP', `${locations.find(l => l.id === rec.locationId)?.name} Group`, `🚪 SYSTEM: Auto punched-out ${vol?.name} for expired session ${session.name} at ${session.endTime}.`);
          sweptCount++;
        }
      }
    });

    if (sweptCount > 0) {
      alert(`🧹 Auto Punch-Out Sweep Completed! Closed ${sweptCount} active logs.`);
    } else {
      alert('🧹 Sweep completed: No expired logs detected.');
    }
  };

  // Trigger reminders
  const triggerSessionStartReminders = () => {
    const activeLocSessions = sessions.filter(s => s.locationId === currentLoggedInUser?.locationId);
    let sentCount = 0;

    activeLocSessions.forEach(session => {
      // If current time is past start time but before end time
      if (simTime >= session.startTime && simTime < session.endTime) {
        const sameLocVols = volunteers.filter(v => v.locationId === session.locationId && v.isActive);

        sameLocVols.forEach(v => {
          const isExcluded = v.groupIds.some(gId => groups.find(g => g.id === gId)?.isExcluded);
          if (isExcluded) return;

          const record = records.find(r => r.userId === v.id && r.sessionId === session.id && r.date === simDate);
          
          // Reminder: Not checked-in, not on leave
          if (!record) {
            addTelegramLog('REMINDER', `${locations.find(l => l.id === session.locationId)?.name} Group`, `🔔 REMINDER TO ${v.name}: The mandatory session "${session.name}" has started at ${session.startTime}. Please mark your attendance or request leave!`);
            sentCount++;
          }
        });
      }
    });

    alert(`📲 Reminders dispatched: Sent ${sentCount} Telegram alerts to volunteers who haven't marked attendance/leave.`);
  };

  // Delete session helper
  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Delete volunteer helper
  const handleDeleteVolunteer = (id: string) => {
    setVolunteers(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-[var(--main-background)] min-h-screen text-[var(--foreground)]" id="attendance-simulator-root">
      
      {/* HEADER CONTROLS: Global Simulators & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-sky-500/10 text-sky-400 border border-sky-500/30">SIMULATOR CONTROLS</Badge>
            <span className="text-[10px] text-slate-500 font-mono">Date: {simDate}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Telegram Attendance & Messaging Simulator</h1>
          <p className="text-xs text-slate-400">Validate real-time vouch approvals, continuous sessions, automatic leave alerts, and auto-punch out triggers.</p>
        </div>

        {/* Global Clock Control */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Simulated Clock:</span>
          </div>
          
          <input 
            type="time" 
            value={simTime}
            onChange={(e) => setSimTime(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white font-mono font-bold px-2 py-1 rounded outline-none focus:border-amber-500 text-xs"
          />

          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const [h, m] = simTime.split(':').map(Number);
                const totalMins = (h * 60 + m + 30) % 1440;
                const nextH = String(Math.floor(totalMins / 60)).padStart(2, '0');
                const nextM = String(totalMins % 60).padStart(2, '0');
                setSimTime(`${nextH}:${nextM}`);
              }}
              className="text-[10px] px-2 py-1 h-auto bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              +30m
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const [h, m] = simTime.split(':').map(Number);
                const nextH = String((h + 4) % 24).padStart(2, '0');
                setSimTime(`${nextH}:${String(m).padStart(2, '0')}`);
              }}
              className="text-[10px] px-2 py-1 h-auto bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              +4h
            </Button>
          </div>

          <div className="border-l border-slate-800 pl-2 flex gap-1">
            <Button 
              size="sm" 
              className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold h-auto py-1.5 px-2.5 flex items-center gap-1"
              onClick={runAutoAbsentSweep}
            >
              Sweep Absent
            </Button>
            <Button 
              size="sm" 
              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-auto py-1.5 px-2.5 flex items-center gap-1"
              onClick={runAutoPunchOutSweep}
            >
              Sweep Punch-Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ====================================================================
            LEFT PANEL: Simulated Telegram App Frame with Mini App (5 Cols)
            ==================================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          {/* Simulated Mobile Device container */}
          <div className="w-full max-w-[370px] bg-slate-950 rounded-[40px] border-[10px] border-slate-800 shadow-2xl p-4 min-h-[640px] flex flex-col relative overflow-hidden">
            
            {/* Top Speaker/Camera Slot */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-900 rounded-full"></div>
            </div>

            {/* Simulated Status Bar */}
            <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-slate-400 font-mono font-medium z-10">
              <span>{simTime}</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-4 h-2 bg-slate-400 rounded-sm"></div>
              </div>
            </div>

            {/* Simulated Chat Interface */}
            <div className="flex-1 bg-[#101b26] rounded-2xl p-3 flex flex-col justify-between overflow-y-auto">
              
              {!appOpen ? (
                // Chat context when app is closed
                <div className="flex flex-col h-full justify-between">
                  
                  {/* Chat messages history */}
                  <div className="flex-1 flex flex-col gap-3 justify-end pb-4 overflow-y-auto">
                    
                    {/* Bot Message */}
                    <div className="flex items-start gap-2 max-w-[85%] self-start">
                      <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="bg-[#182533] text-white p-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow">
                        <p className="font-bold text-sky-400 text-[10px] mb-0.5">BK Attendance Bot</p>
                        Om Shanti! Please click below to verify your session attendance or report Leave.
                      </div>
                    </div>

                    <div className="bg-[#182533]/50 p-2 border border-slate-800 rounded-xl text-center text-[10px] text-slate-400">
                      Simulating Active User: <strong className="text-white">{currentLoggedInUser?.name}</strong> <br />
                      Primary Location: <span className="text-amber-400">{locations.find(l => l.id === currentLoggedInUser?.locationId)?.name}</span>
                    </div>

                  </div>

                  {/* Launch trigger button */}
                  <div className="p-1 border-t border-slate-900/40">
                    <button 
                      onClick={() => setAppOpen(true)}
                      className="w-full bg-[#3390ec] hover:bg-[#2b7ecf] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Smartphone size={14} />
                      Open Attendance Mini App 📱
                    </button>
                  </div>
                </div>
              ) : (
                
                // Active Web App View inside Iframe/Container
                <div className="flex-1 bg-[#18222d] border border-slate-800 rounded-xl p-3 flex flex-col justify-between text-xs text-white">
                  
                  {/* Web App Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-sky-400" />
                      <span className="font-bold text-[11px] truncate max-w-[150px]">
                        {locations.find(l => l.id === currentLoggedInUser?.locationId)?.name || 'Unassigned'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setAppOpen(false)}
                      className="text-[10px] font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded"
                    >
                      Exit
                    </button>
                  </div>

                  {/* MINI APP CORE SCROLLABLE PORTAL */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                    
                    {/* User Quick Info */}
                    <div className="bg-[#1e2c3a] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Volunteer</span>
                        {currentLoggedInUser?.canResolveApprovals && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">SUPERIOR</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-100">{currentLoggedInUser?.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {currentLoggedInUser?.telegramId}</p>
                    </div>

                    {/* SELECT SESSION SELECTOR */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Shift / Session Slot</label>
                      <select 
                        value={selectedMiniAppSessionId}
                        onChange={(e) => setSelectedMiniAppSessionId(e.target.value)}
                        className="bg-[#1e2c3a] border border-slate-800 text-white rounded-lg p-2 text-xs outline-none focus:border-sky-500 w-full font-medium"
                      >
                        {sessions
                          .filter(s => s.locationId === currentLoggedInUser?.locationId)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.startTime} - {s.endTime}) {s.isMandatory ? '★' : ''}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Check if already marked Leave or Present for this session */}
                    {(() => {
                      const activeSession = sessions.find(s => s.id === selectedMiniAppSessionId);
                      const record = records.find(r => 
                        r.userId === currentLoggedInUser?.id && 
                        r.sessionId === activeSession?.id && 
                        r.date === simDate
                      );

                      if (record) {
                        return (
                          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center flex flex-col items-center gap-2">
                            <h4 className="font-bold text-slate-300">Your Action Saved</h4>
                            {record.status === 'Present' ? (
                              <>
                                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle size={14} /> Checked-In at {record.punchInTime}
                                </div>
                                {record.punchOutTime ? (
                                  <div className="text-[10px] text-slate-400">
                                    🚪 Punched Out at: <strong className="text-white">{record.punchOutTime}</strong>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] mt-1"
                                    onClick={() => handlePunchOut(record.id)}
                                  >
                                    Punch Out Now
                                  </Button>
                                )}
                              </>
                            ) : (
                              <div className="text-amber-400 font-bold flex items-center gap-1">
                                <Calendar size={14} /> On Leave: "{record.reason}"
                              </div>
                            )}

                            {record.approvalStatus === 'Pending' && (
                              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-400 font-medium text-left mt-1 flex flex-col gap-1">
                                <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[9px] text-amber-500">
                                  <AlertTriangle size={12} /> Pending Verification
                                </span>
                                <p className="text-[9px] leading-normal text-slate-300">
                                  {record.firstPersonClaimed 
                                    ? "Dispute Active: Multiple 'first person' opening claims declared. Supervisor review required."
                                    : "Attendance is pending peer vouching or coordinator approval. Ask another checked-in peer to vouch for you."}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // NO RECORD FOUND FOR THE MAPPED VOLUNTEER
                      const isPastStart = activeSession ? simTime > activeSession.startTime : false;

                      return (
                        <div className="flex flex-col gap-3">
                          
                          {/* LEAVE BOX (Only allowed before session start) */}
                          <div className="bg-[#1e2c3a] p-3 rounded-xl border border-slate-800">
                            <h4 className="font-bold text-amber-400 mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                              <Calendar size={12} /> Mark Leave (Prior to Session)
                            </h4>
                            {isPastStart ? (
                              <p className="text-[10px] text-slate-500 leading-normal">
                                🚫 Leave option disabled. This session already started at {activeSession?.startTime}. Unmarked entries will trigger "Absent" sweeps.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <input 
                                  type="text"
                                  placeholder="Mandatory Leave Reason... *"
                                  value={leaveReason}
                                  onChange={(e) => setLeaveReason(e.target.value)}
                                  className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs outline-none focus:border-amber-500 text-white"
                                />
                                <Button 
                                  size="sm" 
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px]"
                                  onClick={handleMarkLeave}
                                >
                                  Submit Leave Request
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* PUNCH-IN BOX */}
                          <div className="bg-[#1e2c3a] p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <h4 className="font-bold text-emerald-400 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                              <UserCheck size={12} /> Record Punch In
                            </h4>

                            {/* Margin Back Time Range Slider */}
                            <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/50">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Back-Margin Offset Slider</span>
                                <span className="text-amber-400 font-mono font-bold">-{customPunchInOffset} mins</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max={activeSession?.marginBackMin || 30}
                                value={customPunchInOffset}
                                onChange={(e) => setCustomPunchInOffset(Number(e.target.value))}
                                className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                              />
                              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                                <span>0m (Real-time)</span>
                                <span>-{activeSession?.marginBackMin || 30}m (Max Limit)</span>
                              </div>
                              <div className="text-[10px] text-slate-300 font-mono text-center pt-1 border-t border-slate-900/50 mt-1">
                                Adjusted In-Time: <strong className="text-emerald-400 font-bold font-mono text-xs">{
                                  (() => {
                                    const computed = new Date(getSimulatedDateTimeObj(simTime).getTime() - (customPunchInOffset * 60000));
                                    return computed.toTimeString().substring(0, 5);
                                  })()
                                }</strong>
                              </div>
                            </div>

                            {/* "I am the First Person" switch */}
                            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg mt-0.5 border border-slate-850">
                              <input 
                                type="checkbox"
                                id="first-person-chk"
                                checked={isFirstPersonCheck}
                                onChange={(e) => setIsFirstPersonCheck(e.target.checked)}
                                className="accent-emerald-500 rounded cursor-pointer"
                              />
                              <label htmlFor="first-person-chk" className="text-[10px] text-slate-300 font-medium cursor-pointer">
                                I am first here (Assert opening) 🔑
                              </label>
                            </div>

                            <Button 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-1 py-2"
                              onClick={handlePunchIn}
                            >
                              Punch In Now
                            </Button>
                          </div>

                        </div>
                      );
                    })()}

                    {/* INTERACTIVE PEER VOUCHING PORTAL */}
                    {currentLoggedInUser && (
                      <div className="bg-[#1e2c3a] p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 mt-1">
                        <h4 className="font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <Users size={12} /> Vouch for Present Peers 🤝
                        </h4>
                        <p className="text-[9px] text-slate-400 leading-normal mb-1">
                          Verify attendance of fellow volunteers at {locations.find(l => l.id === currentLoggedInUser.locationId)?.name || 'your location'}.
                        </p>
                        {(() => {
                          const pendingPeers = records.filter(r => 
                            r.locationId === currentLoggedInUser.locationId && 
                            r.date === simDate && 
                            r.approvalStatus === 'Pending' && 
                            r.userId !== currentLoggedInUser.id
                          );

                          if (pendingPeers.length === 0) {
                            return (
                              <p className="text-[9px] text-slate-500 italic text-center py-2.5 bg-slate-950/35 rounded-lg border border-slate-900/60">
                                No colleagues currently waiting for peer vouching.
                              </p>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {pendingPeers.map(rec => {
                                const peer = volunteers.find(v => v.id === rec.userId);
                                const peerSession = sessions.find(s => s.id === rec.sessionId);
                                return (
                                  <div key={rec.id} className="bg-slate-950 p-2 rounded-lg border border-slate-900/60 flex justify-between items-center text-[10px] gap-2">
                                    <div className="flex flex-col gap-0.5 truncate max-w-[65%]">
                                      <strong className="text-slate-200 truncate block">{peer?.name}</strong>
                                      <span className="text-[8px] text-slate-400 font-mono truncate block">
                                        {peerSession?.name} (In: {rec.punchInTime})
                                      </span>
                                    </div>
                                    <Button 
                                      size="sm"
                                      className="bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-bold px-2.5 py-1 h-auto rounded-md"
                                      onClick={() => handlePeerVouch(rec.id)}
                                    >
                                      Vouch 🤝
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* PUNCH SEGMENTS LOG FOR TODAY */}
                    <div className="mt-2 border-t border-slate-800 pt-2">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Today's Punch History</span>
                      <div className="flex flex-col gap-1.5 mt-1">
                        {records
                          .filter(r => r.userId === currentLoggedInUser?.id && r.date === simDate)
                          .map((r, i) => {
                            const ses = sessions.find(s => s.id === r.sessionId);
                            return (
                              <div key={i} className="bg-slate-900/40 p-2 rounded border border-slate-800/80 flex justify-between items-center">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-[10px] text-slate-200">{ses?.name}</span>
                                  <span className="text-[9px] text-slate-400">
                                    {r.status === 'Present' ? `In: ${r.punchInTime} ${r.punchOutTime ? `| Out: ${r.punchOutTime}` : '(Active)'}` : `Leave: "${r.reason}"`}
                                  </span>
                                </div>
                                <Badge variant={r.status === 'Present' ? 'success' : 'warning'}>
                                  {r.status === 'Present' ? 'Present' : 'Leave'}
                                </Badge>
                              </div>
                            );
                          })
                        }
                        {records.filter(r => r.userId === currentLoggedInUser?.id && r.date === simDate).length === 0 && (
                          <p className="text-[10px] text-slate-500 italic">No attendance records submitted today.</p>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>

          {/* SIMULATOR SWITCH LOGIN PROFILE HELPER */}
          <div className="mt-4 w-full max-w-[370px] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <h4 className="font-bold text-xs text-white mb-2 flex items-center gap-1">
              <Users size={14} className="text-sky-400" />
              Switch Logged-In Identity
            </h4>
            <p className="text-[10px] text-slate-400 mb-3">Swap between standard volunteers, leaders, and excluded profiles to test distinct access controls.</p>
            <div className="flex flex-col gap-1.5">
              {volunteers.map(vol => {
                const isExcluded = vol.groupIds.some(gId => groups.find(g => g.id === gId)?.isExcluded);
                return (
                  <button 
                    key={vol.id}
                    onClick={() => {
                      setSelectedSimUser(vol.id);
                    }}
                    className={`p-2 rounded-xl text-left border text-xs flex justify-between items-center transition-all ${vol.id === selectedSimUser ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold' : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900'}`}
                  >
                    <div>
                      <p>{vol.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        Group: {vol.groupIds.join(', ')} {isExcluded ? '(Excluded)' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {vol.canResolveApprovals && (
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded">SUPERIOR</span>
                      )}
                      {vol.id === selectedSimUser && <span className="text-sky-400">●</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ====================================================================
            RIGHT PANEL: Interactive Controls, Settings, Overlap & Disputes (7 Cols)
            ==================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
            <button 
              onClick={() => setActiveRightTab('pending')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeRightTab === 'pending' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck size={14} />
              Pending Approvals ({records.filter(r => r.approvalStatus === 'Pending').length})
            </button>
            <button 
              onClick={() => setActiveRightTab('sessions')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeRightTab === 'sessions' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Sliders size={14} />
              Session Config
            </button>
            <button 
              onClick={() => setActiveRightTab('settings')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeRightTab === 'settings' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Users size={14} />
              Whitelist Settings
            </button>
            <button 
              onClick={() => setActiveRightTab('tele_logs')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeRightTab === 'tele_logs' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Bell size={14} />
              Telegram Feed ({telegramLogs.length})
            </button>
          </div>

          {/* TAB 1: PENDING APPROVALS DASHBOARD */}
          {activeRightTab === 'pending' && (
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">Superior Pending Approvals Dashboard</h3>
                  <p className="text-xs text-slate-400">Audit first-person openings, resolve conflicts, and override times.</p>
                </div>
                <Badge variant="primary" className="bg-amber-500/10 text-amber-400 border border-amber-500/30">SECURITY CONTROLS</Badge>
              </div>

              <div className="p-4 flex flex-col gap-4">
                
                {/* Pending List */}
                <div className="flex flex-col gap-3">
                  {records.filter(r => r.approvalStatus === 'Pending').map(rec => {
                    const claimant = volunteers.find(v => v.id === rec.userId);
                    const disputant = volunteers.find(v => v.id === rec.disputedByUserId);
                    const session = sessions.find(s => s.id === rec.sessionId);
                    const loc = locations.find(l => l.id === rec.locationId);

                    return (
                      <div key={rec.id} className="p-4 bg-slate-950 rounded-xl border border-amber-500/20 shadow flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={12} /> FIRST PERSON CLAIM DISPUTE
                            </span>
                            <span className="text-[10px] text-slate-400">Location: <strong>{loc?.name}</strong> | Session: <strong>{session?.name}</strong></span>
                          </div>
                          <Badge variant="warning">CONTESTED</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-900 p-2.5 rounded-lg text-xs">
                          <div className="border-r border-slate-800 pr-2">
                            <span className="text-[10px] text-slate-400 block">Claimant A</span>
                            <strong className="text-white text-xs">{claimant?.name}</strong>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">In: {rec.punchInTime}</p>
                          </div>
                          <div className="pl-2">
                            <span className="text-[10px] text-slate-400 block">Claimant B (Disputed)</span>
                            <strong className="text-white text-xs">{disputant ? disputant.name : 'Unknown Volunteer'}</strong>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">In Time: Checked in later</p>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 italic">
                          System Diagnostics: Multiple "First Person" open declarations checked for same physical zone on {rec.date}. Verify CCTV logs before approving.
                        </p>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                          {/* Superiors validation */}
                          {currentLoggedInUser?.canResolveApprovals ? (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                                onClick={() => handleResolvePendingClaim(rec.id, 'Reject')}
                              >
                                Reject Claim
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                onClick={() => handleResolvePendingClaim(rec.id, 'Approve')}
                              >
                                Approve Claim
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-mono italic">
                              ⚠️ Switch profile to a superior (e.g. BK Amit Sharma) to resolve this dispute.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {records.filter(r => r.approvalStatus === 'Pending').length === 0 && (
                    <div className="text-center p-8 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-500">
                      <ShieldCheck className="mx-auto mb-2 opacity-30 text-slate-400" size={32} />
                      <p className="font-medium text-xs text-slate-400">All openings clear! No active pending approvals or disputes.</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[320px] mx-auto">To simulate a dispute, log in as User A, punch in as first person, switch profile to User B, select same session, and assert first person opening again.</p>
                    </div>
                  )}
                </div>

                {/* HISTORIC ACTIVITY LIST */}
                <div className="mt-4">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History size={14} className="text-indigo-400" />
                    Historic Attendance Ledger (All Logs Today)
                  </h4>
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                    {records.map((r, i) => {
                      const vol = volunteers.find(v => v.id === r.userId);
                      const ses = sessions.find(s => s.id === r.sessionId);
                      return (
                        <div key={i} className="bg-slate-950 p-2.5 rounded-lg text-xs border border-slate-850 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200">{vol?.name}</span>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto">
                                {ses?.name}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {r.status === 'Present' ? `In: ${r.punchInTime} ${r.punchOutTime ? `| Out: ${r.punchOutTime}` : ''}` : `Leave: "${r.reason}"`}
                            </p>
                            {r.notes && <p className="text-[9px] text-sky-400 font-mono mt-0.5">{r.notes}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold ${r.status === 'Present' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {r.status === 'Present' ? 'Present' : 'Leave'}
                            </span>
                            <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 px-1 py-0.25 rounded font-mono">
                              {r.approvalStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* TAB 2: SESSION CONFIGURATION & OVERLAP PREVENTER */}
          {activeRightTab === 'sessions' && (
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Continuous 24-Hour Session Slots</h3>
                <p className="text-xs text-slate-400">Define continuous, non-overlapping rosters scoped per physical location. Entire 24-hour cycle must be covered without break to save.</p>
              </div>

              <div className="p-4 flex flex-col gap-6">
                
                {/* Active draft workspace picker */}
                <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Location Roster Draft Workspace</label>
                  <select
                    value={activePlannerLoc}
                    onChange={(e) => setActivePlannerLoc(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white rounded p-2 text-xs font-semibold outline-none focus:border-sky-500"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} Draft Roster</option>
                    ))}
                  </select>
                </div>

                {/* Create Session Form */}
                <form onSubmit={handleCreateSession} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Plus size={14} /> Add New Session Slot
                  </h4>

                  {overlapError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs leading-relaxed font-sans">
                      {overlapError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Session/Roster Name *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Afternoon Service"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Target Locations (Multi-Select) *</label>
                      <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto border border-slate-800 p-1 bg-slate-900 rounded">
                        {locations.map(l => {
                          const isChecked = newSessionLocs.includes(l.id);
                          return (
                            <label key={l.id} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setNewSessionLocs(prev => prev.filter(id => id !== l.id));
                                  } else {
                                    setNewSessionLocs(prev => [...prev, l.id]);
                                  }
                                }}
                                className="accent-sky-500 h-3 w-3 rounded"
                              />
                              {l.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Start Time</label>
                      <input 
                        type="time"
                        value={newSessionStart}
                        onChange={(e) => setNewSessionStart(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">End Time</label>
                      <input 
                        type="time"
                        value={newSessionEnd}
                        onChange={(e) => setNewSessionEnd(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Margin Back (Min)</label>
                      <input 
                        type="number"
                        value={newSessionMargin}
                        onChange={(e) => setNewSessionMargin(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 justify-end">
                      <div className="flex items-center gap-1.5 mb-1 bg-slate-900 p-1.5 rounded border border-slate-800">
                        <input 
                          type="checkbox"
                          id="is-mandatory-chk"
                          checked={newSessionMandatory}
                          onChange={(e) => setNewSessionMandatory(e.target.checked)}
                          className="accent-sky-500"
                        />
                        <label htmlFor="is-mandatory-chk" className="text-[10px] text-slate-300 cursor-pointer">Mandatory</label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isActionLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs mt-1 flex items-center justify-center gap-1.5">
                    {isActionLoading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full shrink-0"></span>}
                    Draft Roster Slot (Check Overlaps)
                  </Button>
                </form>

                {/* Draft Sessions list & validation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                    <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sliders size={14} /> Draft Slots for {locations.find(l => l.id === activePlannerLoc)?.name}
                    </h4>
                    {(() => {
                      const result = validate24HourCoverage(activePlannerLoc, draftSessions);
                      return result.isValid ? (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✅ 24-Hour Coverage Validated
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          ⚠️ Missing Coverage
                        </span>
                      );
                    })()}
                  </div>

                  {/* List draft sessions */}
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                    {draftSessions.filter(s => s.locationId === activePlannerLoc).map(s => (
                      <div key={s.id} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-200">{s.name}</strong>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Slot: {s.startTime} - {s.endTime} | Back Margin: {s.marginBackMin}m | Mandatory: {s.isMandatory ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-500 hover:text-red-400 p-1 h-auto"
                          onClick={() => handleDeleteDraftSession(s.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {draftSessions.filter(s => s.locationId === activePlannerLoc).length === 0 && (
                      <p className="text-[10px] text-slate-500 italic text-center py-4 bg-slate-900/35 border border-slate-900 rounded-lg">
                        No draft slots defined. Please define roster slots above to cover the 24-hour period.
                      </p>
                    )}
                  </div>

                  {/* Validation & Save Section */}
                  {(() => {
                    const result = validate24HourCoverage(activePlannerLoc, draftSessions);
                    return (
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 mt-1 flex flex-col gap-2.5">
                        <div className="text-xs">
                          <span className="font-bold text-slate-300 block mb-1">Roster Coverage Status:</span>
                          {result.isValid ? (
                            <p className="text-emerald-400 font-medium text-[11px]">✨ Roster is complete! Every hour of the 24-hour daily cycle is continuously covered by at least one roster slot.</p>
                          ) : (
                            <div>
                              <p className="text-rose-400 font-medium leading-normal mb-1 text-[11px]">🚨 Saving blocked: The daily 24-hour period is not fully covered.</p>
                              <p className="text-slate-400 font-mono text-[10px]">Uncovered gaps remaining: <strong className="text-amber-500">{result.gaps.join(', ')}</strong></p>
                            </div>
                          )}
                        </div>

                        <Button
                          disabled={!result.isValid || isActionLoading}
                          className={`w-full font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 ${result.isValid ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                          onClick={() => handleDeployDraftSessions(activePlannerLoc)}
                        >
                          {isActionLoading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full shrink-0"></span>}
                          Save & Deploy Continuous 24-Hour Configuration
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                {/* Deployed Active Rosters */}
                <div>
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-sky-400" /> Currently Deployed Live Rosters
                  </h4>
                  <div className="flex flex-col gap-3">
                    {locations.map(loc => {
                      const locSessions = sessions.filter(s => s.locationId === loc.id);
                      return (
                        <div key={loc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                          <p className="font-bold text-white text-xs mb-2 flex items-center gap-1 text-sky-400">
                            <MapPin size={12} /> {loc.name}
                          </p>
                          <div className="flex flex-col gap-2">
                            {locSessions.map(s => (
                              <div key={s.id} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center text-xs">
                                <div>
                                  <strong className="text-slate-200">{s.name}</strong>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Slot: {s.startTime} - {s.endTime} | Back Margin: {s.marginBackMin}m | Mandatory: {s.isMandatory ? 'Yes' : 'No'}
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-slate-500 hover:text-red-400 p-1 h-auto"
                                  onClick={() => handleDeleteSession(s.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            ))}
                            {locSessions.length === 0 && (
                              <p className="text-[10px] text-slate-500 italic">No rosters deployed yet. Please configure and deploy drafts above.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* TAB 3: WHITELIST & GROUP SETTINGS */}
          {activeRightTab === 'settings' && (
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Volunteer Whitelist Manager</h3>
                <p className="text-xs text-slate-400">Authorize Telegram accounts to record attendance, assign departments, and configure resolver permissions.</p>
              </div>

              <div className="p-4 flex flex-col gap-6">
                
                {/* Form to Add or Edit Whitelist Volunteer */}
                <form 
                  onSubmit={editingVolId ? handleSaveEditVolunteer : handleAddVolunteer} 
                  className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${editingVolId ? 'bg-sky-950/20 border-sky-500/30' : 'bg-slate-950 border-slate-850'}`}
                >
                  <h4 className="font-bold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    {editingVolId ? <Edit size={14} className="text-sky-400" /> : <Plus size={14} />}
                    {editingVolId ? 'Edit Whitelisted Volunteer Profile' : 'Add Volunteer to Whitelist'}
                  </h4>

                  {/* Directory Auto-fill Selector (Only visible during Add Mode) */}
                  {!editingVolId && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Person from Directory *</label>
                      <select
                        value={selectedPersonId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPersonId(val);
                          if (val && val !== '') {
                            const matched = peopleFromList.find(p => p.personId === val);
                            if (matched) {
                              setNewVolName(matched.name);
                              setNewVolTg(matched.telegramId);
                            }
                          } else {
                            setNewVolName('');
                            setNewVolTg('');
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500 font-medium"
                        required
                      >
                        <option value="">-- Choose from Directory to Whitelist --</option>
                        {peopleFromList.map(p => (
                          <option key={p.personId} value={p.personId}>
                            👤 {p.name} (Telegram: {p.telegramId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Full Name (Auto-filled from Master)</label>
                      <input 
                        type="text"
                        placeholder="Select a person from directory"
                        value={newVolName}
                        readOnly
                        className="bg-slate-950 border border-slate-900 text-slate-400 rounded p-1.5 text-xs outline-none cursor-not-allowed font-medium"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Telegram Account ID (Locked to Master)</label>
                      <input 
                        type="text"
                        placeholder="Select a person from directory"
                        value={newVolTg}
                        readOnly
                        className="bg-slate-950 border border-slate-900 text-slate-400 rounded p-1.5 text-xs outline-none cursor-not-allowed font-mono font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Primary Location *</label>
                      <select 
                        value={newVolLoc}
                        onChange={(e) => setNewVolLoc(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white rounded p-1.5 text-xs outline-none focus:border-sky-500"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400">Group Memberships (Multi-Select) *</label>
                      <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto border border-slate-800 p-1 bg-slate-900 rounded">
                        {groups.map(g => {
                          const isChecked = newVolGroups.includes(g.id);
                          return (
                            <label key={g.id} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setNewVolGroups(prev => prev.filter(gId => gId !== g.id));
                                  } else {
                                    setNewVolGroups(prev => [...prev, g.id]);
                                  }
                                }}
                                className="accent-sky-500 h-3 w-3 rounded"
                              />
                              {g.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 justify-end">
                      <div className="flex items-center gap-1.5 mb-1 bg-slate-900 p-2 rounded border border-slate-800">
                        <input 
                          type="checkbox"
                          id="can-resolve-chk"
                          checked={newVolCanResolve}
                          onChange={(e) => setNewVolCanResolve(e.target.checked)}
                          className="accent-sky-500"
                        />
                        <label htmlFor="can-resolve-chk" className="text-[10px] text-slate-300 cursor-pointer font-bold text-amber-500">Can Resolve Disputes</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingVolId ? (
                      <>
                        <Button 
                          type="button" 
                          onClick={handleCancelEditVolunteer}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isActionLoading}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          {isActionLoading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full shrink-0"></span>}
                          Save Profile Changes
                        </Button>
                      </>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={isActionLoading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        {isActionLoading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full shrink-0"></span>}
                        Register and Authorize Telegram ID
                      </Button>
                    )}
                  </div>
                </form>

                {/* Whitelist Grid */}
                <div>
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users size={14} className="text-sky-400" /> Authorized Whitelist Registry
                  </h4>
                  <div className="flex flex-col gap-2">
                    {volunteers.map(vol => {
                      const isExcluded = vol.groupIds.some(gId => groups.find(g => g.id === gId)?.isExcluded);
                      return (
                        <div key={vol.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200">{vol.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono font-medium">TG ID: {vol.telegramId}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Location: <strong className="text-slate-300">{locations.find(l => l.id === vol.locationId)?.name}</strong> | Groups: <span className="text-sky-400 font-medium">{vol.groupIds.join(', ')}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {vol.canResolveApprovals && (
                              <Badge variant="primary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px]">RESOLVER</Badge>
                            )}
                            {isExcluded && (
                              <Badge variant="warning" className="text-[9px]">EXCLUDED</Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-slate-500 hover:text-sky-400 p-1 h-auto"
                              onClick={() => handleStartEditVolunteer(vol)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-slate-500 hover:text-red-400 p-1 h-auto"
                              onClick={() => handleDeleteVolunteer(vol.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* TAB 4: TELEGRAM LIVE FEED & LOGS */}
          {activeRightTab === 'tele_logs' && (
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">Telegram Alerts Live Stream</h3>
                  <p className="text-xs text-slate-400">View real-time customized notifications, reminders, and alerts sent to groups vs superiors.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-slate-950 border-slate-800 text-xs text-slate-400 hover:text-white"
                  onClick={triggerSessionStartReminders}
                >
                  Trigger Start Reminders
                </Button>
              </div>

              <div className="p-4 flex flex-col gap-4">
                
                {/* Scrollable feed */}
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                  {telegramLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-xs flex gap-3 ${log.type === 'SUPERIOR' ? 'bg-indigo-950/20 border-indigo-500/20' : log.type === 'REMINDER' ? 'bg-amber-950/20 border-amber-500/20' : 'bg-slate-950 border-slate-850'}`}
                    >
                      <div className="shrink-0 pt-0.5">
                        {log.type === 'SUPERIOR' ? (
                          <Lock size={14} className="text-indigo-400" />
                        ) : log.type === 'REMINDER' ? (
                          <Bell size={14} className="text-amber-400 animate-bounce" />
                        ) : (
                          <Users size={14} className="text-sky-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-bold ${log.type === 'SUPERIOR' ? 'text-indigo-400' : log.type === 'REMINDER' ? 'text-amber-400' : 'text-sky-400'}`}>
                            {log.type === 'SUPERIOR' ? '🔒 PRIVATE SUPERIOR ALERT' : log.type === 'REMINDER' ? '⚠️ TELEGRAM REMINDER' : '📢 GROUP CHAT NOTIFICATION'}
                          </span>
                          <span className="text-slate-500 font-mono">{log.timestamp}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 italic block">Target: {log.target}</span>
                        <p className="text-slate-200 mt-1 leading-normal text-xs">{log.message}</p>
                      </div>
                    </div>
                  ))}

                  {telegramLogs.length === 0 && (
                    <p className="text-center py-12 text-slate-500 italic">No Telegram dispatches recorded in this simulator session.</p>
                  )}
                </div>

                {/* Explanation */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-400 leading-relaxed">
                  <p className="font-bold text-white mb-1">💡 Real-world Integration Rules:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>Leave and Absent alerts</strong> omit the private reason when sent to the general Group, but include the reason for Superiors.</li>
                    <li><strong>Punch-out reminders</strong> are strictly suppressed for anyone who marked Leave, Absent, or is in the Excluded group.</li>
                    <li><strong>Automated absent sweep reminders</strong> warn volunteers 10 minutes prior to committing the Absent record.</li>
                  </ul>
                </div>

              </div>
            </Card>
          )}

        </div>

      </div>

      {/* MISSING PUNCH-OUT FORCE OVERLAY */}
      {missingPunchOutModal && missingRecordToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl text-white flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Missing Punch-Out Detected!</h3>
                <p className="text-[10px] text-slate-400">Roster: {sessions.find(s => s.id === missingRecordToClose.sessionId)?.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-normal">
              You must register your punch-out time for the previous active session before punching in again. Please provide the departure time within the previous session boundaries.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Previous Punch Out Time</label>
              <input 
                type="time"
                value={missingPunchOutTimeInput}
                onChange={(e) => setMissingPunchOutTimeInput(e.target.value)}
                className="bg-slate-950 border border-slate-850 p-2 rounded text-xs outline-none focus:border-rose-500 font-mono text-white"
              />
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setMissingPunchOutModal(false);
                  setMissingRecordToClose(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={handleResolveMissingPunchOut}
              >
                Record Punch-Out & Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TelegramAttendancePrototype;
