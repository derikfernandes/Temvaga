import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import {
  Briefcase,
  GraduationCap,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { auth } from '../initFirebase';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from '../routes/paths';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${
    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
  }`;

export function AdminShell() {
  const navigate = useNavigate();
  const { userProfile, user } = useAppState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate(PATHS.root, { replace: true });
  };

  const navItems = [
    { to: PATHS.admin, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: PATHS.adminVagas, label: 'Aprovar Vagas', icon: Briefcase, end: false },
    { to: PATHS.adminCursos, label: 'Cursos', icon: GraduationCap, end: false },
    { to: PATHS.adminUsers, label: 'Usuários', icon: Users, end: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white flex justify-between items-center p-4">
        <h1 className="text-xl font-extrabold tracking-tighter text-indigo-400">AdminPanel</h1>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-extrabold tracking-tighter text-indigo-400">AdminPanel</h1>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logado como</p>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {(userProfile?.nome_completo as string) || user?.email}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-slate-800 transition-all mt-4 border-t border-slate-800 pt-4"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
