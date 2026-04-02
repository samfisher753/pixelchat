package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@RegisterForReflection
public class RefreshTokenResponse {
    private final String accessToken;
    private final String refreshToken;
}
