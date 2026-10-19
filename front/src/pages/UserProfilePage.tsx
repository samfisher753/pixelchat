import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Calendar, Loader2, UserX } from 'lucide-react';
import apiService, { ApiError } from '@/services/apiService';
import { useAuth } from '@/providers/AuthProvider';
import AvatarFigure from '@/components/AvatarFigure';

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

function formatJoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

// Perfil de otro usuario, de solo lectura (/u/<usuario>). Tiene el mismo aspecto que el tuyo,
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

  const displayName = profile.displayName || profile.username;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-[#2C2C2C] rounded-3xl overflow-hidden shadow-lg border border-[#383838] relative">
        <div className="relative w-full aspect-[4/1]">
          {profile.headerUrl ? (
            <img src={profile.headerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1E1E1E] via-[#022F72] to-[#1E1E1E] opacity-90" />
          )}
        </div>

        <div className="relative z-10 px-8 pb-8">
          <div className="-mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#2C2C2C] bg-[#383838] overflow-hidden shadow-2xl flex items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white select-none">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-neutral-400 font-medium">@{profile.username}</p>

              {profile.motto && (
                <p className="mt-4 text-neutral-300 max-w-2xl text-[15px] leading-relaxed">{profile.motto}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Se unió en {formatJoinDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Su personaje, tal como se le ve en las salas */}
            <div className="shrink-0 self-start -mt-2 px-4 py-5 max-sm:px-2 max-sm:py-3 rounded-2xl bg-[#1E1E1E] border border-[#383838]">
              <AvatarFigure look={profile.look} className="max-sm:!text-[1px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
