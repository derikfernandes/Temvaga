import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from './paths';

export function RequireAuth() {
  const { user, loading } = useAppState();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
