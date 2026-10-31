import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Check, Loader2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import UserAvatar from '@/components/UserAvatar';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';

// Lo que devuelve GET /friends (ver FriendDto en la api)
type Friend = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  since: string;
};

// Lo que devuelve GET /friends/requests (ver FriendRequestsDto en la api)
type FriendRequest = {
  requestId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type FriendRequests = {
  received: FriendRequest[];
  sent: FriendRequest[];
};

const button = 'flex items-center gap-1.5 text-sm text-white rounded-full font-semibold transition-colors disabled:opacity-50';
const primary = `${button} bg-[#022F72] hover:bg-blue-800`;
const secondary = `${button} bg-[#383838] hover:bg-[#444444] border border-[#444444]`;

// Tus amigos y tus solicitudes pendientes. Se usa a pantalla completa en /friends y, en versión
// compacta, en la ventana de amigos del chat. Pide los datos al montarse, así que quien la usa
// la monta solo mientras se ve para que estén al día.
const FriendsList = ({ compact = false }: { compact?: boolean }) => {

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequests>({ received: [], sent: [] });
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  // Solicitud que se está aceptando, rechazando o cancelando
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => Promise.all([
    apiService.get<Friend[]>('/friends'),
    apiService.get<FriendRequests>('/friends/requests'),
  ]).then(([friends, requests]) => {
    setFriends(friends);
    setRequests(requests);
  });

  // Para no recargar dos veces por los cambios hechos desde esta misma lista
  const self = useRef(Symbol());

  useEffect(() => {
    let cancelled = false;
    load()
      .then(() => { if (!cancelled) setStatus('ok'); })
      .catch(() => { if (!cancelled) setStatus('error'); });

    // Si cambia algo desde otro sitio (el botón de un perfil, la otra lista), se vuelve a pedir.
    // Si falla, se queda con lo que tenía.
    const onFriendsChanged = (source?: symbol) => {
      if (source !== self.current) load().catch(() => {});
    };
    gameEventEmitter.on(GameEvent.FriendsChanged, onFriendsChanged);

    return () => {
      cancelled = true;
      gameEventEmitter.off(GameEvent.FriendsChanged, onFriendsChanged);
    };
  }, []);

  // Al aceptar, rechazar o cancelar se vuelven a pedir las listas: aceptar mueve a la persona a tus amigos
  const run = async (requestId: string, request: () => Promise<unknown>) => {
    setBusyId(requestId);
    try {
      await request();
      await load();
      gameEventEmitter.emit(GameEvent.FriendsChanged, self.current);
    } catch (error) {
      toast.error(error instanceof ApiError ? getErrorMessage(error.code) : 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const accept = (r: FriendRequest) => run(r.requestId, () => apiService.post(`/friends/requests/${r.requestId}/accept`));
  const remove = (r: FriendRequest) => run(r.requestId, () => apiService.delete(`/friends/requests/${r.requestId}`));

  if (status === 'loading') {
    return (
      <div className={clsx('flex justify-center', compact ? 'py-8' : 'py-24')}>
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <p className={clsx('px-4 text-center text-neutral-400', compact ? 'py-8 text-sm' : 'py-24 text-lg')}>
        No se han podido cargar tus amigos. Inténtalo de nuevo.
      </p>
    );
  }

  // En la ventana los botones son solo un icono (con el texto de ayuda al pasar por encima)
  const action = (r: FriendRequest, label: string, Icon: typeof Check, style: string, onClick: () => void) => (
    <button onClick={onClick} disabled={busyId !== null} title={label}
      className={clsx(style, compact ? 'p-1.5' : 'px-3 py-1.5')}>
      {busyId === r.requestId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {!compact && label}
    </button>
  );

  return (
    <div className={compact ? 'divide-y divide-[#383838]' : 'space-y-6'}>
      {requests.received.length > 0 && (
        <Section compact={compact} title={`Solicitudes recibidas (${requests.received.length})`}>
          {requests.received.map(r => (
            <UserRow key={r.requestId} compact={compact} user={{ ...r, id: r.userId }}>
              {action(r, 'Aceptar', Check, primary, () => accept(r))}
              {action(r, 'Rechazar', X, secondary, () => remove(r))}
            </UserRow>
          ))}
        </Section>
      )}

      <Section compact={compact} title={`Amigos (${friends.length})`}>
        {friends.length === 0 ? (
          <div className={clsx('px-4 text-center text-neutral-400', compact ? 'py-4 text-sm' : 'py-8')}>
            {!compact && <Users className="w-8 h-8 mx-auto mb-3" />}
            <p>Todavía no tienes amigos. Busca a alguien arriba y envíale una solicitud desde su perfil.</p>
          </div>
        ) : friends.map(f => <UserRow key={f.id} compact={compact} user={f} />)}
      </Section>

      {requests.sent.length > 0 && (
        <Section compact={compact} title={`Solicitudes enviadas (${requests.sent.length})`}>
          {requests.sent.map(r => (
            <UserRow key={r.requestId} compact={compact} user={{ ...r, id: r.userId }}>
              {action(r, 'Cancelar', X, secondary, () => remove(r))}
            </UserRow>
          ))}
        </Section>
      )}
    </div>
  );
};

function Section({ compact, title, children }: { compact: boolean; title: string; children: React.ReactNode }) {
  return (
    <section className={clsx(!compact && 'bg-[#2C2C2C] rounded-2xl border border-[#383838] shadow-lg overflow-hidden')}>
      <h2 className={clsx('px-4 text-neutral-300 font-bold', compact ? 'pt-3 pb-1 text-xs uppercase tracking-wide' : 'py-3 text-sm border-b border-[#383838]')}>
        {title}
      </h2>
      <ul className={clsx(!compact && 'divide-y divide-[#383838]')}>{children}</ul>
    </section>
  );
}

// Una persona de la lista: su avatar y nombre llevan a su perfil; a la derecha, las acciones
function UserRow({ compact, user, children }: {
  compact: boolean;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  children?: React.ReactNode;
}) {
  return (
    <li className={clsx('flex items-center gap-3', compact ? 'px-3 py-1.5' : 'px-4 py-3')}>
      <Link to={`/u/${encodeURIComponent(user.username)}`} className="flex items-center gap-3 min-w-0 flex-1 group">
        <UserAvatar {...user} className={compact ? 'w-8 h-8' : 'w-10 h-10'} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:underline">{user.displayName || user.username}</p>
          <p className="text-xs text-neutral-400 truncate">@{user.username}</p>
        </div>
      </Link>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </li>
  );
}

export default FriendsList;
