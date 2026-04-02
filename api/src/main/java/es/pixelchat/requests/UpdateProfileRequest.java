package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RegisterForReflection
public class UpdateProfileRequest {

    @Size(min = 1, max = 15, message = "El nombre de usuario debe tener entre 1 y 15 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "El nombre de usuario solo puede contener letras, números y guiones bajos")
    public String username;

    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    public String displayName;

    @Size(max = 50, message = "El motto no puede superar los 50 caracteres")
    public String motto;

    @Size(max = 100, message = "La ubicación no puede superar los 100 caracteres")
    public String location;

    @Size(max = 255, message = "La web no puede superar los 255 caracteres")
    public String website;

    @Size(max = 255, message = "El look no puede superar los 255 caracteres")
    public String look;
}
