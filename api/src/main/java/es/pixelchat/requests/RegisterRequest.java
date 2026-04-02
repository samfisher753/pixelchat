package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RegisterForReflection
public class RegisterRequest {

    @Email(message = "El email no tiene un formato válido")
    @NotBlank(message = "El email es obligatorio")
    public String email;

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 1, max = 15, message = "El nombre de usuario debe tener entre 1 y 15 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "El nombre de usuario solo puede contener letras, números y guiones bajos")
    public String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 128, message = "La contraseña debe tener entre 8 y 128 caracteres")
    public String password;

    @Size(max = 255)
    public String look;
}
