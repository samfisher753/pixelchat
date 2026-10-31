package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/** Una solicitud pendiente: su id (para aceptarla, rechazarla o cancelarla) y el otro usuario. */
@Getter
@Builder
@RegisterForReflection
public class FriendRequestDto {
    private final UUID requestId;
    private final UUID userId;
    private final String username;
    private final String displayName;
    private final String avatarUrl;
    private final Instant createdAt;
}
