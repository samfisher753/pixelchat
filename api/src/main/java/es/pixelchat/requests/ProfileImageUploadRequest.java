package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@RegisterForReflection
public class ProfileImageUploadRequest {

    @NotNull(message = "Falta el tipo de imagen")
    @Pattern(regexp = "avatar|header", message = "El tipo de imagen debe ser avatar o header")
    public String type;

    @NotNull(message = "Falta el formato de la imagen")
    @Pattern(regexp = "image/(jpeg|png|webp)", message = "Formato de imagen no admitido")
    public String contentType;
}
