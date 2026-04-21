import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from './paths';

export function RequireAdmin() {
  const { user, loading, userProfile } = useAppState();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
      </div>
    );
  }

  if (!user || userProfile?.role !== 'admin') {
    return <Navigate to={PATHS.home} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
