package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@RegisterForReflection
public class ProfileImageUploadResponse {
    // PAR de escritura: el navegador sube la imagen con un PUT a esta URL
    private final String uploadUrl;
    // Dónde quedará la imagen; es lo que luego se guarda en el perfil
    private final String publicUrl;
}
