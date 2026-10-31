import { useState } from 'react';
import { Check, Clock, Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';

// Lo que devuelve la api (RelationshipDto): tu relación con el otro usuario
export type Relationship = {
  status: 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIENDS';
  requestId: string | null;
};

type FriendButtonProps = {
  userId: string;
  username: string;
  relationship: Relationship;
  // Se llama con la relación nueva después de cada cambio
  onChange: (relationship: Relationship) => void;
};

const base = 'flex items-center gap-2 px-5 py-2 text-white rounded-full font-bold transition-colors disabled:opacity-50';
const secondary = `${base} bg-[#383838] hover:bg-[#444444] border border-[#444444]`;
const primary = `${base} bg-[#022F72] hover:bg-blue-800`;

// Botón de amistad del perfil de otro usuario: cambia según vuestra relación
const FriendButton = ({ userId, username, relationship, onChange }: FriendButtonProps) => {

  const [busy, setBusy] = useState(false);

  const run = async (request: () => Promise<Relationship>) => {
    setBusy(true);
    try {
      onChange(await request());
      gameEventEmitter.emit(GameEvent.FriendsChanged);
    } catch (error) {
      toast.error(error instanceof ApiError ? getErrorMessage(error.code) : 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const send = () => run(() => apiService.post<Relationship>('/friends/requests', { userId }));
  const accept = () => run(() => apiService.post<Relationship>(`/friends/requests/${relationship.requestId}/accept`));
  const deleteRequest = () => run(() => apiService.delete<Relationship>(`/friends/requests/${relationship.requestId}`));
  const remove = () => {
    if (!window.confirm(`¿Quitar a @${username} de tus amigos?`)) return;
    run(() => apiService.delete<Relationship>(`/friends/${userId}`));
  };

  const icon = (Icon: typeof Check) => busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />;

  switch (relationship.status) {
    case 'NONE':
      return <button onClick={send} disabled={busy} className={primary}>{icon(UserPlus)} Añadir amigo</button>;

    case 'REQUEST_SENT':
      return (
        <button onClick={deleteRequest} disabled={busy} className={secondary} title="Pulsa para cancelar la solicitud">
          {icon(Clock)} Solicitud enviada
        </button>
      );

    case 'REQUEST_RECEIVED':
      return (
        <div className="flex items-center gap-2">
          <button onClick={accept} disabled={busy} className={primary}>{icon(Check)} Aceptar solicitud</button>
          <button onClick={deleteRequest} disabled={busy} className={secondary}>{icon(X)} Rechazar</button>
        </div>
      );

    case 'FRIENDS':
      return (
        <button onClick={remove} disabled={busy} className={secondary} title="Pulsa para dejar de ser amigos">
          {icon(UserCheck)} Amigos
        </button>
      );
  }
};

export default FriendButton;
