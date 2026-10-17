package es.pixelchat.requests;

/**
 * Formato de la cadena de aspecto de los avatares (campo look). La genera el configurador del
 * front (front/src/models/others/avatar/Look.ts) y todos los navegadores la interpretan para
 * dibujar el avatar, así que solo se aceptan piezas y colores conocidos. Por ejemplo:
 * hd-ecb98f.hr-corto-4a2e1b.ha-no.ch-corta-logo-022f72.lg-largo-2a2d36.sh-f4f4f4.fc-normal.ac-no
 */
public final class LookFormat {

    private static final String COLOR = "[0-9a-f]{6}";

    public static final String REGEX =
            "hd-" + COLOR
            + "\\.hr-(corto|largo|coleta|cresta|rapado)-" + COLOR
            + "\\.ha-(no|(gorra|gorro)-" + COLOR + ")"
            + "\\.ch-(corta|larga)-(liso|rayas|logo)-" + COLOR
            + "\\.lg-(largo|corto)-" + COLOR
            + "\\.sh-" + COLOR
            + "\\.fc-(normal|feliz|guino|sorpresa|triste|enfadado)"
            + "\\.ac-(no|(mochila|bufanda)-" + COLOR + ")";

    /** Igual que REGEX pero acepta también la cadena vacía (para borrar el aspecto). */
    public static final String REGEX_OR_EMPTY = "(" + REGEX + ")?";

    private LookFormat() {
    }
}
