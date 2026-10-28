package es.pixelchat.responses;

import es.pixelchat.enums.Relationship;
import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/** Tu relación con otro usuario y, si hay una solicitud de por medio, su id (para aceptarla o cancelarla). */
@Getter
@Builder
@RegisterForReflection
public class RelationshipDto {
    private final Relationship status;
    private final UUID requestId;
}
