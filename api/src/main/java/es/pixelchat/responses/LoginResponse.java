package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@RegisterForReflection
public class LoginResponse {
    private final String accessToken;
    private final String refreshToken;
    private final UserLoginDto user;
}
