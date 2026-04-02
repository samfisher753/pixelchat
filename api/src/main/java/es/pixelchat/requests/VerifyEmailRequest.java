package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;

@RegisterForReflection
public class VerifyEmailRequest {

    @NotBlank(message = "El token es obligatorio")
    public String token;
}
