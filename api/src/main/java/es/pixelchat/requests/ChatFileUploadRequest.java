package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@RegisterForReflection
public class ChatFileUploadRequest {

    @NotBlank(message = "Falta el nombre del archivo")
    @Size(max = 255, message = "El nombre del archivo es demasiado largo")
    public String fileName;

    // Mismos tipos que admite el chat del front
    @NotBlank(message = "Falta el tipo del archivo")
    @Pattern(regexp = "(image|video|audio)/[A-Za-z0-9.+-]+", message = "Tipo de archivo no admitido")
    public String contentType;

    @Positive(message = "El archivo está vacío")
    public long size;
}
