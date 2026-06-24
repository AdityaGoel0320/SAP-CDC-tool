import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  Layers, 
  FileText, 
  History, 
  Database, 
  Search,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Mail,
  Lock,
  UserPlus,
  LockKeyhole,
  Sliders,
  ShieldAlert,
  Sun,
  Moon,
  Archive,
  Wrench,
  Trash2,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';

const SCREEN_SETS = [
  "CAMBRIDGEONE-RegistrationLogin",
  "CAMBRIDGEONE-ProfileUpdate",
  "CAMBRIDGEONE-LinkAccounts",
  "CAMBRIDGEONE-Child-RegistrationLogin"
];

const API_BASE_URL = "http://localhost:9000/api";

// Reusable Copy to Clipboard Helper
function CopyButton({ text, darkMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-1 rounded transition-all duration-200 shrink-0 ${
        copied
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : (darkMode 
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' 
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')
      }`}
      title="Copy text"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("All Ledger Channels");
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('cdc_theme');
    return savedTheme === 'dark';
  });

  const [completedScreenSets, setCompletedScreenSets] = useState(() => {
    const saved = localStorage.getItem('cdc_completed_screensets');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('cdc_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Auth flow control triggers
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  // Target log fields configuration context state structures
  const [selectedScreenSet, setSelectedScreenSet] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [description, setDescription] = useState("");
  const [backupScreenSet, setBackupScreenSet] = useState("");
  const [screenMadeByDev, setScreenMadeByDev] = useState("");

  const triggerToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      if (!response.ok) throw new Error("Failed to sync matrix logs");
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    localStorage.setItem('cdc_completed_screensets', JSON.stringify(completedScreenSets));
  }, [completedScreenSets]);

  useEffect(() => {
    localStorage.setItem('cdc_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const getLastModifierOf = (setName) => {
    return records.find(r => r.screenSetName === setName);
  };

  const evaluateConflictRisk = (setName) => {
    if (!setName) return null;
    const lastLog = getLastModifierOf(setName);
    
    if (lastLog && userSession && lastLog.userId !== userSession.email && !completedScreenSets[setName]) {
      return {
        previousUser: lastLog.devName,
        previousEmail: lastLog.userId,
        time: lastLog.dateTimeIST
      };
    }
    return null;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (isSignUpMode && !authName)) {
      triggerToast("Please populate all fields.", "error");
      return;
    }

    const targetUrl = isSignUpMode ? `${API_BASE_URL}/auth/signup` : `${API_BASE_URL}/auth/login`;
    const bodyPayload = isSignUpMode ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication rejected");

      if (isSignUpMode) {
        triggerToast("Developer account provisioned successfully!");
        setIsSignUpMode(false);
        setAuthPassword("");
        setAuthName("");
      } else {
        localStorage.setItem('cdc_session', JSON.stringify(data));
        setUserSession(data);
        triggerToast(`Welcome back, ${data.name}`);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cdc_session');
    setUserSession(null);
    triggerToast("Terminal context session closed.");
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!userSession) return;

    if (completedScreenSets[selectedScreenSet]) {
      triggerToast("Mutation Denied: This target channel configuration is locked.", "error");
      return;
    }

    if (!selectedScreenSet || !ticketName || !description || !backupScreenSet || !screenMadeByDev) {
      triggerToast("All parameters are completely mandatory.", "error");
      return;
    }

    const riskInfo = evaluateConflictRisk(selectedScreenSet);

    // Dynamic clean structured layout to safely hold string tags inside MongoDB description field
    const complexDescriptionPayload = `[BACKUP: ${backupScreenSet}] [METHOD: ${screenMadeByDev}] — ${description}`;

    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userSession.email,
          screenSetName: selectedScreenSet,
          devName: userSession.name,
          ticketName,
          description: complexDescriptionPayload
        })
      });

      if (!response.ok) throw new Error("Database rejected current modification payload structure");

      triggerToast(riskInfo ? "High Risk Concurrent Change recorded safely!" : "Ledger log entry published.");
      setSelectedScreenSet("");
      setTicketName("");
      setBackupScreenSet("");
      setScreenMadeByDev("");
      setDescription("");
      fetchLogs();
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  const handleDeleteLog = async (id, creatorEmail) => {
    if (!userSession) return;
    
    if (userSession.email !== creatorEmail) {
      triggerToast("Permission Denied: Ownership validation failure.", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to drop this record permanently?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userSession.email })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete handler routing error");

      triggerToast("Activity footprint dropped successfully.");
      fetchLogs();
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  const toggleScreenSetCompletion = (setName) => {
    if (!userSession) {
      triggerToast("Please access console session first.", "error");
      return;
    }

    const lastLog = getLastModifierOf(setName);
    
    if (lastLog && lastLog.userId !== userSession.email) {
      triggerToast(`Ownership Error: Only ${lastLog.devName} can mark this channel complete!`, "error");
      return;
    }

    setCompletedScreenSets(prev => ({
      ...prev,
      [setName]: !prev[setName]
    }));
    triggerToast(`Screen-Set deployment milestone changed.`);
  };

  const filteredRecords = records.filter(rec => {
    const sQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = !sQuery || 
                          rec.ticketName?.toLowerCase().includes(sQuery) ||
                          rec.devName?.toLowerCase().includes(sQuery) ||
                          rec.screenSetName?.toLowerCase().includes(sQuery) ||
                          rec.description?.toLowerCase().includes(sQuery);
    
    const matchesTab = activeTab === "All Ledger Channels" || rec.screenSetName === activeTab;
    return matchesSearch && matchesTab;
  });

  const activeRisk = evaluateConflictRisk(selectedScreenSet);

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      darkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-slate-50/50 text-slate-800'
    }`}>
      
      {/* Toast Alert Popups */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          notification.type === 'error' 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span className="text-xs font-semibold tracking-tight">{notification.message}</span>
        </div>
      )}

      {/* Top Main Navbar */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-200 ${
        darkMode ? 'bg-zinc-950/70 border-zinc-900/80' : 'bg-white/80 border-slate-200/80 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <Database size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 block leading-none mb-0.5">SAP CDC Audit Trail</span>
              <h1 className={`text-sm font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Control Center Console</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800/80' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {userSession && (
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] uppercase">
                  {userSession.name.charAt(0)}
                </div>
                <span className={`text-xs font-semibold ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                  {userSession.name} <span className="opacity-40 font-normal font-mono text-[11px]">({userSession.email})</span>
                </span>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400 p-0.5 transition-colors">
                  <LogOut size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Work Control Status Track Hub Monitor Panel */}
        <section className={`mb-8 border rounded-2xl p-5 transition-all duration-300 ${
          darkMode ? 'bg-zinc-950 border-zinc-900 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={14} className="text-indigo-500" />
            <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Functional Tracking Workspace</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCREEN_SETS.map((setName, idx) => {
              const isDone = completedScreenSets[setName];
              const ownerLog = getLastModifierOf(setName);
              return (
                <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5 ${
                  isDone 
                    ? (darkMode ? 'bg-emerald-950/10 border-emerald-900/40' : 'bg-emerald-50/20 border-emerald-200/80') 
                    : (darkMode ? 'bg-zinc-900/30 border-zinc-800/60' : 'bg-slate-50/40 border-slate-200/80')
                }`}>
                  <div>
                    <h3 className={`text-xs font-bold transition-colors ${darkMode ? 'text-zinc-200 group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-600'}`} title={setName}>
                      {setName.replace("CAMBRIDGEONE-", "")}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-zinc-400">
                      <UserCheck size={11} className="text-zinc-500" />
                      <span className="truncate">
                        Modifier: <span className={`font-semibold ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{ownerLog ? ownerLog.devName : 'None'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-zinc-800/20">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider transition-colors ${isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {isDone ? 'Finalized' : 'In Dev'}
                    </span>
                    <button 
                      onClick={() => toggleScreenSetCompletion(setName)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all duration-200 active:scale-95 ${
                        isDone 
                          ? (darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm') 
                          : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                      }`}
                    >
                      {isDone ? 'Reopen Channel' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Side Control Panel */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl border p-6 sticky top-24 transition-all duration-300 ${
              darkMode ? 'bg-zinc-950 border-zinc-900 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              
              {!userSession ? (
                /* Auth Form Panel Block Box */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {isSignUpMode ? "Register Profile" : "Secure Account Gateway"}
                    </h2>
                  </div>
                  
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {isSignUpMode && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                        <input 
                          type="text" value={authName} onChange={e => setAuthName(e.target.value)}
                          placeholder="Aarav Sharma" 
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                          }`}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Corporate Email</label>
                      <input 
                        type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                        placeholder="developer@cambridge.com" 
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Password</label>
                      <input 
                        type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                        placeholder="••••••••" 
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                      {isSignUpMode ? <UserPlus size={14} /> : <LogIn size={14} />} 
                      {isSignUpMode ? "Create Account" : "Access Terminal"}
                    </button>
                  </form>

                  <div className="mt-4 pt-3 border-t border-zinc-900/60 text-center">
                    <button onClick={() => setIsSignUpMode(!isSignUpMode)} className="text-xs text-indigo-400 font-bold transition-colors">
                      {isSignUpMode ? "Return to Login Console" : "Request credentials setup"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Primary Data Capture Interface Form */
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>Log Schema Alteration</h2>
                  </div>

                  <form onSubmit={handleSubmitLog} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Target Screen Set</label>
                      <div className="relative">
                        <select
                          value={selectedScreenSet} onChange={e => setSelectedScreenSet(e.target.value)}
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none appearance-none cursor-pointer ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                          }`}
                        >
                          <option value="" disabled hidden>Select Target Screen Set</option>
                          {SCREEN_SETS.map((set, idx) => (
                            <option key={idx} value={set} disabled={completedScreenSets[set]}>
                              {set.replace("CAMBRIDGEONE-", "")} {completedScreenSets[set] ? "🔒 (Locked)" : ""}
                            </option>
                          ))}
                        </select>
                        <Layers size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {activeRisk && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex gap-3 animate-pulse">
                        <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs uppercase tracking-wider">Collision Risk Triggered</h4>
                          <p className="text-[11px] leading-normal opacity-90">
                            <strong>{activeRisk.previousUser}</strong> is actively updating this screenset channel. Ensure data safety rules match.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Author Identity Profile</label>
                      <div className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono tracking-tight flex items-center justify-between ${
                        darkMode ? 'bg-zinc-900/30 border-zinc-800 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600 shadow-inner'
                      }`}>
                        <span>{userSession.name}</span>
                        <LockKeyhole size={12} className="opacity-60" />
                      </div>
                    </div>

                    {/* MANUAL TEXT ENTRY FOR SCREENSET BACKUP TRACE */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Screenset Backup Storage Status (Manual Type)</label>
                      <div className="relative">
                        <input
                          type="text" value={backupScreenSet} onChange={e => setBackupScreenSet(e.target.value)}
                          placeholder="e.g. Snapshot_Captured_v2_24June"
                          className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                          }`}
                        />
                        <Archive size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* MANUAL TEXT ENTRY FOR SCREEN MADE BY DEVELOPER */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Screenset Work Context Method (Manual Type)</label>
                      <div className="relative">
                        <input
                          type="text" value={screenMadeByDev} onChange={e => setScreenMadeByDev(e.target.value)}
                          placeholder="e.g. Local Export JSON Configuration Import"
                          className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                          }`}
                        />
                        <Wrench size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Ticket Reference Number</label>
                      <div className="relative">
                        <input
                          type="text" value={ticketName} onChange={e => setTicketName(e.target.value)}
                          placeholder="e.g. CO-8022-REG-FIX"
                          className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                          }`}
                        />
                        <FileText size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Delta Summary Details</label>
                      <textarea
                        rows={4} value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Document fields changed..."
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-white leading-relaxed' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm text-xs leading-relaxed'
                        }`}
                      ></textarea>
                    </div>

                    {completedScreenSets[selectedScreenSet] ? (
                      <div className="bg-red-500/10 text-red-400 text-xs font-semibold p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                        <LockKeyhole size={14} /> Selected channel milestone is closed. Ledger locked.
                      </div>
                    ) : (
                      <button 
                        type="submit" 
                        className={`w-full text-white font-semibold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                          activeRisk ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        <Plus size={13} /> {activeRisk ? "Force Overwrite Commit" : "Publish to Ledger Stack"}
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: SaaS Audit Cards Feed */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter Group Headers */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {["All Ledger Channels", ...SCREEN_SETS].map((tabName, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(tabName)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition-all whitespace-nowrap shadow-sm ${
                    activeTab === tabName 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-500/10" 
                      : (darkMode ? "bg-zinc-900 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                  }`}
                >
                  {tabName === "All Ledger Channels" ? tabName : tabName.replace("CAMBRIDGEONE-", "")}
                </button>
              ))}
            </div>

            {/* Filter Search Component Hub */}
            <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all ${
              darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text" placeholder="Filter stream logs dynamically..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none border transition-all ${
                    darkMode 
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700 placeholder:text-zinc-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300 placeholder:text-slate-400 shadow-sm'
                  }`}
                />
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500 shadow-sm'
              }`}>
                <History size={13} className="text-indigo-400" />
                <span>MongoDB Docs: <span className="font-mono font-bold">{filteredRecords.length}</span></span>
              </div>
            </div>

            {/* List Output Stream mapping matching requirements */}
            <div className="space-y-4.5">
              {filteredRecords.length === 0 ? (
                <div className={`rounded-2xl border p-12 text-center border-dashed ${darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
                  <p className="text-xs text-zinc-500 font-medium">No activity footsteps registered inside current stream target.</p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const subRecords = records.filter(r => r.screenSetName === record.screenSetName).reverse();
                  const currentIdx = subRecords.findIndex(r => r._id === record._id);
                  const priorRecord = currentIdx > 0 ? subRecords[currentIdx - 1] : null;
                  const displayRiskFlag = priorRecord && priorRecord.userId !== record.userId;
                  
                  const isLogOwner = userSession && userSession.email === record.userId;

                  // Secure String Parser Engine Regex replacements
                  const extractField = (desc, keyword) => {
                    if (!desc || !desc.includes(`[${keyword}: `)) return '';
                    try {
                      const start = desc.indexOf(`[${keyword}: `) + keyword.length + 3;
                      const end = desc.indexOf(']', start);
                      return desc.substring(start, end);
                    } catch(e) { return ''; }
                  };

                  const rawBackup = extractField(record.description, "BACKUP");
                  const rawDevSet = extractField(record.description, "METHOD");
                  
                  // Extract presentation description data text blocks cleanly
                  let displayDesc = record.description;
                  if (displayDesc.includes(" — ")) {
                    const pieces = displayDesc.split(" — ");
                    displayDesc = pieces[pieces.length - 1];
                  }

                  return (
                    <div 
                      key={record._id} 
                      className={`rounded-2xl border p-5 transition-all relative group shadow-sm ${
                        displayRiskFlag 
                          ? (darkMode ? 'border-red-900 bg-gradient-to-br from-black via-zinc-950 to-red-950/10 shadow-xl' : 'border-red-200 bg-gradient-to-br from-white to-red-50/20') 
                          : (darkMode ? 'bg-zinc-950 border-zinc-900 hover:border-zinc-800' : 'bg-white border-slate-200 hover:shadow-md')
                      }`}
                    >
                      {/* Log Card Header Area */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-800/20 pr-8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                            {record.screenSetName.replace("CAMBRIDGEONE-", "")}
                          </span>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            {record.ticketName}
                          </span>
                          {displayRiskFlag && (
                            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1 animate-pulse">
                              ⚠️ RISK CONCURRENT COLLISION OVERWRITE
                            </span>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-2 border px-2.5 py-1 rounded-xl shrink-0 ${
                          darkMode ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-slate-50 border-slate-100 shadow-inner'
                        }`}>
                          <Clock size={11} className="text-amber-500" />
                          <div className="text-[11px] font-medium text-zinc-400 tracking-tight">
                            <span className={darkMode ? 'text-zinc-300' : 'text-slate-700'}>{record.date}</span>
                            <span className="mx-1.5 opacity-30">•</span>
                            <span className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{record.dateTimeIST} IST</span>
                          </div>
                        </div>
                      </div>

                      {/* DETAILED ATTRIBUTES DISPLAY MATRIX PANEL */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4">
                        {/* Backup Configuration Detail Card */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                          darkMode ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-slate-50/60 border-slate-200/80'
                        }`}>
                          <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <Archive size={11} className="text-indigo-500" /> Screenset Backup State
                          </span>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className={`text-xs font-semibold tracking-tight truncate ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                              {rawBackup || 'Direct Live Sync (No Local Copy Saved)'}
                            </p>
                            {rawBackup && <CopyButton text={rawBackup} darkMode={darkMode} />}
                          </div>
                        </div>

                        {/* Deployment Method Detail Card */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                          darkMode ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-slate-50/60 border-slate-200/80'
                        }`}>
                          <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <Wrench size={11} className="text-indigo-500" /> Work Context / Strategy
                          </span>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className={`text-xs font-semibold tracking-tight truncate ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                              {rawDevSet || 'Manual Console Sync Sequence'}
                            </p>
                            {rawDevSet && <CopyButton text={rawDevSet} darkMode={darkMode} />}
                          </div>
                        </div>
                      </div>

                      {/* Author Developer Information Bar */}
                      <div className={`grid grid-cols-2 gap-4 py-2 px-3 rounded-xl border mb-3.5 text-xs ${
                        darkMode ? 'bg-zinc-900/20 border-zinc-900/60' : 'bg-slate-50/40 border-slate-100 shadow-inner'
                      }`}>
                        <div>
                          <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Author Developer</p>
                          <p className={`font-bold truncate ${displayRiskFlag ? 'text-red-400' : (darkMode ? 'text-zinc-200' : 'text-slate-700')}`}>{record.devName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Corporate Verified Account</p>
                          <p className="font-mono text-indigo-400 truncate font-semibold">{record.userId}</p>
                        </div>
                      </div>

                      {/* Core Content Body Summary Output */}
                      <div className="pr-12">
                        <h4 className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Delta Configuration Summary</h4>
                        <p className={`text-xs leading-relaxed font-normal ${
                          displayRiskFlag ? (darkMode ? 'text-red-300/90' : 'text-red-900/90') : (darkMode ? 'text-zinc-300' : 'text-slate-600')
                        }`}>
                          {displayDesc}
                        </p>
                      </div>

                      {/* Copy unique Document ID link component */}
                      <div className="mt-3 pt-2 border-t border-zinc-900/20 flex justify-between items-center pr-12">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <span>Object ID: {record._id}</span>
                          <CopyButton text={record._id} darkMode={darkMode} />
                        </div>
                      </div>

                      {/* Owner Protected Trash Action Button */}
                      {isLogOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(record._id, record.userId)}
                          className="absolute bottom-5 right-5 text-red-400 p-2 rounded-xl bg bg-red-500/10 border  border-red-500/20 transition-all "
                          title="Delete Log"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}