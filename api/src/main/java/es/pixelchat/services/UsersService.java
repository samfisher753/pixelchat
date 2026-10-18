package es.pixelchat.services;

import es.pixelchat.entities.User;
import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.mappers.UserMapper;
import es.pixelchat.requests.ProfileImageUploadRequest;
import es.pixelchat.requests.UpdateProfileRequest;
import es.pixelchat.responses.ProfileImageUploadResponse;
import es.pixelchat.responses.UserLoginDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class UsersService {

    private static final Logger LOG = Logger.getLogger(UsersService.class);
    private static final Duration IMAGE_UPLOAD_VALIDITY = Duration.ofMinutes(10);
    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    @Inject
    UserMapper userMapper;

    @Inject
    ObjectStorageService storage;

    @ConfigProperty(name = "oci.public-bucket")
    String publicBucket;

    public UserLoginDto findById(UUID id) {
        User user = User.findById(id);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        return userMapper.toLoginDto(user);
    }

    @Transactional
    public UserLoginDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        if (request.username != null) {
            if (!request.username.equalsIgnoreCase(user.username) && User.existsByUsername(request.username)) {
                throw new ApiException(ApiError.USERNAME_IN_USE);
            }
            user.username = request.username;
        }

        // Campos opcionales: null → no actualizar, string vacío → borrar el valor
        if (request.displayName != null) {
            user.displayName = request.displayName.isBlank() ? null : request.displayName;
        }
        if (request.motto != null) {
            user.motto = request.motto.isBlank() ? null : request.motto;
        }
        if (request.location != null) {
            user.location = request.location.isBlank() ? null : request.location;
        }
        if (request.website != null) {
            user.website = request.website.isBlank() ? null : request.website;
        }
        if (request.look != null) {
            user.look = request.look.isBlank() ? null : request.look;
        }
        if (request.avatarUrl != null) {
            user.avatarUrl = replaceImage(user, "avatar", user.avatarUrl, request.avatarUrl);
        }
        if (request.headerUrl != null) {
            user.headerUrl = replaceImage(user, "header", user.headerUrl, request.headerUrl);
        }

        return userMapper.toLoginDto(user);
    }

    // -------------------------------------------------------------------------
    // Fotos de perfil y cabecera
    // -------------------------------------------------------------------------

    /**
     * Prepara la subida de una imagen: decide su nombre y devuelve una PAR de escritura de corta
     * duración y la URL pública donde quedará. El perfil no cambia hasta que el front guarda esa URL.
     */
    public ProfileImageUploadResponse createProfileImageUpload(UUID userId, ProfileImageUploadRequest request) {
        String objectName = "user-" + userId + "-" + request.type + "-" + UUID.randomUUID()
                + "." + IMAGE_EXTENSIONS.get(request.contentType);
        return ProfileImageUploadResponse.builder()
                .uploadUrl(storage.createWriteUrl(publicBucket, objectName, IMAGE_UPLOAD_VALIDITY))
                .publicUrl(storage.publicUrl(publicBucket, objectName))
                .build();
    }

    /**
     * Cambia una imagen del perfil. Solo se aceptan imágenes de nuestro bucket subidas por el propio
     * usuario y del tipo correcto. Si había otra imagen, se borra de OCI. Vacío → quitar la imagen.
     */
    private String replaceImage(User user, String type, String current, String requested) {
        String next = requested.isBlank() ? null : requested;
        if (next != null && !isOwnImage(user.id, type, next)) {
            throw new ApiException(ApiError.INVALID_IMAGE_URL);
        }
        if (current != null && !current.equals(next)) {
            deleteImageQuietly(user.id, type, current);
        }
        return next;
    }

    private String ownImagePrefix(UUID userId, String type) {
        return storage.publicUrlPrefix(publicBucket) + "user-" + userId + "-" + type + "-";
    }

    private boolean isOwnImage(UUID userId, String type, String url) {
        String prefix = ownImagePrefix(userId, type);
        return url.startsWith(prefix) && url.substring(prefix.length()).matches("[0-9a-f-]{36}\\.(jpg|png|webp)");
    }

    // Si no se puede borrar la imagen antigua, el cambio de perfil sigue adelante: solo queda un archivo huérfano
    private void deleteImageQuietly(UUID userId, String type, String url) {
        try {
            if (!isOwnImage(userId, type, url)) return;
            String objectName = url.substring(storage.publicUrlPrefix(publicBucket).length());
            storage.deleteObject(publicBucket, objectName);
        } catch (Exception e) {
            LOG.warnf("No se pudo borrar la imagen anterior %s", url);
        }
    }
}
