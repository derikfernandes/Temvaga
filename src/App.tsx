import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppStateProvider, useAppState } from './providers/AppStateProvider';
import { PATHS } from './routes/paths';
import { RequireAuth } from './routes/RequireAuth';
import { AuthenticatedShell } from './layouts/AuthenticatedShell';
import { LandingRoute } from './pages/LandingRoute';
import { LoginPage } from './pages/LoginPage';
import { HomeJobsPage } from './pages/HomeJobsPage';
import { CoursesPage } from './pages/CoursesPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { ProfilePage } from './pages/ProfilePage';
import { Chatbot } from './components/Chatbot';
import { RequireAdmin } from './routes/RequireAdmin';
import { AdminShell } from './layouts/AdminShell';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminVagasPage } from './pages/admin/AdminVagasPage';
import { AdminCursosPage } from './pages/admin/AdminCursosPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { RequireCompany } from './routes/RequireCompany';
import { CompanyShell } from './layouts/CompanyShell';
import { CompanyLoginPage } from './pages/CompanyLoginPage';
import { CompanyDashboardPage } from './pages/company/CompanyDashboardPage';
import { CompanyVagasPage } from './pages/company/CompanyVagasPage';
import { CompanyApplicantsPage } from './pages/company/CompanyApplicantsPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';
function GlobalLoading() {
  const { loading } = useAppState();
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
      <div className="flex items-center gap-1 mb-6">
        <div className="w-2 h-8 bg-gov-green rounded-sm animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-8 bg-gov-yellow rounded-sm animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-8 bg-gov-blue rounded-sm animate-bounce" />
        <div className="w-2 h-8 bg-gov-red rounded-sm animate-bounce [animation-delay:0.15s]" />
      </div>
      <p className="text-gov-blue font-black text-xl tracking-tighter">TemVaga</p>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2"></p>
    </div>
  );
}

function AppRoutes() {
  const { user, userProfile } = useAppState();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const showLandingChat = !user && location.pathname === PATHS.root;

  return (
    <>
      <Routes>
        <Route path={PATHS.root} element={<LandingRoute onStartChat={() => setIsChatOpen(true)} />} />
        <Route path={PATHS.login} element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AuthenticatedShell />}>
            <Route path={PATHS.home} element={<HomeJobsPage />} />
            <Route path={PATHS.homeCourses} element={<CoursesPage />} />
            <Route path={PATHS.homeMyCourses} element={<MyCoursesPage />} />
            <Route path={PATHS.profile} element={<ProfilePage />} />
          </Route>
        </Route>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminShell />}>
            <Route path={PATHS.admin} element={<AdminDashboardPage />} />
            <Route path={PATHS.adminVagas} element={<AdminVagasPage />} />
            <Route path={PATHS.adminCursos} element={<AdminCursosPage />} />
            <Route path={PATHS.adminUsers} element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route path={PATHS.companyLogin} element={<CompanyLoginPage />} />
        <Route element={<RequireCompany />}>
          <Route element={<CompanyShell />}>
            <Route path={PATHS.company} element={<CompanyDashboardPage />} />
            <Route path={PATHS.companyVagas} element={<CompanyVagasPage />} />
            <Route path={PATHS.companyApplicants} element={<CompanyApplicantsPage />} />
            <Route path={PATHS.companyProfile} element={<CompanyProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={PATHS.root} replace />} />
      </Routes>

      <Chatbot
        user={user}
        userProfile={userProfile}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        showLanding={showLandingChat}
      />
      <GlobalLoading />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <div className="min-h-screen bg-gov-gray-light text-gov-gray-dark font-sans">
          <AppRoutes />
        </div>
      </AppStateProvider>
    </BrowserRouter>
  );
}
