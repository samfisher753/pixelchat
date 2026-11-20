package es.pixelchat.enums;

/** Qué ha pasado con una amistad (se le cuenta a world para avisar en tiempo real). */
public enum FriendshipEvent {
    REQUEST_SENT,       // `from` le ha enviado una solicitud a `to`
    REQUEST_ACCEPTED,   // `from` ha aceptado la solicitud de `to`: ya son amigos
    REQUEST_DELETED,    // `from` ha rechazado o cancelado la solicitud entre los dos
    FRIEND_REMOVED      // `from` ha dejado de ser amigo de `to`
}
