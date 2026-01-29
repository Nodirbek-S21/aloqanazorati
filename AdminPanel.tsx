
import React, { useState, useMemo } from 'react';
import { User, UserRole, Branch, Report, Lead } from './types';
import { 
  Trash2, Upload, X, User as UserIcon, Shield, Folder, Calendar, ChevronRight, FolderOpen, Edit3, Eraser, Settings2, UserCheck, Download, UserPlus, Phone, Share2, Info, ExternalLink, Globe
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  users: User[];
  reports: Report[];
  branches: Branch[];
  leads: Lead[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onLeadsUpload: (leads: Lead[], operatorId?: string) => void;
  onDeleteLeads: (operatorId: string) => void;
  onDistributeLeads: (operatorId: string, count: number) => void;
  onDeleteGeneralPool: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, reports, branches, leads, onAddUser, onUpdateUser, onDeleteUser, onLeadsUpload, onDeleteLeads, onDistributeLeads, onDeleteGeneralPool 
}) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showManualLeadModal, setShowManualLeadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [distributeModal, setDistributeModal] = useState<{show: boolean, operatorId: string, operatorName: string}>({show: false, operatorId: '', operatorName: ''});
  const [distributeCount, setDistributeCount] = useState<number>(50);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.OPERATOR);
  const [newPassword, setNewPassword] = useState('');
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || '');
  
  const [manualLead, setManualLead] = useState({ name: '', surname: '', phone: '' });

  const unassignedLeadsCount = leads.filter(l => !l.assignedTo && l.status === 'new').length;
  const isCloud = !!localStorage.getItem('supabase_url');

  const archivedData = useMemo(() => {
    const groups: Record<string, Record<string, { operator: User | undefined, reports: Report[] }>> = {};
    reports.forEach(report => {
      const date = report.timestamp.split('T')[0];
      const opId = report.operatorId;
      const opInfo = users.find(u => u.id === opId);
      
      if (!groups[date]) groups[date] = {};
      if (!groups[date][opId]) {
        groups[date][opId] = { operator: opInfo, reports: [] };
      }
      groups[date][opId].reports.push(report);
    });
    return groups;
  }, [reports, users]);

  const exportDayToExcel = (date: string) => {
    const dayData = archivedData[date];
    if (!dayData) return;
    const rows: any[] = [];
    Object.values(dayData).forEach((group: any) => {
      const branchName = branches.find(b => b.id === group.operator?.branchId)?.name || "Bosh Ofis";
      group.reports.forEach((r: any) => {
        rows.push({
          "Sana": date,
          "Filial/Ofis": branchName,
          "Hodim Ismi": group.operator?.name || r.operatorName,
          "Lavozimi": group.operator?.role || "Operator",
          "Mijoz": r.clientName,
          "Telefon": r.clientPhone,
          "Natija": r.visitStatus,
          "Izoh": r.tasksCompleted,
          "Vaqt": r.timestamp.split('T')[1].substr(0, 5)
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kunlik_Hisobot");
    XLSX.writeFile(wb, `Hisobot_${date}.xlsx`);
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
    setShowManualLeadModal(false);
  };

  const resetForm = () => {
    setNewName('');
    setNewPassword('');
    setNewRole(UserRole.OPERATOR);
    setNewBranchId(branches[0]?.id || '');
  };

  return (
    <div className="space-y-6 pb-20">
      {!isCloud && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600"><Info size={24}/></div>
             <div>
               <p className="text-xs font-black text-red-800 uppercase tracking-widest">DIQQAT: Tizim hali markaziy bazaga ulanmagan!</p>
               <p className="text-[10px] text-red-600 font-bold uppercase mt-1">Hozir kiritgan ma'lumotlaringiz faqat shu telefonda qoladi. Tepadan 'Baza' tugmasini bosing.</p>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Shield size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Admin Nazorati</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Boshqaruv va Mijozlar Bazasi</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button onClick={() => setShowShareModal(true)} className="flex-1 lg:flex-none p-5 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-sm border border-amber-100"><Share2 size={20} /> Tarqatish</button>
            <button onClick={() => setShowArchiveModal(true)} className="flex-1 lg:flex-none p-5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-xl"><Folder size={20} /> Arxiv</button>
            <button onClick={() => setShowManualLeadModal(true)} className="flex-1 lg:flex-none p-5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-sm"><UserPlus size={20} /> Mijoz Qo'shish</button>
            <input type="file" accept=".xlsx, .xls" id="ex-up" className="hidden" onChange={handleFileSelect} />
            <label htmlFor="ex-up" className="flex-1 lg:flex-none bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95"><Upload size={20} /> Excel Yuklash</label>
            <button onClick={onDeleteGeneralPool} className="p-5 bg-white border border-slate-200 text-red-500 rounded-2xl shadow-sm hover:bg-red-50 transition-all"><Trash2 size={24} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Bosh Bazada</p><p className="text-4xl font-black">{unassignedLeadsCount}</p></div>
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Taqsimlangan</p><p className="text-4xl font-black text-emerald-700">{leads.filter(l => !!l.assignedTo).length}</p></div>
          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Hisobotlar</p><p className="text-4xl font-black text-indigo-700">{reports.length}</p></div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowShareModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={32} /></button>
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
              <Globe size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2 text-slate-800 uppercase tracking-tight">Operatorlarga Tarqatish</h2>
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h3 className="font-black text-slate-800 uppercase text-xs mb-4 flex items-center gap-2"><ExternalLink size={16} className="text-indigo-600"/> 1-QADAM: Saytni Internetga chiqarish</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Hozirgi saytni doimiy qilish uchun <b>Vercel</b> yoki <b>Netlify</b> xizmatiga "Deploy" qilishingiz kerak.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h3 className="font-black text-slate-800 uppercase text-xs mb-4 flex items-center gap-2"><Share2 size={16} className="text-amber-600"/> 2-QADAM: Linkni ulashish</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vercel bergan linkni Telegram orqali operatorlarga yuborasiz.
                </p>
              </div>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full bg-slate-100 text-slate-800 font-black py-7 rounded-[2.5rem] uppercase tracking-widest mt-8 active:scale-95 text-xs">TUSHUNARLI</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-12 px-4">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Hodimlar</h2>
        <button onClick={() => { resetForm(); setShowAddUserModal(true); }} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">+ Yangi Hodim</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(u => {
          const uLeadsCount = leads.filter(l => l.assignedTo === u.id && l.status === 'new').length;
          return (
            <div key={u.id} className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm relative group hover:shadow-xl transition-all">
               <div className={`absolute top-0 right-10 py-2 px-6 rounded-b-2xl font-black text-[8px] uppercase tracking-widest ${u.role === UserRole.MANAGER ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{u.role}</div>
               <div className="flex justify-between mb-8 mt-4">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border font-black">{u.name.charAt(0)}</div>
                     <div><h3 className="font-black text-slate-900 uppercase text-sm">{u.name}</h3><p className="text-[9px] font-black text-slate-400 uppercase">{branches.find(b => b.id === u.branchId)?.name || 'Bosh Ofis'}</p></div>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => { setShowEditUserModal(u); setNewName(u.name); setNewPassword(u.password || ''); setNewRole(u.role); setNewBranchId(u.branchId || ''); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit3 size={18} /></button>
                     <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Biriktirilgan:</p>
                    <p className="text-3xl font-black text-indigo-600">{uLeadsCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Parol:</p>
                    <p className="text-xs font-black text-slate-600">{u.password}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setDistributeModal({show: true, operatorId: u.id, operatorName: u.name})} className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[9px] uppercase active:scale-95 shadow-lg flex items-center justify-center gap-2" disabled={u.role === UserRole.MANAGER}><UserCheck size={14}/> Biriktirish</button>
                  <button onClick={() => onDeleteLeads(u.id)} className="bg-white border text-red-500 py-4 rounded-2xl font-black text-[9px] uppercase active:scale-95 flex items-center justify-center gap-2 hover:bg-red-50 transition-all"><Eraser size={14}/> Tozalash</button>
               </div>
            </div>
          );
        })}
      </div>

      {showArchiveModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Arxiv</h2>
               <button onClick={() => setShowArchiveModal(false)} className="p-5 bg-white shadow-sm text-slate-400 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/4 border-r overflow-y-auto p-6 bg-slate-50/30">
                  {Object.keys(archivedData).sort().reverse().map(date => (
                    <button key={date} onClick={() => setActiveDate(date)} className={`w-full flex items-center justify-between p-6 rounded-3xl font-black text-sm mb-3 transition-all ${activeDate === date ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-700 border'}`}>
                       <div className="flex items-center gap-3"><Calendar size={18} /> {date}</div>
                       <ChevronRight size={16} />
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-10 bg-white">
                  {activeDate ? (
                    <div className="space-y-10">
                       <div className="flex justify-between items-center bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 shadow-sm">
                          <div><h3 className="text-xl font-black text-indigo-900 uppercase">{activeDate}</h3></div>
                          <button onClick={() => exportDayToExcel(activeDate)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"><Download size={18}/> Excel Yuklash</button>
                       </div>
                       {Object.entries(archivedData[activeDate] || {}).map(([opId, group]: [string, any]) => (
                         <div key={opId} className="border-l-4 border-indigo-600 pl-8 space-y-6 mb-8">
                            <h4 className="font-black text-slate-900 uppercase">{group.operator?.name || "Noma'lum"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {group.reports.map((r: any) => (
                                 <div key={r.id} className="bg-slate-50 p-5 rounded-2xl border text-sm">
                                    <div className="flex justify-between mb-3 font-black text-slate-800 uppercase text-[10px]"><span>{r.clientName}</span><span>{r.timestamp.split('T')[1].substr(0, 5)}</span></div>
                                    <p className="italic text-slate-600 border-l-2 border-indigo-200 pl-3">"{r.tasksCompleted}"</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
                       <FolderOpen size={100} />
                       <p className="font-black text-sm uppercase mt-6 tracking-widest">Sana tanlang</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {(showAddUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-12 relative shadow-2xl">
              <button onClick={() => { setShowAddUserModal(false); setShowEditUserModal(null); }} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={32} /></button>
              <h2 className="text-2xl font-black mb-10 text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <Settings2 className="text-indigo-600" /> {showEditUserModal ? 'Tahrirlash' : 'Yangi Hodim'}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (showEditUserModal) {
                  onUpdateUser({ ...showEditUserModal, name: newName, role: newRole, password: newPassword, branchId: newBranchId });
                  setShowEditUserModal(null);
                } else {
                  onAddUser({ id: Math.random().toString(36).substr(2, 9), name: newName, role: newRole, password: newPassword, branchId: newBranchId, createdAt: new Date().toISOString() });
                  setShowAddUserModal(false);
                }
                resetForm();
              }} className="space-y-6">
                <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder="Ism Familiya" className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm uppercase" />
                <input required value={newPassword} onChange={e => setNewPassword(e.target.value)} type="text" placeholder="Parol" className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm" />
                <select value={newBranchId} onChange={e => setNewBranchId(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-sm uppercase">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest shadow-2xl active:scale-95 text-xs">SAQLASH</button>
              </form>
           </div>
        </div>
      )}

      {distributeModal.show && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl text-center">
            <h2 className="text-xl font-black mb-2 text-slate-800 uppercase tracking-tight">Biriktirish</h2>
            <input type="number" value={distributeCount} onChange={e => setDistributeCount(parseInt(e.target.value) || 0)} className="w-full px-8 py-8 rounded-[2rem] bg-slate-50 text-center font-black text-5xl" />
            <button onClick={() => { onDistributeLeads(distributeModal.operatorId, distributeCount); setDistributeModal({show: false, operatorId: '', operatorName: ''}); }} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase tracking-widest mt-8">TASDIQLASH</button>
            <button onClick={() => setDistributeModal({show: false, operatorId: '', operatorName: ''})} className="mt-6 text-slate-400 font-black text-[10px] uppercase">BEKOR QILISH</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
