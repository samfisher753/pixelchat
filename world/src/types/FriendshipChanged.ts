// Lo que envía la api cuando cambia una amistad (ver FriendshipChanged en la api).
// `from` es quien lo ha hecho y `to`, el otro.
export interface FriendshipChanged {
    type: 'REQUEST_SENT' | 'REQUEST_ACCEPTED' | 'REQUEST_DELETED' | 'FRIEND_REMOVED';
    fromId: string;
    fromUsername: string;
    toId: string;
}
