package es.pixelchat.resources.internal;

import es.pixelchat.filters.InternalOnly;
import es.pixelchat.services.FriendsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.UUID;

@InternalOnly
@Path("/internal/friends")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalFriendsResource {

    @Inject
    FriendsService friendsService;

    /** Los ids de los amigos de un usuario, para que world sepa a quién avisar cuando se conecta. */
    @GET
    @Path("/{userId}")
    public Response friendIds(@PathParam("userId") UUID userId) {
        return Response.ok(friendsService.friendIds(userId)).build();
    }
}
