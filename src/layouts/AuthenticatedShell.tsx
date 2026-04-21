import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import {
  Briefcase,
  GraduationCap,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { auth } from '../initFirebase';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from '../routes/paths';
import { CourseModal } from '../components/CourseModal';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
    isActive ? 'bg-gov-blue text-white shadow-sm' : 'text-slate-600 hover:text-gov-blue'
  }`;

const profileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
    isActive
      ? 'bg-white text-gov-blue shadow-sm border border-gov-blue/20'
      : 'text-slate-600 hover:text-gov-blue'
  }`;

export function AuthenticatedShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, user, setSelectedVaga, isMobileMenuOpen, setIsMobileMenuOpen } = useAppState();

  useEffect(() => {
    if (location.pathname !== PATHS.home) {
      setSelectedVaga(null);
    }
  }, [location.pathname, setSelectedVaga]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate(PATHS.root, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gov-gray-light text-gov-gray-dark font-sans">
      <div className="bg-gov-blue-dark text-white py-1 px-4 text-[10px] font-bold uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span>BRASIL</span>
            <span className="opacity-60"></span>
          </div>
          <div className="flex gap-4 opacity-80">
            <span>Acesso à informação</span>
            <span>Participe</span>
            <span>Legislação</span>
            <span>Órgãos do Governo</span>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-4 bg-gov-green rounded-sm" />
                  <div className="w-2 h-4 bg-gov-yellow rounded-sm" />
                  <div className="w-2 h-4 bg-gov-blue rounded-sm" />
                  <div className="w-2 h-4 bg-gov-red rounded-sm" />
                  <h1 className="text-2xl font-extrabold tracking-tighter text-gov-blue ml-1">TemVaga</h1>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
              <NavLink to={PATHS.home} end className={navLinkClass}>
                Vagas
              </NavLink>
              <NavLink to={PATHS.homeCourses} className={navLinkClass}>
                Cursos
              </NavLink>
              <NavLink to={PATHS.homeMyCourses} className={navLinkClass}>
                Meus Cursos
              </NavLink>
              <NavLink to={PATHS.profile} className={profileLinkClass}>
                Perfil
              </NavLink>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Usuário</p>
                <p className="text-sm font-semibold text-slate-700">
                  {(userProfile?.nome_completo as string) || user?.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="hidden md:block p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-slate-600 hover:text-gov-blue transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {[
                  { to: PATHS.home, label: 'Vagas', icon: Briefcase, end: true },
                  { to: PATHS.homeCourses, label: 'Cursos', icon: GraduationCap, end: false },
                  { to: PATHS.homeMyCourses, label: 'Meus Cursos', icon: BookOpen, end: false },
                  { to: PATHS.profile, label: 'Perfil', icon: User, end: false },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => {
                      setSelectedVaga(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive ? 'bg-gov-blue/10 text-gov-blue' : 'text-slate-600 hover:bg-slate-50'
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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mt-4 border-t border-slate-50 pt-4"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Outlet />
      <CourseModal />
    </div>
  );
}
