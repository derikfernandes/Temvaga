import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from './paths';

export function RequireCompany() {
  const { user, loading, userProfile } = useAppState();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || userProfile?.role !== 'empresa') {
    return <Navigate to={PATHS.companyLogin} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
