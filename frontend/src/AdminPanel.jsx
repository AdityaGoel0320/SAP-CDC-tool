import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Trash2, 
  Search, 
  ShieldCheck, 
  Database,
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// const API_BASE_URL = "/api";
const API_BASE_URL = "https://sap-cdc-tool.onrender.com/api";


export default function AdminPanel({ onBack, darkMode }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const triggerAlert = (message, type = "success") => {
    setStatusMessage({ message, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Fetch all registered developers from cluster
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`);
      if (!response.ok) throw new Error("Failed to capture user repository profiles.");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      triggerAlert(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Administrative Cascading Deletion
  const handleDeleteUser = async (userId, userName, userEmail) => {
    const confirmPrompt = `CRITICAL ACTION WARNING:\n\nAre you sure you want to completely delete the account for "${userName}" (${userEmail})?\n\nThis will permanently purge their profile AND cascade delete all audit log records they have ever posted. This action cannot be undone.`;
    
    if (!window.confirm(confirmPrompt)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Purge execution rejected by server.");

      triggerAlert(`Successfully deleted account profile for ${userName}.`);
      fetchUsers(); // Refresh row index metrics automatically
    } catch (error) {
      triggerAlert(error.message, "error");
    }
  };

  // Filter metrics matching user typing queries
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    u._id?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className={`min-h-screen p-6 font-sans antialiased transition-colors duration-300 ${
      darkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Dynamic Action Alerts Status Overlay Banner */}
      {statusMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <AlertCircle size={16} />
          <span className="text-xs font-semibold tracking-tight">{statusMessage.message}</span>
        </div>
      )}

      {/* Admin Panel Header Layout */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/40 pb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
              title="Return to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck size={12} />
                <span>Administrative Cleared Workspace</span>
              </div>
              <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Developer Profile Governance Matrix
              </h1>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              loading ? 'animate-spin opacity-50' : 'active:scale-95'
            } ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Global Metric Breakdown Row cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 border rounded-2xl flex items-center justify-between shadow-sm ${darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Total Core Accounts</p>
              <p className="text-2xl font-black mt-2 font-mono text-indigo-500">{users.length}</p>
            </div>
            <User size={24} className="text-zinc-600 opacity-40" />
          </div>
          <div className={`p-4 border rounded-2xl flex items-center justify-between shadow-sm ${darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Active DB Engine Target</p>
              <p className="text-xs font-semibold mt-3 text-zinc-400 font-mono truncate">sap_cdc_dashboard.users</p>
            </div>
            <Database size={24} className="text-zinc-600 opacity-40" />
          </div>
        </div>

        {/* Table Management Search Engine Filtration Tool Wrapper */}
        <div className={`border rounded-2xl overflow-hidden shadow-xl ${darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-zinc-800/40">
            <div className="relative max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user profile credentials..."
                className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none border transition-all ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700 placeholder:text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          {/* Secure Administrative Table Structure View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[10px] uppercase font-bold tracking-wider border-b ${darkMode ? 'bg-zinc-900/40 border-zinc-900 text-zinc-400' : 'bg-slate-50/80 border-slate-200 text-slate-500'}`}>
                  <th className="p-4">Developer Profile Details</th>
                  <th className="p-4">Workspace Email Identification</th>
                  <th className="p-4">Database Document ID</th>
                  <th className="p-4 text-right">System Action Clear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-zinc-500 font-medium tracking-wide">
                      No matching registered developer profiles located in current cluster view.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className={`transition-colors ${darkMode ? 'hover:bg-zinc-900/30' : 'hover:bg-slate-50/60'}`}>
                      {/* Name metadata card row element */}
                      <td className="p-4 font-bold tracking-tight">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-extrabold uppercase">
                            {user.name?.charAt(0)}
                          </div>
                          <span className={darkMode ? 'text-zinc-200' : 'text-slate-800'}>{user.name}</span>
                        </div>
                      </td>
                      
                      {/* Email identity field string parameters data index row */}
                      <td className="p-4 font-mono font-medium text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="opacity-40" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Explicit MongoDB System Hex hash trace link mapping tracking view identifier string element */}
                      <td className="p-4 font-mono opacity-50 tracking-tight text-[11px]">
                        {user._id}
                      </td>

                      {/* SECURE PURGE PROFILE CASCADE TRIGGER COMPONENT ELEMENT LOGIC BUTTON */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user._id, user.name, user.email)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-500 bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all duration-200 active:scale-95"
                          title="Purge Developer Account & Logs"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}