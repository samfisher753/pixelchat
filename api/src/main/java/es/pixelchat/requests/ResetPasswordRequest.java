package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RegisterForReflection
public class ResetPasswordRequest {

    @NotBlank(message = "El código es obligatorio")
    public String code;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 128, message = "La contraseña debe tener entre 8 y 128 caracteres")
    public String newPassword;
}
