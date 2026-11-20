// Si un amigo está conectado y en qué sala (lo envía world: ver presenceOf en Server.ts)
export type FriendPresence = {
  id: string;
  online: boolean;
  room: string | null;
};
