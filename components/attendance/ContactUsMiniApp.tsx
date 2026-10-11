import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  Phone, 
  MessageSquare, 
  Send, 
  Mail, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  Smartphone, 
  Settings, 
  Database, 
  BookOpen, 
  Download, 
  Bot, 
  RefreshCw, 
  AlertTriangle, 
  UserPlus, 
  X, 
  MessageCircle,
  Video,
  Code
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  activity: string; // Department / Role
  mobile: string;
  email: string;
  telegramUsername?: string;
  notes?: string;
}

interface ContactUsMiniAppProps {
  isMiniAppMode?: boolean;
}

export default function ContactUsMiniApp({ isMiniAppMode = false }: ContactUsMiniAppProps) {
  // --- Seed Data & State Persistence ---
  const initialContacts: Contact[] = [
    { id: 'c_1', name: 'BK Amit Sharma', activity: 'IT & Technical Support', mobile: '+919876543210', email: 'amit.it@bk.org', telegramUsername: 'amit_it_support', notes: 'Call for server or login issues.' },
    { id: 'c_2', name: 'BK Savita Patel', activity: 'Accounts & Finance', mobile: '+919123456780', email: 'savita.acct@bk.org', telegramUsername: 'savita_finance', notes: 'Handles submissions and vouchers.' },
    { id: 'c_3', name: 'BK Rahul Gupta', activity: 'Administration & Office', mobile: '+919988776655', email: 'rahul.admin@bk.org', telegramUsername: 'rahul_admin_officer', notes: 'For permissions, keys, and scheduling.' },
    { id: 'c_4', name: 'BK Sneha Reddy', activity: 'Transport & Logistics', mobile: '+919888877777', email: 'sneha.trans@bk.org', telegramUsername: 'sneha_transport', notes: 'Bookings for vehicles and arrivals.' },
    { id: 'c_5', name: 'BK Gopal Das', activity: 'Kitchen & Catering Services', mobile: '+919555123456', email: 'gopal.kitchen@bk.org', notes: 'Coordinate meals or dietary requests.' },
    { id: 'c_6', name: 'BK Priya Nair', activity: 'Reception & Guiding', mobile: '+919444112233', email: 'priya.rec@bk.org', telegramUsername: 'priya_reception', notes: 'Guest check-ins and welcoming.' },
    { id: 'c_7', name: 'BK Manoj Kumar', activity: 'Security & Safety Control', mobile: '+919333556677', email: 'manoj.sec@bk.org', notes: 'Emergencies and camera/parking.' },
    { id: 'c_8', name: 'BK Harish Vyas', activity: 'Audio, Sound & Stage', mobile: '+919222448800', email: 'harish.stage@bk.org', telegramUsername: 'harish_sound', notes: 'Stage setups and sound systems.' }
  ];

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('miniapp_contacts');
    return saved ? JSON.parse(saved) : initialContacts;
  });

  useEffect(() => {
    localStorage.setItem('miniapp_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // --- Dashboard Tab Management ---
  const [activeTab, setActiveTab] = useState<'simulator' | 'manager' | 'guide'>('simulator');

  // --- Filter & Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All');

  // --- Admin Form States ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    activity: '',
    mobile: '',
    email: '',
    telegramUsername: '',
    notes: ''
  });

  // --- Simulated Interactivity States ---
  const [simulatedAction, setSimulatedAction] = useState<{
    type: 'call' | 'whatsapp' | 'telegram' | 'email';
    contact: Contact;
  } | null>(null);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const [whatsappMsg, setWhatsappMsg] = useState('Hello, I am contacting you from the BK Group.');

  // List of unique activities for filters
  const departments = useMemo(() => {
    const list = new Set(contacts.map(c => c.activity));
    return ['All', ...Array.from(list)];
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const query = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const activityMatch = c.activity.toLowerCase().includes(query);
      const notesMatch = (c.notes || '').toLowerCase().includes(query);
      const searchMatch = nameMatch || activityMatch || notesMatch;

      const filterMatch = selectedActivity === 'All' || c.activity === selectedActivity;

      return searchMatch && filterMatch;
    });
  }, [contacts, searchQuery, selectedActivity]);

  // Handle Form Submission
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name.trim() || !formValues.activity.trim() || !formValues.mobile.trim()) {
      alert('Name, Role/Department, and Mobile Number are mandatory fields.');
      return;
    }

    if (editingContactId) {
      setContacts(prev => prev.map(c => c.id === editingContactId ? {
        ...c,
        name: formValues.name.trim(),
        activity: formValues.activity.trim(),
        mobile: formValues.mobile.trim(),
        email: formValues.email.trim(),
        telegramUsername: formValues.telegramUsername.trim().replace('@', ''),
        notes: formValues.notes.trim()
      } : c));
      setEditingContactId(null);
    } else {
      const newContact: Contact = {
        id: 'c_' + Date.now(),
        name: formValues.name.trim(),
        activity: formValues.activity.trim(),
        mobile: formValues.mobile.trim(),
        email: formValues.email.trim(),
        telegramUsername: formValues.telegramUsername.trim().replace('@', ''),
        notes: formValues.notes.trim()
      };
      setContacts(prev => [...prev, newContact]);
    }

    setFormValues({ name: '', activity: '', mobile: '', email: '', telegramUsername: '', notes: '' });
    setIsFormOpen(false);
  };

  const handleEditContact = (c: Contact) => {
    setFormValues({
      name: c.name,
      activity: c.activity,
      mobile: c.mobile,
      email: c.email,
      telegramUsername: c.telegramUsername || '',
      notes: c.notes || ''
    });
    setEditingContactId(c.id);
    setIsFormOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact from the directory?')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const resetToSeeds = () => {
    if (confirm('This will restore the directory to the default 8 sample contacts. Proceed?')) {
      setContacts(initialContacts);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setClipboardFeedback(`${label} copied to clipboard!`);
    setTimeout(() => setClipboardFeedback(null), 2500);
  };

  // --- CORE MINI APP VIEW COMPONENT ---
  const renderMiniApp = () => {
    return (
      <div className="flex flex-col h-full bg-[#17212b] text-white">
        {/* Telegram Top bar */}
        <div className="bg-[#24303f] px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              📞
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Contact Directory</h3>
              <p className="text-[10px] text-slate-400">Official BK Helpdesk</p>
            </div>
          </div>
          <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold tracking-wide">
            MINI APP
          </Badge>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#1e2c3a] p-3 border-b border-slate-800 flex flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#17212b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Tag Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedActivity(dept)}
                className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border transition-all ${
                  selectedActivity === dept
                    ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                    : 'bg-[#24303f]/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {dept === 'All' ? '🌐 All Roles' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Directory List Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(c => (
              <div 
                key={c.id} 
                className="bg-[#24303f] border border-slate-800/80 rounded-2xl p-3.5 space-y-3 hover:border-blue-500/30 transition-all shadow-md group"
              >
                {/* Contact Identity & Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{c.name}</h4>
                    <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md font-medium mt-1 inline-block">
                      💼 {c.activity}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-400 text-[9px] bg-slate-900/30 py-0.5 px-1.5">
                    ID: {c.id}
                  </Badge>
                </div>

                {/* Notes if any */}
                {c.notes && (
                  <p className="text-[10px] text-slate-400 bg-slate-950/30 p-2 rounded-xl italic leading-relaxed border-l-2 border-blue-500/50">
                    "{c.notes}"
                  </p>
                )}

                {/* Info block */}
                <div className="space-y-1 bg-slate-950/35 p-2 rounded-xl text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Mobile:</span>
                    <span className="text-slate-200">{c.mobile}</span>
                  </div>
                  {c.email && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-slate-200 truncate ml-2 max-w-[180px]">{c.email}</span>
                    </div>
                  )}
                  {c.telegramUsername && (
                    <div className="flex justify-between">
                      <span>Telegram:</span>
                      <span className="text-blue-400">@{c.telegramUsername}</span>
                    </div>
                  )}
                </div>

                {/* Channel Actions - Directly establishing contact */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {/* Call Option */}
                  <button
                    onClick={() => setSimulatedAction({ type: 'call', contact: c })}
                    className="flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-semibold gap-1 group/btn cursor-pointer"
                    title="Call"
                  >
                    <Phone className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] tracking-wider uppercase">Call</span>
                  </button>

                  {/* WhatsApp Option */}
                  <button
                    onClick={() => setSimulatedAction({ type: 'whatsapp', contact: c })}
                    className="flex flex-col items-center justify-center py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all font-semibold gap-1 group/btn cursor-pointer"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] tracking-wider uppercase">WhatsApp</span>
                  </button>

                  {/* Telegram Option */}
                  <button
                    onClick={() => setSimulatedAction({ type: 'telegram', contact: c })}
                    disabled={!c.telegramUsername}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all font-semibold gap-1 group/btn cursor-pointer ${
                      c.telegramUsername
                        ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-600 border border-transparent opacity-40 cursor-not-allowed'
                    }`}
                    title={c.telegramUsername ? "Telegram Message" : "No username added"}
                  >
                    <Send className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] tracking-wider uppercase">Telegram</span>
                  </button>

                  {/* Email Option */}
                  <button
                    onClick={() => setSimulatedAction({ type: 'email', contact: c })}
                    className="flex flex-col items-center justify-center py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all font-semibold gap-1 group/btn cursor-pointer"
                    title="Email"
                  >
                    <Mail className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[8px] tracking-wider uppercase">Email</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-[#24303f] rounded-2xl border border-slate-800 text-slate-500 space-y-2">
              <p className="text-xs">No helpers match your search criteria.</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setSelectedActivity('All'); }}
                className="text-[10px] border-slate-700 hover:bg-slate-800 h-auto py-1 px-3 mt-1"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Mini App Bottom Bar */}
        <div className="bg-[#24303f] p-3 text-center border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>@auditselfhelpbot Contact Tool</span>
          </div>
          <span className="text-[9px] font-mono opacity-60">v1.2.0</span>
        </div>

        {/* --- Clipboard Toast Feedback --- */}
        {clipboardFeedback && (
          <div className="absolute bottom-16 left-4 right-4 bg-emerald-600 text-white p-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 z-[60] border border-emerald-500/30 animate-bounce">
            <Check className="w-4 h-4 shrink-0" />
            <span>{clipboardFeedback}</span>
          </div>
        )}

        {/* --- INTERACTIVE SIMULATED CHANNEL MODALS --- */}
        {simulatedAction && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] p-4 flex flex-col justify-center items-center">
            {/* Modal Box */}
            <div className="w-full max-w-[310px] bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => setSimulatedAction(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center gap-1 mt-2">
                <div className={`p-3 rounded-2xl ${
                  simulatedAction.type === 'call' ? 'bg-emerald-500/10 text-emerald-400' :
                  simulatedAction.type === 'whatsapp' ? 'bg-green-500/10 text-green-400' :
                  simulatedAction.type === 'telegram' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {simulatedAction.type === 'call' && <Phone className="w-7 h-7" />}
                  {simulatedAction.type === 'whatsapp' && <MessageSquare className="w-7 h-7" />}
                  {simulatedAction.type === 'telegram' && <Send className="w-7 h-7" />}
                  {simulatedAction.type === 'email' && <Mail className="w-7 h-7" />}
                </div>
                <h4 className="font-bold text-sm text-white mt-2">
                  {simulatedAction.type === 'call' ? 'Simulated Mobile Call' :
                   simulatedAction.type === 'whatsapp' ? 'Simulated WhatsApp Chat' :
                   simulatedAction.type === 'telegram' ? 'Simulated Telegram Redirect' : 'Simulated Email Client'}
                </h4>
                <p className="text-[10px] text-slate-400">Target Contact: <strong className="text-slate-200">{simulatedAction.contact.name}</strong></p>
              </div>

              {/* Body */}
              <div className="bg-slate-950/50 p-3 rounded-2xl text-xs space-y-2 border border-slate-850">
                {/* Call Simulation */}
                {simulatedAction.type === 'call' && (
                  <div className="text-center space-y-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase tracking-widest text-emerald-400 animate-pulse font-mono font-bold">Outgoing Call Connection...</span>
                      <span className="text-lg font-mono text-white font-bold">{simulatedAction.contact.mobile}</span>
                    </div>
                    <div className="flex justify-center gap-2 pt-2">
                      <button 
                        onClick={() => handleCopyToClipboard(simulatedAction.contact.mobile, 'Phone number')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Number
                      </button>
                      <button 
                        onClick={() => {
                          alert(`Mock Call Triggered: Initializing native phone dialer for ${simulatedAction.contact.name} (${simulatedAction.contact.mobile})`);
                          setSimulatedAction(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Launch Dialer 📞
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Simulation */}
                {simulatedAction.type === 'whatsapp' && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">Pre-compiled Message:</span>
                      <textarea
                        value={whatsappMsg}
                        onChange={(e) => setWhatsappMsg(e.target.value)}
                        className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-[11px] text-slate-200 h-16 outline-none focus:border-green-500 resize-none font-medium leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>Target Code: +91</span>
                      <span>URL: wa.me/91{simulatedAction.contact.mobile.replace(/[^0-9]/g, '')}</span>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1.5">
                      <button 
                        onClick={() => handleCopyToClipboard(`https://wa.me/91${simulatedAction.contact.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`, 'WhatsApp Link')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[10px] p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        title="Copy API Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          const cleanNum = simulatedAction.contact.mobile.replace(/[^0-9]/g, '');
                          const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(whatsappMsg)}`;
                          window.open(url, '_blank');
                          setSimulatedAction(null);
                        }}
                        className="flex-grow bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        Send via WhatsApp <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Telegram Simulation */}
                {simulatedAction.type === 'telegram' && (
                  <div className="text-center space-y-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Telegram Profile Address</span>
                      <span className="text-sm font-semibold text-sky-400">t.me/{simulatedAction.contact.telegramUsername}</span>
                    </div>
                    <div className="flex justify-center gap-2 pt-1.5">
                      <button 
                        onClick={() => handleCopyToClipboard(`@${simulatedAction.contact.telegramUsername}`, 'Telegram username')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Username
                      </button>
                      <button 
                        onClick={() => {
                          window.open(`https://t.me/${simulatedAction.contact.telegramUsername}`, '_blank');
                          setSimulatedAction(null);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Open Chat ✈ <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Simulation */}
                {simulatedAction.type === 'email' && (
                  <div className="text-center space-y-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Draft Email Address</span>
                      <span className="text-sm text-slate-100 font-mono font-medium truncate max-w-[220px] mx-auto">{simulatedAction.contact.email}</span>
                    </div>
                    <div className="flex justify-center gap-2 pt-1.5">
                      <button 
                        onClick={() => handleCopyToClipboard(simulatedAction.contact.email, 'Email address')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Email
                      </button>
                      <button 
                        onClick={() => {
                          window.open(`mailto:${simulatedAction.contact.email}`, '_blank');
                          setSimulatedAction(null);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Launch Mailer ✉ <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // If user accesses directly via Mini App URL context
  if (isMiniAppMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#17212b] overflow-hidden">
        {renderMiniApp()}
      </div>
    );
  }

  // Otherwise, render full standard admin & simulation dashboard module
  return (
    <div className="flex flex-col gap-6" id="contact-us-miniapp-root">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900 border border-slate-850 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">TELEGRAM EXTENSION</Badge>
            <span className="text-[10px] text-slate-500 font-mono">Module: mod_contact_us_miniapp</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="text-indigo-400" size={20} />
            Contact Us Mini App Workstation
          </h1>
          <p className="text-xs text-slate-400">
            Build and deploy a Telegram Group Mini App allowing members to instantly find and establish contact with on-duty helpers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <Button 
            onClick={resetToSeeds}
            variant="outline"
            className="text-xs bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Restore Defaults
          </Button>
          <Button 
            onClick={() => {
              setEditingContactId(null);
              setFormValues({ name: '', activity: '', mobile: '', email: '', telegramUsername: '', notes: '' });
              setIsFormOpen(true);
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Helper
          </Button>
        </div>
      </div>

      {/* THREE TABS CONTAINER */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all shrink-0 ${activeTab === 'simulator' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Smartphone size={14} />
          Mini App Simulator
        </button>
        <button 
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all shrink-0 ${activeTab === 'manager' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Database size={14} />
          Contact Directory Grid ({contacts.length})
        </button>
        <button 
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all shrink-0 ${activeTab === 'guide' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <BookOpen size={14} />
          Group Deployment Guide
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ==================== TAB 1: MINI APP SIMULATOR ==================== */}
        {activeTab === 'simulator' && (
          <>
            {/* Simulation Frame on Left (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              
              <div className="w-full max-w-[360px] bg-slate-950 rounded-[45px] border-[12px] border-slate-800 shadow-2xl p-4 h-[630px] flex flex-col relative overflow-hidden">
                
                {/* Dynamic Camera/Speaker Island Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-24 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-950 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[9px] text-slate-400 font-mono z-10 font-bold">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <span>TG_NET</span>
                    <div className="w-3.5 h-1.5 bg-slate-400 rounded-sm"></div>
                  </div>
                </div>

                {/* Core Iframe/Container of Mini App */}
                <div className="flex-1 rounded-2xl overflow-hidden relative">
                  {renderMiniApp()}
                </div>

              </div>

              <p className="text-[11px] text-slate-500 text-center mt-3 max-w-[300px]">
                📱 Interactive Device Frame. Try searches, role filters, or click action channels to simulate call/chat connections.
              </p>

            </div>

            {/* Interactive Bot Setup & Simulator Console on Right (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Scenario Explanation Card */}
              <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400 animate-bounce" />
                  <h3 className="font-bold text-white text-base">Group Trigger Simulation</h3>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  How does a Telegram Group member access this directory? Under the hybrid Telegram Mini App pattern (the optimal choice confirmed in Page 9 of your documentation):
                </p>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-[9px] shrink-0 mt-0.5">STEP 1</Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Group Command Sent</p>
                      <p className="text-[11px] text-slate-400">A user in your group types the command <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400 font-mono">/contactus</code> or click the pinned instructions.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-[9px] shrink-0 mt-0.5">STEP 2</Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Bot Replies with Inline Button</p>
                      <p className="text-[11px] text-slate-400">The Bot instantly responds in the chat with a message and an Inline keyboard containing a Web App button pointing to this directory link.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-[9px] shrink-0 mt-0.5">STEP 3</Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Mini App Launches Directly</p>
                      <p className="text-[11px] text-slate-400">Clicking the inline button pops open the beautiful Mini App directly inside the Telegram group frame. No redirection or clutter!</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Telegram Group Chat Box */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Test the Trigger in Group Simulator:</h4>
                  
                  <div className="bg-[#101b26] rounded-2xl p-4 border border-slate-800 space-y-3 font-sans h-52 overflow-y-auto flex flex-col justify-end">
                    
                    {/* User Command message */}
                    <div className="flex flex-col items-end self-end max-w-[80%]">
                      <div className="bg-[#2b5278] text-white p-2.5 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow">
                        <p className="text-[9px] text-sky-300 font-bold mb-0.5">BK Volunteer</p>
                        /contactus
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">09:41 AM</span>
                    </div>

                    {/* Bot Keyboard Markup message */}
                    <div className="flex items-start gap-2.5 max-w-[85%] self-start">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Bot size={13} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="bg-[#182533] text-white p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow border border-slate-800">
                          <p className="font-bold text-sky-400 text-[10px] mb-1">BK Helpdesk Bot</p>
                          Om Shanti! Tap the button below to open our live interactive Helpdesk Contact Directory directly inside Telegram:
                        </div>
                        
                        {/* Simulated Inline Keyboard Web App button */}
                        <button 
                          onClick={() => {
                            alert('Opening simulated Mini App inside mobile frame on the left!');
                          }}
                          className="w-full bg-[#3390ec] hover:bg-[#287ecf] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all border-none"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Open Contact Directory 📞
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </Card>

              {/* URL Configurations */}
              <Card className="bg-slate-900 border-slate-800 p-5 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Info className="w-4.5 h-4.5 text-indigo-400" />
                  Mini App Live Webhook URL
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  For your real BotFather configuration, use this exact target URL. We append the query string parameter to bypass normal logins and launch directly in Mini App Mode:
                </p>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/?telegram=true&miniapp=contactus`}
                    className="bg-transparent text-emerald-400 font-mono text-[10px] flex-grow outline-none border-none select-all"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyToClipboard(`${window.location.origin}/?telegram=true&miniapp=contactus`, 'Webhook URL')}
                    className="text-[10px] border-slate-800 bg-slate-900/60 hover:bg-slate-850 h-auto py-1 px-2 text-white"
                  >
                    Copy Link
                  </Button>
                </div>
              </Card>

            </div>
          </>
        )}

        {/* ==================== TAB 2: CONTACT DATABASE MANAGER ==================== */}
        {activeTab === 'manager' && (
          <div className="lg:col-span-12 space-y-6 animate-in fade-in duration-250">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800/80 p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Contacts</span>
                <span className="text-3xl font-extrabold text-white font-sans">{contacts.length}</span>
              </Card>
              <Card className="bg-slate-900 border-slate-800/80 p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">With Telegram Account</span>
                <span className="text-3xl font-extrabold text-sky-400 font-sans">
                  {contacts.filter(c => c.telegramUsername).length}
                </span>
              </Card>
              <Card className="bg-slate-900 border-slate-800/80 p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Unique Departments</span>
                <span className="text-3xl font-extrabold text-purple-400 font-sans">{departments.length - 1}</span>
              </Card>
              <Card className="bg-slate-900 border-slate-800/80 p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Database Mode</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md self-start">
                  DURABLE STORAGE
                </span>
              </Card>
            </div>

            {/* Main Contacts Data Table Card */}
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="font-bold text-white text-base">Contact Registry Database</h3>
                  <p className="text-xs text-slate-400">Review, search, and update direct phone numbers and Telegram handles.</p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">
                      <th className="p-4">Contact Name</th>
                      <th className="p-4">Department / Role</th>
                      <th className="p-4">Mobile Number</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Telegram Handle</th>
                      <th className="p-4">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map(c => (
                        <tr key={c.id} className="hover:bg-slate-850/30 transition-colors">
                          <td className="p-4 font-bold text-slate-100">{c.name}</td>
                          <td className="p-4">
                            <span className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium">
                              {c.activity}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-200">{c.mobile}</td>
                          <td className="p-4 text-slate-400 font-mono">{c.email || '—'}</td>
                          <td className="p-4">
                            {c.telegramUsername ? (
                              <span className="text-sky-400 font-medium">@{c.telegramUsername}</span>
                            ) : (
                              <span className="text-slate-600 font-medium italic">Not Linked</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditContact(c)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(c.id)}
                                className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          No matching records found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </Card>

          </div>
        )}

        {/* ==================== TAB 3: DEPLOYMENT GUIDE ==================== */}
        {activeTab === 'guide' && (
          <div className="lg:col-span-12 space-y-6 animate-in fade-in duration-250">
            
            <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
              
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="w-6 h-6 text-indigo-400 animate-pulse" />
                  Step-by-Step Telegram Group Integration Guide
                </h2>
                <p className="text-xs text-slate-400">
                  Follow these absolute instructions to connect your real Telegram Bot (@auditselfhelpbot) to this custom Contact Us Mini App.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Steps List */}
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-indigo-600/10">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">Register the Mini App in BotFather</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        Open Telegram and chat with <strong>@BotFather</strong>. Send the command <code className="bg-slate-950 text-white px-1.5 py-0.5 rounded font-mono">/newapp</code>. Select your existing bot, then type a suitable title like <code>Contact Helpdesk</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-indigo-600/10">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">Submit Mini App Webhook Link</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        When BotFather prompts you for the Web App URL, paste your live deployment link below:
                        <code className="block mt-1.5 p-1.5 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded border border-slate-850 select-all truncate">
                          {window.location.origin}/?telegram=true&miniapp=contactus
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-indigo-600/10">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">Configure the Command List</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        In BotFather, type <code className="bg-slate-950 text-white px-1.5 py-0.5 rounded font-mono">/setcommands</code>, choose your bot, and submit the command specification. This makes it visible under the group input bar:
                        <code className="block mt-1.5 p-2 bg-slate-950 text-sky-400 font-mono text-[10px] rounded border border-slate-850">
                          contactus - Launch official helpdesk directory
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-indigo-600/10">
                      4
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">Disable Bot Privacy Mode (Crucial!)</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        Without disabling privacy mode, your bot CANNOT detect group messages like <code>/contactus</code>. Go to BotFather → <code className="bg-slate-950 text-white px-1.5 py-0.5 rounded font-mono">/setprivacy</code> → Choose your bot → Set to <strong>DISABLE</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-amber-600/10">
                      5
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">For Restricted/Read-Only Announcement Groups</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        If regular group members do not have permission to send messages (muted/announcement style), they cannot type <code>/contactus</code>. 
                      </p>
                      <p className="text-[11px] text-amber-400 font-semibold leading-normal mt-1 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                        💡 <strong>The Solution:</strong> Since your Bot or Admin has posting rights, have the bot send the message with the <strong>Inline WebApp Button</strong> once, and then **PIN** the message in the group. Muted users can easily click the pinned message header at any time to open the Mini App instantly!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Code Snippets & Images */}
                <div className="space-y-5 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    Google Apps Script Bot Script (Webhook Style)
                  </h4>

                  <p className="text-xs text-slate-400 leading-normal">
                    Paste this exact handler inside your Google Apps Script webhook (<code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">Code.gs</code>) to intercept <code>/contactus</code> and output the Inline Web App button:
                  </p>

                  <pre className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl font-mono text-[10px] text-slate-300 overflow-x-auto max-h-72 leading-normal select-all">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var chatId = data.message.chat.id;
  var text = data.message.text || "";

  // Intercept command
  if (text === "/contactus" || text.indexOf("/contactus@") === 0) {
    var payload = {
      chat_id: chatId,
      text: "🕉️ Om Shanti! Click below to search our live contact directory inside Telegram:",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "Open Contact Directory 📞",
            web_app: { 
              url: "${window.location.origin}/?telegram=true&miniapp=contactus" 
            }
          }
        ]]
      }
    };
    
    UrlFetchApp.fetch("https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
  }
}`}
                  </pre>
                  
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                    💡 Replace <code className="bg-slate-950 text-white font-mono px-1 rounded">YOUR_BOT_TOKEN</code> with your real API key generated by BotFather. Enable standard webhook triggers on Google Apps Script by deploying as a Web App accessible by "Anyone".
                  </div>
                </div>
              </div>

            </Card>

          </div>
        )}

      </div>

      {/* --- ADD / EDIT HELPER MODAL FORM --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-white text-base">
                {editingContactId ? '✏️ Edit Registry Record' : '👤 Add New Helper to Directory'}
              </h3>
              <p className="text-xs text-slate-400">
                Supply valid information to make it accessible to members inside the group.
              </p>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-slate-200 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Helper Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. BK Harish Vyas"
                    value={formValues.name}
                    onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Role/Activity */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Department / Role / Activity *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Audio, Stage, Kitchen..."
                    value={formValues.activity}
                    onChange={(e) => setFormValues(prev => ({ ...prev, activity: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. +91 98765 43210"
                    value={formValues.mobile}
                    onChange={(e) => setFormValues(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="E.g. harish.stage@bk.org"
                    value={formValues.email}
                    onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Telegram Username */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Telegram Username (Handle without @)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold text-sm">@</span>
                  <input
                    type="text"
                    placeholder="harish_sound"
                    value={formValues.telegramUsername}
                    onChange={(e) => setFormValues(prev => ({ ...prev, telegramUsername: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Allows users to tap to instantly private message the helper directly from Telegram group chat.</p>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Short Notes / Help Instructions</label>
                <textarea
                  placeholder="E.g. Available between 9 AM and 6 PM for stage microphone setups."
                  value={formValues.notes}
                  onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-20 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-850">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs border-slate-800 hover:bg-slate-850 text-slate-400"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Helper
                </Button>
              </div>

            </form>

          </Card>
        </div>
      )}

    </div>
  );
}
