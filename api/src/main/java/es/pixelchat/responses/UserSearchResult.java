package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/** Un usuario en los resultados del buscador: solo datos públicos (nunca el email). */
@Getter
@Builder
@RegisterForReflection
public class UserSearchResult {
    private final UUID id;
    private final String username;
    private final String displayName;
    private final String avatarUrl;
}
