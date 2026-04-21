import { Navigate } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { useAppState } from '../providers/AppStateProvider';
import { PATHS } from '../routes/paths';

type LandingRouteProps = {
  onStartChat: () => void;
};

export function LandingRoute({ onStartChat }: LandingRouteProps) {
  const { user, loading } = useAppState();

  if (loading) return null;
  if (user) return <Navigate to={PATHS.home} replace />;

  return <LandingPage onStartChat={onStartChat} />;
}
