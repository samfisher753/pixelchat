package es.pixelchat.resources;

import es.pixelchat.requests.FriendRequestCreateRequest;
import es.pixelchat.services.FriendsService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.UUID;

/** Solicitudes de amistad y amistades. Cada operación devuelve cómo queda la relación (RelationshipDto). */
@Path("/friends")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class FriendsResource {

    @Inject
    FriendsService friendsService;

    @Inject
    JsonWebToken jwt;

    /** Envía una solicitud de amistad: POST /friends/requests { "userId": "..." }. */
    @POST
    @Path("/requests")
    public Response sendRequest(@Valid FriendRequestCreateRequest request) {
        return Response.ok(friendsService.sendRequest(me(), request.userId)).build();
    }

    @POST
    @Path("/requests/{id}/accept")
    public Response acceptRequest(@PathParam("id") UUID requestId) {
        return Response.ok(friendsService.acceptRequest(me(), requestId)).build();
    }

    /** Rechaza una solicitud recibida o cancela una enviada. */
    @DELETE
    @Path("/requests/{id}")
    public Response deleteRequest(@PathParam("id") UUID requestId) {
        return Response.ok(friendsService.deleteRequest(me(), requestId)).build();
    }

    /** Deja de ser amigo de alguien. */
    @DELETE
    @Path("/{userId}")
    public Response removeFriend(@PathParam("userId") UUID friendId) {
        return Response.ok(friendsService.removeFriend(me(), friendId)).build();
    }

    private UUID me() {
        return UUID.fromString(jwt.getSubject());
    }
}
