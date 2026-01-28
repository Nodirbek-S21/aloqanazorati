
import React, { useState } from "react";
import { UserRole, User, Branch } from "../types";
import { LayoutGrid, UserCircle, Briefcase, ShieldCheck, Lock, AlertCircle } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
  branches: Branch[];
  allUsers: User[]; 
}

const Login: React.FC<LoginProps> = ({ onLogin, branches, allUsers }) => {
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === UserRole.ADMIN) {
      // Admin uchun faqat parolni tekshiramiz (HAYOT-YO'LI.1234.)
      const adminUser = allUsers.find(u => u.role === UserRole.ADMIN);
      if (adminUser && adminUser.password === password) {
        onLogin(adminUser);
      } else {
        setError("Admin paroli noto'g'ri!");
      }
      return;
    }

    const inputName = name.trim();
    const foundUser = allUsers.find(u => 
      u.name.toLowerCase() === inputName.toLowerCase() && 
      u.role === role
    );

    if (!foundUser) {
      setError("Bunday foydalanuvchi tizimda mavjud emas!");
      return;
    }

    if (foundUser.password !== password) {
      setError("Parol noto'g'ri!");
      return;
    }

    onLogin(foundUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <LayoutGrid className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">NazoratHub</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tizimga kirish</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          {[
            { r: UserRole.OPERATOR, i: <UserCircle size={16}/>, l: "Operator" },
            { r: UserRole.MANAGER, i: <Briefcase size={16}/>, l: "Menejer" },
            { r: UserRole.ADMIN, i: <ShieldCheck size={16}/>, l: "Admin" }
          ].map((item) => (
            <button
              key={item.r}
              type="button"
              onClick={() => { setRole(item.r); setError(null); setName(""); setPassword(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                role === item.r ? "bg-white shadow-md text-indigo-600" : "text-slate-500"
              }`}
            >
              {item.i} {item.l}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-black animate-bounce">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {role !== UserRole.ADMIN && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Foydalanuvchi nomi</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ism Familiya"
                className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-800"
              />
            </div>
          )}

          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
              {role === UserRole.ADMIN ? "Admin Maxfiy Paroli" : "Parol"}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full pl-14 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
              />
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all uppercase tracking-widest text-xs mt-4"
          >
            {role === UserRole.ADMIN ? "Tizimga kirish" : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
