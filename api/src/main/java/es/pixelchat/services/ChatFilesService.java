package es.pixelchat.services;

import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.requests.ChatFileUploadRequest;
import es.pixelchat.responses.ChatFileUploadResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Archivos que se mandan por el chat (imágenes, audio y vídeo), en el bucket privado del chat.
 *
 * El nombre del objeto lo decide la api e incluye quién lo subió:
 *   chat-<id del usuario>-<id aleatorio>-<nombre original saneado>
 * Así nadie puede sobrescribir archivos ajenos (no elige el nombre) ni pedir enlaces de lectura de
 * archivos que no ha subido (world comprueba que el nombre empieza por el id de quien lo anuncia).
 */
@ApplicationScoped
public class ChatFilesService {

    private static final Duration UPLOAD_URL_VALIDITY = Duration.ofMinutes(15);
    // El chat muestra los archivos directamente desde este enlace: tiene que durar toda la sesión
    private static final Duration READ_URL_VALIDITY = Duration.ofHours(24);
    private static final int MAX_NAME_LENGTH = 80;
    private static final String UUID_RE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    private static final Pattern OBJECT_NAME = Pattern.compile("^chat-(" + UUID_RE + ")-" + UUID_RE + "-([A-Za-z0-9._-]{1," + MAX_NAME_LENGTH + "})$");

    @Inject
    ObjectStorageService storage;

    @ConfigProperty(name = "oci.chat-bucket")
    String chatBucket;

    @ConfigProperty(name = "chat.max-file-bytes")
    long maxFileBytes;

    /** Decide el nombre del archivo y devuelve una PAR de escritura para subirlo. */
    public ChatFileUploadResponse createUpload(UUID userId, ChatFileUploadRequest request) {
        if (request.size > maxFileBytes) {
            throw new ApiException(ApiError.CHAT_FILE_TOO_LARGE);
        }
        String objectName = "chat-" + userId + "-" + UUID.randomUUID() + "-" + sanitize(request.fileName);
        return ChatFileUploadResponse.builder()
                .objectName(objectName)
                .uploadUrl(storage.createWriteUrl(chatBucket, objectName, UPLOAD_URL_VALIDITY))
                .build();
    }

    /** Enlace de lectura temporal para repartirlo a la sala. Solo para archivos subidos por ese usuario. */
    public String createReadUrl(UUID userId, String objectName) {
        Matcher m = OBJECT_NAME.matcher(objectName == null ? "" : objectName);
        if (userId == null || !m.matches() || !m.group(1).equals(userId.toString())) {
            throw new ApiException(ApiError.CHAT_FILE_NOT_ALLOWED);
        }
        return storage.createReadUrl(chatBucket, objectName, READ_URL_VALIDITY);
    }

    /** Nombre original sin caracteres raros (se conserva la extensión para que se descargue bien). */
    static String sanitize(String fileName) {
        String clean = fileName == null ? "" : fileName.replaceAll("[^A-Za-z0-9._-]", "_");
        clean = clean.replaceAll("^[._-]+", "");
        if (clean.isEmpty()) clean = "archivo";
        if (clean.length() > MAX_NAME_LENGTH) {
            int dot = clean.lastIndexOf('.');
            String ext = dot > 0 && clean.length() - dot <= 10 ? clean.substring(dot) : "";
            clean = clean.substring(0, MAX_NAME_LENGTH - ext.length()) + ext;
        }
        return clean;
    }
}
