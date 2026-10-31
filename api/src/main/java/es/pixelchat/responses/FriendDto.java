package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/** Un amigo en tu lista: sus datos públicos y desde cuándo sois amigos. */
@Getter
@Builder
@RegisterForReflection
public class FriendDto {
    private final UUID id;
    private final String username;
    private final String displayName;
    private final String avatarUrl;
    private final Instant since;
}
