import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, UserX } from 'lucide-react';
import apiService, { ApiError } from '@/services/apiService';
import { useAuth } from '@/providers/AuthProvider';
import ProfileCard from '@/components/ProfileCard';

// Lo que devuelve GET /profiles/{username}: solo los datos públicos (ver PublicProfileDto en la api)
type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  motto: string | null;
  look: string | null;
  createdAt: string;
};

// Perfil de otro usuario, de solo lectura (/u/<usuario>). Usa la misma tarjeta que el tuyo,
// pero sin botones de edición y sin los datos que solo verán sus amigos.
export function UserProfilePage({ username }: { username: string }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'not_found' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    apiService.get<PublicProfile>(`/profiles/${encodeURIComponent(username)}`)
      .then(found => {
        if (cancelled) return;
        setProfile(found);
        setStatus('ok');
      })
      .catch(error => {
        if (!cancelled) setStatus(error instanceof ApiError && error.code === 'auth.user_not_found' ? 'not_found' : 'error');
      });
    return () => { cancelled = true; };
  }, [username]);

  // Tu propio perfil se ve (y se edita) en /profile
  if (username.toLowerCase() === auth.user?.username.toLowerCase()) return <Navigate to="/profile" replace />;

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (status !== 'ok' || !profile) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center text-neutral-400">
        <UserX className="w-10 h-10 mx-auto mb-4" />
        <p className="text-lg">
          {status === 'not_found' ? `No existe ningún usuario @${username}.` : 'No se ha podido cargar el perfil. Inténtalo de nuevo.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ProfileCard profile={profile} />
    </div>
  );
}

export default UserProfilePage;
