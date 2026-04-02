import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;