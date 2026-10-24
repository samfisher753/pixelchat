package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@RegisterForReflection
public class ChatFileUploadResponse {
    // Nombre del archivo en el bucket; el front se lo manda a world para anunciarlo en la sala
    private final String objectName;
    // PAR de escritura: el navegador sube el archivo con un PUT a esta URL
    private final String uploadUrl;
}
