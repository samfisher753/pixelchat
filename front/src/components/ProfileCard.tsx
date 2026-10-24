import { ReactNode } from 'react';
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import AvatarFigure from '@/components/AvatarFigure';

// Datos que muestra la tarjeta. Los que falten no se pintan (por ejemplo, la ubicación y la web
// de otro usuario, que la api solo envía a sus amigos).
export type ProfileCardData = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  headerUrl?: string | null;
  motto?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt?: string | null;
  look?: string | null;
};

type ProfileCardProps = {
  profile: ProfileCardData;
  // Añadidos de tu propio perfil (en el de otros no se pasan):
  headerSlot?: ReactNode;          // encima de la cabecera: botón para cambiarla, indicador de subida
  avatarSlot?: ReactNode;          // encima de la foto: botón para cambiarla, indicador de subida
  actions?: ReactNode;             // botones a la derecha de la foto
  onFigureClick?: () => void;      // si se pasa, el personaje se puede pulsar
  figureTitle?: string;
  // Si se pasa, sustituye a los datos del perfil (por ejemplo, el formulario de edición)
  children?: ReactNode;
};

function formatJoinDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function normalizeWebsite(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

// Tarjeta de perfil: la misma para tu perfil y para el de los demás
const ProfileCard = ({ profile, headerSlot, avatarSlot, actions, onFigureClick, figureTitle, children }: ProfileCardProps) => {

  const displayName = profile.displayName || profile.username;
  const joinDate = profile.createdAt ? formatJoinDate(profile.createdAt) : null;

  const figureBox = 'shrink-0 self-start -mt-2 px-4 py-5 max-sm:px-2 max-sm:py-3 rounded-2xl bg-[#1E1E1E] border border-[#383838]';
  // En pantallas estrechas, más pequeño para dejar sitio al nombre
  const figure = <AvatarFigure look={profile.look} className="max-sm:!text-[1px]" />;

  return (
    <div className="bg-[#2C2C2C] rounded-3xl overflow-hidden shadow-lg border border-[#383838] relative">
      {/* Cabecera */}
      <div className="relative w-full aspect-[4/1]">
        {profile.headerUrl ? (
          <img src={profile.headerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#1E1E1E] via-[#022F72] to-[#1E1E1E] opacity-90" />
        )}
        {headerSlot}
      </div>

      <div className="relative z-10 px-8 pb-8">
        {/* Foto de perfil y botones */}
        <div className="flex justify-between items-end -mt-16 mb-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-[#2C2C2C] bg-[#383838] overflow-hidden shadow-2xl flex items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white select-none">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {avatarSlot}
          </div>
          {actions}
        </div>

        {children ?? (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-neutral-400 font-medium">@{profile.username}</p>

              {profile.motto && (
                <p className="mt-4 text-neutral-300 max-w-2xl text-[15px] leading-relaxed">{profile.motto}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-neutral-400">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <a href={normalizeWebsite(profile.website)} target="_blank" rel="noopener noreferrer"
                      className="text-[#4b8df8] hover:underline truncate max-w-[200px]">
                      {profile.website}
                    </a>
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Se unió en {joinDate}</span>
                  </div>
                )}
              </div>

              {/* De momento siempre 0: llegará con los amigos (paso 5) */}
              <div className="flex gap-6 mt-6 pt-6 border-t border-[#383838]">
                <div className="flex gap-2">
                  <span className="font-bold text-white">0</span>
                  <span className="text-neutral-400">Amigos</span>
                </div>
              </div>
            </div>

            {/* Personaje, tal como se le ve en las salas */}
            {onFigureClick ? (
              <button type="button" onClick={onFigureClick} title={figureTitle}
                className={`${figureBox} hover:border-neutral-500 transition-colors`}>
                {figure}
              </button>
            ) : (
              <div className={figureBox}>{figure}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
