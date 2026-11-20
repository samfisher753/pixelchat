// Aviso de world de que ha cambiado una amistad tuya (viene de la api: ver FriendshipChanged).
// `from` es quien lo ha hecho y `to`, el otro.
export type FriendshipChanged = {
  type: 'REQUEST_SENT' | 'REQUEST_ACCEPTED' | 'REQUEST_DELETED' | 'FRIEND_REMOVED';
  fromId: string;
  fromUsername: string;
  toId: string;
};
