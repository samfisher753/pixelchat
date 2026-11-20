package es.pixelchat.events;

import es.pixelchat.enums.FriendshipEvent;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.UUID;

/**
 * Ha cambiado la relación entre dos usuarios. `from` es quien lo ha hecho (su nombre va incluido para
 * que world pueda mostrar el aviso sin pedirlo) y `to`, el otro. Se envía tal cual a world.
 */
@RegisterForReflection
public record FriendshipChanged(FriendshipEvent type, UUID fromId, String fromUsername, UUID toId) {
}
