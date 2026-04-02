package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;

@RegisterForReflection
public class RefreshTokenRequest {

    @NotBlank(message = "El refresh token es obligatorio")
    public String refreshToken;
}
