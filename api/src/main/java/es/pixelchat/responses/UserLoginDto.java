package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@RegisterForReflection
public class UserLoginDto {
    private final UUID id;
    private final String username;
    private final String displayName;
    private final String look;
    private final String motto;
    private final String avatarUrl;
    private final String location;
    private final String website;
    private final Instant createdAt;
    private final boolean demo;
}
