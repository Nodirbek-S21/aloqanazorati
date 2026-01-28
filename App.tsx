
import React, { useState, useEffect } from "react";
import { UserRole, User, Report, Branch, Lead } from "./types";
import OperatorPanel from "./components/OperatorPanel";
import ManagerDashboard from "./components/ManagerDashboard";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import { dbService } from "./services/db";
import { Cloud, CloudOff, RefreshCw, Database, Download, X, Link as LinkIcon, Key } from "lucide-react";

const INITIAL_BRANCHES: Branch[] = [
  { id: "main", name: "Bosh Ofis", location: "Toshkent shahri" },
  { id: "and", name: "Andijon Filiali", location: "Andijon" },
  { id: "bux", name: "Buxoro Filiali", location: "Buxoro" },
  { id: "fer", name: "Farg'ona Filiali", location: "Farg'ona" },
  { id: "jiz", name: "Jizzax Filiali", location: "Jizzax" },
  { id: "nam", name: "Namangan Filiali", location: "Namangan" },
  { id: "nav", name: "Navoiy Filiali", location: "Navoiy" },
  { id: "qash", name: "Qashqadaryo Filiali", location: "Qarshi" },
  { id: "qor", name: "Qoraqalpog'iston Filiali", location: "Nukus" },
  { id: "sam", name: "Samarqand Filiali", location: "Samarqand" },
  { id: "sir", name: "Sirdaryo Filiali", location: "Guliston" },
  { id: "sur", name: "Surxondaryo Filiali", location: "Termiz" },
  { id: "xor", name: "Xorazm Filiali", location: "Urganch" },
  { id: "tosh_v", name: "Toshkent Viloyat Filiali", location: "Nurafshon" },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);

  // Database Settings State - Prefilled from local or default
  const [dbUrl, setDbUrl] = useState(localStorage.getItem('supabase_url') || "https://bexbgtsstrqdskaltgvh.supabase.co");
  const [dbKey, setDbKey] = useState(localStorage.getItem('supabase_key') || "sb_secret_iOFa3u-g-BnaQrbnMTOlag_jvXdskp2");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dbUsers, dbReports, dbLeads] = await Promise.all([
        dbService.fetchUsers(),
        dbService.fetchReports(),
        dbService.fetchLeads()
      ]);

      const ADMIN_PASS = "HAYOT-YO'LI.1234.";
      let finalUsers = dbUsers;
      
      if (!finalUsers.find(u => u.role === UserRole.ADMIN)) {
        const admin: User = { 
          id: "admin1", 
          name: "Admin", 
          role: UserRole.ADMIN, 
          password: ADMIN_PASS, 
          isApproved: true,
          createdAt: new Date().toISOString() 
        };
        await dbService.saveUser(admin);
        finalUsers = [admin, ...finalUsers];
      }

      setUsers(finalUsers);
      setReports(dbReports);
      setLeads(dbLeads);
      setIsCloud(dbService.isConnected());
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBranches(INITIAL_BRANCHES);
    loadAllData();
  }, []);

  const handleLogin = (userData: User) => setUser(userData);
  const handleLogout = () => setUser(null);

  const handleBackup = async () => {
    const data = await dbService.exportFullBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NazoratHub_Baza_Zaxira_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleDbSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateConfig(dbUrl, dbKey);
    setShowDbSettings(false);
    alert("Baza sozlamalari saqlandi! Sahifa yangilanmoqda...");
    window.location.reload();
  };

  const addReport = async (newReport: Report) => {
    await dbService.saveReport(newReport);
    setReports([newReport, ...reports]);
    
    if (newReport.leadId) {
      const lead = leads.find(l => l.id === newReport.leadId);
      if (lead) {
        const updatedLead = { ...lead, status: "called" as const };
        await dbService.updateLead(updatedLead);
        setLeads(leads.map(l => l.id === lead.id ? updatedLead : l));
      }
    }
  };

  const handleLeadsUpload = async (newLeads: Lead[], operatorId?: string) => {
    const assignedLeads = newLeads.map(l => ({ ...l, assignedTo: operatorId, status: "new" as const }));
    await dbService.saveLeads(assignedLeads);
    setLeads([...leads, ...assignedLeads]);
  };

  const handleDistributeLeads = async (operatorId: string, count: number) => {
    const unassignedLeads = leads.filter(l => !l.assignedTo && l.status === "new");
    if (unassignedLeads.length < count) {
      alert(`Bazada faqat ${unassignedLeads.length} ta mijoz qolgan.`);
      return;
    }
    const toAssign = unassignedLeads.slice(0, count).map(l => l.id);
    const updatedLeads = leads.map(l => toAssign.includes(l.id) ? { ...l, assignedTo: operatorId } : l);
    
    for (const lId of toAssign) {
      const leadToUpdate = updatedLeads.find(l => l.id === lId);
      if (leadToUpdate) await dbService.updateLead(leadToUpdate);
    }
    
    setLeads(updatedLeads);
  };

  const deleteLeadsForOperator = async (operatorId: string) => {
    if (confirm("Operator mijozlarini tozalash?")) {
      await dbService.deleteLeads(l => l.assignedTo === operatorId);
      setLeads(leads.filter(l => l.assignedTo !== operatorId));
    }
  };

  const deleteGeneralPool = async () => {
    if (confirm("Umumiy bazani tozalash?")) {
      await dbService.deleteLeads(l => !l.assignedTo);
      setLeads(leads.filter(l => !!l.assignedTo));
    }
  };

  const addUser = async (newUser: User) => {
    await dbService.saveUser(newUser);
    setUsers([...users, newUser]);
  };

  const updateUser = async (updatedUser: User) => {
    await dbService.saveUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user?.id === updatedUser.id) setUser(updatedUser);
  };

  const deleteUser = async (userId: string) => {
    if (confirm("Hodim o'chirilsinmi?")) {
      await dbService.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setLeads(leads.filter(l => l.assignedTo !== userId));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <Database className="animate-bounce mb-4 text-indigo-400" size={48} />
      <p className="font-black uppercase tracking-widest text-[10px] opacity-50">Markaziy Baza Yuklanmoqda...</p>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} branches={branches} allUsers={users} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl">N</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-md font-black text-slate-900 leading-none">NazoratHub</h1>
              <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 border ${isCloud ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                {isCloud ? <Cloud size={10} /> : <CloudOff size={10} />}
                <span className="text-[8px] font-black uppercase tracking-widest">{isCloud ? 'CLOUD' : 'LOCAL'}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
              {user.role} | {user.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role === UserRole.ADMIN && (
            <>
              <button onClick={() => setShowDbSettings(true)} title="Baza Sozlamalari" className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg">
                <Database size={18} />
              </button>
              <button onClick={handleBackup} title="Bazani zaxiralash" className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                <Download size={18} />
              </button>
            </>
          )}
          <button onClick={loadAllData} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
            <RefreshCw size={18} />
          </button>
          <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-5 py-3 rounded-2xl active:scale-95 transition-all">Chiqish</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {/* Baza Sozlamalari Modal */}
        {showDbSettings && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative">
              <button onClick={() => setShowDbSettings(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={32} /></button>
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100">
                <Database size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2 text-slate-800 uppercase tracking-tight">Baza Sozlamalari</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
                Supabase kalitlarini kiritish shart emas, tizim allaqachon tayyorlangan. Faqat o'zgartirmoqchi bo'lsangiz ishlating.
              </p>
              <form onSubmit={handleDbSettingsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Supabase URL</label>
                  <div className="relative">
                    <input required value={dbUrl} onChange={e => setDbUrl(e.target.value)} type="text" className="w-full px-14 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-sm" />
                    <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Anon Public Key</label>
                  <div className="relative">
                    <input required value={dbKey} onChange={e => setDbKey(e.target.value)} type="password" className="w-full px-14 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-sm" />
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest shadow-2xl active:scale-95 text-xs mt-4">
                  SOZLAMALARNI YANGILASH
                </button>
              </form>
            </div>
          </div>
        )}

        {user.role === UserRole.OPERATOR && (
          <OperatorPanel 
            user={user} 
            branch={branches.find(b => b.id === user.branchId) || branches[0]} 
            leads={leads.filter(l => l.assignedTo === user.id && l.status === "new")}
            onReportSubmit={addReport} 
          />
        )}
        
        {user.role === UserRole.MANAGER && (
          <ManagerDashboard 
            reports={reports} 
            branches={branches} 
            leads={leads}
            users={users.filter(u => u.role === UserRole.OPERATOR)}
            onDistributeLeads={handleDistributeLeads}
            onLeadsUpload={handleLeadsUpload}
          />
        )}

        {user.role === UserRole.ADMIN && (
          <AdminPanel 
            users={users.filter(u => u.role !== UserRole.ADMIN)}
            reports={reports}
            branches={branches}
            leads={leads}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onLeadsUpload={handleLeadsUpload}
            onDeleteLeads={deleteLeadsForOperator}
            onDistributeLeads={handleDistributeLeads}
            onDeleteGeneralPool={deleteGeneralPool}
          />
        )}
      </main>
    </div>
  );
};

export default App;
