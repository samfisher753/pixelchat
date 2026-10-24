package es.pixelchat.services;

import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.requests.ChatFileUploadRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChatFilesServiceTest {

    private ChatFilesService service;

    @BeforeEach
    void setUp() {
        service = new ChatFilesService();
        service.chatBucket = "pixelchat-files";
        service.maxFileBytes = 1000;
        // Almacenamiento falso: devuelve URLs sin llamar a OCI
        service.storage = new ObjectStorageService() {
            @Override
            public String createWriteUrl(String bucket, String objectName, Duration validFor) {
                return "https://oci/write/" + objectName;
            }

            @Override
            public String createReadUrl(String bucket, String objectName, Duration validFor) {
                return "https://oci/read/" + objectName;
            }
        };
    }

    private ChatFileUploadRequest request(String name, long size) {
        ChatFileUploadRequest r = new ChatFileUploadRequest();
        r.fileName = name;
        r.contentType = "image/jpeg";
        r.size = size;
        return r;
    }

    @Test
    void sanitizesNamesAndKeepsTheExtension() {
        assertEquals("Mi_foto__1_.jpg", ChatFilesService.sanitize("Mi foto (1).jpg"));
        assertEquals("archivo", ChatFilesService.sanitize("¿¿??"));
        assertEquals("passwd", ChatFilesService.sanitize("../../passwd"));
        String longName = ChatFilesService.sanitize("a".repeat(200) + ".mp4");
        assertEquals(80, longName.length());
        assertTrue(longName.endsWith(".mp4"));
    }

    @Test
    void namesTheObjectWithTheUploaderId() {
        UUID user = UUID.randomUUID();
        var upload = service.createUpload(user, request("foto.jpg", 10));
        assertTrue(upload.getObjectName().startsWith("chat-" + user + "-"));
        assertTrue(upload.getObjectName().endsWith("-foto.jpg"));
        assertEquals("https://oci/write/" + upload.getObjectName(), upload.getUploadUrl());
    }

    @Test
    void rejectsFilesOverTheLimit() {
        ApiException e = assertThrows(ApiException.class, () -> service.createUpload(UUID.randomUUID(), request("video.mp4", 1001)));
        assertEquals(ApiError.CHAT_FILE_TOO_LARGE, e.getError());
    }

    @Test
    void onlyTheUploaderCanGetAReadUrl() {
        UUID owner = UUID.randomUUID();
        String objectName = service.createUpload(owner, request("foto.jpg", 10)).getObjectName();

        assertEquals("https://oci/read/" + objectName, service.createReadUrl(owner, objectName));

        ApiException other = assertThrows(ApiException.class, () -> service.createReadUrl(UUID.randomUUID(), objectName));
        assertEquals(ApiError.CHAT_FILE_NOT_ALLOWED, other.getError());
        assertThrows(ApiException.class, () -> service.createReadUrl(owner, "otro-archivo.jpg"));
        assertThrows(ApiException.class, () -> service.createReadUrl(owner, null));
        assertThrows(ApiException.class, () -> service.createReadUrl(null, objectName));
    }
}
