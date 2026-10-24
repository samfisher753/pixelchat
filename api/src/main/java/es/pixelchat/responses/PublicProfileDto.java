package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Perfil de otro usuario: solo lo que puede ver cualquiera. La ubicación y la web son solo para
 * amigos, así que no se incluyen (cuando existan los amigos, se añadirán si el que pregunta lo es).
 * Se filtra aquí y no en el front para que los datos privados nunca lleguen al navegador.
 */
@Getter
@Builder
@RegisterForReflection
public class PublicProfileDto {
    private final UUID id;
    private final String username;
    private final String displayName;
    private final String avatarUrl;
    private final String headerUrl;
    private final String motto;
    private final String look;
    private final Instant createdAt;
}
