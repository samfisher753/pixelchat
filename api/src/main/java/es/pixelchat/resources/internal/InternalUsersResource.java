package es.pixelchat.resources.internal;

import es.pixelchat.filters.InternalOnly;
import es.pixelchat.responses.UserLoginDto;
import es.pixelchat.services.UsersService;
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
@Path("/internal/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalUsersResource {

    @Inject
    UsersService usersService;

    @GET
    @Path("/{id}")
    public Response getUser(@PathParam("id") UUID id) {
        UserLoginDto user = usersService.findById(id);
        return Response.ok(user).build();
    }
}
