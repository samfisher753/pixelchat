package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RegisterForReflection
public class LoginRequest {

    @NotBlank(message = "El usuario es obligatorio")
    @Size(max = 255, message = "El usuario no puede superar los 255 caracteres")
    public String user;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(max = 128, message = "La contraseña no puede superar los 128 caracteres")
    public String password;
}
