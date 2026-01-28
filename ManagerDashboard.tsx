
import React, { useState, useMemo } from 'react';
import { Report, Branch, User, Lead, VisitStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  TrendingUp, Sparkles, User as UserIcon, Calendar, CheckCircle2, 
  XCircle, HelpCircle, PhoneOff, Users, UserPlus, UserCheck, X, Phone, Upload
} from 'lucide-react';
import { analyzeDailyReports } from '../services/gemini';
import * as XLSX from 'xlsx';

interface ManagerDashboardProps {
  reports: Report[];
  branches: Branch[];
  leads: Lead[];
  users: User[];
  onDistributeLeads: (operatorId: string, count: number) => void;
  onLeadsUpload: (leads: Lead[], operatorId?: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  reports, branches, leads, users, onDistributeLeads, onLeadsUpload 
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Modals for Assignment
  const [showAddLeadModal, setShowAddLeadModal] = useState<{show: boolean, operatorId: string, operatorName: string}>({show: false, operatorId: '', operatorName: ''});
  const [showGeneralAddModal, setShowGeneralAddModal] = useState(false);
  const [distributeModal, setDistributeModal] = useState<{show: boolean, operatorId: string, operatorName: string}>({show: false, operatorId: '', operatorName: ''});
  const [distributeCount, setDistributeCount] = useState<number>(10);
  const [manualLead, setManualLead] = useState({ name: '', surname: '', phone: '' });

  const filteredReports = useMemo(() => {
    return reports.filter(r => selectedBranch === 'all' || r.branchId === selectedBranch);
  }, [reports, selectedBranch]);

  const filteredOperators = useMemo(() => {
    // Only shows operators created by Admin (or approved)
    return users.filter(u => selectedBranch === 'all' || u.branchId === selectedBranch);
  }, [users, selectedBranch]);

  const stats = useMemo(() => {
    const total = filteredReports.length;
    const willCome = filteredReports.filter(r => r.visitStatus === 'will_come').length;
    const thinking = filteredReports.filter(r => r.visitStatus === 'thinking').length;
    const wontCome = filteredReports.filter(r => r.visitStatus === 'wont_come').length;
    const conversion = total > 0 ? Math.round((willCome / total) * 100) : 0;
    
    return { total, willCome, thinking, wontCome, conversion };
  }, [filteredReports]);

  const pieData = [
    { name: 'Keladi', value: stats.willCome, color: '#10b981' },
    { name: 'O\'ylayapti', value: stats.thinking, color: '#f59e0b' },
    { name: 'Kelmaydi', value: stats.wontCome, color: '#ef4444' },
  ];

  const unassignedLeadsCount = leads.filter(l => !l.assignedTo && l.status === 'new').length;

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeDailyReports(filteredReports);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const rows = jsonData.slice(1);
      const results: Lead[] = rows.map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        name: String(row[0] || 'Noma\'lum'),
        surname: String(row[1] || ''),
        school: '',
        phone: String(row[2] || ''),
        status: 'new'
      }));
      onLeadsUpload(results);
      alert(`${results.length} ta mijoz bazaga yuklandi!`);
    } catch (err) { alert("Xato!"); }
    e.target.value = '';
  };

  const handleManualLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLead.name || !manualLead.phone) return;
    const l: Lead = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: manualLead.name, 
      surname: manualLead.surname, 
      school: '', 
      phone: manualLead.phone, 
      status: 'new' 
    };
    onLeadsUpload([l]);
    setManualLead({ name: '', surname: '', phone: '' });
    setShowGeneralAddModal(false);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      {/* FILTER & HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Menejer Boshqaruvi</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mijozlarni taqsimlash va nazorat</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            value={selectedBranch} 
            onChange={e => setSelectedBranch(e.target.value)} 
            className="text-xs font-black border-2 border-slate-50 outline-none text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl uppercase tracking-widest"
          >
            <option value="all">Barcha Filiallar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          
          <button onClick={() => setShowGeneralAddModal(true)} className="bg-white border text-slate-800 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">Qo'lda qo'shish</button>
          
          <input type="file" accept=".xlsx, .xls" id="mgr-ex-up" className="hidden" onChange={handleFileSelect} />
          <label htmlFor="mgr-ex-up" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"><Upload size={14} /> Excel Yuklash</label>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Konversiya</p>
          <p className="text-4xl font-black text-indigo-600">{stats.conversion}%</p>
          <div className="absolute -right-2 -bottom-2 opacity-5 text-indigo-600"><TrendingUp size={80}/></div>
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">Keladiganlar</p>
          <p className="text-4xl font-black text-emerald-700">{stats.willCome}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Jami Suhbat</p>
          <p className="text-4xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-2">Bazadagi Mijozlar</p>
          <p className="text-4xl font-black">{unassignedLeadsCount}</p>
        </div>
      </div>

      {/* OPERATORS CONTROL SECTION */}
      <div className="space-y-6">
        <h3 className="font-black text-slate-800 flex items-center gap-2 px-2 uppercase tracking-tight text-lg">
          <Users size={22} className="text-indigo-600" /> Admin Yaratgan Hodimlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperators.map(op => {
            const opLeadsCount = leads.filter(l => l.assignedTo === op.id && l.status === 'new').length;
            return (
              <div key={op.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                    {op.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{op.name}</h4>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                      {branches.find(b => b.id === op.branchId)?.name || 'Bosh Ofis'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mijozlar:</span>
                  <span className="text-2xl font-black text-indigo-600">{opLeadsCount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setShowAddLeadModal({show: true, operatorId: op.id, operatorName: op.name})} 
                    className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-50 flex items-center justify-center gap-1"
                  >
                    <UserPlus size={14} /> Qo'shish
                  </button>
                  <button 
                    onClick={() => setDistributeModal({show: true, operatorId: op.id, operatorName: op.name})} 
                    className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-lg flex items-center justify-center gap-1"
                  >
                    <UserCheck size={14} /> Biriktirish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PIE & AI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="text-indigo-500" /> Natijalar (Kelish holati)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[9px] font-black uppercase tracking-widest mt-4">
            <span className="flex items-center gap-1 text-green-600"><div className="w-2 h-2 rounded-full bg-green-500"/> Keladi</span>
            <span className="flex items-center gap-1 text-yellow-600"><div className="w-2 h-2 rounded-full bg-yellow-500"/> O'ylaydi</span>
            <span className="flex items-center gap-1 text-red-600"><div className="w-2 h-2 rounded-full bg-red-500"/> Kelmaydi</span>
          </div>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl shadow-indigo-100">
          <div>
            <h3 className="text-2xl font-black mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="text-yellow-400" /> AI Tahlil
            </h3>
            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 h-48 overflow-y-auto text-sm opacity-90 leading-relaxed font-medium italic">
              {aiAnalysis || "Bugungi qo'ng'iroqlar va natijalar bo'yicha sun'iy intellekt tahlilini olish uchun tugmani bosing."}
            </div>
          </div>
          <button 
            onClick={runAiAnalysis} 
            disabled={isAnalyzing || stats.total === 0} 
            className="mt-6 bg-white text-indigo-600 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-xs"
          >
            {isAnalyzing ? "Tahlil qilinmoqda..." : "AI Tahlilini Boshlash"}
          </button>
        </div>
      </div>

      {/* General Manual Lead Modal for Manager */}
      {showGeneralAddModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative">
            <button onClick={() => setShowGeneralAddModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={32} /></button>
            <h2 className="text-2xl font-black mb-10 text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <UserPlus className="text-indigo-600" /> Mijoz Qo'shish
            </h2>
            <form onSubmit={handleManualLeadSubmit} className="space-y-6">
              <input required value={manualLead.name} onChange={e => setManualLead({...manualLead, name: e.target.value})} type="text" placeholder="Ismi" className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm uppercase transition-all" />
              <input value={manualLead.surname} onChange={e => setManualLead({...manualLead, surname: e.target.value})} type="text" placeholder="Familiyasi" className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm uppercase transition-all" />
              <div className="relative">
                <input required value={manualLead.phone} onChange={e => setManualLead({...manualLead, phone: e.target.value})} type="tel" placeholder="998..." className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm transition-all" />
                <Phone size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest shadow-2xl active:scale-95 text-xs mt-4">BAZAGA QO'SHISH</button>
            </form>
          </div>
        </div>
      )}

      {/* MODALS - EXISTING */}
      {showAddLeadModal.show && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowAddLeadModal({show: false, operatorId: '', operatorName: ''})} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={32} /></button>
            <h2 className="text-2xl font-black mb-2 text-slate-800 uppercase tracking-tight">Hodimga Qo'shish</h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-10">{showAddLeadModal.operatorName}</p>
            <form onSubmit={(e) => {
               e.preventDefault();
               if (!manualLead.name || !manualLead.phone) return;
               const l: Lead = { id: Math.random().toString(36).substr(2, 9), name: manualLead.name, surname: manualLead.surname, school: '', phone: manualLead.phone, status: 'new' };
               onLeadsUpload([l], showAddLeadModal.operatorId);
               setManualLead({ name: '', surname: '', phone: '' });
               setShowAddLeadModal({show: false, operatorId: '', operatorName: ''});
            }} className="space-y-6">
              <input required value={manualLead.name} onChange={e => setManualLead({...manualLead, name: e.target.value})} type="text" placeholder="Ismi" className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-sm uppercase transition-all" />
              <input value={manualLead.surname} onChange={e => setManualLead({...manualLead, surname: e.target.value})} type="text" placeholder="Familiyasi" className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-sm uppercase transition-all" />
              <div className="relative">
                <input required value={manualLead.phone} onChange={e => setManualLead({...manualLead, phone: e.target.value})} type="tel" placeholder="998..." className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-sm uppercase transition-all" />
                <Phone size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest shadow-2xl shadow-emerald-100 active:scale-95 transition-all">Hodim Bazasi Uchun Saqlash</button>
            </form>
          </div>
        </div>
      )}

      {distributeModal.show && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl text-center">
            <h2 className="text-xl font-black mb-2 text-slate-800 uppercase tracking-tight">Taqsimlash</h2>
            <p className="text-[10px] font-black text-indigo-600 mb-10 uppercase tracking-widest">{distributeModal.operatorName} uchun</p>
            <div className="bg-slate-50 p-8 rounded-[2rem] mb-10 text-left border shadow-inner">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umumiy Bazada:</span>
                 <span className="text-xs font-black text-indigo-600">{unassignedLeadsCount} ta</span>
               </div>
               <p className="text-[9px] text-slate-300 font-bold italic leading-tight">* Bazadan ushbu miqdordagi mijozlar tanlanadi.</p>
            </div>
            <div className="space-y-6">
               <input type="number" value={distributeCount} onChange={e => setDistributeCount(Math.min(unassignedLeadsCount, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full px-8 py-8 rounded-[2rem] bg-slate-50 text-center font-black text-5xl border-none outline-none shadow-inner" />
               <button onClick={() => { onDistributeLeads(distributeModal.operatorId, distributeCount); setDistributeModal({show: false, operatorId: '', operatorName: ''}); }} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest shadow-xl active:scale-95">TASDIQLASH</button>
               <button onClick={() => setDistributeModal({show: false, operatorId: '', operatorName: ''})} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest">BEKOR QILISH</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
