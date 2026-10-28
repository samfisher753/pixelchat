package es.pixelchat.enums;

/** Cómo se relaciona el usuario que pregunta con otro (para el botón de su perfil). */
public enum Relationship {
    NONE,
    REQUEST_SENT,       // le has enviado una solicitud
    REQUEST_RECEIVED,   // te ha enviado una solicitud
    FRIENDS
}
