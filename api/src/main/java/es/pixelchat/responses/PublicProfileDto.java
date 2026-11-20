package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Perfil de otro usuario. La ubicación y la web son solo para sus amigos: a los demás se les envían
 * vacías. Se filtra aquí y no en el front para que los datos privados nunca lleguen al navegador.
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
    // Solo si sois amigos
    private final String location;
    private final String website;
    // Tu relación con este usuario (para el botón de amistad)
    private final RelationshipDto relationship;
}
