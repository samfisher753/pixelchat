package es.pixelchat.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Por id y no por nombre de usuario: el nombre se puede cambiar (y otro usuario podría quedarse con
// el antiguo), el id no. Así la solicitud siempre llega a quien querías.
@RegisterForReflection
public class FriendRequestCreateRequest {

    @NotNull(message = "Falta el usuario")
    public UUID userId;
}
