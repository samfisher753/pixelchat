package es.pixelchat.responses;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Tus solicitudes pendientes, las más nuevas primero. */
@Getter
@Builder
@RegisterForReflection
public class FriendRequestsDto {
    private final List<FriendRequestDto> received;
    private final List<FriendRequestDto> sent;
}
